/* ─────────────────────────────────────────────────────────────────
   POST /api/order — places an order. Takes no money.

   This is the whole commerce path for now. There is no gateway wired
   up, and rather than let every Pay end in red text, an order is
   RECORDED and the customer is told plainly that nothing has been
   charged and that we will call to arrange payment.

   THE SEAM. `method` decides what comes back:
     "invoice"     (today)  → { ref, total } and the browser goes
                              straight to the receipt.
     "sslcommerz"  (later)  → { redirect } and the browser jumps to
                              the gateway instead.
   The front end already handles both, so turning the gateway on is a
   change in here and nowhere else. The gateway code is parked, intact,
   under api/_later/ — Vercel does not route a path segment that starts
   with an underscore, so it is out of the way without being lost.

   THE CART IS NOT TRUSTED. The browser sends codes, sizes and
   quantities. Every price is looked up here and the total is added up
   here. A client that posts {"price": 1} is billed the real figure,
   because its number is never read. That has to stay true whoever is
   taking the money.

   Environment (Vercel → Settings → Environment Variables):
     RESEND_API_KEY   so the order reaches a human. Optional: without
                      it the order still succeeds and the miss is
                      logged loudly, because a customer must never be
                      shown a failure for our missing plumbing.
     ORDER_INBOX      where orders land. Defaults to RECEIPT_FROM.
   ───────────────────────────────────────────────────────────── */

const MAX_LINES = 40;
const MAX_QTY   = 20;

function origin(req) {
  const host  = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return proto + '://' + host;
}

function bad(res, code, msg) {
  res.status(code).json({ error: msg });
  return null;
}

function money(n) {
  return '৳ ' + Number(n).toLocaleString('en-US');
}

/* The same floors the form sets, checked again here because the form is
   only a suggestion — a cart can be posted straight at this endpoint.
   An address nobody can deliver to and a phone nobody can ring are not
   a smaller problem than a wrong price. */
const WANT = {
  name:    { min: 2, say: 'Please give your full name.' },
  email:   { min: 5, re: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, say: 'That email address does not look right.' },
  phone:   { min: 7, digits: 7, say: 'A phone number we can reach you on — at least seven digits.' },
  address: { min: 6, say: 'A full street address, so this can actually be delivered.' },
  city:    { min: 2, say: 'Which city?' }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 405, 'POST only');

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return bad(res, 400, 'Bad request.'); }
  }

  const cart     = (body && Array.isArray(body.cart)) ? body.cart : null;
  const customer = (body && body.customer) || {};
  const method   = (body && body.method) || 'invoice';

  if (!cart || !cart.length) return bad(res, 400, 'Your bag is empty.');
  if (cart.length > MAX_LINES) return bad(res, 400, 'Too many lines.');

  for (const [f, rule] of Object.entries(WANT)) {
    const v = String(customer[f] == null ? '' : customer[f]).trim();
    if (v.length < rule.min) return bad(res, 400, rule.say);
    if (rule.re && !rule.re.test(v)) return bad(res, 400, rule.say);
    if (rule.digits && (v.match(/\d/g) || []).length < rule.digits) return bad(res, 400, rule.say);
  }

  /* The catalogue is the source of truth, read from this same
     deployment so it can never drift from what the site is showing. */
  let data;
  try {
    const r = await fetch(origin(req) + '/assets/data/products.json');
    if (!r.ok) throw new Error('catalogue ' + r.status);
    data = await r.json();
  } catch (e) {
    console.error('[order] catalogue unreadable', e);
    return bad(res, 502, 'We could not read the catalogue just now. Try again in a moment.');
  }

  const byCode = new Map((data.pieces || []).map(p => [p.code, p]));

  let total = 0;
  const lines = [];
  for (const raw of cart) {
    const piece = byCode.get(String(raw && raw.code));
    if (!piece) return bad(res, 400, 'That piece is no longer available.');

    const size = (piece.sizes || []).find(s => s.label === String(raw.size));
    if (!size) return bad(res, 400, 'That size is no longer available.');
    if (size.stock === 0) return bad(res, 409, piece.name + ' is sold out in ' + size.label + '.');

    const qty = Math.floor(Number(raw.qty));
    if (!(qty >= 1 && qty <= MAX_QTY)) return bad(res, 400, 'Check the quantities in your bag.');
    if (typeof size.stock === 'number' && qty > size.stock) {
      return bad(res, 409, 'Only ' + size.stock + ' left of ' + piece.name + ' in ' + size.label + '.');
    }

    const price = Number(piece.price);
    if (!isFinite(price) || price <= 0) return bad(res, 409, 'This piece is not on sale yet.');

    total += price * qty;
    lines.push({ code: piece.code, name: piece.name, size: size.label, qty: qty, price: price });
  }
  if (!(total > 0)) return bad(res, 400, 'Nothing to pay for.');

  const ref = 'ZS' + Date.now().toString(36).toUpperCase() +
              Math.random().toString(36).slice(2, 5).toUpperCase();

  /* ── the seam ──────────────────────────────────────────────────── */
  if (method === 'sslcommerz') {
    /* Not wired up. Said once, here, rather than letting the front end
       guess: the browser shows the sentence it is given. */
    console.error('[order] sslcommerz requested but the gateway is parked in api/_later/');
    return bad(res, 501, 'Card payment is not open yet. Choose to be invoiced instead.');
  }

  /* An order that reaches the customer but not our inbox is a problem
     we can fix by hand from the reference. An order that fails in front
     of the customer because our mail key is missing is one we cannot.
     So: the order stands whatever the mail does. */
  let delivered = false;
  try {
    delivered = await tell({ ref, lines, total, customer, origin: origin(req) });
  } catch (e) {
    console.error('[order] notification failed for ' + ref, e);
  }
  if (!delivered) {
    console.error('[order] NOT EMAILED — record this by hand: ' + ref + ' ' +
      JSON.stringify({ total, lines, customer }));
  }

  return res.status(200).json({ ref: ref, total: total, method: 'invoice' });
};

