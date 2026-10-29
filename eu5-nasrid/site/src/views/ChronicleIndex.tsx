import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { eras, chronicle, notes, hijri, year, arabicDigits } from "../lib/data";
import { PageHead } from "../components/bits";
import "./chronicle.css";

/** Folio numbering as a manuscript would have it: 1r, 1v, 2r … */
export const folioOf = (i: number) => `${Math.floor(i / 2) + 1}${i % 2 === 0 ? "r" : "v"}`;

export default function ChronicleIndex() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [hash]);
  return (
    <div className="page chronicle-index">
      <PageHead
        title="The Chronicle"
        ar="الأخبار"
        lede="The history of the Naṣrid kingdom as its court set it down, book by book. The player's own notes sit in the margins, in another hand."
      />

      <div className="folio fihris">
        <div className="fihris-head">
          <span className="ar">فهرس</span>
          <span className="rubric">The table of the books of this chronicle</span>
        </div>

        {eras.length === 0 && <p>No books have been begun.</p>}

        {eras.map((era, b) => {
          const entries = chronicle.filter((c) => c.era === era.id);
          return (
            <section key={era.id} id={`era-${era.id}`} className="book">
              <header>
                <span className="book-no">Book {b + 1}</span>
                <h2>{era.title}{era.titleArabic && <bdi className="book-ar" lang="ar" dir="rtl">{era.titleArabic}</bdi>}</h2>
                <span className="span">
                  {/* Isolated right-to-left, so the dash of an open range can't jump to the wrong side. */}
                  <bdi className="ar" dir="rtl">{arabicDigits(hijri(era.start).y)}{era.end ? `–${arabicDigits(hijri(era.end).y)}` : ""}</bdi>
                  {" "}{era.end ? `${year(era.start)}–${year(era.end)}` : `${year(era.start)} to the present`}
                </span>
              </header>
              {era.summary && <p className="summary">{era.summary}</p>}
              <ol className="leaves">
                {entries.map((e) => {
                  const i = chronicle.indexOf(e);
                  const glosses = notes.filter((n) => n.about === e.id).length;
                  return (
                    <li key={e.id}>
                      <Link to={`/chronicle/${e.id}`}>
                        <span className="leaf-title">{e.title}</span>
                        <span className="dots" aria-hidden="true" />
                        <span className="leaf-date ar">{hijri(e.date).arabic}</span>
                        <span className="leaf-no">f. {folioOf(i)}</span>
                      </Link>
                      {glosses > 0 && <span className="gloss-count">{glosses === 1 ? "one marginal note" : `${glosses} marginal notes`}</span>}
                    </li>
                  );
                })}
                {entries.length === 0 && <li className="empty">No entries in this book yet.</li>}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
