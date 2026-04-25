export interface Env {
  AI: {
    run: (
      model: string,
      input: Record<string, unknown>,
    ) => Promise<ReadableStream<Uint8Array> | unknown>;
  };
  ASK_LIMITER: {
    limit: (opts: { key: string }) => Promise<{ success: boolean }>;
  };
  OPENROUTER_API_KEY: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
  MODEL: string;
  WORKERS_AI_MODEL: string;
  ALLOWED_ORIGINS: string;
  LANGSMITH_API_KEY?: string;
  LANGSMITH_PROJECT?: string;
}

export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface AskRequest {
  message: string;
  history?: ChatMessage[];
}
