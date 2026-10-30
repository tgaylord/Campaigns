import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import { Link } from "react-router-dom";
import {
  snapshots, places, personById, events, countryByTag, countryName, isHeld, hijri, western,
  compact, nf, signed, EVENT_LABEL, subjectLands,
} from "../lib/data";
import type { Place, CampaignEvent } from "../lib/data";
import { gameMap, keyLabel, MAP_W, MAP_H } from "../lib/map";
import { CheckpointSelect } from "../components/bits";
import "./atlas.css";

/* ------------------------------------------------------------------ setup */

type Box = [number, number, number, number];
/** Three voyages: the realm close up, the Strait between its two shores, the whole western sea. */
const VIEWS: Record<"realm" | "strait" | "west", { label: string; ar: string; box: Box }> = {
  realm: { label: "The realm", ar: "المملكة", box: [170, 300, 520, 330] },
  strait: { label: "The Strait", ar: "الزقاق", box: [70, 170, 800, 500] },
  west: { label: "The western sea", ar: "بحر المغرب", box: [0, 0, MAP_W, MAP_H] },
};
type ViewId = keyof typeof VIEWS;

/** The lenses: what the land is coloured by. */
const LENSES = {
  realms: { label: "Realms", ar: "الممالك" },
  faith: { label: "Faith", ar: "الدين" },
  tongue: { label: "Tongue", ar: "اللسان" },
  people: { label: "People", ar: "الناس" },
  ruin: { label: "Ruin", ar: "الخراب" },
  hold: { label: "Hold", ar: "السيطرة" },
} as const;
type LensId = keyof typeof LENSES;

const SEAS = [
  { ar: "البحر المحيط", tr: "al-Baḥr al-Muḥīṭ", x: 150, y: 600, size: 1.1 },
  { ar: "بحر الروم", tr: "Baḥr al-Rūm", x: 700, y: 430, size: 1.2 },
  { ar: "بحر الزقاق", tr: "Baḥr al-Zuqāq", x: 262, y: 506, size: 0.38 },
];
const ROSE = { x: 185, y: 470 };
const OURS = "GRA";
const MIN_W = 70, MAX_W = MAP_W * 1.25;

/* ------------------------------------------------------------------ lenses: data */

