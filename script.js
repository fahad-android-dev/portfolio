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

// Hero entrance sequence (line-based reveal)
const splitHero = new SplitType('.hero-title', { types: 'lines, words, chars' });
gsap.set(splitHero.words, { display: 'inline-block' });
gsap.set(splitHero.chars, { display: 'inline-block', willChange: 'transform' });

const tlHero = gsap.timeline({ defaults: { ease: 'power4.out' } });

tlHero
  .from('.eyebrow', { opacity: 0, y: 16, duration: 0.5 })
  .from(splitHero.lines, {
    yPercent: 120,
    opacity: 0,
    skewY: 6,
    duration: 0.9,
    stagger: 0.08,
    clearProps: 'all'
  }, '-=0.1')
  .to(splitHero.lines, { skewY: 0, duration: 0.4, ease: 'power3.out' }, '<+0.05')
  .from('.hero-subtitle', { opacity: 0, y: 18, duration: 0.6 }, '-=0.2')
  .from('.hero-tags span', { opacity: 0, y: 12, duration: 0.35, stagger: 0.07 }, '-=0.25');

// Per-letter hover interaction
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
  const container = document.querySelector('.hero-title');
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

// Lightweight DOM blob background using GSAP (mouse-reactive, light theme)
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
      opacity: 0.5
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

// Intro overlay: white welcome screen drops away to reveal the site
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = document.querySelector('.intro');
  if (!intro) return;
  const panel = intro.querySelector('.intro-panel');
  const text = intro.querySelector('.intro-text');
  const scrambler = new TextScrambler(text);

  if (reduceMotion) {
    gsap.set(intro, { autoAlpha: 0, display: 'none' });
    return;
  }

  gsap.set([panel, text], { willChange: 'transform, opacity' });
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.set(text, { autoAlpha: 1, y: 0 });
  const phrases = ['Welcome'];
  phrases.forEach((p) => {
    tl.to(text, {
      duration: 0.9,
      onStart: () => scrambler.setText(p, { duration: 0.9, fromBlank: true })
    });
  });
  tl.to(text, { autoAlpha: 0, y: -20, duration: 0.5 }, '+=0.05')
    .to(panel, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, '<')
    .set(intro, { display: 'none' })
    .add(() => {
      try { if (typeof tlHero !== 'undefined' && tlHero) tlHero.restart(); } catch (e) {}
    }, '<');
})();

// Services fade-up
gsap.from(".service-card", {
    scrollTrigger: { trigger: ".services", start: "top 80%" },
    y: 50, opacity: 0, duration: 0.8, stagger: 0.2
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
