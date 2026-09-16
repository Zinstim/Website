/* one page-load moment */
requestAnimationFrame(function(){document.body.classList.add('is-ready')});

/* reveal once, never re-animate */
(function(){
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(function(el){el.classList.add('is-in')}); return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, {threshold:.25});
  els.forEach(function(el){io.observe(el)});
})();



/* sticky masthead — the hairline only once you have left the top, so
   the nav sits on nothing at rest and gains an edge when it starts
   travelling over content. */
(function(){
  var head = document.querySelector('.masthead');
  if (!head) return;
  var ticking = false;
  function frame(){
    head.classList.toggle('is-stuck', window.scrollY > 8);
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, {passive:true});
  frame();
})();


/* rollcall — the Origin hero. Two lines hold still and the third
   cycles. Opens on the motto, so the first thing read is the brand
   line, then it turns through the variations and comes back.

   Slow on purpose: HOLD is a reading pace, not a ticker. Each word
   rises from below the mask, sits, then leaves upward — so the
   movement always travels one way. A word that has left is parked
   back underneath with the transition suppressed, otherwise it
   would visibly slide back down through the mask on the way round.

   Pauses when scrolled off screen. Reduced motion holds the motto
   and never cycles — the other lines are decoration. */
(function(){
  var rc = document.querySelector('[data-rollcall]');
  if (!rc) return;
  var words = Array.prototype.slice.call(rc.querySelectorAll('.rollcall__word'));
  var note  = document.querySelector('[data-rollcall-note]');
  if (!words.length) return;

  var HOLD = 3200;      // time each line is readable
  var EXIT = 640;       // slide-out duration plus a margin
  var i = 0, timer = null;

  // the footnote belongs to the starred line, so it comes and goes with it
  function syncNote(){
    if (note) note.classList.toggle('is-in', words[i].hasAttribute('data-note'));
  }

  function park(w){
    w.style.transition = 'none';
    w.classList.remove('is-out');       // back below the mask, silently
    void w.offsetWidth;
    w.style.transition = '';
  }

  function step(){
    var cur = words[i];
    i = (i + 1) % words.length;
    cur.classList.remove('is-on');
    cur.classList.add('is-out');
    words[i].classList.add('is-on');
    syncNote();
    setTimeout(function(){ park(cur); }, EXIT);
  }

  function start(){ if (!timer) timer = setInterval(step, HOLD); }
  function stop(){ clearInterval(timer); timer = null; }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    words.forEach(function(w, n){ if (w.hasAttribute('data-note')) i = n; });
    words[i].classList.add('is-on');
    syncNote();
    return;
  }

  setTimeout(function(){           // let the two fixed lines land first
    words[0].classList.add('is-on');
    syncNote();
    start();                       // cycle regardless; the observer only pauses it
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(es){
        if (es[0].isIntersecting) start(); else stop();
      }, {threshold:.25}).observe(rc);
    }
  }, 780);
})();


/* doors — hover or focus a category, its cards arrive and its word
   changes face. All this does is set data-active on the section and
   is-active on the door; brand.css owns every visual decision.

   Focus gets the identical state to hover, because hover-only is
   unreachable by keyboard. */
(function(){
  var doors = document.querySelector('[data-doors]');
  if (!doors) return;
  var links = doors.querySelectorAll('.door');
  if (!links.length) return;

  function activate(door){
    links.forEach(function(l){ l.classList.toggle('is-active', l === door); });
    doors.setAttribute('data-active', door.dataset.door);
  }
  function clear(){
    links.forEach(function(l){ l.classList.remove('is-active'); });
    doors.removeAttribute('data-active');
  }

  links.forEach(function(door){
    door.addEventListener('mouseenter', function(){ activate(door); });
    door.addEventListener('focus',      function(){ activate(door); });
    door.addEventListener('blur', function(){
      // only clear if focus actually left the group
      setTimeout(function(){
        if (!doors.contains(document.activeElement)) clear();
      }, 0);
    });
  });

  doors.addEventListener('mouseleave', function(){
    if (!doors.contains(document.activeElement)) clear();
  });
})();