/** One checkpoint's lens file (tools/map_layers.py): location → [pop, muslim%, christian%, jewish%, andalusi%, castilian%, prosperity, control, occupiedBy, looted, culture, religion] */
type Layer = { date: string; cols: string[]; rows: Record<string, [number, number, number, number, number, number, number, number, string | 0, string | 0, string | null, string | null]> };
const layerCache = new Map<string, Promise<Layer | null>>();
function loadLayer(id: string) {
  if (!layerCache.has(id)) {
    layerCache.set(id, fetch(`${import.meta.env.BASE_URL}layers/${id}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  }
  return layerCache.get(id)!;
}
function useLayer(id: string | undefined) {
  const [layer, setLayer] = useState<Layer | null>(null);
  useEffect(() => {
    let live = true;
    if (!id) { setLayer(null); return; }
    loadLayer(id).then((l) => { if (live) setLayer(l); });
    return () => { live = false; };
  }, [id]);
  return layer;
}

type Stats = { pop: number; prev: number | null; muslim: number; christian: number; jewish: number; andalusi: number; castilian: number; prosperity: number; control: number; px: number; looted: number; occupied: number; n: number };
/** Sum a set of locations: people summed, shares weighted by people. */
function stats(keys: string[], layer: Layer | null, prev: Layer | null, since: string): Stats | null {
  if (!layer) return null;
  const s: Stats = { pop: 0, prev: prev ? 0 : null, muslim: 0, christian: 0, jewish: 0, andalusi: 0, castilian: 0, prosperity: 0, control: 0, px: 0, looted: 0, occupied: 0, n: 0 };
  for (const k of keys) {
    const r = layer.rows[k];
    if (!r) continue;
    const p = r[0];
    s.n++; s.pop += p; s.px += gameMap.px[k] ?? 0;
    s.muslim += r[1] * p; s.christian += r[2] * p; s.jewish += r[3] * p; s.andalusi += r[4] * p; s.castilian += r[5] * p;
    s.prosperity += r[6] * p; s.control += r[7] * p;
    if (r[8]) s.occupied++;
    if (r[9] && r[9] > since && r[9] <= layer.date.split(".").map((x, i) => (i ? x.padStart(2, "0") : x)).join("-")) s.looted++;
    if (prev && s.prev != null) s.prev += prev.rows[k]?.[0] ?? 0;
  }
  if (!s.n) return null;
  const w = s.pop || 1;
  for (const f of ["muslim", "christian", "jewish", "andalusi", "castilian", "prosperity", "control"] as const) s[f] = s[f] / w;
  return s;
}

/* Colour ramps, light to dark; the diverging ones have a neutral middle. */
const RAMP = {
  faith: ["#7a2a1e", "#b5593b", "#dda584", "#e9dcbf", "#a7cba9", "#529d7b", "#1f6b52"],
  tongue: ["#efe5ca", "#e6cf98", "#d8b463", "#b98a33", "#86601c"],
  people: ["#f0e6cd", "#dcc49a", "#bd9868", "#8f683c", "#5b3e1f"],
  ruin: ["#6e1d10", "#b8402b", "#da7f5c", "#e9b48e", "#e6d8b8", "#a9c49a", "#5f9a6e"],
  hold: ["#efe5ca", "#cdd2e0", "#97a6cd", "#617ab5", "#2f4f94"],
};
const bin = (v: number, edges: number[]) => { let i = 0; while (i < edges.length && v >= edges[i]) i++; return i; };
function lensColour(lens: LensId, s: Stats | null): string | null {
  if (!s || lens === "realms") return null;
  switch (lens) {
    case "faith": return RAMP.faith[bin(s.muslim - s.christian, [-70, -35, -10, 10, 35, 70])];
    case "tongue": return RAMP.tongue[bin(s.andalusi, [5, 25, 50, 75])];
    case "people": { const d = s.px ? s.pop / s.px : 0; return RAMP.people[bin(d, [40, 80, 140, 240])]; }
    case "ruin": {
      if (s.prev == null || !s.prev) return "#e6d8b8";
      const c = (s.pop / s.prev - 1) * 100;
      return RAMP.ruin[bin(c, [-20, -10, -4, -1, 1, 4])];
    }
    case "hold": return RAMP.hold[bin(s.control, [20, 40, 60, 80])];
  }
}
const LEGEND: Record<Exclude<LensId, "realms">, { title: string; ramp: string[]; labels: string[] }> = {
  faith: { title: "Faith of the people", ramp: RAMP.faith, labels: ["Christian", "", "", "mixed", "", "", "Muslim"] },
  tongue: { title: "Share who are Andalusī", ramp: RAMP.tongue, labels: ["under 5%", "", "half", "", "over 75%"] },
  people: { title: "People per measure of land", ramp: RAMP.people, labels: ["empty", "", "", "", "crowded"] },
  ruin: { title: "People gained or lost since the last checkpoint", ramp: RAMP.ruin, labels: ["−20%", "", "", "held", "", "", "+4%"] },
  hold: { title: "The crown's control", ramp: RAMP.hold, labels: ["under 20%", "", "", "", "over 80%"] },
};

/* ------------------------------------------------------------------ names */

const placeByKey = new Map(places.map((p) => [p.key, p]));
function provinceName(key: string): { tr: string; ar?: string; place?: Place } {
  const seat = placeByKey.get(key.replace(/_province$/, ""));
  if (seat) return { tr: seat.name, ar: seat.nameArabic, place: seat };
  return { tr: gameMap.names?.provinces[key] ?? key.replace(/_province$/, "").replace(/_/g, " ") };
}
function locName(key: string): { tr: string; ar?: string; place?: Place } {
  const p = placeByKey.get(key);
  return p ? { tr: p.name, ar: p.nameArabic, place: p } : { tr: gameMap.names?.locations[key] ?? keyLabel(key) };
}
const areaName = (k: string | null) => (k ? gameMap.names?.areas[k] ?? k.replace(/_area$/, "").replace(/_/g, " ") : "");
const ownerName = (tag: string | undefined) => (tag ? (countryByTag.has(tag) ? countryName(tag) : tag) : "No one");

/** Where a battle was fought: its place, or the location its record names. */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯʿʾ]/g, "").toLowerCase().trim();
const NAME_INDEX = (() => {
  const m = new Map<string, string>();
  for (const [k, n] of Object.entries(gameMap.names?.locations ?? {})) m.set(fold(n), k);
  for (const p of places) m.set(fold(p.name), p.key);
  return m;
})();
function battleKey(e: CampaignEvent): string | null {
  if (e.places[0]) return places.find((p) => p.id === e.places[0])?.key ?? null;
  const loc = String((e.data as any)?.location ?? "");
  if (!loc) return null;
  for (const part of [loc, ...(loc.match(/\(([^)]+)\)/)?.slice(1) ?? []), loc.replace(/\s*\(.*\)/, "").replace(/^(off|the|before)\s+/i, "")]) {
    const k = NAME_INDEX.get(fold(part));
    if (k && gameMap.locations[k]) return k;
  }
  return null;
}

/* ------------------------------------------------------------------ the page */

export default function Atlas() {
  const [i, setI] = useState(snapshots.length - 1);
  const [lens, setLens] = useState<LensId>("realms");
  const [drawer, setDrawer] = useState(true);
  const [sel, setSel] = useState<{ prov: string; loc?: string } | null>(null);
  const [opened, setOpened] = useState(false);
  const [hover, setHover] = useState<{ prov: string; loc?: string; x: number; y: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const snap = snapshots[i];
  const prevSnap = i > 0 ? snapshots[i - 1] : undefined;
  const layer = useLayer(snap.id);
  const prevLayer = useLayer(prevSnap?.id);
  const realms = gameMap.realms[snap.id] ?? {};
  const owners = gameMap.owners[snap.id] ?? {};
  const subj = new Set(Object.keys(subjectLands[snap.id] ?? {}));

  /* --- the view box: pan, zoom, fly */
  const [vb, setVb] = useState<Box>(VIEWS.strait.box);
  const vbRef = useRef(vb); vbRef.current = vb;
  const svgRef = useRef<SVGSVGElement>(null);
  const anim = useRef<number | null>(null);
  const clamp = (b: Box): Box => {
    const w = Math.min(MAX_W, Math.max(MIN_W, b[2])), h = w * (b[3] / b[2]);
    const x = Math.min(MAP_W - w * 0.25, Math.max(-w * 0.75, b[0])), y = Math.min(MAP_H - h * 0.25, Math.max(-h * 0.75, b[1]));
    return [x, y, w, h];
  };
  const flyTo = (to: Box, ms = 520) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    const from = vbRef.current, t0 = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (t: number) => {
      const u = reduce ? 1 : Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - u, 3);
      setVb(clamp(from.map((v, n) => v + (to[n] - v) * e) as Box));
      if (u < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };
  const toSvg = (cx: number, cy: number) => {
    const svg = svgRef.current!; const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };
  const zoomAt = (cx: number, cy: number, f: number) => {
    const p = toSvg(cx, cy), [x, y, w, h] = vbRef.current;
    const nw = Math.min(MAX_W, Math.max(MIN_W, w * f)), r = nw / w;
    setVb(clamp([p.x - (p.x - x) * r, p.y - (p.y - y) * r, nw, h * r]));
  };
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (anim.current) cancelAnimationFrame(anim.current);
      const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(e.clientX, e.clientY, Math.exp(d * 0.0015));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ moved: boolean; x: number; y: number; vb: Box; a: number; pinch?: number } | null>(null);
  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = svgRef.current!.getScreenCTM()!.a;
    if (ptrs.current.size === 2) {
      const [p, q] = [...ptrs.current.values()];
      drag.current = { moved: true, x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, vb: vbRef.current, a, pinch: Math.hypot(p.x - q.x, p.y - q.y) };
    } else drag.current = { moved: false, x: e.clientX, y: e.clientY, vb: vbRef.current, a };
  };
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = drag.current; if (!d) return;
    if (d.pinch && ptrs.current.size === 2) {
      const [p, q] = [...ptrs.current.values()];
      const dist = Math.hypot(p.x - q.x, p.y - q.y);
      setVb(d.vb); zoomAt((p.x + q.x) / 2, (p.y + q.y) / 2, d.pinch / dist);
      return;
    }
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    if (!d.moved) { d.moved = true; svgRef.current!.setPointerCapture(e.pointerId); if (anim.current) cancelAnimationFrame(anim.current); }
    setHover(null);
    setVb(clamp([d.vb[0] - dx / d.a, d.vb[1] - dy / d.a, d.vb[2], d.vb[3]]));
  };
  const onUp = (e: RPointerEvent<SVGSVGElement>) => { ptrs.current.delete(e.pointerId); if (ptrs.current.size === 0) setTimeout(() => { drag.current = null; }, 0); };
  const wasDrag = () => !!drag.current?.moved;

  const [vx, vy, vw, vh] = vb;
  const k = vw / 800; // one screen-ish unit at the current zoom: labels keep their size on screen

  /* --- province facts at this checkpoint */
  const provList = useMemo(() => Object.entries(gameMap.provinces), []);
  const provOwner = useMemo(() => {
    const out: Record<string, { main?: string; all: Record<string, number> }> = {};
    for (const [key, p] of provList) {
      const all: Record<string, number> = {};
      for (const l of p.locations) { const t = owners[l]; if (t) all[t] = (all[t] ?? 0) + 1; }
      const main = Object.entries(all).sort((a, b) => b[1] - a[1])[0]?.[0];
      out[key] = { main, all };
    }
    return out;
  }, [owners, provList]);
  const since = prevSnap?.date ?? "0000-00-00";
  const provStats = useMemo(() => {
    const out: Record<string, Stats | null> = {};
    for (const [key, p] of provList) out[key] = stats(p.locations, layer, prevLayer, since);
    return out;
  }, [layer, prevLayer, provList, since]);

  /* --- selection */
  const selProv = sel ? gameMap.provinces[sel.prov] : undefined;
  useEffect(() => {
    if (!sel) { setOpened(false); return; }
    setOpened(false);
    const t = setTimeout(() => setOpened(true), 30);
    return () => clearTimeout(t);
  }, [sel?.prov]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSel(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const choose = (prov: string, el: SVGGraphicsElement | null) => {
    if (wasDrag()) return;
    if (sel?.prov === prov) return;
    setHover(null);
    setSel({ prov });
    setDrawer(true);
    if (el) {
      const b = el.getBBox();
      const svg = svgRef.current!, aspect = svg.clientWidth / Math.max(1, svg.clientHeight);
      let w = Math.max(b.width * 2.4, 90), h = Math.max(b.height * 2.2, 90 / aspect);
      if (w / h < aspect) w = h * aspect; else h = w / aspect;
      // leave room for the folio on the right
      const cx = b.x + b.width / 2 + (svg.clientWidth > 900 ? w * 0.12 : 0);
      flyTo([cx - w / 2, b.y + b.height / 2 - h / 2, w, h]);
    }
  };

  /* --- time: play through the checkpoints */
  useEffect(() => {
    if (!playing) return;
    if (i >= snapshots.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setI((n) => Math.min(snapshots.length - 1, n + 1)), 1400);
    return () => clearTimeout(t);
  }, [playing, i]);

  /* --- what's drawn */
  const network = useMemo(() => {
    const R = 330;
    const centres = [[ROSE.x, ROSE.y], ...Array.from({ length: 16 }, (_, n) => {
      const a = (n / 16) * 2 * Math.PI;
      return [ROSE.x + R * Math.cos(a), ROSE.y + R * Math.sin(a)];
    })];
    const out: { x1: number; y1: number; x2: number; y2: number; tier: number }[] = [];
    centres.forEach(([cx, cy], c) => {
      for (let w = 0; w < 32; w++) {
        const a = (w / 32) * 2 * Math.PI, len = c === 0 ? 1400 : 700;
        out.push({ x1: cx, y1: cy, x2: cx + len * Math.cos(a), y2: cy + len * Math.sin(a), tier: w % 4 === 0 ? (w % 8 === 0 ? 0 : 1) : 2 });
      }
    });
    return out;
  }, []);
  const wastes = useMemo(() => Object.entries(gameMap.locations).filter(([, l]) => l.kind === "waste" || l.kind === "lake"), []);

  // the battles of the period, pinned where they were fought
  const pins = useMemo(() => events
    .filter((e) => e.type === "battle" && e.date > since && e.date <= snap.date)
    .map((e) => ({ e, key: battleKey(e) }))
    .filter((x): x is { e: CampaignEvent; key: string } => !!x.key)
    .map(({ e, key }) => ({ e, key, c: gameMap.locations[key].c, good: /victory/.test(String((e.data as any)?.result)), naval: !!(e.data as any)?.naval })), [since, snap.date]);

  // labels: close in, every place; further out, the major ones and ours; provinces in between
  const close = vw < 330, mid = vw < 620;
  const shown = close ? places : places.filter((p) => p.major || isHeld(p, snap.date));
  const kq = Math.round(k * 40) / 40;
  const labels = useMemo(() => placeLabels(shown, snap.date, snap.capital, kq, close ? () => true : (p) => p.major),
    [snap.date, snap.capital, kq, close]);
  const provLabels = useMemo(() => {
    if (!mid || close) return [];
    const out: { key: string; x: number; y: number; n: { tr: string; ar?: string } }[] = [];
    const boxes: number[][] = [];
    const ordered = provList.filter(([, p]) => p.px / (kq * kq) > 5200 && p.c[0] > vx && p.c[0] < vx + vw && p.c[1] > vy && p.c[1] < vy + vh)
      .sort((a, b) => b[1].px - a[1].px);
    for (const [key, p] of ordered) {
      const n = provinceName(key);
      const w = n.tr.length * 6 * kq, h = 12 * kq;
      const b = [p.c[0] - w / 2, p.c[1] - h, p.c[0] + w / 2, p.c[1] + h];
      if (boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue;
      boxes.push(b); out.push({ key, x: p.c[0], y: p.c[1], n });
    }
    return out;
  }, [mid, close, kq, vx, vy, vw, vh, provList]);
  const named = useMemo(() => {
    if (close) return [];
    const inView = (x: number, y: number) => x > vx + vw * 0.08 && x < vx + vw * 0.92 && y > vy + vh * 0.1 && y < vy + vh * 0.9;
    const acc: Record<string, { x: number; y: number; n: number }> = {};
    for (const [key, tag] of Object.entries(owners)) {
      const l = gameMap.locations[key];
      if (!l || l.kind !== "land" || tag === OURS || !countryByTag.has(tag) || !inView(l.c[0], l.c[1])) continue;
      const a = (acc[tag] ??= { x: 0, y: 0, n: 0 }); a.x += l.c[0]; a.y += l.c[1]; a.n++;
    }
    return Object.entries(acc).filter(([, a]) => a.n >= 12).map(([tag, a]) => ({ c: countryByTag.get(tag)!, x: a.x / a.n, y: a.y / a.n, n: a.n }));
  }, [owners, vx, vy, vw, vh, close]);

  const ruler = personById.get(snap.ruler);
  const heir = snap.heir ? personById.get(snap.heir) : undefined;
  const regent = snap.regent ? personById.get(snap.regent) : undefined;
  const h = hijri(snap.date);
  const realmFill = (tag?: string) => (tag === OURS || (tag && subj.has(tag)) ? countryByTag.get(OURS)?.color : tag ? countryByTag.get(tag)?.color ?? "#cbb894" : "transparent");

  /* --- hover card */
  const hoverInfo = hover ? (() => {
    const p = gameMap.provinces[hover.prov];
    const st = hover.loc ? stats([hover.loc], layer, prevLayer, since) : provStats[hover.prov];
    const name = hover.loc ? locName(hover.loc) : provinceName(hover.prov);
    const own = hover.loc ? owners[hover.loc] : provOwner[hover.prov]?.main;
    return { p, st, name, own };
  })() : null;

  return (
    <div className={`atlas lens-${lens} ${sel ? "has-sel" : ""} ${drawer ? "has-drawer" : ""}`} onMouseLeave={() => setHover(null)}>
      <svg ref={svgRef} className="chart" viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid slice" role="img"
        aria-label={`The game map at ${western(snap.date)}, coloured by ${LENSES[lens].label.toLowerCase()}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onDoubleClick={(e) => zoomAt(e.clientX, e.clientY, 0.55)}
        onClick={(e) => { if (!wasDrag() && (e.target as Element).classList.contains("sea-bg")) setSel(null); }}>
        <defs>
          <radialGradient id="sea" cx="35%" cy="58%" r="75%">
            <stop offset="0" stopColor="#1d2b5c" />
            <stop offset="1" stopColor="#0b1128" />
          </radialGradient>
          <pattern id="waves" width="23" height="11" patternUnits="userSpaceOnUse">
            <path d="M0 5.5 q 5.75 -3.5 11.5 0 t 11.5 0" fill="none" stroke="#d4ab55" strokeOpacity="0.08" strokeWidth="0.6" />
          </pattern>
          <pattern id="peaks" width="9" height="7" patternUnits="userSpaceOnUse">
            <path d="M0.5 6.5 L3 2 L5.5 6.5 M4.5 6.5 L6.5 3.2 L8.5 6.5" fill="none" stroke="#7a5a34" strokeOpacity="0.55" strokeWidth="0.45" />
          </pattern>
          <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#3a2814" strokeOpacity="0.45" strokeWidth="1.1" />
          </pattern>
          <filter id="paper" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.18  0 0 0 0.18 0" result="grain" />
            <feComposite in="grain" in2="SourceGraphic" operator="in" result="g" />
            <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g" /></feMerge>
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="lift" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy={2 * k} stdDeviation={3 * k} floodColor="#0b1128" floodOpacity="0.55" />
          </filter>
          <clipPath id="land-clip"><path d={gameMap.coast} /></clipPath>
        </defs>

        <rect x={-600} y={-600} width={MAP_W + 1200} height={MAP_H + 1200} fill="url(#sea)" className="sea-bg" />
        <rect x={-600} y={-600} width={MAP_W + 1200} height={MAP_H + 1200} fill="url(#waves)" pointerEvents="none" />
        <g className="winds">
          {network.map((l, n) => <line key={n} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className={`wind t${l.tier}`} />)}
        </g>

        <path d={gameMap.coast} className="coast-shadow" />
        <path d={gameMap.coast} className="land" filter="url(#paper)" />

        <g clipPath="url(#land-clip)">
          {lens === "realms" && Object.entries(realms).map(([tag, r]) => (
            <path key={tag} d={r.d} className={`realm ${tag === OURS ? "ours" : subj.has(tag) ? "ours subj" : ""}`} style={{ fill: realmFill(tag) }} />
          ))}
          {/* the provinces: the unit of the map */}
          <g className="provinces">
            {provList.map(([key, p]) => {
              const fill = lensColour(lens, provStats[key]);
              const isSel = sel?.prov === key;
              return (
                <path key={key} d={p.d} className={`prov ${isSel ? "sel" : ""} ${hover?.prov === key ? "hot" : ""}`}
                  style={fill ? { fill } : undefined}
                  onPointerEnter={(e) => setHover({ prov: key, x: e.clientX, y: e.clientY })}
                  onPointerMove={(e) => { if (!drag.current?.moved) setHover({ prov: key, x: e.clientX, y: e.clientY }); }}
                  onPointerLeave={() => setHover((hv) => (hv?.prov === key && !hv.loc ? null : hv))}
                  onClick={(e) => choose(key, e.currentTarget)} />
              );
            })}
          </g>
          {/* close in, the grain of the land: every location's border, faintly */}
          {close && <g className="grain">
            {Object.entries(gameMap.locations).filter(([, l]) => l.kind === "land" && l.c[0] > vx - 40 && l.c[0] < vx + vw + 40 && l.c[1] > vy - 40 && l.c[1] < vy + vh + 40)
              .map(([key, l]) => <path key={key} d={l.d} />)}
          </g>}
          {lens === "ruin" && layer && Object.entries(layer.rows).filter(([, r]) => r[9] && r[9] > since && r[9] <= snap.date).map(([key]) => (
            gameMap.locations[key] && <path key={key} d={gameMap.locations[key].d} className="looted" />
          ))}
          {wastes.map(([key, l]) => <path key={key} d={l.d} className={l.kind} />)}
          {network.filter((l) => l.tier === 0).map((l, n) => <line key={n} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="wind-on-land" />)}
        </g>

        {Object.entries(realms).map(([tag, r]) => tag !== OURS && countryByTag.has(tag) && (
          <path key={tag} d={r.d} className={`realm-edge ${subj.has(tag) ? "subj" : ""}`} style={{ stroke: subj.has(tag) ? undefined : countryByTag.get(tag)!.color }} />
        ))}
        <path d={gameMap.coast} className="coast" />
        {realms[OURS] && <path d={realms[OURS].d} className="realm-edge ours" filter={lens === "realms" ? "url(#glow)" : undefined} />}

        {/* the chosen province, split into its locations */}
        {selProv && (
          <g className={`split ${opened ? "open" : ""}`} filter="url(#lift)">
            {selProv.locations.map((lk) => {
              const l = gameMap.locations[lk];
              if (!l) return null;
              const dx = (l.c[0] - selProv.c[0]) * 0.07, dy = (l.c[1] - selProv.c[1]) * 0.07;
              const st = stats([lk], layer, prevLayer, since);
              const fill = lensColour(lens, st) ?? realmFill(owners[lk]);
              return (
                <path key={lk} d={l.d} className={`piece ${sel?.loc === lk ? "on" : ""}`}
                  style={{ transform: opened ? `translate(${dx}px, ${dy}px)` : "translate(0px, 0px)", fill, strokeWidth: 1.1 * k }}
                  onPointerEnter={(e) => setHover({ prov: sel!.prov, loc: lk, x: e.clientX, y: e.clientY })}
                  onPointerMove={(e) => setHover({ prov: sel!.prov, loc: lk, x: e.clientX, y: e.clientY })}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => { if (!wasDrag()) setSel({ prov: sel!.prov, loc: lk }); }} />
              );
            })}
            {opened && selProv.locations.map((lk) => {
              const l = gameMap.locations[lk]; if (!l) return null;
              const n = locName(lk);
              const dx = (l.c[0] - selProv.c[0]) * 0.07, dy = (l.c[1] - selProv.c[1]) * 0.07;
              return (
                <g key={lk} className="piece-label" transform={`translate(${l.c[0] + dx},${l.c[1] + dy})`}>
                  {n.ar && <text className="ar" fontSize={11 * k} textAnchor="middle" direction="ltr">{n.ar}</text>}
                  <text className="tr" y={(n.ar ? 9 : 3) * k} fontSize={6.5 * k} textAnchor="middle">{n.tr}</text>
                </g>
              );
            })}
          </g>
        )}

        {named.map(({ c, x, y, n }) => {
          const size = Math.min(1.3, Math.max(0.6, Math.sqrt(n) / 9)) * k;
          return (
            <g key={c.tag} className="realm-label" transform={`translate(${x},${y})`} style={{ ["--rc" as any]: c.color }}>
              <text className="ar" fontSize={30 * size} textAnchor="middle" direction="ltr">{c.nameArabic}</text>
              <text className="tr" y={14 * size} fontSize={11 * size} textAnchor="middle">{c.nameChronicle}</text>
            </g>
          );
        })}
        {provLabels.map(({ key, x, y, n }) => (
          <g key={key} className="prov-label" transform={`translate(${x},${y})`}>
            {n.ar && <text className="ar" fontSize={10 * kq} textAnchor="middle" direction="ltr">{n.ar}</text>}
            <text className="tr" y={(n.ar ? 8 : 2) * kq} fontSize={6 * kq} textAnchor="middle">{n.tr}</text>
          </g>
        ))}

        {SEAS.map((s) => (
          <g key={s.tr} className="sea-label" transform={`translate(${s.x},${s.y})`}>
            <text className="ar" fontSize={26 * s.size * Math.max(0.6, k)} textAnchor="middle" direction="ltr">{s.ar}</text>
            <text className="tr" y={13 * s.size * Math.max(0.6, k)} fontSize={10 * s.size * Math.max(0.6, k)} textAnchor="middle">{s.tr}</text>
          </g>
        ))}
        <Rose x={ROSE.x} y={ROSE.y} r={46} />

        {!selProv && labels.map(({ p, ours, capital, pos }) => (
          <Link key={p.id} to={`/places/${p.id}`} data-kind="place" data-id={p.id} className={`place ${ours ? "ours" : "theirs"}`}
            onClick={(e) => { if (wasDrag()) e.preventDefault(); }}>
            <g transform={`translate(${p.x},${p.y})`}>
              <g transform={`scale(${kq})`}>{capital ? <Tower big /> : ours ? <circle r={2.6} className="dot ours" /> : <circle r={2.4} className="mark" />}</g>
              {pos && (
                <>
                  <text className="ar" x={pos.dx} y={pos.dy} fontSize={pos.fa} textAnchor={pos.anchor} direction="ltr">{p.nameArabic ?? ""}</text>
                  <text className="tr" x={pos.dx} y={pos.dy + pos.ft + 1} fontSize={pos.ft} textAnchor={pos.anchor}>{p.name}</text>
                </>
              )}
            </g>
          </Link>
        ))}

        {pins.map(({ e, c, good, naval }) => (
          <Link key={e.id} to={e.wars[0] ? `/wars/${e.wars[0]}` : "/wars"} className={`pin ${good ? "good" : "bad"}`} onClick={(ev) => { if (wasDrag()) ev.preventDefault(); }}>
            <g transform={`translate(${c[0]},${c[1]}) scale(${kq})`}>
              <circle r={7.5} className="pin-ring" />
              {naval ? <path d="M-4 1 Q0 5 4 1 M0 -5 V4 M-2.5 -3 H2.5" className="pin-mark" /> : <path d="M-4 -4 L4 4 M4 -4 L-4 4" className="pin-mark" />}
              <title>{`${western(e.date)}: ${e.title}`}</title>
            </g>
          </Link>
        ))}
      </svg>

      {hover && hoverInfo && !drag.current?.moved && !(sel && hover.prov === sel.prov && !hover.loc) && (
        <div className="hovercard ui" style={{ left: hover.x + 16, top: hover.y + 14 }} role="tooltip">
          {hoverInfo.name.ar && <div className="ar">{hoverInfo.name.ar}</div>}
          <div className="nm">{hoverInfo.name.tr}{!hover.loc && <span className="kind"> · province</span>}</div>
          <div className="own"><i style={{ background: realmFill(hoverInfo.own) }} />{ownerName(hoverInfo.own)}</div>
          {hoverInfo.st && <div className="fig">{compact(hoverInfo.st.pop)} people{lensFigure(lens, hoverInfo.st)}</div>}
          {!hover.loc && <div className="hint">Click to open</div>}
        </div>
      )}

      <section className="medallion" aria-label="The sovereign">
        <div className="frame">
          <div className="sovereign ar">{ruler?.nameArabic ?? ruler?.name}</div>
          <div className="latin-name">
            <Link to={`/people/${snap.ruler}`} className="entity" data-kind="person" data-id={snap.ruler} data-router="1">{ruler?.name}</Link>
          </div>
          <div className="title">Sultan of Gharnāṭa{snap.overlord ? `, tributary of ${countryName(snap.overlord.country)}` : ""}</div>
          <div className="date">
            <span className="ar day">{h.arabic}</span>
            <span className="wdate">{h.text} AH, {western(snap.date)}</span>
          </div>
          {(regent || heir) && (
            <div className="line">
              {regent && <>Regent: <Link to={`/people/${regent.id}`} className="entity" data-kind="person" data-id={regent.id} data-router="1">{regent.name}</Link>. </>}
              {heir && <>Heir: <Link to={`/people/${heir.id}`} className="entity" data-kind="person" data-id={heir.id} data-router="1">{heir.name}</Link>.</>}
            </div>
          )}
        </div>
      </section>

      <div className="lenses ui" role="group" aria-label="Colour the land by">
        {(Object.keys(LENSES) as LensId[]).map((l) => (
          <button key={l} type="button" aria-pressed={lens === l} onClick={() => setLens(l)}>
            <span className="ar">{LENSES[l].ar}</span>{LENSES[l].label}
          </button>
        ))}
      </div>

      <div className="voyage ui" role="group" aria-label="Where to look">
        {(Object.keys(VIEWS) as ViewId[]).map((v) => (
          <button key={v} type="button" onClick={() => { setSel(null); flyTo(VIEWS[v].box, 700); }} title={VIEWS[v].label}>
            <span className="ar">{VIEWS[v].ar}</span><span className="lt">{VIEWS[v].label}</span>
          </button>
        ))}
        <span className="zoom">
          <button type="button" aria-label="Zoom in" onClick={() => { const r = svgRef.current!.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 0.6); }}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => { const r = svgRef.current!.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.6); }}>−</button>
        </span>
      </div>

      {lens !== "realms" && (
        <div className="legend ui" aria-label="Legend">
          <span className="t">{LEGEND[lens].title}</span>
          <span className="ramp">{LEGEND[lens].ramp.map((c, n) => <i key={n} style={{ background: c }} />)}</span>
          <span className="ends">{LEGEND[lens].labels.map((s, n) => <span key={n}>{s}</span>)}</span>
          {lens === "ruin" && <span className="t sub"><i className="hatch" /> looted since the last checkpoint</span>}
          {!layer && <span className="t sub">Loading this checkpoint…</span>}
        </div>
      )}

      <button className="drawer-toggle ui" type="button" aria-expanded={drawer} aria-controls="realm-drawer" onClick={() => setDrawer(!drawer)}>
        {drawer ? "Hide the folio" : sel ? "Open the folio" : "The state of the realm"}
      </button>
      {drawer && (
        <aside id="realm-drawer" className="drawer ui" aria-label={sel ? "The province" : "The state of the realm"}>
          {sel ? (
            <ProvinceFolio prov={sel.prov} loc={sel.loc} snapId={snap.id} date={snap.date} since={since}
              layer={layer} prevLayer={prevLayer} owners={owners} subj={subj} realmFill={realmFill}
              onLoc={(lk) => setSel({ prov: sel.prov, loc: lk })} onClose={() => setSel(null)} />
          ) : (
            <RealmFolio i={i} />
          )}
        </aside>
      )}

      <div className="atlas-foot">
        <div className="time">
          <button type="button" className="play ui" aria-pressed={playing}
            onClick={() => { if (!playing && i === snapshots.length - 1) setI(0); setPlaying(!playing); }}>
            {playing ? "❚❚ Pause" : "▶ Play the years"}
          </button>
          {snapshots.length > 1 && <CheckpointSelect value={i} onChange={(n) => { setPlaying(false); setI(n); }} />}
        </div>
        <p className="caption ui">
          Drag to move, scroll or pinch to zoom, and click a province to split it into its towns.
          {pins.length > 0 && ` Crossed swords mark the ${pins.length} battle${pins.length > 1 ? "s" : ""} since the last checkpoint.`}
        </p>
      </div>
    </div>
  );
}

