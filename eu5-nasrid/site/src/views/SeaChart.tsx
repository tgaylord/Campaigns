import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { countryByTag, subjectLands, snapshots, western, year } from "../lib/data";
import { usePanZoom } from "../lib/panzoom";
import type { Box } from "../lib/panzoom";
import { useFetched, useTags, useWorld, world, followed, powerName, gameName, personOf } from "../lib/world";
import type { World } from "../lib/world";
import Dispatch, { standing } from "../components/Dispatch";

/* The Middle Sea: the wide chart from Lisbon to Alexandria (tools/build_map.py --lite), realms only. */

type Chart = { frame: { x: number; y: number; width: number; height: number }; coast: string; provinces: Record<string, { d: string; c: [number, number]; region: string | null }> };
type Realms = Record<string, { d: string; px: number; c: [number, number] }>;

const OURS = "GRA";
const PARCH = [0xe3, 0xd2, 0xad];
/** a country's game colour, faded toward the parchment so the chart keeps one hand */
function faded(hex: string | null | undefined, keep = 0.38) {
  if (!hex) return "#d8c8a2";
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  return `rgb(${c.map((v, i) => Math.round(v * keep + PARCH[i] * (1 - keep))).join(",")})`;
}
const SEAS = [
  { ar: "البحر المحيط", tr: "al-Baḥr al-Muḥīṭ", x: 95, y: 700, size: 0.9 },
  { ar: "بحر الروم", tr: "Baḥr al-Rūm", x: 1330, y: 1170, size: 1.5 },
  { ar: "بحر نيطش", tr: "Baḥr Nīṭush", x: 2230, y: 600, size: 0.8 },
];
const ROSE = { x: 1180, y: 1270 };

