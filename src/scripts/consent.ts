export type ConsentState = {
  analytics: boolean;
  ads: boolean;
  decidedAt: string;
};

const STORAGE_KEY = 'portfolio-consent-v1';
const CHANGE_EVENT = 'consent:change';

export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics !== 'boolean') return null;
    return parsed as ConsentState;
  } catch {
    return null;
  }
}

export function setConsent(
  partial: Partial<Omit<ConsentState, 'decidedAt'>>,
): ConsentState {
  const current = getConsent();
  const next: ConsentState = {
    analytics: partial.analytics ?? current?.analytics ?? false,
    ads: partial.ads ?? current?.ads ?? false,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  return next;
}

export function clearConsent(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: null }));
}

export function onConsentChange(
  cb: (state: ConsentState | null) => void,
): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
