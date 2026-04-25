function extractDelta(payload: string): string {
  try {
    const parsed = JSON.parse(payload);
    return parsed?.choices?.[0]?.delta?.content ?? parsed?.response ?? '';
  } catch {
    return '';
  }
}

export async function peekStreamForContent(
  source: ReadableStream<Uint8Array>,
  timeoutMs = 5000,
): Promise<{ hasContent: boolean; replay: ReadableStream<Uint8Array> }> {
  const [probe, replay] = source.tee();
  const reader = probe.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | undefined;

  return new Promise((resolve) => {
    const finish = (hasContent: boolean) => {
      if (timer !== undefined) clearTimeout(timer);
      reader.cancel().catch(() => {});
      resolve({ hasContent, replay });
    };
    timer = setTimeout(() => finish(false), timeoutMs);

    (async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) { finish(false); return; }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const payload = t.slice(5).trim();
            if (payload === '[DONE]') continue;
            if (extractDelta(payload)) { finish(true); return; }
          }
        }
      } catch {
        finish(false);
      }
    })();
  });
}

export function sseToDeltas(
  source: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  (async () => {
    const reader = source.getReader();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') {
            await writer.close();
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            const delta: string =
              parsed?.choices?.[0]?.delta?.content ??
              parsed?.response ??
              '';
            if (delta) await writer.write(encoder.encode(delta));
          } catch {}
        }
      }
    } catch (err) {
      await writer.write(
        encoder.encode(
          `\n\n[stream error: ${err instanceof Error ? err.message : 'unknown'}]`,
        ),
      );
    } finally {
      try {
        await writer.close();
      } catch {}
    }
  })();

  return readable;
}
