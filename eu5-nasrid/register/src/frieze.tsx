import { useEffect, useRef } from "react";
import { beats, tellings, threads, cast, campaign, now, Y0, Y1, hijriSpan, first, type Thread } from "./core";

/* ------------------------------------------------------------------ the frieze: every year of the campaign as one tile */
export const yearCount = new Map<number, number>();
for (const b of beats) if (!b.minor) yearCount.set(+b.on.slice(0, 4), (yearCount.get(+b.on.slice(0, 4)) ?? 0) + 1);
const maxCount = Math.max(...yearCount.values());
const yearsWithTelling = new Set(tellings.map((t) => +t.on.slice(0, 4)));
export const frac = (d: string) => +d.slice(0, 4) + (+d.slice(5, 7) - 1) / 12 + (+d.slice(8, 10) - 1) / 365;
const ourWars = threads.filter((t) => t.kind === "war" && !t.part && (t.to ?? now.date) >= campaign.start);
const lanes: Thread[][] = [];
for (const w of ourWars) { const lane = lanes.find((l) => frac(l.at(-1)!.to ?? now.date) + 0.6 < frac(w.from!)); if (lane) lane.push(w); else lanes.push([w]); }
const reigns = Object.entries(cast).flatMap(([id, p]) => (p.reigns ?? []).map((r) => ({ id, ...r }))).filter((r) => (r.to ?? "9999") > campaign.start).sort((a, b) => a.from.localeCompare(b.from));

export function Frieze({ at, onPick }: { at?: number; onPick?: (y: number) => void }) {
  const cell = 10, pad = 14, W = (Y1 - Y0 + 1) * cell + pad * 2;
  const x = (y: number) => pad + (y - Y0) * cell;
  const xf = (d: string) => pad + (Math.max(frac(d), Y0) - Y0) * cell;
  const laneY = (i: number) => 58 + i * 7;
  const H = laneY(lanes.length) + 18;
  const box = useRef<HTMLDivElement>(null);
  // on a narrow screen the band scrolls sideways: open it at the year in question, or at the present
  useEffect(() => { const el = box.current; if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = ((x(at ?? Y1) + cell / 2) / W) * el.scrollWidth - el.clientWidth / 2; }, [at]);
  return (
    <div className="frieze" ref={box} role="navigation" aria-label="The years of the campaign">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {reigns.map((r) => {
          const a = xf(r.from), b = r.to ? xf(r.to) : x(Y1) + cell;
          return (
            <g key={r.id + r.from}>
              <line className="fz-reign" x1={a + 1} x2={b - 2} y1={22} y2={22} />
              <line className="fz-reign" x1={a + 1} x2={a + 1} y1={18} y2={26} />
              <a href={`#who-${r.id}`}><text className="fz-name" x={a + 5} y={13}>{first(r.id)}</text></a>
            </g>
          );
        })}
        {Array.from({ length: Y1 - Y0 + 1 }, (_, i) => Y0 + i).map((y) => {
          const n = yearCount.get(y) ?? 0, cx = x(y) + cell / 2, s = n ? 2.4 + 2.4 * Math.sqrt(n / maxCount) : 1.2;
          return (
            <a key={y} href={`#line-${y}`} aria-label={`${y}: ${n} entries`} onClick={onPick ? (e) => { e.preventDefault(); onPick(y); } : undefined}>
              <title>{`${y} (${hijriSpan(y)} AH): ${n} ${n === 1 ? "entry" : "entries"}${yearsWithTelling.has(y) ? ", with a telling" : ""}`}</title>
              <rect className="fz-hit" x={x(y)} y={28} width={cell} height={24} />
              <rect className={`fz-tile${n ? "" : " empty"}${at === y ? " at" : ""}`} x={cx - s} y={40 - s} width={s * 2} height={s * 2} transform={`rotate(45 ${cx} 40)`} style={n ? { fillOpacity: 0.35 + 0.65 * Math.sqrt(n / maxCount) } : undefined} />
            </a>
          );
        })}
        {lanes.map((l, i) => l.map((w) => (
          <a key={w.id} href={`#thread-${w.id}`}>
            <title>{`${w.title}, ${w.from!.slice(0, 4)}–${w.to ? w.to.slice(0, 4) : "still fought"}`}</title>
            <rect className={`fz-war${w.to ? "" : " open"}`} x={xf(w.from!)} y={laneY(i)} width={Math.max(3, xf(w.to ?? now.date) - xf(w.from!))} height={4} rx={2} />
          </a>
        )))}
        {Array.from({ length: Y1 - Y0 + 1 }, (_, i) => Y0 + i).filter((y) => y % 10 === 0).map((y) => (
          <g key={y}><line className="fz-tick" x1={x(y) + cell / 2} x2={x(y) + cell / 2} y1={H - 16} y2={H - 12} /><text className="fz-year" x={x(y) + cell / 2} y={H - 2} textAnchor="middle">{y}</text></g>
        ))}
      </svg>
    </div>
  );
}
export const FriezeKey = () => <p className="key">Each tile is a year, larger and darker the more was recorded. The line above is the reign; the bars below are the wars al-Andalus fought. Choose a year to read it.</p>;

