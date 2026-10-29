import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  snapshots, places, personById, events, countries, countryByTag, countryName, isHeld, hijri, western,
  compact, nf, signed, EVENT_LABEL,
} from "../lib/data";
import type { Place } from "../lib/data";
import { gameMap, keyLabel, MAP_W, MAP_H } from "../lib/map";
import { CheckpointSelect } from "../components/bits";
import "./atlas.css";

/** Three ways to look: the realm close up, the Strait between its two shores, the whole western sea. */
const VIEWS = {
  realm: { label: "The realm", ar: "المملكة", box: [200, 345, 440, 275] },
  strait: { label: "The Strait", ar: "الزقاق", box: [70, 170, 800, 500] },
  west: { label: "The western sea", ar: "بحر المغرب", box: [0, 0, MAP_W, MAP_H] },
} as const;
type ViewId = keyof typeof VIEWS;

/** The seas, named as a Naṣrid geographer would. Positions are map pixels. */
const SEAS = [
  { ar: "البحر المحيط", tr: "al-Baḥr al-Muḥīṭ", x: 150, y: 600, size: 1.1 },
  { ar: "بحر الروم", tr: "Baḥr al-Rūm", x: 700, y: 430, size: 1.2 },
  { ar: "بحر الزقاق", tr: "Baḥr al-Zuqāq", x: 262, y: 506, size: 0.38 },
];
const ROSE = { x: 185, y: 470 };
const OURS = "GRA";

