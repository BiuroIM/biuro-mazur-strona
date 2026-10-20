
const pages = [
  { label: 'Start', href: '/' },
  { label: 'O nas', href: '/o-nas' },
  { label: 'Usługi', href: '/uslugi' },
];

export const footerPages = [
  ...pages,
  { label: 'Blog', href: '/blog' },
  { label: 'Kontakt', href: '/kontakt' },
];

export const currentPath = (url) => url.pathname.replace(/\/+$/, '') || '/';
