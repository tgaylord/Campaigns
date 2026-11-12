/* The names switch's state, kept apart so data.ts and names.ts can both read it without a cycle. */
export type NameMode = "court" | "plain";
const KEY = "names.mode";
let mode: NameMode = (() => { try { return localStorage.getItem(KEY) === "plain" ? "plain" : "court"; } catch { return "court"; } })();
const listeners = new Set<(m: NameMode) => void>();
export const nameMode = () => mode;
export function setNameMode(m: NameMode) {
  mode = m;
  try { localStorage.setItem(KEY, m); } catch { /* the switch still works for this visit */ }
  listeners.forEach((f) => f(m));
}
export const onNameMode = (f: (m: NameMode) => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
