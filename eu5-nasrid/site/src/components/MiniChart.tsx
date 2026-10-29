import { Link } from "react-router-dom";
import type { Place } from "../lib/data";
import { countryByTag, latest, subjectLands } from "../lib/data";
import { gameMap } from "../lib/map";
import "./minichart.css";

/** `named` forces a label even when crowded (the capital, say). */
export type Mark = { place: Place; tone?: "ours" | "theirs" | "battle" | "focus"; label?: string; named?: boolean };

/**
 * A small chart cut from the game map: the coast, the realms of a checkpoint
 * (the latest by default) as faint washes, and a set of marks. Frames itself
 * around the marks, at least `minSpan` map pixels wide.
 */
export default function MiniChart({ marks, height = 360, minSpan = 160, checkpoint }: {
  marks: Mark[]; height?: number; minSpan?: number; checkpoint?: string;
}) {
  const W = 900, H = height;
  const pts = marks.filter((m) => Number.isFinite(m.place.x));
  const xs = pts.map((m) => m.place.x), ys = pts.map((m) => m.place.y);
  const cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 400;
  const cy = ys.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : 450;
  const span = Math.max(minSpan, xs.length ? Math.max(...xs) - Math.min(...xs) + 60 : 0, ys.length ? (Math.max(...ys) - Math.min(...ys) + 60) * (W / H) : 0);
  const vw = span, vh = span * (H / W);
  const k = vw / W; // one screen pixel, in map units
  const realms = gameMap.realms[checkpoint ?? latest?.id ?? ""] ?? {};
  const subj = new Set(Object.keys(subjectLands[checkpoint ?? latest?.id ?? ""] ?? {}));
  const labels = layout(pts, k);

  return (
    <svg className="minichart" viewBox={`${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Chart of the places named here">
      <defs><clipPath id="mc-land"><path d={gameMap.coast} /></clipPath></defs>
      <rect x={cx - vw} y={cy - vh} width={vw * 2} height={vh * 2} className="sea" />
      {Array.from({ length: 16 }, (_, n) => {
        const a = (n / 16) * Math.PI * 2;
        return <line key={n} x1={cx} y1={cy} x2={cx + vw * 1.5 * Math.cos(a)} y2={cy + vw * 1.5 * Math.sin(a)} className={`wind w${n % 2}`} strokeWidth={0.7 * k} />;
      })}
      <path d={gameMap.coast} className="land" />
      <g clipPath="url(#mc-land)">
        {Object.entries(realms).map(([tag, r]) => (
          <path key={tag} d={r.d} className={`realm ${tag === "GRA" ? "ours" : subj.has(tag) ? "ours subj" : ""}`} style={{ fill: subj.has(tag) ? countryByTag.get("GRA")?.color : countryByTag.get(tag)?.color ?? "#cbb894" }} />
        ))}
      </g>
      {Object.entries(realms).map(([tag, r]) => countryByTag.has(tag) && (
        <path key={tag} d={r.d} className={`realm-edge ${subj.has(tag) ? "subj" : ""}`} style={{ stroke: tag === "GRA" || subj.has(tag) ? "#8e6b26" : countryByTag.get(tag)!.color }} strokeWidth={1.1 * k} strokeDasharray={subj.has(tag) ? `${4 * k} ${3 * k}` : undefined} />
      ))}
      <path d={gameMap.coast} className="coast" strokeWidth={1.2 * k} />
      {labels.map(({ m, pos }) => {
        const tone = m.tone ?? "theirs";
        return (
          <Link key={m.place.id} to={`/places/${m.place.id}`} data-kind="place" data-id={m.place.id} className={`mk ${tone}`}>
            <g transform={`translate(${m.place.x},${m.place.y}) scale(${k})`}>
              {tone === "battle" ? <path d="M-7,-7 L7,7 M7,-7 L-7,7" className="swords" /> : <circle r={tone === "focus" ? 9 : 6} />}
              {pos ? (
                <>
                  <text x={pos.dx} y={pos.dy} textAnchor={pos.anchor} className="ar" direction="ltr">{m.place.nameArabic}</text>
                  <text x={pos.dx} y={pos.dy + 16} textAnchor={pos.anchor} className="tr">{m.label ?? m.place.name}</text>
                </>
              ) : <title>{`${m.place.nameArabic ?? ""} ${m.label ?? m.place.name}`}</title>}
            </g>
          </Link>
        );
      })}
    </svg>
  );
}

type Pos = { dx: number; dy: number; anchor: "start" | "end" | "middle" };
const RANK = { focus: 0, battle: 1, ours: 2, theirs: 3 } as const;

/** Greedy label placement in screen pixels; a mark with no room keeps only its marker (and a hover title). */
function layout(items: Mark[], k: number) {
  const P = items.map((m) => ({ m, x: m.place.x / k, y: m.place.y / k, pos: null as Pos | null }));
  const boxes = P.map(({ x, y }) => ({ x0: x - 9, y0: y - 9, x1: x + 9, y1: y + 9 }));
  const hit = (b: (typeof boxes)[number]) => boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
  const order = [...P].sort((a, b) => Number(!!b.m.named) - Number(!!a.m.named) || RANK[a.m.tone ?? "theirs"] - RANK[b.m.tone ?? "theirs"]);
  for (const it of order) {
    const w = Math.max((it.m.place.nameArabic ?? "").length * 11, (it.m.label ?? it.m.place.name).length * 7.4);
    const tries: Pos[] = [
      { dx: 13, dy: -2, anchor: "start" }, { dx: -13, dy: -2, anchor: "end" },
      { dx: 0, dy: -28, anchor: "middle" }, { dx: 0, dy: 30, anchor: "middle" },
    ];
    for (const t of tries) {
      const left = t.anchor === "start" ? it.x + t.dx : t.anchor === "end" ? it.x + t.dx - w : it.x - w / 2;
      const box = { x0: left - 3, y0: it.y + t.dy - 20, x1: left + w + 3, y1: it.y + t.dy + 20 };
      if (!hit(box) || it.m.tone === "focus" || it.m.named) { it.pos = t; boxes.push(box); break; }
    }
  }
  return P;
}
