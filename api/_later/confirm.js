/* ─────────────────────────────────────────────────────────────────
   POST /api/confirm — where SSLCommerz sends the shopper back, and
   where it posts its IPN.

   The POST that lands here is NOT proof of payment. Anyone can post
   to this URL. The only thing that settles it is calling the
   validator API back with the val_id and reading the status, which
   is what this does before it tells anybody the order went through.

   KNOWN GAP: there is no order store yet, so this confirms that a
   payment is genuine and that its amount matches what the gateway
   recorded — it cannot reconcile that against an order of ours,
   because we do not write one down. Until there is somewhere to
   record orders, treat the SSLCommerz dashboard as the ledger. See
   the decision log.
   ───────────────────────────────────────────────────────────── */

const { sendReceipt } = require('./receipt-mail.js');

const LIVE    = 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';
const SANDBOX = 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

function readBody(req) {
  return new Promise(resolve => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      const out = {};
      try {
        new URLSearchParams(raw).forEach((v, k) => { out[k] = v; });
      } catch (e) { /* leave empty */ }
      resolve(out);
    });
    req.on('error', () => resolve({}));
  });
}

function land(res, state, tran) {
  const q = '?state=' + encodeURIComponent(state) + (tran ? '&ref=' + encodeURIComponent(tran) : '');
  res.writeHead(303, { Location: '/order.html' + q });
  res.end();
}

module.exports = async function handler(req, res) {
  const body = await readBody(req);
  const q = req.query || {};
  const valId = body.val_id || q.val_id;
  const tran  = body.tran_id || q.tran_id || '';

  if (!valId) return land(res, 'fail', tran);

  const id   = process.env.SSLCZ_STORE_ID;
  const pass = process.env.SSLCZ_STORE_PASSWD;
  if (!id || !pass) return land(res, 'fail', tran);

  const url = (process.env.SSLCZ_SANDBOX === '1' ? SANDBOX : LIVE) +
    '?val_id=' + encodeURIComponent(valId) +
    '&store_id=' + encodeURIComponent(id) +
    '&store_passwd=' + encodeURIComponent(pass) +
    '&format=json';

  try {
    const r = await fetch(url);
    const v = await r.json();
    const ok = v && (v.status === 'VALID' || v.status === 'VALIDATED');

    /* The gateway's own record of what was charged. If the posted
       amount and the validated amount disagree, the post was forged
       or tampered with; the validated figure is the only one that
       counts and a mismatch is not an order. */
    const posted = Number(body.amount || q.amount);
    const real   = Number(v && v.amount);
    const agrees = !isFinite(posted) || Math.abs(posted - real) < 0.01;

    if (!ok || !agrees || (v.currency && v.currency !== 'BDT')) {
      console.error('[confirm] rejected', { status: v && v.status, posted, real, cur: v && v.currency });
      return land(res, 'fail', tran);
    }

    console.log('[confirm] paid', { tran: v.tran_id, amount: v.amount, card: v.card_type });

    /* The receipt goes out from here, after the payment is proven and
       never before. value_a..value_d came back from SSLCommerz with
       what was bought; the POST body carries them too, so fall back
       to it if the validator response leaves them out. A receipt that
       cannot be sent must not cost somebody their order, so this is
       awaited but its failure is only logged. */
    await sendReceipt({
      value_a: v.value_a || body.value_a,
      value_b: v.value_b || body.value_b,
      value_c: v.value_c || body.value_c,
      value_d: v.value_d || body.value_d,
      amount: v.amount, tran_id: v.tran_id || tran,
      tran_date: v.tran_date, card_type: v.card_type, card_issuer: v.card_issuer
    });

    return land(res, 'paid', v.tran_id || tran);
  } catch (e) {
    console.error('[confirm]', e);
    return land(res, 'fail', tran);
  }
};
