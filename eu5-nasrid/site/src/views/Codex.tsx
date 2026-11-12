import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHead } from "../components/bits";
import { YearStrip, bk } from "../components/CodexBits";
import { leaves, books, canons, leafByAddr, totalWords, hyLabel, bookOpenIn, beginsIn, endsIn, ribbon, regnalYear, type Canon, type CanonRow, type Leaf } from "../lib/codex";
import { hijri, western } from "../lib/data";
import { HIJRI_MONTHS } from "../lib/hijri";
import "./chronicle.css";
import "./codex.css";

/*
 * The contents of the Codex: the run of the years, then the canon tables. Years run down each table;
 * each book open at the time keeps its own column; a canon closes when a book closes. Read across for
 * the order of events, down a column for one book.
 */
export default function Codex() {
  const [params] = useSearchParams();
  const find = params.get("leaf");
  const found = find ? leafByAddr.get(find) : undefined;
  const [rib, setRib] = useState<string | null>(null);
  useEffect(() => { setRib(ribbon.get()); }, []);
  const ribLeaf = rib ? leafByAddr.get(rib) : undefined;
  const [folded, setFolded] = useState(leaves.length > 200);
  const [open, setOpen] = useState<Set<number>>(new Set());
  // the ribbon's decade and the found leaf's decade stay open when the years are folded
  const keepOpen = useMemo(() => new Set([found, ribLeaf].filter(Boolean).map((l) => Math.floor(l!.hy / 10) * 10)), [found, ribLeaf]);

  useEffect(() => {
    if (!found) return;
    const t = setTimeout(() => document.getElementById(`c-${found.addr}`)?.scrollIntoView({ block: "center" }), 60);
    return () => clearTimeout(t);
  }, [found]);

  const first = leaves[0], last = leaves[leaves.length - 1];
  if (!first) return <div className="page"><h1>The Codex</h1><p className="muted">No leaves have been bound yet.</p></div>;

  return (
    <div className="page codex-contents">
      <PageHead
        title="The Codex"
        ar="السفر"
        lede={<>The whole chronicle as one bound book. Every entry is a leaf, in the order its dates fall, addressed by its Hijri date; the {numberWord(books.length)} books run through it as threads. Read it straight through, or follow one book down its column. Each leaf ends with two catchwords: the next leaf of the codex, and the next of its own book.</>}
      />
      <div className="codex-actions ui">
        <Link className="act main" to={`/codex/book/${first.book.id}`}>Begin at the first leaf</Link>
        {ribLeaf && <Link className="act" to={`/codex/${ribLeaf.addr}`}>Resume at the ribbon · {ribLeaf.label}</Link>}
        <Link className="act" to="/codex/colophon">Colophon</Link>
        <Link className="act" to="/desk">The Desk</Link>
        <span className="tally">{leaves.length} leaves · {totalWords.toLocaleString("en-GB")} words · {first.hy}–{last.hy} AH · {first.entry.date.slice(0, 4)}–{last.entry.date.slice(0, 4)}</span>
      </div>

      <section className="folio codex-sheet">
        <h2 className="sheet-title">The run of the years</h2>
        <YearStrip mark={found?.addr ?? ribLeaf?.addr} />
      </section>

      <div className="canon-bar ui">
        <p>Years run down each table, in both calendars. Each book open at the time keeps its own column, drawn while the book is open. A canon closes when a book closes.</p>
        <label><input type="checkbox" checked={folded} onChange={(e) => setFolded(e.target.checked)} /> Fold the years into decades</label>
      </div>

      {canons.map((c) => (
        <CanonTable key={c.n} canon={c} found={found} ribbon={ribLeaf} folded={folded}
          isOpen={(d) => open.has(d) || keepOpen.has(d)} toggle={(d) => setOpen((s) => { const n = new Set(s); n.has(d) ? n.delete(d) : n.add(d); return n; })} />
      ))}
    </div>
  );
}

const numberWord = (n: number) => ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"][n] ?? String(n);
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
const decadeOf = (r: CanonRow) => Math.floor((r.kind === "year" ? r.hy : r.kind === "lacuna" ? r.hy0 : r.reign.hy) / 10) * 10;

