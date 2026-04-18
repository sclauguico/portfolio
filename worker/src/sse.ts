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
