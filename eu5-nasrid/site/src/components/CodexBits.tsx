import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { arabicDigits, western } from "../lib/data";
import { toHijri } from "../lib/hijri";
import { leaves, books, reigns, savesByHy, silences, hyLabel, catchwordsFor, follow, type Book, type Leaf, type Catch } from "../lib/codex";

export const bk = (b: Book | undefined): CSSProperties => (b ? ({ "--bk": b.color } as CSSProperties) : {});

/** The sticky head of every codex page: the book and reign on the left, where you are on the right. */
export function RunningHead({ book, left, right, prev, next }: { book?: Book; left: ReactNode; right: ReactNode; prev?: string; next?: string }) {
  return (
    <div className="codex-head ui" style={bk(book)}>
      <div className="l">{left}</div>
      <div className="r">
        <span className="where">{right}</span>
        <nav className="steps" aria-label="Turn the leaves">
          {prev ? <Link to={prev} aria-label="Previous leaf">‹</Link> : <span aria-hidden="true">‹</span>}
          <Link to="/codex">Tables</Link>
          {next ? <Link to={next} aria-label="Next leaf">›</Link> : <span aria-hidden="true">›</span>}
        </nav>
      </div>
    </div>
  );
}

/** An eight-pointed star in the book's pigment, set over the closing verse. */
export const Star = ({ size = 18 }: { size?: number }) => (
  <svg className="star8" width={size} height={size} viewBox="-10 -10 20 20" aria-hidden="true">
    <rect x="-6" y="-6" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <rect x="-6" y="-6" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(45)" />
    <circle r="1.6" fill="currentColor" />
  </svg>
);

/** Where a link to a catchword leads. */
export const catchHref = (c: Catch) => (c.kind === "leaf" ? `/codex/${c.leaf.addr}` : c.kind === "opening" ? `/codex/book/${c.book.id}` : undefined);

/** The catchwords at the foot of a leaf, the one the reader last followed first. */
export function Catchwords({ leaf }: { leaf: Leaf }) {
  let cs = catchwordsFor(leaf);
  if (follow.get() === "book") cs = [...cs].sort((a, b) => (a.kind === "leaf" && a.follow === "book" ? -1 : 0) - (b.kind === "leaf" && b.follow === "book" ? -1 : 0));
  return (
    <div className="catchwords">
      {cs.map((c, i) => <CatchLine key={i} c={c} />)}
    </div>
  );
}

export function CatchLine({ c }: { c: Catch }) {
  const href = catchHref(c);
  const style = { "--bk": c.color } as CSSProperties;
  if (!href) return <p className={`catch quiet ${c.kind}`} style={style}>{c.label}</p>;
  const onClick = () => { if (c.kind === "leaf" && c.follow !== "both") follow.set(c.follow); };
  return (
    <Link to={href} className={`catch ${c.kind}`} style={style} onClick={onClick}>
      <span className="k ui">{c.label}</span>
      {c.kind === "leaf" && <>
        <span className="w">{c.leaf.catchword}</span>
        <span className="a ui">{c.leaf.label} · {c.leaf.entry.title}</span>
      </>}
      {c.kind === "opening" && <>
        <span className="w ar">{c.book.era.titleArabic}</span>
        <span className="a ui">Book {c.book.n} · {c.book.leaves.length} leaves</span>
      </>}
    </Link>
  );
}

/**
 * The run of the years: one bar per Hijri year, a block per leaf in its book's pigment; a dot under the
 * axis for each save read; dashed lines where a reign begins; hatched bands where no save was taken for
 * more than five years. Each block opens its leaf.
 */
