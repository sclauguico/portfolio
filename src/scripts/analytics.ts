import { getConsent, onConsentChange } from '@/scripts/consent';

const GA_ID = import.meta.env.PUBLIC_GA_ID ?? '';
const SCRIPT_ID = 'ga-gtag-script';
const DISABLE_KEY = `ga-disable-${GA_ID}` as const;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function loadGtag(): void {
  if (!GA_ID) return;

  (window as Record<string, unknown>)[DISABLE_KEY] = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ?? ((...args: unknown[]) => window.dataLayer.push(args));

  if (document.getElementById(SCRIPT_ID)) return;

  const cookieFlags =
    location.protocol === 'https:'
      ? 'SameSite=Strict;Secure'
      : 'SameSite=Strict';

  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_flags: cookieFlags,
  });

  const s = document.createElement('script');
  s.id = SCRIPT_ID;
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

function clearGaCookies(): void {
  if (!GA_ID) return;
  const names = ['_ga', `_ga_${GA_ID.replace(/^G-/, '')}`, '_gid'];
  const host = location.hostname;
  const apex = host.split('.').slice(-2).join('.');
  const domains = [host, `.${host}`, apex, `.${apex}`, ''];
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  for (const n of names) {
    for (const d of domains) {
      const domainPart = d ? `domain=${d};` : '';
      document.cookie = `${n}=; ${domainPart} path=/; ${expired}`;
    }
  }
}

function disableGa(): void {
  if (!GA_ID) return;
  (window as Record<string, unknown>)[DISABLE_KEY] = true;
  clearGaCookies();
}

export function initAnalytics(): void {
  if (!GA_ID) return;
  if (getConsent()?.analytics) loadGtag();
  onConsentChange((next) => {
    if (next?.analytics) loadGtag();
    else disableGa();
  });
}

export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
