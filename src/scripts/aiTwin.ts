type Role = 'user' | 'assistant';
type Message = { role: Role; content: string };

export interface MountChatOptions {
  root: HTMLElement;
  endpoint: string;
  fallbackEmail?: string;
}

const THINKING_DOTS =
  '<span class="inline-flex items-center gap-1" role="status" aria-label="Thinking">' +
  '<span class="h-1.5 w-1.5 rounded-full bg-subtle animate-pulse" style="animation-delay:0ms"></span>' +
  '<span class="h-1.5 w-1.5 rounded-full bg-subtle animate-pulse" style="animation-delay:200ms"></span>' +
  '<span class="h-1.5 w-1.5 rounded-full bg-subtle animate-pulse" style="animation-delay:400ms"></span>' +
  '</span>';

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

export function mountChat({ root, endpoint, fallbackEmail = 'hello@sailauguico.io' }: MountChatOptions): void {
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

  const addBubble = (role: Role, text: string): HTMLElement => {
    if (transcript.querySelector('.italic')) transcript.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = role === 'user' ? 'mt-3 flex justify-end' : 'mt-3';
    const bubble = document.createElement('div');
    bubble.className =
      role === 'user'
        ? 'inline-block max-w-[85%] px-3 py-2 rounded-md bg-ink text-bg text-[13.5px] leading-snug whitespace-pre-wrap'
        : 'text-ink text-[13.5px] leading-relaxed';
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

    const bubble = addBubble('assistant', '');
    let accumulated = '';

    try {
      const res = await fetch(`${endpoint}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: history.slice(0, -1) }),
      });

      if (!res.ok || !res.body) {
        await res.text().catch(() => '');
        bubble.innerHTML = escapeHtml(
          `My twin is catching its breath. Try again in a minute, or email ${fallbackEmail} and I'll get back to you.`,
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        bubble.innerHTML = renderAssistant(accumulated);
        transcript.scrollTop = transcript.scrollHeight;
      }
      history.push({ role: 'assistant', content: accumulated });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      bubble.innerHTML = escapeHtml(`Network hiccup: ${msg}. Try again, or email ${fallbackEmail}.`);
    } finally {
      setBusy(false);
      input.focus();
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    void ask(msg);
  });

  transcript.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    const btn = target?.closest<HTMLElement>('[data-suggestion]');
    if (!btn || busy) return;
    const msg = btn.dataset.suggestion?.trim();
    if (!msg) return;
    void ask(msg);
  });

  reset?.addEventListener('click', () => {
    history = [];
    transcript.innerHTML = initialTranscript;
    input.focus();
  });
}
