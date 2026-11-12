import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RunningHead, Catchwords, Star, LeafDates, bk } from "../components/CodexBits";
import { leaves, leafByAddr, leafById, canonOf, reignAt, regnalYear, ribbon, verseCite, nextHref, prevHref, type Leaf } from "../lib/codex";
import { notes, western, sessions } from "../lib/data";
import { ordinal } from "./Codex";
import "./chronicle.css";
import "./codex.css";

/*
 * One leaf of the Codex: the running head, the leaf's address and place in its book, the prose as a
 * book page, the closing verse set apart as the colophon, then the catchwords. The margins (who and
 * where, on what authority) are the Folio's, a later step; until then the player's note sits at the foot.
 */
export default function CodexLeaf() {
  const { addr = "" } = useParams();
  const navigate = useNavigate();
  // an old file id works too, so a link from the Chronicle can find its leaf
  const leaf = leafByAddr.get(addr) ?? leafById.get(addr);
  const prev = leaf ? leaves[leaf.n - 2] : undefined;
  // turning leaves passes through each book's opening page, as the catchwords do
  const goPrev = leaf ? prevHref(leaf) : undefined;
  const goNext = leaf ? nextHref(leaf) : undefined;

  useEffect(() => { if (leaf) ribbon.set(leaf.addr); }, [leaf]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft" && goPrev) navigate(goPrev);
      if (e.key === "ArrowRight" && goNext) navigate(goNext);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [goPrev, goNext, navigate]);

  if (!leaf) return <div className="page"><h1>No leaf at this address</h1><p className="muted">Leaves are addressed by their Hijri date, as 772-02-21. <Link to="/codex">Find it in the canon tables.</Link></p></div>;

  const { book, entry } = leaf;
  const reign = reignAt(entry.date);
  const glosses = notes.filter((n) => n.about === entry.id);
  const prevInBook = book.leaves[leaf.bn - 2];
  const canon = canonOf(leaf);
  const isLast = leaf === book.last;
  const sitting = sessions.find((s) => s.id === leaf.boundIn);
  const cite = verseCite(entry.verse);

  return (
    <div className="page codex-page" style={bk(book)}>
      <RunningHead
        book={book}
        left={<><span className="bkname">{book.name}</span>{reign && <span className="reign">{reign.person.name}, {ordinal(regnalYear(entry.date, reign))} year</span>}</>}
        right={<><span>{leaf.hy} AH · {entry.date.slice(0, 4)}</span><span>leaf {leaf.n} of {leaves.length}</span></>}
        prev={goPrev} next={goNext}
      />

      <article className="folio codex-leaf" aria-labelledby="leaf-title">
        <div className="leaf-head ui">
          <span className="addr">Leaf {leaf.label}</span>
          <span>{book.short}, leaf {leaf.bn} of {book.leaves.length}{!book.closed && isLast ? " so far" : ""}</span>
        </div>
        <h1 id="leaf-title" className="leaf-h1">{entry.title}</h1>
        <div className="leaf-dates-line"><LeafDates date={entry.date} endDate={entry.endDate} /></div>

        <div className="leaf-body codex-body" dangerouslySetInnerHTML={{ __html: leaf.body }} />

        <div className="colophon-verse">
          <Star />
          {leaf.verseHtml && <p className="verse" dangerouslySetInnerHTML={{ __html: leaf.verseHtml }} />}
          {cite && <p className="cite ui">{leaf.verseHtml ? "" : "The closing verse, in the last lines above: "}{cite}</p>}
        </div>

        {isLast && book.closed && (
          <p className="explicit-tally ui">Here ends {book.name.replace(/^The /, "the ")}: {book.leaves.length} leaves, {book.words.toLocaleString("en-GB")} words, {book.first!.hy}–{leaf.hy} AH ({book.era.start.slice(0, 4)}–{book.era.end!.slice(0, 4)})</p>
        )}
        {isLast && !book.closed && leaf.n < leaves.length && <p className="explicit-tally ui">{book.name} goes on, written as the campaign is played.</p>}

        {glosses.length > 0 && (
          <details className="leaf-note">
            <summary className="ui">{glosses.length === 1 ? "The player's note on this leaf" : `The player's ${glosses.length} notes on this leaf`}</summary>
            {glosses.map((g) => (
              <div key={g.id} className="gloss">
                <div className="gloss-title">{g.title}</div>
                <div className="gloss-body" dangerouslySetInnerHTML={{ __html: g.html }} />
              </div>
            ))}
          </details>
        )}

        <Catchwords leaf={leaf} />

        <nav className="quiet-links ui" aria-label="Back through the codex">
          {prev && <Link to={`/codex/${prev.addr}`}>‹ previous in the codex</Link>}
          {prevInBook && prevInBook !== prev && <Link to={`/codex/${prevInBook.addr}`} style={bk(book)} className="inbook">‹ previous in {book.short}</Link>}
          <Link to={`/codex?leaf=${leaf.addr}`}>find it in the tables (Canon {canon.n})</Link>
          <Link to={`/chronicle/${entry.id}`}>this entry with its margin, in the Chronicle</Link>
        </nav>
        <p className="leaf-colophon ui">{leafColophon(leaf, sitting?.date)}</p>
      </article>
      <p className="hint keys ui">The left and right arrow keys turn the leaves.</p>
    </div>
  );
}

function leafColophon(l: Leaf, bound?: string) {
  const bits = [`${l.words.toLocaleString("en-GB")} words`];
  if (l.save) bits.push(`read from the save of ${western(l.save)}`);
  if (bound) bits.push(`written up on ${western(bound)}`);
  return bits.join(" · ");
}
