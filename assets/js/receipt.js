/* ─────────────────────────────────────────────────────────────────
   receipt.js — order.html

   What the checkout lands on. This file REPORTS a decision made
   elsewhere and never makes one. A ?state in the URL is not evidence
   of anything — anyone can type one — which is exactly why "placed"
   claims nothing about money. "paid" is kept for when a gateway is
   wired up and /api/confirm has validated a real payment.

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

  /* ── neither a placed order nor a confirmed payment ────────────── */
  if (state !== 'paid' && state !== 'placed') {
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

  var phone = order && order.customer && order.customer.phone;

  $('[data-r-thanks]').textContent = who ? 'Thank you, ' + who + '.' : 'Thank you.';
  /* Nothing has been charged, and the page says so in the first line
     rather than leaving someone to work it out from the absence of a
     card number. The call is the next thing that happens to them, so
     it is the next thing they read. */
  $('[data-r-lede]').textContent = state === 'placed'
    ? (phone
        ? 'Order received. Nothing has been charged \u2014 we will call you on ' + phone +
          ' to confirm and arrange payment before anything ships.'
        : 'Order received. Nothing has been charged \u2014 we will be in touch to confirm and arrange payment before anything ships.')
    : 'Paid in full. We are packing it now, and you will hear from us when it ships.';

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
    /* It read "Total paid" on a page whose own first line says nothing
       has been charged. The markup now ships the neutral word and only
       the confirmed-payment branch earns the other one. */
    var tk = $('[data-r-totalk]');
    if (tk) tk.textContent = state === 'paid' ? 'Total paid' : 'Order total';
  } else {
    /* opened somewhere the snapshot never existed */
    $('[data-r-lines]').innerHTML =
      '<li class="receipt__line"><span class="receipt__sub">' +
      'The itemised copy is in your email.</span></li>';
    $('[data-r-totalrow]').hidden = true;
  }

  var meta = [];
  if (ref) meta.push(['Reference', ref]);
  meta.push([state === 'placed' ? 'Placed' : 'Paid', stamp(order && order.at)]);
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
    ? 'A copy is on its way to ' + email + '. Keep the reference — it is how we find your order.'
    : 'A copy is on its way to the address you gave us.';

  $('[data-r-act]').innerHTML =
    '<a class="btn" href="wear.html">Back to the drop</a>' +
    ' <button class="btn btn--secondary" type="button" data-r-print>Print this</button>';

  var pr = $('[data-r-print]');
  if (pr) pr.addEventListener('click', function () { window.print(); });

  /* The bag empties only here, on an order that actually landed, and
     only once bag.js has run — this file is deferred alongside it. */
  if (window.ZSBag) { try { window.ZSBag.clear(); } catch (e) {} }

  /* The snapshot stays, so a refresh or a back-button still shows the
     receipt. The next checkout overwrites it. */
}());
