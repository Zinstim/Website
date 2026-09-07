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


/* runway — scroll drives track, multi-product crossfade, drift, specs, steps & progress */
(function(){
  var sec = document.querySelector('[data-runway]');
  if (!sec) return;
  var items    = sec.querySelectorAll('[data-item]');
  var lane     = sec.querySelector('[data-lane]');
  var count    = sec.querySelector('[data-count]');
  var progress = sec.querySelector('[data-progress]');
  var drifts   = sec.querySelectorAll('[data-drift]');
  var specs    = sec.querySelectorAll('.spec');
  var steps    = sec.querySelectorAll('.runway__step');
  var reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking  = false, lastStep = -1;

  function frame(){
    var r = sec.getBoundingClientRect(), total = r.height - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;

    // 1. Progress bar width
    if (progress) {
      progress.style.width = (p * 100) + '%';
    }

    // 2. Active step index across products (0, 1, 2)
    var numSteps = Math.max(items.length, specs.length, 3);
    var stepIndex = Math.min(numSteps - 1, Math.floor(p * numSteps));

    // 3. Product travel. With several products this crossfades between
    //    them; with one it simply travels the length of the track.
    //    (.runway__item is opacity:0 until .is-visible, so a single
    //    product must never be stepped out of view — it would leave
    //    the track empty for two thirds of the scroll.)
    var single = items.length < 2;
    items.forEach(function(item, idx){
      var isCur = single || (idx === stepIndex);
      item.classList.toggle('is-visible', isCur);
      if (reduce) return;

      if (single) {
        item.style.transform = 'translate(-50%, -50%) translateY(' + ((p - 0.5) * 46) + '%) rotate(' + ((p - 0.5) * 5) + 'deg)';
        item.style.opacity = 1;
        return;
      }

      var localP = (p * numSteps) - idx - 0.5; // [-0.5, 0.5]
      var yShift = localP * 20;
      var rot = localP * 8;
      var scale = isCur ? 1 - Math.abs(localP * 0.2) : 0.8;
      item.style.transform = 'translate(-50%, -50%) translateY(' + yShift + '%) rotate(' + rot + 'deg) scale(' + scale + ')';
      item.style.opacity = isCur ? 1 - Math.abs(localP * 1.5) : 0;
    });

    // 4. Parallax lane & drift elements
    if (!reduce) {
      if (lane) lane.style.backgroundPosition = '0 ' + (p * 1100) + 'px';
      drifts.forEach(function(d){
        var speed = parseFloat(d.dataset.drift) || 1;
        d.style.transform = 'translateY(' + (p * 140 * speed) + '%)';
      });
    }

    // 5. Update step text, specs, and counter
    if (stepIndex !== lastStep) {
      specs.forEach(function(s, n){
        s.classList.toggle('is-active', n === stepIndex);
      });
      steps.forEach(function(st, n){
        st.classList.toggle('is-active', n === stepIndex);
      });
      if (count) {
        count.textContent = '0' + (stepIndex + 1) + ' / 0' + numSteps;
      }
      lastStep = stepIndex;
    }

    ticking = false;
  }

  function onScroll(){
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  }

  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', onScroll);
  frame();
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
