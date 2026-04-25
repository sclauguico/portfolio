import { track } from '@/scripts/track';

const MIN_DWELL_MS = 500;
const MAX_DWELL_MS = 5 * 60 * 1000;
const VISIBILITY_THRESHOLD = 0.5;

type State = { enteredAt: number | null; accumulated: number };

export function mountSectionDwell(): void {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

  const sections = document.querySelectorAll<HTMLElement>('section[id]');
  if (sections.length === 0) return;

  const states = new Map<HTMLElement, State>();
  for (const s of sections) states.set(s, { enteredAt: null, accumulated: 0 });

  const flush = (el: HTMLElement) => {
    const st = states.get(el);
    if (!st) return;
    if (st.enteredAt !== null) {
      st.accumulated += Date.now() - st.enteredAt;
      st.enteredAt = null;
    }
    const dwell = Math.min(st.accumulated, MAX_DWELL_MS);
    if (dwell >= MIN_DWELL_MS) {
      track('section_view', { section_id: el.id, dwell_ms: dwell });
    }
    st.accumulated = 0;
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        const st = states.get(el);
        if (!st) continue;
        if (e.isIntersecting) {
          st.enteredAt = Date.now();
        } else {
          flush(el);
        }
      }
    },
    { threshold: VISIBILITY_THRESHOLD },
  );
  for (const s of sections) io.observe(s);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      for (const [el, st] of states) {
        if (st.enteredAt !== null) {
          st.accumulated += Date.now() - st.enteredAt;
          st.enteredAt = null;
        }
        const dwell = Math.min(st.accumulated, MAX_DWELL_MS);
        if (dwell >= MIN_DWELL_MS) {
          track('section_view', { section_id: el.id, dwell_ms: dwell });
        }
        st.accumulated = 0;
      }
    }
  });

  window.addEventListener('pagehide', () => {
    for (const el of states.keys()) flush(el);
  });
}
