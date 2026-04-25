import { track } from '@/scripts/track';

const SOCIAL_HOSTS: Record<string, string> = {
  'github.com': 'github',
  'www.linkedin.com': 'linkedin',
  'linkedin.com': 'linkedin',
  'medium.com': 'medium',
  'scholar.google.com': 'scholar',
  'scholar.google.com.ph': 'scholar',
};

function networkFor(href: string): string | null {
  try {
    return SOCIAL_HOSTS[new URL(href, location.href).hostname] ?? null;
  } catch {
    return null;
  }
}

function surfaceFor(el: HTMLElement): string {
  const explicit = el.closest<HTMLElement>('[data-surface]');
  if (explicit?.dataset.surface) return explicit.dataset.surface.trim();
  if (el.closest('footer')) return 'footer';
  if (el.closest('header')) return 'header';
  const section = el.closest<HTMLElement>('section[id]');
  if (section?.id) return section.id.trim();
  return 'unknown';
}

export function mountSocialTracking(): void {
  if (typeof document === 'undefined') return;
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    const link = target?.closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    const network = networkFor(link.href);
    if (!network) return;
    track('social_click', { network, surface: surfaceFor(link) });
  });
}
