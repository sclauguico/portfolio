import { track } from '@/scripts/track';

type Role = 'user' | 'assistant';
type Message = { role: Role; content: string };

export interface MountChatOptions {
  root: HTMLElement;
  endpoint: string;
  fallbackEmail?: string;
  surface?: 'fab' | 'inline';
}

const THINKING_DOTS =
  '<span class="inline-flex items-center gap-1" role="status" aria-label="Thinking">' +
  '<span class="h-1.5 w-1.5 rounded-full bg-subtle animate-pulse" style="animation-delay:0ms"></span>' +
  '<span class="h-1.5 w-1.5 rounded-full bg-subtle animate-pulse" style="animation-delay:200ms"></span>' +
  '<span class="h-1.5 w-1.5 rounded-full bg-subtle animate-pulse" style="animation-delay:400ms"></span>' +
  '</span>';

const SUGGESTION_POOL = [
  'What relevant experience do you have?',
  'What stack do you work with?',
  'Open to contract or retainer work?',
  'What recent projects have you worked on?',
  'Tell me about your research',
  'What kind of clients do you work with?',
  'What have you written about?',
  "What's your education?",
];

const SUGGESTION_BTN_CLASS =
  'block w-full text-left px-3 py-1.5 rounded-md border border-border bg-surface text-[13px] text-muted hover:text-ink hover:border-ink/20 transition';

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeAndLink(s: string): string {
  const urlRe = /https?:\/\/[^\s<>"'`]+/g;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(s)) !== null) {
    out += escapeHtml(s.slice(last, m.index));
    let url = m[0];
    const trail = url.match(/[.,;:!?)\]'"]+$/);
    let trailing = '';
    if (trail) {
      trailing = trail[0];
      url = url.slice(0, -trailing.length);
    }
    out +=
      `<a href="${url}" target="_blank" rel="noreferrer noopener" ` +
      `class="font-semibold text-ink underline decoration-ink decoration-2 underline-offset-4 hover:opacity-70 transition">${url}</a>`;
    if (trailing) out += escapeHtml(trailing);
    last = m.index + m[0].length;
  }
  out += escapeHtml(s.slice(last));
  return out;
}

function stripInlineMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, '$1')
    .replace(/(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*\d+\.\s+/gm, '');
}

