import { Link, useParams } from "react-router-dom";
import { placeById, places, mentionsOf, latest, snapshots, isHeld, hijri, western, year, yearFrac, nf, faithName, cultureName, rankName } from "../lib/data";
import { latestLand, CULTURE_COLOR, FAITH_COLOR, provinceName, areaName } from "./Lands";
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
      <Standing placeKey={p.key} />
      {p.note && <p className="muted">{p.note}</p>}
      <Mentions story={story} events={events} />
    </div>
  );
}

/** How the place stood at the latest checkpoint that has it among Granada's own lands. */
function Standing({ placeKey }: { placeKey: string }) {
  const got = latestLand(placeKey);
  if (!got) return null;
  const { land: l, date } = got;
  const share = (parts: Record<string, number>, name: (k: string) => string, colors: Record<string, string>) =>
    Object.entries(parts).sort((a, b) => b[1] - a[1]).filter(([, v]) => v / (l.population || 1) >= 0.005).map(([k, v]) => (
      <li key={k}><i style={{ background: colors[k] ?? "#a39a86" }} />{name(k)} <span className="n">{Math.round((100 * v) / (l.population || 1))}%</span></li>
    ));
  const pct = (v: number | null) => (v == null ? "?" : `${Math.round(v * 100)}%`);
  return (
    <section className="standing">
      <h2 className="section-title">As it stood, {western(date)}</h2>
      <dl className="standing-facts ui">
        <div><dt>Province</dt><dd>{provinceName(l.province)}, in {areaName(l.area)}</dd></div>
        <div><dt>Rank</dt><dd>{rankName(l.rank)}</dd></div>
        <div><dt>People</dt><dd>{nf.format(l.population)}</dd></div>
        <div><dt>Control</dt><dd>{pct(l.control)}</dd></div>
        <div><dt>Development</dt><dd>{l.development?.toFixed(1)}</dd></div>
        <div><dt>Standing</dt><dd>{l.core ? "Core of Granada" : "Conquered, not yet a core"}</dd></div>
        <div><dt>Tax</dt><dd>{l.tax?.toFixed(2)} of a possible {l.possibleTax?.toFixed(2)}</dd></div>
        {l.goods && <div><dt>Goods</dt><dd>{l.goods.replace(/_/g, " ")}</dd></div>}
      </dl>
      <div className="standing-shares ui">
        <div><h3>Peoples</h3><ul>{share(l.cultures, cultureName, CULTURE_COLOR)}</ul></div>
        <div><h3>Faiths</h3><ul>{share(l.religions, faithName, FAITH_COLOR)}</ul></div>
        {l.buildings.length > 0 && (
          <div><h3>Buildings</h3><p className="bld">{l.buildings.map((b) => `${b.type.replace(/_/g, " ")}${b.level > 1 ? ` (${b.level})` : ""}`).join(", ")}</p></div>
        )}
      </div>
    </section>
  );
}
