import { Link } from "react-router-dom";
import { countryByTag, compact, nf, year } from "../lib/data";
import type { World } from "../lib/world";
import { powerName, gameName, personOf, subjectWord, ordinal } from "../lib/world";
import "./dispatch.css";

/** Where a power stands on the world's ladder, in words. */
export function standing(tag: string, w: World): string {
  const p = w.powers[tag];
  if (!p) return "";
  if (p.overlord) return `Unranked: a ${subjectWord(p.overlord[1])} of ${powerName(p.overlord[0], w)}`;
  if (!p.rank) return "Unranked";
  const firstRegional = Math.min(...w.ladder.filter((r) => r[3]).map((r) => r[1]), 999);
  const kind = p.regional ? "Regional Power" : p.rank < firstRegional ? "Great Power" : null;
  return `${kind ? `${kind}, ` : ""}${ordinal(p.rank)} in the world`;
}

/** A short account of one power at one checkpoint: its standing, its sovereign, its strength and its ties. */
export default function Dispatch({ tag, w, prev, tags, tone = "night", heading = "h3" }: {
  tag: string; w: World; prev?: World | null; tags?: Record<string, { name: string }> | null;
  tone?: "night" | "parchment"; heading?: "h2" | "h3";
}) {
  const p = w.powers[tag];
  const c = countryByTag.get(tag);
  if (!p) return null;
  const H = heading;
  const pp = prev?.powers[tag];
  const moved = pp?.rank && p.rank && pp.rank !== p.rank ? (p.rank < pp.rank ? `up from ${ordinal(pp.rank)}` : `down from ${ordinal(pp.rank)}`) : null;
  const name = (t: string) => powerName(t, w, tags);
  const union = w.unions.find((u) => u.members.includes(tag));
  const wars = w.wars.filter((x) => x.attackers.includes(tag) || x.defenders.includes(tag));
  const ruler = personOf(p.ruler), heir = personOf(p.heir);
  const age = (b: string | null | undefined) => (b ? year(w.date) - year(b) : null);
  const who = (r: typeof p.ruler, rec: ReturnType<typeof personOf>) => r && (
    <>
      {rec ? <Link to={`/people/${rec.id}`} className="entity" data-kind="person" data-id={rec.id} data-router="1">{rec.name}</Link> : r.name}
      {age(r.born) != null && <span className="age">, {age(r.born)}</span>}
    </>
  );
  const list = (tags: string[]) => tags.map((t, n) => <span key={t}>{n > 0 && ", "}{name(t)}</span>);
  return (
    <article className={`dispatch ${tone}`} id={`power-${tag}`} style={{ ["--pc" as any]: c?.color ?? "#9ea7c7" }}>
      <header>
        {c?.nameArabic && <div className="ar pa">{c.nameArabic}</div>}
        <H className="pn">{name(tag)}</H>
        {c && c.nameChronicle !== c.name && <div className="gn ui">{gameName(tag, w, tags)}</div>}
        <div className="standing ui">{standing(tag, w)}{moved && <span className={`moved ${moved.startsWith("up") ? "up" : "down"}`}> ({moved})</span>}</div>
      </header>
      <dl className="who ui">
        <div><dt>Sovereign</dt><dd>{p.ruler ? <>{who(p.ruler, ruler)}{p.ruler.since && <span className="since">, since {year(p.ruler.since)}</span>}</> : <em>The throne is empty</em>}</dd></div>
        {p.heir && <div><dt>Heir</dt><dd>{who(p.heir, heir)}</dd></div>}
      </dl>
      <dl className="figs ui">
        <div><dt>Towns</dt><dd>{p.locations}{p.subjectLocations > 0 && <small> +{p.subjectLocations} in subjects</small>}</dd></div>
        <div><dt>People</dt><dd>{compact(p.people * 1000)}{p.subjectPeople > 0 && <small> +{compact(p.subjectPeople * 1000)}</small>}</dd></div>
        <div><dt>Men under arms</dt><dd>{nf.format(p.men)}{p.men > 0 && <small> {p.levies > p.regulars ? "mostly levies" : "mostly regulars"}</small>}</dd></div>
        <div><dt>Ships</dt><dd>{p.ships}</dd></div>
        <div><dt>Treasury</dt><dd>{nf.format(p.gold)}</dd></div>
        <div><dt>Stability</dt><dd className={p.stability < 0 ? "bad" : undefined}>{p.stability}</dd></div>
      </dl>
      <ul className="ties ui">
        {union && <li className="union"><span className="k">Union</span>one crown with {list(union.members.filter((m) => m !== tag))}{union.since && ` since ${year(union.since)}`}</li>}
        {p.overlord && <li className="over"><span className="k">Overlord</span>{name(p.overlord[0])} ({subjectWord(p.overlord[1])})</li>}
        {p.subjects.length > 0 && <li className="subs"><span className="k">Subjects</span>{p.subjects.length > 4 ? `${p.subjects.length}, among them ${p.subjects.slice(0, 3).map(([t]) => name(t)).join(", ")}` : list(p.subjects.map(([t]) => t))}</li>}
        {p.allies.length > 0 && <li className="ally"><span className="k">Allies</span>{list(p.allies)}</li>}
        {p.rivals.length > 0 && <li className="rival"><span className="k">Rivals</span>{list(p.rivals)}</li>}
        {wars.map((x, n) => {
          const foes = x.attackers.includes(tag) ? x.defenders : x.attackers;
          const lead = x.attackers.includes(tag) ? x.defender : x.attacker;
          return <li key={n} className="war"><span className="k">At war</span>with {lead ? name(lead) : list(foes.slice(0, 3))}{foes.length > 1 ? ` and ${foes.length - 1} more` : ""}{x.started ? ` since ${year(x.started)}` : ""}</li>;
        })}
      </ul>
    </article>
  );
}
