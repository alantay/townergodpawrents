// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Absolute URLs for link previews (og:image) need to know where we live.
  site: 'https://townergodpawrents.vercel.app',
  vite: {
    plugins: [tailwindcss()]
  }
});