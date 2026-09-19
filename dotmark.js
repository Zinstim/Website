/* ZinStim — interactive dotmark.
   Canvas-based particle system that reads text pixels and repels from cursor.
   Runs only when visible to save battery. */
(function() {
  const canvas = document.querySelector('[data-dotmark-canvas]');
  if (!canvas) return;
  // alpha:false paints an opaque black canvas, which on a night page reads
  // as a rectangle cut out of the ground. The canvas has to be see-through.
  const ctx = canvas.getContext('2d');
  let particles = [];
  // A fingertip covers far more than a cursor's point, so on a coarse
  // pointer the dots clear a wider circle — at 80 a thumb rubbing the
  // word moved so few of them it read as nothing happening.
  const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const touch  = !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
  let mouse = { x: -9999, y: -9999, radius: coarse ? 105 : 80 };
  let width, height;
  let stacked = false;
  let isRunning = false;
  let asleep = false;
  let animFrame;

  // Use brand colors from CSS variables
  const rootStyle = getComputedStyle(document.documentElement);
  let dotColor = rootStyle.getPropertyValue('--graphite').trim() || '#6E7679';
  let bgColor = rootStyle.getPropertyValue('--zinc-wash').trim() || '#E9ECEE';
  
  const isDark = canvas.closest('.band--dark, .night') !== null;
  if (isDark) {
    dotColor = rootStyle.getPropertyValue('--muted').trim() || '#828C90';
    bgColor = rootStyle.getPropertyValue('--obsidian').trim() || '#0D0D0D';
  }

  function init() {
    const parent = canvas.parentElement;
    // clientWidth INCLUDES the container's padding, so using it raw makes
    // the canvas wider than the space it actually sits in — which put a
    // horizontal scrollbar on every page carrying the wordmark at any
    // viewport narrower than the shell's max-width. Subtract the padding.
    const pad = getComputedStyle(parent);
    width = parent.clientWidth
          - (parseFloat(pad.paddingLeft) || 0)
          - (parseFloat(pad.paddingRight) || 0);
    // A parent that is hidden, or not laid out yet, gives 0 or negative
    // here — and getImageData throws IndexSizeError on a zero-width
    // source, which killed the whole script. Bail quietly instead; the
    // resize handler calls init again once the layout settles.
    if (width < 1) { particles = []; return; }
    // Narrow screens set the word on TWO lines — ZIN over STIM, zinc and
    // stimulus, the two halves the name is made of — so each half can be
    // as large as the width allows. On one line at 360 it was a 54px
    // word in a 70px strip; stacked it is ~140px a line in a band nearly
    // as tall as the screen is wide, which is the room a sign-off needs.
    stacked = width < 600;
    height = stacked ? Math.round(width * 0.86) : Math.min(200, width * 0.2);
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    createParticles();
    // new particles need a frame even if the loop had gone to sleep on
    // the old ones — the webfont arriving is exactly that case
    wake();
  }

  function createParticles() {
    particles = [];
    const offscreen = document.createElement('canvas');
    const octx = offscreen.getContext('2d', { willReadFrequently: true });
    offscreen.width = width;
    offscreen.height = height;
    
    octx.fillStyle = 'white';
    if (stacked) {
      // Fit the longer half to the width by MEASURING it, then set both
      // halves at that size, flush left like every headline on a phone.
      // The two lines sit one cap height plus a small gap apart, centred
      // in the band (Archivo at 900 has a cap height of about .72em).
      octx.font = '900 100px "Archivo", system-ui, sans-serif';
      octx.letterSpacing = '-0.04em';
      const wide = Math.max(octx.measureText('STIM').width, octx.measureText('ZIN').width);
      const fs = Math.floor(100 * (width * 0.97) / wide);
      octx.font = `900 ${fs}px "Archivo", system-ui, sans-serif`;
      octx.letterSpacing = '-0.04em';
      octx.textAlign = 'left';
      octx.textBaseline = 'alphabetic';
      const cap = fs * 0.72, gap = fs * 0.14;
      const top = (height - (cap * 2 + gap)) / 2;
      octx.fillText('ZIN', 0, top + cap);
      octx.fillText('STIM', 0, top + cap * 2 + gap);
    } else {
      const fontSize = Math.min(height * 0.8, width * 0.15);
      octx.font = `900 ${fontSize}px "Archivo", system-ui, sans-serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.letterSpacing = '-0.04em';
      octx.fillText('ZINSTIM', width / 2, height / 2);
    }
    
    const imgData = octx.getImageData(0, 0, width, height).data;
    // A slightly finer pitch on the stacked word, so its ~140px letters
    // carry six or so dots across every stroke. Dot size follows the
    // pitch so the coverage stays the same.
    const step = stacked ? 5 : 6;
    const dot  = step * 0.26;
    
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = imgData[index + 3];
        if (alpha > 128) {
          particles.push({
            x: x + (Math.random() - 0.5) * 2,
            y: y + (Math.random() - 0.5) * 2,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
            size: dot
          });
        }
      }
    }
  }

  function animate() {
    if (!isRunning) return;
    
    // on a night page the canvas stays transparent, so the page's own
    // ground and its bloom show through instead of a black rectangle
    if (isDark) { ctx.clearRect(0, 0, width, height); }
    else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, width, height); }
    
    ctx.fillStyle = dotColor;
    let moving = false;
    
    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      let dx = mouse.x - p.x;
      let dy = mouse.y - p.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      
      let forceDirectionX = dx / dist;
      let forceDirectionY = dy / dist;
      
      let force = (mouse.radius - dist) / mouse.radius;
      if (force < 0) force = 0;
      
      let directionX = forceDirectionX * force * 5;
      let directionY = forceDirectionY * force * 5;
      
      if (dist < mouse.radius) {
        p.vx -= directionX;
        p.vy -= directionY;
      }
      
      p.vx += (p.baseX - p.x) * 0.1;
      p.vy += (p.baseY - p.y) * 0.1;
      
      p.vx *= 0.8;
      p.vy *= 0.8;
      
      p.x += p.vx;
      p.y += p.vy;
      if (!moving && (Math.abs(p.vx) + Math.abs(p.vy) > 0.02 ||
          Math.abs(p.x - p.baseX) + Math.abs(p.y - p.baseY) > 0.3)) moving = true;
      
      ctx.fillRect(p.x, p.y, p.size * 2, p.size * 2);
    }
    
    // Sleep once every dot is home and nothing is pressing on them. It
    // used to redraw all of them sixty times a second for as long as the
    // footer was on screen, which on a phone is battery spent on a still
    // picture. The last frame stays on the canvas; input or an arrival
    // wakes it.
    if (!moving && mouse.x < -999) { asleep = true; return; }
    animFrame = requestAnimationFrame(animate);
  }

  function wake() {
    if (isRunning && asleep) { asleep = false; animFrame = requestAnimationFrame(animate); }
  }

  // THE ARRIVAL, on a phone. With no cursor the word has nothing to
  // answer, and most readers will scroll past it rather than touch it,
  // so it answers the scroll instead: each time it comes into view the
  // dots are thrown out around their places and the same spring that
  // pulls them back from a finger pulls them in — the wordmark pours
  // together as the page ends.
  function scatter() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 64;
      p.x = p.baseX + Math.cos(a) * d;
      p.y = p.baseY + Math.sin(a) * d * 0.6;
      p.vx = 0; p.vy = 0;
    }
    asleep = false;
  }

  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animFrame);
      init();
      asleep = false;
      if (isRunning) animate();
    }, 200);
  });

  // Pointer events, so a finger drives it exactly as a cursor does.
  // Mouse-only listeners never fire during a touch, which is why the
  // word was a still picture on every phone. The canvas is
  // touch-action:pan-y (brand.css): rub sideways across the word and
  // the dots scatter under the finger; drag up or down and the page
  // scrolls as normal and the dots settle back.
  function point(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    wake();
  }
  function release() { mouse.x = -9999; mouse.y = -9999; wake(); }
  canvas.addEventListener('pointermove', point);
  canvas.addEventListener('pointerdown', point);
  canvas.addEventListener('pointerleave', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') release(); });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!isRunning) {
          isRunning = true;
          asleep = false;
          animate();
        }
      } else {
        isRunning = false;
        cancelAnimationFrame(animFrame);
      }
    });
    io.observe(canvas);

    // the arrival fires when the word is well into view rather than at
    // its first pixel, so the pour is seen rather than finished off
    // screen — and re-arms only once the word has fully left
    if (touch && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      let armed = true;
      new IntersectionObserver((entries) => {
        const e = entries[0];
        if (e.intersectionRatio >= 0.6 && armed) { armed = false; scatter(); wake(); }
        else if (!e.isIntersecting) armed = true;
      }, { threshold: [0, 0.6] }).observe(canvas);
    }
  } else {
    isRunning = true;
    animate();
  }

  if (document.fonts) {
    document.fonts.ready.then(init);
  } else {
    setTimeout(init, 500);
  }
})();
