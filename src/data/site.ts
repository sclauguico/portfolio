// Single source of truth for where the site is served from.
// Changing DOMAIN repoints the canonical URL and every self-reference.
// Two files outside this module also carry the host and must be edited
// by hand, because their formats can't import TS:
//   - CNAME + public/CNAME  (only exist when a custom domain is bound)
//   - worker/wrangler.toml  (ALLOWED_ORIGINS, and the custom-domain route)
// The worker mirrors these values in worker/src/config.ts.

export const DOMAIN = 'sclauguico.github.io';
export const SITE_URL = `https://${DOMAIN}`;

// Deliberately NOT derived from DOMAIN: github.io can't host a mailbox,
// so the contact address has to live somewhere else. If a custom domain
// is bound later, this can go back to `hello@${DOMAIN}`.
export const CONTACT_EMAIL = 'sclauguico@gmail.com';