function CanonTable({ canon, found, ribbon, folded, isOpen, toggle }: {
  canon: Canon; found?: Leaf; ribbon?: Leaf; folded: boolean; isOpen: (d: number) => boolean; toggle: (d: number) => void;
}) {
  const cols = canon.books;
  const grid = { "--cols": cols.length } as CSSProperties;
  const r0 = canon.reignAtStart;
  // decades, in order, with their rows
  const decades: { d: number; rows: CanonRow[] }[] = [];
  for (const r of canon.rows) {
    const d = decadeOf(r);
    if (!decades.length || decades[decades.length - 1].d !== d) decades.push({ d, rows: [] });
    decades[decades.length - 1].rows.push(r);
  }
  const w0 = canon.leaves[0].entry.date.slice(0, 4), w1 = canon.leaves[canon.leaves.length - 1].entry.date.slice(0, 4);
  return (
    <section className="folio canon" id={`canon-${canon.n}`} aria-labelledby={`canon-${canon.n}-h`}>
      <header className="canon-h">
        <h2 id={`canon-${canon.n}-h`}>Canon {ROMAN[canon.n - 1] ?? canon.n}</h2>
        <span className="ui span">{canon.hy0}–{canon.hy1} AH · {w0}–{w1} · {canon.leaves.length} leaves</span>
        {r0 && <span className="ui reign0">Reign of {r0.person.name}, in its {ordinal(regnalYear(canon.leaves[0].entry.date, r0))} year</span>}
      </header>

      {/* desktop: the arcade */}
      <div className="arcade" style={grid} role="table" aria-label={`Canon ${canon.n}: years by book`}>
        <div className="arow heads" role="row">
          <div className="ycell" role="columnheader"><span className="visually-hidden">Year</span></div>
          {cols.map((b) => (
            <div key={b.id} className="arch" style={bk(b)} role="columnheader">
              <Link to={`/codex/book/${b.id}`}>
                <span className="ar">{b.era.titleArabic}</span>
                <span className="t">{b.short}</span>
                <span className="n ui">Book {b.n}</span>
              </Link>
            </div>
          ))}
        </div>
        {decades.map(({ d, rows }) => {
          const foldedHere = folded && !isOpen(d);
          if (foldedHere) {
            const ls = rows.flatMap((r) => (r.kind === "year" ? r.cells.flat() : []));
            if (!ls.length) return rows.filter((r) => r.kind === "reign").map((r) => <ReignRule key={`r${d}`} row={r} />);
            return (
              <div key={d} className="arow decade" role="row">
                <div className="ycell" role="rowheader"><button className="ui unfold" onClick={() => toggle(d)} aria-expanded="false">{d}s<small>{hyLabel(d).split("–")[0]}–{hyLabel(d + 9).split("–").pop()}</small></button></div>
                {cols.map((b) => {
                  const k = ls.filter((l) => l.book === b).length;
                  return <div key={b.id} className={`cell ${bookOpenIn(b, d) || bookOpenIn(b, d + 9) ? "open" : ""}`} style={bk(b)} role="cell">
                    {k > 0 && <button className="ui dots" onClick={() => toggle(d)} aria-label={`${k} leaves of ${b.name} in the ${d}s; open the decade`}>{"●".repeat(Math.min(k, 6))}<span>{k}</span></button>}
                  </div>;
                })}
              </div>
            );
          }
          return rows.map((r, i) => {
            if (r.kind === "reign") return <ReignRule key={`reign-${r.reign.from}`} row={r} />;
            if (r.kind === "lacuna") {
              const span = r.hy0 === r.hy1 ? `${r.hy0} AH · ${hyLabel(r.hy0)}` : `${r.hy0}–${r.hy1} AH · ${hyLabel(r.hy0).split("–")[0]}–${hyLabel(r.hy1).split("–").pop()}`;
              return (
                <div key={`lac-${r.hy0}`} className="arow lacuna" role="row">
                  <div className="lac-text ui" role="cell">No leaf · {span} · {r.saves ? `${r.saves} save${r.saves > 1 ? "s" : ""} read, nothing written` : "no save; the record is silent"}</div>
                </div>
              );
            }
            return (
              <div key={`y-${r.hy}`} className="arow year" role="row">
                <div className="ycell" role="rowheader">
                  {folded && i === 0 && <button className="ui refold" onClick={() => toggle(d)} aria-expanded="true">fold the {d}s</button>}
                  <span className="hy">{r.hy}</span><small className="ui">{hyLabel(r.hy)}</small>
                </div>
                {cols.map((b, ci) => (
                  <div key={b.id} className={`cell ${bookOpenIn(b, r.hy) ? "open" : ""}`} style={bk(b)} role="cell">
                    {beginsIn(b, r.hy) && <span className="chip ui">Here begins</span>}
                    {r.cells[ci].map((l) => (
                      <Link key={l.addr} id={`c-${l.addr}`} to={`/codex/${l.addr}`} className={`cl ${found === l ? "found" : ""}`}>
                        <span className="dm ui">{l.hd} {HIJRI_MONTHS[l.hm - 1]}{ribbon === l && <span className="ribbon" title="Your ribbon: the last leaf you opened">ribbon</span>}</span>
                        <span className="tt">{l.entry.title}</span>
                      </Link>
                    ))}
                    {endsIn(b, r.hy) && <span className="chip end ui">Here ends</span>}
                  </div>
                ))}
              </div>
            );
          });
        })}
      </div>

      {/* phone: lanes */}
      <ol className="lanes">
        {canon.rows.map((r) => {
          if (r.kind === "reign") return <li key={`r-${r.reign.from}`} className="lane-rule ui">Reign of {r.reign.person.name}, from {western(r.reign.from)}</li>;
          if (r.kind === "lacuna") return <li key={`l-${r.hy0}`} className="lane-lac ui">No leaf · {r.hy0}{r.hy1 !== r.hy0 ? `–${r.hy1}` : ""} AH · {r.saves ? `${r.saves} save${r.saves > 1 ? "s" : ""} read` : "the record is silent"}</li>;
          const ls = r.cells.flat().sort((a, b) => a.n - b.n);
          return ls.map((l) => (
            <li key={l.addr} className={`lane ${found === l ? "found" : ""}`}>
              <span className="tracks" aria-hidden="true">
                {cols.map((b) => <i key={b.id} style={bk(b)} className={l.book === b ? "me" : bookOpenIn(b, l.hy) ? "open" : ""} />)}
              </span>
              <Link to={`/codex/${l.addr}`}>
                <span className="dm ui" style={bk(l.book)}>{l.hy} · {l.hd} {HIJRI_MONTHS[l.hm - 1]} · {l.book.short}{ribbon === l && <span className="ribbon">ribbon</span>}</span>
                <span className="tt">{l.entry.title}</span>
              </Link>
            </li>
          ));
        })}
      </ol>
    </section>
  );
}

function ReignRule({ row }: { row: CanonRow }) {
  if (row.kind !== "reign") return null;
  const h = hijri(row.reign.from);
  return <div className="arow reign" role="row"><div className="reign-text ui" role="cell">Reign of {row.reign.person.name}, from {western(row.reign.from)} · {h.text}</div></div>;
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
export { ordinal };
