/* shop — the commerce layer. Three things that happen to share one
   data fetch: the grid on Wear, the piece page, and the bag drawer
   in every masthead. Each guards on what is actually in the page, so
   this one file is safe to load everywhere.

   Product data lives in assets/data/products.json, never in here —
   a price is content, and content belongs where a human can edit it
   without reading JavaScript. */
(function(){
  var DATA = 'assets/data/products.json';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function(n){
    return n === null || n === undefined ? null
      : '৳ ' + Number(n).toLocaleString('en-US');
  };
  var esc = function(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  };
  function byCode(d, code){
    for (var i = 0; i < d.pieces.length; i++) if (d.pieces[i].code === code) return d.pieces[i];
    return null;
  }
  /* One piece per design — the first colourway listed. Both the Wear
     grid and "more from the drop" show designs; the colour is chosen
     on the design's own page. */
  function firstOfEachDesign(d){
    var seen = {}, out = [];
    for (var i = 0; i < d.pieces.length; i++){
      var q = d.pieces[i], k = q.design || q.slug;
      if (seen[k]) continue;
      seen[k] = 1; out.push(q);
    }
    return out;
  }

  function bySlug(d, slug){
    for (var i = 0; i < d.pieces.length; i++) if (d.pieces[i].slug === slug) return d.pieces[i];
    return null;
  }

  /* ── the bag, in every masthead ──────────────────────────────── */
  function bag(){
    var open = document.querySelector('[data-bag-open]');
    var dlg  = document.getElementById('bag');
    if (!open || !dlg || !window.ZSBag) return;

    var list  = dlg.querySelector('[data-bag-list]');
    var sum   = dlg.querySelector('[data-bag-sum]');
    var count = open.querySelector('[data-bag-count]');
    var note  = dlg.querySelector('[data-bag-note]');
    var go    = dlg.querySelector('[data-bag-checkout]');
    var form  = dlg.querySelector('[data-checkout]');

    function render(items){
      open.classList.toggle('is-full', items.length > 0);
      count.textContent = window.ZSBag.count();

      /* An empty bag used to leave Checkout bright red and live, and
         pressing it did nothing whatsoever: the handler wrote "Your bag
         is empty." into the checkout form's status line, and that form
         is still hidden at that point. The one button in the drawer was
         a dead click with no explanation. It is disabled while there is
         nothing to buy, and the empty line carries the way out. */
      if (go) go.disabled = !items.length;

      if (!items.length){
        /* If the last line was removed while the form was open, fold
           the form away too — otherwise Pay sits over an empty cart. */
        if (form && !form.hidden){
          form.hidden = true; if (go) go.hidden = false;
          dlg.classList.remove('is-checkout');
        }
        list.innerHTML = '<li class="drawer__empty t-body">Nothing in it yet. ' +
                         '<a href="wear.html">See the drop</a></li>';
        sum.textContent = '—';
        note.textContent = 'Your bag is kept on this device.';
        return;
      }
      list.innerHTML = items.map(function(it){
        var label = it.name || it.code;
        /* the line total, not the unit price: two of a thing should not
           read as the price of one */
        var amt = typeof it.price === 'number' ? money(it.price * it.qty) : null;
        return '<li class="line">' +
          (it.img ? '<img src="' + esc(it.img) + '" alt="">' : '<span></span>') +
          '<span class="line__head">' +
            '<span class="line__name">' + esc(label) + '</span>' +
            '<span class="line__amt">' + (amt || '—') + '</span>' +
          '</span>' +
          '<span class="line__meta">' + esc(it.code) + ' · ' + esc(it.size) + '</span>' +
          '<span class="line__ctl">' +
            '<span class="line__qty">' +
              '<button class="line__step" type="button" data-less="' + esc(it.id) + '"' +
                (it.qty <= 1 ? ' disabled' : '') +
                ' aria-label="One fewer ' + esc(label) + '">\u2212</button>' +
              '<span class="line__n">' + it.qty + '</span>' +
              '<button class="line__step" type="button" data-more="' + esc(it.id) + '"' +
                ' aria-label="One more ' + esc(label) + '">+</button>' +
            '</span>' +
            '<button class="line__rm" type="button" data-rm="' + esc(it.id) + '"' +
              ' aria-label="Remove ' + esc(label) + ' from your bag">Remove</button>' +
          '</span>' +
        '</li>';
      }).join('');
      var s = window.ZSBag.subtotal();
      sum.textContent = s === null ? '—' : money(s);
      /* "Nothing ships yet" was true when the button was a waitlist.
         It is a checkout now. */
      note.textContent = s === null
        ? 'Prices land when the drop does. Your bag is kept on this device.'
        : 'Delivered across Bangladesh. Your bag is kept on this device.';
    }

    /* − used to delete the line when it ran out of numbers to take away,
       which is how a bag could empty itself without anyone meaning it.
       It stops at 1 now; Remove is the only way a line leaves. */
    list.addEventListener('click', function(e){
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var id = t.getAttribute('data-less') || t.getAttribute('data-more') || t.getAttribute('data-rm');
      if (!id) return;

      if (t.hasAttribute('data-rm')){ window.ZSBag.remove(id); return; }

      var all = window.ZSBag.items();
      for (var i = 0; i < all.length; i++){
        if (all[i].id !== id) continue;
        var n = all[i].qty + (t.hasAttribute('data-more') ? 1 : -1);
        if (n >= 1) window.ZSBag.setQty(id, n);
        return;
      }
    });

    open.addEventListener('click', function(){
      dlg.showModal();
      /* A dialog hands focus to its first focusable child, which here
         is Close — so opening the bag announced "Close" and painted a
         focus ring on it. Focus the panel instead: the heading is
         read first and the ring lands on nothing. */
      var panel = dlg.querySelector('.drawer__in');
      if (panel){ panel.tabIndex = -1; panel.focus(); }
    });
    dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
    var x = dlg.querySelector('[data-bag-close]');
    if (x) x.addEventListener('click', function(){ dlg.close(); });
    dlg.addEventListener('close', function(){ open.focus(); });

    checkout(dlg, sum);
    window.ZSBag.onChange(render);
  }

  /* ── checkout ────────────────────────────────────────────────────
     The browser sends codes, sizes and quantities and nothing else.
     Every price and the total are worked out again in /api/order from
     the catalogue, because a number that arrives from a page anyone
     can edit is not a price. */
  /* Live Server, python -m http.server, file:// — a static server with
     no /api at all, which is what the site is opened on while it is
     being built. There is nothing there to place an order with, so the
     flow would dead-end at "we could not place that order" on every
     local run.

     Gated on the HOSTNAME and nothing else. Not a flag, not a status
     code: on a real deployment /api/order exists, so this can never
     fire there, and the one thing that must never happen — a stranger
     typing their address and being told an order was placed when none
     was — cannot happen on a host that has a backend. */
  function localDev(){
    return location.protocol === 'file:' ||
      /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(location.hostname);
  }

  function checkout(dlg, sum){
    var open = dlg.querySelector('[data-bag-checkout]');
    var form = dlg.querySelector('[data-checkout]');
    if (!open || !form) return;
    var go    = form.querySelector('[data-checkout-go]');
    var state = form.querySelector('[data-checkout-state]');

    function say(msg, bad){
      if (!state) return;
      state.textContent = msg || '';
      state.classList.toggle('is-bad', !!bad);
    }

    /* the snapshot was written before the request, so the receipt shows
       the real bag whichever way we got here */
    function land(prefix){
      location.href = 'order.html?state=placed&ref=' + (prefix || '') +
        Date.now().toString(36).toUpperCase();
    }

    open.addEventListener('click', function(){
      /* render() disables this button on an empty bag, so this is belt
         and braces — and it writes to the note, which is the one line
         in the drawer that is always visible. The form's status line
         is not, which is how this used to say nothing at all. */
      if (!window.ZSBag.count()){
        var n = dlg.querySelector('[data-bag-note]');
        if (n) n.textContent = 'Your bag is empty — nothing to check out yet.';
        return;
      }
      form.hidden = false;
      open.hidden = true;
      /* the drawer re-lays itself out once the form is in it: the list
         keeps a floor and the foot becomes the scroller. See §THE
         DRAWER, ONCE CHECKOUT IS OPEN in brand.css. */
      dlg.classList.add('is-checkout');
      var first = form.querySelector('input');
      if (first) first.focus();
      if (go) go.textContent = 'Place order \u00b7 ' + (sum ? sum.textContent : '');
    });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (go && go.disabled) return;

      /* The browser knows which field is wrong; it just will not say so
         anywhere the shopper is looking. Take the first one, put the
         cursor in it, and write its own sentence into the status line.
         A red outline on its own does not tell you what to change. */
      var bad = form.querySelector(':invalid');

      /* The phone is counted here rather than with a pattern attribute.
         A character class holding ( ) and - is invalid under the `v`
         flag browsers now compile pattern with, and an invalid pattern
         is not a failing pattern — it is ignored entirely, silently,
         so "1" passed as a phone number. Counting digits cannot be
         mis-parsed. */
      var phone = form.querySelector('input[name="phone"]');
      if (!bad && phone && (phone.value.match(/\d/g) || []).length < 7) bad = phone;

      if (bad){
        bad.focus();
        say(bad.getAttribute('data-say') || 'Check that one before paying.', true);
        return;
      }

      var customer = {};
      var fields = form.querySelectorAll('input[name]');
      for (var i = 0; i < fields.length; i++) customer[fields[i].name] = fields[i].value.trim();

      var cart = window.ZSBag.items().map(function(it){
        return { code: it.code, size: it.size, qty: it.qty };
      });
      if (!cart.length){ say('Your bag is empty.', true); return; }

      if (go){ go.disabled = true; }
      say('Placing your order\u2026');

      /* Snapshot the order before we hand off to the gateway. There is
         no order store yet (see the decision log), and the bag is
         cleared the moment the order lands — without this the receipt
         would have nothing to show but a reference number.
         It is this browser's copy of its own order, nothing more. */
      try {
        localStorage.setItem('zs-order-v1', JSON.stringify({
          at: Date.now(),
          customer: customer,
          lines: window.ZSBag.items().map(function(it){
            return { code: it.code, name: it.name, size: it.size,
                     qty: it.qty, price: it.price, img: it.img };
          }),
          total: window.ZSBag.subtotal()
        }));
      } catch (e) { /* private window: the receipt falls back to the ref */ }

      /* `method` is the seam. Today the endpoint always invoices and
         answers with a reference; when the gateway is turned on it
         answers with a redirect instead, and the only line that has to
         change is the one that sends the method. Both replies are
         handled here, so the front end is already finished. */
      fetch('/api/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cart: cart, customer: customer, method: 'invoice' })
      }).then(function(r){
        /* Read it as text first. A 404 from a plain file server is an
           HTML page, and r.json() on that throws a parser error that
           used to be shown to the shopper verbatim. */
        return r.text().then(function(t){
          var j = null;
          try { j = JSON.parse(t); } catch (e) {}
          return { ok: r.ok, status: r.status, j: j };
        });
      }).then(function(out){
        /* later: the gateway hands back somewhere to go */
        if (out.j && out.j.redirect){ location.href = out.j.redirect; return; }
        if (out.ok && out.j && out.j.ref){
          location.href = 'order.html?state=placed&ref=' + encodeURIComponent(out.j.ref);
          return;
        }
        /* A real error from a real endpoint is still an error — but a
           404 or a 501 from a static file server is not an error, it is
           the absence of a backend. On a local host, walk on. */
        if (localDev()){ land('LOCAL-'); return; }
        throw new Error((out.j && out.j.error) ||
          'We could not place that order. Try again in a moment.');
      })['catch'](function(err){
        /* the request never landed at all — still local */
        if (localDev()){ land('LOCAL-'); return; }
        if (go) go.disabled = false;
        /* a sentence a shopper can act on, never a parser message */
        var m = err && err.message;
        if (!m || /JSON|parse|Unexpected|NetworkError|Failed to fetch/i.test(m)) {
          m = 'We could not reach the shop just then. Check your connection and try again.';
        }
        say(m, true);
      });
    });
  }

  /* ── the grid on Wear ────────────────────────────────────────── */
  function grid(d, host){
    /* The label used to be typed into the page and said "three pieces"
       for a day after Coral was removed. It counts what it renders. */
    var shown = firstOfEachDesign(d);
    var label = document.querySelector('[data-grid-count]');
    if (label){
      var n = shown.length;
      var word = ['', 'one', 'two', 'three', 'four', 'five', 'six'][n] || String(n);
      label.textContent = 'Drop 01 \u00b7 ' + word + ' design' + (n === 1 ? '' : 's') +
                          ', black and white';
    }
    host.innerHTML = shown.map(function(p){
      var price = money(p.price);
      return '<a class="card" href="piece.html?p=' + esc(p.slug) + '">' +
        '<span class="card__frame">' +
          '<img src="' + esc(p.images[0].src) + '" alt="' + esc(p.code + ' ' + p.name) + '" loading="lazy" decoding="async">' +
          '<span class="card__state t-meta"><span class="lock__dot lock__dot--live"></span>Drop 01</span>' +
        '</span>' +
        '<span class="card__body">' +
          '<span class="card__code">' + esc(p.code) + '</span>' +
          '<span class="card__name">' + esc(p.name) + '</span>' +
          '<span class="card__price price' + (price ? '' : ' price--soon') + '">' +
            (price || 'Price at drop') + '</span>' +
        '</span>' +
      '</a>';
    }).join('');
  }

  /* ── the piece page ──────────────────────────────────────────── */
  function piece(d, root){
    var slug = (location.search.match(/[?&]p=([a-z0-9-]+)/i) || [])[1];
    var p = (slug && bySlug(d, slug)) || d.pieces[0];
    var size = null;

    /* The gallery and the fabric panel are built once and re-pointed.
       Rebuilding them per colourway stacked a second set of listeners
       and a second row of scrub ticks every time you switched. */
    var gallery = flick(root);
    var fabric  = slit(root);

    var coloursEl = root.querySelector('[data-p-colours]');
    var sizesEl   = root.querySelector('[data-p-sizes]');
    var specsEl   = root.querySelector('[data-p-specs]');
    var othersEl  = root.querySelector('[data-p-others]');
    var priceEl   = root.querySelector('[data-p-price]');
    var bb        = root.querySelector('[data-buybar-price]');

    var pick = root.querySelector('.piece-buy__pick');
    function unset(is){ if (pick) pick.classList.toggle('is-unset', !!is); }

    function state(msg){
      var el = root.querySelector('[data-p-state]');
      if (el) el.textContent = msg;
    }

    /* Every colourway is the same garment in another colour, so
       switching one must not reload the page and lose your place —
       it repaints in situ and corrects the URL behind you. */
    function paint(np){
      p = np;
      size = null;
      unset(true);
      state('');

      document.title = p.code + ' ' + p.name + ' ' + (p.colour || '') + ' — ZinStim';
      root.querySelector('[data-p-code]').textContent = p.code;
      root.querySelector('[data-p-name]').textContent = p.name;

      var price = money(p.price);
      priceEl.textContent = price || 'Price at drop';
      priceEl.classList.toggle('price--soon', !price);
      if (bb) bb.textContent = price || 'Price at drop';

      var on = coloursEl.querySelectorAll('.swatchbtn');
      for (var i = 0; i < on.length; i++){
        var isOn = on[i].getAttribute('data-slug') === p.slug;
        on[i].classList.toggle('is-on', isOn);
        on[i].setAttribute('aria-pressed', isOn ? 'true' : 'false');
      }

      sizesEl.innerHTML = p.sizes.map(function(s){
        var out = s.stock === 0;
        return '<li><button class="size" type="button" aria-pressed="false"' +
          (out ? ' disabled' : '') + ' data-size="' + esc(s.label) + '">' + esc(s.label) + '</button></li>';
      }).join('');

      specsEl.innerHTML = Object.keys(p.specs).map(function(k){
        return '<tr role="row"><td role="cell" class="t-meta" style="color:var(--ink-2)">' + esc(k) +
               '</td><td role="cell">' + esc(p.specs[k]) + '</td></tr>';
      }).join('');

      /* The other DESIGNS, one card each — not the other seven pieces,
         which would list this garment's own white twin back at you
         under "more from the drop". */
      if (othersEl) othersEl.innerHTML = firstOfEachDesign(d)
        .filter(function(q){ return q.design !== p.design; })
        .map(function(q){
          return '<a class="card" href="piece.html?p=' + esc(q.slug) + '">' +
            '<span class="card__frame"><img src="' + esc(q.images[0].src) + '" alt="' + esc(q.code + ' ' + q.name) + '" loading="lazy"></span>' +
            '<span class="card__body"><span class="card__code">' + esc(q.code) + '</span>' +
            '<span class="card__name">' + esc(q.name) + '</span></span></a>';
        }).join('');

      gallery.update(p);
      fabric.update((p.images[3] || p.images[p.images.length - 1]).src,
                    p.code + ' ' + p.name + ' \u2014 the cloth up close');

      try { history.replaceState(null, '', 'piece.html?p=' + p.slug); } catch (e) {}
    }

    /* buttons, not links: a colourway is a change of view, not a
       change of page */
    /* Only the colourways of the design being looked at. With four
       designs in two colours each, mapping every piece put eight
       swatches under one garment and offered the other designs as if
       they were colours of this one. */
    coloursEl.innerHTML = d.pieces
      .filter(function(q){ return q.design === p.design; })
      .map(function(q){
        var c = q.colour || q.name;
        return '<button class="swatchbtn" type="button" aria-pressed="false"' +
          ' data-slug="' + esc(q.slug) + '" aria-label="' + esc(c) + '">' +
          '<span class="swatch" style="background:' + esc(q.swatch) + '"></span>' +
          '<span class="t-meta">' + esc(c) + '</span></button>';
      }).join('');
    coloursEl.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('.swatchbtn');
      if (!b) return;
      var q = bySlug(d, b.getAttribute('data-slug'));
      if (q && q.slug !== p.slug) paint(q);
    });

    /* The other-pieces grid at the foot of the page was still a plain
       link, so clicking it reloaded and dumped you at the top of a
       page you were already at the bottom of — while the swatches two
       sections up swapped in place. Same gesture, same behaviour: it
       repaints and walks you back up to the gallery. The href stays
       so middle-click, open-in-new-tab and no-JS all still work. */
    if (othersEl) othersEl.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      var a = e.target.closest && e.target.closest('.card');
      if (!a) return;
      var m = (a.getAttribute('href') || '').match(/[?&]p=([a-z0-9-]+)/i);
      var q = m && bySlug(d, m[1]);
      if (!q) return;
      e.preventDefault();
      paint(q);
      var top = root.querySelector('[data-flick-img]') || root;
      try { top.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
      catch (err) { top.scrollIntoView(); }
    });

    sizesEl.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('.size');
      if (!b || b.disabled) return;
      size = b.getAttribute('data-size');
      var all = sizesEl.querySelectorAll('.size');
      for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-pressed', all[i] === b ? 'true' : 'false');
      unset(false);
      state('');
    });

    var adds = root.querySelectorAll('[data-p-add]');
    for (var i = 0; i < adds.length; i++){
      adds[i].addEventListener('click', function(){
        if (!size){ state('Pick a size first.'); return; }
        window.ZSBag.add(p.code, size, { name: p.name, img: p.images[0].src, price: p.price });
        state(p.name + ', size ' + size + ' \u2014 in your bag.');
        var o = document.querySelector('[data-bag-open]');
        if (o) o.click();
      });
    }

    paint(p);
    buybar(root);
  }

  /* ── flick: the gallery ──────────────────────────────────────── */
  function flick(root){
    var scrub = root.querySelector('[data-flick-scrub]');
    var img   = root.querySelector('[data-flick-img]');
    var no    = root.querySelector('[data-flick-no]');
    var tag   = root.querySelector('[data-flick-tag]');
    var head  = root.querySelector('[data-flick-head]');
    if (!scrub || !img) return { update: function(){} };

    var set = [], cp = null, cur = -1, dragging = false, ticks = [];

    function show(n){
      if (!set.length) return;
      n = Math.max(0, Math.min(set.length - 1, n));
      if (n === cur) return;
      cur = n;
      /* src on a decoded image swaps at the next paint. That IS the
         hard cut — no transition goes anywhere near it. */
      img.src = set[n].src;
      img.alt = cp.code + ' ' + cp.name + ' \u2014 ' + set[n].alt;
      if (no) no.textContent = String(n + 1).padStart(2, '0') + '/' + String(set.length).padStart(2, '0');
      if (tag) tag.textContent = set[n].tag;
      if (head) head.style.setProperty('--p', ((n + .5) / set.length * 100) + '%');
      for (var j = 0; j < ticks.length; j++) ticks[j].classList.toggle('is-on', j === n);
      scrub.setAttribute('aria-valuenow', String(n + 1));
    }
    function fromX(x){
      var r = scrub.getBoundingClientRect();
      show(Math.floor((x - r.left) / r.width * set.length));
    }

    /* listeners bind to the strip once, for the life of the page */
    scrub.addEventListener('pointerdown', function(e){
      dragging = true;
      try { scrub.setPointerCapture(e.pointerId); } catch (err) {}
      fromX(e.clientX);
    });
    scrub.addEventListener('pointermove', function(e){
      if (dragging || e.pointerType === 'mouse') fromX(e.clientX);
    });
    scrub.addEventListener('pointerup',     function(){ dragging = false; });
    scrub.addEventListener('pointercancel', function(){ dragging = false; });

    scrub.tabIndex = 0;
    scrub.setAttribute('role', 'slider');
    scrub.setAttribute('aria-label', 'Frames');
    scrub.setAttribute('aria-valuemin', '1');
    scrub.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ show(cur + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft'){ show(cur - 1); e.preventDefault(); }
      else if (e.key === 'Home'){ show(0); e.preventDefault(); }
      else if (e.key === 'End'){ show(set.length - 1); e.preventDefault(); }
    });

    return {
      update: function(p){
        cp = p; set = p.images; cur = -1;
        set.forEach(function(s){ var i = new Image(); i.src = s.src; });
        scrub.innerHTML = '';
        ticks = [];
        for (var i = 0; i < set.length; i++){
          var t = document.createElement('span');
          t.className = 'scrub__tick';
          scrub.appendChild(t); ticks.push(t);
        }
        scrub.setAttribute('aria-valuemax', String(set.length));
        show(0);
      }
    };
  }

  /* ── slit: the fabric, found by a torch ──────────────────────── */
  function slit(root){
    var host = root.querySelector('[data-slit]');
    if (!host) return { update: function(){} };
    var dim = root.querySelector('[data-slit-dim]');
    var lit = root.querySelector('[data-slit-lit]');

    function at(pct){ host.style.setProperty('--x', pct.toFixed(1) + '%'); }
    host.addEventListener('pointermove', function(e){
      var r = host.getBoundingClientRect();
      at(Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)));
    });
    if (!matchMedia('(hover: hover)').matches && !reduce){
      var t = 0, run = false;
      new IntersectionObserver(function(es){ run = es[0].isIntersecting; }).observe(host);
      (function loop(){
        if (run){ t += 0.0055; at(50 + Math.sin(t) * 42); }
        requestAnimationFrame(loop);
      })();
    }

    return {
      update: function(src, alt){
        if (dim) dim.src = src;
        if (lit){ lit.src = src; lit.alt = alt || ''; }
      }
    };
  }

  /* A slit outside a piece page carries its own frame in the markup,
     because there is no product object to read it from. Wear uses one
     to show the cloth after the grid. */
  function loneSlit(){
    var host = document.querySelector('[data-slit][data-slit-src]');
    if (!host || document.querySelector('[data-piece]')) return;
    slit(document).update(host.getAttribute('data-slit-src'),
                          host.getAttribute('data-slit-alt') || '');
  }

  /* ── buybar: the button comes back once it has scrolled away ─── */
  function buybar(root){
    var bar = root.querySelector('[data-buybar]');
    var pick = root.querySelector('.piece-buy__pick');
    if (!bar || !pick) return;
    new IntersectionObserver(function(es){
      bar.classList.toggle('is-up', !es[0].isIntersecting && es[0].boundingClientRect.top < 0);
    }, { threshold: 0 }).observe(pick);
  }

  /* ── go ──────────────────────────────────────────────────────── */
  bag();

  var gridHost  = document.querySelector('[data-grid-list]');
  var pieceRoot = document.querySelector('[data-piece]');
  /* the lone slit needs no product data, so it runs before the fetch
     and survives the fetch failing */
  loneSlit();
  if (!gridHost && !pieceRoot) return;

  fetch(DATA).then(function(r){
    if (!r.ok) throw new Error('products.json ' + r.status);
    return r.json();
  }).then(function(d){
    if (gridHost) grid(d, gridHost);
    if (pieceRoot) piece(d, pieceRoot);
  }).catch(function(err){
    /* a shop that cannot read its own stock says so rather than
       showing an empty room */
    var fb = document.querySelector('[data-grid-fallback]');
    if (fb) fb.textContent = 'The drop could not be loaded. Reload, or open the site over http rather than from a file.';
    if (window.console) console.warn('[shop]', err);
  });
})();