/* ── notification ───────────────────────────────────────────────── */
async function tell(order) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('[order] RESEND_API_KEY is not set'); return false; }

  const from  = process.env.RECEIPT_FROM || 'ZinStim <orders@zinstim.com>';
  const inbox = process.env.ORDER_INBOX || from.replace(/^.*<|>.*$/g, '');

  const rows = order.lines.map(l =>
    l.code + ' ' + l.name + ' / ' + l.size + ' x' + l.qty + '  ' + money(l.price * l.qty)
  ).join('\n');

  const to = [order.customer.address, order.customer.city, order.customer.postcode]
    .filter(Boolean).join(', ');

  const mine =
    'Order ' + order.ref + '\n\n' + rows +
    '\n\nTotal ' + money(order.total) +
    '\n\n' + order.customer.name +
    '\n' + order.customer.email +
    '\n' + order.customer.phone +
    '\n' + to +
    '\n\nNothing has been charged. Ring them to arrange payment.\n';

  const theirs =
    'Order received — ' + order.ref + '\n\n' +
    rows + '\n\nTotal ' + money(order.total) +
    '\n\nNothing has been charged yet. We will call you on ' + order.customer.phone +
    ' to confirm and arrange payment before anything ships.\n\n' +
    'Delivering to ' + to + '\n\n— ZinStim\n';

  const send = (toAddr, subject, text) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [toAddr], subject, text })
  }).then(r => r.ok || Promise.reject(new Error('resend ' + r.status)));

  const out = await Promise.allSettled([
    send(inbox, 'Order ' + order.ref + ' — ' + money(order.total), mine),
    send(order.customer.email, 'Your ZinStim order ' + order.ref, theirs)
  ]);
  out.forEach((r, i) => {
    if (r.status === 'rejected') console.error('[order] mail ' + (i ? 'to customer' : 'to inbox') + ' failed', r.reason);
  });
  /* the customer's copy is the one that matters to them */
  return out[1].status === 'fulfilled';
}
