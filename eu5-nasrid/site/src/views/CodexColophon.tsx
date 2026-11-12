import { Link } from "react-router-dom";
import { RunningHead, bk } from "../components/CodexBits";
import { books, leaves, leafById, canons, totalWords } from "../lib/codex";
import { hijri, western, sessions, personById } from "../lib/data";
import "./chronicle.css";
import "./codex.css";

/*
 * The colophon: what the codex holds as it stands, and the binding log, one line per sitting, from the
 * session log (tools/sessions.py), newest first.
 */
export default function CodexColophon() {
  const first = leaves[0], last = leaves[leaves.length - 1];
  const closed = books.filter((b) => b.closed), open = books.filter((b) => !b.closed);
  const log = [...sessions].reverse();
  return (
    <div className="page codex-page">
      <RunningHead left={<span className="bkname">The colophon</span>} right={<span>{leaves.length} leaves</span>} prev={last && `/codex/${last.addr}`} />
      <article className="folio codex-leaf colophon">
        <h1 className="leaf-h1">Colophon</h1>
        {first && last && (
          <p className="colophon-text">
            This codex holds <b>{leaves.length} leaves</b> and about {Math.round(totalWords / 1000)} thousand words, in {words(books.length)} books
            and {words(canons.length)} canons, from <Link to={`/codex/${first.addr}`}>{hijri(first.entry.date).text} AH ({western(first.entry.date)})</Link> to{" "}
            <Link to={`/codex/${last.addr}`}>{hijri(last.entry.date).text} AH ({western(last.entry.date)})</Link>.
            {" "}{cap(words(closed.length))} books are closed: {closed.map((b, i) => <span key={b.id}>{i ? ", " : ""}<Link to={`/codex/book/${b.id}`} style={bk(b)} className="bklink">{b.short}</Link></span>)}.
            {" "}{cap(words(open.length))} are still being written: {open.map((b, i) => <span key={b.id}>{i ? ", " : ""}<Link to={`/codex/book/${b.id}`} style={bk(b)} className="bklink">{b.short}</Link></span>)}.
            {" "}Played and told by Trent, and set down with Claude after each sitting.
          </p>
        )}

        <h2 className="sheet-title">The binding log</h2>
        <p className="ui muted-ink">One line for each sitting at which the record was added to, newest first. Its leaves were bound that day; the years are those the sitting reached.</p>
        <ol className="binding-log">
          {log.map((s) => {
            const ls = s.entries.map((id) => leafById.get(id)).filter(Boolean) as typeof leaves;
            const opened = books.filter((b) => b.first && ls.includes(b.first));
            const shut = books.filter((b) => b.closed && b.last && ls.includes(b.last));
            return (
              <li key={s.id}>
                <div className="bl-h">
                  <span className="bl-d ui">{western(s.date)}{s.uncommitted ? " (in progress)" : ""}</span>
                  {s.reached && <span className="bl-r ui">reached {hijri(s.reached.from).y === hijri(s.reached.to).y ? hijri(s.reached.to).y : `${hijri(s.reached.from).y}–${hijri(s.reached.to).y}`} AH · {s.reached.from.slice(0, 4) === s.reached.to.slice(0, 4) ? s.reached.to.slice(0, 4) : `${s.reached.from.slice(0, 4)}–${s.reached.to.slice(0, 4)}`}</span>}
                </div>
                <p className="bl-sum ui">
                  {[
                    ls.length ? `${ls.length} lea${ls.length === 1 ? "f" : "ves"}` : "no leaves",
                    s.notes.length ? `${s.notes.length} note${s.notes.length > 1 ? "s" : ""}` : "",
                    s.checkpoints.length ? `${s.checkpoints.length} save${s.checkpoints.length > 1 ? "s" : ""} read` : "",
                    s.people.length ? `${s.people.length} new ${s.people.length === 1 ? "person" : "people"}` : "",
                    s.events ? `${s.events} events` : "",
                  ].filter(Boolean).join(" · ")}
                  {opened.map((b) => <span key={b.id} className="opened" style={bk(b)}> · {b.name} opened</span>)}
                  {shut.map((b) => <span key={b.id} className="opened" style={bk(b)}> · {b.name} closed</span>)}
                </p>
                {ls.length > 0 && (
                  <ul className="bl-leaves">
                    {ls.map((l) => <li key={l.addr} style={bk(l.book)}><Link to={`/codex/${l.addr}`}><span className="a ui">{l.label}</span> {l.entry.title}</Link></li>)}
                  </ul>
                )}
                {ls.length === 0 && s.people.length > 0 && s.people.length <= 12 && (
                  <p className="bl-people ui">{s.people.map((p) => personById.get(p)?.name ?? p).join(", ")}</p>
                )}
              </li>
            );
          })}
        </ol>
      </article>
    </div>
  );
}

const words = (n: number) => ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"][n] ?? String(n);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
