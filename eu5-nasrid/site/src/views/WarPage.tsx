import { Link, useParams } from "react-router-dom";
import { warById, events, placeById, mentionsOf, hijri, western, year, nf, signed, devastation, snapshots } from "../lib/data";
import Devastation from "../components/Devastation";
import MiniChart from "../components/MiniChart";
import { StarRule } from "../components/bits";
import { Tide, againstLine, and } from "./WarsIndex";
import { Mentions } from "./PersonPage";
import "./wars.css";
import "./record.css";

/** One figure stands for this many men. */
const PER = 500;

export default function WarPage() {
  const { id } = useParams();
  const w = id ? warById.get(id) : undefined;
  if (!w) return <div className="page"><h1>No such war</h1><p className="muted"><Link to="/wars">Back to the wars</Link></p></div>;

  const fights = events.filter((e) => ["battle", "siege"].includes(e.type) && e.wars.includes(w.id));
  const sites = [...new Set(fights.flatMap((f) => f.places))].map((p) => placeById.get(p)!).filter(Boolean);
  const { story, events: evs } = mentionsOf("wars", w.id);

  return (
    <div className="page record-page war-page">
      <header className="record-head">
        <div className="war-years"><span className="ar">{hijri(w.start).arabic}</span>{" "}<span className="ui">{western(w.start)} to {w.end ? western(w.end) : "the present"}</span></div>
        <h1>{w.name}</h1>
        <p className="record-sub">War goal: {w.goal.charAt(0).toLowerCase() + w.goal.slice(1)}. {w.involvement === "potential"
          ? `${againstLine(w)}.`
          : `Against ${and(w.enemies)}${w.allies.length ? `, with ${and(w.allies)} at our side` : ""}.`}</p>
        {w.sides && w.involvement === "belligerent" && w.sides.attackers.join() !== "Granada" && <p className="record-sub">{and(w.sides.attackers)} against {and(w.sides.defenders)}.</p>}
        {w.joined && <p className="record-sub">Granada was in it from {western(w.joined.from)}{w.joined.to ? ` to ${western(w.joined.to)}` : ""}.</p>}
        <p className="war-outcome">{w.outcome ? `Ended in ${w.outcome.charAt(0).toLowerCase() + w.outcome.slice(1)}.` : w.involvement === "potential" ? "Still being fought, without us." : "Still being fought."}</p>
        {w.note && <p className="muted">{w.note}</p>}
        {w.gameName && w.gameName !== w.name && <p className="muted ui">In the game: {w.gameName}</p>}
      </header>

      {w.score.length > 1 && (
        <section>
          <h2 className="section-title">The tide of the war</h2>
          <Tide score={w.score} big />
          <p className="muted ui" style={{ fontSize: "0.82rem" }}>War score from Granada's side, {year(w.start)}–{w.end ? year(w.end) : ""}. Gold: running our way. Red: running against us.</p>
        </section>
      )}

      {sites.length > 0 && (
        <section>
          <h2 className="section-title">Where it was fought</h2>
          <MiniChart marks={sites.map((p) => ({ place: p, tone: "battle" as const }))} height={340} />
        </section>
      )}

      {devastation[w.id] && (
        <Devastation d={devastation[w.id]} checkpoint={snapshots.find((s) => s.date === devastation[w.id].dates.peace)?.id} />
      )}

      <StarRule />
      <h2 className="section-title">Battles and sieges</h2>
      {fights.length === 0 && <p className="muted">None logged.</p>}
      <div className="fights">
        {fights.map((f) => {
          const d = f.data as Record<string, any>;
          // hosts: older records give ours/ourLosses as numbers; battle records give per-country
          // tables in ours/theirs with oursTotal/oursLost (and theirsTotal/theirsLost)
          const total = (n: unknown, t: unknown) => (typeof n === "number" ? n : typeof t === "number" ? t : n && typeof n === "object" ? Object.values(n as Record<string, number>).reduce((a, b) => a + (Number(b) || 0), 0) : undefined);
          const ourMen = total(d.ours, d.oursTotal), theirMen = total(d.theirs, d.theirsTotal);
          const ourLost = d.ourLosses ?? d.oursLost ?? undefined, theirLost = d.theirLosses ?? d.theirsLost ?? undefined;
          const ships = d.naval === true; // a sea battle counts ships, one figure each
          const result = String(d.result ?? "");
          const good = ["victory", "taken"].includes(result), bad = ["defeat", "lost"].includes(result);
          const place = f.places[0] ? placeById.get(f.places[0]) : undefined;
          return (
            <article key={f.id} className={`fight ${good ? "good" : bad ? "bad" : ""}`}>
              <header>
                <span className="kind ui">{f.type === "battle" ? "Battle" : "Siege"}{place ? ` at ${place.name}` : ""}</span>
                <h3>{f.title}</h3>
                <span className="when ui">{western(f.date)}</span>
                {result && <span className="result ui"><span aria-hidden="true">{good ? "✓ " : bad ? "✕ " : "◦ "}</span>{result[0].toUpperCase() + result.slice(1)}{d.warScore != null ? `, war score ${signed(d.warScore)}` : ""}</span>}
              </header>
              {(ourMen != null || ourLost != null) && (
                <div className="hosts ui">
                  <Host label={w.involvement === "potential" ? "Our allies" : "Ours"} men={ourMen} lost={ourLost} ships={ships} />
                  <Host label={w.involvement === "potential" ? (w.sides?.defenders.join(", ") ?? "Theirs") : "Theirs"} men={theirMen} lost={theirLost} ships={ships} />
                  <p className="per">Each figure is {ships ? "a ship" : `${PER} men`}{ourLost != null || theirLost != null ? "; the red ones fell" : ""}.</p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Mentions story={story} events={evs} />
    </div>
  );
}

function Host({ label, men, lost, ships = false }: { label: string; men?: number; lost?: number; ships?: boolean }) {
  const per = ships ? 1 : PER, unit = ships ? "ships" : "men";
  const n = Math.round((men ?? 0) / per), dead = Math.round((lost ?? 0) / per);
  return (
    <div className="host">
      <div className="hl"><span>{label}</span><span>{men != null ? nf.format(men) : "?"} {unit}{lost != null ? `, ${nf.format(lost)} lost` : ""}</span></div>
      <div className="figures" aria-hidden="true">
        {Array.from({ length: n }, (_, k) => <i key={k} className={k < dead ? "fell" : ""} />)}
      </div>
    </div>
  );
}
