import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { chronicle, notes, storyById, eraById, hijri, western, personById, placeById, warById, eras } from "../lib/data";
import { EntityLink } from "../components/bits";
import { folioOf } from "./ChronicleIndex";
import "./chronicle.css";

export default function ChronicleFolio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const entry = id ? storyById.get(id) : undefined;
  // An OOC note opened directly shows the folio it glosses.
  const target = entry?.kind === "ooc" && entry.about ? storyById.get(entry.about) : entry;
  const i = target ? chronicle.indexOf(target) : -1;
  const prev = i > 0 ? chronicle[i - 1] : undefined;
  const next = i >= 0 && i < chronicle.length - 1 ? chronicle[i + 1] : undefined;

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "ArrowLeft" && prev) navigate(`/chronicle/${prev.id}`);
      if (e.key === "ArrowRight" && next) navigate(`/chronicle/${next.id}`);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [prev, next, navigate]);

  if (!target) {
    return <div className="page"><h1>No such folio</h1><p className="muted"><Link to="/chronicle">Back to the table of books</Link></p></div>;
  }

  const era = eraById.get(target.era);
  const book = eras.findIndex((e) => e.id === target.era) + 1;
  const h = hijri(target.date);
  const glosses = notes.filter((n) => n.about === target.id);
  const people = target.people.map((x) => personById.get(x)!).filter(Boolean);
  const places = target.places.map((x) => placeById.get(x)!).filter(Boolean);
  const wars = target.wars.map((x) => warById.get(x)!).filter(Boolean);

  return (
    <div className="page folio-page">
      <nav className="folio-trail ui" aria-label="Where you are">
        <Link to="/chronicle">The Chronicle</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/chronicle#era-${target.era}`}>Book {book}: {era?.title}</Link>
      </nav>

      <article className="folio leaf">
        <div className="leaf-grid">
          <div className="leaf-text">
            <header>
              <div className="leaf-date-ar ar">{h.arabic}</div>
              <h1 className="rubric-title">{target.title}</h1>
              <div className="leaf-dates">{h.text} AH, {western(target.date)}{target.endDate ? ` to ${western(target.endDate)}` : ""}</div>
            </header>
            <div className="leaf-body" dangerouslySetInnerHTML={{ __html: target.html }} />
            <div className="explicit" aria-hidden="true">❁</div>
          </div>

          <aside className="margin" aria-label="Margin">
            {glosses.map((g) => (
              <div key={g.id} className="gloss">
                <div className="gloss-hand ui">The player's note</div>
                <div className="gloss-title">{g.title}</div>
                <div className="gloss-body" dangerouslySetInnerHTML={{ __html: g.html }} />
              </div>
            ))}
            {(people.length > 0 || places.length > 0 || wars.length > 0) && (
              <div className="named ui">
                <div className="named-head">Named in this folio</div>
                {people.map((p) => <div key={p.id}><EntityLink kind="person" id={p.id}>{p.name}</EntityLink></div>)}
                {places.map((p) => <div key={p.id}><EntityLink kind="place" id={p.id}>{p.name}</EntityLink></div>)}
                {wars.map((w) => <div key={w.id}><EntityLink kind="war" id={w.id}>{w.name}</EntityLink></div>)}
              </div>
            )}
            {target.sources.length > 0 && (
              <div className="sources ui">
                From {target.sources.map((s) => (s === "player" ? "Trent's account" : `checkpoint ${s}`)).join(", ")}
              </div>
            )}
          </aside>
        </div>
        <footer className="folio-no ui">f. {folioOf(i)}</footer>
      </article>

      <nav className="turns ui" aria-label="Turn the page">
        {prev ? <Link to={`/chronicle/${prev.id}`} className="turn prev"><span className="k">Previous folio, f. {folioOf(i - 1)}</span>{prev.title}</Link> : <span />}
        {next ? <Link to={`/chronicle/${next.id}`} className="turn next"><span className="k">Next folio, f. {folioOf(i + 1)}</span>{next.title}</Link> : <span />}
      </nav>
      <p className="hint ui">The left and right arrow keys turn the pages.</p>
    </div>
  );
}
