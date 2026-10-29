import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { Link } from "react-router-dom";
import land from "../generated/land.json";
import {
  snapshots, places, personById, placeById, events, isHeld, hijri, western, arabicDigits,
  compact, nf, signed, EVENT_LABEL,
} from "../lib/data";
import { CheckpointSelect } from "../components/bits";
import "./atlas.css";

const W = 1600, H = 1000;
// The frame: from the Atlantic coast of Portugal to Valencia, from the Meseta to the Middle Atlas.
const FRAME = { type: "Feature", geometry: { type: "MultiPoint", coordinates: [[-10.6, 40.4], [3.4, 32.4]] } } as any;

/** Decorative names on the chart, as a Nasrid geographer would have written them. */
const LABELS = [
  { ar: "قشتالة", lat: "Qashtāla", lon: -4.2, la: 39.5, size: 1.4, on: "land" },
  { ar: "أرغون", lat: "Arghūn", lon: 0.4, la: 39.45, size: 1.0, on: "land" },
  { ar: "برتغال", lat: "Burtuqāl", lon: -8.1, la: 38.4, size: 0.9, on: "land" },
  { ar: "بنو مرين", lat: "Banū Marīn", lon: -6.3, la: 34.0, size: 1.4, on: "land" },
  { ar: "بنو عبد الواد", lat: "Banū ʿAbd al-Wād", lon: -0.4, la: 34.35, size: 0.9, on: "land" },
  { ar: "البحر المحيط", lat: "al-Baḥr al-Muḥīṭ", lon: -8.4, la: 35.0, size: 1.15, on: "sea" },
  { ar: "بحر الروم", lat: "Baḥr al-Rūm", lon: -1.2, la: 36.45, size: 1.15, on: "sea" },
  { ar: "بحر الزقاق", lat: "Baḥr al-Zuqāq", lon: -6.75, la: 35.7, size: 0.65, on: "sea" },
];

const ROSE = { lon: -3.3, lat: 35.85 };

