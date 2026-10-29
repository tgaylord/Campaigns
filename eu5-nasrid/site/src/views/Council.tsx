import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { area, stack, stackOrderNone, stackOffsetExpand, curveMonotoneX } from "d3-shape";
import { snapshots, events, estateColor, ESTATE_ORDER, yearFrac, year, hijri, arabicDigits, western, EVENT_LABEL } from "../lib/data";
import { PageHead, CheckpointSelect, StarRule } from "../components/bits";
import { Charters, Laws, Values, Assembly } from "./Charters";
import "./council.css";

/** Seat order around the arc: the crown sits in the middle of the council. */
const ARC_ORDER = ["nobles", "clergy", "crown", "burghers", "peasants", "tribes", "dhimmi", "cossacks"];
const SEATS = 100;

function mood(sat: number | null) {
  if (sat == null) return { word: "The throne", cls: "throne" };
  if (sat >= 55) return { word: "Content", cls: "content" };
  if (sat >= 45) return { word: "Uneasy", cls: "uneasy" };
  if (sat >= 35) return { word: "Restless", cls: "restless" };
  return { word: "Mutinous", cls: "mutinous" };
}

/** Hemicycle seat positions, filled row by row from the left. */
function hemicycle(n: number, r0: number, r1: number) {
  const rows = 6;
  const per = Array.from({ length: rows }, (_, k) => r0 + ((r1 - r0) * k) / (rows - 1));
  const total = per.reduce((a, r) => a + r, 0);
  const counts = per.map((r) => Math.round((n * r) / total));
  counts[rows - 1] += n - counts.reduce((a, b) => a + b, 0);
  const seats: { x: number; y: number; a: number }[] = [];
  per.forEach((r, k) => {
    for (let j = 0; j < counts[k]; j++) {
      const a = Math.PI - (Math.PI * (j + 0.5)) / counts[k];
      seats.push({ x: r * Math.cos(a), y: -r * Math.sin(a), a });
    }
  });
  return seats.sort((p, q) => q.a - p.a);
}

