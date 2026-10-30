import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { snapshots, countryByTag, hijri, western, year, yearFrac, arabicDigits } from "../lib/data";
import { PageHead, CheckpointSelect, StarRule } from "../components/bits";
import Dispatch from "../components/Dispatch";
import { world, followed, useWorld, useTags, powerName, gameName, subjectWord, ordinal } from "../lib/world";
import type { World } from "../lib/world";
import "./kingdoms.css";

const OURS = "GRA";

export default function Kingdoms() {
  const loc = useLocation();
  const at = new URLSearchParams(loc.search).get("at");
  const [i, setI] = useState(() => { const n = snapshots.findIndex((s) => s.id === at); return n >= 0 ? n : snapshots.length - 1; });
  const snap = snapshots[i];
  const w = useWorld(snap.id);
  const prev = useWorld(i > 0 ? snapshots[i - 1].id : undefined);
  const tags = useTags();
  const [sel, setSel] = useState<string>(OURS);
  const scrolled = useRef(false);
  useEffect(() => {
    // a link to one power's dispatch: scroll to it once the world has loaded
    const m = loc.hash.match(/^#power-([A-Z0-9]+)$/);
    if (!w || !m || scrolled.current) return;
    scrolled.current = true;
    setSel(m[1]);
    requestAnimationFrame(() => document.getElementById(`power-${m[1]}`)?.scrollIntoView({ block: "center" }));
  }, [w, loc.hash]);
  const h = hijri(snap.date);
  const selected = w?.powers[sel] ? sel : OURS;

  return (
    <div className="page kingdoms-page">
      <PageHead title="The Kingdoms" ar="الممالك"
        lede="The world as the dīwān reckons it: where Gharnāṭa stands among the powers, who rules them, and who is bound to whom. Ranks and points are the game's own ladder of the world." />

      <div className="k-when ui">
        <span className="ar">{h.arabic}</span> <span className="muted">{h.text} AH, {western(snap.date)}</span>
      </div>
      <CheckpointSelect value={i} onChange={setI} />

      {!w ? <p className="muted ui">Reading the world at this checkpoint…</p> : <>
        <section className="k-stage" aria-label="The circle of the world">
          <div className="k-circle-wrap">
            <WorldCircle w={w} sel={selected} onSel={setSel} />
            <ul className="k-key ui" aria-label="What the lines mean">
              <li><i className="ally" />Alliance</li>
              <li><i className="rival" />Rivalry</li>
              <li><i className="union" />One crown</li>
              <li><i className="over" />Overlord and subject</li>
            </ul>
            <p className="k-note ui">Each power sits on its circle in the direction of its capital from Gharnāṭa, and grows with the towns it and its subjects hold. Click one to read its dispatch.</p>
          </div>
          <div className="k-side">
            <Dispatch tag={selected} w={w} prev={prev} tags={tags} tone="parchment" heading="h2" />
            <p className="ui muted small"><a href={`${import.meta.env.BASE_URL}?view=sea`}>See them on the Middle Sea</a></p>
          </div>
        </section>

        <StarRule />
        <div className="k-pair">
          <Ladder w={w} prev={prev} tags={tags} onSel={(t) => { setSel(t); document.querySelector(".k-stage")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
          <Rise at={snap.id} />
        </div>

        <StarRule />
        {world.circles.map((c) => {
          const members = c.tags.filter((t) => w.powers[t] && (w.powers[t].locations > 0));
          if (!members.length) return null;
          return (
            <section key={c.id} className="k-circle-sec" aria-labelledby={`circle-${c.id}`}>
              <header className="k-circle-head">
                <h2 id={`circle-${c.id}`} className="section-title">{c.name}</h2>
                <span className="ar">{c.nameArabic}</span>
                <p className="muted">{c.note}</p>
              </header>
              <div className="k-dispatches">
                {members.map((t) => <Dispatch key={t} tag={t} w={w} prev={prev} tags={tags} tone="parchment" />)}
              </div>
            </section>
          );
        })}

        <StarRule />
        <div className="k-pair">
          <WarsAbroad w={w} tags={tags} />
          <Orders w={w} tags={tags} />
        </div>
        <p className="ui muted small k-source">From the save of {western(snap.date)} (tools/world_powers.py). Men under arms are regulars and raised levies on the map: in peacetime most powers stand their levies down, so this is readiness, not the most a power could raise.</p>
      </>}
    </div>
  );
}

/* ------------------------------------------------------------------ the circle of the world */

type Node = { tag: string; ring: number; a: number; r: number; x: number; y: number; subj: boolean };

function WorldCircle({ w, sel, onSel }: { w: World; sel: string; onSel: (t: string) => void }) {
  const [hot, setHot] = useState<string | null>(null);
  const R = [0, 140, 228, 312, 392];
  const home = world.capitals[OURS];
  const nodes = useMemo(() => {
    const list: Node[] = [];
    for (const c of world.circles) for (const t of c.tags) {
      const p = w.powers[t], cap = world.capitals[t];
      if (!p || !cap || p.locations === 0) continue;
      const a = Math.atan2(cap.x - home.x, -(cap.y - home.y)); // bearing: 0 is north, clockwise
      const towns = p.locations + p.subjectLocations;
      list.push({ tag: t, ring: c.ring, a, r: Math.min(30, Math.max(9, 4 + Math.sqrt(towns) * 1.35)), x: 0, y: 0, subj: !!p.overlord });
    }
    // spread each ring so no two powers overlap, keeping each as near its true bearing as it can
    for (const ring of [1, 2, 3, 4]) {
      const on = list.filter((n) => n.ring === ring).sort((p, q) => p.a - q.a);
      for (let pass = 0; pass < 200; pass++) {
        let moved = false;
        for (let k = 0; k < on.length; k++) {
          const p = on[k], q = on[(k + 1) % on.length];
          if (on.length < 2 || (k === on.length - 1 && on.length === 2)) continue;
          let gap = q.a - p.a; if (k === on.length - 1) gap += 2 * Math.PI;
          const need = Math.max(p.r + q.r + 16, 34) / R[ring];
          if (gap < need) { const d = (need - gap) / 2 + 0.002; p.a -= d; q.a += d; moved = true; }
        }
        if (!moved) break;
      }
      for (const n of on) { n.x = Math.sin(n.a) * R[ring]; n.y = -Math.cos(n.a) * R[ring]; }
    }
    return list;
  }, [w]);
  const at = new Map<string, Node>([[OURS, { tag: OURS, ring: 0, a: 0, r: 44, x: 0, y: 0, subj: false }], ...nodes.map((n) => [n.tag, n] as const)]);
  // the ties between the powers drawn here
  const edges = useMemo(() => {
    const out: { a: string; b: string; kind: "ally" | "rival" | "union" | "over"; both?: boolean }[] = [];
    const seen = new Set<string>();
    const add = (a: string, b: string, kind: "ally" | "rival" | "union" | "over", both = false) => {
      if (!at.has(a) || !at.has(b) || a === b) return;
      const key = kind === "over" ? `${kind}:${a}>${b}` : `${kind}:${[a, b].sort().join("-")}`;
      if (seen.has(key)) { if (kind === "rival") { const e = out.find((x) => x.kind === "rival" && ((x.a === b && x.b === a) || (x.a === a && x.b === b))); if (e) e.both = true; } return; }
      seen.add(key); out.push({ a, b, kind, both });
    };
    for (const u of w.unions) for (let m = 1; m < u.members.length; m++) add(u.members[0], u.members[m], "union");
    for (const [t, p] of Object.entries(w.powers)) {
      if (!at.has(t)) continue;
      for (const x of p.allies) add(t, x, "ally");
      for (const x of p.rivals) add(t, x, "rival");
      for (const [s] of p.subjects) add(t, s, "over");
    }
    return out;
  }, [w, nodes]);
  const focus = hot ?? sel;
  const touches = (e: { a: string; b: string }) => e.a === focus || e.b === focus;
  const path = (a: Node, b: Node) => {
    // bow each tie gently toward the centre, so ties don't run on top of each other
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return `M${a.x},${a.y} Q${mx * 0.55},${my * 0.55} ${b.x},${b.y}`;
  };
  return (
    <svg className="k-circle" viewBox="-560 -520 1120 1040" role="img" aria-label="The powers around Gharnāṭa, by direction and circle, with their alliances, rivalries, unions and subjects">
      <defs>
        {/* the lower half of each ring, west to east, so its name reads upright in the empty south-west */}
        {[1, 2, 3, 4].map((r) => <path key={r} id={`ring-${r}`} d={`M ${-R[r] - 6},0 A ${R[r] + 6},${R[r] + 6} 0 0,0 ${R[r] + 6},0`} />)}
      </defs>
      {Array.from({ length: 32 }, (_, n) => {
        const a = (n / 32) * 2 * Math.PI;
        return <line key={n} x1={0} y1={0} x2={Math.sin(a) * 480} y2={-Math.cos(a) * 480} className={`kw ${n % 8 === 0 ? "t0" : n % 4 === 0 ? "t1" : "t2"}`} />;
      })}
      {[1, 2, 3, 4].map((r) => <circle key={r} r={R[r]} className="k-ring" />)}
      {world.circles.filter((c, n, all) => all.findIndex((x) => x.ring === c.ring) === n).map((c) => {
        const names = world.circles.filter((x) => x.ring === c.ring);
        return (
          <text key={c.ring} className="k-ring-name">
            <textPath href={`#ring-${c.ring}`} startOffset="24%" textAnchor="middle">{names.map((x) => x.name).join(" and ")}</textPath>
          </text>
        );
      })}
      {["الشمال", "المشرق", "الجنوب", "المغرب"].map((l, n) => (
        <text key={l} className="k-cardinal ar" x={[0, 505, 0, -505][n]} y={[-488, 6, 500, 6][n]} textAnchor="middle" direction="ltr">{l}</text>
      ))}
      <g className="k-edges">
        {edges.map((e, n) => {
          const A = at.get(e.a)!, B = at.get(e.b)!;
          return <path key={n} d={path(A, B)} className={`k-edge ${e.kind} ${e.both ? "both" : ""} ${touches(e) ? "on" : "off"}`} />;
        })}
      </g>
      {nodes.map((n) => {
        const c = countryByTag.get(n.tag);
        const out = n.r + 12;
        const lx = Math.sin(n.a) * (R[n.ring] + out), ly = -Math.cos(n.a) * (R[n.ring] + out);
        const anchor = Math.abs(Math.sin(n.a)) < 0.25 ? "middle" : Math.sin(n.a) > 0 ? "start" : "end";
        const isOn = focus === n.tag || edges.some((e) => touches(e) && (e.a === n.tag || e.b === n.tag));
        return (
          <g key={n.tag} className={`k-node ${n.tag === sel ? "sel" : ""} ${isOn ? "on" : "dim"} ${n.subj ? "subj" : ""}`} tabIndex={0} role="button"
            aria-label={`${powerName(n.tag, w)}: read its dispatch`}
            onClick={() => onSel(n.tag)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSel(n.tag); } }}
            onPointerEnter={() => setHot(n.tag)} onPointerLeave={() => setHot(null)}>
            <circle cx={n.x} cy={n.y} r={n.r + 8} className="hit" />
            <circle cx={n.x} cy={n.y} r={n.r} style={{ fill: c?.color }} className="disc" />
            {c?.nameArabic && n.r >= 15 && <text x={n.x} y={n.y + n.r * 0.18} className="ar in" textAnchor="middle" fontSize={Math.min(15, n.r * 0.55)} direction="ltr">{c.nameArabic.replace(/^(بنو|طائفة) /, "")}</text>}
            <text x={lx} y={ly + 6} className="lbl" textAnchor={anchor}>{powerName(n.tag, w)}</text>
          </g>
        );
      })}
      <g className={`k-node home ${sel === OURS ? "sel" : ""}`} tabIndex={0} role="button" aria-label="Gharnāṭa: read its dispatch"
        onClick={() => onSel(OURS)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSel(OURS); } }}
        onPointerEnter={() => setHot(OURS)} onPointerLeave={() => setHot(null)}>
        <circle r={52} className="halo" />
        <circle r={44} className="disc" />
        <text y={9} className="ar" textAnchor="middle" direction="ltr">غرناطة</text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ the ladder */

function Ladder({ w, prev, tags, onSel }: { w: World; prev: World | null; tags: Record<string, { name: string }> | null; onSel: (t: string) => void }) {
  const max = Math.max(...w.ladder.map((r) => r[2]));
  const firstRegional = Math.min(...w.ladder.filter((r) => r[3]).map((r) => r[1]), 999);
  const lastGreat = Math.max(...w.ladder.filter((r) => !r[3] && r[1] < firstRegional).map((r) => r[1]), 0);
  const prevRank = new Map(prev?.ladder.map((r) => [r[0], r[1]]) ?? []);
  const ours = w.powers[OURS];
  return (
    <section className="k-ladder" aria-labelledby="ladder-h">
      <h2 id="ladder-h" className="section-title">The ladder of the world</h2>
      <p className="muted ui small">{ours?.rank ? `Gharnāṭa stands ${ordinal(ours.rank)}, with ${ours.points} points; the last of the Great Powers has ${w.ladder.find((r) => r[1] === lastGreat)?.[2]}.` : ours?.overlord ? `Gharnāṭa has no place on the ladder: the game ranks only sovereign powers, and it is a ${subjectWord(ours.overlord[1])} of ${powerName(ours.overlord[0], w)}.` : ""}</p>
      <ol className="rungs ui">
        {w.ladder.map(([t, rank, pts, regional]) => {
          const pr = prevRank.get(t);
          const mine = followed.has(t);
          return (
            <li key={t} className={`${t === OURS ? "ours" : ""} ${mine ? "mine" : ""} ${rank === lastGreat ? "last-great" : ""}`}>
              <span className="rk">{rank}</span>
              {mine ? <button type="button" className="nm" onClick={() => onSel(t)}>{powerName(t, w, tags)}</button> : <span className="nm">{gameName(t, w, tags)}</span>}
              <span className="bar"><i style={{ width: `${(pts / max) * 100}%`, background: mine ? countryByTag.get(t)?.color : undefined }} /></span>
              <span className="pt">{pts}</span>
              <span className="kind">{regional ? "Regional" : rank < firstRegional ? "Great" : ""}{pr && pr !== rank ? <small className={pr > rank ? "up" : "down"}>{pr > rank ? "▲" : "▼"}{Math.abs(pr - rank)}</small> : null}</span>
            </li>
          );
        })}
      </ol>
      <p className="muted ui small">The gilt rule marks the last of the Great Powers. ▲▼ show the change since the previous checkpoint.</p>
    </section>
  );
}

/* ------------------------------------------------------------------ the rise of Gharnāṭa */

/** Validated for the night panel (dataviz validate_palette.js, all pairs): Granada, Portugal, Castile, Morocco. */
const SERIES = [
  { tag: "GRA", color: "#b88d30", width: 3 },
  { tag: "POR", color: "#4a7fd0", width: 2 },
  { tag: "CAS", color: "#c23b2c", width: 2 },
  { tag: "MOR", color: "#2fa07a", width: 2 },
];

function Rise({ at }: { at: string }) {
  const S = world.series;
  const Wd = 640, Ht = 340, m = { l: 34, r: 92, t: 16, b: 30 };
  const x = scaleLinear().domain([yearFrac(S[0].date), yearFrac(S[S.length - 1].date)]).range([m.l, Wd - m.r]);
  const ymax = Math.max(90, ...S.flatMap((r) => SERIES.map((s) => r.powers[s.tag]?.[1] ?? 0)));
  const y = scaleLinear().domain([0, ymax]).nice().range([Ht - m.b, m.t]);
  const [hov, setHov] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pts = (tag: string) => S.map((r) => ({ x: x(yearFrac(r.date)), v: r.powers[tag]?.[1] ?? null }));
  const mk = line<{ x: number; v: number | null }>().defined((d) => d.v != null).x((d) => d.x).y((d) => y(d.v!));
  // the years Granada was a subject: no place on the ladder
  const spans: [number, number][] = [];
  S.forEach((r, n) => {
    if (!r.powers[OURS]?.[5]) return;
    const a = n > 0 ? (x(yearFrac(S[n - 1].date)) + x(yearFrac(r.date))) / 2 : x(yearFrac(r.date));
    const b = n < S.length - 1 ? (x(yearFrac(r.date)) + x(yearFrac(S[n + 1].date))) / 2 : x(yearFrac(r.date));
    if (spans.length && Math.abs(spans[spans.length - 1][1] - a) < 0.5) spans[spans.length - 1][1] = b; else spans.push([a, b]);
  });
  // direct labels at each line's last point, nudged apart
  const ends = SERIES.map((s) => {
    const last = [...S].reverse().find((r) => r.powers[s.tag]?.[1] != null);
    return { s, y: last ? y(last.powers[s.tag]![1]!) : 0, v: last?.powers[s.tag]?.[1] };
  }).sort((a, b) => a.y - b.y);
  for (let n = 1; n < ends.length; n++) if (ends[n].y - ends[n - 1].y < 14) ends[n].y = ends[n - 1].y + 14;
  const great = line<{ x: number; v: number | null }>().defined((d) => d.v != null).x((d) => d.x).y((d) => y(d.v!))(S.map((r) => ({ x: x(yearFrac(r.date)), v: r.greatLine })));
  const cur = S.findIndex((r) => r.id === at);
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current!; const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    let best = 0; S.forEach((r, n) => { if (Math.abs(x(yearFrac(r.date)) - p.x) < Math.abs(x(yearFrac(S[best].date)) - p.x)) best = n; });
    setHov(best);
  };
  const row = hov != null ? S[hov] : null;
  return (
    <section className="k-rise" aria-labelledby="rise-h">
      <h2 id="rise-h" className="section-title">The rise of Gharnāṭa</h2>
      <p className="muted ui small">Points on the game's ladder at every checkpoint. Granada has points only in the years it was sovereign; the shaded years it was a tributary. The dashed line is the last of the Great Powers.</p>
      <ul className="k-legend ui" aria-label="Series">
        {SERIES.map((s) => <li key={s.tag}><i style={{ background: s.color, height: s.width + 1 }} />{powerName(s.tag)}</li>)}
        <li><i className="dash" />The last Great Power</li>
      </ul>
      <div className="k-chart">
        <svg ref={svgRef} viewBox={`0 0 ${Wd} ${Ht}`} role="img" aria-label="Great-power points of Granada, Portugal, Castile and Morocco at every checkpoint"
          onPointerMove={onMove} onPointerLeave={() => setHov(null)}>
          {spans.map(([a, b], n) => <rect key={n} x={a} y={m.t} width={Math.max(1, b - a)} height={Ht - m.t - m.b} className="subject-span" />)}
          {spans.length > 0 && <text x={spans[0][0] + 6} y={m.t + 14} className="span-label">a tributary</text>}
          {y.ticks(5).map((t) => (
            <g key={t}>
              <line x1={m.l} x2={Wd - m.r} y1={y(t)} y2={y(t)} className="grid" />
              <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="tick">{t}</text>
            </g>
          ))}
          {x.ticks(6).map((t) => <text key={t} x={x(t)} y={Ht - m.b + 18} textAnchor="middle" className="tick">{Math.round(t)}</text>)}
          <line x1={m.l} x2={Wd - m.r} y1={Ht - m.b} y2={Ht - m.b} className="axis" />
          {great && <path d={great} className="great" />}
          {cur >= 0 && <line x1={x(yearFrac(S[cur].date))} x2={x(yearFrac(S[cur].date))} y1={m.t} y2={Ht - m.b} className="now" />}
          {SERIES.map((s) => <path key={s.tag} d={mk(pts(s.tag)) ?? ""} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinejoin="round" strokeLinecap="round" />)}
          {/* Granada's points are few and broken by its years as a tributary: mark each one */}
          {pts(OURS).map((d, n) => d.v != null && <circle key={n} cx={d.x} cy={y(d.v)} r={4} fill={SERIES[0].color} className="dot" />)}
          {ends.map(({ s, y: ly, v }) => v != null && <text key={s.tag} x={Wd - m.r + 8} y={ly + 4} className="end">{powerName(s.tag)} {v}</text>)}
          {row && <>
            <line x1={x(yearFrac(row.date))} x2={x(yearFrac(row.date))} y1={m.t} y2={Ht - m.b} className="cross" />
            {SERIES.map((s) => row.powers[s.tag]?.[1] != null && <circle key={s.tag} cx={x(yearFrac(row.date))} cy={y(row.powers[s.tag]![1]!)} r={4.5} fill={s.color} className="dot" />)}
          </>}
        </svg>
        {row && (
          <div className="k-tip ui" style={{ left: `${(x(yearFrac(row.date)) / Wd) * 100}%` }} role="tooltip">
            <div className="d">{western(row.date)} <span className="ar">{arabicDigits(hijri(row.date).y)}</span></div>
            {SERIES.map((s) => {
              const v = row.powers[s.tag];
              return <div key={s.tag}><i style={{ background: s.color }} />{powerName(s.tag)}: {v?.[1] != null ? `${v[1]} points, ${ordinal(v[0]!)}` : v?.[5] ? `a tributary of ${powerName(v[5])}` : "unranked"}</div>;
            })}
            {row.greatLine != null && <div className="g">Last Great Power: {row.greatLine}</div>}
          </div>
        )}
      </div>
      <details className="numbers">
        <summary>The numbers</summary>
        <table className="ledger">
          <thead><tr><th>Checkpoint</th>{SERIES.map((s) => <th key={s.tag} className="num">{powerName(s.tag)}</th>)}<th className="num">Last Great Power</th></tr></thead>
          <tbody>{S.map((r) => (
            <tr key={r.id}><td>{western(r.date)}</td>{SERIES.map((s) => { const v = r.powers[s.tag]; return <td key={s.tag} className="num">{v?.[1] != null ? `${v[1]} (${ordinal(v[0]!)})` : v?.[5] ? "subject" : "—"}</td>; })}<td className="num">{r.greatLine ?? "—"}</td></tr>
          ))}</tbody>
        </table>
      </details>
    </section>
  );
}

