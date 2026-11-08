import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { snapshots } from "./data";
import type { Land, SubjectLands } from "./data";
import type { Realm } from "./map";

/**
 * The heavy part of a checkpoint: its realm outlines and the full table of lands,
 * Granada's and its subjects'. Written by scripts/build-data.mjs to public/cp/<id>.json
 * and fetched only when a page needs that checkpoint, so the site's script stays small.
 */
export type Checkpoint = {
  id: string;
  realms: Record<string, Realm>;
  lands: Land[];
  subjectLands: Record<string, SubjectLands>;
};

const cache = new Map<string, Promise<Checkpoint | null>>();
const done = new Map<string, Checkpoint | null>();

export function loadCheckpoint(id: string): Promise<Checkpoint | null> {
  if (!cache.has(id)) {
    cache.set(id, fetch(`${import.meta.env.BASE_URL}cp/${id}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((cp: Checkpoint | null) => { done.set(id, cp); return cp; }));
  }
  return cache.get(id)!;
}

/** Warm the cache for checkpoints a page is likely to show next (the neighbours on a timeline). */
export function prefetchCheckpoints(ids: (string | undefined)[]) {
  for (const id of ids) if (id) void loadCheckpoint(id);
}

/**
 * One checkpoint's heavy data, or null while it loads. With `keep`, the last checkpoint that
 * finished loading stays on screen until the new one arrives, so maps don't blink between years.
 */
export function useCheckpoint(id: string | undefined, opts: { keep?: boolean } = {}): Checkpoint | null {
  const [cp, setCp] = useState<Checkpoint | null>(() => (id ? done.get(id) ?? null : null));
  useEffect(() => {
    let live = true;
    if (!id) { setCp(null); return; }
    const ready = done.get(id);
    if (ready !== undefined) { setCp(ready); return; }
    if (!opts.keep) setCp(null);
    loadCheckpoint(id).then((v) => { if (live) setCp(v); });
    return () => { live = false; };
  }, [id]);
  return cp && (!id || cp.id === id || opts.keep) ? cp : null;
}

/**
 * The checkpoint a hall shows, kept in the address as ?at=<id> so a view can be linked and
 * every hall that reads ?at= opens on the same year. Defaults to the latest checkpoint.
 */
export function useCheckpointParam(): [number, (i: number | ((n: number) => number)) => void] {
  const loc = useLocation();
  const nav = useNavigate();
  const read = () => {
    const at = new URLSearchParams(loc.search).get("at");
    const n = snapshots.findIndex((s) => s.id === at);
    return n >= 0 ? n : snapshots.length - 1;
  };
  const [i, setI] = useState(read);
  const cur = useRef(i); cur.current = i;
  useEffect(() => { setI(read()); }, [loc.search]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (v: number | ((n: number) => number)) => {
    const n = Math.max(0, Math.min(snapshots.length - 1, typeof v === "function" ? v(cur.current) : v));
    cur.current = n;
    setI(n);
    const q = new URLSearchParams(loc.search);
    if (n === snapshots.length - 1) q.delete("at"); else q.set("at", snapshots[n].id);
    const qs = q.toString();
    nav({ pathname: loc.pathname, search: qs ? `?${qs}` : "", hash: loc.hash }, { replace: true });
  };
  return [i, set];
}
