// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://biuro-mazur.pl',

  integrations: [sitemap()],

  fonts: [
    {
      provider: fontProviders.fontshare(),
      name: 'Satoshi',
      cssVariable: '--font-satoshi',
      weights: [400, 500, 700, 900],
      styles: ['normal'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontshare(),
      name: 'Clash Grotesk',
      cssVariable: '--font-clash',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Poppins',
      cssVariable: '--font-poppins',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
