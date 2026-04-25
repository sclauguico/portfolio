import { trackEvent } from '@/scripts/analytics';

export function track(
  name: string,
  params: Record<string, unknown> = {},
): void {
  trackEvent(name, params);
}
