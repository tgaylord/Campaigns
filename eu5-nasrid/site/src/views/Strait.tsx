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

  // Event labels sit in lanes in the southern water, each lane taking the next label that fits.
  const lanes = useMemo(() => {
    const ends: number[] = [];
    return marks.map((e) => {
      const xx = x(yearFrac(e.date));
      const w = 9 + (EVENT_LABEL[e.type].length + e.title.length + 2) * 6.3;
      let lane = ends.findIndex((end) => end < xx - 6);
      if (lane === -1) { lane = ends.length; ends.push(0); }
      ends[lane] = xx + w;
      return { e, lane, xx };
    });
  }, [marks, x]);

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
            <text x={W - 70} y={y(-50) + 18} className="channel-label" textAnchor="end">The channel: influence between −50 and +50</text>

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
              <g key={yy} className="year" transform={`translate(${x(yy)},${TOP - 26})`}>
                <line y1={18} y2={BOTTOM - TOP + 52} />
                <text textAnchor="middle" className="ar">{arabicDigits(hijri(`${yy}-06-01`).y)}</text>
                <text textAnchor="middle" y={14} className="g">{yy}</text>
              </g>
            ))}

            {lanes.filter((l) => l.lane < 3).map(({ e, lane, xx }) => {
              const ly = y(62) + lane * 26;
              return (
                <g key={e.id} className="buoy">
                  <line x1={xx} x2={xx} y1={y(0) + 4} y2={ly - 4} />
                  <circle cx={xx} cy={y(0)} r={3.5} />
                  <path d={`M${xx},${ly - 5} l5,5 l-5,5 l-5,-5 Z`} />
                  <text x={xx + 9} y={ly + 4}>{EVENT_LABEL[e.type]}: {e.title}</text>
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
    { label: "Hold the Granada, Andalusia and Murcia areas", met: null, detail: "Read from saves once the parser exists" },
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