export default function SeaChart({ snapId, selected, onSelect }: { snapId: string; selected: string | null; onSelect: (t: string | null) => void }) {
  const chart = useFetched<Chart>("sea/chart.json");
  const realms = useFetched<Realms>(`sea/realms-${snapId}.json`);
  const w = useWorld(snapId);
  const tags = useTags();
  const W = world.frame.width, H = world.frame.height;
  const svgRef = useRef<SVGSVGElement>(null);
  // the whole sea, with room on the right for the folio
  const WHOLE: Box = [-40, -20, W + 700, H + 40];
  const pz = usePanZoom(svgRef, W, H, WHOLE, 160);
  const [vx, vy, vw, vh] = pz.vb;
  const k = vw / 1600;
  const kq = Math.round(k * 20) / 20;
  const [hover, setHover] = useState<{ tag: string; x: number; y: number } | null>(null);
  const subj = new Set(Object.keys(subjectLands[snapId] ?? {}));
  const ours = (t: string) => t === OURS || subj.has(t);
  const fill = (t: string) => (ours(t) ? countryByTag.get(OURS)!.color : followed.has(t) && countryByTag.has(t) ? countryByTag.get(t)!.color : faded(tags?.[t]?.color));

  const winds = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; tier: number }[] = [];
    const R = 900;
    const centres = [[ROSE.x, ROSE.y], ...Array.from({ length: 16 }, (_, n) => [ROSE.x + R * Math.cos((n / 16) * 2 * Math.PI), ROSE.y + R * Math.sin((n / 16) * 2 * Math.PI)])];
    centres.forEach(([cx, cy], c) => {
      for (let n = 0; n < 32; n++) {
        const a = (n / 32) * 2 * Math.PI, len = c === 0 ? 3200 : 1500;
        out.push({ x1: cx, y1: cy, x2: cx + len * Math.cos(a), y2: cy + len * Math.sin(a), tier: n % 4 === 0 ? (n % 8 === 0 ? 0 : 1) : 2 });
      }
    });
    return out;
  }, []);

  // realm names: the followed powers in the chronicle's words, the rest in the game's, biggest first, never overlapping
  const labels = useMemo(() => {
    if (!realms) return [];
    const boxes: number[][] = [];
    const out: { tag: string; x: number; y: number; ar?: string; tr: string; s: number; ours: boolean }[] = [];
    const list = Object.entries(realms).sort((a, b) => Number(followed.has(b[0])) - Number(followed.has(a[0])) || b[1].px - a[1].px);
    for (const [tag, r] of list) {
      const c = countryByTag.get(tag);
      const minPx = followed.has(tag) ? 900 : 5000;
      if (r.px / (kq * kq) < minPx) continue;
      if (r.c[0] < vx || r.c[0] > vx + vw || r.c[1] < vy || r.c[1] > vy + vh) continue;
      const s = Math.min(1.6, Math.max(0.55, Math.sqrt(r.px) / 140)) * kq;
      const tr = followed.has(tag) ? powerName(tag, w, tags) : gameName(tag, w, tags);
      const ar = followed.has(tag) ? c?.nameArabic : undefined;
      const wd = Math.max((ar?.length ?? 0) * 17 * s, tr.length * 6.5 * s), ht = (ar ? 34 : 14) * s;
      const b = [r.c[0] - wd / 2, r.c[1] - ht * 0.75, r.c[0] + wd / 2, r.c[1] + ht * 0.4];
      if (boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue;
      boxes.push(b);
      out.push({ tag, x: r.c[0], y: r.c[1], ar, tr, s, ours: ours(tag) });
    }
    return out;
  }, [realms, kq, vx, vy, vw, vh, w, tags, snapId]);

  const hov = hover && w ? w.powers[hover.tag] : undefined;
  const fly = (b: Box) => pz.flyTo(b, 700);

  return (
    <>
      <svg ref={svgRef} className="chart sea-chart" viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" role="img"
        aria-label={`The Middle Sea at ${western(snapshots.find((s) => s.id === snapId)?.date ?? "")}, coloured by realm`}
        {...pz.handlers}
        onClick={(e) => { if (!pz.dragging() && (e.target as Element).classList.contains("sea-bg")) onSelect(null); }}>
        <defs>
          <radialGradient id="sea2" cx="50%" cy="60%" r="70%"><stop offset="0" stopColor="#1d2b5c" /><stop offset="1" stopColor="#0b1128" /></radialGradient>
          <pattern id="waves2" width="46" height="22" patternUnits="userSpaceOnUse">
            <path d="M0 11 q 11.5 -7 23 0 t 23 0" fill="none" stroke="#d4ab55" strokeOpacity="0.07" strokeWidth="1" />
          </pattern>
          <filter id="paper2" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.18  0 0 0 0.16 0" result="grain" />
            <feComposite in="grain" in2="SourceGraphic" operator="in" result="g" />
            <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g" /></feMerge>
          </filter>
          <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {chart && <clipPath id="land-clip2"><path d={chart.coast} /></clipPath>}
        </defs>
        <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#sea2)" className="sea-bg" />
        <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#waves2)" pointerEvents="none" />
        <g className="winds">{winds.map((l, n) => <line key={n} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className={`wind t${l.tier}`} strokeWidth={0.8 * k} />)}</g>
        {chart && <>
          <path d={chart.coast} className="coast-shadow" strokeWidth={9 * k} />
          <path d={chart.coast} className="land" filter="url(#paper2)" />
          <g clipPath="url(#land-clip2)">
            {realms && Object.entries(realms).map(([tag, r]) => (
              <path key={tag} d={r.d} className={`realm sea-realm ${ours(tag) ? "ours" : followed.has(tag) ? "followed" : ""} ${selected === tag ? "sel" : ""} ${hover?.tag === tag ? "hot" : ""}`}
                style={{ fill: fill(tag) }}
                onPointerEnter={(e) => setHover({ tag, x: e.clientX, y: e.clientY })}
                onPointerMove={(e) => { if (!pz.dragging()) setHover({ tag, x: e.clientX, y: e.clientY }); }}
                onPointerLeave={() => setHover((h) => (h?.tag === tag ? null : h))}
                onClick={() => { if (!pz.dragging()) onSelect(tag); }} />
            ))}
            <g className="sea-provs">{Object.entries(chart.provinces).map(([key, p]) => <path key={key} d={p.d} strokeWidth={0.5 * k} />)}</g>
          </g>
          {realms && Object.entries(realms).map(([tag, r]) => (followed.has(tag) || selected === tag) && !ours(tag) && (
            <path key={tag} d={r.d} className={`realm-edge ${selected === tag ? "sel" : ""}`} style={{ stroke: countryByTag.get(tag)?.color ?? "#5a4630" }} strokeWidth={(selected === tag ? 3 : 1.4) * k} />
          ))}
          <path d={chart.coast} className="coast" strokeWidth={1.1 * k} />
          {/* the edge of the sheet: the chart ends here, as a drawn chart does */}
          <rect x={0} y={0} width={W} height={H} className="neat" strokeWidth={2.2 * k} />
          <rect x={-10 * k} y={-10 * k} width={W + 20 * k} height={H + 20 * k} className="neat thin" strokeWidth={0.9 * k} />
          {realms && Object.entries(realms).filter(([t]) => ours(t)).map(([tag, r]) => (
            <path key={tag} d={r.d} className={`realm-edge ours ${subj.has(tag) ? "subj" : ""}`} strokeWidth={(tag === OURS ? 2.2 : 1.4) * k} strokeDasharray={subj.has(tag) ? `${5 * k} ${4 * k}` : undefined} filter={tag === OURS ? "url(#glow2)" : undefined} />
          ))}
        </>}
        {SEAS.map((s) => (
          <g key={s.tr} className="sea-label" transform={`translate(${s.x},${s.y})`}>
            <text className="ar" fontSize={44 * s.size * Math.max(0.5, k)} textAnchor="middle" direction="ltr">{s.ar}</text>
            <text className="tr" y={22 * s.size * Math.max(0.5, k)} fontSize={17 * s.size * Math.max(0.5, k)} textAnchor="middle">{s.tr}</text>
          </g>
        ))}
        {labels.map((l) => (
          <g key={l.tag} className={`realm-label sea ${l.ours ? "ours" : followed.has(l.tag) ? "followed" : "other"}`} transform={`translate(${l.x},${l.y})`} style={{ ["--rc" as any]: countryByTag.get(l.tag)?.color ?? "#5a4630" }}>
            {l.ar && <text className="ar" fontSize={30 * l.s} textAnchor="middle" direction="ltr">{l.ar}</text>}
            <text className="tr" y={(l.ar ? 14 : 4) * l.s} fontSize={(l.ar ? 11 : 10) * l.s} textAnchor="middle">{l.tr}</text>
          </g>
        ))}
        {realms && Object.entries(world.capitals).filter(([t, c]) => c.onChart && realms[t]).map(([t, c]) => (
          <g key={t} className={`sea-capital ${t === OURS ? "ours" : ""}`} transform={`translate(${c.x},${c.y}) scale(${kq * (t === OURS ? 1.6 : 1.1)})`} pointerEvents="none">
            <path d="M-7 8 V-4 H-5 V-7 H-2.5 V-4 H-1 V-8 H1 V-4 H2.5 V-7 H5 V-4 H7 V8 Z" />
          </g>
        ))}
      </svg>

      {hover && !pz.dragging() && (
        <div className="hovercard ui" style={{ left: hover.x + 16, top: hover.y + 14 }} role="tooltip">
          {countryByTag.get(hover.tag)?.nameArabic && <div className="ar">{countryByTag.get(hover.tag)!.nameArabic}</div>}
          <div className="nm">{followed.has(hover.tag) ? powerName(hover.tag, w, tags) : gameName(hover.tag, w, tags)}</div>
          {w && hov && <div className="fig">{standing(hover.tag, w)}</div>}
          {hov?.ruler && <div className="fig">{personOf(hov.ruler)?.name ?? hov.ruler.name}{hov.ruler.born ? `, ${year(w!.date) - year(hov.ruler.born)}` : ""}</div>}
          {!hov && w && subj.has(hover.tag) && <div className="fig">A ṭāʾifa of Granada</div>}
          <div className="hint">Click for its dispatch</div>
        </div>
      )}

      <div className="sea-tools ui" role="group" aria-label="Move about the Middle Sea">
        <button type="button" onClick={() => fly(WHOLE)}>Whole sea</button>
        <button type="button" onClick={() => fly([0, 450, 1000, 700])}>The West</button>
        <button type="button" onClick={() => fly([800, 250, 1100, 800])}>Italy</button>
        <button type="button" onClick={() => fly([1500, 450, 900, 1150])}>The East</button>
        <span className="zoom">
          <button type="button" aria-label="Zoom in" onClick={() => pz.zoomCentre(0.6)}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => pz.zoomCentre(1.6)}>−</button>
        </span>
      </div>
    </>
  );
}

