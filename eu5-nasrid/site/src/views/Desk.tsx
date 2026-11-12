import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead, EntityLink } from "../components/bits";
import { bk } from "../components/CodexBits";
import { sessions, snapshots, people, personById, deskNotes, chronicle, western, hijri, latest, nf, estateMood, ESTATE_WORD } from "../lib/data";
import { leafById, leaves, books, parseVerse, SURAS, type Leaf } from "../lib/codex";
import "./codex.css";
import "./desk.css";

/*
 * The Desk: the open end of the book, where the writing goes on. The cover is the last sitting: what it
 * added and what changed in the realm. Behind it: the verses already spent, the court as it stands at
 * the last save, and what the build noticed. It stands at the frontier, so it tells how things stand now.
 */
export default function Desk() {
  const withLeaves = sessions.filter((s) => s.entries.length > 0);
  const cover = withLeaves[withLeaves.length - 1];
  const since = cover ? sessions.slice(sessions.indexOf(cover) + 1) : [];
  return (
    <div className="page desk">
      <PageHead
        title="The Desk"
        ar="المكتب"
        lede="The open end of the book, where the writing goes on: what the last sitting added, the verses already spent, the court as it stands at the last save, and what the build noticed. It stands at the frontier of the story, so it tells how things stand now; readers meeting the chronicle for the first time may want to start with the Codex instead."
      />
      <nav className="desk-jump ui" aria-label="On this page">
        <a href="#cover">The last sitting</a><a href="#verses">The verses spent</a><a href="#court">The court as it stands</a><a href="#notes">What the build noticed</a>
      </nav>
      {cover && <Cover sittingId={cover.id} since={since.map((s) => s.id)} />}
      <Verses />
      <CourtNow />
      <Notes />
    </div>
  );
}

/* ------------------------------------------------------------ the session cover */

function Cover({ sittingId, since }: { sittingId: string; since: string[] }) {
  const s = sessions.find((x) => x.id === sittingId)!;
  const ls = s.entries.map((id) => leafById.get(id)).filter(Boolean) as Leaf[];
  const words = ls.reduce((n, l) => n + l.words, 0);
  // the realm before the sitting's first new save, and at its last
  const cps = s.checkpoints.map((id) => snapshots.findIndex((x) => x.id === id)).filter((i) => i >= 0).sort((a, b) => a - b);
  const before = cps.length ? snapshots[Math.max(0, cps[0] - 1)] : undefined;
  const after = cps.length ? snapshots[cps[cps.length - 1]] : undefined;
  const later = since.map((id) => sessions.find((x) => x.id === id)!).filter(Boolean);
  const opened = books.filter((b) => b.first && ls.includes(b.first));
  return (
    <section id="cover" className="folio desk-sheet cover">
      <p className="ui eyebrow-line">The last sitting with new leaves</p>
      <h2 className="cover-date">{western(s.date)}</h2>
      <p className="cover-sum ui">
        {ls.length} lea{ls.length === 1 ? "f" : "ves"}, {nf.format(words)} words
        {s.reached && <> · the story reached {western(s.reached.to)} ({hijri(s.reached.to).text} AH)</>}
        {s.checkpoints.length > 0 && <> · {s.checkpoints.length} save{s.checkpoints.length > 1 ? "s" : ""} read</>}
        {s.people.length > 0 && <> · {s.people.length} new {s.people.length === 1 ? "person" : "people"}</>}
        {s.events > 0 && <> · {s.events} events</>}
        {opened.map((b) => <span key={b.id} style={bk(b)} className="bkc"> · {b.name} opened</span>)}
      </p>
      <ol className="cover-leaves">
        {ls.map((l) => (
          <li key={l.addr} style={bk(l.book)}>
            <Link to={`/codex/${l.addr}`}><span className="a ui">{l.label} · {l.book.short}</span><span className="t">{l.entry.title}</span></Link>
          </li>
        ))}
      </ol>
      {before && after && before !== after && <RealmDelta from={before.id} to={after.id} />}
      {s.people.length > 0 && (
        <p className="cover-people ui">New in the record: {s.people.map((p, i) => <span key={p}>{i ? ", " : ""}<EntityLink kind="person" id={p}>{personById.get(p)?.name ?? p}</EntityLink></span>)}</p>
      )}
      {later.length > 0 && (
        <div className="cover-since ui">
          <b>Since then:</b>{" "}
          {later.map((x, i) => <span key={x.id}>{i ? "; " : ""}{western(x.date)}{x.uncommitted ? " (in progress)" : ""}: {[x.people.length ? `${x.people.length} people` : "", x.checkpoints.length ? `${x.checkpoints.length} saves` : "", x.headlines.length ? x.headlines.map((h) => h.replace(/^\[[^\]]+\]\s*/, "")).join("; ") : "corrections"].filter(Boolean).join(", ")}</span>)}
        </div>
      )}
      {s.headlines.length > 0 && (
        <details className="cover-work ui">
          <summary>What was done that day ({s.commits} commit{s.commits === 1 ? "" : "s"})</summary>
          <ul>{s.headlines.map((h, i) => <li key={i}>{h.replace(/^\[[^\]]+\]\s*/, "")}</li>)}</ul>
        </details>
      )}
    </section>
  );
}

