import { gsap } from 'gsap';
import { getLenis } from './runtime.js';

let formController = null;
let pageFormController = null;

const NAME_PATTERN = /^\p{L}[\p{L}\s.'-]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;

const isPhoneLength = (raw) => {
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return digits.length >= 8 && digits.length <= 15;
  if (digits.startsWith('00')) return digits.length >= 10 && digits.length <= 17;
  if (digits.startsWith('48') && digits.length === 11) return true;
  return digits.length === 9;
};

const tooLong = (value, limit) => (value.length > limit ? `Za długi tekst. Maksimum to ${limit} znaków.` : '');

const LEAD_RULES = {
  name: (value) => {
    if (!value) return 'Wpisz imię i nazwisko.';
    if (value.length < 2) return 'Imię i nazwisko jest za krótkie.';
    if (!NAME_PATTERN.test(value)) return 'Imię i nazwisko może zawierać tylko litery i spacje.';
    return tooLong(value, 120);
  },
  phone: (value) => {
    if (!value) return 'Wpisz numer telefonu.';
    if (!PHONE_PATTERN.test(value)) return 'Numer telefonu może zawierać tylko cyfry, spacje i znak +.';
    if (!isPhoneLength(value)) return 'Sprawdź numer. Powinien mieć 9 cyfr, np. 600 100 200.';
    return tooLong(value, 40);
  },
  email: (value) => {
    if (!value) return 'Wpisz adres e-mail.';
    if (!EMAIL_PATTERN.test(value)) return 'Sprawdź adres e-mail, np. jan.kowalski@firma.pl.';
    return tooLong(value, 160);
  },
  businessForm: (value) => (value ? '' : 'Wybierz formę działalności z listy.'),
  scope: (value) => tooLong(value, 300),
  message: (value) => tooLong(value, 2000),
};

async function sendLead(form) {
  const data = new FormData(form);
  const value = (key) => String(data.get(key) ?? '').trim();

  const invalid = Object.entries(LEAD_RULES).some(([key, rule]) => rule(value(key)));
  if (invalid) return false;

  data.set('source', form.dataset.formSource === 'panel' ? 'drawer' : 'kontakt');

  try {
    const response = await fetch(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}contact.php`, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result?.ok === true;
  } catch {
    return false;
  }
}

function bindFormSteps(root, signal) {
  const form = root.querySelector('[data-form-node]');
  const thanks = root.querySelector('[data-form-thanks]');
  const steps = gsap.utils.toArray(root.querySelectorAll('[data-step]'));
  const bar = root.querySelector('[data-form-progress]');
  const number = root.querySelector('[data-form-number]');

  const UNCOVERED = 'inset(0% 0% 0% 0%)';
  const COLLAPSED_RIGHT = 'inset(0% 0% 0% 100%)';
  const COLLAPSED_LEFT = 'inset(0% 100% 0% 0%)';

  let activeStep = 0;

  const setProgress = (index) => {
    if (bar) {
      gsap.to(bar, {
        scaleX: (index + 1) / steps.length,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
    if (number) number.textContent = String(index + 1).padStart(2, '0');
  };

  if (bar) gsap.set(bar, { scaleX: 1 / Math.max(steps.length, 1), transformOrigin: 'left center' });

  const showStep = (index, direction = 1) => {
    const older = steps[activeStep];
    const newer = steps[index];
    if (!newer || older === newer) return;

    gsap
      .timeline()
      .to(older, {
        clipPath: direction > 0 ? COLLAPSED_RIGHT : COLLAPSED_LEFT,
        duration: 0.35,
        ease: 'power2.in',
      })
      .add(() => {
        older.classList.add('hidden');
        older.classList.remove('flex');
        newer.classList.remove('hidden');
        newer.classList.add('flex');
      })
      .fromTo(
        newer,
        { clipPath: direction > 0 ? COLLAPSED_LEFT : COLLAPSED_RIGHT },
        { clipPath: UNCOVERED, duration: 0.5, ease: 'power3.out' }
      )
      .fromTo(
        newer.querySelectorAll('[data-form-field]'),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' },
        '<0.1'
      )
      .set(newer, { clipPath: 'none' });

    activeStep = index;
    setProgress(index);
  };

  const touched = new Set();

  const controlTarget = (control) =>
    control.closest('[data-select]')?.querySelector('[data-select-trigger]') ?? control;

  const ruledControls = (scope) =>
    [...scope.querySelectorAll('input, textarea, select')].filter((control) => LEAD_RULES[control.name]);

  const checkControl = (control) => {
    const message = LEAD_RULES[control.name](control.value.trim());
    const target = controlTarget(control);
    const note = root.querySelector(`[data-field-error="${control.name}"]`);

    if (message) {
      target.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-invalid', 'true');
    } else {
      target.removeAttribute('aria-invalid');
      control.removeAttribute('aria-invalid');
    }

    if (note) {
      if (!note.id) note.id = `${control.id || control.name}-error`;
      note.textContent = message;
      note.hidden = !message;
      if (message) target.setAttribute('aria-describedby', note.id);
      else target.removeAttribute('aria-describedby');
    }

    return !message;
  };

  const isStepValid = (step) => {
    const failed = ruledControls(step).filter((control) => {
      touched.add(control.name);
      return !checkControl(control);
    });

    if (failed.length) controlTarget(failed[0]).focus();
    return failed.length === 0;
  };

  const clearErrors = () => {
    touched.clear();
    ruledControls(root).forEach((control) => {
      controlTarget(control).removeAttribute('aria-invalid');
      controlTarget(control).removeAttribute('aria-describedby');
      control.removeAttribute('aria-invalid');
    });
    root.querySelectorAll('[data-field-error]').forEach((note) => {
      note.textContent = '';
      note.hidden = true;
    });
  };

  const recheck = (event) => {
    const control = event.target;
    if (!LEAD_RULES[control?.name]) return;
    if (event.type === 'change') touched.add(control.name);
    if (touched.has(control.name)) checkControl(control);
  };

  form?.addEventListener('input', recheck, { signal });
  form?.addEventListener('change', recheck, { signal });
  form?.addEventListener(
    'focusout',
    (event) => {
      const control = event.target;
      if (!LEAD_RULES[control?.name] || !control.value.trim()) return;
      touched.add(control.name);
      checkControl(control);
    },
    { signal }
  );

  root.querySelectorAll('[data-next]').forEach((el) => {
    el.addEventListener(
      'click',
      () => {
        if (isStepValid(steps[activeStep])) showStep(activeStep + 1, 1);
      },
      { signal }
    );
  });

  root.querySelectorAll('[data-reverse]').forEach((el) => {
    el.addEventListener('click', () => showStep(activeStep - 1, -1), { signal });
  });

  const trap = root.querySelector('[data-form-trap]');
  const errorNote = root.querySelector('[data-form-error]');
  const submitButton = form?.querySelector('[type="submit"]');
  let sending = false;

  form?.addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();

      if (activeStep < steps.length - 1) {
        if (isStepValid(steps[activeStep])) showStep(activeStep + 1, 1);
        return;
      }

      if (!isStepValid(steps[activeStep]) || sending) return;

      sending = true;
      errorNote?.classList.add('hidden');
      if (submitButton) {
        submitButton.disabled = true;
        gsap.to(submitButton, { opacity: 0.5, duration: 0.2 });
      }

      const delivered = trap?.value ? true : await sendLead(form);

      sending = false;
      if (submitButton) {
        submitButton.disabled = false;
        gsap.to(submitButton, { opacity: 1, duration: 0.2 });
      }

      if (!delivered) {
        errorNote?.classList.remove('hidden');
        return;
      }

      if (bar) gsap.to(bar, { scaleX: 1, duration: 0.6, ease: 'power2.out' });

      gsap
        .timeline()
        .to(form, { autoAlpha: 0, y: -20, duration: 0.3, ease: 'power2.in' })
        .add(() => {
          form.classList.add('hidden');
          thanks?.classList.remove('hidden');
        })
        .fromTo(
          thanks,
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }
        );
    },
    { signal }
  );

  const resetForm = () => {
    form?.reset();
    clearErrors();
    form?.classList.remove('hidden');
    gsap.set(form, { autoAlpha: 1, y: 0 });
    thanks?.classList.add('hidden');
    errorNote?.classList.add('hidden');

    steps.forEach((step, i) => {
      step.classList.toggle('hidden', i !== 0);
      step.classList.toggle('flex', i === 0);
      gsap.set(step, { clipPath: UNCOVERED });
    });
    gsap.set(steps[0]?.querySelectorAll('[data-form-field]') ?? [], { autoAlpha: 1, y: 0 });
    activeStep = 0;
    if (number) number.textContent = '01';
    if (bar) gsap.set(bar, { scaleX: 1 / Math.max(steps.length, 1) });
  };

  return { resetForm };
}

export function initPageForm() {
  const root = document.querySelector('[data-form-page]');
  if (!root) return;

  pageFormController?.abort();
  pageFormController = new AbortController();

  bindFormSteps(root, pageFormController.signal);
}

export function initContactForm() {
  const root = document.querySelector('[data-form]');
  if (!root) return;

  formController?.abort();
  formController = new AbortController();
  const { signal } = formController;

  const backdrop = root.querySelector('[data-form-backdrop]');
  const panel = root.querySelector('[data-form-panel]');
  const blocks = gsap.utils.toArray(root.querySelectorAll('[data-form-block]'));
  const parts = gsap.utils.toArray(root.querySelectorAll('[data-form-field]'));

  const COVERED = 'inset(0% 0% 0% 100%)';
  const UNCOVERED = 'inset(0% 0% 0% 0%)';

  gsap.set(panel, { clipPath: COVERED });
  gsap.set(blocks, { clipPath: COVERED });
  gsap.set(backdrop, { autoAlpha: 0 });
  gsap.set(parts, { autoAlpha: 0, x: 24 });

  const timeline = gsap
    .timeline({ paused: true, defaults: { ease: 'power3.out' } })
    .to(backdrop, { autoAlpha: 1, duration: 0.5 }, 0)
    .to(panel, { clipPath: UNCOVERED, duration: 0.7, ease: 'power4.inOut' }, 0)
    .to(blocks, { clipPath: UNCOVERED, duration: 0.6, stagger: 0.12 }, 0.2)
    .to(parts, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.05 }, 0.45);

  const { resetForm } = bindFormSteps(root, signal);

  let lastFocus = null;
  const isOpen = () => !root.hasAttribute('inert');

  const open = () => {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    root.removeAttribute('inert');
    root.style.pointerEvents = 'auto';
    getLenis()?.stop();
    timeline.play();
    gsap.delayedCall(0.35, () => panel?.querySelector('input, textarea')?.focus());
  };

  const close = () => {
    if (!isOpen()) return;
    root.setAttribute('inert', '');
    root.style.pointerEvents = 'none';
    getLenis()?.start();
    timeline.reverse();
    lastFocus?.focus?.();

    gsap.delayedCall(0.7, () => {
      if (isOpen()) return;
      resetForm();
    });
  };

  document.querySelectorAll('[data-open-form]').forEach((el) => {
    el.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        open();
      },
      { signal }
    );
  });

  root.querySelectorAll('[data-close-form]').forEach((el) => {
    el.addEventListener('click', close, { signal });
  });

  backdrop?.addEventListener('click', close, { signal });

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && isOpen()) close();
    },
    { signal }
  );
}

export function destroyForms() {
  formController?.abort();
  formController = null;
  pageFormController?.abort();
  pageFormController = null;
}
