import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { scaleLinear } from "d3-scale";
import { line, area, stack, stackOffsetExpand, curveMonotoneX } from "d3-shape";
import {
  snapshots, events, people, wars, eras, chronicle, yearFrac, year, hijri, arabicDigits, western,
  estateColor, ESTATE_ORDER, EVENT_LABEL,
} from "../lib/data";
import { PageHead } from "../components/bits";
import "./scroll.css";

const PX_PER_YEAR = 150; // the campaign moves a few months per session: give each year room
/** Books may overlap: each takes the first row free when it opens. */
const ERA_ROW = new Map<string, number>();
{
  const rowEnds: string[] = [];
  [...eras].sort((a, b) => a.start.localeCompare(b.start)).forEach((e) => {
    let r = rowEnds.findIndex((end) => end !== "open" && end <= e.start);
    if (r < 0) r = rowEnds.length;
    rowEnds[r] = e.end ?? "open";
    ERA_ROW.set(e.id, r);
  });
}
const ERA_ROWS = Math.max(1, ...[...ERA_ROW.values()].map((r) => r + 1));
const BANDS = [
  { id: "years", h: 54 },
  { id: "eras", h: 16 + 30 * ERA_ROWS, label: "Books of the chronicle" },
  { id: "reigns", h: 70, label: "Reigns" },
  { id: "wars", h: 64, label: "Wars" },
  { id: "strait", h: 90, label: "The Strait" },
  { id: "estates", h: 90, label: "The estates" },
  { id: "chronicle", h: 100, label: "The chronicle" },
  { id: "events", h: 56, label: "Events" },
];

const EVENT_GROUP: Record<string, string> = {
  war_declared: "war", battle: "war", siege: "war", peace: "war",
  ruler_change: "court", birth: "court", death: "court", marriage: "court",
  estate_change: "realm", law_change: "realm", reform: "realm", territory_change: "realm",
  strait_change: "strait", gc_change: "strait", situation: "strait", formable: "strait", player_note: "court",
};

/** The illuminated initial: the first letter after the chronicle's "Of the". */
const initialOf = (title: string) => title.replace(/^Of (the )?/, "").replace(/^(The|A)\s+/, "")[0]?.toUpperCase() ?? "";

