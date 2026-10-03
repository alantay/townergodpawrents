// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Absolute URLs for link previews (og:image) need to know where we live.
  site: 'https://townergodpawrents.vercel.app',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    // Stamped into every page so an old tab can tell a newer deploy is out.
    define: {
      'import.meta.env.BUILD_ID': JSON.stringify(String(Date.now()))
    }
  }
});
