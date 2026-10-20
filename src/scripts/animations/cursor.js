import { gsap } from 'gsap';

let cursorController = null;

export function initHoverCursor() {
  const cursor = document.querySelector('[data-cursor]');
  if (!cursor) return;

  cursorController?.abort();
  cursorController = new AbortController();
  const { signal } = cursorController;

  const label = cursor.querySelector('[data-cursor-text]');

  gsap.set(cursor, { xPercent: -50, yPercent: -50, scale: 0.4, autoAlpha: 0 });

  const moveX = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3.out' });
  const moveY = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3.out' });

  const pointer = { x: 0, y: 0, tracked: false };
  let active = null;
  let queued = false;

  const resolveTarget = () => {
    if (!pointer.tracked) return null;
    const element = document.elementFromPoint(pointer.x, pointer.y);
    return element ? element.closest('[data-cursor-label]') : null;
  };

  const conceal = () => {
    active = null;
    gsap.to(cursor, { scale: 0.4, autoAlpha: 0, duration: 0.25, ease: 'power2.in' });
  };

  const sync = () => {
    queued = false;
    const next = resolveTarget();
    if (next === active) return;

    if (!next) {
      conceal();
      return;
    }

    const revealing = !active;
    active = next;
    if (label) label.textContent = next.dataset.cursorLabel;
    if (revealing) gsap.set(cursor, { x: pointer.x, y: pointer.y });
    gsap.to(cursor, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'power3.out' });
  };

  const queueSync = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  };

  const release = () => {
    pointer.tracked = false;
    if (active) conceal();
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.tracked = true;
      moveX(pointer.x);
      moveY(pointer.y);
      queueSync();
    },
    { signal, passive: true }
  );

  window.addEventListener('scroll', queueSync, { signal, passive: true });

  document.addEventListener(
    'pointerout',
    (event) => {
      if (!event.relatedTarget) release();
    },
    { signal }
  );

  window.addEventListener('blur', release, { signal });
}

export function destroyHoverCursor() {
  cursorController?.abort();
  cursorController = null;
}
