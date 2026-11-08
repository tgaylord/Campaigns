import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { countryAt, countryByTag, places, snapshots, subjectTags, western, hijri, year } from "../lib/data";
import { usePanZoom } from "../lib/panzoom";
import type { Box } from "../lib/panzoom";
import { useFetched, useTags, useWorld, followed, powerName, gameName, personOf } from "../lib/world";
import { useRealmSeries, useCheckpointParam, nameOf, ABROAD_KIND } from "../lib/realm";
import type { Abroad, RealmAt } from "../lib/realm";
import { PageHead, CheckpointSelect } from "../components/bits";
import { standing } from "../components/Dispatch";
import "./world.css";

/*
 * The World: how far al-Andalus reaches. The wide chart from the Atlantic islands to the Persian gulf
 * (tools/build_map.py --lite on the World frame), its realms at a checkpoint, and over them what the
 * crown holds in other men's lands (tools/realm_extras.py), the battles the chronicle records
 * (tools/battle_places.py), and the capitals of the powers the dīwān follows.
 */

type Frame = { x: number; y: number; width: number; height: number };
type Chart = { frame: Frame; coast: string; provinces: Record<string, { d: string; c: [number, number]; region: string | null }> };
type Realms = Record<string, { d: string; px: number; c: [number, number] }>;
type Battle = { id: string; date: string; war: string | null; key: string; x: number; y: number; naval: boolean; won: boolean; title: string };
type GlobeIndex = {
  frame: Frame | null; realmsAt: string[];
  capitals: Record<string, Record<string, [number, number]>>;
  ourCapital: Record<string, [number, number] | null>;
  battles: Battle[]; mecca: [number, number] | null; unplaced: number;
};

const OURS = "GRA";
const PARCH = [0xe3, 0xd2, 0xad];
function faded(hex: string | null | undefined, keep = 0.34) {
  if (!hex) return "#d8c8a2";
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  return `rgb(${c.map((v, i) => Math.round(v * keep + PARCH[i] * (1 - keep))).join(",")})`;
}
/** Seas, in game-map pixels. */
const SEAS = [
  { ar: "البحر المحيط", tr: "al-Baḥr al-Muḥīṭ", x: 6420, y: 2900, size: 1.4 },
  { ar: "بحر الظلمات", tr: "Baḥr al-Ẓulumāt", x: 6700, y: 4700, size: 1.1 },
  { ar: "بحر الروم", tr: "Baḥr al-Rūm", x: 8700, y: 2930, size: 1.3 },
  { ar: "بحر نيطش", tr: "Baḥr Nīṭush", x: 9330, y: 2310, size: 0.8 },
  { ar: "بحر القلزم", tr: "Baḥr al-Qulzum", x: 9500, y: 3560, size: 0.7 },
  { ar: "بحر الهند", tr: "Baḥr al-Hind", x: 10150, y: 4550, size: 1.1 },
];

