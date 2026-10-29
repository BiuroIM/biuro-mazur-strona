import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { keepRevealed } from './runtime.js';

export function initDarkBackground() {
  const sections = gsap.utils.toArray('[data-dark-bg]');
  if (!sections.length) return;

  const layer = document.querySelector('[data-dark-bg-layer]');
  if (!layer) return;

  gsap.set(layer, { autoAlpha: 0 });
  gsap.set(document.documentElement, { '--dark-veil': 0 });

  sections.forEach((section) => {
    const time = parseFloat(section.dataset.bgTime ?? '0.5');

    const timeline = gsap.timeline({ paused: true });

    timeline.to(layer, { autoAlpha: 1, duration: time, ease: 'power2.inOut' }, 0);
    timeline.to(
      document.documentElement,
      { '--dark-veil': 1, duration: time, ease: 'power2.inOut' },
      0
    );

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: section.dataset.start ?? 'top top',
      end: section.dataset.end ?? 'bottom top',
      onToggle: (self) => (self.isActive ? timeline.play() : timeline.reverse()),
    });

    if (trigger.isActive) timeline.progress(1);
  });
}

export function initLogoWall() {
  gsap.utils.toArray('[data-logo-wall]').forEach((wall) => {
    const columns = gsap.utils
      .toArray(wall.querySelectorAll('[data-logo-col]'))
      .filter((col) => col.offsetHeight > 0);
    const n = columns.length;
    if (!n) return;

    const vh = () => (window.innerHeight || 800) / 100;
    const startBottom = parseFloat(wall.dataset.start ?? '100');
    const descent = parseFloat(wall.dataset.colDrop ?? '10');
    const step = parseFloat(wall.dataset.colDelay ?? '0.25');
    const baseDur = parseFloat(wall.dataset.duration ?? '1');
    const gap = parseFloat(wall.dataset.exitMargin ?? '10');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wall,
        start: 'top center',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    columns.forEach((col, i) => {
      const fromRight = n - 1 - i;

      tl.fromTo(
        col,
        { y: () => (startBottom + fromRight * descent) * vh() },
        {
          y: () => -(col.offsetHeight + gap * vh()),
          ease: 'none',
          duration: baseDur + i * step,
          force3D: true,
        },
        fromRight * step
      );
    });
  });
}

export function initCards() {
  gsap.utils.toArray('[data-cards]').forEach((zone) => {
    const cards = gsap.utils.toArray(zone.querySelectorAll('[data-card]'));
    if (!cards.length) return;

    const section = zone.closest('[data-cards-section]') ?? zone;
    const step = parseFloat(zone.dataset.step ?? '0.85');
    const time = parseFloat(zone.dataset.time ?? '1');
    const rotateStart = parseFloat(zone.dataset.rotateStart ?? '-12');
    const scaleStart = parseFloat(zone.dataset.scaleStart ?? '0.82');
    const isNarrow = () => window.matchMedia('(max-width: 1023px)').matches;
    const readNumber = (key, fallback) => {
      const forNarrow = zone.dataset[`${key}MaxLg`];
      const chosen = isNarrow() && forNarrow != null ? forNarrow : zone.dataset[key];
      return parseFloat(chosen ?? fallback);
    };

    const stepX = () => readNumber('shiftX', '1.6');
    const stepY = () => readNumber('shiftY', '1.6');
    const baseX = () => readNumber('baseX', '0');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: section.dataset.scrub ? parseFloat(section.dataset.scrub) : true,
        invalidateOnRefresh: true,
      },
    });

    cards.forEach((card, i) => {
      const endRotation = parseFloat(card.dataset.rotate ?? '0');

      const targetX = () => ((baseX() + i * stepX()) * window.innerWidth) / 100;

      const targetY = () => {
        const step = stepY();
        const centering = ((cards.length - 1) * step) / 2;
        return ((centering - i * step) * window.innerHeight) / 100;
      };

      tl.fromTo(
        card,
        {
          x: targetX,
          y: () => window.innerHeight,
          rotation: rotateStart,
          scale: scaleStart,
        },
        {
          x: targetX,
          y: targetY,
          rotation: endRotation,
          scale: 1,
          ease: 'none',
          duration: time,
        },
        i * step
      );
    });
  });
}