export default function Scroll() {
  const ref = useRef<HTMLDivElement>(null);
  // How far the roll is scrolled: the band names and bar labels stay pinned to the left edge.
  const GUT = 150;
  const gutterRef = useRef<SVGGElement>(null);
  const frame = useRef(0);
  const dates = [
    ...snapshots.map((s) => s.date), ...events.map((e) => e.date), ...chronicle.map((c) => c.date),
    ...eras.map((e) => e.start),
  ];
  const t0 = Math.floor(Math.min(...dates.map(yearFrac))) - 1;
  const t1 = Math.ceil(Math.max(...dates.map(yearFrac))) + 2;
  const W = (t1 - t0) * PX_PER_YEAR + 180;
  const x = useMemo(() => scaleLinear().domain([t0, t1]).range([160, W - 20]), [t0, t1, W]);
  const tops: Record<string, number> = {};
  let acc = 0;
  BANDS.forEach((b) => { tops[b.id] = acc; acc += b.h; });
  const H = acc;
  // "Now" is the latest thing recorded: a checkpoint, an event or an entry, whichever is newest.
  const end = dates.length ? dates.reduce((m, d) => (yearFrac(d) > yearFrac(m) ? d : m)) : `${t1}-01-01`;

  // Chronicle titles take the first of three lines where they don't overlap a neighbour;
  // a title with no room shows on hover only.
  const chronLabels = useMemo(() => {
    const used: [number, number][][] = [[], [], []];
    // Newest first, so the latest entries are the ones that keep their titles.
    return [...chronicle].reverse().map((c) => {
      const xx = x(yearFrac(c.date));
      const short = c.title.replace(/^Of (the )?/, "");
      const label = short.length > 30 ? short.slice(0, 29).replace(/[\s,]+\S*$/, "") + "…" : short;
      const half = (label.length * 5.7) / 2 + 6;
      const lane = used.findIndex((l) => l.every(([a, b]) => xx + half < a || xx - half > b));
      if (lane >= 0) used[lane].push([xx - half, xx + half]);
      return { c, xx, lane, label: label[0].toUpperCase() + label.slice(1) };
    });
  }, [x]);

  /** Keep the gutter and the pinned bar labels in place as the roll scrolls. This writes to the
   *  DOM directly, once per frame, instead of re-rendering the whole roll on every scroll event. */
  const placePinned = () => {
    const el = ref.current;
    if (!el) return;
    const s = el.scrollLeft;
    gutterRef.current?.setAttribute("transform", `translate(${s},0)`);
    el.querySelectorAll<SVGTextElement>("text.pinned").forEach((t) => {
      const a = +(t.dataset.a ?? 0), b = +(t.dataset.b ?? 0);
      t.setAttribute("x", String(Math.max(a + 8, Math.min(s + GUT + 12, b - 60))));
    });
  };
  const onScroll = () => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => { frame.current = 0; placePinned(); });
  };

  // Vertical wheel scrolls the roll sideways (line- and page-mode wheels are converted to pixels).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1;
      el.scrollLeft += e.deltaY * unit;
      e.preventDefault();
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.scrollLeft = el.scrollWidth;
    placePinned();
    return () => { el.removeEventListener("wheel", wheel); cancelAnimationFrame(frame.current); };
  }, []);
  useLayoutEffect(() => { placePinned(); });

  const reigns = people.flatMap((p) => p.reigns.map((r) => ({ p, from: r.from, to: r.to ?? end })));
  const warLanes: number[] = [];
  const warRows = wars.map((w) => {
    const a = yearFrac(w.start), b = yearFrac(w.end ?? end);
    let lane = warLanes.findIndex((e) => e < a);
    if (lane === -1) { lane = warLanes.length; warLanes.push(0); }
    warLanes[lane] = b + 0.5;
    return { w, a, b, lane };
  });

  const straitSnaps = snapshots.filter((s) => s.strait);
  const sy = scaleLinear().domain([-100, 100]).range([tops.strait + 12, tops.strait + BANDS[4].h - 12]);
  const straitPath = line<(typeof straitSnaps)[number]>().x((s) => x(yearFrac(s.date))).y((s) => sy(s.strait!.influence)).curve(curveMonotoneX)(straitSnaps);

  const ids = ESTATE_ORDER.filter((id) => snapshots.some((s) => s.estates.some((e) => e.id === id && e.power != null)));
  const rows = snapshots.filter((s) => s.estates.some((e) => e.power != null)).map((s) => {
    const r: Record<string, number> = { t: yearFrac(s.date) };
    ids.forEach((id) => { r[id] = s.estates.find((e) => e.id === id)?.power ?? 0; });
    return r;
  });
  const ey = scaleLinear().domain([0, 1]).range([tops.estates + BANDS[5].h - 8, tops.estates + 8]);
  const layers = rows.length > 1 ? stack<Record<string, number>>().keys(ids).offset(stackOffsetExpand)(rows) : [];
  const estArea = area<any>().x((d) => x(d.data.t)).y0((d) => ey(d[0])).y1((d) => ey(d[1])).curve(curveMonotoneX);

  /** A bar's label sits at its start, or pinned just right of the gutter while the bar runs on;
   *  placePinned() moves it as the roll scrolls. */
  const pin = (a: number, b: number) => ({ className: "pinned", "data-a": a, "data-b": b, x: a + 8 });

  const years: number[] = [];
  for (let yy = Math.ceil(t0); yy <= t1; yy++) years.push(yy);

  return (
    <div className="scroll-page">
      <div className="page" style={{ paddingBottom: "1rem" }}>
        <PageHead
          title="The Long Scroll"
          ar="الدرج"
          lede="The whole campaign on one roll: reigns, wars, the Strait, the estates and the chronicle, year by year. Scroll sideways, or use the mouse wheel; it opens at the present."
        />
      </div>

      <div className="roll-wrap">
        <div className="roller left" aria-hidden="true" />
        <div className="roll" ref={ref} tabIndex={0} onScroll={onScroll} aria-label="The long scroll of the campaign, scrollable sideways">
          <svg width={W} height={H} role="img" aria-label="Timeline of the campaign">
            <defs>
              <pattern id="roll-grain" width="7" height="7" patternUnits="userSpaceOnUse">
                <rect width="7" height="7" fill="#eadcbf" />
                <circle cx="2" cy="3" r="0.6" fill="#b89a64" fillOpacity="0.25" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#roll-grain)" />

            {BANDS.map((b, k) => (
              <g key={b.id}>
                {k > 0 && <line x1={0} x2={W} y1={tops[b.id]} y2={tops[b.id]} className="band-rule" />}
              </g>
            ))}

            {years.map((yy) => (
              <g key={yy} className={`yr ${yy % 10 === 0 ? "decade" : ""}`}>
                <line x1={x(yy)} x2={x(yy)} y1={tops.years + 40} y2={H} />
                {(yy % 5 === 0 || PX_PER_YEAR >= 60) && (
                  <>
                    <text x={x(yy)} y={22} textAnchor="middle" className="ah">{arabicDigits(hijri(`${yy}-01-01`).y)}</text>
                    <text x={x(yy)} y={38} textAnchor="middle" className="g">{yy}</text>
                  </>
                )}
              </g>
            ))}

            {eras.map((e) => {
              const a = x(yearFrac(e.start)), b = x(yearFrac(e.end ?? end));
              return (
                <Link key={e.id} to={`/chronicle#era-${e.id}`}>
                  <g className="era">
                    <rect x={a} y={tops.eras + 10 + 30 * (ERA_ROW.get(e.id) ?? 0)} width={Math.max(2, b - a)} height={26} />
                    <text {...pin(a, b)} y={tops.eras + 28 + 30 * (ERA_ROW.get(e.id) ?? 0)}>{e.title}</text>
                  </g>
                </Link>
              );
            })}

            {reigns.map(({ p, from, to }) => {
              const a = x(yearFrac(from)), b = x(yearFrac(to));
              if (b < 160) return null;
              const aa = Math.max(a, 160);
              return (
                <Link key={`${p.id}-${from}`} to={`/people/${p.id}`} data-kind="person" data-id={p.id}>
                  <g className="reign">
                    <rect x={aa} y={tops.reigns + 12} width={Math.max(2, b - aa)} height={46} />
                    <text {...pin(aa, b)} y={tops.reigns + 36} className="pinned ar-name">{p.nameArabic}</text>
                    <text {...pin(aa, b)} y={tops.reigns + 52} className="pinned la-name">{p.name}</text>
                  </g>
                </Link>
              );
            })}

            {warRows.map(({ w, a, b, lane }) => (
              <Link key={w.id} to={`/wars/${w.id}`} data-kind="war" data-id={w.id}>
                <g className="war">
                  <rect x={x(a)} y={tops.wars + 22 + lane * 26} width={Math.max(4, x(b) - x(a))} height={8} rx={2} />
                  <text {...pin(x(a) - 6, x(b))} y={tops.wars + 17 + lane * 26}>{w.name}</text>
                </g>
              </Link>
            ))}

            <rect x={160} width={W - 180} y={sy(-50)} height={sy(50) - sy(-50)} className="strait-channel" />
            <line x1={160} x2={W - 20} y1={sy(0)} y2={sy(0)} className="strait-mid" />
            {straitPath && <path d={straitPath} className="strait-line" />}
            {straitSnaps.map((s) => (
              <circle key={s.id} cx={x(yearFrac(s.date))} cy={sy(s.strait!.influence)} r={4} className="strait-dot">
                <title>{`${western(s.date)}: influence ${s.strait!.influence}, sovereignty ${s.strait!.sovereignty}`}</title>
              </circle>
            ))}

            {layers.map((l) => <path key={l.key} d={estArea(l as any) ?? ""} fill={estateColor(l.key, "folio")} fillOpacity={0.85} stroke="#eadcbf" strokeWidth={1} />)}

            {chronLabels.map(({ c, xx, lane, label }) => {
              return (
                <Link key={c.id} to={`/chronicle/${c.id}`} className="chron">
                  <g transform={`translate(${xx},${tops.chronicle + 24})`}>
                    <circle r={10} />
                    <text y={4} textAnchor="middle" className="initial">{initialOf(c.title)}</text>
                    {lane >= 0 && <text y={30 + lane * 17} x={0} textAnchor="middle" className="chron-title">{label}</text>}
                    <title>{`${hijri(c.date).text} AH: ${c.title}`}</title>
                  </g>
                </Link>
              );
            })}

            {events.map((e) => {
              const xx = x(yearFrac(e.date));
              return (
                <g key={e.id} className={`ev ${EVENT_GROUP[e.type] ?? "realm"}`}>
                  <line x1={xx} x2={xx} y1={tops.events + 14} y2={tops.events + 42} />
                  <title>{`${western(e.date)}. ${EVENT_LABEL[e.type]}: ${e.title}`}</title>
                </g>
              );
            })}

            <g className="gutter" ref={gutterRef}>
              <rect width={GUT} height={H} />
              <line x1={GUT} x2={GUT} y1={0} y2={H} />
              {BANDS.map((b) => b.label && (
                <text key={b.id} x={14} y={tops[b.id] + 22} className="band-label">{b.label}</text>
              ))}
              <text x={14} y={tops.strait + 42} className="axis-note">Up: toward Castile</text>
              <text x={14} y={tops.strait + 58} className="axis-note">Down: toward Morocco</text>
              <text x={14} y={tops.estates + 42} className="axis-note">Share of power</text>
            </g>
          </svg>
        </div>
        <div className="roller right" aria-hidden="true" />
      </div>

      <div className="page scroll-key ui" style={{ paddingTop: "1rem" }}>
        <span><i className="k war" /> War</span>
        <span><i className="k court" /> Court and dynasty</span>
        <span><i className="k realm" /> Laws, reforms, estates</span>
        <span><i className="k strait" /> The Strait and situations</span>
        <span className="muted">Hover a mark for its event. {year(`${t0 + 1}-01-01`)}–{year(end)}.</span>
      </div>
    </div>
  );
}