export default function Atlas() {
  const [i, setI] = useState(snapshots.length - 1);
  const [drawer, setDrawer] = useState(true);
  const [view, setView] = useState<ViewId>("strait");
  const snap = snapshots[i];
  const realms = gameMap.realms[snap.id] ?? {};
  const owners = gameMap.owners[snap.id] ?? {};
  const [vx, vy, vw, vh] = VIEWS[view].box;
  const k = vw / 800; // label scale: labels keep their size on screen whatever the view

  const network = useMemo(() => {
    // Portolan wind network: a central rose and sixteen satellites on a circle, 32 winds each.
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

  const locs = useMemo(() => Object.entries(gameMap.locations), []);
  const ruler = personById.get(snap.ruler);
  const heir = snap.heir ? personById.get(snap.heir) : undefined;
  const regent = snap.regent ? personById.get(snap.regent) : undefined;
  const h = hijri(snap.date);
  const prevDate = i > 0 ? snapshots[i - 1].date : "0000-00-00";
  const lately = events.filter((e) => e.date > prevDate && e.date <= snap.date).slice(-5).reverse();
  const held = places.filter((p) => isHeld(p, snap.date));
  // Close up, every place is named; further out, only the major ones (and every place of ours stays marked).
  const shown = view === "realm" ? places : places.filter((p) => p.major || isHeld(p, snap.date));
  const labels = useMemo(() => placeLabels(shown, snap.date, snap.capital, k, view === "realm" ? () => true : (p) => p.major),
    [snap.date, snap.capital, k, view]);
  // Each realm is named at the middle of its land that's in view, so the name is always on screen.
  const named = useMemo(() => {
    const inView = (x: number, y: number) => x > vx + vw * 0.08 && x < vx + vw * 0.92 && y > vy + vh * 0.1 && y < vy + vh * 0.9;
    const acc: Record<string, { x: number; y: number; n: number }> = {};
    for (const [key, tag] of Object.entries(owners)) {
      const l = gameMap.locations[key];
      if (!l || l.kind !== "land" || tag === OURS || !countryByTag.has(tag) || !inView(l.c[0], l.c[1])) continue;
      const a = (acc[tag] ??= { x: 0, y: 0, n: 0 }); a.x += l.c[0]; a.y += l.c[1]; a.n++;
    }
    return Object.entries(acc).filter(([, a]) => a.n >= 12).map(([tag, a]) => ({ c: countryByTag.get(tag)!, x: a.x / a.n, y: a.y / a.n, n: a.n }));
  }, [owners, vx, vy, vw, vh]);

  const shares = (rec: Record<string, number>) => {
    const total = Object.values(rec).reduce((a, b) => a + b, 0);
    return Object.entries(rec).sort((a, b) => b[1] - a[1]).map(([key, v]) => ({ key, pct: (v / total) * 100 }));
  };

  return (
    <div className="atlas">
      <svg className="chart" viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid slice" role="img"
        aria-label={`The game map at ${western(snap.date)}, with the realm's ${snap.locations} locations in gold`}>
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
          <clipPath id="land-clip"><path d={gameMap.coast} /></clipPath>
        </defs>

        <rect x={-400} y={-400} width={MAP_W + 800} height={MAP_H + 800} fill="url(#sea)" />
        <rect x={-400} y={-400} width={MAP_W + 800} height={MAP_H + 800} fill="url(#waves)" />
        <g className="winds">
          {network.map((l, n) => <line key={n} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className={`wind t${l.tier}`} />)}
        </g>

        <path d={gameMap.coast} className="coast-shadow" />
        <path d={gameMap.coast} className="land" filter="url(#paper)" />

        <g clipPath="url(#land-clip)">
          {/* every realm washed in its colour; ours in gold */}
          {Object.entries(realms).map(([tag, r]) => {
            const c = countryByTag.get(tag);
            return <path key={tag} d={r.d} className={`realm ${tag === OURS ? "ours" : ""}`} style={{ fill: c?.color ?? "#cbb894" }} />;
          })}
          {/* mountains and wastes in hachures, lakes in water */}
          {locs.filter(([, l]) => l.kind === "waste").map(([key, l]) => <path key={key} d={l.d} className="waste" />)}
          {locs.filter(([, l]) => l.kind === "lake").map(([key, l]) => <path key={key} d={l.d} className="lake" />)}
          {network.filter((l) => l.tier === 0).map((l, n) => <line key={n} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="wind-on-land" />)}
        </g>

        {/* every location, faintly, so the grain of the land shows; each names itself on hover */}
        <g className="locations">
          {locs.filter(([, l]) => l.kind === "land").map(([key, l]) => {
            const tag = owners[key];
            return (
              <path key={key} d={l.d} className={tag === OURS ? "loc ours" : "loc"}>
                <title>{`${keyLabel(key)}${tag ? `, ${countryName(tag)}` : ""}`}</title>
              </path>
            );
          })}
        </g>

        {Object.entries(realms).map(([tag, r]) => tag !== OURS && countryByTag.has(tag) && (
          <path key={tag} d={r.d} className="realm-edge" style={{ stroke: countryByTag.get(tag)!.color }} />
        ))}
        <path d={gameMap.coast} className="coast" />
        {realms[OURS] && <path d={realms[OURS].d} className="realm-edge ours" filter="url(#glow)" />}

        {named.map(({ c, x, y, n }) => {
          const size = Math.min(1.3, Math.max(0.6, Math.sqrt(n) / 9)) * k;
          return (
            <g key={c.tag} className="realm-label" transform={`translate(${x},${y})`} style={{ ["--rc" as any]: c.color }}>
              <text className="ar" fontSize={30 * size} textAnchor="middle" direction="ltr">{c.nameArabic}</text>
              <text className="tr" y={14 * size} fontSize={11 * size} textAnchor="middle">{c.nameChronicle}</text>
            </g>
          );
        })}

        {SEAS.map((s) => (
          <g key={s.tr} className="sea-label" transform={`translate(${s.x},${s.y})`}>
            <text className="ar" fontSize={26 * s.size * Math.max(0.6, k)} textAnchor="middle" direction="ltr">{s.ar}</text>
            <text className="tr" y={13 * s.size * Math.max(0.6, k)} fontSize={10 * s.size * Math.max(0.6, k)} textAnchor="middle">{s.tr}</text>
          </g>
        ))}

        <Rose x={ROSE.x} y={ROSE.y} r={46} />

        {labels.map(({ p, ours, capital, pos }) => (
          <Link key={p.id} to={`/places/${p.id}`} data-kind="place" data-id={p.id} className={`place ${ours ? "ours" : "theirs"}`}>
            <g transform={`translate(${p.x},${p.y})`}>
              <g transform={`scale(${k})`}>{ours ? <Tower big={capital} /> : <circle r={3.2} className="mark" />}</g>
              {pos && (
                <>
                  <text className="ar" x={pos.dx} y={pos.dy} fontSize={pos.fa} textAnchor={pos.anchor} direction="ltr">{p.nameArabic ?? ""}</text>
                  <text className="tr" x={pos.dx} y={pos.dy + pos.ft + 1} fontSize={pos.ft} textAnchor={pos.anchor}>{p.name}</text>
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

      <div className="views ui" role="group" aria-label="How far to look">
        {(Object.keys(VIEWS) as ViewId[]).map((v) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
            <span className="ar">{VIEWS[v].ar}</span>{VIEWS[v].label}
          </button>
        ))}
      </div>

      <button className="drawer-toggle ui" type="button" aria-expanded={drawer} aria-controls="realm-drawer" onClick={() => setDrawer(!drawer)}>
        {drawer ? "Hide the state of the realm" : "The state of the realm"}
      </button>
      {drawer && (
        <aside id="realm-drawer" className="drawer ui" aria-label="The state of the realm">
          <h2>The state of the realm</h2>
          <dl className="stats">
            <div><dt>Places held</dt><dd>{snap.locations}</dd></div>
            <div><dt>Souls</dt><dd>{compact(snap.population.total)}</dd></div>
            {snap.economy && <>
              <div><dt>Treasury</dt><dd>{nf.format(snap.economy.treasury)}<small> ducats</small></dd></div>
              <div><dt>Monthly balance</dt><dd>{signed(Math.round((snap.economy.income - snap.economy.expenses) * 10) / 10)}</dd></div>
            </>}
            {snap.military && <>
              <div><dt>Levies</dt><dd>{nf.format(snap.military.levies)}</dd></div>
              <div><dt>Regiments, ships</dt><dd>{snap.military.regiments}, {snap.military.ships}</dd></div>
            </>}
          </dl>
          {!snap.economy && <p className="quiet">The treasury, levies and estates aren't recorded at this checkpoint. The game settles them over its first few months.</p>}
          {snap.strait ? (
            <Link to="/strait" className="strait-mini">
              <span>The Strait</span>
              <span className="gauge" aria-label={`Influence ${signed(snap.strait.influence)}, towards ${snap.strait.influence < 0 ? "Castile" : "Morocco"}`}>
                <span className="zone" />
                <span className="pin" style={{ left: `${(snap.strait.influence + 100) / 2}%` }} />
              </span>
              <span className="ends"><span>Castile</span><span>Morocco</span></span>
              <span className="sov">Sovereignty {snap.strait.sovereignty}{snap.strait.sovereignty > 50 ? ", above 50" : ", short of 50"}</span>
            </Link>
          ) : <p className="quiet">The Battle for the Strait hasn't begun at this checkpoint.</p>}
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
        </aside>
      )}

      <div className="atlas-foot">
        {snapshots.length > 1 && <CheckpointSelect value={i} onChange={setI} />}
        <p className="caption ui">
          Drawn from the game's own map. Gold is the realm, and every other realm wears its own colour. Hover any location for its name.
        </p>
      </div>
    </div>
  );
}

type Box = { x0: number; y0: number; x1: number; y1: number };
type Pos = { dx: number; dy: number; anchor: "start" | "middle" | "end"; fa: number; ft: number };

/**
 * Greedy label placement in map units: the capital first, then the realm's places, then the rest.
 * Each label tries right, left, above and below its marker and takes the first free spot;
 * a label with no room is left off (the marker and its hover card still name it).
 * `k` scales labels with the view so they keep a steady size on screen.
 */
function placeLabels(list: Place[], date: string, capitalId: string, k: number, wantLabel: (p: Place) => boolean) {
  const items = list.map((p) => ({ p, ours: isHeld(p, date), capital: p.id === capitalId, pos: null as Pos | null }));
  const order = [...items].sort((a, b) => Number(b.capital) - Number(a.capital) || Number(b.ours) - Number(a.ours));
  const r = 5 * k;
  const placed: Box[] = items.map((it) => ({ x0: it.p.x - r, y0: it.p.y - r, x1: it.p.x + r, y1: it.p.y + r }));
  const hit = (b: Box) => placed.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
  for (const it of order) {
    if (!it.capital && !wantLabel(it.p)) continue;
    const fa = (it.capital ? 20 : it.ours ? 13 : 11.5) * k;
    const ft = (it.capital ? 9 : it.ours ? 7 : 6.5) * k;
    const w = Math.max((it.p.nameArabic ?? "").length * fa * 0.62, it.p.name.length * ft * 0.55);
    const hh = fa + ft + 2 * k;
    const g = 8 * k;
    const tries: Pos[] = it.capital ? [{ dx: 0, dy: -14 * k, anchor: "middle", fa, ft }] : [
      { dx: g, dy: -2 * k, anchor: "start", fa, ft },
      { dx: -g, dy: -2 * k, anchor: "end", fa, ft },
      { dx: 0, dy: -12 * k, anchor: "middle", fa, ft },
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