export function YearStrip({ mark }: { mark?: string }) {
  if (!leaves.length) return null;
  const hy0 = leaves[0].hy - 1, hy1 = Math.max(leaves[leaves.length - 1].hy, ...[...savesByHy.keys()]) + 1;
  const n = hy1 - hy0 + 1;
  const W = 1000, bw = W / n, cell = Math.min(9, bw - 1.5);
  const byYear = new Map<number, Leaf[]>();
  leaves.forEach((l) => byYear.set(l.hy, [...(byYear.get(l.hy) ?? []), l]));
  const most = Math.max(...[...byYear.values()].map((x) => x.length));
  const base = 22 + most * (cell + 2) + 14, H = base + 44;
  const x = (hy: number) => (hy - hy0) * bw;
  const xd = (d: string) => { const h = toHijri(d); return x(h.y + (h.m - 1) / 12 + (h.d - 1) / 354); };
  const decades = []; for (let d = Math.ceil(hy0 / 10) * 10; d <= hy1; d += 10) decades.push(d);
  return (
    <figure className="year-strip">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The run of the years, ${hy0 + 1} to ${hy1 - 1} AH: leaves by book, saves and silences`}>
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(90,70,48,0.28)" strokeWidth="2" />
          </pattern>
        </defs>
        {silences.map((s) => (
          <g key={s.from}>
            <rect x={xd(s.from)} y={10} width={xd(s.to) - xd(s.from)} height={base - 10 + 26} fill="url(#hatch)" />
            <text x={(xd(s.from) + xd(s.to)) / 2} y={20} className="silence-l" textAnchor="middle">no save, {toHijri(s.from).y}–{toHijri(s.to).y}</text>
          </g>
        ))}
        {reigns.filter((r) => r.hy > hy0).map((r) => (
          <g key={r.from}>
            <line x1={xd(r.from)} x2={xd(r.from)} y1={28} y2={base} className="reign-l" />
            <text x={xd(r.from) + 3} y={36} className="reign-t">{r.person.name.split(" ibn ")[0]}</text>
          </g>
        ))}
        {[...byYear.entries()].map(([hy, ls]) => ls.map((l, i) => (
          <Link key={l.addr} to={`/codex/${l.addr}`} aria-label={`${l.label}, ${l.entry.title}`}>
            <rect x={x(hy) + (bw - cell) / 2} y={base - (i + 1) * (cell + 2)} width={cell} height={cell} rx={1}
              fill={l.book.color} className={mark === l.addr ? "on" : ""}><title>{l.label} · {l.book.short} · {l.entry.title}</title></rect>
          </Link>
        )))}
        <line x1={0} x2={W} y1={base} y2={base} className="axis" />
        {[...savesByHy.entries()].map(([hy, k]) => Array.from({ length: Math.min(k, 4) }, (_, i) => (
          <circle key={`${hy}-${i}`} cx={x(hy) + bw / 2} cy={base + 6 + i * 4.2} r={1.5} className="save-dot" />
        )))}
        {decades.map((d) => (
          <g key={d}>
            <line x1={x(d)} x2={x(d)} y1={base} y2={base + 26} className="tick" />
            <text x={x(d) + 3} y={base + 38} className="dec">{d} · {hyLabel(d).split("–")[0]}</text>
          </g>
        ))}
      </svg>
      <figcaption className="ui strip-key">
        {books.map((b) => <span key={b.id} style={bk(b)}><i />{b.short}</span>)}
        <span className="k-dot">dots: saves read</span>
        <span className="k-reign">dashed: a new reign</span>
        <span className="k-hatch">hatched: no save for over five years</span>
      </figcaption>
    </figure>
  );
}

/** "21 Ṣafar 772 AH · 14 September 1370" with the Arabic date above, for headers. */
export function LeafDates({ date, endDate }: { date: string; endDate?: string }) {
  const h = toHijri(date);
  return <span className="leaf-dual ui">{h.d} {["Muḥarram", "Ṣafar", "Rabīʿ al-Awwal", "Rabīʿ al-Thānī", "Jumādā al-Ūlā", "Jumādā al-Ākhira", "Rajab", "Shaʿbān", "Ramaḍān", "Shawwāl", "Dhū al-Qaʿda", "Dhū al-Ḥijja"][h.m - 1]} {h.y} AH · {western(date)}{endDate ? ` to ${western(endDate)}` : ""}</span>;
}

export const arYear = (hy: number) => arabicDigits(hy);
