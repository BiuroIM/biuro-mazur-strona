import { gsap } from 'gsap';

let selectController = null;

export function initCustomSelect() {
  const roots = gsap.utils.toArray('[data-select]');
  if (!roots.length) return;

  selectController?.abort();
  selectController = new AbortController();
  const { signal } = selectController;

  let openRoot = null;

  const build = (root) => {
    const native = root.querySelector('[data-select-native]');
    const trigger = root.querySelector('[data-select-trigger]');
    const list = root.querySelector('[data-select-list]');
    const value = root.querySelector('[data-select-value]');
    const chevron = root.querySelector('[data-select-chevron]');
    const options = gsap.utils.toArray(root.querySelectorAll('[data-select-option]'));
    if (!native || !trigger || !list || !value || !options.length) return null;

    const placeholder = value.textContent;
    const row = root.closest('[data-form-field]');
    const layer = row ?? root;
    let activeIndex = -1;
    let isOpen = false;

    gsap.set(list, { autoAlpha: 0, y: -8 });
    list.style.pointerEvents = 'none';

    const EDGE_MARGIN = 16;
    const MIN_PANEL = 120;
    const FLOATING = '[data-contact-pill]';
    let dropsUp = false;

    const floatingCeiling = (left, right) => {
      let ceiling = window.innerHeight;
      document.querySelectorAll(FLOATING).forEach((overlay) => {
        const box = overlay.getBoundingClientRect();
        if (!box.height || box.right <= left || box.left >= right) return;
        const onTop = document.elementFromPoint(
          gsap.utils.clamp(1, window.innerWidth - 1, box.left + box.width / 2),
          gsap.utils.clamp(1, window.innerHeight - 1, box.top + box.height / 2)
        );
        if (overlay.contains(onTop)) ceiling = Math.min(ceiling, box.top);
      });
      return ceiling;
    };

    const place = () => {
      list.style.top = '';
      list.style.bottom = '';
      list.style.maxHeight = '';

      const gap = Math.max(0, list.offsetTop - trigger.offsetHeight);
      const rect = trigger.getBoundingClientRect();
      const bounds = list.getBoundingClientRect();
      const roomBelow =
        floatingCeiling(bounds.left, bounds.right) - rect.bottom - gap - EDGE_MARGIN;
      const roomAbove = rect.top - gap - EDGE_MARGIN;
      const borders = list.offsetHeight - list.clientHeight;
      const wanted = list.scrollHeight + borders;

      dropsUp = roomBelow < wanted && (roomAbove >= wanted || roomAbove > roomBelow);

      const room = Math.max(MIN_PANEL, dropsUp ? roomAbove : roomBelow);
      list.style.maxHeight = `${Math.min(wanted, room)}px`;

      if (dropsUp) {
        list.style.top = 'auto';
        list.style.bottom = `calc(100% + ${gap}px)`;
      }
    };

    const markActive = (index) => {
      activeIndex = index;
      options.forEach((option, i) => {
        option.dataset.active = String(i === index);
      });
      list.setAttribute(
        'aria-activedescendant',
        index >= 0 ? options[index].id : ''
      );
      if (index >= 0) options[index].scrollIntoView({ block: 'nearest' });
    };

    const open = () => {
      if (isOpen) return;
      openRoot?.close();
      isOpen = true;
      openRoot = api;
      layer.style.zIndex = '40';
      trigger.setAttribute('aria-expanded', 'true');
      place();
      list.style.pointerEvents = 'auto';
      gsap.fromTo(
        list,
        { y: dropsUp ? 8 : -8 },
        { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power3.out' }
      );
      gsap.to(chevron, { rotate: 180, duration: 0.28, ease: 'power2.out' });
      markActive(options.findIndex((option) => option.dataset.value === native.value));
    };

    const close = ({ focusTrigger = false } = {}) => {
      if (!isOpen) return;
      isOpen = false;
      if (openRoot === api) openRoot = null;
      trigger.setAttribute('aria-expanded', 'false');
      list.style.pointerEvents = 'none';
      markActive(-1);
      gsap.to(list, {
        autoAlpha: 0,
        y: dropsUp ? 8 : -8,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          layer.style.zIndex = '';
        },
      });
      gsap.to(chevron, { rotate: 0, duration: 0.2, ease: 'power2.in' });
      if (focusTrigger) trigger.focus();
    };

    const pick = (index) => {
      const option = options[index];
      if (!option) return;
      native.value = option.dataset.value;
      native.dispatchEvent(new Event('change', { bubbles: true }));
      value.textContent = option.dataset.value;
      value.dataset.empty = 'false';
      options.forEach((item, i) => item.setAttribute('aria-selected', String(i === index)));
      close({ focusTrigger: true });
    };

    const reset = () => {
      native.value = '';
      value.textContent = placeholder;
      value.dataset.empty = 'true';
      options.forEach((option) => option.setAttribute('aria-selected', 'false'));
      close();
    };

    const step = (delta) => {
      if (!isOpen) {
        open();
        return;
      }
      const next = (activeIndex + delta + options.length) % options.length;
      markActive(next);
    };

    const api = { root, open, close, reset, isOpen: () => isOpen, reposition: place };

    trigger.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        if (isOpen) close();
        else open();
      },
      { signal }
    );

    trigger.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          step(e.key === 'ArrowDown' ? 1 : -1);
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isOpen && activeIndex >= 0) pick(activeIndex);
          else open();
          return;
        }
        if (e.key === 'Home' || e.key === 'End') {
          if (!isOpen) return;
          e.preventDefault();
          markActive(e.key === 'Home' ? 0 : options.length - 1);
          return;
        }
        if (e.key === 'Escape') close();
        if (e.key === 'Tab') close();
      },
      { signal }
    );

    options.forEach((option, i) => {
      option.addEventListener('click', () => pick(i), { signal });
    });

    if (row) {
      row.addEventListener(
        'click',
        (e) => {
          if (list.contains(e.target) || trigger.contains(e.target)) return;
          if (isOpen) close();
          else {
            open();
            trigger.focus();
          }
        },
        { signal }
      );
    }

    root.closest('form')?.addEventListener('reset', () => gsap.delayedCall(0, reset), { signal });

    return api;
  };

  const instances = roots.map(build).filter(Boolean);

  document.addEventListener(
    'pointerdown',
    (e) => {
      instances.forEach((instance) => {
        if (instance.isOpen() && !instance.root.contains(e.target)) instance.close();
      });
    },
    { signal }
  );

  window.addEventListener(
    'resize',
    () => {
      instances.forEach((instance) => {
        if (instance.isOpen()) instance.reposition();
      });
    },
    { signal }
  );
}

export function destroyCustomSelect() {
  selectController?.abort();
  selectController = null;
}