export default function Council() {
  const [i, setI] = useState(snapshots.length - 1);
  const snap = snapshots[i];
  const seats = useMemo(() => hemicycle(SEATS, 150, 300), []);

  if (!snapshots.some((s) => s.estates.length)) return <CouncilWaiting seats={seats} />;

  // Largest-remainder allocation of 100 seats by share of power.
  const present = ARC_ORDER.filter((id) => snap.estates.some((e) => e.id === id))
    .concat(snap.estates.map((e) => e.id).filter((id) => !ARC_ORDER.includes(id)));
  // The save doesn't store power shares; without them the seats stay empty and only the moods show.
  const hasPower = snap.estates.some((e) => e.power != null);
  const powers = present.map((id) => (hasPower ? snap.estates.find((e) => e.id === id)!.power ?? 0 : 0));
  const sum = powers.reduce((a, b) => a + b, 0) || 1;
  const raw = powers.map((p) => (p / sum) * SEATS);
  const alloc = raw.map(Math.floor);
  if (hasPower) raw.map((r, k) => ({ k, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f)
    .slice(0, SEATS - alloc.reduce((a, b) => a + b, 0)).forEach(({ k }) => alloc[k]++);
  const owner: string[] = [];
  present.forEach((id, k) => { for (let j = 0; j < alloc[k]; j++) owner.push(id); });

  const estates = present.map((id) => snap.estates.find((e) => e.id === id)!).filter((e) => hasPower || e.id !== "crown");
  const crown = snap.estates.find((e) => e.id === "crown");
  const pct = (v: number | null) => (v == null ? "" : `${v}%`);

  return (
    <div className="page council-page">
      <PageHead
        title="The Council"
        ar="الديوان"
        lede="A hundred seats, divided as power is divided. The crown sits at the centre of the arc; the estates press in on either side. Move through the checkpoints and watch them gain and lose ground."
      />

      <div className="council-stage">
        <svg viewBox="-340 -330 680 380" className="hemi" role="img"
          aria-label={hasPower ? `The council at ${western(snap.date)}: ${estates.map((e) => `${e.name} ${pct(e.power)}`).join(", ")}` : `The council at ${western(snap.date)}: shares of power not recorded`}>
          {seats.map((s, k) => owner[k]
            ? <circle key={k} className="seat" r={9.5} style={{ transform: `translate(${s.x}px, ${s.y}px)`, fill: estateColor(owner[k], "night") }} />
            : <circle key={k} className="seat empty" r={9.5} style={{ transform: `translate(${s.x}px, ${s.y}px)` }} />)}
          <g className="throne" transform="translate(0,-20)">
            <path d="M-34,10 v-46 a34,34 0 0 1 68,0 v46 Z" />
            <path d="M-20,10 v-30 a20,20 0 0 1 40,0 v30" className="arch" />
            <text y={48} textAnchor="middle" className="crown-pct">{crown ? pct(crown.power) : ""}</text>
            {hasPower && <text y={68} textAnchor="middle" className="crown-label">power of the crown</text>}
          </g>
        </svg>

        <ul className="estates-list ui">
          {estates.map((e) => {
            const m = mood(e.satisfaction);
            return (
              <li key={e.id}>
                <span className="swatch" style={{ background: estateColor(e.id, "night") }} />
                <span className="name">{e.name}</span>
                <span className="pow num">{e.estimated && e.power != null ? "≈ " : ""}{pct(e.power)}</span>
                <span className={`mood ${m.cls}`}>
                  {e.satisfaction != null && <span className="meter" aria-hidden="true"><i style={{ width: `${e.satisfaction}%` }} /></span>}
                  {m.word}{e.satisfaction != null ? `, ${e.satisfaction}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {hasPower && snap.estates.some((e) => e.estimated) && (
        <p className="council-note muted">
          <span className="est-tag ui">Estimated</span>{" "}
          {snap.estates.some((e) => !e.estimated && e.power != null) ? (
            <>
              Only the{" "}
              {snap.estates
                .filter((e) => !e.estimated && e.power != null)
                .map((e) => e.name)
                .join(" and ")}{" "}
              share was read off the screen at this checkpoint. The rest, marked ≈, are worked out from the save by the
              game's own rules and scaled to that screen's total.
            </>
          ) : (
            <>
              No estates screen was read at this checkpoint, so the shares are worked out from the save by the game's
              own rules, calibrated on the nearest reading. Expect them within a point or so of the game's figures.
            </>
          )}
        </p>
      )}
      {!hasPower && (
        <p className="council-note muted">
          The seats wait to be filled: the save records each estate's mood but not its share of power, which the game
          works out as it runs. The shares come from the estates screen at a checkpoint.
        </p>
      )}

      <div className="council-date">
        <span className="ar">{hijri(snap.date).arabic}</span>
        <span className="ui">{western(snap.date)}</span>
      </div>
      <CheckpointSelect value={i} onChange={setI} />

      <StarRule />
      <Charters snap={snap} />
      <div className="council-pair">
        <Assembly snap={snap} />
        <Values snap={snap} />
      </div>
      <Laws snap={snap} />

      <StarRule />
      {snapshots.filter((s) => s.estates.some((e) => e.power != null)).length >= 2 && <><Stream /><StarRule /></>}
      <MoodGrid />
    </div>
  );
}

/** Share of power over the whole campaign, with the reforms and quarrels that moved it. */
function Stream() {
  const W = 1300, H = 340, padL = 40, padR = 150, padT = 24, padB = 34;
  const withPower = snapshots.filter((s) => s.estates.some((e) => e.power != null));
  const ids = ESTATE_ORDER.filter((id) => withPower.some((s) => s.estates.some((e) => e.id === id)));
  if (withPower.length < 2) return null;
  const rows = withPower.map((s) => {
    const r: Record<string, number> = { t: yearFrac(s.date) };
    ids.forEach((id) => { r[id] = s.estates.find((e) => e.id === id)?.power ?? 0; });
    return r;
  });
  const x = scaleLinear().domain([rows[0].t, rows[rows.length - 1].t]).range([padL, W - padR]);
  const y = scaleLinear().domain([0, 1]).range([H - padB, padT]);
  const layers = stack<Record<string, number>>().keys(ids).order(stackOrderNone).offset(stackOffsetExpand)(rows);
  const shape = area<any>().x((d) => x(d.data.t)).y0((d) => y(d[0]) + 1).y1((d) => y(d[1]) - 1).curve(curveMonotoneX);
  const moves = events.filter((e) => ["estate_change", "reform", "law_change", "ruler_change"].includes(e.type));
  const years: number[] = [];
  const t0 = Math.ceil(rows[0].t), t1 = Math.floor(rows[rows.length - 1].t);
  const step = Math.max(1, Math.ceil((t1 - t0) / 8));
  for (let yy = t0; yy <= t1; yy += step) years.push(yy);

  return (
    <section>
      <h2 className="section-title">Power across the reigns</h2>
      <p className="muted" style={{ maxWidth: "44rem" }}>Each band is one estate's share of all power, checkpoint to checkpoint. The gold lines mark the moments that moved them. A solid dot above a checkpoint means its shares were read off the estates screen; a hollow one, that they were estimated from the save.</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="stream" role="img" aria-label="Share of power by estate over time">
        {layers.map((l) => (
          <path key={l.key} d={shape(l as any) ?? ""} fill={estateColor(l.key, "night")} fillOpacity={0.85} />
        ))}
        {moves.map((m) => {
          const xx = x(yearFrac(m.date));
          if (xx < padL || xx > W - padR) return null;
          return (
            <g key={m.id} className="move">
              <line x1={xx} x2={xx} y1={padT - 6} y2={H - padB} />
              <title>{`${western(m.date)}: ${m.title}`}</title>
            </g>
          );
        })}
        {layers.map((l) => {
          const last = l[l.length - 1];
          const mid = (y(last[0]) + y(last[1])) / 2;
          if (y(last[0]) - y(last[1]) < 12) return null;
          return <text key={l.key} x={W - padR + 10} y={mid + 4} className="end-label">{withPower[withPower.length - 1].estates.find((e) => e.id === l.key)?.name}</text>;
        })}
        {withPower.map((s) => {
          const est = s.estates.some((e) => e.estimated);
          return (
            <g key={s.id} className={`ckpt ${est ? "est" : ""}`}>
              <circle cx={x(yearFrac(s.date))} cy={padT - 12} r={5} />
              <title>{`${western(s.date)}: ${est ? "estimated from the save" : "read off the estates screen"}`}</title>
            </g>
          );
        })}
        {years.map((yy) => (
          <text key={yy} x={x(yy)} y={H - 10} textAnchor="middle" className="tick">{yy} <tspan className="ah">{arabicDigits(hijri(`${yy}-06-01`).y)}</tspan></text>
        ))}
      </svg>
      <ul className="moves-list ui">
        {moves.map((m) => <li key={m.id}><span className="d">{year(m.date)}</span><span className="t">{EVENT_LABEL[m.type]}</span>{m.title}</li>)}
      </ul>
    </section>
  );
}

/** Satisfaction of every estate at every checkpoint: red is unhappy, blue content, grey indifferent. */
function MoodGrid() {
  const cols = snapshots.filter((s) => s.estates.length);
  const ids = ESTATE_ORDER.filter((id) => id !== "crown" && cols.some((s) => s.estates.some((e) => e.id === id && e.satisfaction != null)));
  const color = (v: number) => {
    // Diverging around 50: red #c0442e ← grey #4a5070 → blue #3987e5
    const t = Math.max(-1, Math.min(1, (v - 50) / 25));
    const mix = (a: number[], b: number[], k: number) => a.map((c, j) => Math.round(c + (b[j] - c) * k));
    const grey = [74, 80, 112], red = [192, 68, 46], blue = [57, 135, 229];
    const [r, g, b] = t < 0 ? mix(grey, red, -t) : mix(grey, blue, t);
    return `rgb(${r},${g},${b})`;
  };
  return (
    <section>
      <h2 className="section-title">The temper of the estates</h2>
      <p className="muted" style={{ maxWidth: "44rem" }}>Satisfaction at each checkpoint. Red runs below 50 toward revolt; blue runs above it toward loyalty.</p>
      <div className="mood-grid ui" style={{ gridTemplateColumns: `9rem repeat(${cols.length}, minmax(3.2rem, 1fr))` }}>
        <span />
        {cols.map((s) => <span key={s.id} className="col-head">{western(s.date)}</span>)}
        {ids.map((id) => {
          const name = snapshots.flatMap((s) => s.estates).find((e) => e.id === id)!.name;
          return [
            <span key={`${id}-n`} className="row-head"><i style={{ background: estateColor(id, "night") }} />{name}</span>,
            ...cols.map((s) => {
              const v = s.estates.find((e) => e.id === id)?.satisfaction;
              return <span key={`${id}-${s.id}`} className="cell" style={{ background: v != null ? color(v) : "transparent" }}>{v ?? ""}</span>;
            }),
          ];
        })}
      </div>
    </section>
  );
}

/** Before any checkpoint has recorded the estates: the chamber stands empty. */
function CouncilWaiting({ seats }: { seats: { x: number; y: number }[] }) {
  return (
    <div className="page council-page">
      <PageHead
        title="The Council"
        ar="الديوان"
        lede="A hundred seats, divided as power is divided, with the crown at the centre of the arc. The chamber fills once a checkpoint records the estates."
      />
      <div className="council-stage">
        <svg viewBox="-340 -330 680 380" className="hemi" role="img" aria-label="The council chamber, empty">
          {seats.map((s, k) => <circle key={k} cx={s.x} cy={s.y} r={9.5} className="seat empty" />)}
          <g className="throne" transform="translate(0,-20)">
            <path d="M-34,10 v-46 a34,34 0 0 1 68,0 v46 Z" />
            <path d="M-20,10 v-30 a20,20 0 0 1 40,0 v30" className="arch" />
          </g>
        </svg>
        <p className="council-empty">
          No estate figures yet. The start-date save was taken before the game's first months had run, and the game only
          settles each estate's power and satisfaction after a few monthly ticks. The first checkpoint after that fills
          this chamber, and every one after it moves the seats.
        </p>
      </div>
    </div>
  );
}
