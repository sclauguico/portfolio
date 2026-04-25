import { SYSTEM_PROMPT } from './system-prompt';
import type { ChatMessage, Env } from './env';

const DEFAULT_TEMPERATURE = 0.6;
const DEFAULT_MAX_TOKENS = 500;
const MAX_OPENROUTER_MODELS = 3;

export interface ProviderResult {
  source: ReadableStream<Uint8Array> | null;
  status: number;
  detail: string;
}

export async function runWorkersAI(
  env: Env,
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array> | null> {
  try {
    const result = await env.AI.run(env.WORKERS_AI_MODEL, {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      stream: true,
      max_tokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    });
    return result instanceof ReadableStream ? result : null;
  } catch (err) {
    console.error('Workers AI failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function runGroq(
  env: Env,
  messages: ChatMessage[],
): Promise<ProviderResult> {
  if (!env.GROQ_API_KEY) {
    return { source: null, status: 0, detail: 'no GROQ_API_KEY' };
  }

  const model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    return { source: null, status: res.status, detail };
  }
  return { source: res.body, status: 200, detail: '' };
}

export async function runOpenRouter(
  env: Env,
  messages: ChatMessage[],
): Promise<ProviderResult> {
  const models = [
    env.MODEL,
    'nvidia/nemotron-nano-9b-v2:free',
    'openai/gpt-oss-20b:free',
  ]
    .filter((m, i, a) => Boolean(m) && a.indexOf(m) === i)
    .slice(0, MAX_OPENROUTER_MODELS);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://sailauguico.io',
      'X-Title': 'Sandy Lauguico AI Twin',
    },
    body: JSON.stringify({
      model: models[0],
      models,
      stream: true,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS,
      provider: { sort: 'throughput' },
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    return { source: null, status: res.status, detail };
  }
  return { source: res.body, status: 200, detail: '' };
}
