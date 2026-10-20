import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isDesktopWidth } from './runtime.js';


const VARIANTS = {
  'fade-in': { from: { autoAlpha: 0 }, to: { autoAlpha: 1 } },
  'fade-up': { from: { autoAlpha: 0, y: 40 }, to: { autoAlpha: 1, y: 0 } },
  'fade-down': { from: { autoAlpha: 0, y: -40 }, to: { autoAlpha: 1, y: 0 } },
  'fade-left': { from: { autoAlpha: 0, x: 40 }, to: { autoAlpha: 1, x: 0 } },
  'fade-right': { from: { autoAlpha: 0, x: -40 }, to: { autoAlpha: 1, x: 0 } },
  'zoom-in': { from: { autoAlpha: 0, scale: 0.9 }, to: { autoAlpha: 1, scale: 1 } },
};

export function initAnimations() {
  gsap.utils.toArray('[data-animate]').forEach((el) => {
    const variant = VARIANTS[el.dataset.animate] ?? VARIANTS['fade-up'];

    gsap.fromTo(el, variant.from, {
      ...variant.to,
      duration: parseFloat(el.dataset.duration ?? '0.8'),
      delay: parseFloat(el.dataset.delay ?? '0'),
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: el.dataset.start ?? 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  });

}

export function initLineReveal() {
  gsap.utils.toArray('[data-reveal-lines]').forEach((el) => {
    const lines = el.querySelectorAll('.reveal-line');
    if (!lines.length) return;

    const once = el.dataset.revealLines === 'once';

    const fromTop = el.dataset.direction === 'down';
    const from = fromTop ? -110 : 110;

    const trigger = el.dataset.trigger
      ? (el.closest(el.dataset.trigger) ??
        document.querySelector(el.dataset.trigger) ??
        el)
      : el;
    const endTriggerEl = el.dataset.endTrigger ? el.closest(el.dataset.endTrigger) : null;

    gsap.fromTo(
      lines,
      { yPercent: from },
      {
        yPercent: 0,
        duration: parseFloat(el.dataset.duration ?? '0.9'),
        delay: parseFloat(el.dataset.delay ?? '0'),
        stagger: parseFloat(el.dataset.stagger ?? '0.12'),
        ease: 'power3.out',
        scrollTrigger: {
          trigger,
          ...(endTriggerEl ? { endTrigger: endTriggerEl } : {}),
          start: el.dataset.start ?? 'top 85%',
          end: el.dataset.end ?? 'bottom top',
          toggleActions: once ? 'play none none none' : 'play reverse play reverse',
        },
      }
    );
  });
}

export function initWordScrub() {
  gsap.utils.toArray('[data-words-scrub]').forEach((el) => {
    const start = parseFloat(el.dataset.from ?? '0.6');
    const endPos = parseFloat(el.dataset.to ?? '1');

    if (!el.dataset.split) {
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words
        .map((w) => `<span class="scrub-word">${w}</span>`)
        .join(' ');
      el.dataset.split = 'true';
    }

    const spans = el.querySelectorAll('.scrub-word');
    if (!spans.length) return;

    gsap.fromTo(
      spans,
      { opacity: start },
      {
        opacity: endPos,
        ease: 'none',
        stagger: 0.8,
        scrollTrigger: {
          trigger: el,
          start: el.dataset.start ?? 'top 80%',
          end: el.dataset.end ?? 'top 30%',
          scrub: true,
        },
      }
    );
  });
}

export function initImageReveal() {
  gsap.utils.toArray('[data-image-reveal]').forEach((el) => {
    const panel = el.querySelector('.reveal-panel');
    if (!panel) return;

    const rect = el.getBoundingClientRect();
    const width = window.innerWidth || 1;
    const fractionX = Math.min(1, Math.max(0, (rect.left + rect.width / 2) / width));
    const spreadX = parseFloat(el.dataset.staggerX ?? '0.3');
    const desktopDelay = isDesktopWidth()
      ? parseFloat(el.dataset.delayDesktop ?? '0')
      : 0;
    const delay =
      parseFloat(el.dataset.delay ?? '0') + desktopDelay + fractionX * spreadX;

    const trigger = el.dataset.trigger
      ? (el.closest(el.dataset.trigger) ??
        document.querySelector(el.dataset.trigger) ??
        el)
      : el;

    const photos = el.querySelectorAll('img');

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: el.dataset.start ?? 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    if (photos.length) timeline.set(photos, { autoAlpha: 1 }, delay);

    timeline.fromTo(
      panel,
      { scaleY: 1 },
      {
        scaleY: 0,
        transformOrigin: 'bottom center',
        ease: 'power3.inOut',
        duration: parseFloat(el.dataset.duration ?? '1.1'),
      },
      delay
    );
  });
}