function prepareExtra(extra) {
  extra.querySelectorAll('[data-extra-words]').forEach((el) => {
    if (el.dataset.split) return;

    el.innerHTML = el.textContent
      .trim()
      .split(/\s+/)
      .map(
        (word) =>
          `<span class="-mb-[0.18em] inline-block overflow-hidden align-bottom">` +
          `<span class="extra-line block pb-[0.18em]">${word}</span></span>`
      )
      .join(' ');

    el.dataset.split = 'true';
  });

  return gsap.utils.toArray(extra.querySelectorAll('.extra-line'));
}

export function initHeadlinePin() {
  gsap.utils.toArray('[data-headline-pin]').forEach((section) => {
    const groups = gsap.utils.toArray(section.querySelectorAll('[data-headline-group]'));
    const blocks = groups.length ? groups : [section];

    const stagger = parseFloat(section.dataset.stagger ?? '0.08');
    const entry = parseFloat(section.dataset.in ?? '2');
    const hold = parseFloat(section.dataset.hold ?? '0.8');
    const exit = parseFloat(section.dataset.out ?? '1.2');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: section.dataset.scrub ? parseFloat(section.dataset.scrub) : true,
        invalidateOnRefresh: true,
      },
    });

    let revealedAt;

    blocks.forEach((block) => {
      const lines = gsap.utils.toArray(block.querySelectorAll('.headline-line'));
      if (!lines.length) return;

      const extra = block.querySelector('[data-headline-extra]');
      const extraParts = extra ? prepareExtra(extra) : [];

      tl.fromTo(
        lines,
        { yPercent: 110 },
        { yPercent: 0, ease: 'power3.out', duration: entry, stagger }
      );

      if (extraParts.length) {
        tl.fromTo(
          extraParts,
          { yPercent: 110 },
          {
            yPercent: 0,
            ease: 'power3.out',
            duration: entry * 0.4,
            stagger: parseFloat(section.dataset.extraStagger ?? '0.04'),
          },
          '>-0.5'
        );
      } else if (extra) {
        tl.fromTo(
          extra,
          { autoAlpha: 0, y: '3vh' },
          { autoAlpha: 1, y: 0, ease: 'power2.out', duration: entry * 0.5 },
          '>-0.4'
        );
      }

      const photo = block.querySelector('[data-headline-photo]');
      const photoFrame = photo?.firstElementChild;
      const photoImage = photo?.querySelector('img');
      const photoIn = parseFloat(section.dataset.photoIn ?? '1.6');
      const photoAxis = photo?.dataset.headlinePhoto === 'width' ? 'width' : 'height';
      if (photo && photoFrame) {
        tl.fromTo(
          photo,
          { [photoAxis]: 0 },
          {
            [photoAxis]: () =>
              photoAxis === 'width' ? photoFrame.offsetWidth : photoFrame.offsetHeight,
            ease: 'power2.inOut',
            duration: photoIn,
          }
        );
        if (photoImage) {
          tl.fromTo(
            photoImage,
            { scale: 1.3 },
            { scale: 1, ease: 'power2.out', duration: photoIn },
            '<'
          );
        }
      }

      revealedAt ??= tl.duration();
      tl.to({}, { duration: hold });

      const photoMask = photoImage?.parentElement;
      if (photo?.hasAttribute('data-photo-exit') && photoMask) {
        const photoOut = parseFloat(section.dataset.photoOut ?? String(exit));
        tl.fromTo(
          photoMask,
          { clipPath: 'inset(0% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 100% 0%)', ease: 'power3.inOut', duration: photoOut }
        );
        tl.to(photoImage, { yPercent: -20, ease: 'power3.inOut', duration: photoOut }, '<');
        if (!block.hasAttribute('data-stays')) {
          tl.to(lines, { yPercent: -110, ease: 'power3.inOut', duration: exit }, '<');
        }
        tl.to({}, { duration: hold * 0.5 });
        return;
      }

      if (block.hasAttribute('data-stays')) return;

      if (photo && photoFrame) {
        tl.to(lines, { yPercent: -110, ease: 'power3.inOut', duration: exit, stagger });
        tl.to(photo, { [photoAxis]: 0, ease: 'power3.inOut', duration: exit }, '<');
        if (photoImage) {
          tl.to(photoImage, { scale: 1.3, ease: 'power3.in', duration: exit }, '<');
        }
      } else {
        tl.to(lines, { yPercent: -110, ease: 'power3.in', duration: exit, stagger });
      }
      if (extraParts.length) {
        tl.to(
          extraParts,
          { yPercent: -110, ease: 'power3.in', duration: exit, stagger: 0.02 },
          '<'
        );
      } else if (extra) {
        tl.to(extra, { autoAlpha: 0, duration: exit * 0.5 }, '<');
      }
    });

    if (revealedAt !== undefined) keepRevealed(tl, revealedAt);
  });
}

