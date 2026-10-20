import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  destroyLenis,
  holdUnderCurtain,
  initLenis,
  resetCurtainQueue,
} from './animations/runtime.js';
import {
  initAnimations,
  initImageReveal,
  initLineReveal,
  initWordScrub,
} from './animations/reveal.js';
import { initCounters, initProgressBar } from './animations/counters.js';
import {
  initCards,
  initDarkBackground,
  initFooterTransition,
  initHeadlinePin,
  initLogoWall,
  initParallax,
  initPhotoSwap,
} from './animations/scenes.js';
import { destroyScrollBar, initScrollBar } from './animations/scrollBar.js';
import {
  destroyRiseSwipe,
  initHorizontal,
  initRise,
  initRiseSwipe,
} from './animations/horizontal.js';
import { destroyFaq, initFaq } from './animations/faq.js';
import { destroyForms, initContactForm, initPageForm } from './animations/forms.js';
import { destroyHoverCursor, initHoverCursor } from './animations/cursor.js';
import { destroyCustomSelect, initCustomSelect } from './animations/select.js';
import { destroyNavbar, initNavbar } from './animations/navbar.js';
import { destroyMenu, initMenu } from './animations/menu.js';
import {
  coverScreen,
  isLoadingScreenActive,
  onPageEnter,
} from './animations/pageTransition.js';

const INITS = [
  ['lenis', initLenis],
  ['animations', initAnimations],
  ['line-reveal', initLineReveal],
  ['word-scrub', initWordScrub],
  ['counters', initCounters],
  ['image-reveal', initImageReveal],
  ['dark-background', initDarkBackground],
  ['progress-bar', initProgressBar],
  ['scroll-bar', initScrollBar],
  ['logo-wall', initLogoWall],
  ['cards', initCards],
  ['horizontal', initHorizontal],
  ['rise', initRise],
  ['rise-swipe', initRiseSwipe],
  ['photo-swap', initPhotoSwap],
  ['faq', initFaq],
  ['headline-pin', initHeadlinePin],
  ['footer-transition', initFooterTransition],
  ['form-panel', initContactForm],
  ['page-form', initPageForm],
  ['hover-cursor', initHoverCursor],
  ['custom-select', initCustomSelect],
  ['navbar', initNavbar],
  ['menu', initMenu],
  ['parallax', initParallax],
];

const DESTROYERS = [
  destroyFaq,
  destroyForms,
  destroyNavbar,
  destroyRiseSwipe,
  destroyHoverCursor,
  destroyCustomSelect,
  destroyMenu,
  destroyScrollBar,
  destroyLenis,
];

function cleanup() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  resetCurtainQueue();
  DESTROYERS.forEach((destroy) => destroy());
}

function setup() {
  cleanup();

  INITS.forEach(([name, init]) => {
    try {
      init();
    } catch (e) {
      console.error(`[animacje] błąd inicjalizacji: ${name}`, e);
    }
  });

  ScrollTrigger.refresh();

  holdUnderCurtain();

  document.fonts?.ready.then(() => {
    if (isLoadingScreenActive()) return;
    ScrollTrigger.refresh();
    holdUnderCurtain();
  });
}

document.addEventListener('astro:page-load', setup);

document.addEventListener('astro:before-swap', cleanup);

document.addEventListener('astro:before-preparation', (event) => {
  const fetchPage = event.loader;
  event.loader = async () => {
    await coverScreen();
    await fetchPage();
  };
});

document.addEventListener('astro:page-load', onPageEnter);

document.addEventListener('astro:after-swap', () => {
  document.querySelector('[data-loader]')?.remove();
});

if (document.readyState !== 'loading') {
  setup();
} else {
  document.addEventListener('DOMContentLoaded', setup, { once: true });
}
