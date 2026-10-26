/* ─────────────────────────────────────────────────────────────────
   The receipt email.

   Sent from /api/confirm, and only after the validator API has said
   the payment is real. Posting straight to Resend's HTTP API keeps
   this dependency-free, which AGENTS.md asks for — no npm, no build.

   Environment (Vercel → Settings → Environment Variables):
     RESEND_API_KEY   secret, from resend.com
     RECEIPT_FROM     e.g. ZinStim <orders@zinstim.com>
                      the domain must be verified with Resend
     RECEIPT_BCC      optional, a copy to yourselves

   If the key is missing this does nothing and says so in the log. A
   receipt that cannot be sent must never cost somebody their order.
   ───────────────────────────────────────────────────────────── */

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const TITLES = /^(md|mohd|mohammad|muhammad|mohammed|mr|mrs|ms|miss|dr|prof|eng)\.?$/i;
function firstName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  for (const w of parts) if (!TITLES.test(w) && w.length > 1) return w;
  return parts[parts.length - 1] || '';
}

function taka(n) {
  const v = Number(n);
  return isFinite(v) ? '৳ ' + v.toLocaleString('en-US') : '—';
}

/* "ZS—01 Black / M x1 | ZS—02 White / L x2" — the shape checkout.js
   wrote into value_c. Parsed back loosely: a line that will not parse
   is still shown, just not split into columns. */
function parseLines(raw) {
  return String(raw || '').split('|').map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(.*?)\s*\/\s*(\S+)\s*x(\d+)$/i);
    return m ? { what: m[1], size: m[2], qty: m[3] } : { what: s, size: '', qty: '' };
  });
}

function html({ who, lines, total, ref, paidAt, address, card }) {
  const rows = lines.map(l => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #2a2a2a;color:#E9ECEE;font-size:16px">
        ${esc(l.what)}${l.size ? `<div style="color:#828C90;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding-top:4px">size ${esc(l.size)}</div>` : ''}
      </td>
      <td style="padding:14px 0;border-bottom:1px solid #2a2a2a;color:#828C90;font-size:14px;text-align:right;white-space:nowrap">
        ${l.qty ? '&times;' + esc(l.qty) : ''}
      </td>
    </tr>`).join('');

  const meta = [
    ['Reference', ref],
    ['Paid', paidAt],
    ['Deliver to', address],
    ['Paid with', card]
  ].filter(m => m[1]).map(m => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#828C90;font-size:11px;letter-spacing:.16em;text-transform:uppercase">${esc(m[0])}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#E9ECEE;font-size:14px;text-align:right">${esc(m[1])}</td>
    </tr>`).join('');

  return `<!doctype html><html><body style="margin:0;padding:0;background:#0D0D0D">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D">
  <tr><td align="center" style="padding:48px 20px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

      <tr><td style="padding-bottom:40px">
        <div style="font:700 44px/0.95 Helvetica,Arial,sans-serif;color:#E9ECEE;letter-spacing:-1.5px">
          Thank you${who ? ',<br>' + esc(who) : ''}.
        </div>
        <div style="font:400 16px/1.5 Helvetica,Arial,sans-serif;color:#828C90;padding-top:16px">
          Paid in full. We are packing it now, and you will hear from us when it ships.
        </div>
      </td></tr>

      <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="font-family:Helvetica,Arial,sans-serif">${rows}</table></td></tr>

      <tr><td style="padding:24px 0 40px">
        <table role="presentation" width="100%"><tr>
          <td style="color:#828C90;font:400 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase">Total paid</td>
          <td style="text-align:right;color:#E9ECEE;font:700 30px/1 Helvetica,Arial,sans-serif">${esc(taka(total))}</td>
        </tr></table>
      </td></tr>

      <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${meta}</table></td></tr>

      <tr><td style="padding-top:36px;color:#828C90;font:400 13px/1.6 Helvetica,Arial,sans-serif">
        Keep this email &mdash; it is your proof of purchase.<br>
        Reply to it if anything is wrong and a person will read it.
      </td></tr>

      <tr><td style="padding-top:28px;border-top:1px solid #2a2a2a;margin-top:28px;
        color:#5f6669;font:400 11px/1.6 Helvetica,Arial,sans-serif;letter-spacing:.1em">
        ZINSTIM &middot; BANGLADESH
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

function text({ who, lines, total, ref, paidAt, address }) {
  return [
    who ? `Thank you, ${who}.` : 'Thank you.',
    '',
    'Paid in full. We are packing it now, and you will hear from us when it ships.',
    '',
    ...lines.map(l => `  ${l.what}${l.size ? ` / size ${l.size}` : ''}${l.qty ? ` x${l.qty}` : ''}`),
    '',
    `TOTAL PAID   ${taka(total)}`,
    ref ? `REFERENCE    ${ref}` : '',
    paidAt ? `PAID         ${paidAt}` : '',
    address ? `DELIVER TO   ${address}` : '',
    '',
    'Keep this email — it is your proof of purchase.',
    'Reply to it if anything is wrong and a person will read it.',
    '',
    'ZINSTIM · BANGLADESH'
  ].filter(l => l !== '').join('\n');
}

/* Returns true when a receipt actually went out. Never throws: the
   caller is mid-redirect for somebody who has just paid. */
async function sendReceipt(v) {
  const key  = process.env.RESEND_API_KEY;
  const from = process.env.RECEIPT_FROM;
  const to   = v.value_a;

  if (!key || !from) { console.warn('[receipt] not configured, skipping'); return false; }
  if (!to || !/.+@.+\..+/.test(to)) { console.warn('[receipt] no usable address'); return false; }

  const data = {
    who: firstName(v.value_b),
    lines: parseLines(v.value_c),
    total: v.amount,
    ref: v.tran_id,
    paidAt: v.tran_date || '',
    address: v.value_d || '',
    card: v.card_issuer || v.card_type || ''
  };

  const body = {
    from,
    to: [to],
    subject: `Your ZinStim order${data.ref ? ' · ' + data.ref : ''}`,
    html: html(data),
    text: text(data)
  };
  if (process.env.RECEIPT_BCC) body.bcc = [process.env.RECEIPT_BCC];

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      console.error('[receipt] resend refused', r.status, (await r.text()).slice(0, 300));
      return false;
    }
    console.log('[receipt] sent', data.ref);
    return true;
  } catch (e) {
    console.error('[receipt]', e);
    return false;
  }
}

module.exports = { sendReceipt, firstName, parseLines, taka, html, text };
