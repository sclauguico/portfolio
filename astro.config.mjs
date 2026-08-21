import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { SITE_URL } from './src/data/site';

export default defineConfig({
  site: SITE_URL,
  integrations: [tailwind({ applyBaseStyles: false })],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
