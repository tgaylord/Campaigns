import { useEffect, useState, type ReactNode } from "react";
import { EntityLink } from "./bits";
import { folioFor, ageWords, PROV_WORD, type Gloss, type Record, type Folio } from "../lib/folio";
import { reignAt, regnalYear, type Leaf } from "../lib/codex";
import { namesHtml, nameMode, setNameMode } from "../lib/names";
import { hijri, western, nf, personById } from "../lib/data";
import "./folio.css";

/*
 * A leaf set as a glossed folio: the text in the middle, who-and-where in the left margin, the record
 * in the right, the realm as the entry opens at the head. Margins are a density the reader picks:
 * names (the default, for a reader meeting the book), full (the record and its provenance, for the
 * writer), or the text alone. On a phone the margins fold under each paragraph.
 */
export type Density = "names" | "full" | "text";
const KEY = "folio.density";
const readDensity = (): Density => { try { const v = localStorage.getItem(KEY); return v === "full" || v === "text" ? v : "names"; } catch { return "names"; } };

export function useDensity(): [Density, (d: Density) => void] {
  const [d, setD] = useState<Density>("names");
  useEffect(() => { setD(readDensity()); }, []);
  return [d, (v) => { setD(v); try { localStorage.setItem(KEY, v); } catch { /* fine without */ } }];
}

export function DensityBar({ density, setDensity }: { density: Density; setDensity: (d: Density) => void }) {
  const names = nameMode();
  const opt = (v: Density, label: string, title: string) => <button aria-pressed={density === v} onClick={() => setDensity(v)} title={title}>{label}</button>;
  return (
    <div className="density ui">
      <div role="group" aria-label="Margins">
        <span className="l">Margins</span>
        {opt("names", "Names", "Who and where, beside the line that names them")}
        {opt("full", "Full", "Also the record each passage rests on, and how we know it")}
        {opt("text", "Text only", "The page without margins")}
      </div>
      <div role="group" aria-label="Names">
        <span className="l">Names</span>
        <button aria-pressed={names === "court"} onClick={() => setNameMode("court")}>The court's</button>
        <button aria-pressed={names === "plain"} onClick={() => setNameMode("plain")}>Plain</button>
      </div>
    </div>
  );
}

/** The realm as the entry opens: from the last save before the earliest thing the leaf tells. */
export function RealmHead({ f }: { f: Folio }) {
  const s = f.headSnap;
  if (!s) return null;
  const r = reignAt(f.opening);
  const ruler = r ? personById.get(r.person.id) : undefined;
  const body = (
    <>
      <p className="rh-line">
        {ruler && <span className="rh-reign">{ruler.name}, {ordinal(regnalYear(f.opening, r!))} year</span>}
        <span className={f.silent ? "stale" : ""}>
          {nf.format(s.locations)} towns · {nf.format(s.population.total)} souls
          {s.economy && <> · treasury {nf.format(Math.round(s.economy.treasury))} · {Math.round(s.economy.income)} in, {Math.round(s.economy.expenses)} out</>}
          {s.wars.length > 0 && <> · {s.wars.length === 1 ? "one war" : `${s.wars.length} wars`}</>}
          {f.silent && <> (as of {western(s.date)})</>}
        </span>
      </p>
      <p className="rh-note">
        The realm as this entry opens ({western(f.opening)}), as last reckoned {western(s.date)}{f.ageDays && f.ageDays > 3 ? `, ${ageWords(f.ageDays)}` : ", on this very day"}.
        {f.nextSnap && <> Next reckoning: {western(f.nextSnap.date)}.</>}
      </p>
      {f.silent && (
        <p className="rh-silence">
          The record is silent here: no save between {western(s.date)} and {f.nextSnap ? western(f.nextSnap.date) : "the present"}. The figures above are from the last reckoning
          {(f.leans.screen || f.leans.account) ? <>, and this page rests on {[f.leans.screen ? `Trent's screenshots (${f.leans.screen})` : "", f.leans.account ? `his account of play (${f.leans.account})` : ""].filter(Boolean).join(" and ")}</> : null}.
        </p>
      )}
    </>
  );
  return (
    <>
      <div className="realm-head ui">{body}</div>
      <details className="realm-head-phone ui"><summary>The realm as this entry opens{f.silent ? " (the record is silent here)" : ""}</summary>{body}</details>
    </>
  );
}

