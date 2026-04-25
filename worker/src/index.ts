import type { AskRequest, ChatMessage, Env } from './env';
import { corsHeaders, json } from './http';
import { logRun } from './langsmith';
import { prefilter, refusalMessage } from './prefilter';
import { runGroq, runOpenRouter, runWorkersAI } from './providers';
import { sseToDeltas, peekStreamForContent } from './sse';

const MAX_HISTORY = 8;
const MAX_MESSAGE_LEN = 1000;

async function hashKey(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

function sanitizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const trimmed = raw
    .slice(-MAX_HISTORY)
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length <= MAX_MESSAGE_LEN,
    );

  const clean: ChatMessage[] = [];
  for (let i = 0; i < trimmed.length; i++) {
    const m = trimmed[i];
    if (m.role === 'user' && prefilter(m.content).blocked) {
      if (i + 1 < trimmed.length && trimmed[i + 1].role === 'assistant') i++;
      continue;
    }
    clean.push(m);
  }
  return clean;
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

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const ipKey = await hashKey(ip);
  const limited = await env.ASK_LIMITER.limit({ key: ipKey }).catch(() => ({ success: true }));
  if (!limited.success) {
    const msg =
      "Whoa, slow down :) try again in about a minute. Or grab a coffee meanwhile: https://buymeacoffee.com/sai_documents";
    return new Response(msg, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Twin-Refusal': 'rate-limit',
        ...cors,
      },
    });
  }

  const history = sanitizeHistory(body.history);
  const messages: ChatMessage[] = [...history, { role: 'user', content: message }];
  const startTime = Date.now();

  const pre = prefilter(message);
  if (pre.blocked) {
    const refusal = refusalMessage(pre.tag);
    ctx.waitUntil(
      logRun(env, {
        inputs: messages,
        output: refusal,
        model: `prefilter:${pre.tag ?? 'blocked'}`,
        startTime,
        endTime: Date.now(),
      }),
    );
    return new Response(refusal, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Twin-Refusal': pre.tag ?? 'blocked',
        ...cors,
      },
    });
  }

  let modelUsed = env.WORKERS_AI_MODEL;

  let source = await runWorkersAI(env, messages);

  if (source) {
    const peek = await peekStreamForContent(source, 5000);
    if (!peek.hasContent) {
      console.warn('Workers AI returned empty stream; falling back');
      source = null;
    } else {
      source = peek.replay;
    }
  }

  if (!source) {
    const groq = await runGroq(env, messages);
    if (groq.source) {
      const peek = await peekStreamForContent(groq.source, 5000);
      if (peek.hasContent) {
        source = peek.replay;
        modelUsed = env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      } else {
        console.warn('Groq returned empty stream; falling back');
      }
    } else if (groq.detail !== 'no GROQ_API_KEY') {
      console.warn('Groq failed:', groq.status, groq.detail.slice(0, 200));
    }
  }

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
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
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

    if (url.pathname === '/api/warm') {
      if (request.method !== 'POST') {
        return json({ error: 'method not allowed' }, 405, cors);
      }
      ctx.waitUntil(
        env.AI.run(env.WORKERS_AI_MODEL, {
          messages: [{ role: 'user', content: 'ok' }],
          max_tokens: 1,
          stream: false,
        }).catch(() => {}),
      );
      return new Response(null, { status: 204, headers: cors });
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
