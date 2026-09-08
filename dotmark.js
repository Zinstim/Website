/* ZinStim — interactive dotmark.
   Canvas-based particle system that reads text pixels and repels from cursor.
   Runs only when visible to save battery. */
(function() {
  const canvas = document.querySelector('[data-dotmark-canvas]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  let particles = [];
  let mouse = { x: -9999, y: -9999, radius: 80 };
  let width, height;
  let isRunning = false;
  let animFrame;

  // Use brand colors from CSS variables
  const rootStyle = getComputedStyle(document.documentElement);
  let dotColor = rootStyle.getPropertyValue('--graphite').trim() || '#6E7679';
  let bgColor = rootStyle.getPropertyValue('--zinc-wash').trim() || '#E9ECEE';
  
  const isDark = canvas.closest('.band--dark') !== null;
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
    height = Math.min(200, width * 0.2);
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    createParticles();
  }

  function createParticles() {
    particles = [];
    const offscreen = document.createElement('canvas');
    const octx = offscreen.getContext('2d', { willReadFrequently: true });
    offscreen.width = width;
    offscreen.height = height;
    
    const fontSize = Math.min(height * 0.8, width * 0.15);
    octx.font = `900 ${fontSize}px "Archivo", system-ui, sans-serif`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillStyle = 'white';
    octx.letterSpacing = '-0.04em';
    
    // Polyfill letterSpacing for older canvas API if needed, but modern browsers support it
    octx.fillText('ZINSTIM', width / 2, height / 2);
    
    const imgData = octx.getImageData(0, 0, width, height).data;
    const step = 6;
    
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
            size: 1.5
          });
        }
      }
    }
  }

  function animate() {
    if (!isRunning) return;
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = dotColor;
    
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
      
      ctx.fillRect(p.x, p.y, p.size * 2, p.size * 2);
    }
    
    animFrame = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animFrame);
      init();
      if (isRunning) animate();
    }, 200);
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!isRunning) {
          isRunning = true;
          animate();
        }
      } else {
        isRunning = false;
        cancelAnimationFrame(animFrame);
      }
    });
    io.observe(canvas);
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