/** The body of a leaf with its margins. */
export function FolioBody({ leaf, density }: { leaf: Leaf; density: Density }) {
  const f = folioFor(leaf);
  const showL = density !== "text", showR = density === "full";
  let afterRubric = false;
  return (
    <div className={`folio-grid d-${density}`}>
      {f.blocks.map((b, i) => {
        const isRubric = /class="rubric-line"/.test(b.html);
        const cls = `fo-row${i === 0 ? " first" : ""}${afterRubric ? " after-rubric" : ""}`;
        afterRubric = isRubric;
        const gl = showL ? b.glosses : [], rc = showR ? b.records : [];
        return (
          <div className={cls} key={i} id={`p${i + 1}`}>
            <aside className="fo-l" aria-label={gl.length ? "Who and where" : undefined}>{gl.map((g) => <GlossView key={g.kind + g.id} g={g} />)}</aside>
            <div className="fo-p">
              {showR && !isRubric && <a className="fo-n ui" href={`#p${i + 1}`} aria-label={`Paragraph ${i + 1}`}>{i + 1}</a>}
              <div className="leaf-body codex-body" dangerouslySetInnerHTML={{ __html: namesHtml(b.html) }} />
              {(gl.length > 0 || rc.length > 0) && (
                <details className="fo-inline ui">
                  <summary>{[gl.length ? `${gl.length} ${gl.length === 1 ? "name" : "names"}` : "", rc.length ? `${rc.length} ${rc.length === 1 ? "record" : "records"}` : ""].filter(Boolean).join(" · ")}</summary>
                  {gl.map((g) => <GlossView key={g.kind + g.id} g={g} />)}
                  {rc.map((r) => <RecordView key={r.ev.id} r={r} />)}
                </details>
              )}
            </div>
            <aside className="fo-r" aria-label={rc.length ? "On what authority" : undefined}>{rc.map((r) => <RecordView key={r.ev.id} r={r} />)}</aside>
          </div>
        );
      })}
    </div>
  );
}

/** What couldn't be pinned to a paragraph, and the realm at the close (full density). */
export function FolioFoot({ leaf, density }: { leaf: Leaf; density: Density }) {
  if (density !== "full") return null;
  const f = folioFor(leaf);
  const a = f.headSnap, b = f.closeSnap;
  return (
    <div className="folio-foot ui">
      {f.loose.length > 0 && (
        <section>
          <h3>Also drawn on</h3>
          {f.loose.map((r) => <RecordView key={r.ev.id} r={r} />)}
        </section>
      )}
      {a && b && (
        <section>
          <h3>The realm at the close</h3>
          <p>From the save of {western(a.date)} to that of {western(b.date)}: towns {nf.format(a.locations)} to {nf.format(b.locations)}, souls {nf.format(a.population.total)} to {nf.format(b.population.total)}{a.economy && b.economy ? `, treasury ${nf.format(Math.round(a.economy.treasury))} to ${nf.format(Math.round(b.economy.treasury))}` : ""}.</p>
        </section>
      )}
    </div>
  );
}

function GlossView({ g }: { g: Gloss }) {
  const plainMode = nameMode() === "plain";
  const line = (main: ReactNode, sub?: ReactNode, extra?: ReactNode) => <div className={`gl gl-${g.kind}`}><div className="gm">{main}</div>{sub && <div className="gs">{sub}</div>}{extra}</div>;
  if (g.kind === "person") {
    const bits = [g.unborn ? "not yet born" : g.age !== null ? `aged ${g.age}` : null, g.station, g.parent, g.died ? `died ${western(g.died)}` : null].filter(Boolean);
    return line(<><EntityLink kind="person" id={g.id}>{g.p.name}</EntityLink>{g.p.nameArabic && <span className="gar ar"> {g.p.nameArabic}</span>}</>, bits.join(" · "));
  }
  if (g.kind === "place") {
    const status = g.held === null ? null : g.held ? (g.since ? `the crown's since ${g.since.slice(0, 4)}` : "the crown's") : "not the crown's on this date";
    return line(<><EntityLink kind="place" id={g.id}>{plainMode ? g.plain : g.name}</EntityLink><span className="gs-inline"> {plainMode ? `the chronicle's ${g.name}` : g.plain}</span></>, status);
  }
  if (g.kind === "war") return line(<EntityLink kind="war" id={g.id}>{g.name}</EntityLink>, `begun ${western(g.start)}${g.ended ? `; ended ${western(g.ended)}${g.outcome ? `, ${g.outcome}` : ""}` : ""}`);
  if (g.kind === "realm") return line(<>{plainMode ? g.plain : g.court}</>, plainMode ? `the chronicle's ${g.court}` : g.plain);
  return line(<>{plainMode ? g.plain : g.court}</>, g.gloss);
}

function RecordView({ r }: { r: Record }) {
  const h = hijri(r.ev.date);
  const t = r.ev.title.length > 150 ? r.ev.title.slice(0, 148).replace(/[ ,;:]+\S*$/, "") + "…" : r.ev.title;
  return (
    <div className="rec">
      <div className="rd">{h.d} {h.month} {h.y} · {western(r.ev.date)}</div>
      <div className="rt" title={r.ev.title}>{t}</div>
      <div className="rp">{r.how.map((x) => <span key={x} className={`prov p-${x}`}>{PROV_WORD[x]}</span>)}</div>
    </div>
  );
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as { [k: number]: string })[n % 10] ?? "th"}`;
