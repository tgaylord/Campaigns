import { useEffect, useMemo, useRef, useState } from "react";
import { scaleLinear } from "d3-scale";
import { line, curveCatmullRom } from "d3-shape";
import { snapshots, events, latest, yearFrac, year, hijri, arabicDigits, western, signed, EVENT_LABEL } from "../lib/data";
import { PageHead, StarRule } from "../components/bits";
import "./strait.css";

const W = 1400, H = 640;
const SHORE = 92;            // depth of each shore band
const TOP = SHORE + 40, BOTTOM = H - SHORE - 40;

/** A coastline that wanders like a real one: deterministic, so it doesn't jump between renders. */
function coast(y: number, dir: 1 | -1, seed: number) {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 20) {
    const n = Math.sin(x / 61 + seed) * 9 + Math.sin(x / 23 + seed * 2) * 4 + Math.sin(x / 151 + seed * 3) * 14;
    pts.push(`${x},${(y + dir * n).toFixed(1)}`);
  }
  const edge = dir === 1 ? 0 : H;
  return `M0,${edge} L${pts.join(" L")} L${W},${edge} Z`;
}

export default function Strait() {
  const snaps = snapshots.filter((s) => s.strait);
  const [hover, setHover] = useState<number | null>(null);
  const pan = useRef<HTMLDivElement>(null);
  // On a phone the chart is drawn wider and its labels larger, so lanes must allow for wider text.
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 40rem)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 40rem)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  // On a narrow screen the channel scrolls sideways; open it at the present.
  useEffect(() => { if (pan.current) pan.current.scrollLeft = pan.current.scrollWidth; }, []);
  const t0 = snaps.length ? yearFrac(snaps[0].date) : 0;
  const t1 = snaps.length ? yearFrac(snaps[snaps.length - 1].date) : 1;
  const x = useMemo(() => scaleLinear().domain([t0 - 0.8, t1 + 0.8]).range([60, W - 60]), [t0, t1]);
  // Castile at the top (−100), Morocco at the bottom (+100).
  const y = useMemo(() => scaleLinear().domain([-100, 100]).range([TOP, BOTTOM]), []);
  const mast = (sov: number) => 14 + (sov / 100) * 74;
  const course = line<(typeof snaps)[number]>()
    .x((s) => x(yearFrac(s.date))).y((s) => y(s.strait!.influence)).curve(curveCatmullRom.alpha(0.5));

  const marks = events.filter((e) => ["strait_change", "war_declared", "peace", "situation"].includes(e.type)
    && yearFrac(e.date) >= t0 - 0.8 && yearFrac(e.date) <= t1 + 0.8);

  // Event labels sit in lanes in the southern water. A label that would run off the right edge
  // is set to the left of its buoy; each lane takes the next label that doesn't overlap.
  const MAX_CHARS = narrow ? 46 : 70;
  const lanes = useMemo(() => {
    const used: [number, number][][] = [];
    const charW = narrow ? 8.4 : 6.3;
    return [...marks].reverse().map((e) => {
      const xx = x(yearFrac(e.date));
      const full = `${EVENT_LABEL[e.type]}: ${e.title}`;
      const text = full.length > MAX_CHARS ? full.slice(0, MAX_CHARS - 1).replace(/[\s,;:]+\S*$/, "") + "…" : full;
      const w = 9 + text.length * charW;
      const left = xx + w > W - 12;
      const span: [number, number] = left ? [xx - w - 6, xx + 6] : [xx - 6, xx + w + 6];
      let lane = used.findIndex((l) => l.every(([a, b]) => span[1] < a || span[0] > b));
      if (lane === -1) { lane = used.length; used.push([]); }
      used[lane].push(span);
      return { e, lane, xx, left, text, full };
    });
  }, [marks, x, narrow, MAX_CHARS]);

  const years: number[] = [];
  const step = Math.max(1, Math.ceil((t1 - t0) / 10));
  for (let yy = Math.ceil(t0); yy <= t1; yy += step) years.push(yy);

  const now = latest?.strait ? latest : null;
  const hs = hover != null ? snaps[hover] : null;

  return (
    <div className="page strait-page">
      <PageHead
        title="The Battle for the Strait"
        ar="بحر الزقاق"
        lede={<>Castile presses from the north shore, the Marinid sultan from the south. Where Granada's banner sails between them is <em>who holds sway at court</em>; how high it flies is <em>how freely Granada rules itself</em>. To win, the banner must keep to the channel and fly above the line.</>}
      />

      {snaps.length < 1 ? <p className="muted">No checkpoint has recorded the Strait yet.</p> : (
        <figure className="strait-figure">
          <div className="strait-pan" ref={pan}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Influence over Granada and Granadan sovereignty at each checkpoint, drawn as a ship's course through the Strait">
            <defs>
              <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#16224d" />
                <stop offset="0.5" stopColor="#1f3170" />
                <stop offset="1" stopColor="#16224d" />
              </linearGradient>
              <pattern id="swell" width="60" height="16" patternUnits="userSpaceOnUse">
                <path d="M0 8 q 15 -6 30 0 t 30 0" fill="none" stroke="#9ea7c7" strokeOpacity="0.09" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#water)" />
            <rect x={0} y={y(-50)} width={W} height={y(50) - y(-50)} className="channel" />
            <rect width={W} height={H} fill="url(#swell)" />
            <line x1={0} x2={W} y1={y(0)} y2={y(0)} className="midline" />
            <text x={W - 24} y={y(50) - 10} className="channel-label" textAnchor="end">The channel: influence between −50 and +50</text>

            <path d={coast(SHORE, 1, 1.3)} className="shore" />
            <path d={coast(H - SHORE, -1, 4.1)} className="shore" />
            <g className="shore-name" transform={`translate(${W / 2}, 54)`}>
              <text className="ar" textAnchor="middle">قشتالة</text>
              <text className="tr" textAnchor="middle" y={28}>Castile, the northern shore</text>
            </g>
            <g className="shore-name" transform={`translate(${W / 2}, ${H - 62})`}>
              <text className="ar" textAnchor="middle">بنو مرين</text>
              <text className="tr" textAnchor="middle" y={28}>the Marinids, the southern shore</text>
            </g>

            {years.map((yy) => (
              <g key={yy} className="year" transform={`translate(${x(yy)},${TOP + 2})`}>
                <line y1={20} y2={BOTTOM - TOP + 24} />
                <text textAnchor="middle" className="ar">{arabicDigits(hijri(`${yy}-06-01`).y)}</text>
                <text textAnchor="middle" y={14} className="g">{yy}</text>
              </g>
            ))}

            {lanes.filter((l) => l.lane < 4).map(({ e, lane, xx, left, text, full }) => {
              const ly = y(60) + lane * (narrow ? 30 : 26);
              return (
                <g key={e.id} className="buoy">
                  <line x1={xx} x2={xx} y1={y(0) + 4} y2={ly - 4} />
                  <circle cx={xx} cy={y(0)} r={3.5} />
                  <path d={`M${xx},${ly - 5} l5,5 l-5,5 l-5,-5 Z`} />
                  <text x={left ? xx - 9 : xx + 9} y={ly + 4} textAnchor={left ? "end" : "start"}><title>{full}</title>{text}</text>
                </g>
              );
            })}

            <path d={course(snaps) ?? ""} className="wake" />
            <path d={course(snaps) ?? ""} className="course" />

            {snaps.map((s, k) => {
              const xx = x(yearFrac(s.date)), yy = y(s.strait!.influence), m = mast(s.strait!.sovereignty);
              const free = s.strait!.sovereignty > 50;
              return (
                <g key={s.id} className={`banner ${free ? "free" : ""} ${hover === k ? "on" : ""}`} transform={`translate(${xx},${yy})`}
                  onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(k)} onBlur={() => setHover(null)}
                  tabIndex={0} role="img" aria-label={`${western(s.date)}: influence ${signed(s.strait!.influence)}, sovereignty ${s.strait!.sovereignty}`}>
                  <rect x={-18} y={-m - 18} width={36} height={m + 30} fill="transparent" />
                  <line y1={0} y2={-mast(50)} className="needed" />
                  <line y1={0} y2={-m} className="mast" />
                  <path d={`M0,${-m} l22,6 l-22,8 Z`} className="flag" />
                  <ellipse rx={9} ry={3.5} className="hull" />
                  <text y={-m - 8} textAnchor="middle" className="val sov">{Math.round(s.strait!.sovereignty)}</text>
                  <text y={20} textAnchor="middle" className="val inf">{signed(Math.round(s.strait!.influence))}</text>
                </g>
              );
            })}
          </svg>
          </div>

          {hs && (
            <div className="strait-tip ui" style={{ left: `${(x(yearFrac(hs.date)) / W) * 100}%` }}>
              <div className="d">{hijri(hs.date).text} AH ({western(hs.date)})</div>
              <div>Influence {signed(hs.strait!.influence)}, {hs.strait!.influence < 0 ? "towards Castile" : hs.strait!.influence > 0 ? "towards Morocco" : "even"}</div>
              <div>Sovereignty {hs.strait!.sovereignty}{hs.strait!.sovereignty > 50 ? " (above the line)" : " (below the line)"}</div>
              <div>{hs.overlord ? `Tributary of ${hs.overlord.country}` : "Independent"}</div>
            </div>
          )}
          <figcaption className="key ui">
            <span><i className="k-banner" /> Granada's banner at a checkpoint: its height is sovereignty</span>
            <span><i className="k-needed" /> The height it must clear: sovereignty 50</span>
            <span><i className="k-channel" /> The channel Granada must keep to</span>
            <span>Above each mast, sovereignty; below each hull, influence (minus leans to Castile)</span>
          </figcaption>
        </figure>
      )}

      {now && (
        <>
          <StarRule />
          <h2 className="section-title">What Granada needs, as things stand</h2>
          <Conditions />
        </>
      )}

      <details className="numbers">
        <summary>Show the numbers as a table</summary>
        <table className="ledger">
          <thead><tr><th>Checkpoint</th><th className="num">Influence</th><th className="num">Sovereignty</th><th className="num">Years as a subject</th><th>Standing</th></tr></thead>
          <tbody>
            {snaps.map((s) => (
              <tr key={s.id}><td>{s.date}</td><td className="num">{signed(s.strait!.influence)}</td><td className="num">{s.strait!.sovereignty}</td><td className="num">{s.strait!.yearsSubject}</td><td>{s.overlord ? `Tributary of ${s.overlord.country}` : "Independent"}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="muted ui" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
        The situation ends in a neutral outcome if the Age of Discovery arrives first. Granada's locations carry −500% war score
        efficiency for 50 years from the start, so neither neighbour can take them by treaty. {snaps.length ? `First recorded ${year(snaps[0].date)}.` : ""}
      </p>
    </div>
  );
}

export function Conditions() {
  const s = latest;
  if (!s?.strait) return null;
  const rows = [
    { label: "Independent", met: !s.overlord, detail: s.overlord ? `Tributary of ${s.overlord.country}` : "No overlord" },
    { label: "Influence within the channel", met: Math.abs(s.strait.influence) < 50, detail: `${signed(s.strait.influence)} (needs −50 to +50)` },
    { label: "Sovereignty above 50", met: s.strait.sovereignty > 50, detail: `${s.strait.sovereignty} now` },
    { label: "Hold the Granada, Andalusia and Murcia areas", met: s.strait.areas ? s.strait.areas.held === s.strait.areas.total : null,
      detail: s.strait.areas ? `${s.strait.areas.held} of ${s.strait.areas.total} locations, ours or our subjects'` : "Not recorded at this checkpoint" },
  ];
  return (
    <ul className="conditions ui">
      {rows.map((r) => (
        <li key={r.label} className={r.met === null ? "unknown" : r.met ? "met" : "unmet"}>
          <span className="icon" aria-hidden="true">{r.met === null ? "?" : r.met ? "✓" : "✕"}</span>
          <span className="label">{r.label}</span>
          <span className="state">{r.met === null ? "Unknown" : r.met ? "Met" : "Not met"}</span>
          <span className="detail">{r.detail}</span>
        </li>
      ))}
    </ul>
  );
}
