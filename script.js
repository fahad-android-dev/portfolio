gsap.registerPlugin(ScrollTrigger);

// Lightweight TextScrambler (GSAP-like scramble effect without plugin)
class TextScrambler {
  constructor(el, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-={}[]<>?/') {
    this.el = el;
    this.chars = chars;
    this.frame = 0;
    this.queue = [];
    this.rAF = null;
  }
  randomChar() { return this.chars[Math.floor(Math.random() * this.chars.length)]; }
  setText(newText, opts = {}) {
    const { duration = 1.0, fromBlank = false } = opts;
    const oldText = fromBlank ? ''.padEnd(newText.length, ' ') : (this.el.textContent || '');
    const length = Math.max(oldText.length, newText.length);
    const framesTotal = Math.max(8, Math.round(60 * duration));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || ' ';
      const to = newText[i] || ' ';
      const start = Math.floor(Math.random() * Math.min(20, framesTotal * 0.4));
      const end = start + Math.floor(Math.random() * Math.min(30, framesTotal * 0.6)) + 6;
      this.queue.push({ from, to, start, end, char: '' });
    }
    cancelAnimationFrame(this.rAF);
    this.frame = 0;
    const update = () => {
      let output = '';
      let complete = 0;
      for (let i = 0, n = this.queue.length; i < n; i++) {
        const q = this.queue[i];
        if (this.frame >= q.end) {
          complete++;
          output += q.to;
        } else if (this.frame >= q.start) {
          if (!q.char || Math.random() < 0.28) q.char = this.randomChar();
          output += q.char;
        } else {
          output += q.from;
        }
      }
      this.el.textContent = output;
      if (complete === this.queue.length) {
        // done
        this.rAF = null;
        return;
      }
      this.frame++;
      this.rAF = requestAnimationFrame(update);
    };
    update();
  }
}

// Hero entrance sequence with staggered text reveals
const splitHero = new SplitType('.hero-main-title', { types: 'lines, words, chars' });
gsap.set(splitHero.words, { display: 'inline-block' });
gsap.set(splitHero.chars, { display: 'inline-block', willChange: 'transform' });

const tlHero = gsap.timeline({ defaults: { ease: 'power4.out' } });