function lensFigure(lens: LensId, s: Stats) {
  switch (lens) {
    case "faith": return ` · ${Math.round(s.muslim)}% Muslim, ${Math.round(s.christian)}% Christian`;
    case "tongue": return ` · ${Math.round(s.andalusi)}% Andalusī`;
    case "people": return s.px ? ` · ${Math.round(s.pop / s.px)} to the measure` : "";
    case "ruin": return s.prev ? ` · ${signed(Math.round((s.pop / s.prev - 1) * 1000) / 10)}% since the last checkpoint${s.looted ? `, ${s.looted} looted` : ""}` : "";
    case "hold": return ` · control ${Math.round(s.control)}%`;
    default: return "";
  }
}

/* ------------------------------------------------------------------ the folios */

function Bars({ s }: { s: Stats }) {
  const rows = [
    { t: "Faith", parts: [{ n: "Muslim", v: s.muslim, c: "#529d7b" }, { n: "Christian", v: s.christian, c: "#b5593b" }, { n: "Jewish", v: s.jewish, c: "#97a6cd" }] },
    { t: "Tongue", parts: [{ n: "Andalusī", v: s.andalusi, c: "#d8b463" }, { n: "Castilian", v: s.castilian, c: "#8f683c" }] },
  ];
  return (
    <div className="bars">
      {rows.map((r) => {
        const other = Math.max(0, 100 - r.parts.reduce((a, b) => a + b.v, 0));
        return (
          <div key={r.t} className="bar-row">
            <span className="bt">{r.t}</span>
            <span className="stack" role="img" aria-label={r.parts.map((p) => `${p.n} ${Math.round(p.v)}%`).join(", ")}>
              {r.parts.map((p) => <i key={p.n} style={{ width: `${p.v}%`, background: p.c }} title={`${p.n} ${Math.round(p.v)}%`} />)}
              <i style={{ width: `${other}%` }} className="other" title={`Others ${Math.round(other)}%`} />
            </span>
            <span className="leg">{r.parts.filter((p) => p.v >= 1).map((p) => `${p.n} ${Math.round(p.v)}%`).join(" · ") || "—"}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProvinceFolio({ prov, loc, snapId, date, since, layer, prevLayer, owners, subj, realmFill, onLoc, onClose }: {
  prov: string; loc?: string; snapId: string; date: string; since: string; layer: Layer | null; prevLayer: Layer | null;
  owners: Record<string, string>; subj: Set<string>; realmFill: (t?: string) => string | undefined;
  onLoc: (k: string) => void; onClose: () => void;
}) {
  const p = gameMap.provinces[prov];
  const n = provinceName(prov);
  const s = stats(p.locations, layer, prevLayer, since);
  const tags: Record<string, number> = {};
  for (const l of p.locations) { const t = owners[l]; if (t) tags[t] = (tags[t] ?? 0) + 1; }
  const rows = p.locations.map((k) => ({ k, r: layer?.rows[k], prev: prevLayer?.rows[k]?.[0], own: owners[k] }))
    .sort((a, b) => (b.r?.[0] ?? 0) - (a.r?.[0] ?? 0));
  const maxPop = Math.max(1, ...rows.map((r) => r.r?.[0] ?? 0));
  const keys = new Set(p.locations);
  const story = events.filter((e) => e.date <= date && (e.places.some((id) => keys.has(places.find((pl) => pl.id === id)?.key ?? "")) || (e.type === "battle" && keys.has(battleKey(e) ?? ""))))
    .slice(-6).reverse();
  const l = loc ? layer?.rows[loc] : undefined;
  const ln = loc ? locName(loc) : undefined;
  return (
    <div className="pfolio">
      <button type="button" className="close" onClick={onClose} aria-label="Close the province">×</button>
      <div className="kicker">Province of {areaName(p.area)}</div>
      {n.ar && <div className="pa ar">{n.ar}</div>}
      <h2>{n.place ? <Link to={`/places/${n.place.id}`} className="entity" data-kind="place" data-id={n.place.id} data-router="1">{n.tr}</Link> : n.tr}</h2>
      <div className="owners">
        {Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([t, c]) => (
          <span key={t} className="chip"><i style={{ background: realmFill(t) }} />{ownerName(t)}{subj.has(t) ? " (ṭāʾifa)" : ""}{Object.keys(tags).length > 1 ? ` · ${c}` : ""}</span>
        ))}
      </div>
      {s ? (
        <>
          <dl className="stats">
            <div><dt>People</dt><dd>{compact(s.pop)}</dd></div>
            <div><dt>Since the last checkpoint</dt><dd>{s.prev ? `${signed(Math.round((s.pop / s.prev - 1) * 1000) / 10)}%` : "—"}</dd></div>
            <div><dt>Control</dt><dd>{Math.round(s.control)}%</dd></div>
            <div><dt>Prosperity</dt><dd>{Math.round(s.prosperity)}%</dd></div>
          </dl>
          <Bars s={s} />
          {(s.looted > 0 || s.occupied > 0) && <p className="warn">{s.looted > 0 && `${s.looted} town${s.looted > 1 ? "s" : ""} looted since the last checkpoint. `}{s.occupied > 0 && `${s.occupied} held by an enemy.`}</p>}
        </>
      ) : <p className="quiet">{layer === null ? "Reading this checkpoint…" : "No count of this province at this checkpoint."}</p>}

      {loc && ln && (
        <div className="loc-card">
          {ln.ar && <div className="pa ar">{ln.ar}</div>}
          <h3>{ln.place ? <Link to={`/places/${ln.place.id}`} className="entity" data-kind="place" data-id={ln.place.id} data-router="1">{ln.tr}</Link> : ln.tr}</h3>
          {l ? <>
            <p>{nf.format(l[0])} people · mostly {l[10] ?? "?"} and {l[11] ?? "?"} · control {l[7]}%{l[8] ? ` · held by ${ownerName(String(l[8]))}` : ""}</p>
            <Bars s={stats([loc], layer, prevLayer, since)!} />
            {l[9] && <p className="quiet">Last looted {western(String(l[9]))}.</p>}
          </> : <p className="quiet">No count of this town.</p>}
        </div>
      )}

      <h3>Its towns</h3>
      <ul className="towns">
        {rows.map(({ k, r, prev, own }) => {
          const nm = locName(k);
          const ch = r && prev ? (r[0] / prev - 1) * 100 : null;
          return (
            <li key={k} className={loc === k ? "on" : ""}>
              <button type="button" onClick={() => onLoc(k)}>
                <span className="tn">{nm.tr}{own && own !== Object.keys(tags)[0] ? <small> · {ownerName(own)}</small> : null}</span>
                <span className="tb"><i style={{ width: `${((r?.[0] ?? 0) / maxPop) * 100}%`, background: realmFill(own) }} /></span>
                <span className="tp">{r ? compact(r[0]) : "—"}{ch != null && Math.abs(ch) >= 1 ? <small className={ch < 0 ? "down" : "up"}> {ch > 0 ? "+" : ""}{Math.round(ch)}%</small> : null}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {story.length > 0 && <>
        <h3>In the record</h3>
        <ul className="lately">
          {story.map((e) => <li key={e.id}><span className="t">{western(e.date)} · {EVENT_LABEL[e.type]}</span>{e.title}</li>)}
        </ul>
      </>}
      <p className="quiet small">Counts from the save of {western(date)}. Press Esc or click the sea to close.</p>
    </div>
  );
}

function RealmFolio({ i }: { i: number }) {
  const snap = snapshots[i];
  const prevDate = i > 0 ? snapshots[i - 1].date : "0000-00-00";
  const lately = events.filter((e) => e.date > prevDate && e.date <= snap.date).slice(-5).reverse();
  const shares = (rec: Record<string, number>) => {
    const total = Object.values(rec).reduce((a, b) => a + b, 0);
    return Object.entries(rec).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, v]) => ({ key, pct: (v / total) * 100 }));
  };
  return (
    <>
      <h2>The state of the realm</h2>
      <dl className="stats">
        <div><dt>Places held</dt><dd>{snap.locations}</dd></div>
        <div><dt>Souls</dt><dd>{compact(snap.population.total)}</dd></div>
        {snap.economy && <>
          <div><dt>Treasury</dt><dd>{nf.format(snap.economy.treasury)}<small> ducats</small></dd></div>
          <div><dt>Monthly balance</dt><dd>{signed(Math.round((snap.economy.income - snap.economy.expenses) * 10) / 10)}</dd></div>
        </>}
        {snap.stability != null && <div><dt>Stability</dt><dd>{snap.stability}</dd></div>}
        {snap.prestige != null && <div><dt>Prestige</dt><dd>{snap.prestige}</dd></div>}
      </dl>
      {snap.strait ? (
        <Link to="/strait" className="strait-mini">
          <span>The Strait{snap.strait.areas ? ` · ${snap.strait.areas.held} of ${snap.strait.areas.total} towns` : ""}</span>
          <span className="gauge" aria-label={`Influence ${signed(snap.strait.influence)}, towards ${snap.strait.influence < 0 ? "Castile" : "Morocco"}`}>
            <span className="zone" />
            <span className="pin" style={{ left: `${(snap.strait.influence + 100) / 2}%` }} />
          </span>
          <span className="ends"><span>Castile</span><span>Morocco</span></span>
        </Link>
      ) : null}
      <h3>The people</h3>
      {shares(snap.population.cultures).map((r) => (
        <div className="share" key={r.key}><span>{r.key}</span><span className="bar"><i style={{ width: `${r.pct}%` }} /></span><span className="num">{r.pct < 1 ? "<1" : r.pct.toFixed(0)}%</span></div>
      ))}
      <h3>Faith</h3>
      {shares(snap.population.religions).map((r) => (
        <div className="share" key={r.key}><span>{r.key}</span><span className="bar"><i style={{ width: `${r.pct}%` }} /></span><span className="num">{r.pct < 1 ? "<1" : r.pct.toFixed(0)}%</span></div>
      ))}
      <h3>Since the last checkpoint</h3>
      {lately.length ? (
        <ul className="lately">
          {lately.map((e) => <li key={e.id}><span className="t">{EVENT_LABEL[e.type]}</span>{e.title}</li>)}
        </ul>
      ) : <p className="quiet">{i === 0 ? "This is the first checkpoint." : "Nothing logged."}</p>}
      <p className="quiet small">Click any province on the map to open it.</p>
    </>
  );
}

/* ------------------------------------------------------------------ labels and marks */

type LBox = { x0: number; y0: number; x1: number; y1: number };
type Pos = { dx: number; dy: number; anchor: "start" | "middle" | "end"; fa: number; ft: number };

/**
 * Greedy label placement in map units: the capital first, then the realm's places, then the rest.
 * Each label tries right, left, above and below its marker and takes the first free spot;
 * a label with no room is left off (the marker and its hover card still name it).
 */
function placeLabels(list: Place[], date: string, capitalId: string, k: number, wantLabel: (p: Place) => boolean) {
  const items = list.map((p) => ({ p, ours: isHeld(p, date), capital: p.id === capitalId, pos: null as Pos | null }));
  const order = [...items].sort((a, b) => Number(b.capital) - Number(a.capital) || Number(b.ours) - Number(a.ours));
  const r = 4 * k;
  const placed: LBox[] = items.map((it) => ({ x0: it.p.x - r, y0: it.p.y - r, x1: it.p.x + r, y1: it.p.y + r }));
  const hit = (b: LBox) => placed.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
  for (const it of order) {
    if (!it.capital && !wantLabel(it.p)) continue;
    const fa = (it.capital ? 20 : it.ours ? 13 : 11.5) * k;
    const ft = (it.capital ? 9 : it.ours ? 7 : 6.5) * k;
    const w = Math.max((it.p.nameArabic ?? "").length * fa * 0.62, it.p.name.length * ft * 0.55);
    const hh = fa + ft + 2 * k;
    const g = 7 * k;
    const tries: Pos[] = it.capital ? [{ dx: 0, dy: -14 * k, anchor: "middle", fa, ft }] : [
      { dx: g, dy: -2 * k, anchor: "start", fa, ft },
      { dx: -g, dy: -2 * k, anchor: "end", fa, ft },
      { dx: 0, dy: -10 * k, anchor: "middle", fa, ft },
      { dx: 0, dy: fa + 3 * k, anchor: "middle", fa, ft },
    ];
    for (const t of tries) {
      const left = t.anchor === "start" ? it.p.x + t.dx : t.anchor === "end" ? it.p.x + t.dx - w : it.p.x - w / 2;
      const box = { x0: left - k, y0: it.p.y + t.dy - fa * 0.8, x1: left + w + k, y1: it.p.y + t.dy - fa * 0.8 + hh };
      if (!hit(box) || it.capital) { it.pos = t; placed.push(box); break; }
    }
  }
  return items;
}

function Tower({ big }: { big: boolean }) {
  const s = big ? 0.75 : 0.5;
  return (
    <g transform={`scale(${s})`} className="tower">
      <path d="M-7 8 V-4 H-5 V-7 H-2.5 V-4 H-1 V-8 H1 V-4 H2.5 V-7 H5 V-4 H7 V8 Z" />
      <path d="M-2 8 V3 A2 2 0 0 1 2 3 V8" className="door" />
    </g>
  );
}

/** A 32-point compass rose in the manner of the Majorcan charts. */
function Rose({ x, y, r }: { x: number; y: number; r: number }) {
  const pts = (n: number, r1: number, r2: number, rot = 0) =>
    Array.from({ length: n * 2 }, (_, k) => {
      const a = rot + (k * Math.PI) / n - Math.PI / 2;
      const rr = k % 2 === 0 ? r1 : r2;
      return `${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  return (
    <g className="rose" transform={`translate(${x},${y})`} aria-hidden="true">
      <circle r={r} className="ring" />
      <circle r={r * 0.93} className="ring thin" />
      <polygon points={pts(16, r * 0.85, r * 0.33, Math.PI / 16)} className="p16" />
      <polygon points={pts(8, r * 0.91, r * 0.28, Math.PI / 8)} className="p8b" />
      <polygon points={pts(4, r * 1.04, r * 0.24)} className="p4" />
      <circle r={r * 0.1} className="hub" />
      <text y={-r * 1.13} textAnchor="middle" className="north ar" fontSize={r * 0.33}>ش</text>
    </g>
  );
}

