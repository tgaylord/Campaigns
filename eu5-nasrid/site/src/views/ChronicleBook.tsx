import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { chronicle, notes, eras, eraById, hijri, western, year, arabicDigits } from "../lib/data";
import "./chronicle.css";

/*
 * Reading mode: a whole book of the chronicle on one long leaf, entry after entry, with a contents
 * margin that follows the reader, a bar of how far through the book they are, and the player's notes
 * folded under each entry.
 */
export default function ChronicleBook() {
  const { era: eraId } = useParams();
  const era = eraId ? eraById.get(eraId) : undefined;
  const b = eras.findIndex((e) => e.id === eraId);
  const entries = chronicle.filter((c) => c.era === eraId);
  const [cur, setCur] = useState<string | null>(entries[0]?.id ?? null);
  const [progress, setProgress] = useState(0);
  const body = useRef<HTMLDivElement>(null);
  const { hash } = useLocation();
  // "Read the whole book from here": open on that entry
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" }), 50);
    return () => clearTimeout(t);
  }, [hash, eraId]);

  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const io = new IntersectionObserver((xs) => {
      const seen = xs.filter((x) => x.isIntersecting).sort((a, c) => a.boundingClientRect.top - c.boundingClientRect.top);
      if (seen[0]) setCur(seen[0].target.id.replace(/^e-/, ""));
    }, { rootMargin: "-20% 0px -60% 0px" });
    el.querySelectorAll("article[id^='e-']").forEach((a) => io.observe(a));
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, [eraId]);

  if (!era) return <div className="page"><h1>No such book</h1><p className="muted"><Link to="/chronicle">Back to the table of books</Link></p></div>;
  const prevBook = b > 0 ? eras[b - 1] : undefined;
  const nextBook = b < eras.length - 1 ? eras[b + 1] : undefined;
  const words = entries.reduce((n, e) => n + e.html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="page book-page">
      <div className="read-progress" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></div>
      <nav className="folio-trail ui" aria-label="Where you are">
        <Link to="/chronicle">The Chronicle</Link>
        <span aria-hidden="true">/</span>
        <span>Book {b + 1}, read straight through</span>
      </nav>

      <div className="book-grid">
        <div className="folio book-leaf" ref={body}>
          <header className="book-title">
            <span className="book-no">Book {b + 1}</span>
            <h1 className="rubric-title">{era.title}</h1>
            {era.titleArabic && <div className="book-ar-big ar">{era.titleArabic}</div>}
            <div className="leaf-dates">
              <bdi dir="rtl">{arabicDigits(hijri(era.start).y)}{era.end ? `–${arabicDigits(hijri(era.end).y)}` : ""}</bdi> AH,{" "}
              {era.end ? `${year(era.start)}–${year(era.end)}` : `${year(era.start)} to the present`}; {entries.length} entries, about {Math.max(1, Math.round(words / 230))} minutes to read
            </div>
            {era.summary && <p className="book-summary">{era.summary}</p>}
          </header>

          {entries.length === 0 && <p className="muted">No entries in this book yet.</p>}
          {entries.map((e, n) => {
            const h = hijri(e.date);
            const glosses = notes.filter((x) => x.about === e.id);
            return (
              <article key={e.id} id={`e-${e.id}`} className="book-entry">
                {n > 0 && <div className="explicit" aria-hidden="true">❁</div>}
                <div className="leaf-date-ar ar">{h.arabic}</div>
                <h2 className="entry-title"><Link to={`/chronicle/${e.id}`}>{e.title}</Link></h2>
                <div className="leaf-dates">{h.text} AH, {western(e.date)}{e.endDate ? ` to ${western(e.endDate)}` : ""}</div>
                <div className="leaf-body" dangerouslySetInnerHTML={{ __html: e.html }} />
                {glosses.length > 0 && (
                  <details className="book-gloss">
                    <summary className="ui">{glosses.length === 1 ? "The player's note" : `The player's ${glosses.length} notes`}</summary>
                    {glosses.map((g) => (
                      <div key={g.id} className="gloss">
                        <div className="gloss-title">{g.title}</div>
                        <div className="gloss-body" dangerouslySetInnerHTML={{ __html: g.html }} />
                      </div>
                    ))}
                  </details>
                )}
              </article>
            );
          })}
          <div className="explicit end" aria-hidden="true">❁ ❁ ❁</div>
          <p className="book-end">Here ends the {ordinalWord(b + 1)} book.</p>
        </div>

        <aside className="book-toc ui" aria-label="Contents of this book">
          <div className="named-head">In this book</div>
          <ol>
            {entries.map((e) => (
              <li key={e.id} className={cur === e.id ? "on" : ""}>
                <a href={`#e-${e.id}`} onClick={(ev) => { ev.preventDefault(); document.getElementById(`e-${e.id}`)?.scrollIntoView({ block: "start" }); }}>
                  <span className="d">{year(e.date)}</span>{e.title.replace(/^Of the |^Of /, "")}
                </a>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <nav className="turns ui" aria-label="The next book">
        {prevBook ? <Link to={`/chronicle/book/${prevBook.id}`} className="turn prev"><span className="k">Book {b}</span>{prevBook.title}</Link> : <span />}
        {nextBook ? <Link to={`/chronicle/book/${nextBook.id}`} className="turn next"><span className="k">Book {b + 2}</span>{nextBook.title}</Link> : <span />}
      </nav>
    </div>
  );
}

const ordinalWord = (n: number) => ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"][n - 1] ?? `${n}th`;
