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

  // Phones. There is no hover to bring the cards in with, so the
  // middle of the screen does it — the same 1% line that swaps each
  // word's face (§touch, at the end of this file). The last word to
  // cross it HOLDS until another one does: clearing whenever the line
  // sat between two words made the cards flash out and back in on
  // every word. The section clears only when it leaves the screen.
  if (window.matchMedia && window.matchMedia('(hover: none)').matches &&
      'IntersectionObserver' in window){
    var line = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) activate(e.target); });
    }, {rootMargin:'-49.5% 0px -49.5% 0px'});
    links.forEach(function(l){ line.observe(l); });
    new IntersectionObserver(function(es){
      if (!es[0].isIntersecting) clear();
    }).observe(doors);
  }
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
  var jet     = sec.querySelector('.pour__jet');
  var stream  = sec.querySelector('.pour__stream');
  var flood   = sec.querySelector('.pour__flood');
  var shards  = sec.querySelector('.pour__shards');
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
    var inn = easeOut(seg(p, .04, .18)),   out   = easeIn(seg(p, .67, .78));
    // It rights itself only after the last of the pour has left the lip
    // (.62-.70). Untipping from .64 swung the collar away from a stream
    // that was still attached, and the stream's top was left hanging in
    // the frame where the lip had been.
    var tip = easeInOut(seg(p, .10, .24)), untip = easeInOut(seg(p, .66, .73));
    return {
      x: lerp(-150, 0, inn) + lerp(0, -170, out),
      y: lerp(-40, 0, inn)  + lerp(0, -210, out),
      r: lerp(-24, 32, tip) + lerp(0, -40, untip),
      // fully absent at rest: at 0 it used to show as a black wedge at
      // the page edge while the hero was still being read
      // and gone by .75 on the way out: fading from .74 left a solid
      // sliver of it in the top corner as the flood closed in
      o: seg(p, .03, .09) * (1 - seg(p, .71, .77))
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
    if (jet) jet.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    // The mouth while pouring. Once the vessel starts to leave, the
    // stream keeps THIS origin and lets go of it, instead of stretching
    // after a bottle that is no longer pouring.
    applyPose({ x: 0, y: 0, r: 32, o: 1 });
    mouthPour = inStage(mouthEl);

    claim.style.setProperty('--c', '1');          // measure it unshifted
    var s = stage.getBoundingClientRect(), c = claim.getBoundingClientRect();
    claimBox = { top: c.top - s.top, bottom: c.bottom - s.top,
                 cx: c.left - s.left + c.width / 2,
                 l: c.left - s.left, r: c.right - s.left };
  }

  // Stretches the stretch of fill that puts the surface inside the
  // claim, leaving both ends monotone. DWELL is the share of the input
  // the crossing gets; the band is usually about .21 of the range, so
  // .40 slows it roughly twofold while it matters and speeds the rest.
  var DWELL = .55;
  function dwell(f){
    if (!claimBox || H < 2) return f;
    var span = H + 40;
    var fb = clamp((H - claimBox.bottom) / span, 0, 1);   // surface at the claim's foot
    var ft = clamp((H - claimBox.top)    / span, 0, 1);   // and at its head
    var band = ft - fb;
    if (band < .02 || band > .9) return f;                // nothing worth warping
    var before = (1 - DWELL) * fb / (1 - band);
    var after  = 1 - before - DWELL;
    if (before <= 0 || after <= 0) return f;
    // decelerate in, hold slow across the type, accelerate away. The
    // easing lives in the two outer legs rather than over the whole
    // curve, which is what an easeInOut across the lot got wrong: its
    // fastest stretch is the middle, and the middle is the one part
    // that has to be slow.
    if (f < before)         return fb * easeOut(f / before);
    if (f < before + DWELL) return fb + (f - before) / DWELL * band;
    return ft + (1 - ft) * easeIn((f - before - DWELL) / after);
  }

  function render(p){
    var q = pose(p);
    applyPose(q);
    // the live lip for as long as the jar holds still over the pour;
    // from .66 it rights itself, and the falling tail keeps the path
    // it was already on rather than being dragged after the collar
    var mouth = p < .66 ? inStage(mouthEl) : mouthPour;

    var landX  = mouthPour.x + clamp(W * .14, 90, 280);
    // ── the pour's clock. There is ONE moment in it — IMPACT, when
    //    the falling column reaches the floor — and everything else is
    //    placed against that constant rather than against a number
    //    typed separately. Before this the pool opened at .28 and the
    //    chips flew at .26 while the column did not arrive until .36,
    //    so the strike happened in mid-air with nothing under it and
    //    the chips hung in the gap with nothing to have come from.
    var IMPACT = .32;
    // Nothing leaves the lip until the jar is past level. It tips from
    // -24deg to 32deg across .10-.24 and crosses zero at about .163, so
    // a drop forming at .13 hung off a jar that was still tilted up.
    var head   = easeIn(seg(p, .17, IMPACT));   // accelerating: it is falling
    // The let-go, in the order it happens: the flow ebbs (.58-.66), the
    // last of it drops off the lip (.62-.70) while the jar is still in
    // place over it, and only then does the jar right itself and leave.
    var tail   = easeIn(seg(p, .62, .69));
    var ebb    = easeIn(seg(p, .58, .66));
    var landed = seg(head, .90, 1);             // 0 airborne, 1 arrived
    // the front has to reach the walls before the level climbs: spread
    // running to .54 while the fill began at .40 raised a pool whose
    // leading edge was still out in the frame, and the level stood up
    // behind it as a vertical wall of liquid
    var spread = easeOut(seg(p, IMPACT, .47));
    // The surface crosses the claim in about 130px of scroll if the fill
    // is linear in p, which is too fast to read — and the crossing IS
    // the section: the line is taken by the substance it is about. So
    // the fill is warped to linger exactly across the claim's own band,
    // computed from its measured box rather than from a guessed number,
    // and monotone either side so scrolling back still drains it.
    // .40, not .34: the pool has to SPREAD before it rises, or the
    // stream lands on a slab that is already half way up the frame
    // and the mound has nothing to sit on. The reference started at
    // .42 for the same reason; .40 buys back the scroll the dwell
    // needs without letting the level run ahead of the spread.
    var fRaw   = seg(p, .40, .94);
    var fill   = dwell(fRaw);
    var sheet  = spread * clamp(H * .035, 14, 30);
    var rimAmp = clamp(W * .045, 40, 110);
    var level  = fill * (H + 40);
    // squared: decaying linearly, the mound was still 45% tall halfway
    // through the flood and the rising surface read as a lump
    // decayed against the RAW fill, not the warped one. Warped, the
    // dwell holds (1-fill) high for the whole crossing, so the mound
    // was still standing when the surface reached the claim and the
    // line got read across a lump. On the raw clock it is gone by then
    // and the claim is crossed by a flat wave, which is the shape the
    // reference settles into.
    var hump   = spread * (1 - fRaw) * (1 - fRaw) * clamp(H * .2, 60, 190);
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

    // ── the column: liquid leaving a lip.
    //    Three things decide whether a pour reads as a pour, and the
    //    version before this had all three backwards.
    //
    //    1. IT IS A PARABOLA. It leaves the lip with whatever sideways
    //       speed the tip gives it and is pulled straight down from
    //       there: x is linear in time, y is quadratic. The old curve
    //       was a bezier with a control point placed by hand, which
    //       reads as an arc someone drew rather than something falling.
    //
    //    2. IT NECKS. Continuity — the same volume crosses every
    //       section each second — so where the liquid is faster it is
    //       thinner, and it is faster the further it has fallen:
    //       v = sqrt(v0^2 + 2gh) gives w = w0 / sqrt(1 + k*s^2). The
    //       old one got WIDER on the way down, which is the single
    //       thing that made it read as a hose instead of a pour.
    //
    //    3. IT LANDS ON THE LIQUID, NOT ON THE FLOOR. The fall is
    //       measured to the live surface at the landing column, so as
    //       the pool fills the stream shortens and necks less, the way
    //       it does into a glass that is filling.
    //
    //    The facets are gone from here. Zinc cleaves, and the section
    //    edges and the strike chips say so; a falling liquid does not,
    //    and faceting it read as a torn scribble hanging off the lip.
    var li2   = clamp(Math.round((landX + 2) / (W + 4) * N), 0, N);
    var surfY = Math.min(spread > 0 ? ys[li2] : H, H);
    // It ends UNDER the surface, not on it. The flood is the layer in
    // front, so the part below the waterline is hidden and the reader
    // sees the stream go into the liquid, where ending on the surface
    // left a flat end sitting on top of the pool. Before the pool
    // exists it runs off the stage floor.
    var landY = surfY + clamp(H * .045, 18, 40);
    // Once the flood has climbed past the lip there is nothing below to
    // fall into, and a parabola solved against a target above its own
    // origin bends back up the frame. The source is inside the collar,
    // so the last pixels before this cuts are already behind the metal.
    if (head > tail + .002 && surfY > mouth.y + 4){
      var drop  = landY - mouth.y;
      var runX  = landX - mouth.x;
      // It leaves along the JAR's axis, not horizontally. The tangent at
      // t=0 is the jar's own tilt, so the first cross-section runs
      // parallel to the collar's face; leaving flat, it cut across the
      // tilted lip at an angle and left a wedge of gap on one side.
      // Gravity supplies the rest, never less than 15% of the drop, or
      // the curve straightens into a ramp.
      var tilt  = Math.tan(clamp(q.r, 0, 70) * Math.PI / 180);
      var va    = clamp(runX * tilt, 0, drop * .85);
      var ga    = drop - va;
      // the flow ebbs before it lets go — the jar is running out — but
      // only to half. Thinned to 28% it detached as a hairline, and a
      // hairline falling reads as a scratch on the frame, not liquid.
      var w0    = clamp(W * .019, 15, 32) * (1 - .5 * ebb);
      var NECK  = 4.6;                       // how hard it thins on the way down
      // The bead is a share of the column, and it has to be a share of
      // the column that EXISTS. Fixed at .11 it was longer than the
      // whole stub for the first third of the fall, so the entire
      // thing rendered as tip profile and what left the lip was a
      // lump rather than a drop.
      var TIP   = Math.max(.012, Math.min(.11, (head - tail) * .45));
      var fall  = 1 - landed;                // 1 while airborne, 0 once it has arrived
      var L = [], R = [], M = 40, UC = .45, BULGE = 1.5;
      var plen  = Math.sqrt(runX * runX + drop * drop) || 1;
      var CAPT  = clamp(w0 * .6 / plen, .004, .11);   // the tail's cap, in path units
      for (var j = 0; j <= M; j++){
        // Sampled densest at BOTH ends, on cosine spacing. Each end
        // carries a curve a few pixels long on a path hundreds long —
        // the bead at the head, the round cap at the tail — and at even
        // spacing either one got a single point. Packing only the head
        // fixed the bead and left the tail's cap as a flat cut.
        var f = j / M;
        var t = tail + (head - tail) * (.5 - .5 * Math.cos(Math.PI * f));
        var bx = mouth.x + runX * t;
        var by = mouth.y + va * t + ga * t * t;
        var dx = runX, dy = va + 2 * ga * t;  // the parabola's own tangent
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var hw = w0 / Math.sqrt(1 + NECK * t * t) * .5;

        // THE HEAD. A hanging drop is a thread that swells into a round
        // bulb, and both joins have to be smooth or the silhouette
        // notches. Before UC it swells on a smoothstep, which leaves
        // the slope at zero where the two meet; after UC it is a
        // circle, which closes with a vertical tangent — a round cap,
        // not a point. The old profile was a sine times a quartic: it
        // peaked, pinched, then closed, and the pinch was the notch.
        var u = clamp((t - (head - TIP)) / TIP, 0, 1);
        var bead;
        if (u <= UC){
          bead = 1 + (BULGE - 1) * smooth(0, UC, u);
        } else {
          var x = (u - UC) / (1 - UC);
          bead = BULGE * Math.sqrt(Math.max(0, 1 - x * x));
        }
        // and where the pool takes it instead, it spreads into it
        hw *= fall * bead + (1 - fall) * (1 + 1.5 * smooth(.84, 1, t));

        // THE TAIL. Once the pour stops, the last of it lets go of the
        // lip and falls as a slug, and a slug is round at its top end
        // too — the flat cut it had there is what made it read as a
        // sliver hanging in the frame rather than liquid dropping away.
        // A quarter circle, switched on only once the tail has left the
        // lip — and as LONG as the stream is wide, because that is what
        // makes an end round. Sized as a share of the path instead, it
        // was 11% of ~400px on a thread the ebb had thinned to ~8px,
        // and the end drew out into a needle.
        var capOn = seg(tail, 0, .04);
        var v = clamp((t - tail) / CAPT, 0, 1);
        hw *= 1 - capOn * (1 - Math.sqrt(Math.max(0, 1 - (1 - v) * (1 - v))));
        L.push((bx - dy / len * hw).toFixed(1) + ',' + (by + dx / len * hw).toFixed(1));
        R.push((bx + dy / len * hw).toFixed(1) + ',' + (by - dx / len * hw).toFixed(1));
      }
      // No opacity fade. It used to fade out as the surface climbed to
      // the lip, because both ends were exposed; behind the jar and the
      // flood, the rising surface simply covers it from below until the
      // collar is all that is left in front of it.
      stream.setAttribute('d', 'M' + L.join(' L') + ' L' + R.reverse().join(' L') + ' Z');
    } else {
      stream.setAttribute('d', '');
    }

    // ── chips, where the column lands
    //    Zinc fractures on impact, so the landing throws flats rather
    //    than droplets. Eight of them, each on its own fixed vector,
    //    alive only across the strike and gone before the flood is
    //    deep enough to have a surface they would be sitting on.
    // Gated on LANDED, not on a p window of its own: chips exist
    // because the column arrived, so they cannot precede it.
    var strike = landed * (1 - seg(p, IMPACT + .08, IMPACT + .18));
    if (strike > .004){
      // off the LIVE surface at the landing column, not off the floor:
      // by the time the chips are up the flood has risen past the floor,
      // and anchored down there they read as grit in the pool instead
      // of as something the strike threw
      var li = clamp(Math.round((landX + 2) / (W + 4) * N), 0, N);
      var sd = '', sy = Math.min(ys[li], H) - 4;
      // thrown from the point of impact and pulled back down, so they
      // read as something the strike knocked loose. They used to open
      // to ±420px on a fan of their own and hang there, which is why
      // they looked like drifting confetty rather than splash.
      var throwP = seg(p, IMPACT, IMPACT + .16);
      for (var q = 0; q < 8; q++){
        var ang = -2.55 + q * .27;                // a fan, thrown upward
        // the radius steps on a stride co-prime with the fan, so the
        // short throws do not all land on the same side of the strike
        var rq  = (18 + ((q * 3) % 5) * 14) * (.3 + 1.35 * throwP);
        var cxq = landX + Math.cos(ang) * rq * 1.5;
        var cyq = sy + Math.sin(ang) * rq * .85 + throwP * throwP * 34;  // gravity takes them back
        var sq  = (5 + (q % 3) * 2.6) * strike;
        // a four-sided chip, off-square so no two read as the same flat
        sd += 'M' + (cxq - sq).toFixed(1) + ',' + cyq.toFixed(1) +
              ' L' + cxq.toFixed(1) + ',' + (cyq - sq * 1.35).toFixed(1) +
              ' L' + (cxq + sq * 1.2).toFixed(1) + ',' + (cyq + sq * .35).toFixed(1) +
              ' L' + (cxq - sq * .3).toFixed(1) + ',' + (cyq + sq).toFixed(1) + ' Z';
      }
      shards.setAttribute('d', sd);
      shards.style.opacity = (strike * .9).toFixed(3);
    } else {
      shards.setAttribute('d', '');
    }

    // ── the claim surfaces exactly as far as the liquid covers it
    var ci = clamp(Math.round((claimBox.cx + 2) / (W + 4) * N), 0, N);
    var surf = spread > 0 ? ys[ci] : H + 2;
    var cover = clamp((claimBox.bottom - surf) / Math.max(1, claimBox.bottom - claimBox.top), 0, 1);
    // --c is how far the liquid has come through the claim, eased: it
    // drives the focus, the opacity and the rise. Measured at the
    // claim's middle, which is where a reader's eye is.
    claim.style.setProperty('--c', easeOut(cover).toFixed(3));

    // --wl is where the split sits, as a fraction of the claim's own
    // height from its top: 1 is bone dry, 0 is fully under. It is cut
    // against the LOWEST point of the surface across the claim's width,
    // not the surface at its middle, because the surface is a wave and
    // the split is a straight line: measured at the middle, a trough
    // out at the last word puts wash type on a ground the liquid has
    // not reached yet — which is the very failure this rule exists to
    // stop. Taking the low point means wash only ever appears where
    // there is liquid behind it. Raw, not eased: a position, not a
    // feeling, and easing it would float the split off the surface.
    var il = clamp(Math.floor((claimBox.l + 2) / (W + 4) * N), 0, N);
    var ir = clamp(Math.ceil((claimBox.r + 2) / (W + 4) * N), 0, N);
    var low = -1e9;
    for (var m = il; m <= ir; m++) if (ys[m] > low) low = ys[m];
    if (spread <= 0) low = H + 2;
    var safe = clamp((claimBox.bottom - low) / Math.max(1, claimBox.bottom - claimBox.top), 0, 1);
    claim.style.setProperty('--wl', (1 - safe).toFixed(3));
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


/* scrub — the reader's scroll is the pour (Origin, §origin "reading
   pours"). Every [data-scrub] element gets its progress written as a
   custom property, 0 to 1, and CSS decides what that pours. This
   file never styles anything itself.

     data-scrub            passes: 0 when its top is at 90% of the
                           viewport, 1 when its top reaches 45%
     data-scrub="pin"      a tall section whose stage sticks: 0 when
                           its top is at 60%, 1 when its bottom meets
                           the bottom of the viewport
     data-scrub-start/-end override those fractions
     data-scrub-var        the property to write (default --p)
     data-scrub-to         write it on the closest ancestor matching
                           this selector instead of on the element
     data-scrub-rest       the value to hold under reduced motion
                           (default 1, the finished state)

   [data-pour-words] is split into word spans carrying --i, with --n
   on the container, so a paragraph can pour a word at a time.

   Reduced motion writes the rest values once and never pins: the tall
   pinned heights only exist under html.has-scrub, added here. Reads
   every rectangle first and writes after, so a frame costs one layout. */
(function(){
  var pours = document.querySelectorAll('[data-pour-words]');
  for (var w = 0; w < pours.length; w++){
    var box = pours[w], words = box.textContent.trim().split(/\s+/);
    box.textContent = '';
    for (var i = 0; i < words.length; i++){
      if (i) box.appendChild(document.createTextNode(' '));
      var span = document.createElement('span');
      span.className = 'pw';
      span.style.setProperty('--i', i);
      span.textContent = words[i];
      box.appendChild(span);
    }
    box.style.setProperty('--n', words.length);
  }

  var els = document.querySelectorAll('[data-scrub]');
  if (!els.length) return;
  var root = document.documentElement;
  var items = [];
  for (var k = 0; k < els.length; k++){
    var el = els[k], to = el.getAttribute('data-scrub-to');
    items.push({
      el: el,
      out: (to && el.closest(to)) || el,
      name: el.getAttribute('data-scrub-var') || '--p',
      pin: el.getAttribute('data-scrub') === 'pin',
      start: parseFloat(el.getAttribute('data-scrub-start')),
      end: parseFloat(el.getAttribute('data-scrub-end')),
      rest: el.hasAttribute('data-scrub-rest') ? el.getAttribute('data-scrub-rest') : '1',
      last: -1
    });
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    items.forEach(function(it){ it.out.style.setProperty(it.name, it.rest); });
    return;
  }
  root.classList.add('has-scrub');

  var mast = document.querySelector('.masthead');
  function measureMast(){ if (mast) root.style.setProperty('--mast-h', mast.offsetHeight + 'px'); }

  function clamp01(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function progress(it, r, vh){
    if (it.pin){
      var from = vh * (isNaN(it.start) ? .6 : it.start);
      var to = vh - r.height;                       // bottom meets the viewport bottom
      return from === to ? 1 : clamp01((from - r.top) / (from - to));
    }
    var s = vh * (isNaN(it.start) ? .9 : it.start);
    var e = vh * (isNaN(it.end) ? .45 : it.end);
    return clamp01((s - r.top) / (s - e));
  }

  var ticking = false;
  function frame(){
    ticking = false;
    var vh = window.innerHeight, values = [];
    for (var n = 0; n < items.length; n++)
      values.push(progress(items[n], items[n].el.getBoundingClientRect(), vh));
    for (var m = 0; m < items.length; m++){
      var v = Math.round(values[m] * 1000) / 1000;
      if (v !== items[m].last){ items[m].last = v; items[m].out.style.setProperty(items[m].name, v); }
    }
  }
  function request(){ if (!ticking){ ticking = true; requestAnimationFrame(frame); } }

  measureMast();
  frame();
  window.addEventListener('scroll', request, {passive:true});
  window.addEventListener('resize', function(){ measureMast(); request(); }, {passive:true});
  if (document.fonts) document.fonts.ready.then(function(){ measureMast(); request(); });
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

  // Phones: swipe the piece. The rail and the action are still there,
  // but the thumb's own gesture for "the next one" is a flick across
  // the thing itself. A flick counts when it travels more than 48px,
  // mostly sideways, inside 700ms. The stage is touch-action:pan-y
  // (brand.css), so an upward or downward drag is handed to the page
  // and can never be mistaken for a swipe or steal a scroll.
  var stage = sec.querySelector('.viewer__stage');
  if (stage && window.PointerEvent){
    var sx = 0, sy = 0, st = 0, track = false;
    stage.addEventListener('pointerdown', function(e){
      if (e.pointerType !== 'touch') return;
      track = true; sx = e.clientX; sy = e.clientY; st = Date.now();
    }, {passive:true});
    stage.addEventListener('pointerup', function(e){
      if (!track) return;
      track = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4 || Date.now() - st > 700) return;
      var cur = 0;
      for (var n = 0; n < tabs.length; n++) if (tabs[n].getAttribute('aria-selected') === 'true') cur = n;
      open((cur + (dx < 0 ? 1 : tabs.length - 1)) % tabs.length);
    }, {passive:true});
    stage.addEventListener('pointercancel', function(){ track = false; }, {passive:true});
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


/* touch — no cursor, so the middle of the screen stands in for one
   (docs/tokens.md: scroll can stand in for the cursor). On a device
   that cannot hover, each of these things gets .is-pointed while it
   crosses the middle band of the viewport, and brand.css (§touch)
   gives it its hover state. The "middle" is a line 1% of the screen
   tall: at 16% the homepage's three stacked door words all sat inside
   it and swapped faces together (measured: 3 pointed at once). On a
   line, stacked things take turns, and a full-screen Elements band
   holds it for as long as it covers the middle of the screen.

   The empty touchstart listener is what lets iOS Safari apply :active,
   which is how buttons fill while pressed. */
(function(){
  if (!window.matchMedia || !window.matchMedia('(hover: none)').matches) return;
  document.addEventListener('touchstart', function(){}, {passive:true});
  if (!('IntersectionObserver' in window)) return;
  var els = document.querySelectorAll('.piece, .door, .kit__item, .door-band, .fuel-tub');
  if (!els.length) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ e.target.classList.toggle('is-pointed', e.isIntersecting); });
  }, {rootMargin:'-49.5% 0px -49.5% 0px'});
  els.forEach(function(el){ io.observe(el); });
})();