export function renderAssistant(text: string): string {
  if (!text.trim()) return THINKING_DOTS;

  const lines = stripInlineMarkdown(text).split(/\r?\n/);
  const out: string[] = [];
  let listOpen = false;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p class="[&:not(:first-child)]:mt-2">${escapeAndLink(para.join(' '))}</p>`);
      para = [];
    }
  };
  const openList = () => {
    if (!listOpen) {
      flushPara();
      out.push('<ul class="mt-2 space-y-1.5 pl-5 list-disc marker:text-subtle">');
      listOpen = true;
    }
  };
  const closeList = () => {
    if (listOpen) {
      out.push('</ul>');
      listOpen = false;
    }
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    const bullet = trimmed.match(/^[•\-*]\s+(.*)$/);
    if (bullet) {
      openList();
      out.push(`<li>${escapeAndLink(bullet[1])}</li>`);
    } else if (!trimmed) {
      flushPara();
      closeList();
    } else {
      closeList();
      para.push(trimmed);
    }
  }
  flushPara();
  closeList();
  return out.join('');
}

let warmed = false;
export function warm(endpoint: string): void {
  if (warmed || !endpoint) return;
  warmed = true;
  fetch(`${endpoint}/api/warm`, { method: 'POST', keepalive: true }).catch(() => {});
}

export function mountChat({ root, endpoint, fallbackEmail = 'hello@sailauguico.io', surface = 'inline' }: MountChatOptions): void {
  const transcript = root.querySelector<HTMLElement>('[data-transcript]');
  const form = root.querySelector<HTMLFormElement>('[data-chat-form]');
  const input = root.querySelector<HTMLInputElement>('[data-chat-input]');
  const submit = root.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = root.querySelector<HTMLElement>('[data-submit-label]');
  const reset = root.querySelector<HTMLButtonElement>('[data-reset]');

  if (!transcript || !form || !input || !submit || !endpoint) return;

  const initialTranscript = transcript.innerHTML;
  let history: Message[] = [];
  let busy = false;

  const slots: string[] = SUGGESTION_POOL.slice(0, 3);
  let nextIdx = 3;
  let pendingReplaceIdx: number | null = null;
  let freeFormPointer = 0;

  const renderSuggestions = () => {
    transcript.querySelector<HTMLElement>('[data-suggestions]')?.remove();
    if (slots.length === 0) return;
    const container = document.createElement('div');
    container.className = 'mt-3 space-y-1.5';
    container.dataset.suggestions = '';
    slots.forEach((text, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.suggestion = text;
      btn.dataset.slotIndex = String(i);
      btn.className = SUGGESTION_BTN_CLASS;
      btn.textContent = text;
      container.appendChild(btn);
    });
    transcript.appendChild(container);
    transcript.scrollTop = transcript.scrollHeight;
  };

  const rotateSlots = () => {
    if (pendingReplaceIdx === null) return;
    const i = pendingReplaceIdx;
    if (nextIdx < SUGGESTION_POOL.length) {
      slots[i] = SUGGESTION_POOL[nextIdx];
      nextIdx++;
    } else {
      slots.splice(i, 1);
    }
    pendingReplaceIdx = null;
  };

  const addBubble = (role: Role, text: string): HTMLElement => {
    if (role === 'user') {
      transcript.querySelector<HTMLElement>('p.italic')?.remove();
      transcript.querySelector<HTMLElement>('[data-suggestions]')?.remove();
    }
    const wrap = document.createElement('div');
    wrap.className = role === 'user' ? 'mt-3 flex justify-end' : 'mt-3';
    const bubble = document.createElement('div');
    bubble.className =
      role === 'user'
        ? 'inline-block max-w-[85%] px-3 py-2 rounded-md bg-ink text-bg text-[13.5px] leading-snug whitespace-pre-wrap break-words'
        : 'text-ink text-[13.5px] leading-relaxed break-words';
    bubble.innerHTML = role === 'user' ? escapeHtml(text) : renderAssistant(text);
    wrap.appendChild(bubble);
    transcript.appendChild(wrap);
    transcript.scrollTop = transcript.scrollHeight;
    return bubble;
  };

  const setBusy = (b: boolean) => {
    busy = b;
    submit.disabled = b;
    input.disabled = b;
    if (submitLabel) submitLabel.textContent = b ? '…' : 'Send';
  };

  const ask = async (message: string) => {
    if (busy) return;
    setBusy(true);
    addBubble('user', message);
    history.push({ role: 'user', content: message });
    track('ai_twin_message_sent', { length: message.length, surface });

    const bubble = addBubble('assistant', '');
    let accumulated = '';

    const ctrl = new AbortController();
    let stallTimer: number | undefined;
    const resetStall = () => {
      if (stallTimer !== undefined) clearTimeout(stallTimer);
      stallTimer = window.setTimeout(() => ctrl.abort(), 25000);
    };

    try {
      resetStall();
      const res = await fetch(`${endpoint}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: history.slice(0, -1) }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        await res.text().catch(() => '');
        bubble.innerHTML = escapeHtml(
          `My twin is catching its breath. Try again in a minute, or email ${fallbackEmail} and I'll get back to you.`,
        );
        return;
      }

      const refusalTag = res.headers.get('X-Twin-Refusal');
      if (refusalTag) {
        track('ai_twin_refusal', { tag: refusalTag, surface });
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        resetStall();
        accumulated += decoder.decode(value, { stream: true });
        bubble.innerHTML = renderAssistant(accumulated);
        transcript.scrollTop = transcript.scrollHeight;
      }

      if (!accumulated.trim()) {
        bubble.innerHTML = escapeHtml(
          `My twin went quiet. Try again, or email ${fallbackEmail}.`,
        );
      } else {
        history.push({ role: 'assistant', content: accumulated });
      }
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      bubble.innerHTML = escapeHtml(
        aborted
          ? `Took too long. Try again, or email ${fallbackEmail}.`
          : `Network hiccup: ${err instanceof Error ? err.message : 'unknown error'}. Try again, or email ${fallbackEmail}.`,
      );
    } finally {
      if (stallTimer !== undefined) clearTimeout(stallTimer);
      setBusy(false);
      input.focus();
      rotateSlots();
      renderSuggestions();
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    if (slots.length > 0) {
      pendingReplaceIdx = freeFormPointer % slots.length;
      freeFormPointer++;
    } else {
      pendingReplaceIdx = null;
    }
    void ask(msg);
  });

  transcript.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    const btn = target?.closest<HTMLElement>('[data-suggestion]');
    if (!btn || busy) return;
    const msg = btn.dataset.suggestion?.trim();
    if (!msg) return;
    const slotStr = btn.dataset.slotIndex;
    pendingReplaceIdx = slotStr !== undefined ? parseInt(slotStr, 10) : null;
    void ask(msg);
  });

  reset?.addEventListener('click', () => {
    history = [];
    transcript.innerHTML = initialTranscript;
    slots.length = 0;
    slots.push(...SUGGESTION_POOL.slice(0, 3));
    nextIdx = 3;
    pendingReplaceIdx = null;
    freeFormPointer = 0;
    renderSuggestions();
    input.focus();
  });

  renderSuggestions();
}
