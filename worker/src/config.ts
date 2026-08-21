// Mirror of src/data/site.ts — the worker is a separate build unit and
// can't import from the Astro app. Keep DOMAIN in sync with it, and with
// ALLOWED_ORIGINS in wrangler.toml.

export const DOMAIN = 'sailauguico.com';
export const SITE_URL = `https://${DOMAIN}`;
export const CONTACT_EMAIL = `hello@${DOMAIN}`;
