import { Link, useParams } from "react-router-dom";
import { RunningHead, CatchLine, bk } from "../components/CodexBits";
import { books, bookById, leaves, canons, besides } from "../lib/codex";
import { hijri, western } from "../lib/data";
import { HIJRI_MONTHS } from "../lib/hijri";
import "./chronicle.css";
import "./codex.css";

/*
 * A book's opening page. It stands in the reading order just before the book's first leaf, so a reader
 * going straight through meets "The Book of the Call begins" between two leaves of the Balance, as they
 * would meet a part-title in a printed history.
 */
export default function CodexBook() {
  const { era = "" } = useParams();
  const book = bookById.get(era);
  if (!book) return <div className="page"><h1>No such book</h1><p className="muted"><Link to="/codex">Back to the canon tables</Link></p></div>;
  const first = book.first;
  const before = first ? leaves[first.n - 2] : undefined;
  const inCanons = canons.filter((c) => c.books.includes(book)).map((c) => c.n);
  const beside = besides(book);
  const s = hijri(book.era.start), e = book.era.end ? hijri(book.era.end) : null;

  return (
    <div className="page codex-page" style={bk(book)}>
      <RunningHead
        book={book}
        left={<span className="bkname">{book.name}</span>}
        right={<span>Book {book.n} of {books.length}</span>}
        prev={before && `/codex/${before.addr}`} next={first && `/codex/${first.addr}`}
      />
      <article className="folio codex-leaf opening" aria-labelledby="book-title">
        <div className="opening-frame">
          <p className="book-of ui">Book {book.n} of {books.length}</p>
          <div className="opening-ar ar">{book.era.titleArabic}</div>
          <h1 id="book-title" className="leaf-h1">{book.name}</h1>
          <p className="ui opening-span">
            {s.text}{e ? ` – ${e.text}` : ""} AH · {western(book.era.start)}{book.era.end ? ` – ${western(book.era.end)}` : ", and still being written"}
          </p>
          {book.era.summary && <p className="opening-summary">{book.era.summary}</p>}
          <p className="ui opening-stats">
            {book.leaves.length} leaves · {book.words.toLocaleString("en-GB")} words · in Canon{inCanons.length > 1 ? "s" : ""} {inCanons.join(", ")}
            {beside.length > 0 && <> · runs beside {beside.map((b, i) => <span key={b.id}>{i ? (i === beside.length - 1 ? " and " : ", ") : ""}<Link to={`/codex/book/${b.id}`} style={bk(b)} className="bklink">{b.name.replace(/^The /, "the ")}</Link></span>)}</>}
          </p>
        </div>

        <ol className="book-column">
          {book.leaves.map((l) => (
            <li key={l.addr}>
              <Link to={`/codex/${l.addr}`}>
                <span className="a ui">{l.label}</span>
                <span className="t">{l.entry.title}</span>
                <span className="d ui">{l.hd} {HIJRI_MONTHS[l.hm - 1]} {l.hy} · {l.entry.date.slice(0, 4)}</span>
              </Link>
            </li>
          ))}
          {book.leaves.length === 0 && <li className="muted">No leaves yet.</li>}
        </ol>

        <p className="rubric-line big">Here begins {book.name.replace(/^The /, "the ")}.</p>
        <div className="catchwords">
          {first
            ? <CatchLine c={{ kind: "leaf", label: `The first leaf of ${book.name.replace(/^The /, "the ")}`, color: book.color, leaf: first, follow: "both" }} />
            : <p className="catch quiet">The first leaf of this book is not yet written.</p>}
        </div>
        <nav className="quiet-links ui" aria-label="Around this book">
          {before && <Link to={`/codex/${before.addr}`}>‹ the leaf before, in the codex</Link>}
          <Link to={`/codex#canon-${inCanons[0] ?? 1}`}>the canon tables</Link>
          <Link to={`/chronicle/book/${book.id}`}>read this book alone, in the Chronicle</Link>
        </nav>
      </article>
    </div>
  );
}
