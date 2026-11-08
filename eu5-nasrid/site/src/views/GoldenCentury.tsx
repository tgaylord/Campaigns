import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { scaleLinear } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import { events, snapshots, hijri, western, year, yearFrac, rulerAt, estateColor, estateMood, ESTATE_ORDER, ESTATE_WORD } from "../lib/data";
import type { Snapshot } from "../lib/data";
import { PageHead, CheckpointSelect, StarRule } from "../components/bits";
import { useRealmSeries, useCheckpointParam, nameOf, sum } from "../lib/realm";
import type { RealmAt } from "../lib/realm";
import "./world.css";
import "./golden.css";

/*
 * The Golden Century: is al-Andalus becoming the sea power its Emperor wants, and what does that cost at home?
 * Read from the realm's extras at each checkpoint (tools/realm_extras.py) and the checkpoint snapshots.
 */

const GC_EVENT = "1442-08-07-the-golden-century";
const THALASSOCRACY = "1442-08-07-establish-a-thalassocracy";
const THAL_YEARS = 20;
/** the Thalassocracy's push toward the sea: +0.50 a month on Land vs Naval (its decision text) */
const THAL_PUSH = 0.5;
const NAVAL = "land_vs_naval";
/** moments on the turn to the sea, by event id, with a short label */
const MOMENTS: [string, string][] = [
  ["1432-05-the-dar-al-sinaa", "Seven arsenals ordered"],
  ["1435-10-10-the-turn-to-the-sea", "Arsenals finished"],
  ["1438-01-16-the-admiral-prince", "The admiral prince"],
  ["1442-06-01-privileges-for-the-burghers", "Shipwright contracts"],
];

