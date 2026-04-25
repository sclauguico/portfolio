import type { Env } from './env';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  env: Env,
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  if (!env.RL_KV) {
    console.warn('RL_KV binding missing; rate limit not enforced');
    return { allowed: true, remaining: limit };
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSec;

  let timestamps: number[] = [];
  try {
    const stored = await env.RL_KV.get(key);
    if (stored) timestamps = JSON.parse(stored);
  } catch (err) {
    console.error('RL_KV read failed:', err instanceof Error ? err.message : err);
    return { allowed: true, remaining: limit };
  }

  timestamps = timestamps.filter((t) => t >= windowStart);

  if (timestamps.length >= limit) {
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  try {
    await env.RL_KV.put(key, JSON.stringify(timestamps), {
      expirationTtl: Math.max(windowSec * 2, 60),
    });
  } catch (err) {
    console.error('RL_KV write failed:', err instanceof Error ? err.message : err);
  }

  return { allowed: true, remaining: limit - timestamps.length };
}