/* pour — the one moment. A vessel tips, the elixir pours, lands,
   pools and floods the stage, and the claim surfaces as the liquid
   covers it.

   Everything here is driven by scroll through a pinned stage, so the
   reader pours it and scrolling back drains it. Nothing plays on its
   own and nothing loops — even the surface ripple is a function of
   progress, so it stops when the reader stops.

   The liquid is ONE shape rebuilt every frame. The top fracture is
   not an element that changes colour: it is the ceiling the liquid
   rises to, so its teeth only exist where liquid has reached them.
   That is the fix for the old painted rim, which went teal before the
   liquid got there and left a band of black air underneath it.

   Timeline, in progress 0–1 — tuned against captured frames:
     .04–.18  the vessel comes in        .10–.24  it tips
     .16–.34  the stream falls, landing as the stage pins
     .30–.52  the pool spreads           .42–.88  it rises and floods
     .64–.72  the vessel rights itself   .66–.78  it leaves, under the
     .66–.76  the stream lets go                  rising liquid
   The vessel is gone before the flood reaches the rim: left in, it
   poked up between the teeth.                                         */
(function(){
  var sec = document.querySelector('[data-pour]');
  if (!sec) return;

  var stage   = sec.querySelector('.pour__stage');
  var svg     = sec.querySelector('.pour__liquid');
  var stream  = sec.querySelector('.pour__stream');
  var flood   = sec.querySelector('.pour__flood');
  var grad    = sec.querySelector('#pour-depth');
  var vessel  = sec.querySelector('.pour__vessel');
  var mouthEl = sec.querySelector('.pour__mouth');
  var claim   = sec.querySelector('.pour__claim');
  var mast    = document.querySelector('.masthead');
  if (!stage || !svg || !stream || !flood || !grad || !vessel || !mouthEl || !claim) return;

  sec.classList.add('is-live');

  // The fracture line the liquid rises to — the same line the old
  // painted rim used (viewBox 1200x300), so the flooded state reads
  // exactly like the approved band. Only now liquid draws it.
  var RIM = [[0,246],[78,262],[152,214],[232,240],[300,192],[388,218],
             [468,172],[556,198],[638,152],[726,178],[808,134],[898,160],
             [978,116],[1068,142],[1140,100],[1200,124]];
  var RIM_TOP = 100, RIM_SPAN = 162;

  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function seg(p, a, b){ return clamp((p - a) / (b - a), 0, 1); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function easeOut(t){ return 1 - (1 - t) * (1 - t); }
  function easeIn(t){ return t * t; }
  function easeInOut(t){ return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function smooth(a, b, x){ var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  // 0 at the rim's highest peak, 1 at its deepest valley
  function rim(fx){
    var X = clamp(fx, 0, 1) * 1200;
    for (var i = 1; i < RIM.length; i++){
      if (X <= RIM[i][0]){
        var a = RIM[i - 1], b = RIM[i];
        return (a[1] + (b[1] - a[1]) * ((X - a[0]) / (b[0] - a[0])) - RIM_TOP) / RIM_SPAN;
      }
    }
    return (RIM[RIM.length - 1][1] - RIM_TOP) / RIM_SPAN;
  }

  var W = 1, H = 1, N = 120, ys = [], claimBox = null, mouthPour = { x: 0, y: 0 };

  function inStage(el){
    var s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top };
  }

  function pose(p){
    var inn = easeOut(seg(p, .04, .18)),   out   = easeIn(seg(p, .66, .78));
    var tip = easeInOut(seg(p, .10, .24)), untip = easeInOut(seg(p, .64, .72));
    return {
      x: lerp(-150, 0, inn) + lerp(0, -170, out),
      y: lerp(-40, 0, inn)  + lerp(0, -210, out),
      r: lerp(-24, 32, tip) + lerp(0, -40, untip),
      // fully absent at rest: at 0 it used to show as a black wedge at
      // the page edge while the hero was still being read
      // and gone by .75 on the way out: fading from .74 left a solid
      // sliver of it in the top corner as the flood closed in
      o: seg(p, .03, .09) * (1 - seg(p, .70, .75))
    };
  }
  function applyPose(q){
    vessel.style.setProperty('--v-x', q.x.toFixed(2));
    vessel.style.setProperty('--v-y', q.y.toFixed(2));
    vessel.style.setProperty('--v-r', q.r.toFixed(2));
    vessel.style.setProperty('--v-o', q.o.toFixed(3));
  }

  function measure(){
    if (mast) sec.style.setProperty('--mast-h', mast.offsetHeight + 'px');
    W = Math.max(1, stage.clientWidth);
    H = Math.max(1, stage.clientHeight);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    // The mouth while pouring. Once the vessel starts to leave, the
    // stream keeps THIS origin and lets go of it, instead of stretching
    // after a bottle that is no longer pouring.
    applyPose({ x: 0, y: 0, r: 32, o: 1 });
    mouthPour = inStage(mouthEl);

    claim.style.setProperty('--c', '1');          // measure it unshifted
    var s = stage.getBoundingClientRect(), c = claim.getBoundingClientRect();
    claimBox = { top: c.top - s.top, bottom: c.bottom - s.top, cx: c.left - s.left + c.width / 2 };
  }

  function render(p){
    applyPose(pose(p));
    var mouth = p < .64 ? inStage(mouthEl) : mouthPour;

    var landX  = mouthPour.x + clamp(W * .14, 90, 280);
    var spread = easeOut(seg(p, .28, .52));
    var fill   = easeInOut(seg(p, .42, .86));
    var sheet  = spread * clamp(H * .035, 14, 30);
    var rimAmp = clamp(W * .045, 40, 110);
    var level  = fill * (H + 40);
    // squared: decaying linearly, the mound was still 45% tall halfway
    // through the flood and the rising surface read as a lump
    var hump   = spread * (1 - fill) * (1 - fill) * clamp(H * .2, 60, 190);
    var sigma  = W * .08 + spread * W * .14;
    var waveA  = (4 + 10 * fill) * spread;
    var k      = 2 * Math.PI / clamp(W * .45, 280, 700);
    var phase  = p * 9;                           // ripple rides the scroll
    var soft   = 20 + 60 * spread;
    var xl     = landX - spread * (landX + 60);
    var xr     = landX + spread * (W - landX + 60);

    // ── the pool, then the flood
    var top = H, d = 'M-2,' + (H + 2);
    for (var i = 0; i <= N; i++){
      var x = -2 + (W + 4) * i / N;
      var edge  = smooth(xl - soft, xl + soft, x) * (1 - smooth(xr - soft, xr + soft, x));
      var thick = edge * (sheet + level + hump * Math.exp(-Math.pow((x - landX) / sigma, 2)));
      var y;
      if (thick <= .5){
        y = H + 2;                                 // dry floor
      } else {
        y = H - thick + waveA * Math.sin(k * x + phase) * Math.min(1, thick / 40);
        y = Math.max(y, rim(x / W) * rimAmp);      // the fracture caps it
      }
      ys[i] = y;
      if (y < top) top = y;
      d += ' L' + x.toFixed(1) + ',' + y.toFixed(1);
    }
    flood.setAttribute('d', spread > 0 ? d + ' L' + (W + 2) + ',' + (H + 2) + ' Z' : '');

    // light at the surface, dark with DEPTH — laid out in stage pixels
    // from the highest point, so a thin sheet on the floor stays light
    grad.setAttribute('y1', top.toFixed(1));
    grad.setAttribute('y2', (top + H).toFixed(1));

    // ── the stream: a ribbon along a falling curve, widening where it
    //    lands; at the end it lets go of the mouth and falls away
    var head = easeIn(seg(p, .16, .34)), tail = easeIn(seg(p, .66, .76));
    if (head > tail + .002){
      var P0x = mouth.x, P0y = mouth.y, P2x = landX, P2y = H - sheet * .5;
      var P1x = P0x + (P2x - P0x) * .62, P1y = P0y + (P2y - P0y) * .06;
      var w0 = clamp(W * .011, 9, 20) * (1 - .55 * tail);
      var L = [], R = [], M = 28;
      for (var j = 0; j <= M; j++){
        var t = tail + (head - tail) * j / M, u = 1 - t;
        var bx = u * u * P0x + 2 * u * t * P1x + t * t * P2x;
        var by = u * u * P0y + 2 * u * t * P1y + t * t * P2y;
        var dx = 2 * u * (P1x - P0x) + 2 * t * (P2x - P1x);
        var dy = 2 * u * (P1y - P0y) + 2 * t * (P2y - P1y);
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var hw = w0 * (.72 + .45 * t) * (1 + 1.6 * smooth(.78, 1, t)) * .5;
        L.push((bx - dy / len * hw).toFixed(1) + ',' + (by + dx / len * hw).toFixed(1));
        R.push((bx + dy / len * hw).toFixed(1) + ',' + (by - dx / len * hw).toFixed(1));
      }
      stream.setAttribute('d', 'M' + L.join(' L') + ' L' + R.reverse().join(' L') + ' Z');
    } else {
      stream.setAttribute('d', '');
    }

    // ── the claim surfaces exactly as far as the liquid covers it
    var ci = clamp(Math.round((claimBox.cx + 2) / (W + 4) * N), 0, N);
    var surf = spread > 0 ? ys[ci] : H + 2;
    var cover = clamp((claimBox.bottom - surf) / Math.max(1, claimBox.bottom - claimBox.top), 0, 1);
    claim.style.setProperty('--c', easeOut(cover).toFixed(3));
    claim.classList.toggle('is-lit', cover > .98);
  }

  function progress(){
    var r = sec.getBoundingClientRect();
    // .62, not .8: at .8 the stage pinned at 43% progress, so most of the
    // pour happened while the section was still sliding in and the pool
    // landed half below the fold. Now the stream lands as the stage pins.
    var start = window.innerHeight * .62;
    var end = (mast ? mast.offsetHeight : 0) + H - sec.offsetHeight;   // pin releases
    return start - end < 1 ? 1 : clamp((start - r.top) / (start - end), 0, 1);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    sec.classList.add('is-still');
    measure(); render(1);
    window.addEventListener('resize', function(){ measure(); render(1); }, { passive: true });
    if (document.fonts) document.fonts.ready.then(function(){ measure(); render(1); });
    return;
  }

  var ticking = false;
  function frame(){ ticking = false; render(progress()); }
  function request(){ if (!ticking){ ticking = true; requestAnimationFrame(frame); } }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function(){ measure(); request(); }, { passive: true });
  // the claim's box depends on the webfont — re-measure once it lands
  if (document.fonts) document.fonts.ready.then(function(){ measure(); request(); });

  measure();
  render(progress());
})();


/* scroll-driven marquee — moves because the reader moves */
(function(){
  var ms = document.querySelectorAll('[data-marquee]');
  if (!ms.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ticking = false;
  function frame(){
    ms.forEach(function(m){
      var t = m.querySelector('.marquee__track');
      var r = m.getBoundingClientRect();
      var p = 1 - (r.top + r.height) / (window.innerHeight + r.height);
      t.style.transform = 'translateX(' + (-p * 42) + '%)';
    });
    ticking = false;
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  frame();
})();


/* viewer — pick a piece, the piece opens. The tab's dot opens into a
   pill and the stage's block opens out of a circle into the ground
   the product stands on. All of that is CSS; this only says which
   one is open, and keeps the tablist keyboard-navigable. */
(function(){
  var sec = document.querySelector('[data-viewer]');
  if (!sec) return;

  var tabs   = sec.querySelectorAll('.vtab');
  var panels = sec.querySelectorAll('.vpanel');
  if (!tabs.length || tabs.length !== panels.length) return;

  function open(i){
    for (var n = 0; n < tabs.length; n++){
      var on = (n === i);
      tabs[n].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[n].tabIndex = on ? 0 : -1;          // one stop for the whole rail
      panels[n].classList.toggle('is-open', on);
    }
  }

  for (var i = 0; i < tabs.length; i++){
    (function(i){
      tabs[i].addEventListener('click', function(){ open(i); });

      // the action inside panel i opens the piece AFTER it, so the
      // set can be walked without going back up to the rail
      var nx = panels[i].querySelector('[data-next]');
      if (nx) nx.addEventListener('click', function(){
        open((i + 1) % tabs.length);
      });
      tabs[i].addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + tabs.length) % tabs.length;
        tabs[n].focus();
        open(n);
      });
    })(i);
  }

  // views: each piece's strip swaps that piece's own display. Per panel,
  // so every piece remembers the view it was left on.
  for (var p = 0; p < panels.length; p++){
    (function(panel){
      var slots  = panel.querySelectorAll('.vview');
      var layers = panel.querySelectorAll('.vpanel__view');
      for (var k = 0; k < slots.length; k++){
        slots[k].addEventListener('click', function(){
          var v = this.getAttribute('data-v');
          for (var a = 0; a < slots.length; a++)
            slots[a].setAttribute('aria-pressed', slots[a] === this ? 'true' : 'false');
          for (var b = 0; b < layers.length; b++)
            layers[b].classList.toggle('is-on', layers[b].getAttribute('data-v') === v);
        });
      }
    })(panels[p]);
  }

  open(0);
})();
