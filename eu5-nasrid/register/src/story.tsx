/* The story told with pictures: the realm growing on a map, the books as chapters, wars on their ground, lives side by side. */
import { useEffect, useMemo, useState } from "react";
import { D, campaign, cast, reckonings, beats, tellings, threads, threadById, beatById, now, Y0, Y1, cf, nf, first, short, age, rulerAt, ordinal, hijriSpan, type Beat, type Person, type Telling } from "./core";
import { Frieze, frac } from "./frieze";
import { formatHijri, formatWestern } from "./hijri";

const VIEW = campaign.map?.story ?? [1215, 1225, 1440, 900];
const outline = (date: string) => D.outlines[date] ?? D.outlines[Object.keys(D.outlines).filter((d) => d <= date).at(-1) ?? ""] ?? { o: "", s: "", a: "" };
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_]/g, "");
const firstSentence = (s: string) => plain(s).split(/(?<=[.!?])\s/)[0];

/* ------------------------------------------------------------------ the seal: a name in an eight-pointed star */
export function Seal({ id, size = 76 }: { id: string; size?: number }) {
  const p = cast[id];
  const word = p?.arabic ? p.arabic.split(" ").find((w) => !["بن", "بنت", "ابن", "أبو"].includes(w)) ?? p.arabic.split(" ")[0] : first(id).slice(0, 2);
  const house = p?.house === "Naṣrid" ? "nasrid" : "other";
  return (
    <svg className={`seal ${house}${p?.died ? "" : " living"}`} viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true">
      <rect x="-33" y="-33" width="66" height="66" /><rect x="-33" y="-33" width="66" height="66" transform="rotate(45)" />
      <circle r="30" />
      <text y={p?.arabic ? 7 : 8} textAnchor="middle" className={p?.arabic ? "ar" : ""} style={{ fontSize: p?.arabic ? (word.length > 5 ? 17 : 22) : 24 }}>{word}</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ the map of the story */
function Land({ view = VIEW, children, label }: { view?: number[]; children: React.ReactNode; label: string }) {
  return (
    <svg className="land" viewBox={view.join(" ")} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <path className="l-land" d={D.land} />
      {children}
    </svg>
  );
}

function Hero() {
  const [i, setI] = useState(reckonings.length - 1);
  const [playing, setPlaying] = useState(false);
  const r = reckonings[i], o = outline(r.date);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((x) => { if (x >= reckonings.length - 1) { setPlaying(false); return x; } return x + 1; }), 420);
    return () => clearInterval(t);
  }, [playing]);
  const pick = (y: number) => { setPlaying(false); const k = reckonings.findLastIndex((x) => +x.date.slice(0, 4) <= y); setI(Math.max(0, k)); };
  const ruler = rulerAt(r.date), reign = ruler?.[1].reigns?.find((g) => g.from <= r.date && (!g.to || g.to > r.date));
  const y = +r.date.slice(0, 4);
  const wars = (r.standing?.wars ?? []).map((w) => threadById.get(w)).filter(Boolean);
  const first0 = reckonings[0];
  return (
    <section className="hero">
      <div className="hero-map">
        <Land label={`The realm in ${y}`}>
          <path className="l-ally" d={o.a} /><path className="l-subject" d={o.s} /><path className="l-ours" d={o.o} />
        </Land>
        <div className="hero-cap">
          <p className="hc-year">{y}<span>{hijriSpan(y)} AH</span></p>
          <h1>{r.title}</h1>
          {ruler && <p className="hc-ruler">{cast[ruler[0]].name}{reign ? `, ${ordinal(y - +reign.from.slice(0, 4) + 1)} year` : ""}</p>}
          <p className="hc-count">{nf.format(r.realm.towns)} towns{r.realm.souls ? `, ${cf.format(r.realm.souls)} souls` : ""}{wars.length ? <>. At war: {wars.map((w, k) => <span key={w!.id}>{k ? ", " : ""}<a href={`#thread-${w!.id}`}>{w!.title}</a></span>)}</> : ". At peace"}.</p>
          <p className="hc-links"><a href={`#line-${y}`}>Read {y} in the record</a></p>
        </div>
        <p className="map-key"><span><i className="sw l-ours" />The crown</span><span><i className="sw l-subject" />Its ṭāʾifas and vassals</span><span><i className="sw l-ally" />Its allies</span></p>
      </div>
      <div className="hero-ctl">
        <button type="button" className="play" onClick={() => { if (i >= reckonings.length - 1) setI(0); setPlaying((p) => !p); }}>{playing ? "Pause" : i >= reckonings.length - 1 ? `Play from ${first0.date.slice(0, 4)}` : "Play on"}</button>
        <button type="button" onClick={() => { setPlaying(false); setI(Math.max(0, i - 1)); }} disabled={i === 0} aria-label="The reckoning before">Earlier</button>
        <button type="button" onClick={() => { setPlaying(false); setI(Math.min(reckonings.length - 1, i + 1)); }} disabled={i === reckonings.length - 1} aria-label="The reckoning after">Later</button>
        <span className="hint">or choose a year on the band</span>
      </div>
      <Frieze at={y} onPick={pick} />
    </section>
  );
}