function RealmDelta({ from, to }: { from: string; to: string }) {
  const a = snapshots.find((s) => s.id === from)!, b = snapshots.find((s) => s.id === to)!;
  type Row = [string, string, string, number | null];
  const rows: Row[] = [];
  const num = (label: string, x?: number | null, y?: number | null, fmt = (v: number) => nf.format(Math.round(v))) => {
    if (x == null || y == null) return;
    rows.push([label, fmt(x), fmt(y), y - x]);
  };
  if (a.ruler !== b.ruler) rows.push(["Ruler", personById.get(a.ruler)?.name ?? a.ruler, personById.get(b.ruler)?.name ?? b.ruler, null]);
  num("Towns", a.locations, b.locations);
  num("People", a.population.total, b.population.total);
  num("Treasury", a.economy?.treasury, b.economy?.treasury);
  num("Stability", a.stability, b.stability, (v) => v.toFixed(0));
  for (const e of b.estates) {
    if (e.id === "crown") continue;
    const o = a.estates.find((x) => x.id === e.id);
    if (o?.satisfaction == null || e.satisfaction == null) continue;
    if (Math.abs(e.satisfaction - o.satisfaction) >= 5) rows.push([`The ${ESTATE_WORD[e.id] ?? e.name}`, `${Math.round(o.satisfaction)} · ${estateMood(o.satisfaction).word}`, `${Math.round(e.satisfaction)} · ${estateMood(e.satisfaction).word}`, e.satisfaction - o.satisfaction]);
  }
  if (!rows.length) return null;
  return (
    <div className="delta">
      <p className="ui delta-h">The realm, from the save of {western(a.date)} to that of {western(b.date)}</p>
      <table className="delta-t ui">
        <thead><tr><th scope="col"><span className="visually-hidden">What</span></th><th scope="col">Then</th><th scope="col">Now</th><th scope="col" className="num">Change</th></tr></thead>
        <tbody>{rows.map(([k, x, y, d]) => <tr key={k}><th scope="row">{k}</th><td>{x}</td><td>{y}</td><td className={`num ${d == null ? "" : d > 0 ? "up" : d < 0 ? "down" : ""}`}>{d == null ? "" : `${d > 0 ? "+" : d < 0 ? "−" : ""}${nf.format(Math.abs(Math.round(d)))}`}</td></tr>)}</tbody>
      </table>
      <p className="ui delta-note">Estates are listed when their satisfaction moved five points or more. Most are held near 50 by the tax rate and the nobles near 40, so a move is news.</p>
    </div>
  );
}

/* ------------------------------------------------------------ the verses spent */

