const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function resolveAllowedOrigin(origin: string | null, allowed: string[]): string {
  if (!origin) return allowed[0] ?? '*';
  if (allowed.includes(origin)) return origin;
  if (LOCALHOST.test(origin)) return origin;
  return allowed[0] ?? '*';
}

export function corsHeaders(
  origin: string | null,
  allowed: string[],
): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(origin, allowed),
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function json(
  data: unknown,
  status: number,
  extra: HeadersInit = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}