/* ------------------------------------------------------------------ the books as chapters */
type Chapter = { id: string; title: string; arabic?: string; summary?: string; tales: Telling[]; from: string; to: string };
const chapters: Chapter[] = campaign.eras.map((e) => {
  const tales = tellings.filter((t) => t.book === e.id);
  return { id: e.id, title: e.title, arabic: e.arabic, summary: e.summary, tales, from: tales[0]?.on ?? e.from, to: tales.at(-1)?.on ?? e.to ?? now.date };
}).filter((c) => c.tales.length).sort((a, b) => a.from.localeCompare(b.from));
const reckonAt = (d: string) => reckonings.findLast((r) => r.date <= d) ?? reckonings[0];

function ChapterPanel({ c, n }: { c: Chapter; n: number }) {
  const a = reckonAt(c.from), b = reckonAt(c.to), oa = outline(a.date), ob = outline(b.date);
  const drivers = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of c.tales) for (const w of t.who ?? []) if (cast[w]?.tier) m.set(w, (m.get(w) ?? 0) + (cast[w].tier === "central" ? 2 : 1));
    return [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([id]) => id);
  }, [c.id]);
  const wars = threads.filter((t) => t.kind === "war" && c.tales.some((x) => x.covers?.some((id) => beatById.get(id)?.threads?.includes(t.id))));
  const line = (id: string) => { const p = cast[id]; const d = (p.drives ?? []).filter((x) => x.from <= c.to).at(-1) ?? p.drives?.[0]; return d?.text ?? p.roles?.[0] ?? ""; };
  const grew = b.realm.towns !== a.realm.towns;
  return (
    <section className="chapter" id={`book-${n}`}>
      <header>
        <p className="ch-n">Book {n}, {c.from.slice(0, 4)} to {c.to.slice(0, 4) === String(Y1) ? "the present" : c.to.slice(0, 4)}</p>
        <h2>{c.title}{c.arabic && <bdi className="ar" lang="ar" dir="rtl">{c.arabic}</bdi>}</h2>
      </header>
      <div className="ch-grid">
        <div className="ch-text">
          <p className="ch-sum">{c.summary}</p>
          <p className="ch-count">{grew ? <>The realm went from <strong>{nf.format(a.realm.towns)}</strong> towns to <strong>{nf.format(b.realm.towns)}</strong></> : <>The realm held <strong>{nf.format(b.realm.towns)}</strong> towns throughout</>}{a.realm.souls && b.realm.souls ? <>, and from {cf.format(a.realm.souls)} souls to {cf.format(b.realm.souls)}</> : null}.{wars.length > 0 && <> Its wars: {wars.map((w, k) => <span key={w.id}>{k ? ", " : ""}<a href={`#thread-${w.id}`}>{w.title}</a></span>)}.</>}</p>
        </div>
        <figure className="ch-map">
          <Land label={`The realm at the end of ${c.title}`}>
            <path className="l-subject" d={ob.s} /><path className="l-ours" d={ob.o} /><path className="l-ghost" d={oa.o} />
          </Land>
          <figcaption>{grew ? `Filled: the realm in ${b.date.slice(0, 4)}. Outlined: in ${a.date.slice(0, 4)}.` : `The realm in ${b.date.slice(0, 4)}.`}</figcaption>
        </figure>
      </div>
      {drivers.length > 0 && (
        <ul className="drivers">
          {drivers.map((id) => <li key={id}><a href={`#who-${id}`}><Seal id={id} /><span className="d-name">{short(id)}</span></a><span className="d-line">{line(id)}</span></li>)}
        </ul>
      )}
      <div className="scenes" role="list" aria-label={`The tellings of ${c.title}`}>
        {c.tales.map((t) => (
          <a role="listitem" key={t.id} href={`#telling-${t.id}`} className="scene">
            <span className="sc-year">{t.on.slice(0, 4)}</span>
            <span className="sc-title">{t.title}</span>
            <span className="sc-lede">{firstSentence(t.text)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function Story() {
  return (
    <>
      <Hero />
      <header className="page-head story-head">
        <h2 className="big">The story in {chapters.length} books</h2>
        <p className="sub">The books are themes, so some run side by side. Each one says what changed, shows it on the map, and names the people who drove it. The tellings are its scenes.</p>
        <nav className="toc">{chapters.map((c, k) => <a key={c.id} href={`#line`} onClick={(e) => { e.preventDefault(); document.getElementById(`book-${k + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{c.title}</a>)}</nav>
      </header>
      {chapters.map((c, k) => <ChapterPanel key={c.id} c={c} n={k + 1} />)}
    </>
  );
}

/* ------------------------------------------------------------------ a war on its ground */
export function BattleMap({ bs, from }: { bs: Beat[]; from?: string }) {
  const pts = bs.filter((b) => b.at);
  if (pts.length < 2) return null;
  const xs = pts.map((b) => b.at![0]), ys = pts.map((b) => b.at![1]);
  let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pad = Math.max(60, (x1 - x0) * 0.12); x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
  const w = Math.max(x1 - x0, (y1 - y0) * 1.9, 420), h = w / 1.9, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const view = [cx - w / 2, cy - h / 2, w, h], u = w / 100; // u: one percent of the width, so marks keep their size
  const o = outline(from ?? pts[0].on);
  const seen = new Map<string, number>();
  return (
    <figure className="battlemap">
      <Land view={view} label="Where the war was fought">
        <path className="l-subject" d={o.s} /><path className="l-ours" d={o.o} />
        {pts.map((b, k) => {
          const key = b.at!.join(","), n = seen.get(key) ?? 0; seen.set(key, n + 1);
          const x = b.at![0] + n * u * 1.1, y = b.at![1] - n * u * 0.5, r = (b.minor ? 0.9 : 1.35) * u;
          return (
            <g key={b.id} className={`bt ${b.won === true ? "won" : b.won === false ? "lost" : "even"}${b.minor ? " minor" : ""}`}>
              <title>{`${formatWestern(b.on)}: ${b.what}`}</title>
              <circle cx={x} cy={y} r={r} style={{ strokeWidth: u * 0.28 }} />
              {!b.minor && <text x={x} y={y + u * 0.55} textAnchor="middle" style={{ fontSize: u * 1.5 }}>{k + 1}</text>}
            </g>
          );
        })}
      </Land>
      <figcaption><span><i className="bd won" />Won</span><span><i className="bd lost" />Lost</span><span><i className="bd even" />Undecided or unrecorded</span><span>Small marks are allies' fights. Numbers follow the order of the fighting; hover a mark for the day.</span></figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ lives side by side */
export function LifeLines({ id }: { id: string }) {
  const p = cast[id];
  if (!p.born) return null;
  const kin: [string, string][] = [];
  const add = (x: string | undefined, label: string) => { if (x && cast[x]?.born && x !== id && !kin.some((k) => k[0] === x)) kin.push([x, label]); };
  add(p.father, "father"); add(p.mother, "mother");
  for (const t of p.ties ?? []) add(t.with, t.kind);
  for (const [o, c] of Object.entries(cast)) for (const t of c.ties ?? []) if (t.with === id) add(o, t.kind);
  Object.entries(cast).filter(([, c]) => c.father === id || c.mother === id).sort((a, b) => (a[1].born ?? "").localeCompare(b[1].born ?? "")).slice(0, 6).forEach(([c]) => add(c, "child"));
  const end = (q: Person) => frac(q.died ?? now.date);
  const rows: [string, string][] = [[id, ""], ...kin];
  const t0 = Math.floor(Math.min(...rows.map(([r]) => frac(cast[r].born!))) / 10) * 10, t1 = Math.ceil(Math.max(...rows.map(([r]) => end(cast[r]))) / 10) * 10;
  const L = 190, W = 900, rowH = 26, top = 56, H = top + rows.length * rowH + 30;
  const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (W - L - 16);
  const drives = p.drives ?? [];
  return (
    <figure className="lives">
      <div className="scroll-x">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The life of ${p.name} beside the people around ${p.sex === "f" ? "her" : "him"}`}>
          {Array.from({ length: (t1 - t0) / 10 + 1 }, (_, k) => t0 + k * 10).map((t) => <g key={t}><line className="lv-grid" x1={x(t)} x2={x(t)} y1={top - 14} y2={H - 24} /><text className="lv-year" x={x(t)} y={H - 8} textAnchor="middle">{t}</text></g>)}
          {rows.map(([r, label], k) => {
            const q = cast[r], y = top + k * rowH, main = k === 0, a = x(frac(q.born!)), b = x(end(q));
            return (
              <g key={r} className={main ? "lv-main" : "lv-kin"}>
                <a href={`#who-${r}`}><text className="lv-name" x={L - 12} y={y + 4} textAnchor="end">{short(r)}</text></a>
                {!main && <text className="lv-rel" x={a - 6} y={y + 3.5} textAnchor="end">{label}</text>}
                <line className={`lv-life${q.died ? "" : " open"}`} x1={a} x2={b} y1={y} y2={y} />
                {(q.reigns ?? []).map((g) => <line key={g.from} className="lv-reign" x1={x(frac(g.from))} x2={x(frac(g.to ?? now.date))} y1={y} y2={y} />)}
                <circle className="lv-end" cx={a} cy={y} r={main ? 4 : 3} />
                {q.died && <rect className="lv-end" x={b - 1.5} y={y - (main ? 7 : 5)} width={3} height={main ? 14 : 10} />}
                {main && drives.map((d, n) => <g key={d.from + n}><circle className="lv-pin" cx={x(frac(d.from))} cy={y - 18} r={8.5} /><line className="lv-stem" x1={x(frac(d.from))} x2={x(frac(d.from))} y1={y - 9.5} y2={y - 2} /><text className="lv-pinn" x={x(frac(d.from))} y={y - 14.3} textAnchor="middle">{n + 1}</text></g>)}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>A dot is a birth and a bar a death; the heavy stretch is a reign.{drives.length ? " The numbers are the turns listed below." : ""} {p.died ? `Died aged ${age(p, p.died)}.` : `Aged ${age(p, now.date)} at the last reckoning.`}</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ the weave: every story thread across the years */
export function Weave() {
  const lanes = threads.filter((t) => t.kind === "story");
  const L = 190, W = 1000, rowH = 30, top = 14, H = top + lanes.length * rowH + 26;
  const x = (t: number) => L + ((t - Y0) / (Y1 + 1 - Y0)) * (W - L - 12);
  return (
    <figure className="weave">
      <div className="scroll-x">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The story threads across the years">
          {Array.from({ length: Y1 - Y0 + 1 }, (_, k) => Y0 + k).filter((y) => y % 10 === 0).map((y) => <g key={y}><line className="lv-grid" x1={x(y)} x2={x(y)} y1={top - 6} y2={H - 22} /><text className="lv-year" x={x(y)} y={H - 6} textAnchor="middle">{y}</text></g>)}
          {lanes.map((t, k) => {
            const bs = beats.filter((b) => b.threads?.includes(t.id)), y = top + k * rowH + 10;
            const ts = tellings.filter((s) => s.covers?.some((c) => beatById.get(c)?.threads?.includes(t.id)));
            if (!bs.length) return null;
            return (
              <g key={t.id} className={`wv wv-${k % 4}`}>
                <a href={`#thread-${t.id}`}><text className="lv-name" x={L - 12} y={y + 4} textAnchor="end">{t.title}</text></a>
                <line className="wv-run" x1={x(frac(bs[0].on))} x2={x(t.state === "closed" ? frac(bs.at(-1)!.on) : Y1 + 1)} y1={y} y2={y} />
                {bs.map((b) => <line key={b.id} className="wv-beat" x1={x(frac(b.on))} x2={x(frac(b.on))} y1={y - 6} y2={y + 6}><title>{`${b.on.slice(0, 4)}: ${b.what}`}</title></line>)}
                {ts.map((s) => <a key={s.id} href={`#telling-${s.id}`}><rect className="wv-tale" x={x(frac(s.on)) - 3.5} y={y - 3.5} width={7} height={7} transform={`rotate(45 ${x(frac(s.on))} ${y})`}><title>{`${s.on.slice(0, 4)}: ${s.title}`}</title></rect></a>)}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>A stroke is an entry on that thread; a tile is a telling that takes it up. A line that stops is a story that is settled.</figcaption>
    </figure>
  );
}
