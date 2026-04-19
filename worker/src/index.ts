import type { AskRequest, ChatMessage, Env } from './env';
import { corsHeaders, json } from './http';
import { logRun } from './langsmith';
import { runOpenRouter, runWorkersAI } from './providers';
import { sseToDeltas } from './sse';

const MAX_HISTORY = 8;
const MAX_MESSAGE_LEN = 1000;

function sanitizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_HISTORY)
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length <= MAX_MESSAGE_LEN,
    );
}

async function handleAsk(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  cors: Record<string, string>,
): Promise<Response> {
  let body: AskRequest;
  try {
    body = (await request.json()) as AskRequest;
  } catch {
    return json({ error: 'invalid json' }, 400, cors);
  }

  const message = (body.message ?? '').toString().trim();
  if (!message) return json({ error: 'missing message' }, 400, cors);
  if (message.length > MAX_MESSAGE_LEN) return json({ error: 'message too long' }, 413, cors);

  const history = sanitizeHistory(body.history);
  const messages: ChatMessage[] = [...history, { role: 'user', content: message }];
  const startTime = Date.now();
  let modelUsed = env.WORKERS_AI_MODEL;

  let source = await runWorkersAI(env, messages);
  if (!source) {
    const fallback = await runOpenRouter(env, messages);
    if (!fallback.source) {
      return json(
        { error: 'upstream failed', status: fallback.status, detail: fallback.detail },
        502,
        cors,
      );
    }
    source = fallback.source;
    modelUsed = env.MODEL;
  }

  const [forUser, forLog] = sseToDeltas(source).tee();

  ctx.waitUntil(
    (async () => {
      const reader = forLog.getReader();
      const decoder = new TextDecoder();
      let full = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
        }
      } catch {}
      await logRun(env, {
        inputs: messages,
        output: full,
        model: modelUsed,
        startTime,
        endTime: Date.now(),
      });
    })(),
  );

  return new Response(forUser, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      ...cors,
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
    const cors = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/api/health') {
      return json(
        { ok: true, primary: env.WORKERS_AI_MODEL, fallback: env.MODEL },
        200,
        cors,
      );
    }

    if (url.pathname !== '/api/ask') {
      return json({ error: 'not found' }, 404, cors);
    }

    if (request.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405, cors);
    }

    return handleAsk(request, env, ctx, cors);
  },
};