tlHero
  .from(['.brand', '.nav-item'], { y: -30, opacity: 0, duration: 1.0, ease: 'power2.out', stagger: 0.08 })
  .from('.hero-header', { y: 30, opacity: 0, duration: 1, ease: 'power2.out' }, '-=0.8')
  .from('.hero-name', { y: 20, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.6')
  .from('.hero-title', { y: 20, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
  .from('.hero-location', { y: 20, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
  .from(splitHero.lines, {
    yPercent: 100,
    opacity: 0,
    duration: 1.2,
    stagger: 0.15,
    ease: 'power2.out',
    clearProps: 'all'
  }, '-=0.2')
  .from('.hero-image', { 
    x: 100, 
    opacity: 0, 
    duration: 1.5, 
    ease: 'power3.out' 
  }, '-=0.8')
  .from('.hero-extra', { 
    y: 30, 
    opacity: 0, 
    duration: 0.8, 
    ease: 'power2.out' 
  }, '-=0.4');

// Per-letter hover interaction for main title
splitHero.chars.forEach((ch) => {
  ch.addEventListener('mouseenter', () => {
    gsap.to(ch, {
      y: -8,
      rotation: gsap.utils.random(-6, 6),
      scale: 1.06,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  });
  ch.addEventListener('mouseleave', () => {
    gsap.to(ch, {
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.35,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  });
});

// Proximity-based mouse tracking over hero title
(() => {
  const container = document.querySelector('.hero-main-title');
  if (!container) return;

  let mouse = { x: 0, y: 0, inside: false };
  let rects = [];
  const radius = 140; // px influence radius

  function computeRects() {
    rects = splitHero.chars.map(ch => {
      const r = ch.getBoundingClientRect();
      return {
        el: ch,
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2
      };
    });
  }

  computeRects();
  window.addEventListener('resize', () => {
    // Debounced via rAF
    requestAnimationFrame(computeRects);
  });

  container.addEventListener('mouseenter', () => { mouse.inside = true; });
  container.addEventListener('mouseleave', () => {
    mouse.inside = false;
    // Reset all chars smoothly
    splitHero.chars.forEach(ch => {
      gsap.to(ch, { y: 0, rotation: 0, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    });
  });
  container.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function loop() {
    if (mouse.inside && rects.length) {
      rects.forEach(({ el, cx, cy }) => {
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const d = Math.hypot(dx, dy);
        if (d < radius) {
          const t = 1 - d / radius; // 0..1
          const lift = -12 * t; // up to -12px
          const rot = 6 * (dx / radius); // subtle tilt by horizontal direction
          gsap.to(el, { y: lift, rotation: rot, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
        } else {
          gsap.to(el, { y: 0, rotation: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
        }
      });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// Lightweight DOM blob background using GSAP (mouse-reactive, dark theme)
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blobs = gsap.utils.toArray('.bg-blob');
  if (!blobs.length) return;

  const view = { w: window.innerWidth, h: window.innerHeight };
  function resize() {
    view.w = window.innerWidth;
    view.h = window.innerHeight;
  }
  window.addEventListener('resize', resize);

  // Initial placement around center with random offsets
  blobs.forEach((b, i) => {
    const ox = gsap.utils.random(-0.25, 0.25) * view.w;
    const oy = gsap.utils.random(-0.2, 0.2) * view.h;
    gsap.set(b, {
      xPercent: -50,
      yPercent: -50,
      x: view.w / 2 + ox,
      y: view.h / 2 + oy,
      scale: gsap.utils.random(0.9, 1.15),
      opacity: 0.1
    });
    if (!reduceMotion) {
      // Gentle idle float and rotation
      gsap.to(b, { x: "+=" + gsap.utils.random(-40, 40), duration: gsap.utils.random(7, 11), ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(b, { y: "+=" + gsap.utils.random(-30, 30), duration: gsap.utils.random(6, 10), ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(b, { rotation: gsap.utils.random(-8, 8), duration: gsap.utils.random(10, 14), ease: "sine.inOut", yoyo: true, repeat: -1 });
    }
  });

  // Mouse parallax towards cursor
  const qx = blobs.map(b => gsap.quickTo(b, 'x', { duration: 0.35, ease: 'expo.out' }));
  const qy = blobs.map(b => gsap.quickTo(b, 'y', { duration: 0.35, ease: 'expo.out' }));
  const qs = blobs.map(b => gsap.quickTo(b, 'scale', { duration: 0.35, ease: 'expo.out' }));

  function onMove(e) {
    const nx = e.clientX / view.w - 0.5; // -0.5..0.5
    const ny = e.clientY / view.h - 0.5;
    blobs.forEach((_, i) => {
      const k = 0.22 + (i / blobs.length) * 0.25; // deeper layers move more
      qx[i](view.w / 2 + nx * view.w * k);
      qy[i](view.h / 2 + ny * view.h * k);
      qs[i](1.03 + (i / blobs.length) * 0.05);
    });
  }

  if (!reduceMotion) window.addEventListener('mousemove', onMove);
})();

// Intro overlay with welcome text scramble animation
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = document.querySelector('.intro');

  if (!intro) return;

  const introPanel = intro.querySelector('.intro-panel');
  const introText = intro.querySelector('.intro-text');

  const introScrambler = new TextScrambler(introText);

  if (reduceMotion) {
    gsap.set(intro, { autoAlpha: 0, display: 'none' });
    return;
  }

  // Set up initial states
  gsap.set([introPanel, introText], { willChange: 'transform, opacity' });
  gsap.set(introText, { autoAlpha: 1 });

  const masterTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Start scramble animation immediately
  masterTl.add(() => {
    // Start scramble animation for Welcome
    introScrambler.setText('Welcome', { duration: 1.2, fromBlank: true });

    // Continue timeline after scramble completes + 1 second pause
    setTimeout(() => {
      masterTl.play();
    }, 2200); // 1200ms scramble + 1000ms pause = 2200ms total

    // Pause timeline until scramble finishes
    masterTl.pause();
  })

    // Lift intro page after welcome animation
    .to(introPanel, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' })
    .set(intro, { display: 'none' })
    .add(() => {
      try { if (typeof tlHero !== 'undefined' && tlHero) tlHero.restart(); } catch (e) { }
    }, '<');
})();

// Hero chips subtle float-in
gsap.from(".hero-tags span", {
  scrollTrigger: { trigger: ".hero", start: "top 60%" },
  y: 14,
  opacity: 0,
  duration: 0.6,
  stagger: 0.12,
  ease: "power2.out"
});

// Work cards reveal and parallax hover
const workCards = gsap.utils.toArray('.work-card');
workCards.forEach((card) => {
  // reveal on scroll
  gsap.from(card, {
    scrollTrigger: { trigger: card, start: 'top 85%' },
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  // mouse spotlight and tilt
  const media = card.querySelector('.work-media img');
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty('--mx', mx + '%');
    card.style.setProperty('--my', my + '%');
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    gsap.to(media, { duration: 0.4, ease: 'power2.out', x: dx * 0.03, y: dy * 0.03 });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(media, { duration: 0.5, ease: 'power3.out', x: 0, y: 0 });
  });
});

// Projects parallax reveal
document.querySelectorAll(".project-item img").forEach(img => {
  gsap.from(img, {
    scrollTrigger: { trigger: img, start: "top 85%" },
    scale: 1.1,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out"
  }); 
});

// About section fade
gsap.from(".about-text h2, .about-text p", {
  scrollTrigger: { trigger: ".about", start: "top 80%" },
  y: 30, opacity: 0, duration: 0.6, stagger: 0.2
});

// Contact form fields stagger
gsap.from(".contact input, .contact textarea, .contact button", {
  scrollTrigger: { trigger: ".contact", start: "top 80%" },
  y: 20, opacity: 0, duration: 0.5, stagger: 0.15
});

// Footer fade
gsap.from("footer", {
  scrollTrigger: { trigger: "footer", start: "top 90%" },
  opacity: 0, duration: 0.8
});

// Work list hover preview (GSAP)
(() => {
  const list = document.querySelector('.work-list');
  const rows = gsap.utils.toArray('.work-row');
  const preview = document.querySelector('.work-preview');
  const previewImg = preview ? preview.querySelector('img') : null;
  if (!list || !rows.length || !preview || !previewImg) return;

  // entrance
  gsap.from(rows, {
    scrollTrigger: { trigger: list, start: 'top 80%' },
    y: 30, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out'
  });

  const qx = gsap.quickTo(preview, 'left', { duration: 0.25, ease: 'expo.out' });
  const qy = gsap.quickTo(preview, 'top', { duration: 0.25, ease: 'expo.out' });
  const qscale = gsap.quickTo(preview, 'scale', { duration: 0.25, ease: 'expo.out' });
  const qopacity = gsap.quickTo(preview, 'opacity', { duration: 0.25, ease: 'expo.out' });

  function move(e) {
    qx(e.clientX + 24);
    qy(e.clientY - 24);
  }

  function activateRow(row) {
    rows.forEach(r => r.classList.remove('is-active'));
    row.classList.add('is-active');
    const src = row.getAttribute('data-image');
    if (src && previewImg.getAttribute('src') !== src) {
      gsap.to(previewImg, { opacity: 0, duration: 0.15, onComplete: () => {
        previewImg.setAttribute('src', src);
        gsap.to(previewImg, { opacity: 1, duration: 0.25 });
      }});
    }
  }

  rows.forEach((row) => {
    row.addEventListener('mouseenter', (e) => {
      activateRow(row);
      document.addEventListener('mousemove', move);
      qopacity(1);
      qscale(1);
      move(e);
    });
    row.addEventListener('mousemove', move);
    row.addEventListener('mouseleave', () => {
      qopacity(0);
      qscale(0.92);
      document.removeEventListener('mousemove', move);
      rows.forEach(r => r.classList.remove('is-active'));
    });
  });
})();
