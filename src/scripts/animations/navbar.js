import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let navbarController = null;

export function initNavbar() {
  const navbar = document.querySelector('[data-navbar]');
  if (!navbar) return;

  navbarController?.abort();
  navbarController = new AbortController();
  const { signal } = navbarController;

  const threshold = parseFloat(navbar.dataset.threshold ?? '15');
  const time = parseFloat(navbar.dataset.time ?? '0.45');
  const deadZone = parseFloat(navbar.dataset.deadZone ?? '4');

  let isHidden = false;
  let onDark = false;
  let lastY = 0;

  gsap.set(navbar, { yPercent: 0 });

  const show = () => {
    if (!isHidden) return;
    isHidden = false;
    gsap.to(navbar, { yPercent: 0, duration: time, ease: 'power3.out', overwrite: true });
  };

  const hide = () => {
    if (isHidden) return;
    isHidden = true;
    gsap.to(navbar, { yPercent: -100, duration: time, ease: 'power3.in', overwrite: true });
  };

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();

      if (y < (threshold * window.innerHeight) / 100) {
        lastY = y;
        show();
        return;
      }

      if (Math.abs(y - lastY) < deadZone) return;
      lastY = y;

      if (onDark) {
        hide();
        return;
      }

      if (self.direction === -1) show();
      else hide();
    },
  });

  let darkCount = 0;
  gsap.utils
    .toArray(document.querySelectorAll('[data-footer-transition], [data-dark-bg]'))
    .forEach((scene) => {
      ScrollTrigger.create({
        trigger: scene,
        start: scene.dataset.start ?? 'top top',
        end: scene.dataset.end ?? 'bottom bottom',
        onToggle: (self) => {
          darkCount = Math.max(0, darkCount + (self.isActive ? 1 : -1));
          onDark = darkCount > 0;
          if (onDark) hide();
        },
      });
    });

  navbar.addEventListener('focusin', show, { signal });
}

export function destroyNavbar() {
  navbarController?.abort();
  navbarController = null;
}