export function initFooterTransition() {
  gsap.utils.toArray('[data-footer-transition]').forEach((section) => {
    const panels = gsap.utils.toArray(section.querySelectorAll('[data-panel]'));
    if (!panels.length) return;

    const content = section.querySelector('[data-footer-content]');
    const stagger = parseFloat(section.dataset.stagger ?? '0.35');
    const time = parseFloat(section.dataset.time ?? '1');
    const hold = parseFloat(section.dataset.hold ?? '0.6');

    gsap.set(panels, { scaleY: 0, transformOrigin: 'top center' });
    if (content) gsap.set(content, { autoAlpha: 0, y: '4vh' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: section.dataset.start ?? 'top top',
        end: 'bottom bottom',
        scrub: true,
      },
    });

    tl.to(panels, { scaleY: 1, ease: 'none', stagger, duration: time });
    if (content) {
      tl.to(content, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.6 }, '>-0.1');
    }
    keepRevealed(tl, tl.duration());
    tl.to({}, { duration: hold });
  });
}

export function initPhotoSwap() {
  gsap.utils.toArray('[data-photo-swap]').forEach((section) => {
    const images = gsap.utils.toArray(section.querySelectorAll('[data-photo-swap-image]'));
    const steps = gsap.utils.toArray(section.querySelectorAll('[data-photo-swap-step]'));
    const duration = parseFloat(section.dataset.swapTime ?? '1.2');
    const evenly = section.hasAttribute('data-swap-even');
    const pinned = images[0]?.parentElement?.parentElement;

    const evenStart = (i) => () => {
      const top = parseFloat(getComputedStyle(pinned).top) || 0;
      const span = section.offsetHeight - pinned.offsetHeight;
      return `top+=${(span * i) / images.length} ${top}px`;
    };

    images.forEach((image, i) => {
      if (i === 0 || (!evenly && !steps[i])) return;
      const photo = image.querySelector('img');

      gsap.set(image, { clipPath: 'inset(100% 0% 0% 0%)' });
      if (photo) gsap.set(photo, { autoAlpha: 1 });

      const timeline = gsap.timeline({ paused: true });
      timeline.to(image, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power3.inOut', duration });
      if (photo) {
        timeline.fromTo(photo, { scale: 1.25 }, { scale: 1, ease: 'power3.out', duration: duration * 1.4 }, 0);
      }

      ScrollTrigger.create({
        trigger: evenly ? section : steps[i],
        start: evenly ? evenStart(i) : (steps[i].dataset.swapStart ?? section.dataset.swapStart ?? 'top 60%'),
        onEnter: () => timeline.timeScale(1).play(),
        onLeaveBack: () => timeline.timeScale(1.4).reverse(),
      });
    });
  });
}

const SAFE_EDGE = 1;

export function initParallax() {
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const holder = el.parentElement;
    if (!holder) return;

    const travel = () =>
      Math.max(0, (el.offsetHeight - holder.clientHeight) / 2 - SAFE_EDGE);

    gsap.fromTo(
      el,
      { y: () => -travel() },
      {
        y: () => travel(),
        ease: 'none',
        scrollTrigger: {
          trigger: holder,
          start: el.dataset.start ?? 'top bottom',
          end: el.dataset.end ?? 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}
