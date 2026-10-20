import { gsap } from 'gsap';

let scrollBarController = null;

export function initScrollBar() {
  const bar = document.querySelector('[data-scroll-bar]');
  if (!bar) return;

  gsap.fromTo(
    bar,
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        start: 0,
        end: 'max',
        scrub: true,
      },
    }
  );

  pinBarToBottom(bar.closest('[data-scroll-bar-holder]'));
}

function pinBarToBottom(holder) {
  const visual = window.visualViewport;
  if (!holder || !visual) return;

  scrollBarController?.abort();
  scrollBarController = new AbortController();
  const { signal } = scrollBarController;

  let last = null;
  let scheduled = false;

  const align = () => {
    scheduled = false;
    const shift = Math.round(
      visual.offsetTop + visual.height - document.documentElement.clientHeight
    );
    if (shift === last) return;
    last = shift;
    holder.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : '';
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(align);
  };

  visual.addEventListener('resize', schedule, { signal });
  visual.addEventListener('scroll', schedule, { signal });
  window.addEventListener('scroll', schedule, { passive: true, signal });
  align();
}

export function destroyScrollBar() {
  scrollBarController?.abort();
  scrollBarController = null;
}
