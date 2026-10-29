import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { hijri, western, arabicDigits, snapshots, year } from "../lib/data";

const ROUTE = { person: "people", place: "places", war: "wars" } as const;

/** A link to a record, with the shared hover card. */
export function EntityLink({ kind, id, children, className = "" }: { kind: "person" | "place" | "war"; id: string; children: ReactNode; className?: string }) {
  return (
    <Link to={`/${ROUTE[kind]}/${id}`} className={`entity ${className}`} data-kind={kind} data-id={id} data-router="1">
      {children}
    </Link>
  );
}

/** "28 Shaʿbān 737 AH (1 April 1337)" */
export function DualDate({ date, short = false }: { date: string; short?: boolean }) {
  const h = hijri(date);
  return (
    <time dateTime={date} className="dual-date">
      <span style={{ color: "var(--gilt)", fontStyle: "italic" }}>{h.text}{short ? "" : " AH"}</span>{" "}
      <span style={{ color: "var(--mist)" }}>({western(date)})</span>
    </time>
  );
}

export function PageHead({ title, ar, lede }: { title: string; ar: string; lede?: ReactNode }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      <div className="ar-title" aria-hidden="true">{ar}</div>
      {lede && <p className="lede">{lede}</p>}
    </header>
  );
}

/** Slider over the checkpoints, labelled with Hijri and Western years. */
export function CheckpointSelect({ value, onChange, label = "Checkpoint" }: { value: number; onChange: (i: number) => void; label?: string }) {
  const n = snapshots.length;
  if (n < 2) return null;
  const y0 = year(snapshots[0].date), y1 = year(snapshots[n - 1].date);
  const pos = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  // A tick is labelled when its year differs from the last labelled one (the selected and last are always
  // labelled), and, on a narrow screen, only when it isn't crowded against the previous label.
  const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 40rem)").matches;
  const minGap = narrow ? 18 : 6;
  const labelled: boolean[] = [];
  let lastPos = -100, lastYear = -1;
  snapshots.forEach((s, i) => {
    const must = i === value || i === n - 1 || i === 0;
    const ok = year(s.date) !== lastYear && pos(i) - lastPos >= minGap;
    labelled[i] = must || ok;
    if (labelled[i]) { lastPos = pos(i); lastYear = year(s.date); }
  });
  // the selected or last label may crowd the one before it: drop the earlier unless it is required
  for (let i = n - 1; i > 0; i--) {
    if (!labelled[i]) continue;
    let j = i - 1; while (j >= 0 && !labelled[j]) j--;
    if (j >= 0 && pos(i) - pos(j) < minGap && j !== value && j !== 0) labelled[j] = false;
  }
  return (
    <div className="cp-select">
      <label className="visually-hidden" htmlFor="cp-range">{label}</label>
      <input id="cp-range" type="range" min={0} max={n - 1} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${western(snapshots[value].date)}`} />
      <div className="ticks">
        {snapshots.map((s, i) => (
          <button key={s.id} type="button" className={`${i === value ? "on" : ""} ${labelled[i] ? "" : "dot"}`} style={{ left: `${pos(i)}%` }}
            onClick={() => onChange(i)} aria-label={western(s.date)} title={western(s.date)}>
            {labelled[i] ? <><span className="ah">{arabicDigits(hijri(s.date).y)}</span>{year(s.date)}</> : <span className="pip" aria-hidden="true" />}
          </button>
        ))}
      </div>
      <span className="visually-hidden">{y0}–{y1}</span>
    </div>
  );
}

export function StarRule() {
  return (
    <div className="star-rule" aria-hidden="true">
      <svg width="18" height="18" viewBox="-10 -10 20 20"><path d="M0-9 2.6-2.6 9 0 2.6 2.6 0 9-2.6 2.6-9 0-2.6-2.6Z" fill="currentColor" /></svg>
    </div>
  );
}
