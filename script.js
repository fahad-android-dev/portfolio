gsap.registerPlugin(ScrollTrigger);

// Split text animation for hero
const splitHero = new SplitType('.hero-title', { types: 'words, chars' });
gsap.from(splitHero.chars, {
    opacity: 0,
    y: 50,
    stagger: 0.05,
    duration: 1,
    ease: "power4.out"
});
gsap.from(".hero-subtitle", {
    opacity: 0, y: 20, delay: 0.5, duration: 1, ease: "power2.out"
});

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