export default function Atlas() {
  const [i, setI] = useState(snapshots.length - 1);
  const [drawer, setDrawer] = useState(true);
  const snap = snapshots[i];

  const { path, proj, rose, network } = useMemo(() => {
    const proj = geoMercator().fitExtent([[0, 0], [W, H]], FRAME);
    const path = geoPath(proj);
    const rose = proj([ROSE.lon, ROSE.lat])!;
    // Portolan wind network: a central rose and sixteen satellites on a circle, 32 winds each.
    const R = 520;
    const centres = [rose, ...Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * 2 * Math.PI;
      return [rose[0] + R * Math.cos(a), rose[1] + R * Math.sin(a)];
    })];
    const network: { x1: number; y1: number; x2: number; y2: number; tier: number }[] = [];
    centres.forEach(([cx, cy], c) => {
      for (let w = 0; w < 32; w++) {
        const a = (w / 32) * 2 * Math.PI;
        const len = c === 0 ? 1900 : 1100;
        const tier = w % 4 === 0 ? (w % 8 === 0 ? 0 : 1) : 2;
        network.push({ x1: cx, y1: cy, x2: cx + len * Math.cos(a), y2: cy + len * Math.sin(a), tier });
      }
    });
    return { path, proj, rose, network };
  }, []);

  const landPath = useMemo(() => path(land as any) ?? "", [path]);
  const ruler = personById.get(snap.ruler);
  const heir = snap.heir ? personById.get(snap.heir) : undefined;
  const regent = snap.regent ? personById.get(snap.regent) : undefined;
  const h = hijri(snap.date);
  const prevDate = i > 0 ? snapshots[i - 1].date : "0000-00-00";
  const lately = events.filter((e) => e.date > prevDate && e.date <= snap.date).slice(-5).reverse();
  const shown = places.filter((p) => p.lat != null && p.lon != null);
  const held = shown.filter((p) => isHeld(p, snap.date));
  const labels = useMemo(() => placeLabels(shown, snap.date, snap.capital, proj), [snap.date, snap.capital, proj]);

  const shares = (rec: Record<string, number>) => {
    const total = Object.values(rec).reduce((a, b) => a + b, 0);
    return Object.entries(rec).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ k, pct: (v / total) * 100 }));
  };

  return (
    <div className="atlas">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img"
        aria-label={`Chart of the western sea at ${western(snap.date)}, with ${held.length} of the realm's places marked in gold`}>
        <defs>
          <radialGradient id="sea" cx="45%" cy="55%" r="75%">
            <stop offset="0" stopColor="#1d2b5c" />
            <stop offset="1" stopColor="#0b1128" />
          </radialGradient>
          <pattern id="waves" width="46" height="22" patternUnits="userSpaceOnUse">
            <path d="M0 11 q 11.5 -7 23 0 t 23 0" fill="none" stroke="#d4ab55" strokeOpacity="0.07" strokeWidth="1" />
          </pattern>
          <filter id="paper" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.18  0 0 0 0.16 0" result="grain" />
            <feComposite in="grain" in2="SourceGraphic" operator="in" result="g" />
            <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g" /></feMerge>
          </filter>
          <radialGradient id="realm-glow">
            <stop offset="0" stopColor="#f2d58e" stopOpacity="0.55" />
            <stop offset="1" stopColor="#f2d58e" stopOpacity="0" />
          </radialGradient>
          <clipPath id="land-clip"><path d={landPath} /></clipPath>
        </defs>

        <rect width={W} height={H} fill="url(#sea)" />
        <rect width={W} height={H} fill="url(#waves)" />

        <g className="winds">
          {network.map((l, k) => (
            <line key={k} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className={`wind t${l.tier}`} />
          ))}
        </g>

        <path d={landPath} className="coast-shadow" />
        <path d={landPath} className="land" filter="url(#paper)" />
        <g clipPath="url(#land-clip)">
          {held.map((p) => {
            const [x, y] = proj([p.lon!, p.lat!])!;
            return <circle key={p.id} cx={x} cy={y} r={95} fill="url(#realm-glow)" />;
          })}
          {network.filter((l) => l.tier === 0).map((l, k) => (
            <line key={k} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="wind-on-land" />
          ))}
        </g>
        <path d={landPath} className="coast" />

        {LABELS.map((l) => {
          const [x, y] = proj([l.lon, l.la])!;
          return (
            <g key={l.lat} className={`region-label on-${l.on}`} transform={`translate(${x},${y})`}>
              <text className="ar" fontSize={46 * l.size} textAnchor="middle">{l.ar}</text>
              <text className="tr" y={26 * l.size} fontSize={17 * l.size} textAnchor="middle">{l.lat}</text>
            </g>
          );
        })}

        <Rose x={rose[0]} y={rose[1]} />

        {labels.map(({ p, x, y, ours, capital, pos }) => (
          <Link key={p.id} to={`/places/${p.id}`} data-kind="place" data-id={p.id} className={`place ${ours ? "ours" : "theirs"}`}>
            <g transform={`translate(${x},${y})`}>
              {ours ? <Tower big={capital} /> : <circle r={5.5} className="mark" />}
              {pos && (
                <>
                  <text className="ar" x={pos.dx} y={pos.dy} fontSize={pos.fa} textAnchor={pos.anchor} direction="ltr">{p.nameArabic}</text>
                  <text className="tr" x={pos.dx} y={pos.dy + pos.ft + 2} fontSize={pos.ft} textAnchor={pos.anchor}>{p.name}</text>
                </>
              )}
            </g>
          </Link>
        ))}
      </svg>

      <section className="medallion" aria-label="The sovereign">
        <div className="frame">
          <div className="sovereign ar">{ruler?.nameArabic ?? ruler?.name}</div>
          <div className="latin-name">
            <Link to={`/people/${snap.ruler}`} className="entity" data-kind="person" data-id={snap.ruler} data-router="1">{ruler?.name}</Link>
          </div>
          <div className="title">Sultan of Gharnāṭa{snap.overlord ? `, tributary of ${snap.overlord.country}` : ""}</div>
          <div className="date">
            <span className="ar day">{h.arabic}</span>
            <span className="wdate">{h.text} AH · {western(snap.date)}</span>
          </div>
          {(regent || heir) && (
            <div className="line">
              {regent && <>Regent: <Link to={`/people/${regent.id}`} className="entity" data-kind="person" data-id={regent.id} data-router="1">{regent.name}</Link>. </>}
              {heir && <>Heir: <Link to={`/people/${heir.id}`} className="entity" data-kind="person" data-id={heir.id} data-router="1">{heir.name}</Link>.</>}
            </div>
          )}
        </div>
      </section>

      <button className="drawer-toggle ui" type="button" aria-expanded={drawer} aria-controls="realm-drawer" onClick={() => setDrawer(!drawer)}>
        {drawer ? "Hide the state of the realm" : "The state of the realm"}
      </button>
      {drawer && (
        <aside id="realm-drawer" className="drawer ui" aria-label="The state of the realm">
          <h2>The state of the realm</h2>
          <dl className="stats">
            <div><dt>Places held</dt><dd>{snap.locations}</dd></div>
            <div><dt>Souls</dt><dd>{compact(snap.population.total)}</dd></div>
            <div><dt>Treasury</dt><dd>{nf.format(snap.economy.treasury)}<small> ducats</small></dd></div>
            <div><dt>Monthly balance</dt><dd>{signed(Math.round((snap.economy.income - snap.economy.expenses) * 10) / 10)}</dd></div>
            <div><dt>Levies</dt><dd>{nf.format(snap.military.levies)}</dd></div>
            <div><dt>Regiments, ships</dt><dd>{snap.military.regiments}, {snap.military.ships}</dd></div>
          </dl>
          {snap.strait && (
            <Link to="/strait" className="strait-mini">
              <span>The Strait</span>
              <span className="gauge" aria-label={`Influence ${signed(snap.strait.influence)}, towards ${snap.strait.influence < 0 ? "Castile" : "Morocco"}`}>
                <span className="zone" />
                <span className="pin" style={{ left: `${(snap.strait.influence + 100) / 2}%` }} />
              </span>
              <span className="ends"><span>Castile</span><span>Morocco</span></span>
              <span className="sov">Sovereignty {snap.strait.sovereignty}{snap.strait.sovereignty > 50 ? ", above 50" : ", short of 50"}</span>
            </Link>
          )}
          <h3>The people</h3>
          {shares(snap.population.cultures).map((r) => (
            <div className="share" key={r.k}><span>{r.k}</span><span className="bar"><i style={{ width: `${r.pct}%` }} /></span><span className="num">{r.pct.toFixed(0)}%</span></div>
          ))}
          <h3>Since the last checkpoint</h3>
          {lately.length ? (
            <ul className="lately">
              {lately.map((e) => <li key={e.id}><span className="t">{EVENT_LABEL[e.type]}</span>{e.title}</li>)}
            </ul>
          ) : <p className="quiet">Nothing logged.</p>}
        </aside>
      )}

      <div className="atlas-foot">
        <CheckpointSelect value={i} onChange={setI} />
        <p className="caption ui">
          Coasts from Natural Earth. Gold towers are the realm's places at this checkpoint; the true borders will be
          drawn from the game's own map once it's read from the gaming PC.
        </p>
      </div>
    </div>
  );
}