function Verses() {
  const spent = useMemo(() => leaves
    .map((l) => ({ l, v: parseVerse(l.entry.verse) }))
    .filter((x) => x.v)
    .sort((a, b) => a.v!.sura - b.v!.sura || a.v!.from - b.v!.from), []);
  const [q, setQ] = useState("");
  const want = parseVerse(q.trim().replace(/\s+/g, ""));
  const clash = want ? spent.filter(({ v }) => v!.sura === want.sura && v!.from <= want.to && v!.to >= want.from) : [];
  const suras = new Set(spent.map((x) => x.v!.sura)).size;
  const missing = chronicle.filter((c) => !c.verse);
  return (
    <section id="verses" className="folio desk-sheet">
      <h2 className="sheet-title">The verses spent</h2>
      <p className="ui muted-ink">Every leaf closes on a verse of the Qurʾān, never one used before. {spent.length} are spent, from {suras} of the 114 sūras{missing.length ? `; ${missing.length} leaf has none recorded` : ""}. Check a verse before choosing it:</p>
      <div className="verse-check ui">
        <label htmlFor="vq">Sūra and āya</label>
        <input id="vq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 2:255 or 24:35-36" inputMode="numeric" autoComplete="off" />
        <output htmlFor="vq" aria-live="polite">
          {!q ? "" : !want ? "No such verse. Write it as sūra:āya or sūra:āya-āya (there are 114 sūras)." :
            clash.length ? <>Spent: {clash.map(({ l, v }) => <span key={l.addr}><b>{v!.name} {l.entry.verse}</b> closes <Link to={`/codex/${l.addr}`}>{l.entry.title}</Link>. </span>)}</> :
            <span className="free">Free: {want.name} {q.trim()} has not closed a leaf.</span>}
        </output>
      </div>
      <table className="verse-t">
        <thead className="ui"><tr><th scope="col">Verse</th><th scope="col">Sūra</th><th scope="col">Closes</th><th scope="col">Year</th></tr></thead>
        <tbody>
          {spent.map(({ l, v }) => (
            <tr key={l.addr} style={bk(l.book)}>
              <td className="ui num ref">{l.entry.verse}</td>
              <td>{v!.name}</td>
              <td><Link to={`/codex/${l.addr}`}>{l.entry.title}</Link>{l.verseHtml ? <span className="vt" dangerouslySetInnerHTML={{ __html: l.verseHtml }} /> : <span className="vt ui">set within the last paragraph</span>}</td>
              <td className="ui yr">{l.hy} · {l.entry.date.slice(0, 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ui muted-ink small">{114 - suras} sūras have closed no leaf yet, among them {SURAS.filter((_, i) => !spent.some((x) => x.v!.sura === i + 1)).slice(0, 6).join(", ")}…</p>
    </section>
  );
}

/* ------------------------------------------------------------ the court as it stands */

const ageAt = (born: string, d: string) => { const [y, m, dd] = born.split("-").map(Number); const [Y, M, D] = d.split("-").map(Number); return Y - y - (M < m || (M === m && D < dd) ? 1 : 0); };

function CourtNow() {
  const D = latest?.date;
  if (!D || !latest) return null;
  const lastNamed = new Map<string, Leaf>();
  for (const l of leaves) for (const p of l.entry.people) lastNamed.set(p, l);
  const seat = new Map<string, string>();
  const task = (r: string) => r[0].toLowerCase() + r.slice(1);
  latest.cabinet.forEach((c) => seat.set(c.person, `in the dīwān, ${task(c.role)}`));
  if (latest.heir) seat.set(latest.heir, seat.has(latest.heir) ? `heir; ${seat.get(latest.heir)}` : "heir");
  seat.set(latest.ruler, `on the throne${seat.has(latest.ruler) ? `; ${seat.get(latest.ruler)}` : ""}`);
  const alive = people.filter((p) => (!p.born || p.born <= D) && (!p.died || p.died > D));
  const inHouse = alive.filter((p) => p.dynasty === "Naṣrid" || seat.has(p.id));
  const rank = (id: string) => (id === latest.ruler ? 0 : id === latest.heir ? 1 : seat.has(id) ? 2 : 3);
  const sorted = [...inHouse].sort((a, b) => rank(a.id) - rank(b.id) || (a.born ?? "").localeCompare(b.born ?? ""));
  const seated = sorted.filter((p) => rank(p.id) < 3), rest = sorted.filter((p) => rank(p.id) === 3);
  const coming = rest.filter((p) => p.born && ageAt(p.born, D) < 16 && ageAt(p.born, D) >= 11).sort((a, b) => a.born!.localeCompare(b.born!));
  const quiet = rest.filter((p) => { const l = lastNamed.get(p.id); return p.born && ageAt(p.born, D) >= 16 && (!l || ageAt(l.entry.date, D) >= 20); });
  const Row = ({ p }: { p: typeof people[number] }) => {
    const l = lastNamed.get(p.id);
    const gap = l ? ageAt(l.entry.date, D) : null;
    return (
      <tr>
        <th scope="row"><EntityLink kind="person" id={p.id}>{p.name}</EntityLink></th>
        <td className="ui num">{p.born ? ageAt(p.born, D) : "?"}</td>
        <td className="ui st">{seat.get(p.id) ?? p.roles.find((r) => !/\(\d{4}[–-]\d{4}\)/.test(r) && !/dīwān|heir|regent|throne|sultan|emperor/i.test(r)) ?? ""}</td>
        <td className="ui ln">{l ? <><Link to={`/codex/${l.addr}`} style={bk(l.book)} className="lnk">{l.label}</Link>{gap! >= 10 ? <span className="gap"> · {gap} years ago</span> : ""}</> : <span className="never">never named in a leaf</span>}</td>
      </tr>
    );
  };
  const head = <thead className="ui"><tr><th scope="col">Name</th><th scope="col" className="num">Age</th><th scope="col">Station</th><th scope="col">Last named</th></tr></thead>;
  return (
    <section id="court" className="folio desk-sheet">
      <h2 className="sheet-title">The court as it stands</h2>
      <p className="ui muted-ink">At the save of {western(D)} ({hijri(D).text} AH): the throne, the heir and the dīwān, then the living house of Naṣr. Ages are at that date.</p>
      <table className="court-t">{head}<tbody>{seated.map((p) => <Row key={p.id} p={p} />)}</tbody></table>
      {coming.length > 0 && <>
        <h3 className="sub-h ui">Coming of age in the next five years</h3>
        <table className="court-t">{head}<tbody>{coming.map((p) => <Row key={p.id} p={p} />)}</tbody></table>
      </>}
      {quiet.length > 0 && <>
        <h3 className="sub-h ui">Grown members the book has not named in twenty years or more</h3>
        <table className="court-t">{head}<tbody>{quiet.map((p) => <Row key={p.id} p={p} />)}</tbody></table>
      </>}
      <details className="court-rest">
        <summary className="ui">The rest of the living house ({rest.length - coming.length - quiet.length})</summary>
        <table className="court-t">{head}<tbody>{rest.filter((p) => !coming.includes(p) && !quiet.includes(p)).map((p) => <Row key={p.id} p={p} />)}</tbody></table>
      </details>
    </section>
  );
}

/* ------------------------------------------------------------ the build's notes */

const NOTE_KIND: Record<string, string> = { "before-birth": "Named before birth", verse: "No closing verse", log: "The session log" };
function Notes() {
  return (
    <section id="notes" className="folio desk-sheet">
      <h2 className="sheet-title">What the build noticed</h2>
      <p className="ui muted-ink">Each time the site is built it checks the record for continuity: no one seated in the dīwān after their death or before their birth, the throne matching the reigns, no verse spent twice. Those stop the build. The notes below don't: they are for the writer to look at.</p>
      {deskNotes.length === 0 ? <p className="ui">Nothing to note.</p> : (
        <ul className="notes-l ui">
          {deskNotes.map((n, i) => {
            const l = n.at ? leafById.get(n.at) : undefined;
            return <li key={i}><b>{NOTE_KIND[n.kind] ?? n.kind}.</b> {l ? <><Link to={`/codex/${l.addr}`}>{l.entry.title}</Link>: </> : null}{n.msg.replace(/^story\/\S+ /, "")}</li>;
          })}
        </ul>
      )}
    </section>
  );
}
