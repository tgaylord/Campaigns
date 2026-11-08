import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { warById, events, placeById, mentionsOf, hijri, western, year, nf, signed, devastation, snapshots, countries, yearFrac } from "../lib/data";
import Devastation from "../components/Devastation";
import MiniChart from "../components/MiniChart";
import BattleMap, { useWarBattles } from "../components/BattleMap";
import { StarRule } from "../components/bits";
import { Tide, seriesLine, fightOutcome } from "./WarsIndex";
import { Mentions } from "./PersonPage";
import "./wars.css";
import "./record.css";

/** One figure stands for this many men. */
const PER = 500;

export default function WarPage() {
  const { id } = useParams();
  const w = id ? warById.get(id) : undefined;
  const { list: placed, number } = useWarBattles(w?.id ?? "");
  if (!w) return <div className="page"><h1>No such war</h1><p className="muted"><Link to="/wars">Back to the wars</Link></p></div>;

  const fights = events.filter((e) => ["battle", "siege"].includes(e.type) && e.wars.includes(w.id));
  const sites = [...new Set(fights.flatMap((f) => f.places))].map((p) => placeById.get(p)!).filter(Boolean);
  const { story, events: evs } = mentionsOf("wars", w.id);
  const won = fights.filter((f) => fightOutcome(f.data.result) === "good").length;
  const lost = fights.filter((f) => fightOutcome(f.data.result) === "bad").length;
  const months = Math.max(1, Math.round(((w.end ? yearFrac(w.end) : yearFrac(snapshots[snapshots.length - 1].date)) - yearFrac(w.start)) * 12));
  const lastScore = w.score.length ? w.score[w.score.length - 1].value : null;
  const potential = w.involvement === "potential";
  // the two sides: ours is the one al-Andalus (or Granada) stands on, else the allies we backed
  const isUs = (s: string) => /al-Andalus|Granada|Gharn[aā][tṭ]a/i.test(s);
  let ours: string[], theirs: string[];
  if (w.sides && (w.sides.attackers.some(isUs) || w.sides.defenders.some(isUs))) {
    [ours, theirs] = w.sides.attackers.some(isUs) ? [w.sides.attackers, w.sides.defenders] : [w.sides.defenders, w.sides.attackers];
  } else if (w.sides && potential) {
    [ours, theirs] = [w.sides.attackers, w.sides.defenders];
  } else {
    ours = [w.end && w.end < "1375-03-16" ? "Granada" : "al-Andalus", ...w.allies]; theirs = w.enemies;
  }
  const attacking = w.sides ? w.sides.attackers === ours : null;

  return (
    <div className="page record-page war-page">
      <header className="record-head war-head">
        <div className="war-years"><span className="ar">{hijri(w.start).arabic}</span>{" "}<span className="ui">{western(w.start)} to {w.end ? western(w.end) : "the present"}</span></div>
        <h1>{w.name}</h1>
        {w.series && <p className="war-series">{seriesLine(w.series)}{w.series.nameArabic && <> <span className="ar">{w.series.nameArabic}</span></>}</p>}
        <p className="war-outcome">{w.outcome ? `Ended in ${w.outcome.charAt(0).toLowerCase() + w.outcome.slice(1).replace(/\.$/, "")}.` : potential ? "Still being fought, without us." : "Still being fought."}</p>
        <dl className="war-stats ui">
          <div><dt>Lasted</dt><dd>{months >= 24 ? `${Math.round(months / 12)} years` : `${months} month${months === 1 ? "" : "s"}`}</dd></div>
          <div><dt>Engagements</dt><dd>{fights.length}</dd></div>
          {fights.length > 0 && <div><dt>Won, lost</dt><dd>{won}, {lost}</dd></div>}
          {lastScore !== null && <div><dt>{w.end ? "Final war score" : "War score"}</dt><dd className={lastScore > 0 ? "up" : lastScore < 0 ? "down" : ""}>{signed(lastScore)}</dd></div>}
          {w.joined && <div><dt>We were in it</dt><dd>{western(w.joined.from)}{w.joined.to ? ` to ${western(w.joined.to)}` : " on"}</dd></div>}
        </dl>
      </header>

      <section className="war-sides" aria-label="The two sides">
        <Side title={potential ? "The side we would join" : "Our side"} role={attacking === null ? null : attacking ? "attacking" : "defending"} names={ours} tone="ours" />
        <Side title={potential ? "Against them" : "Against us"} role={attacking === null ? null : attacking ? "defending" : "attacking"} names={theirs} tone="theirs" />
      </section>
      <p className="war-goal ui"><span>War goal</span> {w.goal.charAt(0).toUpperCase() + w.goal.slice(1).replace(/\.$/, "")}.{w.gameName && w.gameName !== w.name ? ` In the game: ${w.gameName}.` : ""}</p>

      {placed.length > 0 ? (
        <section>
          <h2 className="section-title">Where it was fought</h2>
          <BattleMap warId={w.id} end={w.end} unplaced={fights.filter((f) => f.type === "battle").length - placed.length} />
        </section>
      ) : sites.length > 0 && (
        <section>
          <h2 className="section-title">Where it was fought</h2>
          <MiniChart marks={sites.map((p) => ({ place: p, tone: "battle" as const }))} height={340} />
        </section>
      )}

      {w.score.length > 1 && (
        <section>
          <h2 className="section-title">The tide of the war</h2>
          <Tide score={w.score} big />
          <p className="muted ui" style={{ fontSize: "0.82rem" }}>War score from {w.start < "1375-03-16" ? "Granada" : "al-Andalus"}'s side, {year(w.start)}–{w.end ? year(w.end) : ""}. Gold: running our way. Red: running against us.</p>
        </section>
      )}

      {sites.length > 0 && (
        <section>
          <h2 className="section-title">Where it was fought</h2>
          <MiniChart marks={sites.map((p) => ({ place: p, tone: "battle" as const }))} height={340} />
        </section>
      )}

      {w.note && <Account text={w.note} />}

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
          const oc = fightOutcome(result), good = oc === "good", bad = oc === "bad";
          const no = number.get(f.id);
          const place = f.places[0] ? placeById.get(f.places[0]) : undefined;
          return (
            <article key={f.id} className={`fight ${good ? "good" : bad ? "bad" : ""}`}>
              <header>
                <span className="kind ui">{no && <b className="no" title="Its number on the map">{no}</b>}{f.type === "battle" ? (d.naval ? "Sea battle" : "Battle") : "Siege"}{place ? ` at ${place.name}` : d.location ? `, ${d.location}` : ""}</span>
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

/** One side of the war: its leader first, then everyone with it, each in its own colour where the chronicle names it. */
function Side({ title, role, names, tone }: { title: string; role: string | null; names: string[]; tone: "ours" | "theirs" }) {
  const colour = (n: string) => countries.find((c) => c.name === n.replace(/\s*\(.*\)/, "") || c.nameChronicle === n.replace(/\s*\(.*\)/, ""))?.color;
  const [lead, ...rest] = names;
  return (
    <div className={`side ${tone}`}>
      <h2>{title}{role && <span className="ui"> ({role})</span>}</h2>
      {lead && <p className="lead">{colour(lead) && <i style={{ background: colour(lead) }} />}{lead}<span className="ui"> leads</span></p>}
      <ul>{rest.map((n) => <li key={n}>{colour(n) && <i style={{ background: colour(n) }} />}{n}</li>)}</ul>
    </div>
  );
}

/** The chronicle's account of the war: the opening shown, the rest a click away when it runs long. */
function Account({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 900;
  const cut = long ? text.slice(0, text.indexOf(". ", 600) + 1 || 700) : text;
  return (
    <section className="war-account">
      <h2 className="section-title">The account</h2>
      <p>{open || !long ? text : cut}</p>
      {long && <button type="button" className="more ui" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read the whole account"}</button>}
    </section>
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