/* liquid titles, on a phone. The page titles pour to half on load and
   on a desktop the rest of the way under the cursor. With no cursor, a
   tap does it: the word fills, holds for a moment, and settles back to
   half, which is where the page left it. Only titles that are not
   inside a link — a linked one navigates on the tap, so there would be
   nothing left on screen to watch fill. */
(function(){
  if (!window.matchMedia || !window.matchMedia('(hover: none)').matches) return;
  var titles = document.querySelectorAll('.liq-type');
  for (var i = 0; i < titles.length; i++){
    (function(t){
      if (t.closest('a')) return;
      t.addEventListener('click', function(){
        t.classList.add('is-poured');
        clearTimeout(t._settle);
        t._settle = setTimeout(function(){ t.classList.remove('is-poured'); }, 1900);
      });
    })(titles[i]);
  }
})();


/* the bloom leaves with its headline. It belongs to the hero — one
   glow, behind one line — so it does NOT follow the reader down the
   page: lit everywhere, it would point at nothing, and the sections
   below are meant to be flat black. But scrolled away at the speed of
   the text it read as a sticker being pushed off the page. So it
   drifts at a fraction of the scroll and dims as the hero goes, and
   what the reader sees is light going out rather than an object
   leaving. Writes --exit, 0 in view to 1 gone; brand.css spends it. */
(function(){
  var hero = document.querySelector('.has-cut');
  if (!hero || !hero.querySelector('.cut--bloom')) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var raf = 0;
  function update(){
    raf = 0;
    var r = hero.getBoundingClientRect();
    var exit = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
    hero.style.setProperty('--exit', exit.toFixed(3));
  }
  window.addEventListener('scroll', function(){
    if (!raf) raf = requestAnimationFrame(update);
  }, {passive:true});
  update();
})();
