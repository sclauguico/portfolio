// Mirror of src/data/site.ts — the worker is a separate build unit and
// can't import from the Astro app. Keep these in sync with it, and with
// ALLOWED_ORIGINS in wrangler.toml.

export const DOMAIN = 'sclauguico.github.io';
export const SITE_URL = `https://${DOMAIN}`;

// Not derived from DOMAIN: github.io can't host a mailbox.
export const CONTACT_EMAIL = 'sclauguico@gmail.com';
