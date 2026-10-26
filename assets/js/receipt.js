/* ─────────────────────────────────────────────────────────────────
   receipt.js — order.html

   Where SSLCommerz sends people back to. /api/confirm has already
   called the validator API and decided whether the payment is real;
   this file REPORTS that decision and never makes one. A ?state in
   the URL is not evidence of anything — anyone can type one.

   The line items come from a snapshot the checkout wrote to this
   browser before handing off to the gateway, because there is no
   order store yet. If it is missing (another device, a private
   window, cleared storage) the receipt still shows the reference and
   says where the full copy is: the email.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var root = document.querySelector('[data-receipt]');
  if (!root) return;

  var q     = new URLSearchParams(location.search);
  var state = q.get('state');
  var ref   = q.get('ref') || '';

  var $ = function (sel) { return root.querySelector(sel); };

  function money(n) {
    if (typeof n !== 'number' || !isFinite(n)) return null;
    return '৳ ' + n.toLocaleString('en-US');
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function stamp(ms) {
    var d = new Date(ms || Date.now());
    try {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
             ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return d.toISOString().slice(0, 16).replace('T', ', '); }
  }

  var order = null;
  try { order = JSON.parse(localStorage.getItem('zs-order-v1') || 'null'); }
  catch (e) { /* no storage: the reference carries it */ }

  /* ── anything other than a confirmed payment is not a receipt ──── */
  if (state !== 'paid') {
    var said = {
      fail:   ['That one did not go through.',
               'Nothing has been charged. Your bag is still here — try again, or pay another way.'],
      cancel: ['Cancelled.',
               'Nothing has been charged and your bag is exactly where you left it.']
    }[state] || ['We could not find that order.',
                 'If you were charged, reply to your payment receipt and we will sort it out.'];

    $('[data-r-thanks]').textContent = said[0];
    $('[data-r-lede]').textContent = said[1];
    $('[data-r-body]').hidden = true;
    $('[data-r-act]').innerHTML = '<a class="btn" href="wear.html">Back to the drop</a>';
    if (ref) $('[data-r-ref]').textContent = 'Reference ' + ref;
    return;
  }

  /* ── paid ──────────────────────────────────────────────────────── */
  /* "Md Kashfi Or Rashid Pranta" greeted as "Md" is a title, not a
     name — and Md/Mohammad is the most common prefix there is in
     Bangladesh. Step past the honorifics and take the first word
     that is actually a name. */
  var TITLES = /^(md|mohd|mohammad|muhammad|mohammed|mr|mrs|ms|miss|dr|prof|eng)\.?$/i;
  function firstName(full){
    var parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    for (var i = 0; i < parts.length; i++){
      if (!TITLES.test(parts[i]) && parts[i].length > 1) return parts[i];
    }
    return parts.length ? parts[parts.length - 1] : '';
  }
  var who = order && order.customer ? firstName(order.customer.name) : '';

  /* A preview reaches this page without a gateway, and reads exactly
     like the real thing — it is the same page, seen on a local host,
     by the people building it. The guard that matters is upstream:
     the preview branch in shop.js is gated on the hostname, so a
     customer on the live site can only arrive here after
     /api/confirm has validated a real payment with SSLCommerz. */
  /* the only thing this still changes is whether the bag is emptied;
     the page itself reads the same either way */
  var preview = /^PREVIEW-/.test(ref);

  $('[data-r-thanks]').textContent = who ? 'Thank you, ' + who + '.' : 'Thank you.';
  $('[data-r-lede]').textContent =
    'Paid in full. We are packing it now, and you will hear from us when it ships.';

  var lines = (order && order.lines) || [];
  if (lines.length) {
    $('[data-r-lines]').innerHTML = lines.map(function (l) {
      var amt = typeof l.price === 'number' ? money(l.price * l.qty) : null;
      return '<li class="receipt__line">' +
        '<span><span class="receipt__name">' + esc(l.name || l.code) + '</span>' +
        '<span class="receipt__sub">' + esc(l.code) + ' · size ' + esc(l.size) + '</span></span>' +
        '<span class="receipt__qty">×' + esc(l.qty) + '</span>' +
        '<span class="receipt__amt">' + (amt || '—') + '</span>' +
      '</li>';
    }).join('');
    var total = (order && typeof order.total === 'number') ? order.total : null;
    $('[data-r-total]').textContent = money(total) || '—';
  } else {
    /* opened somewhere the snapshot never existed */
    $('[data-r-lines]').innerHTML =
      '<li class="receipt__line"><span class="receipt__sub">' +
      'The itemised copy is in your email.</span></li>';
    $('[data-r-totalrow]').hidden = true;
  }

  var meta = [];
  if (ref) meta.push(['Reference', ref]);
  meta.push(['Paid', stamp(order && order.at)]);
  if (order && order.customer) {
    var c = order.customer;
    var to = [c.address, c.city, c.postcode].filter(Boolean).join(', ');
    if (to) meta.push(['Deliver to', to]);
    if (c.phone) meta.push(['Phone', c.phone]);
  }
  $('[data-r-meta]').innerHTML = meta.map(function (m) {
    return '<div class="receipt__row"><dt class="receipt__k">' + esc(m[0]) + '</dt>' +
           '<dd class="receipt__v">' + esc(m[1]) + '</dd></div>';
  }).join('');

  var email = order && order.customer && order.customer.email;
  $('[data-r-note]').textContent = email
    ? 'A copy is on its way to ' + email + '. Keep it — it is your proof of purchase.'
    : 'A copy is on its way to the address you paid with.';

  $('[data-r-act]').innerHTML =
    '<a class="btn" href="wear.html">Back to the drop</a>' +
    ' <button class="btn btn--secondary" type="button" data-r-print>Print this</button>';

  var pr = $('[data-r-print]');
  if (pr) pr.addEventListener('click', function () { window.print(); });

  /* The bag empties only here, on a confirmed payment, and only once
     bag.js has actually run — this file is deferred alongside it. */
  /* a preview has not bought anything, so the bag stays */
  if (!preview && window.ZSBag) { try { window.ZSBag.clear(); } catch (e) {} }

  /* The snapshot stays, so a refresh or a back-button still shows the
     receipt. The next checkout overwrites it. */
}());
