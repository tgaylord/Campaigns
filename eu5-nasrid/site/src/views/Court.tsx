import { useState } from "react";
import { Link } from "react-router-dom";
import { snapshots, personById, hijri, western, year } from "../lib/data";
import { PageHead, CheckpointSelect, EntityLink, StarRule } from "../components/bits";
import "./court.css";

/** What each office is, for readers who don't know the Naṣrid titles. */
const OFFICE: Record<string, string> = {
  "ḥājib": "chamberlain, first minister of the household",
  vizier: "minister of state",
  "kātib": "secretary of the chancery",
  "shaykh al-ghuzāt": "commander of the volunteers of the faith",
  "qāḍī al-jamāʿa": "chief judge",
};

export default function Court() {
  const [i, setI] = useState(snapshots.length - 1);
  const s = snapshots[i];
  const prev = i > 0 ? snapshots[i - 1] : undefined;
  const ruler = personById.get(s.ruler);
  const heir = s.heir ? personById.get(s.heir) : undefined;
  const regent = s.regent ? personById.get(s.regent) : undefined;
  const joined = prev ? s.cabinet.filter((c) => !prev.cabinet.some((p) => p.person === c.person && p.role === c.role)) : [];
  const left = prev ? prev.cabinet.filter((p) => !s.cabinet.some((c) => c.person === p.person && c.role === p.role)) : [];
  const age = ruler?.born ? year(s.date) - year(ruler.born) : null;

  return (
    <div className="page court-page">
      <PageHead
        title="The Court"
        ar="البلاط"
        lede="Who sits beside the sultan, who waits to succeed him, and which powers count as friends or enemies of the throne."
      />

      <div className="court-stage">
        <section className="throne-room" aria-label="The sovereign">
          <div className="arch-frame">
            <div className="ar sultan">{ruler?.nameArabic}</div>
            <div className="sultan-latin"><EntityLink kind="person" id={s.ruler}>{ruler?.name}</EntityLink></div>
            <div className="sultan-sub">
              Sultan of Gharnāṭa{age != null ? `, in his ${ordinal(age)} year` : ""}
            </div>
            <div className="date"><span className="ar">{hijri(s.date).arabic}</span> <span className="ui">{western(s.date)}</span></div>
          </div>
          <div className="succession ui">
            <div><span className="k">Heir</span>{heir ? <EntityLink kind="person" id={heir.id}>{heir.name}</EntityLink> : <em>None named</em>}</div>
            {regent && <div><span className="k">Regent</span><EntityLink kind="person" id={regent.id}>{regent.name}</EntityLink></div>}
            {s.overlord && <div><span className="k">Overlord</span>{s.overlord.country} ({s.overlord.type})</div>}
          </div>
        </section>

        <section className="diwan" aria-label="The cabinet">
          <h2 className="section-title">The dīwān</h2>
          {s.cabinet.length === 0 && <p className="muted">No cabinet recorded at this checkpoint.</p>}
          <ul className="seats">
            {s.cabinet.map((c) => {
              const p = personById.get(c.person);
              const isNew = joined.some((j) => j.person === c.person && j.role === c.role);
              return (
                <li key={`${c.person}-${c.role}`} className={isNew ? "new" : ""}>
                  <span className="role">{c.role}</span>
                  <span className="office ui">{OFFICE[c.role] ?? ""}</span>
                  <span className="who">
                    {p?.nameArabic && <span className="ar">{p.nameArabic}</span>}
                    <EntityLink kind="person" id={c.person}>{p?.name ?? c.person}</EntityLink>
                  </span>
                  {isNew && <span className="tag ui">New since the last checkpoint</span>}
                </li>
              );
            })}
          </ul>
          {left.length > 0 && (
            <p className="left ui">
              Gone since the last checkpoint: {left.map((l, k) => (
                <span key={l.person}>{k > 0 && ", "}<Link to={`/people/${l.person}`}>{personById.get(l.person)?.name}</Link> ({l.role})</span>
              ))}
            </p>
          )}
          <div className="meters ui">
            {s.crownPower != null && (
              <div className="meter-block">
                <span className="k">Power of the crown{s.estates.find((e) => e.id === "crown")?.estimated ? ", estimated" : ""}</span>
                <span className="v">{s.crownPower}%</span>
                <span className="bar"><i style={{ width: `${s.crownPower}%` }} /></span>
              </div>
            )}
            {s.politicalInfluence != null && (
              <div className="meter-block">
                <span className="k">Political influence</span>
                <span className="v">{s.politicalInfluence}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <CheckpointSelect value={i} onChange={setI} />

      <StarRule />
      <div className="friends">
        <section>
          <h2 className="section-title">Friends of the throne</h2>
          {s.allies.length ? <ul className="banners">{s.allies.map((a) => <li key={a} className="ally">{a}</li>)}</ul> : <p className="muted">No allies.</p>}
          {s.subjects.length > 0 && <p className="ui muted">Subjects: {s.subjects.map((x) => `${x.country} (${x.type})`).join(", ")}</p>}
        </section>
        <section>
          <h2 className="section-title">Enemies of the throne</h2>
          {s.rivals.length ? <ul className="banners">{s.rivals.map((a) => <li key={a} className="rival">{a}</li>)}</ul> : <p className="muted">No rivals.</p>}
        </section>
      </div>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
