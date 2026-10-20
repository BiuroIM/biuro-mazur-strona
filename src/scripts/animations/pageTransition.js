import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis, holdUnderCurtain, openCurtainGate, closeCurtainGate } from './runtime.js';
import { takeMenuCollapse } from './menu.js';

const CURTAIN_TIME = 0.85;
const DARK_DELAY = 0.24;

const GREEN_EASE = 'power2.inOut';
const DARK_EASE = 'power3.inOut';

const ANIMATION_LEAD = 0.7;

function transitionCurtains() {
  const layer = document.querySelector('[data-transition]');
  if (!layer) return null;

  const pick = (selector) => gsap.utils.toArray(layer.querySelectorAll(selector));
  const green = pick('[data-transition-layer="green"] [data-transition-half]');
  const dark = pick('[data-transition-layer="dark"] [data-transition-half]');
  if (!green.length || !dark.length) return null;

  return {
    green,
    dark,
    leftHalves: pick('[data-transition-half="left"]'),
    rightHalves: pick('[data-transition-half="right"]'),
  };
}

export async function coverScreen() {
  const collapsing = takeMenuCollapse();
  if (collapsing) {
    await Promise.race([collapsing, new Promise((r) => setTimeout(r, 1200))]);
  }

  const k = transitionCurtains();
  if (!k) return;

  closeCurtainGate();

  return new Promise((done) => {
    gsap
      .timeline({ onComplete: done })
      .set(k.leftHalves, { transformOrigin: 'left center', scaleX: 0 })
      .set(k.rightHalves, { transformOrigin: 'right center', scaleX: 0 })
      .to(k.green, { scaleX: 1, duration: CURTAIN_TIME, ease: GREEN_EASE }, 0)
      .to(k.dark, { scaleX: 1, duration: CURTAIN_TIME, ease: DARK_EASE }, DARK_DELAY);
  });
}

function uncoverScreen() {
  const k = transitionCurtains();
  if (!k) return openCurtainGate();

  const openEnd = DARK_DELAY + CURTAIN_TIME;
  const animationStart = Math.max(0, openEnd - ANIMATION_LEAD);

  gsap
    .timeline({ onComplete: openCurtainGate })
    .set(k.leftHalves, { transformOrigin: 'left center' })
    .set(k.rightHalves, { transformOrigin: 'right center' })
    .to(k.dark, { scaleX: 0, duration: CURTAIN_TIME, ease: DARK_EASE }, 0)
    .to(k.green, { scaleX: 0, duration: CURTAIN_TIME, ease: GREEN_EASE }, DARK_DELAY)
    .call(openCurtainGate, null, animationStart);
}

const LOADER_TIME = 3.6;
const SLOWDOWN_THRESHOLD = 87;
const RAMP_SHARE = 0.62;
const NUMBER_EXIT = 0.5;
const BAR_COLLAPSE = 0.55;

let firstVisit = true;

let loadingScreenActive = false;

export const isLoadingScreenActive = () => loadingScreenActive;

function playLoadingScreen(screen) {
  const readNumber = screen.querySelector('[data-loader-number]');
  const bar = screen.querySelector('[data-loader-bar]');
  const left = gsap.utils.toArray(screen.querySelectorAll('[data-loader-half="left"]'));
  const right = gsap.utils.toArray(screen.querySelectorAll('[data-loader-half="right"]'));
  const halves = [...left, ...right];

  window.scrollTo(0, 0);
  getLenis()?.scrollTo(0, { immediate: true, force: true });

  getLenis()?.stop();
  loadingScreenActive = true;

  const recalc = () => {
    ScrollTrigger.refresh();
    holdUnderCurtain();
  };

  const unlock = () => {
    if (!loadingScreenActive) return;
    loadingScreenActive = false;
    getLenis()?.start();
  };

  const state = { progress: 0 };
  const write = () => {
    if (readNumber) readNumber.textContent = String(Math.round(state.progress));
    if (bar) gsap.set(bar, { scaleX: state.progress / 100 });
  };

  gsap
    .timeline({
      onComplete: () => {
        unlock();
        screen.remove();
      },
    })
    .set(left, { transformOrigin: 'left center' })
    .set(right, { transformOrigin: 'right center' })
    .to(state, {
      progress: SLOWDOWN_THRESHOLD,
      duration: LOADER_TIME * RAMP_SHARE,
      ease: 'none',
      onUpdate: write,
    })
    .to(state, {
      progress: 100,
      duration: LOADER_TIME * (1 - RAMP_SHARE),
      ease: 'power2.out',
      onUpdate: write,
    })
    .call(recalc)
    .to(readNumber, { yPercent: 130, duration: NUMBER_EXIT, ease: 'power3.in' })
    .set(bar, { transformOrigin: 'right center' }, '<')
    .to(bar, { scaleX: 0, duration: BAR_COLLAPSE, ease: 'power2.inOut' }, '<+=0.12')
    .to(halves, { scaleX: 0, duration: CURTAIN_TIME, ease: DARK_EASE }, '>-0.15')
    .call(unlock, null, '<')
    .call(uncoverScreen, null, `-=${CURTAIN_TIME - DARK_DELAY}`);
}

const LAYOUT_THRESHOLD = '(width >= 64rem)';
const REBUILD_KEY = 'layout-rebuild';

const savePosition = () => {
  try {
    sessionStorage.setItem(REBUILD_KEY, String(Math.round(window.scrollY)));
  } catch {
  }
};

const readPosition = () => {
  try {
    const value = sessionStorage.getItem(REBUILD_KEY);
    if (value !== null) sessionStorage.removeItem(REBUILD_KEY);
    return value === null ? null : Number(value);
  } catch {
    return null;
  }
};

window.matchMedia(LAYOUT_THRESHOLD).addEventListener('change', () => {
  savePosition();
  location.reload();
});

export function onPageEnter() {
  const positionAfterRebuild = readPosition();
  const afterRebuild = positionAfterRebuild !== null;

  const screen = firstVisit && !afterRebuild ? document.querySelector('[data-loader]') : null;
  firstVisit = false;

  if (!screen) {
    document.querySelector('[data-loader]')?.remove();

    if (afterRebuild) {
      window.scrollTo(0, positionAfterRebuild);
      getLenis()?.scrollTo(positionAfterRebuild, { immediate: true, force: true });
      ScrollTrigger.refresh();
    }

    uncoverScreen();
    return;
  }

  playLoadingScreen(screen);
}
