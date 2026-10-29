import { useMemo } from "react";
import { Link } from "react-router-dom";
import { geoMercator, geoPath } from "d3-geo";
import land from "../generated/land.json";
import type { Place } from "../lib/data";
import "./minichart.css";

/**
 * A small portolan chart: the coast, a few wind lines, and a set of marks.
 * Frames itself around the marks it is given (with a minimum span).
 */
export default function MiniChart({ marks, height = 360, minSpan = 4.5 }: {
  marks: Mark[];
  height?: number; minSpan?: number;
}) {
  const W = 900, H = height;
  const pts = marks.filter((m) => m.place.lat != null && m.place.lon != null);
  const { path, proj } = useMemo(() => {
    const lons = pts.map((m) => m.place.lon!), lats = pts.map((m) => m.place.lat!);
    const cx = lons.length ? (Math.min(...lons) + Math.max(...lons)) / 2 : -4;
    const cy = lats.length ? (Math.min(...lats) + Math.max(...lats)) / 2 : 36.5;
    const span = Math.max(minSpan, ...(lons.length ? [Math.max(...lons) - Math.min(...lons) + 1, (Math.max(...lats) - Math.min(...lats) + 1) * 1.6] : []));
    const frame = { type: "Feature", geometry: { type: "MultiPoint", coordinates: [[cx - span / 2, cy + span / 3.2], [cx + span / 2, cy - span / 3.2]] } } as any;
    const proj = geoMercator().fitExtent([[20, 20], [W - 20, H - 20]], frame);
    return { proj, path: geoPath(proj) };
  }, [pts.map((m) => m.place.id).join(","), H, minSpan]);
  const landPath = useMemo(() => path(land as any) ?? "", [path]);
  const labels = layout(pts.map((m) => ({ m, xy: proj([m.place.lon!, m.place.lat!])! })));

  return (
    <svg className="minichart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Chart of the places named here">
      <rect width={W} height={H} className="sea" />
      {Array.from({ length: 16 }, (_, k) => {
        const a = (k / 16) * Math.PI * 2;
        return <line key={k} x1={W / 2} y1={H / 2} x2={W / 2 + 1200 * Math.cos(a)} y2={H / 2 + 1200 * Math.sin(a)} className={`wind w${k % 2}`} />;
      })}
      <path d={landPath} className="land" />
      {labels.map(({ m, xy: [x, y], pos }) => {
        const tone = m.tone ?? "theirs";
        return (
          <Link key={m.place.id} to={`/places/${m.place.id}`} data-kind="place" data-id={m.place.id} className={`mk ${tone}`}>
            <g transform={`translate(${x},${y})`}>
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

/** `named` forces a label even when crowded (the capital, say). */
export type Mark = { place: Place; tone?: "ours" | "theirs" | "battle" | "focus"; label?: string; named?: boolean };
type Pos = { dx: number; dy: number; anchor: "start" | "end" | "middle" };
const RANK = { focus: 0, battle: 1, ours: 2, theirs: 3 } as const;

/** Greedy label placement: the most important marks choose first; a mark with no room keeps only its marker (and a hover title). */
function layout(items: { m: Mark; xy: [number, number] }[]) {
  const boxes = items.map(({ xy: [x, y] }) => ({ x0: x - 9, y0: y - 9, x1: x + 9, y1: y + 9 }));
  const hit = (b: (typeof boxes)[number]) => boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
  const out = items.map((it) => ({ ...it, pos: null as Pos | null }));
  const order = [...out].sort((a, b) => Number(!!b.m.named) - Number(!!a.m.named) || RANK[a.m.tone ?? "theirs"] - RANK[b.m.tone ?? "theirs"]);
  for (const it of order) {
    const [x, y] = it.xy;
    const w = Math.max((it.m.place.nameArabic ?? "").length * 11, (it.m.label ?? it.m.place.name).length * 7.4);
    const tries: Pos[] = [
      { dx: 13, dy: -2, anchor: "start" }, { dx: -13, dy: -2, anchor: "end" },
      { dx: 0, dy: -28, anchor: "middle" }, { dx: 0, dy: 30, anchor: "middle" },
    ];
    for (const t of tries) {
      const left = t.anchor === "start" ? x + t.dx : t.anchor === "end" ? x + t.dx - w : x - w / 2;
      const box = { x0: left - 3, y0: y + t.dy - 20, x1: left + w + 3, y1: y + t.dy + 20 };
      if (!hit(box) || it.m.tone === "focus" || it.m.named) { it.pos = t; boxes.push(box); break; }
    }
  }
  return out;
}
