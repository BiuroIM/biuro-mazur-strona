import { pageData } from './content.js';

const company = await pageData('company');

const phoneDigits = company.phone.replace(/\D/g, '');

export const phone = {
  label: company.phone,
  href: `tel:+48${phoneDigits}`,
};

export const email = {
  label: company.email,
  href: `mailto:${company.email}`,
};

export const address = {
  label: `${company.address.street}, ${company.address.postalCode} ${company.address.city}`,
};

export const openingHours = {
  label: company.hours.label,
  sentence: company.hours.sentence,
};

export const postalAddress = {
  street: company.address.street,
  postalCode: company.address.postalCode,
  city: company.address.city,
  country: 'PL',
};

export const businessHours = {
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  opens: company.hours.opens,
  closes: company.hours.closes,
};

export const callback = company.callback;

export const facebook = {
  label: 'Facebook',
  href: company.facebook,
};

export const brandName = company.brandName;

export const legalName = company.legalName;

export const tagline = company.tagline;

export const registry = company.registry;

export const geo = company.geo;
