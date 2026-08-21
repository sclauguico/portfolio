// Single source of truth for the domain the site is served from.
// Changing DOMAIN repoints the canonical URL and every contact address.
// Two files outside this module also carry the domain and must be edited
// by hand, because their formats can't import TS:
//   - CNAME + public/CNAME  (GitHub Pages custom-domain binding)
//   - worker/wrangler.toml  (ALLOWED_ORIGINS, and the custom-domain route)
// The worker mirrors these values in worker/src/config.ts.

export const DOMAIN = 'sailauguico.com';
export const SITE_URL = `https://${DOMAIN}`;
export const CONTACT_EMAIL = `hello@${DOMAIN}`;
