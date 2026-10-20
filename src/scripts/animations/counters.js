import { gsap } from 'gsap';
import { colorToken } from './runtime.js';

const groupDigits = (value) =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function initCounters() {
  gsap.utils.toArray('[data-counter]').forEach((el) => {
    if (!el.dataset.counterRaw) el.dataset.counterRaw = el.textContent.trim();
    const raw = el.dataset.counterRaw;

    const found = raw.match(/\d[\d\s.,]*/);
    if (!found) return;

    const target = parseInt(found[0].replace(/\D/g, ''), 10);
    const prefix = raw.slice(0, found.index);
    const suffix = raw.slice(found.index + found[0].length);

    const state = { value: 0 };
    const write = () => {
      el.textContent = prefix + groupDigits(Math.round(state.value)) + suffix;
    };
    write();

    gsap.to(state, {
      value: target,
      duration: parseFloat(el.dataset.duration ?? '2.4'),
      delay: parseFloat(el.dataset.delay ?? '0'),
      ease: 'power2.out',
      snap: { value: 1 },
      onUpdate: write,
      scrollTrigger: {
        trigger: el.dataset.trigger ? (el.closest(el.dataset.trigger) ?? el) : el,
        start: el.dataset.start ?? 'top 98%',
        toggleActions: 'play none none none',
      },
    });
  });
}

export function initProgressBar() {
  gsap.utils.toArray('[data-progress-bar]').forEach((fill) => {
    const selector = fill.dataset.trigger;
    const range = selector
      ? fill.closest(selector)
      : fill.closest('section');
    if (!range) return;

    const track = fill.parentElement;
    const icon = track?.querySelector('[data-progress-icon]');
    const vertical = fill.dataset.progressAxis === 'y';

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: range,
        start: fill.dataset.start ?? 'top top',
        end: fill.dataset.end ?? 'bottom bottom',
        scrub: true,
      },
    });

    timeline.fromTo(
      fill,
      vertical ? { scaleY: 0 } : { scaleX: 0 },
      {
        ...(vertical ? { scaleY: 1 } : { scaleX: 1 }),
        ease: 'none',
        duration: 1,
        transformOrigin: vertical ? 'center top' : 'left center',
      },
      0
    );

    const trackSize = vertical ? track?.offsetHeight : track?.offsetWidth;

    if (icon && trackSize) {
      const iconCenter = vertical
        ? icon.offsetTop + icon.offsetHeight / 2
        : icon.offsetLeft + icon.offsetWidth / 2;
      const moment = Math.min(0.98, Math.max(0, iconCenter / trackSize));

      timeline.fromTo(
        icon,
        { color: colorToken('--color-canvas') },
        { color: colorToken('--color-ink'), ease: 'none', duration: 0.02 },
        moment
      );
    }

    if (track) {
      timeline.fromTo(
        track,
        { autoAlpha: 1 },
        { autoAlpha: 0, ease: 'none', duration: parseFloat(fill.dataset.fade ?? '0.06') },
        1
      );
    }
  });
}