type Box = { x0: number; y0: number; x1: number; y1: number };
type Pos = { dx: number; dy: number; anchor: "start" | "middle" | "end"; fa: number; ft: number };

/**
 * Greedy label placement: the capital first, then the realm's places, then the rest.
 * Each label tries right, left, above and below its marker and takes the first spot
 * that overlaps nothing already placed; a label with no free spot is left off
 * (the marker and its hover card still name it).
 */
function placeLabels(list: typeof places, date: string, capitalId: string, proj: (c: [number, number]) => [number, number] | null) {
  const items = list.map((p) => {
    const [x, y] = proj([p.lon!, p.lat!])!;
    const ours = isHeld(p, date);
    const capital = p.id === capitalId;
    return { p, x, y, ours, capital, pos: null as Pos | null };
  });
  const order = [...items].sort((a, b) => Number(b.capital) - Number(a.capital) || Number(b.ours) - Number(a.ours));
  const placed: Box[] = items.map((it) => ({ x0: it.x - 9, y0: it.y - 10, x1: it.x + 9, y1: it.y + 9 }));
  const hit = (b: Box) => placed.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
  for (const it of order) {
    const fa = it.capital ? 40 : it.ours ? 27 : 23;
    const ft = it.capital ? 18 : it.ours ? 15 : 13.5;
    const w = Math.max((it.p.nameArabic ?? "").length * fa * 0.5, it.p.name.length * ft * 0.52);
    const h = fa + ft + 4;
    const tries: Pos[] = it.capital ? [{ dx: 0, dy: -30, anchor: "middle", fa, ft }] : [
      { dx: 15, dy: -4, anchor: "start", fa, ft },
      { dx: -15, dy: -4, anchor: "end", fa, ft },
      { dx: 0, dy: -24, anchor: "middle", fa, ft },
      { dx: 0, dy: fa + 6, anchor: "middle", fa, ft },
    ];
    for (const t of tries) {
      const left = t.anchor === "start" ? it.x + t.dx : t.anchor === "end" ? it.x + t.dx - w : it.x - w / 2;
      const box = { x0: left - 3, y0: it.y + t.dy - fa * 0.8, x1: left + w + 3, y1: it.y + t.dy - fa * 0.8 + h };
      // The capital is always named: it takes its first choice even if crowded.
      if (!hit(box) || it.capital) { it.pos = t; placed.push(box); break; }
    }
  }
  return items;
}

function Tower({ big }: { big: boolean }) {
  const s = big ? 1.5 : 1;
  return (
    <g transform={`scale(${s})`} className="tower">
      <path d="M-7 8 V-4 H-5 V-7 H-2.5 V-4 H-1 V-8 H1 V-4 H2.5 V-7 H5 V-4 H7 V8 Z" />
      <path d="M-2 8 V3 A2 2 0 0 1 2 3 V8" className="door" />
    </g>
  );
}

/** A 32-point compass rose in the manner of the Majorcan charts. */
function Rose({ x, y }: { x: number; y: number }) {
  const pts = (n: number, r1: number, r2: number, rot = 0) =>
    Array.from({ length: n * 2 }, (_, k) => {
      const a = rot + (k * Math.PI) / n - Math.PI / 2;
      const r = k % 2 === 0 ? r1 : r2;
      return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  return (
    <g className="rose" transform={`translate(${x},${y})`} aria-hidden="true">
      <circle r={92} className="ring" />
      <circle r={86} className="ring thin" />
      <polygon points={pts(16, 78, 30, Math.PI / 16)} className="p16" />
      <polygon points={pts(8, 84, 26, Math.PI / 8)} className="p8b" />
      <polygon points={pts(4, 96, 22)} className="p4" />
      <circle r={9} className="hub" />
      <text y={-104} textAnchor="middle" className="north ar">ش</text>
    </g>
  );
}
