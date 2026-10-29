import { snapshots, catalog, estateColor, western, hijri, ESTATE_ORDER } from "../lib/data";
import type { Snapshot, CatEntry, Mod } from "../lib/data";

/** The chronicle's names for the estates, as the Council lists them. */
function estateName(id: string) {
  for (let k = snapshots.length - 1; k >= 0; k--) {
    const e = snapshots[k].estates.find((x) => x.id === id);
    if (e) return e.name;
  }
  return id === "crown" ? "Crown" : id[0].toUpperCase() + id.slice(1);
}
const pct = (v: number) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`;

/** Satisfaction effects in words: "pleases the Nobility", "angers the ʿUlamāʾ". */
function satisfactionWords(e: CatEntry) {
  return Object.entries(e.satisfaction).map(([id, v]) => {
    const who = id === "all" ? "every estate" : `the ${estateName(id)}`;
    return `${v > 0 ? "pleases" : "angers"} ${who}`;
  });
}
/** Effects other than estate power and satisfaction, which are shown on their own. */
const otherEffects = (e: CatEntry) =>
  e.modifiers.filter((m) => !/^global_\w+_estate_power$/.test(m.key) && !/_estate_target_satisfaction$/.test(m.key) && m.key !== "global_estate_target_satisfaction");

const prevOf = (s: Snapshot) => snapshots[snapshots.indexOf(s) - 1];

/* ------------------------------------------------------------ privileges */

export function Charters({ snap }: { snap: Snapshot }) {
  const gov = snap.government;
  if (!gov) return null;
  const prev = prevOf(snap)?.government;
  const held = gov.privileges.filter((p) => catalog.privileges[p]);
  const lost = prev ? prev.privileges.filter((p) => !gov.privileges.includes(p) && catalog.privileges[p]) : [];
  const byEstate = ESTATE_ORDER.filter((id) => id !== "crown")
    .map((id) => ({
      id,
      items: held.filter((p) => catalog.privileges[p].estate === id)
        .map((p) => ({ key: p, e: catalog.privileges[p], power: catalog.privileges[p].power[id] ?? 0 }))
        .sort((a, b) => b.power - a.power),
    }))
    .filter((g) => g.items.length);
  const reforms = gov.reforms.filter((r) => catalog.reforms[r]);
  const lostReforms = prev ? prev.reforms.filter((r) => !gov.reforms.includes(r) && catalog.reforms[r]) : [];
  const max = Math.max(...byEstate.map((g) => g.items.reduce((a, x) => a + Math.max(0, x.power), 0)));

  return (
    <section className="charters">
      <h2 className="section-title">The charters of the estates</h2>
      <p className="muted lede-s">
        What each estate holds by right at {western(snap.date)}, with what the game's own definitions say each grant
        does. The bar is how much a privilege adds to its estate's power; the longest bars are the ones to revoke.
      </p>

      <div className="charter-ledger">
        {byEstate.map((g, gi) => {
          const total = g.items.reduce((a, x) => a + x.power, 0);
          return (
            <details key={g.id} className="estate-charter" open={gi === 0}>
              <summary>
                <span className="swatch" style={{ background: estateColor(g.id, "night") }} />
                <span className="nm">{estateName(g.id)}</span>
                <span className="cnt ui">{g.items.length} {g.items.length === 1 ? "privilege" : "privileges"}</span>
                <span className="tot ui num">{pct(total)} power</span>
                <span className="sumbar" aria-hidden="true">
                  {g.items.map((x) => (
                    <i key={x.key} style={{ width: `${(Math.max(0, x.power) / max) * 100}%`, background: estateColor(g.id, "night") }} />
                  ))}
                </span>
              </summary>
              <ul className="privs">
                {g.items.map((x) => {
                  const since = gov.privilegeDates?.[x.key];
                  const isNew = prev && !prev.privileges.includes(x.key);
                  const sat = satisfactionWords(x.e);
                  const rest = otherEffects(x.e);
                  return (
                    <li key={x.key}>
                      <div className="head">
                        <span className="pn">{x.e.name}</span>
                        {isNew && <span className="flag-new ui">New since the last checkpoint</span>}
                        <span className="pp ui num">{x.power ? pct(x.power) : ""}</span>
                      </div>
                      <span className="pbar" aria-hidden="true"><i style={{ width: `${(Math.max(0, x.power) / max) * 100}%`, background: estateColor(g.id, "night") }} /></span>
                      <p className="eff ui">
                        {[...sat, ...rest.map((m) => m.text)].join("; ")}
                        {x.e.revoke === "conditions" ? ". Can only be revoked when its conditions are met" : ""}
                        {since && since > "1337-04-01" ? `. Granted ${western(since)}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
      {lost.length > 0 && (
        <p className="lost ui">Revoked since the last checkpoint: {lost.map((p) => catalog.privileges[p].name).join(", ")}.</p>
      )}

      {(reforms.length > 0 || lostReforms.length > 0) && (
        <>
          <h3 className="sub-title">Reforms of the state</h3>
          <ul className="reforms ui">
            {reforms.map((r) => (
              <li key={r}><span className="pn">{catalog.reforms[r].name}</span> <span className="eff">{catalog.reforms[r].modifiers.map((m) => m.text).join("; ")}</span></li>
            ))}
            {lostReforms.map((r) => (
              <li key={r} className="gone"><span className="pn">{catalog.reforms[r].name}</span> <span className="eff">lost since the last checkpoint: {catalog.reforms[r].modifiers.map((m) => m.text).join("; ")}</span></li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ laws */

const touchesEstates = (e: CatEntry) =>
  (e.favouredBy?.length ?? 0) > 0 || Object.keys(e.power).length > 0 || Object.keys(e.satisfaction).length > 0;

function Effects({ e }: { e: CatEntry }) {
  const bits = [
    ...Object.entries(e.power).map(([id, v]) => `${estateName(id)} power ${pct(v)}`),
    ...satisfactionWords(e),
    ...otherEffects(e).map((m: Mod) => m.text),
  ];
  return <>{bits.join("; ") || "No standing effects"}</>;
}

export function Laws({ snap }: { snap: Snapshot }) {
  const gov = snap.government;
  if (!gov) return null;
  const prev = prevOf(snap)?.government;
  const rows = gov.laws
    .map((l) => ({ ...l, def: catalog.laws[l.slot], cur: catalog.laws[l.slot]?.options[l.law] }))
    .filter((r) => r.def && r.cur);
  // Laws that weigh on the estates first, then the rest.
  rows.sort((a, b) => Number(touchesEstates(b.cur!)) - Number(touchesEstates(a.cur!)));
  return (
    <section className="laws">
      <h2 className="section-title">The laws of the realm</h2>
      <p className="muted lede-s">Each law in force, who favours it, and what it does. Open a law to see the other ways it could be set.</p>
      <ul className="law-list">
        {rows.map((r) => {
          const changed = prev && prev.laws.find((p) => p.slot === r.slot)?.law !== r.law;
          const others = Object.entries(r.def!.options).filter(([k]) => k !== r.law);
          return (
            <li key={r.slot}>
              <details>
                <summary>
                  <span className="ln ui">{r.def!.name}</span>
                  <span className="lo">{r.cur!.name}</span>
                  {r.cur!.favouredBy?.map((id) => (
                    <span key={id} className="fav ui" style={{ borderColor: estateColor(id, "night") }}>favoured by the {estateName(id)}</span>
                  ))}
                  {changed && <span className="flag-new ui">Changed since the last checkpoint</span>}
                  <span className="le ui"><Effects e={r.cur!} /></span>
                </summary>
                {others.length > 0 && (
                  <ul className="alts ui">
                    {others.map(([k, o]) => (
                      <li key={k}>
                        <span className="an">{o.name}</span>
                        {o.favouredBy?.length ? <span className="af"> (favoured by the {o.favouredBy.map(estateName).join(" and the ")})</span> : null}
                        <span className="ae"> <Effects e={o} /></span>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ societal values */

/** Effects at a pole that bear on the estates or the crown, in a few words. */
function poleNote(mods: Mod[]) {
  const m = mods.filter((x) => /estate_power$|target_satisfaction$/.test(x.key));
  return m.map((x) => x.text).join("; ");
}

export function Values({ snap }: { snap: Snapshot }) {
  const gov = snap.government;
  if (!gov || !Object.keys(gov.societalValues).length) return null;
  const upTo = snapshots.slice(0, snapshots.indexOf(snap) + 1).filter((s) => s.government?.societalValues);
  const keys = Object.keys(gov.societalValues).filter((k) => catalog.societalValues[k]);
  // The values that move estate power or satisfaction first.
  keys.sort((a, b) => {
    const w = (k: string) => (poleNote(catalog.societalValues[k].leftModifiers) || poleNote(catalog.societalValues[k].rightModifiers) ? 0 : 1);
    return w(a) - w(b) || a.localeCompare(b);
  });
  const X = (v: number) => `${(v + 100) / 2}%`;
  return (
    <section className="values">
      <h2 className="section-title">The temper of the realm</h2>
      <p className="muted lede-s">
        Where Granada stands between each pair of ideals, from −100 to +100. The faint marks are earlier checkpoints, so
        a drift shows as a trail. Each pole's full effect applies only at its end of the line.
      </p>
      <ul className="value-list ui">
        {keys.map((k) => {
          const def = catalog.societalValues[k], v = gov.societalValues[k];
          const ln = poleNote(def.leftModifiers), rn = poleNote(def.rightModifiers);
          return (
            <li key={k}>
              <span className="pole l">{def.left}</span>
              <span className="track" role="img" aria-label={`${def.name}: ${Math.round(v)}`}>
                <span className="mid" />
                {upTo.slice(0, -1).map((s) => {
                  const pv = s.government!.societalValues[k];
                  return pv == null ? null : <i key={s.id} className="trail" style={{ left: X(pv) }} />;
                })}
                <b className="now" style={{ left: X(v) }} />
              </span>
              <span className="pole r">{def.right}</span>
              <span className="val num">{v > 0 ? "+" : ""}{Math.round(v)}</span>
              {(ln || rn) && <span className="notes">{ln && <span>At full {def.left.toLowerCase()}: {ln}.</span>} {rn && <span>At full {def.right.toLowerCase()}: {rn}.</span>}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ parliament */

export function Assembly({ snap }: { snap: Snapshot }) {
  const pm = snap.government?.parliament;
  if (!pm) return null;
  const def = catalog.parliaments[pm.type];
  return (
    <section className="assembly">
      <h2 className="section-title">The {def?.name ?? "assembly"}</h2>
      <p className="muted lede-s">
        {pm.lastCalled ? <>Last called {hijri(pm.lastCalled).text} AH ({western(pm.lastCalled)}). </> : null}
        {pm.agenda.length
          ? "What each estate will ask for when it next sits:"
          : "No estate has put anything on its agenda."}
      </p>
      {pm.agenda.length > 0 && (
        <ul className="agenda ui">
          {pm.agenda.map((x) => {
            const ag = catalog.agendas[x.type];
            const moves = ag?.moves.map((m) => {
              const sv = m.value ? catalog.societalValues[m.value] : undefined;
              return sv ? `moves the realm toward ${(m.direction === "left" ? sv.left : sv.right).toLowerCase()}` : "";
            }).filter(Boolean);
            return (
              <li key={x.type}>
                <span className="swatch" style={{ background: estateColor(x.estate, "night") }} />
                <span className="who">The {estateName(x.estate)}</span>
                <span className="what">{ag?.name ?? x.type}</span>
                <span className="how">{moves?.join("; ")}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
