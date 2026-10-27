/* ─────────────────────────────────────────────────────────────────
   title.js — the mark assembles. Origin only.

   Ported from the transition lab, experiment 03. The timings here
   are the lab's, measured rather than guessed, and they are the
   point of the file: a fixed timeline, not random, so it runs the
   same way every time.

   The first half DECELERATES — 48ms out to 300ms. A sequence that
   speeds up arrives nowhere; one that slows down arrives at the
   mark. It ends on the white tee, big, then black.

   Nothing here touches the DOM outside #seq.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var st = document.getElementById('seq');
  if (!st) return;

  /* Arm the stage. Until this line runs, CSS keeps the finished
     lockup on screen, so a visitor with no JavaScript sees the mark
     instead of a black rectangle. */
  st.classList.add('is-armed');

  var reduce = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* old browser: treat as motion allowed */ }

  var CUT = 'assets/img/product/cut/';
  var IMG = 'assets/img/product/';

  /* The seven cut-outs, by file name. */
  var CUTS = ['spine', 'white-back', 'spine-2', 'fold', 'tagline', 'scatter', 'collar'];

  /* The two full frames are the printed mark on cloth, lit two ways.
     NOTE the repo's file names do not match their contents: mark.webp
     is the BRIGHT frame (mean luminance 108) and mark-lit.webp is the
     DARK red one (39). The beat list alternates bright and dark on
     purpose, so these are keyed by what they look like, not by what
     they are called. */
  var FULLS = { lit: IMG + 'mark.webp', red: IMG + 'mark-lit.webp' };

  var nodes = {};

  CUTS.forEach(function (n) {
    var el = document.createElement('img');
    el.className = 'seq__cut';
    el.src = CUT + n + '.webp';
    el.alt = '';
    el.decoding = 'async';
    el.setAttribute('aria-hidden', 'true');
    st.insertBefore(el, st.firstChild);
    nodes[n] = el;
  });

  Object.keys(FULLS).forEach(function (k) {
    var el = document.createElement('img');
    el.className = 'seq__full';
    el.src = FULLS[k];
    el.alt = '';
    el.decoding = 'async';
    el.setAttribute('aria-hidden', 'true');
    st.insertBefore(el, st.firstChild);
    nodes[k] = el;
  });

  /* x/y are percentages of the stage, h is height as a percentage,
     r is rotation in degrees, t is the gap BEFORE the next beat, and
     f marks the beats that carry a frame of light.

     The mark frames sit in the fast opening, the garments take over
     as it slows, and the last thing before the black is the white
     tee, big and square on. */
  var BEATS = [
    { k: 'scatter',    x: 42, y: 60, h: 74,  r: -6,  t: 48,  f: 1 },
    { full: 'lit',                                   t: 52 },
    { k: 'spine-2',    x: 78, y: 34, h: 72,  r: 7,   t: 58,  f: 1 },
    { full: 'red',                                   t: 65 },
    { k: 'collar',     x: 66, y: 70, h: 62,  r: -9,  t: 74,  f: 1 },
    { k: 'spine',      x: 34, y: 36, h: 100, r: 12,  t: 85 },
    { full: 'lit',                                   t: 98 },
    { k: 'fold',       x: 80, y: 44, h: 58,  r: -5,  t: 114 },
    { full: 'red',                                   t: 133 },
    { k: 'scatter',    x: 68, y: 28, h: 66,  r: -11, t: 156 },
    { k: 'tagline',    x: 74, y: 62, h: 52,  r: -8,  t: 183 },
    { k: 'collar',     x: 22, y: 30, h: 70,  r: 6,   t: 215 },
    { k: 'spine',      x: 52, y: 46, h: 92,  r: -3,  t: 252 },
    { k: 'white-back', x: 50, y: 50, h: 118, r: 0,   t: 300 }
  ];

  var flash  = st.querySelector('[data-seq-flash]');
  var mark   = st.querySelector('[data-seq-mark]');
  var zSvg   = st.querySelector('[data-seq-z]');
  var zFab   = st.querySelector('[data-seq-fabric]');
  var zMark  = st.querySelector('[data-seq-art]');
  var word   = st.querySelector('[data-seq-word]');
  var codeE  = st.querySelector('[data-seq-code]');
  var btn    = st.querySelector('[data-seq-replay]');
  if (!flash || !mark || !zSvg || !zFab || !zMark || !word) return;

  var ltrs   = word.querySelectorAll('span');
  var timers = [];
  var running = false;
  var EASE = 'cubic-bezier(.16,1,.3,1)';       /* = --ease-out */
  var HOLD = 1500;    /* time on the finished lockup before it resets */
  var FADE = 700;     /* the lockup dissolving back to black */
  var inView = false; /* only loop while someone can actually see it */
  var REST = 'ZS—01 · TRAINING';

  function place(el, b) {
    el.style.height = b.h + '%';
    el.style.left = b.x + '%';
    el.style.top = b.y + '%';
    el.style.transform = 'translate(-50%,-50%) rotate(' + b.r + 'deg)';
  }

  function hideFrames() {
    CUTS.forEach(function (n) { nodes[n].classList.remove('is-on'); });
    nodes.lit.classList.remove('is-on');
    nodes.red.classList.remove('is-on');
    flash.classList.remove('is-on', 'is-red');
  }

  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

  /* How far the Z has to start DOWN so it reads as centred in the
     frame before it rises into the lockup. Measured, not assumed,
     because it depends on the letters' height at the current font
     size — which is a clamp, so it changes with the viewport. */
  function dropFor() {
    var t = mark.getBoundingClientRect();
    var z = zSvg.getBoundingClientRect();
    return (t.top + t.height / 2) - (z.top + z.height / 2);
  }

  /* The finished state. Also the state the page sits in before
     anything has run, and the only state a reduced-motion visitor
     ever sees — complete, not blank. */
  function settle() {
    mark.classList.add('is-on');
    zSvg.style.opacity = '1';
    zSvg.style.transform = 'none';
    zSvg.style.filter = 'none';
    zFab.setAttribute('opacity', '0');
    zMark.setAttribute('opacity', '1');
    for (var i = 0; i < ltrs.length; i++) {
      ltrs[i].style.opacity = '1';
      ltrs[i].style.transform = 'none';
    }
    if (codeE) codeE.textContent = REST;
  }

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    if (st.getAnimations) {
      st.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    }
    hideFrames();
    mark.classList.remove('is-on');
    zSvg.style.opacity = '0';
    zSvg.style.transform = 'none';
    zSvg.style.filter = 'none';
    zFab.setAttribute('opacity', '1');
    zMark.setAttribute('opacity', '0');
    for (var i = 0; i < ltrs.length; i++) {
      ltrs[i].style.opacity = '0';
      ltrs[i].style.transform = 'none';
    }
  }

  function run() {
    if (running) return;
    running = true;
    if (btn) btn.disabled = true;
    reset();

    if (reduce) {
      settle();
      running = false;
      if (btn) btn.disabled = false;
      return;
    }

    /* ── 1. the flashes, slowing down ── */
    var t = 0;
    BEATS.forEach(function (b, i) {
      at(t, function () {
        hideFrames();
        var el = nodes[b.full || b.k];
        if (!b.full) place(el, b);
        el.classList.add('is-on');
        if (codeE) {
          codeE.textContent =
            (i + 1 < 10 ? '0' : '') + (i + 1) + ' / ' + BEATS.length;
        }
        if (b.f) {
          flash.classList.toggle('is-red', i % 2 === 0);
          flash.classList.add('is-on');
          at(t + 30, function () { flash.classList.remove('is-on'); });
        }
      });
      t += b.t;
    });

    /* ── 2. the hole. Long enough to read as an absence. ── */
    at(t, function () {
      hideFrames();
      if (codeE) codeE.textContent = '';
    });
    t += 300;

    /* ── 3. the Z arrives, cut out of the fabric, centred ── */
    var drop = 0;
    at(t, function () {
      mark.classList.add('is-on');
      drop = dropFor();
      zSvg.animate(
        [{ opacity: 0, transform: 'translateY(' + drop + 'px) scale(1.3)', filter: 'blur(8px)' },
         { opacity: 1, transform: 'translateY(' + drop + 'px) scale(1)',   filter: 'blur(0)' }],
        { duration: 1300, easing: EASE, fill: 'forwards' }
      );
    });
    t += 1300 + 340;

    /* ── 4. the fabric Z becomes the real mark — carbon weave, bevel
           and all. The same shape gaining its skin. ── */
    at(t, function () {
      var o = { duration: 1050, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' };
      zMark.animate([{ opacity: 0 }, { opacity: 1 }], o);
      zFab.animate([{ opacity: 1 }, { opacity: 0 }], o);
    });
    t += 1050 + 320;

    /* ── 5. the Z rises out of the middle and the letters fall in
           behind it. They cross — that is the whole move. ── */
    at(t, function () {
      zSvg.animate(
        [{ transform: 'translateY(' + drop + 'px)' }, { transform: 'translateY(0)' }],
        { duration: 1700, easing: 'cubic-bezier(.32,.72,.24,1)', fill: 'forwards' }
      );
    });
    for (var i = 0; i < ltrs.length; i++) {
      (function (el, n) {
        at(t + 420 + n * 120, function () {
          el.animate(
            [{ opacity: 0, transform: 'translateY(-1.3em) scaleY(1.4)' },
             { opacity: 1, transform: 'translateY(0) scaleY(1)' }],
            { duration: 780, easing: EASE, fill: 'forwards' }
          );
        });
      })(ltrs[i], i);
    }
    t += Math.max(1700, 420 + (ltrs.length - 1) * 120 + 780);

    at(t, function () {
      if (codeE) codeE.textContent = REST;
      running = false;
      if (btn) btn.disabled = false;

      /* Hold on the finished lockup long enough to read it, take the
         screen to black, and go again. The fade is the loop's seam —
         cutting straight back to the first flash reads as a glitch,
         and black is where the sequence already starts. */
      at(HOLD, function () {
        if (!inView || reduce) return;
        var out = mark.animate([{ opacity: 1 }, { opacity: 0 }],
                               { duration: FADE, easing: 'ease', fill: 'forwards' });
        var again = function () { if (inView && !reduce) run(); };
        if (out.finished && out.finished.then) out.finished.then(again)['catch'](function () {});
        else at(HOLD + FADE, again);
      });
    });
  }

  if (btn) {
    btn.hidden = false;
    btn.addEventListener('click', function (e) { e.stopPropagation(); run(); });
  }
  st.addEventListener('click', run);

  /* It loops, so it has to stop when nobody is looking: a full-screen
     flash sequence running against the back of a scrolled page is
     wasted work on a phone. Visibility drives it both ways. */
  function halt() {
    timers.forEach(clearTimeout);
    timers = [];
    if (st.getAnimations) {
      st.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    }
    /* settle() restores the lockup but says nothing about the thrown
       frames, so without this a halt mid-flash leaves one garment
       frozen on screen behind the mark. */
    hideFrames();
    running = false;
    settle();
  }

  /* ── readiness, not timing ─────────────────────────────────────
     The frames above are created with a `src` and nothing ever waited
     for them. On a COLD cache the observer fires the moment the page
     loads, run() calls reset() — which wipes the settled lockup — and
     fourteen beats then play on a fixed setTimeout schedule against
     695KB of imagery that has not painted. Measured: 1.5s of black
     with the counter ticking "08 / 14" against nothing, and a full
     9.2s loop of black when the network is slow. Warm loads paint in
     4–30ms, which is why this never showed in testing.

     So the sequence now waits until its own pictures can actually be
     drawn. Until then the page holds the finished lockup — the same
     thing it shows with JavaScript off, and a better first frame than
     black either way. A broken or very slow image must not hold it
     for ever, so the wait is capped. */
  var ready = false, waiting = null;

  function whenReady(fn) {
    if (ready) { fn(); return; }
    if (!waiting) {
      var jobs = Object.keys(nodes).map(function (k) {
        var im = nodes[k];
        if (im.decode) return im.decode()['catch'](function () {});
        if (im.complete) return Promise.resolve();
        return new Promise(function (go) { im.onload = im.onerror = go; });
      });
      waiting = Promise.race([
        Promise.all(jobs),
        new Promise(function (go) { setTimeout(go, 6000); })
      ]);
    }
    waiting.then(function () { ready = true; fn(); });
  }

  function play() {
    whenReady(function () { if (inView && !running && !reduce) run(); });
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      var vis = es[0].intersectionRatio > 0.4;
      if (vis === inView) return;
      inView = vis;
      if (inView) play();
      else halt();
    }, { threshold: [0, 0.4, 1] }).observe(st);
  } else {
    settle();
  }

  try {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) halt();
      else play();
    });
  } catch (e) {}

  settle();   /* complete at rest, before anything has run */
}());
