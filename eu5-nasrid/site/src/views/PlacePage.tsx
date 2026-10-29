import { Link, useParams } from "react-router-dom";
import { placeById, places, mentionsOf, latest, snapshots, isHeld, hijri, western, year, yearFrac } from "../lib/data";
import MiniChart from "../components/MiniChart";
import { Mentions } from "./PersonPage";
import "./record.css";
import "./gazetteer.css";

export default function PlacePage() {
  const { id } = useParams();
  const p = id ? placeById.get(id) : undefined;
  if (!p) return <div className="page"><h1>No such place</h1><p className="muted"><Link to="/places">Back to the gazetteer</Link></p></div>;
  const { story, events } = mentionsOf("places", p.id);
  const now = latest?.date ?? "9999-12-31";
  const ours = isHeld(p, now);
  const neighbours = places.filter((q) => q.id !== p.id && Math.hypot(q.x - p.x, q.y - p.y) < 70);

  // Held periods drawn against the span of the checkpoints.
  const t0 = snapshots.length ? yearFrac(snapshots[0].date) : 0;
  const t1 = snapshots.length ? yearFrac(snapshots[snapshots.length - 1].date) : 1;
  const pct = (d: string) => Math.max(0, Math.min(100, ((yearFrac(d) - t0) / (t1 - t0 || 1)) * 100));

  return (
    <div className="page record-page">
      <header className="record-head">
        {p.nameArabic && <div className="record-ar ar">{p.nameArabic}</div>}
        <h1>{p.name}</h1>
        <p className="record-sub">{p.nameGame} in the game. {ours ? "In Naṣrid hands." : p.held.length ? "Once Naṣrid, now lost." : "Never yet in Naṣrid hands."}</p>
      </header>

      <MiniChart marks={[{ place: p, tone: "focus" as const }, ...neighbours.map((q) => ({ place: q, tone: isHeld(q, now) ? "ours" as const : "theirs" as const }))]} height={340} minSpan={150} />

      {snapshots.length > 1 && (
        <section className="held-track">
          <h2 className="section-title">In Naṣrid hands</h2>
          <div className="track" role="img" aria-label={p.held.length ? p.held.map((h) => `${year(h.from)} to ${h.to ? year(h.to) : "now"}`).join(", ") : "Never held"}>
            {p.held.map((h) => (
              <span key={h.from} className="span" style={{ left: `${pct(h.from)}%`, width: `${pct(h.to ?? now) - pct(h.from)}%` }} />
            ))}
          </div>
          <div className="track-ends ui"><span>{year(snapshots[0].date)}</span><span>{year(now)}</span></div>
          <ul className="held-list ui">
            {p.held.map((h) => <li key={h.from}>From {hijri(h.from).text} AH ({western(h.from)}) to {h.to ? `${western(h.to)}` : "the present"}</li>)}
            {p.held.length === 0 && <li>Never held.</li>}
          </ul>
        </section>
      )}
      {p.note && <p className="muted">{p.note}</p>}
      <Mentions story={story} events={events} />
    </div>
  );
}
