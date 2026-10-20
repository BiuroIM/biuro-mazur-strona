import { gsap } from 'gsap';

let riseSwipeController = null;

const HORIZONTAL_MARGIN = 1;
const horizontalTweens = new WeakMap();

function initHorizontal() {
  gsap.utils.toArray('[data-horizontal]').forEach((section) => {
    const track = section.querySelector('[data-horizontal-track]');
    if (!track) return;

    const distance = () => Math.max(0, track.offsetWidth - window.innerWidth);

    const margin = () => {
      const pinned = section.offsetHeight - window.innerHeight;
      if (pinned <= 0) return 0;
      return (distance() * window.innerHeight * HORIZONTAL_MARGIN) / pinned;
    };

    const tween = gsap.fromTo(
      track,
      { x: () => margin() },
      {
        x: () => -(distance() + margin()),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: `top ${HORIZONTAL_MARGIN * 100}%`,
          end: `bottom ${100 - HORIZONTAL_MARGIN * 100}%`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );

    horizontalTweens.set(section, tween);
  });
}

const RISE_RATIO = 0.26;
const RISE_SAFE = 0.9;
const RISE_SCALE = 0.94;
const RISE_TILT = 16;
const RISE_PIVOT = '50% 220%';
const RISE_ENTER = 0.5;
const RISE_HOLD = 0.15;
const RISE_EXIT = RISE_ENTER;
const RISE_SWIPE_TILT = 8;
const RISE_SWIPE_PIVOT = '50% 150%';
const RISE_SWIPE_RATIO = 0.1;

function riseGesture(item, { drop, tilt, pivot }, options) {
  return gsap
    .timeline(options)
    .fromTo(
      item,
      { y: drop, rotation: tilt, scale: RISE_SCALE, transformOrigin: pivot },
      {
        y: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.out',
        duration: RISE_ENTER,
      }
    )
    .to(item, { duration: RISE_HOLD })
    .to(item, {
      y: drop,
      rotation: -tilt,
      scale: RISE_SCALE,
      ease: 'power2.in',
      duration: RISE_EXIT,
    });
}

function initRise() {
  gsap.utils.toArray('[data-rise]').forEach((group) => {
    const items = gsap.utils.toArray(group.querySelectorAll('[data-rise-item]'));
    if (!items.length) return;

    const section = group.closest('[data-horizontal]');
    const container = section ? horizontalTweens.get(section) : null;

    const room = () => {
      const box = group.offsetParent ?? group.parentElement;
      if (!box) return 0;
      return Math.max(0, box.clientHeight - group.offsetTop - group.offsetHeight);
    };

    const drop = () => {
      const wanted = items[0].offsetHeight * parseFloat(group.dataset.riseRatio ?? RISE_RATIO);
      return Math.min(wanted, room() * RISE_SAFE);
    };

    items.forEach((item) => {
      riseGesture(item, { drop, tilt: RISE_TILT, pivot: RISE_PIVOT }, {
        scrollTrigger: {
          trigger: item,
          containerAnimation: container ?? undefined,
          start: group.dataset.riseStart ?? 'left right',
          end: group.dataset.riseEnd ?? 'right left',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });
  });
}

function initRiseSwipe() {
  riseSwipeController?.abort();
  riseSwipeController = new AbortController();
  const { signal } = riseSwipeController;

  gsap.utils.toArray('[data-rise-swipe]').forEach((scroller) => {
    const items = gsap.utils.toArray(scroller.querySelectorAll('[data-rise-item]'));
    if (!items.length) return;

    const tilt = parseFloat(scroller.dataset.riseTilt ?? RISE_SWIPE_TILT);
    const drop = () =>
      items[0].offsetHeight * parseFloat(scroller.dataset.riseRatio ?? RISE_SWIPE_RATIO);

    const gestures = items.map((item) =>
      riseGesture(item, { drop, tilt, pivot: RISE_SWIPE_PIVOT }, { paused: true })
    );

    let scheduled = false;

    const apply = () => {
      scheduled = false;
      const view = scroller.clientWidth;
      if (!view) return;

      items.forEach((item, index) => {
        const lead = item.offsetLeft - scroller.offsetLeft - scroller.scrollLeft;
        const span = view + item.offsetWidth;
        gestures[index].progress(gsap.utils.clamp(0, 1, (view - lead) / span));
      });
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(apply);
    };

    const remeasure = () => {
      gestures.forEach((gesture) => gesture.invalidate());
      schedule();
    };

    scroller.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', remeasure, { signal });
    apply();
  });
}

export function destroyRiseSwipe() {
  riseSwipeController?.abort();
  riseSwipeController = null;
}

export { initHorizontal, initRise, initRiseSwipe };
