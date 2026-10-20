import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);


ScrollTrigger.config({ ignoreMobileResize: true });

let lenis = null;
let tickerCallback = null;

let curtainOpen = false;
let afterCurtainOpen = [];

export const getLenis = () => lenis;

export function openCurtainGate() {
  curtainOpen = true;
  const queue = afterCurtainOpen;
  afterCurtainOpen = [];
  queue.forEach((task) => task());
}

export function closeCurtainGate() {
  curtainOpen = false;
}

export function resetCurtainQueue() {
  afterCurtainOpen = [];
}

export function holdUnderCurtain() {
  if (curtainOpen) return;

  const held = ScrollTrigger.getAll()
    .filter((st) => st.animation && !st.vars.scrub)
    .map((st) => st.animation);
  if (!held.length) return;

  held.forEach((animation) => animation.pause(0));

  afterCurtainOpen.push(() => {
    held.forEach((animation) => {
      const st = animation.scrollTrigger;
      if (!st) {
        animation.play();
        return;
      }

      if (st.scroll() > st.end) animation.progress(1);
      else if (st.isActive) animation.play();
    });
  });
}

function restoreStatesAfterRefresh() {
  ScrollTrigger.getAll().forEach((st) => {
    const animation = st.animation;
    if (!animation) return;
    if (animation.isActive?.()) return;

    const item = animation.progress();
    animation.progress(0, true);
    animation.invalidate();
    animation.progress(1, true).progress(item, true);
  });

  const hasContainerTriggers = ScrollTrigger.getAll().some((st) => st.vars.containerAnimation);
  if (!hasContainerTriggers) return;

  const y = window.scrollY;
  window.scrollTo(0, y + 1);
  ScrollTrigger.update();
  window.scrollTo(0, y);
  ScrollTrigger.update();
}

function clearTiltsBeforeMeasure() {
  gsap.set('[data-horizontal-track] [data-rise-item]', { clearProps: 'transform' });

}


ScrollTrigger.addEventListener('refreshInit', clearTiltsBeforeMeasure);
ScrollTrigger.addEventListener('refresh', restoreStatesAfterRefresh);

export function initLenis() {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  tickerCallback = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);
}

export function destroyLenis() {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}

export const colorToken = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const isDesktopWidth = () => window.matchMedia('(min-width: 64rem)').matches;