/** The chronicle's name for a location, or the game's. */
function placeName(key: string, names?: Record<string, string>) {
  return places.find((p) => p.key === key)?.name ?? names?.[`loc:${key}`] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
const placeId = (key: string) => places.find((p) => p.key === key)?.id;

/** The latest entry of the series at or before a date (a checkpoint without its own reading borrows the last one). */
function realmAt(series: RealmAt[] | undefined, date: string) {
  if (!series) return { now: undefined, prev: undefined, exact: false };
  let n = -1;
  for (let j = 0; j < series.length; j++) if (series[j].checkpoint <= date) n = j;
  return { now: n >= 0 ? series[n] : undefined, prev: n > 0 ? series[n - 1] : undefined, exact: n >= 0 && series[n].checkpoint === date };
}

/** Keep showing the last thing that loaded until the next one arrives, so the chart doesn't blink between years. */
function useKept<T>(v: T | null): T | null {
  const ref = useRef<T | null>(null);
  if (v) ref.current = v;
  return v ?? ref.current;
}

type Layers = { footholds: boolean; lines: boolean; capitals: boolean; battles: "off" | "latest" | "all" };

export default function World() {
  const [i, setI] = useCheckpointParam();
  const snap = snapshots[i];
  const prevSnap = i > 0 ? snapshots[i - 1] : undefined;
  const idx = useFetched<GlobeIndex>("globe/index.json");
  const chart = useFetched<Chart>("globe/chart.json");
  const rs = useRealmSeries();
  const tags = useTags();
  const w = useWorld(snap.id);
  // the nearest checkpoint the World chart has realms for: at or before this one, else the first after
  const realmsId = useMemo(() => {
    if (!idx?.realmsAt.length) return null;
    const before = idx.realmsAt.filter((id) => id <= snap.id);
    return before.length ? before[before.length - 1] : idx.realmsAt[0];
  }, [idx, snap.id]);
  const realms = useKept(useFetched<Realms>(realmsId ? `globe/realms-${realmsId}.json` : null));
  const { now, prev, exact } = realmAt(rs?.series, snap.id);
  const [layers, setLayers] = useState<Layers>({ footholds: true, lines: true, capitals: true, battles: "latest" });
  const [sel, setSel] = useState<string | null>(null);

  const F = idx?.frame ?? chart?.frame ?? { x: 5900, y: 1100, width: 4601, height: 3901 };
  const rel = (xy: [number, number]): [number, number] => [xy[0] - F.x, xy[1] - F.y];
  const W = F.width, H = F.height;
  const cap = idx?.ourCapital[snap.id] ? rel(idx.ourCapital[snap.id]!) : null;
  const abroad = (now?.abroad ?? []).filter((b) => b.xy);

  // Framing follows the empire's footprint: the realm and its subjects, the capital and every foothold.
  const footprint = useMemo((): Box => {
    const pts: [number, number][] = [];
    if (cap) pts.push(cap);
    for (const b of abroad) pts.push(rel(b.xy!));
    const subj = new Set(subjectTags[snap.id] ?? []);
    if (realms) for (const [t, r] of Object.entries(realms)) if (t === OURS || subj.has(t)) pts.push(r.c);
    if (pts.length < 2) return [1100, 1000, 1800, 1400];
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const pad = 180;
    let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
    // keep the chart's own shape (and room on the right for the folio on a wide screen)
    const aspect = 1.45;
    if ((x1 - x0) / (y1 - y0) < aspect) { const d = ((y1 - y0) * aspect - (x1 - x0)) / 2; x0 -= d; x1 += d; }
    else { const d = ((x1 - x0) / aspect - (y1 - y0)) / 2; y0 -= d; y1 += d; }
    return [x0, y0, x1 - x0, y1 - y0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now?.checkpoint, realmsId, cap?.[0]]);

  const svgRef = useRef<SVGSVGElement>(null);
  const pz = usePanZoom(svgRef, W, H, footprint, 120);
  const framed = useRef(false);
  useEffect(() => { if (!framed.current && now && realms) { framed.current = true; pz.flyTo(footprint, 1); } }, [now, realms]); // eslint-disable-line react-hooks/exhaustive-deps
  const [vx, vy, vw, vh] = pz.vb;
  // one screen pixel in map units, so marks and labels keep their size on any screen
  const [screen, setScreen] = useState<[number, number]>([1100, 760]);
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setScreen([el.clientWidth || 1100, el.clientHeight || 760]));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  // the viewBox is fitted inside the element ("meet"), so the tighter of the two directions sets the scale
  const k = 0.45 / Math.min(Math.max(280, screen[0]) / vw, Math.max(200, screen[1]) / vh);
  const kq = Math.round(k * 20) / 20;
  const [hover, setHover] = useState<{ kind: "realm" | "post" | "battle"; id: string; x: number; y: number } | null>(null);
  const subj = new Set(subjectTags[snap.id] ?? []);
  const ours = (t: string) => t === OURS || subj.has(t);
  const fill = (t: string) => (ours(t) ? countryByTag.get(OURS)!.color : followed.has(t) && countryByTag.has(t) ? countryByTag.get(t)!.color : faded(tags?.[t]?.color));

  const battles = useMemo(() => {
    if (!idx || layers.battles === "off") return [];
    return idx.battles.filter((b) => b.date <= snap.date && (layers.battles === "all" || !prevSnap || b.date > prevSnap.date));
  }, [idx, layers.battles, snap.date, prevSnap?.date]);

  // realm names, biggest first, never overlapping
  const labels = useMemo(() => {
    if (!realms) return [];
    const boxes: number[][] = [];
    const out: { tag: string; x: number; y: number; ar?: string; tr: string; s: number }[] = [];
    const list = Object.entries(realms).sort((a, b) => Number(followed.has(b[0]) || ours(b[0])) - Number(followed.has(a[0]) || ours(a[0])) || b[1].px - a[1].px);
    for (const [tag, r] of list) {
      const minPx = followed.has(tag) || tag === OURS ? 1500 : 9000;
      if (r.px / (kq * kq) < minPx) continue;
      if (r.c[0] < vx || r.c[0] > vx + vw || r.c[1] < vy || r.c[1] > vy + vh) continue;
      const s = Math.min(1.7, Math.max(0.55, Math.sqrt(r.px) / 150)) * kq;
      const tr = followed.has(tag) || tag === OURS ? powerName(tag, w, tags) : gameName(tag, w, tags);
      const ar = followed.has(tag) || tag === OURS ? countryAt(tag, snap.date)?.nameArabic : undefined;
      const wd = Math.max((ar?.length ?? 0) * 17 * s, tr.length * 6.5 * s), ht = (ar ? 34 : 14) * s;
      const b = [r.c[0] - wd / 2, r.c[1] - ht * 0.75, r.c[0] + wd / 2, r.c[1] + ht * 0.4];
      if (boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue;
      boxes.push(b);
      out.push({ tag, x: r.c[0], y: r.c[1], ar, tr, s });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realms, kq, vx, vy, vw, vh, w, tags, snap.id]);

  const names = rs?.names;
  const prevKeys = new Set((prev?.abroad ?? []).map((b) => `${b.type}@${b.location}`));
  const prevLevel = new Map((prev?.abroad ?? []).map((b) => [`${b.type}@${b.location}`, b.level]));
  const isNew = (b: Abroad) => !!prev && !prevKeys.has(`${b.type}@${b.location}`);
  const hajj = (now?.expeditions ?? []).filter((e) => e.type === "hajj_caravan_expedition" && !e.failed).length;
  const fly = (b: Box) => pz.flyTo(b, 700);
  const capitals = layers.capitals && idx ? Object.entries(idx.capitals[snap.id] ?? {}).filter(([t]) => t !== OURS) : [];

  // the lede answers the hall's question: how far does the realm reach?
  const reach = useMemo(() => {
    if (!abroad.length) return null;
    let best: [Abroad, Abroad] = [abroad[0], abroad[0]], d = -1;
    for (const a of abroad) for (const b of abroad) {
      const dd = (a.xy![0] - b.xy![0]) ** 2 + (a.xy![1] - b.xy![1]) ** 2;
      if (dd > d) { d = dd; best = [a, b]; }
    }
    // west/south first
    best.sort((a, b) => a.xy![0] - b.xy![0]);
    const realmsAbroad = new Set(abroad.map((b) => b.holder)).size;
    return { from: best[0], to: best[1], realms: realmsAbroad };
  }, [now?.checkpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const h = hijri(snap.date);
  const hovPower = hover?.kind === "realm" && w ? w.powers[hover.id] : undefined;
  const hovPost = hover?.kind === "post" ? abroad.find((b) => `${b.type}@${b.location}` === hover.id) : undefined;
  const hovBattle = hover?.kind === "battle" ? idx?.battles.find((b) => b.id === hover.id) : undefined;

  return (
    <div className="page world-page">
      <PageHead title="The World" ar="الآفاق"
        lede={reach && now ? (
          <>At {western(snap.date)} al-Andalus rules {snap.locations} locations of its own, and the crown holds {abroad.length} footholds
            in {reach.realms} other realms, from {placeName(reach.from.location, names)} in {powerName(reach.from.holder ?? "", w, tags)} to {placeName(reach.to.location, names)} in {powerName(reach.to.holder ?? "", w, tags)}.</>
        ) : now ? <>At {western(snap.date)} al-Andalus rules {snap.locations} locations, and the crown holds nothing in other realms.</> : <>The reach of the realm, checkpoint by checkpoint.</>} />

      <div className="w-when ui">
        <span className="ar">{h.arabic}</span> <span className="muted">{h.text} AH, {western(snap.date)}</span>
        {now && !exact && <span className="prov" title="This checkpoint has no reading of the crown's holdings abroad; the last one before it is shown">holdings as of {western(now.checkpoint)}</span>}
        {realmsId && realmsId !== snap.id && <span className="prov" title="The World chart's borders are drawn for some checkpoints only">borders as of {western(snapshots.find((s) => s.id === realmsId)?.date ?? realmsId)}</span>}
      </div>
      <CheckpointSelect value={i} onChange={setI} />

      <div className="w-layers ui" role="group" aria-label="What the chart shows">
        <label><input type="checkbox" checked={layers.footholds} onChange={(e) => setLayers({ ...layers, footholds: e.target.checked })} /> Footholds abroad</label>
        <label><input type="checkbox" checked={layers.lines} onChange={(e) => setLayers({ ...layers, lines: e.target.checked })} /> Lines from the capital</label>
        <label><input type="checkbox" checked={layers.capitals} onChange={(e) => setLayers({ ...layers, capitals: e.target.checked })} /> Capitals</label>
        <span className="seg" role="radiogroup" aria-label="Battles">
          <span className="seg-l">Battles</span>
          {(["off", "latest", "all"] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={layers.battles === v} className={layers.battles === v ? "on" : ""} onClick={() => setLayers({ ...layers, battles: v })}>
              {v === "off" ? "None" : v === "latest" ? "Since the last checkpoint" : "All to this year"}
            </button>
          ))}
        </span>
      </div>

      <div className="w-stage">
        <div className="w-chart-wrap">
          <svg ref={svgRef} className="w-chart" viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" role="img"
            aria-label={`The world at ${western(snap.date)}: the realms, and al-Andalus's ${abroad.length} footholds abroad`}
            {...pz.handlers}
            onClick={(e) => { if (!pz.dragging() && (e.target as Element).classList.contains("sea-bg")) setSel(null); }}>
            <defs>
              <radialGradient id="w-sea" cx="45%" cy="45%" r="75%"><stop offset="0" stopColor="#1d2b5c" /><stop offset="1" stopColor="#0b1128" /></radialGradient>
              <pattern id="w-waves" width="46" height="22" patternUnits="userSpaceOnUse">
                <path d="M0 11 q 11.5 -7 23 0 t 23 0" fill="none" stroke="#d4ab55" strokeOpacity="0.07" strokeWidth="1" />
              </pattern>
              <filter id="w-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {chart && <clipPath id="w-land"><path d={chart.coast} /></clipPath>}
            </defs>
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#w-sea)" className="sea-bg" />
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#w-waves)" pointerEvents="none" />
            {chart && <>
              <path d={chart.coast} className="land" />
              <g clipPath="url(#w-land)">
                {realms && Object.entries(realms).map(([tag, r]) => (
                  <path key={tag} d={r.d} className={`realm ${ours(tag) ? "ours" : followed.has(tag) ? "followed" : ""} ${sel === tag ? "sel" : ""} ${hover?.id === tag ? "hot" : ""}`}
                    style={{ fill: fill(tag) }}
                    onPointerEnter={(e) => setHover({ kind: "realm", id: tag, x: e.clientX, y: e.clientY })}
                    onPointerMove={(e) => { if (!pz.dragging()) setHover({ kind: "realm", id: tag, x: e.clientX, y: e.clientY }); }}
                    onPointerLeave={() => setHover((h) => (h?.id === tag ? null : h))}
                    onClick={() => { if (!pz.dragging()) setSel(sel === tag ? null : tag); }} />
                ))}
              </g>
              {realms && Object.entries(realms).map(([tag, r]) => (followed.has(tag) || sel === tag) && !ours(tag) && (
                <path key={tag} d={r.d} className={`realm-edge ${sel === tag ? "sel" : ""}`} style={{ stroke: countryByTag.get(tag)?.color ?? "#5a4630" }} />
              ))}
              <path d={chart.coast} className="coast" />
              <rect x={0} y={0} width={W} height={H} className="neat" strokeWidth={2.2 * k} />
              {realms && Object.entries(realms).filter(([t]) => ours(t)).map(([tag, r]) => (
                <path key={tag} d={r.d} className={`realm-edge ours ${subj.has(tag) ? "subj" : ""}`} filter={tag === OURS ? "url(#w-glow)" : undefined} />
              ))}
            </>}
            {SEAS.map((s) => (
              <g key={s.tr} className="sea-label" transform={`translate(${s.x - F.x},${s.y - F.y})`}>
                <text className="ar" fontSize={44 * s.size * Math.max(0.6, k)} textAnchor="middle" direction="ltr">{s.ar}</text>
                <text className="tr" y={22 * s.size * Math.max(0.6, k)} fontSize={17 * s.size * Math.max(0.6, k)} textAnchor="middle">{s.tr}</text>
              </g>
            ))}
            {labels.map((l) => (
              <g key={l.tag} className={`realm-label ${ours(l.tag) ? "ours" : followed.has(l.tag) ? "followed" : "other"}`} transform={`translate(${l.x},${l.y})`} style={{ ["--rc" as any]: countryByTag.get(l.tag)?.color ?? "#5a4630" }}>
                {l.ar && <text className="ar" fontSize={30 * l.s} textAnchor="middle" direction="ltr">{l.ar}</text>}
                <text className="tr" y={(l.ar ? 14 : 4) * l.s} fontSize={(l.ar ? 11 : 10) * l.s} textAnchor="middle">{l.tr}</text>
              </g>
            ))}

            {/* the pilgrims' road: drawn by the chronicler, not read from the save */}
            {layers.lines && cap && idx?.mecca && hajj > 0 && (() => {
              const m = rel(idx.mecca), mx = (cap[0] + m[0]) / 2, my = Math.max(cap[1], m[1]) + 260;
              return (
                <g className="hajj" pointerEvents="none">
                  <path d={`M${cap[0]},${cap[1]} Q${mx},${my} ${m[0]},${m[1]}`} strokeWidth={1.6 * k} strokeDasharray={`${2 * k} ${6 * k}`} />
                  <g transform={`translate(${m[0]},${m[1]}) scale(${kq * 1.2})`}><rect x={-6} y={-6} width={12} height={12} /></g>
                  <text x={m[0] + 12 * kq} y={m[1] + 4 * kq} fontSize={12 * kq}>Makka, {hajj} caravan{hajj === 1 ? "" : "s"}</text>
                </g>
              );
            })()}
            {layers.lines && cap && layers.footholds && abroad.map((b) => {
              const [x, y] = rel(b.xy!), mx = (cap[0] + x) / 2, my = (cap[1] + y) / 2;
              const dx = x - cap[0], dy = y - cap[1], len = Math.hypot(dx, dy) || 1;
              const bend = Math.min(220, len * 0.18);
              return (
                <path key={`l-${b.type}-${b.location}`} className={`line ${b.type} ${isNew(b) ? "new" : ""}`} pointerEvents="none"
                  d={`M${cap[0]},${cap[1]} Q${mx - (dy / len) * bend},${my + (dx / len) * bend} ${x},${y}`}
                  strokeWidth={(b.type === "trade_office" ? 0.8 + Math.sqrt(b.level) * 0.45 : 0.9) * k} />
              );
            })}

            {capitals.map(([t, xy]) => {
              const [x, y] = rel(xy);
              return (
                <g key={t} className="w-capital" transform={`translate(${x},${y}) scale(${kq * 1.05})`} pointerEvents="none">
                  <path d="M-7 8 V-4 H-5 V-7 H-2.5 V-4 H-1 V-8 H1 V-4 H2.5 V-7 H5 V-4 H7 V8 Z" />
                </g>
              );
            })}
            {cap && (
              <g className="w-capital ours" transform={`translate(${cap[0]},${cap[1]}) scale(${kq * 1.7})`} pointerEvents="none">
                <path d="M-7 8 V-4 H-5 V-7 H-2.5 V-4 H-1 V-8 H1 V-4 H2.5 V-7 H5 V-4 H7 V8 Z" />
              </g>
            )}

            {battles.map((b) => {
              const recent = !prevSnap || b.date > prevSnap.date;
              return (
                <g key={b.id} className={`w-battle ${b.won ? "won" : "lost"} ${recent ? "recent" : "old"}`} transform={`translate(${b.x - F.x},${b.y - F.y}) scale(${kq * (recent ? 1 : 0.75)})`}
                  onPointerEnter={(e) => setHover({ kind: "battle", id: b.id, x: e.clientX, y: e.clientY })}
                  onPointerLeave={() => setHover((h) => (h?.id === b.id ? null : h))}>
                  <circle r={9} className="hit" />
                  {b.won ? <path d="M-6,-6 L6,6 M6,-6 L-6,6" /> : <><circle r={6.5} className="ring" /><path d="M-4,-4 L4,4 M4,-4 L-4,4" /></>}
                </g>
              );
            })}

            {layers.footholds && abroad.map((b) => {
              const [x, y] = rel(b.xy!);
              const key = `${b.type}@${b.location}`;
              const r = b.type === "trade_office" ? 3.2 + Math.sqrt(b.level) * 1.5 : 4.2;
              return (
                <g key={key} className={`post ${b.type} ${isNew(b) ? "new" : ""} ${hover?.id === key ? "hot" : ""}`} transform={`translate(${x},${y}) scale(${kq})`}
                  tabIndex={0} role="button" aria-label={`${ABROAD_KIND[b.type]?.label ?? nameOf(names, b.type)}${b.type === "trade_office" ? `, level ${b.level}` : ""}, ${placeName(b.location, names)}`}
                  onPointerEnter={(e) => setHover({ kind: "post", id: key, x: e.clientX, y: e.clientY })}
                  onPointerLeave={() => setHover((h) => (h?.id === key ? null : h))}
                  onFocus={(e) => { const rr = (e.target as Element).getBoundingClientRect(); setHover({ kind: "post", id: key, x: rr.right, y: rr.top }); }}
                  onBlur={() => setHover(null)}>
                  <circle r={Math.max(9, r + 3)} className="hit" />
                  {b.type === "trade_office" ? <circle r={r} />
                    : b.type === "embassy" ? <path d="M0,-7 L2,-2 7,-2 3,1.5 4.5,7 0,3.5 -4.5,7 -3,1.5 -7,-2 -2,-2Z" />
                    : <path d="M0,-5.5 L5.5,0 0,5.5 -5.5,0Z" />}
                  {b.building > 0 && <circle r={r + 3.5} className="building" />}
                  {(b.type === "trade_office" && b.level >= 10) && (
                    <text x={r + 4} y={4} className="post-label">{placeName(b.location, names)}</text>
                  )}
                </g>
              );
            })}
          </svg>

          {hover && !pz.dragging() && (
            <div className="hovercard ui" style={{ left: hover.x + 16, top: hover.y + 14 }} role="tooltip">
              {hover.kind === "realm" && <>
                {countryAt(hover.id, snap.date)?.nameArabic && <div className="ar">{countryAt(hover.id, snap.date)!.nameArabic}</div>}
                <div className="nm">{followed.has(hover.id) || hover.id === OURS ? powerName(hover.id, w, tags) : gameName(hover.id, w, tags)}</div>
                {w && hovPower && <div className="fig">{standing(hover.id, w)}</div>}
                {hovPower?.ruler && <div className="fig">{personOf(hovPower.ruler)?.name ?? hovPower.ruler.name}{hovPower.ruler.born ? `, ${year(w!.date) - year(hovPower.ruler.born)}` : ""}</div>}
                {!hovPower && subj.has(hover.id) && <div className="fig">A ṭāʾifa of al-Andalus</div>}
                {abroad.some((b) => b.holder === hover.id) && <div className="fig gilt">{abroad.filter((b) => b.holder === hover.id).length} of the crown's footholds</div>}
              </>}
              {hovPost && <>
                <div className="kind">{ABROAD_KIND[hovPost.type]?.label ?? nameOf(names, hovPost.type)}{hovPost.type === "trade_office" ? `, level ${hovPost.level}` : ""}</div>
                <div className="nm">{placeName(hovPost.location, names)}</div>
                <div className="fig">in {powerName(hovPost.holder ?? "", w, tags)}</div>
                {isNew(hovPost) && <div className="fig gilt">New since {western(prev!.checkpoint)}</div>}
                {!isNew(hovPost) && prevLevel.get(hover.id) !== undefined && prevLevel.get(hover.id) !== hovPost.level && <div className="fig gilt">Was level {prevLevel.get(hover.id)} at {western(prev!.checkpoint)}</div>}
                {hovPost.building > 0 && <div className="fig">Being enlarged</div>}
              </>}
              {hovBattle && <>
                <div className="kind">{hovBattle.naval ? "Sea battle" : "Battle"}, {western(hovBattle.date)}</div>
                <div className="nm">{hovBattle.title}</div>
              </>}
            </div>
          )}

          <div className="w-tools ui" role="group" aria-label="Move about the world">
            <button type="button" onClick={() => fly(footprint)}>The reach</button>
            <button type="button" onClick={() => fly([-40, -40, W + 80, H + 80])}>Whole chart</button>
            <button type="button" onClick={() => fly([1050, 1250, 2100, 1100])}>Middle Sea</button>
            <button type="button" onClick={() => fly([500, 1500, 2300, 2100])}>Africa</button>
            <button type="button" onClick={() => fly([2600, 900, 2000, 1700])}>The East</button>
            <span className="zoom">
              <button type="button" aria-label="Zoom in" onClick={() => pz.zoomCentre(0.6)}>+</button>
              <button type="button" aria-label="Zoom out" onClick={() => pz.zoomCentre(1.6)}>−</button>
            </span>
          </div>
          <Legend layers={layers} />
        </div>

        <aside className="w-folio" aria-label="The crown's footholds abroad">
          <Footholds now={now} prev={prev} names={names} w={w} tags={tags} sel={sel} onSel={setSel} />
        </aside>
      </div>

      <ReachOverTime series={rs?.series} names={names} at={snap.id} onPick={(id) => { const n = snapshots.findIndex((s) => s.id === id); if (n >= 0) setI(n); }} />

      <p className="quiet small w-prov">
        Borders, footholds and battles are read from the saves. The gilt lines from the capital, and the pilgrims' road to Makka,
        are the chronicler's: they join places the crown holds or has sent caravans to, and are not the routes the merchants sailed.
        {idx && idx.unplaced > 0 && <> {idx.unplaced} recorded battle{idx.unplaced === 1 ? "" : "s"} could not be placed on the chart.</>}
        {" "}<Link to="/kingdoms">The Kingdoms</Link> has the ladder of the powers; <Link to="/golden-century">the Golden Century</Link> the realm's temper.
      </p>
    </div>
  );
}

function Legend({ layers }: { layers: Layers }) {
  return (
    <div className="w-legend ui" aria-label="Key to the chart">
      {layers.footholds && <>
        <span><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><circle r="6" className="lg-office" /></svg> Trade office, by level</span>
        <span><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><path d="M0,-5.5 L5.5,0 0,5.5 -5.5,0Z" className="lg-post" /></svg> Overseas trading post</span>
        <span><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><path d="M0,-7 L2,-2 7,-2 3,1.5 4.5,7 0,3.5 -4.5,7 -3,1.5 -7,-2 -2,-2Z" className="lg-emb" /></svg> Embassy</span>
        <span><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><circle r="6" className="lg-new" /></svg> New since the last reading</span>
      </>}
      {layers.battles !== "off" && <>
        <span><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><path d="M-6,-6 L6,6 M6,-6 L-6,6" className="lg-won" /></svg> Battle won</span>
        <span><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><circle r="6.5" className="lg-lost-r" /><path d="M-4,-4 L4,4 M4,-4 L-4,4" className="lg-lost" /></svg> Battle lost</span>
      </>}
    </div>
  );
}

/** The drawer: the crown's footholds abroad, by the realm they stand in, with what changed since the last reading. */
function Footholds({ now, prev, names, w, tags, sel, onSel }: {
  now?: RealmAt; prev?: RealmAt; names?: Record<string, string>; w: ReturnType<typeof useWorld>; tags: ReturnType<typeof useTags>;
  sel: string | null; onSel: (t: string | null) => void;
}) {
  if (!now) return <p className="quiet">The crown's holdings abroad are read from the saves from 1375 on.</p>;
  const by = new Map<string, Abroad[]>();
  for (const b of now.abroad) { const h = b.holder ?? "?"; if (!by.has(h)) by.set(h, []); by.get(h)!.push(b); }
  const groups = [...by.entries()].sort((a, b) => b[1].reduce((s, x) => s + x.level, 0) - a[1].reduce((s, x) => s + x.level, 0));
  const pk = new Map((prev?.abroad ?? []).map((b) => [`${b.type}@${b.location}`, b]));
  const nk = new Set(now.abroad.map((b) => `${b.type}@${b.location}`));
  const closed = (prev?.abroad ?? []).filter((b) => !nk.has(`${b.type}@${b.location}`));
  const added = prev ? now.abroad.filter((b) => !pk.has(`${b.type}@${b.location}`)).length : 0;
  const levels = now.abroad.filter((b) => b.type === "trade_office").reduce((s, b) => s + b.level, 0);
  const prevLevels = (prev?.abroad ?? []).filter((b) => b.type === "trade_office").reduce((s, b) => s + b.level, 0);
  return (
    <div className="footholds">
      <h2>Footholds abroad</h2>
      <div className="fh-stats ui">
        <div><b className="num">{now.abroad.length}</b><span>footholds</span>{prev && <em className={added - closed.length > 0 ? "up" : ""}>{fmtDelta(now.abroad.length - prev.abroad.length)}</em>}</div>
        <div><b className="num">{by.size}</b><span>realms</span></div>
        <div><b className="num">{levels}</b><span>trade office levels</span>{prev && <em className={levels > prevLevels ? "up" : ""}>{fmtDelta(levels - prevLevels)}</em>}</div>
      </div>
      {prev && <p className="quiet small">Change since {western(prev.checkpoint)}{added ? `: ${added} new` : ""}{closed.length ? `, ${closed.length} gone` : ""}{!added && !closed.length ? ": none opened or lost" : ""}.</p>}
      <ul className="fh-groups">
        {groups.map(([holder, bs]) => (
          <li key={holder} className={sel === holder ? "sel" : ""}>
            <button type="button" className="fh-realm" onClick={() => onSel(sel === holder ? null : holder)} aria-pressed={sel === holder}>
              <i style={{ background: countryByTag.get(holder)?.color ?? faded(tags?.[holder]?.color, 0.7) }} />
              <span>{powerName(holder, w, tags)}</span>
              <span className="n num">{bs.length}</span>
            </button>
            <ul>
              {bs.sort((a, b) => b.level - a.level || a.location.localeCompare(b.location)).map((b) => {
                const was = pk.get(`${b.type}@${b.location}`);
                const id = placeId(b.location);
                return (
                  <li key={`${b.type}@${b.location}`}>
                    <span className={`fh-kind ${b.type}`} aria-hidden="true" />
                    {id ? <Link to={`/places/${id}`} className="entity" data-kind="place" data-id={id}>{placeName(b.location, names)}</Link> : <span>{placeName(b.location, names)}</span>}
                    <span className="fh-what">{b.type === "trade_office" ? `office ${b.level}` : b.type === "embassy" ? "embassy" : "trading post"}</span>
                    {prev && !was && <span className="tag new">new</span>}
                    {was && was.level !== b.level && <span className="tag up">{fmtDelta(b.level - was.level)}</span>}
                    {b.building > 0 && <span className="tag">building</span>}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      {closed.length > 0 && (
        <p className="quiet small">Gone since {western(prev!.checkpoint)}: {closed.map((b) => `${placeName(b.location, names)} (${ABROAD_KIND[b.type]?.label.toLowerCase() ?? b.type})`).join(", ")}.</p>
      )}
    </div>
  );
}

const fmtDelta = (d: number) => (d > 0 ? `+${d}` : d < 0 ? `−${-d}` : "±0");

/** Footholds by kind at each reading, so the turn outward can be seen at a glance. One axis, one bar per reading. */
function ReachOverTime({ series, names, at, onPick }: { series?: RealmAt[]; names?: Record<string, string>; at: string; onPick: (id: string) => void }) {
  const [hov, setHov] = useState<string | null>(null);
  if (!series?.length) return null;
  const kinds = Object.keys(ABROAD_KIND).sort((a, b) => ABROAD_KIND[a].rank - ABROAD_KIND[b].rank);
  const max = Math.max(1, ...series.map((r) => r.abroad.length));
  const y0 = year(series[0].checkpoint), y1 = year(series[series.length - 1].checkpoint);
  const W = 1000, H = 150, padL = 30, padB = 22;
  const x = (d: string) => padL + ((year(d) + (Number(d.slice(5, 7)) - 1) / 12 - y0) / Math.max(1, y1 - y0 + 1)) * (W - padL - 10);
  const bw = Math.max(4, Math.min(16, (W - padL) / series.length * 0.55));
  const yS = (n: number) => (H - padB) - (n / max) * (H - padB - 10);
  const cur = [...series].reverse().find((r) => r.checkpoint <= at);
  const hr = series.find((r) => r.checkpoint === hov);
  return (
    <section className="w-reach" aria-labelledby="w-reach-h">
      <h2 id="w-reach-h" className="section-title">The reach across the years</h2>
      <p className="quiet">The crown's footholds in other realms at each reading. Click a bar to see that year on the chart.</p>
      <div className="w-reach-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Footholds abroad from ${y0} to ${y1}, rising to ${series[series.length - 1].abroad.length}`}>
          {[0, Math.round(max / 2), max].map((t) => (
            <g key={t}><line x1={padL} x2={W - 4} y1={yS(t)} y2={yS(t)} className="grid" /><text x={padL - 6} y={yS(t) + 4} className="tick" textAnchor="end">{t}</text></g>
          ))}
          {series.map((r) => {
            let acc = 0;
            return (
              <g key={r.checkpoint} className={`bar ${cur?.checkpoint === r.checkpoint ? "on" : ""}`} onClick={() => onPick(r.checkpoint)}
                onPointerEnter={() => setHov(r.checkpoint)} onPointerLeave={() => setHov(null)}>
                <rect x={x(r.checkpoint) - bw / 2 - 3} y={0} width={bw + 6} height={H - padB} className="hit" />
                {kinds.map((kd) => {
                  const n = r.abroad.filter((b) => b.type === kd).length;
                  if (!n) return null;
                  const yTop = yS(acc + n), yBot = yS(acc); acc += n;
                  return <rect key={kd} x={x(r.checkpoint) - bw / 2} y={yTop + 1} width={bw} height={Math.max(0, yBot - yTop - 1)} className={`k-${kd}`} rx={1.5} />;
                })}
              </g>
            );
          })}
          {Array.from({ length: Math.floor((y1 - y0) / 10) + 1 }, (_, n) => Math.ceil(y0 / 10) * 10 + n * 10).filter((yy) => yy <= y1).map((yy) => (
            <text key={yy} x={x(`${yy}-01-01`)} y={H - 6} className="tick" textAnchor="middle">{yy}</text>
          ))}
        </svg>
        {hr && (
          <div className="w-reach-tip ui" role="status">
            <b>{western(hr.checkpoint)}</b>: {hr.abroad.length} footholds
            {kinds.map((kd) => { const n = hr.abroad.filter((b) => b.type === kd).length; return n ? `, ${n} ${(n === 1 ? ABROAD_KIND[kd].label : ABROAD_KIND[kd].plural).toLowerCase()}` : ""; }).join("")}
          </div>
        )}
      </div>
      <div className="w-legend inline ui">
        {kinds.map((kd) => <span key={kd}><i className={`sw k-${kd}`} /> {ABROAD_KIND[kd]?.plural ?? nameOf(names, kd)}</span>)}
      </div>
    </section>
  );
}