/* soonbar — the locked pages' marquee. It moves with the scroll, like
   every other marquee here and never on a timer, so it is still when
   the reader is. */
(function(){
  var bar = document.querySelector('[data-soonbar]');
  if (!bar) return;
  var track = bar.querySelector('.soonbar__track');
  if (!track || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var span = track.scrollWidth / 2 || 1, ticking = false;
  function draw(){
    /* wrap on half the track, which holds two copies of the run, so
       the loop never shows an edge */
    var x = -((window.scrollY * 0.35) % span);
    track.style.setProperty('--mq', x.toFixed(1) + 'px');
    ticking = false;
  }
  addEventListener('scroll', function(){
    if (!ticking){ ticking = true; requestAnimationFrame(draw); }
  }, { passive: true });
  addEventListener('resize', function(){ span = track.scrollWidth / 2 || 1; });
  draw();
})();

/* notify — the per-category sign-up on a locked page. Static preview:
   it says so rather than pretending to send. */
(function(){
  var form = document.querySelector('[data-notify]');
  if (!form) return;
  var said = document.querySelector('[data-notify-said]');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var input = form.querySelector('input');
    if (!input || !input.value || input.value.indexOf('@') < 0){
      if (said) said.textContent = 'That does not look like an email address.';
      if (input) input.focus();
      return;
    }
    if (said) said.textContent = 'Saved locally for now — this form does not send anything yet.';
    input.value = '';
  });
})();
