/* ─────────────────────────────────────────────────────────────────
   POST /api/checkout — opens an SSLCommerz session and hands back
   the gateway URL for the browser to jump to.

   This is the first thing in this repo that is not static, and it
   exists for one reason: the store password cannot live in
   assets/js/. Anything served to the browser is readable by anyone
   who opens devtools, and a leaked store password lets a stranger
   create sessions against the merchant account.

   THE CART IS NOT TRUSTED. The browser sends codes, sizes and
   quantities; every price is looked up here and the total is added
   up here. A client that posts {"price": 1} gets charged the real
   figure, because its number is never read.

   Environment (Vercel → Settings → Environment Variables):
     SSLCZ_STORE_ID      store id from the SSLCommerz panel
     SSLCZ_STORE_PASSWD  store password  — secret, never NEXT_PUBLIC_
     SSLCZ_SANDBOX       "1" while testing, unset or "0" when live
   ───────────────────────────────────────────────────────────── */

const LIVE    = 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';
const SANDBOX = 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 405, 'POST only');

  const id   = process.env.SSLCZ_STORE_ID;
  const pass = process.env.SSLCZ_STORE_PASSWD;
  if (!id || !pass) {
    /* The log says what is actually wrong. The shopper gets a sentence
       that does not publish the state of our plumbing — "not
       configured yet" tells a stranger the shop has never taken a
       payment. */
    console.error('[checkout] gateway credentials are not set');
    return bad(res, 503, 'Checkout is unavailable right now. Please try again shortly.');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return bad(res, 400, 'Bad request.'); }
  }
  const cart     = (body && Array.isArray(body.cart)) ? body.cart : null;
  const customer = (body && body.customer) || {};
  if (!cart || !cart.length) return bad(res, 400, 'Your bag is empty.');
  if (cart.length > MAX_LINES) return bad(res, 400, 'Too many lines.');

  /* The same floors the form sets, checked again here because the form
     is only a suggestion — a cart can be posted straight at this
     endpoint. An address nobody can deliver to and a phone nobody can
     ring are not a smaller problem than a wrong price. */
  const WANT = {
    name:    { min: 2, say: 'Please give your full name.' },
    email:   { min: 5, re: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, say: 'That email address does not look right.' },
    phone:   { min: 7, digits: 7, say: 'A phone number we can reach you on.' },
    address: { min: 6, say: 'A full street address, so this can actually be delivered.' },
    city:    { min: 2, say: 'Which city?' }
  };
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
    return bad(res, 502, 'Could not read the catalogue.');
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
    lines.push(piece.code + ' ' + piece.name + ' / ' + size.label + ' x' + qty);
  }
  if (!(total > 0)) return bad(res, 400, 'Nothing to pay for.');

  const tran = 'ZS' + Date.now().toString(36).toUpperCase() +
               Math.random().toString(36).slice(2, 7).toUpperCase();
  const base = origin(req);

  const form = new URLSearchParams({
    store_id: id,
    store_passwd: pass,
    total_amount: total.toFixed(2),
    currency: 'BDT',
    tran_id: tran,
    success_url: base + '/api/confirm',
    fail_url:    base + '/order.html?state=fail',
    cancel_url:  base + '/order.html?state=cancel',
    ipn_url:     base + '/api/confirm',
    product_name: lines.join(', ').slice(0, 250),
    product_category: 'Apparel',
    product_profile: 'physical-goods',
    shipping_method: 'Courier',
    num_of_item: String(cart.length),
    cus_name:  String(customer.name).slice(0, 100),
    cus_email: String(customer.email).slice(0, 100),
    cus_phone: String(customer.phone).slice(0, 20),
    cus_add1:  String(customer.address).slice(0, 200),
    cus_city:  String(customer.city).slice(0, 50),
    cus_country: 'Bangladesh',
    ship_name: String(customer.name).slice(0, 100),
    ship_add1: String(customer.address).slice(0, 200),
    ship_city: String(customer.city).slice(0, 50),
    ship_country: 'Bangladesh',
    ship_postcode: String(customer.postcode || '0000').slice(0, 20),

    /* SSLCommerz hands value_a..value_d back untouched on the return
       and the IPN. There is no order store yet, so this is how the
       receipt email knows what was bought — without it /api/confirm
       would have a reference number and nothing else. */
    value_a: String(customer.email).slice(0, 180),
    value_b: String(customer.name).slice(0, 180),
    value_c: lines.join(' | ').slice(0, 240),
    value_d: [customer.address, customer.city, customer.postcode]
               .filter(Boolean).join(', ').slice(0, 240)
  });

  try {
    const r = await fetch(process.env.SSLCZ_SANDBOX === '1' ? SANDBOX : LIVE, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form
    });
    const out = await r.json();
    if (out.status !== 'SUCCESS' || !out.GatewayPageURL) {
      /* SSLCommerz puts the reason in failedreason; it is for the log,
         not for the shopper. */
      console.error('[checkout] gateway refused', out.status, out.failedreason);
      return bad(res, 502, 'The payment gateway did not accept that. Try again in a moment.');
    }
    return res.status(200).json({ url: out.GatewayPageURL, tran_id: tran, amount: total });
  } catch (e) {
    console.error('[checkout]', e);
    return bad(res, 502, 'Could not reach the payment gateway.');
  }
};
