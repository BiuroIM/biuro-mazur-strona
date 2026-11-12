import { gsap } from 'gsap';
import { getLenis } from './runtime.js';

let formController = null;

export function initContactForm() {
  const root = document.querySelector('[data-form]');
  if (!root) return;

  formController?.abort();
  formController = new AbortController();
  const { signal } = formController;

  const backdrop = root.querySelector('[data-form-backdrop]');
  const panel = root.querySelector('[data-form-panel]');
  const blocks = gsap.utils.toArray(root.querySelectorAll('[data-form-block]'));
  const parts = gsap.utils.toArray(root.querySelectorAll('[data-form-field]'));

  const COVERED = 'inset(0% 0% 0% 100%)';
  const UNCOVERED = 'inset(0% 0% 0% 0%)';

  gsap.set(panel, { clipPath: COVERED });
  gsap.set(blocks, { clipPath: COVERED });
  gsap.set(backdrop, { autoAlpha: 0 });
  gsap.set(parts, { autoAlpha: 0, x: 24 });

  const timeline = gsap
    .timeline({ paused: true, defaults: { ease: 'power3.out' } })
    .to(backdrop, { autoAlpha: 1, duration: 0.5 }, 0)
    .to(panel, { clipPath: UNCOVERED, duration: 0.7, ease: 'power4.inOut' }, 0)
    .to(blocks, { clipPath: UNCOVERED, duration: 0.6, stagger: 0.12 }, 0.2)
    .to(parts, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.05 }, 0.45);

  let lastFocus = null;
  const isOpen = () => !root.hasAttribute('inert');

  const open = () => {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    root.removeAttribute('inert');
    root.style.pointerEvents = 'auto';
    getLenis()?.stop();
    timeline.play();
  };

  const close = () => {
    if (!isOpen()) return;
    root.setAttribute('inert', '');
    root.style.pointerEvents = 'none';
    getLenis()?.start();
    timeline.reverse();
    lastFocus?.focus?.();
  };

  document.querySelectorAll('[data-open-form]').forEach((el) => {
    el.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        open();
      },
      { signal }
    );
  });

  root.querySelectorAll('[data-close-form]').forEach((el) => {
    el.addEventListener('click', close, { signal });
  });

  backdrop?.addEventListener('click', close, { signal });

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && isOpen()) close();
    },
    { signal }
  );
}

export function destroyForms() {
  formController?.abort();
  formController = null;
}
