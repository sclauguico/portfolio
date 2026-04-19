import type { ChatMessage, Env } from './env';

interface RunPayload {
  inputs: ChatMessage[];
  output: string;
  model: string;
  startTime: number;
  endTime: number;
  error?: string;
}

function uuid(): string {
  return crypto.randomUUID();
}

export async function logRun(env: Env, run: RunPayload): Promise<void> {
  const apiKey = env.LANGSMITH_API_KEY;
  if (!apiKey) return;
  const project = env.LANGSMITH_PROJECT ?? 'default';

  const body = {
    id: uuid(),
    name: 'ai-twin-ask',
    run_type: 'llm',
    inputs: { messages: run.inputs },
    outputs: { content: run.output },
    start_time: new Date(run.startTime).toISOString(),
    end_time: new Date(run.endTime).toISOString(),
    session_name: project,
    extra: { metadata: { model: run.model } },
    ...(run.error ? { error: run.error } : {}),
  };

  try {
    await fetch('https://api.smith.langchain.com/api/v1/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch {}
}
