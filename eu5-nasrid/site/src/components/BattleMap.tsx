import { useMemo } from "react";
import { countryByTag, snapshots, subjectTags, western } from "../lib/data";
import { useFetched } from "../lib/world";
import "./battlemap.css";

/*
 * Where a war was fought: its battles on the World chart (tools/battle_places.py), numbered in the order
 * they were fought, over the realms at the checkpoint nearest the war's end. Static, framed on the battles.
 */

type Frame = { x: number; y: number; width: number; height: number };
type Battle = { id: string; date: string; war: string | null; key: string; x: number; y: number; naval: boolean; won: boolean; title: string };
type Index = { frame: Frame | null; realmsAt: string[]; battles: Battle[] };
type Chart = { frame: Frame; coast: string };
type Realms = Record<string, { d: string; px: number; c: [number, number] }>;

/** The war's placed battles, in order, each with its number on the map. */
export function useWarBattles(warId: string) {
  const idx = useFetched<Index>("globe/index.json");
  return useMemo(() => {
    const list = (idx?.battles ?? []).filter((b) => b.war === warId).sort((a, b) => a.date.localeCompare(b.date));
    return { idx, list, number: new Map(list.map((b, n) => [b.id, n + 1])) };
  }, [idx, warId]);
}

export default function BattleMap({ warId, end, unplaced = 0 }: { warId: string; end: string | null; unplaced?: number }) {
  const { idx, list, number } = useWarBattles(warId);
  const chart = useFetched<Chart>(list.length ? "globe/chart.json" : null);
  const at = useMemo(() => {
    if (!idx) return null;
    const lim = end ?? snapshots[snapshots.length - 1].id;
    const ok = idx.realmsAt.filter((id) => id <= lim);
    return ok.length ? ok[ok.length - 1] : idx.realmsAt[0] ?? null;
  }, [idx, end]);
  const realms = useFetched<Realms>(list.length && at ? `globe/realms-${at}.json` : null);
  if (!idx || !list.length) return null;
  const F = idx.frame ?? chart?.frame ?? { x: 5900, y: 1100, width: 4601, height: 3901 };
  const pts = list.map((b) => [b.x - F.x, b.y - F.y] as [number, number]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const W = 900, H = 420;
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const span = Math.max(260, (x1 - x0) * 1.3 + 60, ((y1 - y0) * 1.3 + 60) * (W / H));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, vw = span, vh = span * (H / W);
  x0 = cx - vw / 2; y0 = cy - vh / 2;
  const k = vw / W;
  const subj = new Set(subjectTags[at ?? ""] ?? []);
  const won = list.filter((b) => b.won).length;
  // marks that would sit on top of each other are nudged apart, in order
  const placed: [number, number][] = [];
  const spots = pts.map(([x, y]) => {
    let px = x, py = y, tries = 0;
    while (placed.some(([qx, qy]) => Math.hypot(qx - px, qy - py) < 15 * k) && tries < 24) {
      const a = tries * 2.4; px = x + Math.cos(a) * 15 * k * (1 + tries / 8); py = y + Math.sin(a) * 15 * k * (1 + tries / 8); tries++;
    }
    placed.push([px, py]); return [px, py, x, y] as const;
  });

  return (
    <figure className="battle-map">
      <svg viewBox={`${x0} ${y0} ${vw} ${vh}`} role="img" aria-label={`Map of the ${list.length} battles placed: ${won} won, ${list.length - won} lost or drawn`}>
        <rect x={x0} y={y0} width={vw} height={vh} className="sea" />
        {chart && <path d={chart.coast} className="land" />}
        {chart && <clipPath id={`bm-${warId}`}><path d={chart.coast} /></clipPath>}
        {realms && <g clipPath={`url(#bm-${warId})`}>
          {Object.entries(realms).map(([t, r]) => (
            <path key={t} d={r.d} className={`realm ${t === "GRA" || subj.has(t) ? "ours" : ""}`}
              style={{ fill: t === "GRA" || subj.has(t) ? "#d4ab55" : countryByTag.get(t)?.color ?? "#cbb894" }} />
          ))}
        </g>}
        {chart && <path d={chart.coast} className="coast" strokeWidth={1.1 * k} />}
        {spots.map(([px, py, x, y], n) => {
          const b = list[n];
          return (
            <g key={b.id} className={`bm-mark ${b.won ? "won" : "lost"}`}>
              {(px !== x || py !== y) && <line x1={x} y1={y} x2={px} y2={py} strokeWidth={1 * k} className="leader" />}
              <g transform={`translate(${px},${py}) scale(${k})`}>
                <title>{`${n + 1}. ${western(b.date)}: ${b.title}`}</title>
                <circle r={9.5} />
                <text y={3.8} textAnchor="middle">{n + 1}</text>
              </g>
            </g>
          );
        })}
      </svg>
      <figcaption className="ui">
        <span><i className="won" /> won</span> <span><i className="lost" /> lost or drawn</span>
        <span className="muted">Numbered in the order fought; the numbers match the battles listed below. Borders as of {western(at ?? "")}.{unplaced > 0 ? ` ${unplaced} engagement${unplaced === 1 ? "" : "s"} could not be placed.` : ""}</span>
      </figcaption>
      <span className="visually-hidden">{number.size} battles</span>
    </figure>
  );
}
