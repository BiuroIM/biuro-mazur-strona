import { gsap } from 'gsap';
import { getLenis } from './runtime.js';

let menuController = null;
let menuCollapse = null;

export function takeMenuCollapse() {
  const wait = menuCollapse;
  menuCollapse = null;
  return wait;
}

export function initMenu() {
  const menu = document.querySelector('[data-menu]');
  const button = document.querySelector('[data-menu-open]');
  if (!menu || !button) return;

  menuController?.abort();
  menuController = new AbortController();
  const { signal } = menuController;

  const mask = { coverage: 100 };
  const drawMask = () => {
    menu.style.clipPath = `inset(0% 0% ${mask.coverage}% 0%)`;
  };

  const lines = gsap.utils.toArray(menu.querySelectorAll('[data-menu-line]'));

  mask.coverage = 100;
  drawMask();
  gsap.set(lines, { yPercent: 110 });

  const openTimeline = gsap
    .timeline({ paused: true })
    .to(mask, { coverage: 0, duration: 0.6, ease: 'power4.inOut', onUpdate: drawMask }, 0)
    .to(lines, { yPercent: 0, duration: 0.65, stagger: 0.05, ease: 'power3.out' }, 0.22);

  const RELEASE_CURTAIN = 0.2;
  const Z_ABOVE_CURTAIN = '75';
  let closeTimeline = null;
  const collapse = (aboveCurtain = false) => {
    let done;
    const wait = new Promise((resolve) => (done = resolve));
    if (aboveCurtain) menu.style.zIndex = Z_ABOVE_CURTAIN;
    const timeline = gsap
      .timeline({ onComplete: done })
      .to(lines, { yPercent: 110, duration: 0.45, stagger: 0.03, ease: 'power2.in' }, 0)
      .to(mask, { coverage: 100, duration: 0.8, ease: 'power2.inOut', onUpdate: drawMask }, 0.05)
      .add(done, RELEASE_CURTAIN);
    return { timeline, wait };
  };

  const isOpen = () => !menu.hasAttribute('inert');

  const open = () => {
    if (isOpen()) return;
    menu.removeAttribute('inert');
    button.setAttribute('aria-expanded', 'true');
    getLenis()?.stop();
    closeTimeline?.kill();
    menuCollapse = null;
    menu.style.zIndex = '';
    openTimeline.invalidate().play(0);
  };

  const close = (instant = false, aboveCurtain = false) => {
    if (!isOpen()) return;
    menu.setAttribute('inert', '');
    button.setAttribute('aria-expanded', 'false');
    getLenis()?.start();
    openTimeline.pause();
    closeTimeline?.kill();

    if (instant) {
      menuCollapse = null;
      menu.style.zIndex = '';
      mask.coverage = 100;
      drawMask();
      gsap.set(lines, { yPercent: 110 });
      return;
    }

    const { timeline, wait } = collapse(aboveCurtain);
    closeTimeline = timeline;
    menuCollapse = wait;
  };

  button.addEventListener('click', open, { signal });

  menu.querySelectorAll('[data-menu-close]').forEach((el) => {
    el.addEventListener('click', () => close(), { signal });
  });

  menu.querySelectorAll('[data-menu-link]').forEach((link) => {
    link.addEventListener(
      'click',
      () => {
        const href = link.getAttribute('href');
        const nowhere = !href || href === '#';
        if (nowhere && !link.hasAttribute('data-open-form')) return;

        close(false, !nowhere);
      },
      { signal }
    );
  });

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && isOpen()) close();
    },
    { signal }
  );

}

export function destroyMenu() {
  menuController?.abort();
  menuController = null;
}
