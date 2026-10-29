import { Link, useParams } from "react-router-dom";
import { personById, people, snapshots, mentionsOf, hijri, western, year, EVENT_LABEL } from "../lib/data";
import { EntityLink, StarRule } from "../components/bits";
import "./record.css";

export default function PersonPage() {
  const { id } = useParams();
  const p = id ? personById.get(id) : undefined;
  if (!p) return <div className="page"><h1>No such person</h1><p className="muted"><Link to="/house">Back to the House of Naṣr</Link></p></div>;

  const father = p.father ? personById.get(p.father) : undefined;
  const mother = p.mother ? personById.get(p.mother) : undefined;
  const children = people.filter((c) => c.father === p.id || c.mother === p.id);
  const siblings = p.father ? people.filter((c) => c.id !== p.id && c.father === p.father) : [];
  const nice = (k: string) => k.replace(/_/g, " ");
  const { story, events } = mentionsOf("people", p.id);
  // Offices held, from the cabinets of every checkpoint.
  const offices = new Map<string, string[]>();
  snapshots.forEach((s) => s.cabinet.filter((c) => c.person === p.id).forEach((c) => {
    offices.set(c.role, [...(offices.get(c.role) ?? []), s.date]);
  }));

  return (
    <div className="page record-page">
      <header className="record-head">
        {p.nameArabic && <div className="record-ar ar">{p.nameArabic}</div>}
        <h1>{p.name}</h1>
        <p className="record-sub">{[p.roles.join(", "), p.dynasty ? `of the house of ${p.dynasty === "Naṣrid" ? "Naṣr" : p.dynasty}` : ""].filter(Boolean).join(", ")}</p>
      </header>

      <dl className="record-facts ui">
        {p.born && <div><dt>Born</dt><dd><span className="ar">{hijri(p.born).arabic}</span>{western(p.born)}</dd></div>}
        {p.died && <div><dt>Died</dt><dd><span className="ar">{hijri(p.died).arabic}</span>{western(p.died)}</dd></div>}
        {p.reigns.map((r) => (
          <div key={r.from}><dt>Reigned</dt><dd>{year(r.from)}–{r.to ? year(r.to) : "the present"} <span className="muted">({hijri(r.from).y}–{r.to ? hijri(r.to).y : ""} AH)</span></dd></div>
        ))}
        {father && <div><dt>Father</dt><dd><EntityLink kind="person" id={father.id}>{father.name}</EntityLink></dd></div>}
        {mother && <div><dt>Mother</dt><dd><EntityLink kind="person" id={mother.id}>{mother.name}</EntityLink></dd></div>}
        {siblings.length > 0 && <div><dt>Brothers and sisters</dt><dd>{siblings.map((c, k) => <span key={c.id}>{k > 0 && ", "}<EntityLink kind="person" id={c.id}>{c.name}</EntityLink></span>)}</dd></div>}
        {p.stats && <div><dt>Gifts (administration, diplomacy, military)</dt><dd>{[p.stats.adm, p.stats.dip, p.stats.mil].map((v) => Math.round(v)).join(", ")}</dd></div>}
        {p.traits.length > 0 && <div><dt>Traits</dt><dd>{p.traits.map(nice).join(", ")}</dd></div>}
        {children.length > 0 && <div><dt>Children</dt><dd>{children.map((c, k) => <span key={c.id}>{k > 0 && ", "}<EntityLink kind="person" id={c.id}>{c.name}</EntityLink></span>)}</dd></div>}
        {[...offices].map(([role, dates]) => (
          <div key={role}><dt>In the dīwān</dt><dd><em>{role}</em>, {year(dates[0])}{dates.length > 1 ? `–${year(dates[dates.length - 1])}` : ""}</dd></div>
        ))}
        {p.nameGame && p.nameGame !== p.name && <div><dt>In the game</dt><dd>{p.nameGame}</dd></div>}
      </dl>
      {p.note && <p className="muted">{p.note}</p>}

      <Mentions story={story} events={events} />
    </div>
  );
}

export function Mentions({ story, events }: { story: ReturnType<typeof mentionsOf>["story"]; events: ReturnType<typeof mentionsOf>["events"] }) {
  return (
    <>
      <StarRule />
      <div className="mentions">
        <section>
          <h2 className="section-title">In the chronicle</h2>
          {story.length ? (
            <ul className="m-list">
              {story.map((s) => (
                <li key={s.id}><span className="ar d">{hijri(s.date).arabic}</span><Link to={`/chronicle/${s.id}`}>{s.title}</Link></li>
              ))}
            </ul>
          ) : <p className="muted">Not yet named in the chronicle.</p>}
        </section>
        <section>
          <h2 className="section-title">In the event log</h2>
          {events.length ? (
            <ul className="m-list ui">
              {events.map((e) => <li key={e.id}><span className="d">{western(e.date)}</span><span><span className="t">{EVENT_LABEL[e.type]}</span> {e.title}</span></li>)}
            </ul>
          ) : <p className="muted">No logged events.</p>}
        </section>
      </div>
    </>
  );
}
