import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let faqController = null;

export function initFaq() {
  faqController?.abort();
  faqController = new AbortController();
  const { signal } = faqController;

  const items = gsap.utils.toArray('[data-faq]');
  const timelines = new Map();

  const apply = (element, isOpen) => {
    const button = element.querySelector('[data-faq-button]');
    const panel = element.querySelector('[data-faq-answer]');
    const backdrop = element.querySelector('[data-faq-bg]');
    if (!button || !panel || !backdrop) return;

    element.dataset.open = String(isOpen);
    button.setAttribute('aria-expanded', String(isOpen));

    timelines.get(element)?.kill();

    const timeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => ScrollTrigger.refresh(),
    });

    if (isOpen) {
      timeline.to(backdrop, { scaleY: 1, duration: 0.25 }, 0).to(
        panel,
        { height: 'auto', duration: 0.4 },
        0
      );
    } else {
      timeline.to(panel, { height: 0, duration: 0.35 }, 0).to(backdrop, { scaleY: 0, duration: 0.25 }, 0.12);
    }

    timelines.set(element, timeline);
  };

  items.forEach((element) => {
    const button = element.querySelector('[data-faq-button]');
    const panel = element.querySelector('[data-faq-answer]');
    const backdrop = element.querySelector('[data-faq-bg]');
    if (!button || !panel || !backdrop) return;

    gsap.set(panel, { height: 0, autoAlpha: 1 });
    gsap.set(backdrop, { scaleY: 0, transformOrigin: 'top center' });
    element.dataset.open = 'false';
    button.setAttribute('aria-expanded', 'false');

    button.addEventListener(
      'click',
      () => {
        const isOpen = element.dataset.open !== 'true';

        if (isOpen) {
          items
            .filter((other) => other !== element && other.dataset.open === 'true')
            .forEach((other) => apply(other, false));
        }

        apply(element, isOpen);
      },
      { signal }
    );
  });
}

export function destroyFaq() {
  faqController?.abort();
  faqController = null;
}