/* ------------------------------------------------------------------ beyond the circles */

function WarsAbroad({ w, tags }: { w: World; tags: Record<string, { name: string }> | null }) {
  const name = (t: string) => (followed.has(t) ? powerName(t, w, tags) : gameName(t, w, tags));
  return (
    <section aria-labelledby="wars-h">
      <h2 id="wars-h" className="section-title">Wars beyond the realm</h2>
      {w.wars.length === 0 ? <p className="muted">The powers the dīwān follows are all at peace.</p> : (
        <ul className="k-wars ui">
          {w.wars.map((x, n) => (
            <li key={n}>
              <span className="t">{x.started ? `Since ${western(x.started)}` : ""}{x.revolt ? ", a revolt" : ""}</span>
              <span className="sides"><b>{x.attacker ? name(x.attacker) : "?"}</b>{x.attackers.length > 1 ? ` and ${x.attackers.length - 1} with them` : ""} <em>against</em> <b>{x.defender ? name(x.defender) : "?"}</b>{x.defenders.length > 1 ? ` and ${x.defenders.length - 1} with them` : ""}</span>
              {x.score != null && <span className="t">War score {x.score > 0 ? "+" : ""}{x.score} to the attackers</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Orders({ w, tags }: { w: World; tags: Record<string, { name: string }> | null }) {
  const o = w.orders;
  const name = (t: string | null | undefined) => (t ? (followed.has(t) ? powerName(t, w, tags) : gameName(t, w, tags)) : "no one");
  const ruler = (t: string | undefined) => (t && w.powers[t]?.ruler?.name) || null;
  return (
    <section aria-labelledby="orders-h">
      <h2 id="orders-h" className="section-title">The orders of Christendom</h2>
      <dl className="k-orders ui">
        {o.emperor && <div><dt>The Emperor</dt><dd>{ruler(o.emperor) ? `${ruler(o.emperor)} of ` : ""}{name(o.emperor)}, over {o.empireMembers} members of the Empire</dd></div>}
        {o.pope && <div><dt>The Pope</dt><dd>{ruler(o.pope) ?? "The Pope"}, at {w.powers[o.pope]?.capital ? title(w.powers[o.pope].capital!) : "Rome"}</dd></div>}
        {o.guelphs && <div><dt>The Guelphs</dt><dd>led by {name(o.guelphs.leader)}, {o.guelphs.count} members{o.guelphs.members.length ? `, among them ${o.guelphs.members.filter((t) => t !== o.guelphs!.leader).map(name).join(", ")}` : ""}</dd></div>}
        {o.ghibellines && <div><dt>The Ghibellines</dt><dd>led by {name(o.ghibellines.leader)}, {o.ghibellines.count} members{o.ghibellines.members.length ? `, among them ${o.ghibellines.members.filter((t) => t !== o.ghibellines!.leader).map(name).join(", ")}` : ""}</dd></div>}
      </dl>
      <h3 className="k-sub">Crowns joined</h3>
      <ul className="k-unions ui">
        {w.unions.map((u, n) => <li key={n}>{u.members.map(name).join(" and ")}{u.kind === "marriage_union" ? ", joined by marriage" : ""}{u.since ? `, since ${year(u.since)}` : ""}</li>)}
      </ul>
    </section>
  );
}
const title = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