/** The drawer beside the Middle Sea: the chosen power's dispatch, or the sea's great powers. */
export function SeaFolio({ snapId, selected, onSelect }: { snapId: string; selected: string | null; onSelect: (t: string | null) => void }) {
  const w = useWorld(snapId);
  const i = snapshots.findIndex((s) => s.id === snapId);
  const prev = useWorld(i > 0 ? snapshots[i - 1].id : undefined);
  const tags = useTags();
  if (!w) return <p className="quiet">Reading the world at this checkpoint…</p>;
  if (selected) {
    const p = w.powers[selected];
    const subjOf = Object.entries(w.powers).find(([, q]) => q.subjects.some(([s]) => s === selected));
    return (
      <div className="sea-folio">
        <button type="button" className="close" onClick={() => onSelect(null)} aria-label="Close the dispatch">×</button>
        {p ? <Dispatch tag={selected} w={w} prev={prev} tags={tags} heading="h2" /> : (
          <div className="dispatch night">
            <h2 className="pn">{gameName(selected, w, tags)}</h2>
            <p className="quiet">{subjOf ? `A ${subjOf[1].subjects.find(([s]) => s === selected)?.[1] ?? "subject"} of ${powerName(subjOf[0], w, tags)}.` : "Not among the powers the dīwān follows, nor on the ladder of the world."}</p>
          </div>
        )}
        <p className="quiet small"><Link to={`/kingdoms?at=${snapId}#power-${selected}`}>All the kingdoms at this checkpoint</Link></p>
      </div>
    );
  }
  const shown = [...followed].filter((t) => w.powers[t] && !w.powers[t].overlord).sort((a, b) => (w.powers[a].rank ?? 999) - (w.powers[b].rank ?? 999));
  return (
    <div className="sea-folio">
      <h2>The Middle Sea</h2>
      <p className="quiet">The powers the dīwān follows, by their place in the world. Click one here or on the chart.</p>
      <ol className="sea-ladder">
        {shown.map((t) => (
          <li key={t} className={t === OURS ? "ours" : ""}>
            <button type="button" onClick={() => onSelect(t)}>
              <span className="rk">{w.powers[t].rank ?? "–"}</span>
              <i style={{ background: countryByTag.get(t)?.color }} />
              <span className="nm">{powerName(t, w, tags)}</span>
              <span className="pt">{w.powers[t].points ?? ""}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="quiet small">Ranks and points are the game's own. <Link to={`/kingdoms?at=${snapId}`}>The Kingdoms</Link> has the whole ladder.</p>
    </div>
  );
}
