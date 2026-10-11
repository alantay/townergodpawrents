// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Absolute URLs for link previews (og:image) need to know where we live.
  site: 'https://townergodpawrents.vercel.app',
  // Counts visitors so we can see how many people drop by. No cookies.
  adapter: vercel({ webAnalytics: { enabled: true } }),
  // Fetched at build time and served from our own domain, so a visit doesn't
  // wait on Google for the dog's name to appear.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Instrument Serif',
      cssVariable: '--font-instrument-serif',
      weights: [400],
      styles: ['normal', 'italic'],
      fallbacks: ['serif']
    },
    {
      provider: fontProviders.google(),
      name: 'Caveat',
      cssVariable: '--font-caveat',
      weights: [500, 600],
      styles: ['normal'],
      fallbacks: ['cursive']
    },
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      weights: [400, 600],
      styles: ['normal'],
      fallbacks: ['Helvetica', 'sans-serif']
    }
  ],
  vite: {
    plugins: [tailwindcss()],
    // Stamped into every page so an old tab can tell a newer deploy is out.
    define: {
      'import.meta.env.BUILD_ID': JSON.stringify(String(Date.now()))
    }
  }
});