const fmt = (n: number, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString("en-GB");
const delta = (n: number, d = 1) => (Math.abs(n) < 0.05 ? "no change" : `${n > 0 ? "+" : "−"}${fmt(Math.abs(n), d)}`);

/** The reading at or before a checkpoint, and the one before it. */
function readingAt(series: RealmAt[], id: string) {
  let n = -1;
  for (let j = 0; j < series.length; j++) if (series[j].checkpoint <= id) n = j;
  return { now: series[n], prev: n > 0 ? series[n - 1] : undefined, n };
}

export default function GoldenCentury() {
  const [i, setI] = useCheckpointParam();
  const snap = snapshots[i];
  const rs = useRealmSeries();
  const series = rs?.series ?? [];
  const names = rs?.names;
  const { now, prev } = series.length ? readingAt(series, snap.id) : { now: undefined, prev: undefined };
  const gc = events.find((e) => e.id === GC_EVENT);
  const thal = events.find((e) => e.id === THALASSOCRACY);
  const lastKnown = events.reduce((m, e) => (e.date > m ? e.date : m), snapshots[snapshots.length - 1].date);
  const ruler = rulerAt(snap.date);
  const reignFrom = ruler?.reigns.find((r) => r.from <= snap.date && (!r.to || r.to >= snap.date))?.from;
  const base = reignFrom ? series.find((r) => r.checkpoint >= reignFrom) : undefined;

  if (!rs) return <div className="page loading ui" role="status">Opening the registers of the age…</div>;
  if (!now) return <div className="page"><PageHead title="The Golden Century" ar="القرن الذهبي" /><p className="muted">No reading of the realm at this checkpoint.</p></div>;

  const sv = now.societalValues[NAVAL] ?? 0, svBase = base?.societalValues[NAVAL];
  const ships = sum(now.fleet);
  const snapOf = (id: string) => snapshots.find((s) => s.id === id);
  const estatesNow = (snapOf(now.checkpoint) ?? snap).estates.filter((e) => e.satisfaction !== null && e.id !== "crown");
  const content = estatesNow.filter((e) => estateMood(e.satisfaction).cls === "content");
  const least = [...estatesNow].sort((a, b) => (a.satisfaction ?? 0) - (b.satisfaction ?? 0))[0];
  const h = hijri(snap.date);

  return (
    <div className="page gc-page">
      <PageHead title="The Golden Century" ar="القرن الذهبي"
        lede={<>
          {ruler && svBase !== undefined && base && base.checkpoint !== now.checkpoint
            ? <>Under the Emperor {ruler.name} the realm's temper has swung from {svBase < 0 ? "the land" : "the sea"} ({svBase > 0 ? "+" : "−"}{fmt(Math.abs(svBase))}) to {sv < 0 ? "the land" : "the sea"} ({sv > 0 ? "+" : "−"}{fmt(Math.abs(sv))}). </>
            : null}
          The fleet stands at {ships} ships and the crown holds {now.abroad.length} footholds abroad.
          {" "}At home {content.length === 0 ? "no estate is content" : content.length === 1 ? `only the ${ESTATE_WORD[content[0].id] ?? content[0].name} are content` : `${content.length} estates are content`}
          {least ? `, and the ${ESTATE_WORD[least.id] ?? least.name} least of all (${least.satisfaction})` : ""}.
        </>} />

      <div className="w-when ui">
        <span className="ar">{h.arabic}</span> <span className="muted">{h.text} AH, {western(snap.date)}</span>
        {now.checkpoint !== snap.id && <span className="gc-prov" title="This checkpoint has no reading of its own; the last one before it is shown">read at {western(now.checkpoint)}</span>}
      </div>
      <CheckpointSelect value={i} onChange={setI} />

      <section className="gc-top" aria-label="The age at a glance">
        {gc && thal && <Clock start={thal.date} now={lastKnown} lastRead={series[series.length - 1].checkpoint} />}
        <div className="gc-tiles">
          <Tile label="Land or sea" value={sv} unit={sv >= 0 ? "toward the sea" : "toward the land"} signed series={series.map((r) => [r.checkpoint, r.societalValues[NAVAL] ?? 0])} prev={prev?.societalValues[NAVAL]} at={now.checkpoint} diverging />
          <Tile label="Ships" value={ships} series={series.map((r) => [r.checkpoint, sum(r.fleet)])} prev={prev ? sum(prev.fleet) : undefined} at={now.checkpoint} digits={0} />
          <Tile label="Footholds abroad" value={now.abroad.length} series={series.map((r) => [r.checkpoint, r.abroad.length])} prev={prev?.abroad.length} at={now.checkpoint} digits={0} link="/world" />
          <Tile label="Legitimacy" value={now.legitimacy ?? 0} series={series.map((r) => [r.checkpoint, r.legitimacy ?? 0])} prev={prev?.legitimacy ?? undefined} at={now.checkpoint} digits={0} />
          <Tile label="Advances" value={now.advances.count} series={series.map((r) => [r.checkpoint, r.advances.count])} prev={prev?.advances.count} at={now.checkpoint} digits={0} />
        </div>
      </section>

      <StarRule />
      <TurnToSea series={series} at={now.checkpoint} thal={thal?.date} lastKnown={lastKnown} />

      <StarRule />
      <Temper series={series} now={now} prev={prev} names={names} />

      <StarRule />
      <Fleet series={series} at={now.checkpoint} names={names} />

      <StarRule />
      <Ledger series={series} at={now.checkpoint} names={names} />

      <StarRule />
      <Estates at={now.checkpoint} />

      <StarRule />
      <Watch now={now} names={names} lastRead={series[series.length - 1].checkpoint} gcDate={gc?.date} />

      <p className="quiet small gc-foot">
        Every figure here is read from the saves, at the checkpoints marked on the slider, except where a line is dashed and called a projection.
        Society's leanings run from −100 to +100; the game names the two ends. An estate counts as content at 55 or more, as on the Council. <Link to="/council">The Council</Link> has the estates and the
        Jamāʿa in full; <Link to="/world">the World</Link> the footholds on the chart.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ the Thalassocracy's clock */

function Clock({ start, now, lastRead }: { start: string; now: string; lastRead: string }) {
  const y0 = yearFrac(start), y1 = y0 + THAL_YEARS, t = Math.min(y1, Math.max(y0, yearFrac(now)));
  const end = `${year(start) + THAL_YEARS}${start.slice(4)}`;
  const done = (t - y0) / THAL_YEARS;
  const yr = Math.floor(t - y0) + 1;
  return (
    <div className="gc-clock">
      <h2>The Thalassocracy</h2>
      <p className="quiet small">Proclaimed {western(start)}. For {THAL_YEARS} years the crown pays a fifth less for every ship, and the realm leans a little further to the sea each month.</p>
      <div className="gc-years" role="img" aria-label={`Year ${yr} of ${THAL_YEARS}: ${Math.round(done * 100)} per cent gone, ending ${western(end)}`}>
        {Array.from({ length: THAL_YEARS }, (_, n) => {
          const fill = Math.max(0, Math.min(1, t - y0 - n));
          return <span key={n} className={fill >= 1 ? "full" : fill > 0 ? "part" : ""}><i style={{ width: `${fill * 100}%` }} /></span>;
        })}
      </div>
      <div className="gc-clock-legend ui">
        <span><b>Year {yr}</b> of {THAL_YEARS}</span>
        <span>ends {hijri(end).text} AH ({western(end)})</span>
      </div>
      <p className="quiet small">The chronicle runs to {western(now)}; the last save read is {western(lastRead)}, before the proclamation.</p>
    </div>
  );
}

/* ------------------------------------------------------------ tiles */

function Tile({ label, value, unit, series, prev, at, digits = 1, signed = false, diverging = false, link }: {
  label: string; value: number; unit?: string; series: [string, number][]; prev?: number; at: string;
  digits?: number; signed?: boolean; diverging?: boolean; link?: string;
}) {
  const W = 160, H = 38;
  const xs = scaleLinear().domain([yearFrac(series[0][0]), yearFrac(series[series.length - 1][0])]).range([2, W - 2]);
  const vals = series.map((s) => s[1]);
  const lo = diverging ? -Math.max(...vals.map(Math.abs), 1) : Math.min(...vals), hi = diverging ? -lo : Math.max(...vals);
  const ys = scaleLinear().domain([lo, hi === lo ? lo + 1 : hi]).range([H - 3, 3]);
  const d = line<[string, number]>().x((p) => xs(yearFrac(p[0]))).y((p) => ys(p[1]))(series) ?? "";
  const cur = series.find((s) => s[0] === at);
  const ch = prev !== undefined ? value - prev : null;
  const body = (
    <>
      <div className="t-label ui">{label}</div>
      <div className="t-value"><span className="num">{signed && value > 0 ? "+" : value < 0 ? "−" : ""}{fmt(Math.abs(value), digits)}</span>{unit && <span className="t-unit ui">{unit}</span>}</div>
      <div className={`t-delta ui ${ch && ch > 0 ? "up" : ch && ch < 0 ? "down" : ""}`}>{ch === null ? "first reading" : `${delta(ch, digits)} since the last reading`}</div>
      <svg className="spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {diverging && <line x1={0} x2={W} y1={ys(0)} y2={ys(0)} className="zero" />}
        <path d={d} />
        {cur && <circle cx={xs(yearFrac(cur[0]))} cy={ys(cur[1])} r={3} />}
      </svg>
    </>
  );
  return link ? <Link to={link} className="gc-tile linked">{body}</Link> : <div className="gc-tile">{body}</div>;
}

/* ------------------------------------------------------------ the turn to the sea */

function TurnToSea({ series, at, thal, lastKnown }: { series: RealmAt[]; at: string; thal?: string; lastKnown: string }) {
  const [hov, setHov] = useState<RealmAt | null>(null);
  const pts = series.map((r) => [yearFrac(r.checkpoint), r.societalValues[NAVAL] ?? 0] as [number, number]);
  const last = pts[pts.length - 1];
  // projection: the Thalassocracy's push alone, from the last reading, to the end of its twenty years (capped at +100)
  const proj: [number, number][] = [];
  if (thal) {
    const t0 = yearFrac(thal), t1 = t0 + THAL_YEARS;
    for (let t = last[0]; t <= t1 + 1e-6; t += 0.25) {
      const months = Math.max(0, (t - Math.max(t0, last[0])) * 12);
      proj.push([t, Math.min(100, last[1] + months * THAL_PUSH)]);
    }
  }
  const x0 = pts[0][0], x1 = proj.length ? proj[proj.length - 1][0] : last[0];
  const W = 1000, H = 300, padL = 44, padR = 16, padT = 18, padB = 28;
  const x = scaleLinear().domain([x0, x1]).range([padL, W - padR]);
  const y = scaleLinear().domain([-100, 100]).range([H - padB, padT]);
  const curve = curveMonotoneX;
  const ln = line<[number, number]>().x((p) => x(p[0])).y((p) => y(p[1])).curve(curve);
  const sea = area<[number, number]>().x((p) => x(p[0])).y0(y(0)).y1((p) => y(Math.max(0, p[1]))).curve(curve);
  const land = area<[number, number]>().x((p) => x(p[0])).y0(y(0)).y1((p) => y(Math.min(0, p[1]))).curve(curve);
  // where the line first crosses to the sea
  let cross: number | null = null;
  for (let j = 1; j < pts.length; j++) if (pts[j - 1][1] < 0 && pts[j][1] >= 0) { const [a, b] = [pts[j - 1], pts[j]]; cross = a[0] + ((0 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]); }
  const moments = MOMENTS.map(([id, label]) => ({ e: events.find((e) => e.id === id), label })).filter((m) => m.e && yearFrac(m.e.date) >= x0);
  const atX = x(yearFrac(at));
  const decades = Array.from({ length: Math.floor((x1 - x0) / 10) + 2 }, (_, n) => Math.ceil(x0 / 10) * 10 + n * 10).filter((d) => d <= x1);
  const reach100 = proj.find((p) => p[1] >= 100);
  return (
    <section className="gc-sea" aria-labelledby="gc-sea-h">
      <h2 id="gc-sea-h" className="section-title">The turn to the sea</h2>
      <p className="quiet gc-q">How far the realm leans to the land or the sea, at every reading since 1337. {cross && <>It crossed to the sea about {Math.floor(cross)}.</>}</p>
      <div className="gc-sea-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Land against naval, from ${fmt(pts[0][1])} in ${year(series[0].checkpoint)} to ${fmt(last[1])} in ${year(series[series.length - 1].checkpoint)}`}
          onPointerLeave={() => setHov(null)}
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W;
            let best = series[0], bd = Infinity; for (const s of series) { const dd = Math.abs(x(yearFrac(s.checkpoint)) - px); if (dd < bd) { bd = dd; best = s; } }
            setHov(bd < 30 ? best : null);
          }}>
          {[-100, -50, 0, 50, 100].map((v) => (
            <g key={v}><line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className={v === 0 ? "zero" : "grid"} />
              <text x={padL - 8} y={y(v) + 4} className="tick" textAnchor="end">{v > 0 ? `+${v}` : v}</text></g>
          ))}
          <text x={padL + 6} y={y(92)} className="pole sea">Naval</text>
          <text x={padL + 6} y={y(-88)} className="pole land">Land</text>
          {decades.map((d) => <text key={d} x={x(d)} y={H - 8} className="tick" textAnchor="middle">{d}</text>)}
          {thal && <rect x={x(yearFrac(thal))} y={padT} width={x(yearFrac(thal) + THAL_YEARS) - x(yearFrac(thal))} height={H - padT - padB} className="thal-band" />}
          {thal && <text x={x(yearFrac(thal)) + 6} y={H - padB - 8} className="band-label">Thalassocracy, {year(thal)}–{String(year(thal) + THAL_YEARS).slice(2)}</text>}
          <path d={land(pts) ?? ""} className="a-land" />
          <path d={sea(pts) ?? ""} className="a-sea" />
          <path d={ln(pts) ?? ""} className="l-read" />
          {proj.length > 1 && <path d={ln(proj) ?? ""} className="l-proj" />}
          {reach100 && <text x={x(reach100[0])} y={y(100) - 6} className="proj-label" textAnchor="middle">projected +100, {Math.floor(reach100[0])}</text>}
          {cross && <g className="cross"><line x1={x(cross)} x2={x(cross)} y1={y(0) - 26} y2={y(0) + 26} /><text x={x(cross)} y={y(0) + 40} textAnchor="middle">to the sea, c. {Math.floor(cross)}</text></g>}
          {moments.map(({ e, label }, n) => {
            const mx = x(yearFrac(e!.date));
            // one row each, stepping down in date order, so labels that fall close together never collide
            const ly = padT + 14 + n * 15;
            return <g key={e!.id} className="moment"><line x1={mx} x2={mx} y1={ly + 4} y2={H - padB} /><text x={mx - 4} y={ly} textAnchor="end">{label}</text></g>;
          })}
          <line x1={atX} x2={atX} y1={padT} y2={H - padB} className="at" />
          {pts.map((p, n) => <circle key={n} cx={x(p[0])} cy={y(p[1])} r={series[n].checkpoint === at ? 4.5 : 2.2} className={series[n].checkpoint === at ? "dot on" : "dot"} />)}
          {hov && <circle cx={x(yearFrac(hov.checkpoint))} cy={y(hov.societalValues[NAVAL] ?? 0)} r={6} className="dot hov" />}
        </svg>
        {hov && (
          <div className="gc-tip ui" role="status" style={{ left: `${(x(yearFrac(hov.checkpoint)) / W) * 100}%` }}>
            <b>{western(hov.checkpoint)}</b> {fmt(hov.societalValues[NAVAL] ?? 0)} ({(hov.societalValues[NAVAL] ?? 0) >= 0 ? "naval" : "land"})
          </div>
        )}
      </div>
      <p className="quiet small">The solid line is read from the saves. The dashed line is a projection: where the Thalassocracy's push of +{THAL_PUSH} a month would carry the realm on its own, from the last reading, if nothing else moved it. The chronicle runs to {western(lastKnown)}.</p>
    </section>
  );
}

/* ------------------------------------------------------------ the temper of the realm */

function Temper({ series, now, prev, names }: { series: RealmAt[]; now: RealmAt; prev?: RealmAt; names?: Record<string, string> }) {
  const keys = Object.keys(now.societalValues).sort((a, b) => (a === NAVAL ? -1 : b === NAVAL ? 1 : 0));
  const W = 420, H = 30, pad = 8;
  const x = scaleLinear().domain([-100, 100]).range([pad, W - pad]);
  const tf = scaleLinear().domain([yearFrac(series[0].checkpoint), yearFrac(series[series.length - 1].checkpoint)]).range([0, 90]);
  return (
    <section className="gc-temper" aria-labelledby="gc-temper-h">
      <h2 id="gc-temper-h" className="section-title">The temper of the realm</h2>
      <p className="quiet gc-q">Each of society's leanings, from one end to the other. The gilt mark is this reading; the hollow one the reading before. The small line beside each is its whole history.</p>
      <ul className="temper-list">
        {keys.map((k) => {
          const v = now.societalValues[k], p = prev?.societalValues[k];
          const hist = series.filter((r) => r.societalValues[k] !== undefined).map((r) => [tf(yearFrac(r.checkpoint)), 15 - (r.societalValues[k] / 100) * 13] as [number, number]);
          const moved = p !== undefined ? v - p : 0;
          return (
            <li key={k} className={k === NAVAL ? "key" : ""}>
              <span className="pole-l">{nameOf(names, `${k}:left`)}</span>
              <svg viewBox={`0 0 ${W} ${H}`} className="track" role="img" aria-label={`${nameOf(names, k)}: ${fmt(v)}${p !== undefined ? `, was ${fmt(p)}` : ""}`}>
                <line x1={x(-100)} x2={x(100)} y1={H / 2} y2={H / 2} className="rail" />
                <line x1={x(0)} x2={x(0)} y1={H / 2 - 7} y2={H / 2 + 7} className="mid" />
                {p !== undefined && Math.abs(moved) >= 0.5 && <line x1={x(p)} x2={x(v)} y1={H / 2} y2={H / 2} className="moved" />}
                {p !== undefined && <circle cx={x(p)} cy={H / 2} r={5} className="was" />}
                <circle cx={x(v)} cy={H / 2} r={6} className="is" />
              </svg>
              <span className="pole-r">{nameOf(names, `${k}:right`)}</span>
              <span className="val num ui">{v > 0 ? "+" : v < 0 ? "−" : ""}{fmt(Math.abs(v))}{p !== undefined && Math.abs(moved) >= 0.05 && <em className={moved > 0 ? "r" : "l"}>{moved > 0 ? "▸" : "◂"}{fmt(Math.abs(moved))}</em>}</span>
              <svg viewBox="0 0 90 30" className="hist" aria-hidden="true"><line x1={0} x2={90} y1={15} y2={15} className="zero" /><path d={line()(hist) ?? ""} /></svg>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ the fleet */

const SHIP_ORDER = ["n_nd_adu_war_galley", "n_mediterrannean_galley", "n_traditional_galley", "n_iberian_caravel", "n_early_iberian_caravel", "n_cog"];
const SHIP_COL = ["#d95926", "#e88f5c", "#c98500", "#3987e5", "#7fb0ee", "#9085e9", "#199e70", "#d55181"];

function Fleet({ series, at, names }: { series: RealmAt[]; at: string; names?: Record<string, string> }) {
  const [hov, setHov] = useState<RealmAt | null>(null);
  const types = [...new Set(series.flatMap((r) => Object.keys(r.fleet)))].sort((a, b) => (SHIP_ORDER.indexOf(a) + 99) % 99 - (SHIP_ORDER.indexOf(b) + 99) % 99 || a.localeCompare(b));
  const col = (t: string) => SHIP_COL[types.indexOf(t) % SHIP_COL.length];
  const W = 1000, H = 220, padL = 36, padB = 24, padT = 10;
  const x0 = yearFrac(series[0].checkpoint), x1 = yearFrac(series[series.length - 1].checkpoint);
  const x = scaleLinear().domain([x0, x1]).range([padL + 6, W - 10]);
  const max = Math.max(...series.map((r) => sum(r.fleet)), 1);
  const y = scaleLinear().domain([0, max * 1.08]).range([H - padB, padT]);
  const bw = Math.max(3, Math.min(12, ((W - padL) / series.length) * 0.6));
  const cur = series.find((r) => r.checkpoint === at);
  const show = hov ?? cur;
  return (
    <section className="gc-fleet" aria-labelledby="gc-fleet-h">
      <h2 id="gc-fleet-h" className="section-title">The fleet</h2>
      <p className="quiet gc-q">Ships of the crown by kind at each reading. The army stands at {cur ? sum(cur.army) : "?"} regiments.</p>
      <div className="gc-fleet-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Ships of the crown, from ${sum(series[0].fleet)} in ${year(series[0].checkpoint)} to ${sum(series[series.length - 1].fleet)} in ${year(series[series.length - 1].checkpoint)}`}>
          {y.ticks(4).map((t) => <g key={t}><line x1={padL} x2={W - 4} y1={y(t)} y2={y(t)} className="grid" /><text x={padL - 6} y={y(t) + 4} className="tick" textAnchor="end">{t}</text></g>)}
          {Array.from({ length: Math.floor((x1 - x0) / 10) + 2 }, (_, n) => Math.ceil(x0 / 10) * 10 + n * 10).filter((d) => d <= x1).map((d) => <text key={d} x={x(d)} y={H - 6} className="tick" textAnchor="middle">{d}</text>)}
          {series.map((r) => {
            let acc = 0; const cx = x(yearFrac(r.checkpoint));
            return (
              <g key={r.checkpoint} className={`bar ${r.checkpoint === at ? "on" : ""}`} onPointerEnter={() => setHov(r)} onPointerLeave={() => setHov(null)}>
                <rect x={cx - bw / 2 - 2} y={padT} width={bw + 4} height={H - padB - padT} className="hit" />
                {types.map((t) => {
                  const n = r.fleet[t] ?? 0; if (!n) return null;
                  const yt = y(acc + n), yb = y(acc); acc += n;
                  return <rect key={t} x={cx - bw / 2} y={yt + 1} width={bw} height={Math.max(0.5, yb - yt - 1)} rx={1.5} style={{ fill: col(t) }} />;
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="w-legend inline ui gc-ships">
        {types.filter((t) => series.some((r) => r.fleet[t])).map((t) => (
          <span key={t}><i className="sw" style={{ background: col(t) }} /> {nameOf(names, t)}{show && show.fleet[t] ? <b className="num"> {show.fleet[t]}</b> : null}</span>
        ))}
        {show && <span className="when">{western(show.checkpoint)}: {sum(show.fleet)} ships</span>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ the Jamāʿa's ledger */

function Ledger({ series, at, names }: { series: RealmAt[]; at: string; names?: Record<string, string> }) {
  const [hov, setHov] = useState<{ key: string; cp: string } | null>(null);
  const firstHeld = new Map<string, number>();
  series.forEach((r, n) => { for (const p of [...r.privileges, ...r.reforms]) if (!firstHeld.has(p)) firstHeld.set(p, n); });
  const estateOf = (p: string) => names?.[`${p}:estate`] ?? "other";
  const privs = [...new Set(series.flatMap((r) => r.privileges))];
  const groups = [...ESTATE_ORDER.filter((e) => e !== "crown"), "other"].map((e) => ({
    estate: e, rows: privs.filter((p) => (estateOf(p) === e) || (e === "other" && !ESTATE_ORDER.includes(estateOf(p)))).sort((a, b) => firstHeld.get(a)! - firstHeld.get(b)!),
  })).filter((g) => g.rows.length);
  const reforms = [...new Set(series.flatMap((r) => r.reforms))].sort((a, b) => firstHeld.get(a)! - firstHeld.get(b)!);
  const n = series.length, cw = Math.max(5, Math.min(11, 760 / n)), rh = 17;
  const atN = series.findIndex((r) => r.checkpoint === at);
  const cur = series[atN], prev = atN > 0 ? series[atN - 1] : undefined;
  const lawChanges = useMemo(() => {
    const out: { date: string; slot: string; from: string | null; to: string }[] = [];
    for (let j = 1; j < series.length; j++) {
      const a = series[j - 1].laws, b = series[j].laws;
      for (const [slot, pol] of Object.entries(b)) if (a[slot] !== pol) out.push({ date: series[j].checkpoint, slot, from: a[slot] ?? null, to: pol });
    }
    return out.reverse();
  }, [series]);
  const granted = cur && prev ? [...cur.privileges, ...cur.reforms].filter((p) => !prev.privileges.includes(p) && !prev.reforms.includes(p)) : [];
  const revoked = cur && prev ? [...prev.privileges, ...prev.reforms].filter((p) => !cur.privileges.includes(p) && !cur.reforms.includes(p)) : [];
  const decades = series.map((r, j) => [j, year(r.checkpoint)] as const).filter(([j, yy], k, arr) => k === 0 || Math.floor(yy / 20) !== Math.floor(arr[k - 1][1] / 20));

  const Row = ({ k, held }: { k: string; held: (r: RealmAt) => boolean }) => (
    <div className={`lg-row ${cur && held(cur) ? "now" : ""}`}>
      <span className="lg-name" title={k}>{nameOf(names, k)}</span>
      <svg width={n * cw} height={rh - 3} className="lg-cells" aria-hidden="true">
        {series.map((r, j) => held(r) && (
          <rect key={j} x={j * cw + 0.5} y={2} width={cw - 1} height={rh - 7} rx={1} className={`${j === atN ? "at" : ""}`}
            onPointerEnter={() => setHov({ key: k, cp: r.checkpoint })} onPointerLeave={() => setHov(null)} />
        ))}
      </svg>
    </div>
  );

  return (
    <section className="gc-ledger" aria-labelledby="gc-ledger-h">
      <h2 id="gc-ledger-h" className="section-title">The Jamāʿa's ledger</h2>
      <p className="quiet gc-q">Every privilege and reform the realm has held, by estate, across the readings from {year(series[0].checkpoint)}. Each column is one reading (they are not evenly spaced in time); a filled cell means it was in force, and the brighter column is this reading.</p>
      {cur && prev && (granted.length > 0 || revoked.length > 0) && (
        <p className="gc-diff ui">Since {western(prev.checkpoint)}:
          {granted.map((p) => <span key={p} className="tag up">+ {nameOf(names, p)}</span>)}
          {revoked.map((p) => <span key={p} className="tag new">− {nameOf(names, p)}</span>)}
        </p>
      )}
      <div className="lg-scroll">
        <div className="lg-axis" style={{ marginLeft: "var(--lg-name)", width: n * cw }}>
          {decades.map(([j, yy]) => <span key={j} style={{ left: j * cw }}>{yy}</span>)}
          {atN >= 0 && <span className="at" style={{ left: atN * cw }} aria-hidden="true" />}
        </div>
        {groups.map((g) => (
          <div key={g.estate} className="lg-group" style={{ ["--ec" as any]: g.estate === "other" ? "#9ea7c7" : estateColor(g.estate) }}>
            <h3><i />{g.estate === "other" ? "Other" : (ESTATE_WORD[g.estate] ?? g.estate).replace(/^./, (c) => c.toUpperCase())}</h3>
            {g.rows.map((p) => <Row key={p} k={p} held={(r) => r.privileges.includes(p)} />)}
          </div>
        ))}
        <div className="lg-group" style={{ ["--ec" as any]: "#d4ab55" }}>
          <h3><i />Reforms of government</h3>
          {reforms.map((p) => <Row key={p} k={p} held={(r) => r.reforms.includes(p)} />)}
        </div>
      </div>
      {hov && <p className="gc-hov ui" role="status">{nameOf(names, hov.key)}, in force at {western(hov.cp)}</p>}

      <h3 className="gc-sub">Laws changed</h3>
      <ol className="law-changes">
        {lawChanges.slice(0, 14).map((c) => (
          <li key={c.date + c.slot} className={c.date === at ? "at" : ""}>
            <span className="d ui">{western(c.date)}</span>
            <span className="s">{nameOf(names, c.slot)}</span>
            <span className="ch">{c.from ? <><s>{nameOf(names, c.from)}</s> to </> : null}<b>{nameOf(names, c.to)}</b></span>
          </li>
        ))}
      </ol>
      {lawChanges.length > 14 && <p className="quiet small">And {lawChanges.length - 14} earlier changes, from {western(lawChanges[lawChanges.length - 1].date)}.</p>}
    </section>
  );
}

/* ------------------------------------------------------------ the estates */

function Estates({ at }: { at: string }) {
  const snaps = snapshots.filter((s) => s.estates.some((e) => e.satisfaction !== null));
  const ids = ESTATE_ORDER.filter((id) => id !== "crown" && snaps.some((s) => s.estates.find((e) => e.id === id)?.satisfaction != null));
  const x0 = yearFrac(snaps[0].date), x1 = yearFrac(snaps[snaps.length - 1].date);
  const W = 260, H = 110, pad = 6;
  const x = scaleLinear().domain([x0, x1]).range([pad, W - pad]);
  const y = scaleLinear().domain([0, 100]).range([H - 16, 6]);
  const cur = snapshots.find((s) => s.id === at) ?? snaps[snaps.length - 1];
  const nameAt = (s: Snapshot, id: string) => s.estates.find((e) => e.id === id)?.name ?? id;
  return (
    <section className="gc-estates" aria-labelledby="gc-est-h">
      <h2 id="gc-est-h" className="section-title">The estates</h2>
      <p className="quiet gc-q">How content each estate has been at every checkpoint since {year(snaps[0].date)}, on the same scale of 0 to 100. Readings marked as estimates in the saves are drawn the same.</p>
      <div className="est-grid">
        {ids.map((id) => {
          const pts = snaps.map((s) => [yearFrac(s.date), s.estates.find((e) => e.id === id)?.satisfaction ?? null] as [number, number | null]).filter((p) => p[1] !== null) as [number, number][];
          const now = cur.estates.find((e) => e.id === id);
          const c = estateColor(id);
          return (
            <figure key={id} className="est">
              <figcaption><i style={{ background: c }} />{ESTATE_WORD[id]?.replace(/^./, (ch) => ch.toUpperCase()) ?? nameAt(cur, id)}<b className="num">{now?.satisfaction ?? "–"}</b></figcaption>
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${nameAt(cur, id)}: content ${now?.satisfaction ?? "unknown"} at ${western(cur.date)}`}>
                <line x1={pad} x2={W - pad} y1={y(50)} y2={y(50)} className="grid" />
                <path d={line()(pts.map((p) => [x(p[0]), y(p[1])])) ?? ""} style={{ stroke: c }} className="est-line" />
                {now?.satisfaction != null && <circle cx={x(yearFrac(cur.date))} cy={y(now.satisfaction)} r={3.5} style={{ fill: c }} />}
                <text x={pad} y={H - 3} className="tick">{year(snaps[0].date)}</text>
                <text x={W - pad} y={H - 3} className="tick" textAnchor="end">{year(snaps[snaps.length - 1].date)}</text>
                <text x={W - pad} y={y(50) - 3} className="tick" textAnchor="end">50</text>
              </svg>
              {now?.power != null && <div className="est-power ui">{fmt(now.power)}% of the realm's power{now.estimated ? ", estimated" : ""}</div>}
            </figure>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ the watch */

function Watch({ now, names, lastRead, gcDate }: { now: RealmAt; names?: Record<string, string>; lastRead: string; gcDate?: string }) {
  const dom = now.dominance;
  return (
    <section className="gc-watch" aria-labelledby="gc-watch-h">
      <h2 id="gc-watch-h" className="section-title">What the dīwān watches</h2>
      <div className="watch-grid">
        <div className="watch">
          <h3>Dominance</h3>
          {dom ? (
            <ul>{Object.entries(dom).map(([k, v]) => <li key={k}>{k.replace(/_/g, " ")}: <b className="num">{fmt(v)}</b></li>)}</ul>
          ) : (
            <p className="quiet">Not yet read. The Golden Century began {gcDate ? western(gcDate) : "after the last save"}, and the last save is of {western(lastRead)}; the realm's dominance in Europe and across the seas will be read from the next save.</p>
          )}
        </div>
        <div className="watch">
          <h3>A league against the empire</h3>
          <p className="quiet">The chancery warns that if al-Andalus grows too strong, its rivals will league together against it. When the saves show such a league, its members will be listed here.</p>
        </div>
        <div className="watch">
          <h3>Institutions</h3>
          <p>{now.institutions.length ? now.institutions.map((k) => nameOf(names, k)).join(", ") : "None embraced yet"}.</p>
          <p className="quiet small">{now.advances.count} advances researched.</p>
        </div>
      </div>
    </section>
  );
}

