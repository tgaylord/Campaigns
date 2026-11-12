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

/* one place in time, shared by the story's map and the atlas */
function useScrub() {
  const [i, setI] = useState(reckonings.length - 1);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((x) => { if (x >= reckonings.length - 1) { setPlaying(false); return x; } return x + 1; }), 420);
    return () => clearInterval(t);
  }, [playing]);
  const pick = (y: number) => { setPlaying(false); setI(Math.max(0, reckonings.findLastIndex((x) => +x.date.slice(0, 4) <= y))); };
  const last = reckonings.length - 1;
  const controls = (
    <>
      <div className="hero-ctl">
        <button type="button" className="play" onClick={() => { if (i >= last) setI(0); setPlaying((p) => !p); }}>{playing ? "Pause" : i >= last ? `Play from ${reckonings[0].date.slice(0, 4)}` : "Play on"}</button>
        <button type="button" onClick={() => { setPlaying(false); setI(Math.max(0, i - 1)); }} disabled={i === 0} aria-label="The reckoning before">Earlier</button>
        <button type="button" onClick={() => { setPlaying(false); setI(Math.min(last, i + 1)); }} disabled={i === last} aria-label="The reckoning after">Later</button>
        <span className="hint">or choose a year on the band</span>
      </div>
      <Frieze at={+reckonings[i].date.slice(0, 4)} onPick={pick} />
    </>
  );
  return { r: reckonings[i], controls };
}
const booksAt = (d: string) => campaign.eras.filter((e) => { const ts = tellings.filter((t) => t.book === e.id); return ts.length && ts[0].on <= d && (ts.at(-1)!.on >= d || !e.to); });

function Hero() {
  const { r, controls } = useScrub();
  const o = outline(r.date);
  const ruler = rulerAt(r.date), reign = ruler?.[1].reigns?.find((g) => g.from <= r.date && (!g.to || g.to > r.date));
  const y = +r.date.slice(0, 4);
  const wars = (r.standing?.wars ?? []).map((w) => threadById.get(w)).filter(Boolean);
  const drive = ruler ? (ruler[1].drives ?? []).filter((d) => d.from <= r.date).at(-1) : undefined;
  const books = booksAt(r.date);
  return (
    <section className="hero">
      <div className="hero-map">
        <Land label={`The realm in ${y}`}>
          <path className="l-ally" d={o.a} /><path className="l-subject" d={o.s} /><path className="l-ours" d={o.o} />
        </Land>
        <div className="hero-cap">
          <p className="hc-year">{y}<span>{hijriSpan(y)} AH{books.length ? `, in ${books.map((b) => b.title).join(" and ")}` : ""}</span></p>
          <h1>{r.title}</h1>
          {ruler && (
            <a className="hc-who" href={`#who-${ruler[0]}`}>
              <Seal id={ruler[0]} size={68} />
              <span><span><b>{cast[ruler[0]].name}</b>{reign ? `, ${ordinal(y - +reign.from.slice(0, 4) + 1)} year` : ""}</span>{drive && <em>{drive.text}</em>}</span>
            </a>
          )}
          <p className="hc-count">{nf.format(r.realm.towns)} towns{r.realm.souls ? `, ${cf.format(r.realm.souls)} souls` : ""}{wars.length ? <>. At war: {wars.map((w, k) => <span key={w!.id}>{k ? ", " : ""}<a href={`#thread-${w!.id}`}>{w!.title}</a></span>)}</> : ". At peace"}.</p>
          <p className="hc-links"><a href={`#line-${y}`}>Read {y} in the record</a></p>
        </div>
        <p className="map-key"><span><i className="sw l-ours" />The crown</span><span><i className="sw l-subject" />Its ṭāʾifas and vassals</span><span><i className="sw l-ally" />Its allies</span></p>
      </div>
      {controls}
    </section>
  );
}

/* ------------------------------------------------------------------ the atlas: one map, five ways of looking */
const LENSES = [
  { id: "hold", label: "Who holds what", say: "The crown, its subjects and its allies, with the neighbours named." },
  { id: "grew", label: "How it grew", say: "The crown's own land at every reckoning, each border laid over the last. The darkest has been held longest; the ṭāʾifas' lands are left out." },
  { id: "faith", label: "Faith", say: "Each tile is a town, sized by its people and filled by the share who are Muslim." },
  { id: "tongue", label: "Tongue", say: "Each tile is a town, sized by its people and filled by the share who are Andalusī in speech and custom." },
  { id: "blood", label: "Battles", say: "Every battle placed so far, up to the chosen year." },
] as const;
const share = (o: Record<string, number> | undefined, total: number) => Object.entries(o ?? {}).slice(0, 4).map(([k, v]) => `${k.replace(/_religion$/, "")} ${Math.round((v / total) * 100)}%`).join(", ");

export function Atlas() {
  const { r, controls } = useScrub();
  const [lens, setLens] = useState<(typeof LENSES)[number]["id"]>("hold");
  const L = LENSES.find((l) => l.id === lens)!;
  const o = outline(r.date), y = +r.date.slice(0, 4);
  const towns = lens === "faith" || lens === "tongue";
  const view = towns ? campaign.map?.towns ?? VIEW : lens === "grew" ? VIEW : campaign.map?.wide ?? VIEW;
  const u = view[2] / 100;
  const rings = useMemo(() => { const seen = new Set<string>(); return reckonings.filter((x) => { const d = outline(x.date).o; if (!d || seen.has(d)) return false; seen.add(d); return true; }); }, []);
  const frame = D.mosaic.frames[r.date] ?? [];
  const k = lens === "faith" ? 1 : 2;
  const fought = beats.filter((b) => b.at && b.on <= r.date);
  const souls = r.realm.souls ?? 0;
  return (
    <>
      <header className="page-head"><h1>The atlas</h1><p className="sub">One map of the realm, looked at five ways, at any reckoning from {Y0} to {Y1}.</p></header>
      <section className="atlas">
        <div className="lenses" role="tablist" aria-label="Ways of looking">
          {LENSES.map((l) => <button key={l.id} role="tab" type="button" aria-selected={lens === l.id} onClick={() => setLens(l.id)}>{l.label}</button>)}
        </div>
        <div className="atlas-map">
          <Land view={view} label={`${L.label}, ${y}`}>
            {lens === "hold" && (
              <>
                <path className="l-ally" d={o.a} /><path className="l-subject" d={o.s} /><path className="l-ours" d={o.o} />
                {(D.neighbours[r.date] ?? []).map(([n, x, yy, ally]) => <text key={n} className={`nb${ally ? " ally" : ""}`} x={x} y={yy} textAnchor="middle" style={{ fontSize: u * 1.5, strokeWidth: u * 0.35 }}>{n}</text>)}
              </>
            )}
            {lens === "grew" && [...rings].reverse().filter((x) => x.date <= r.date).map((x) => {
              const t = (frac(x.date) - Y0) / (Y1 + 1 - Y0);
              return <path key={x.date} className="ring" d={outline(x.date).o} style={{ fill: `color-mix(in srgb, var(--cobalt) ${Math.round(22 + 78 * (1 - t))}%, var(--surface))` }} />;
            })}
            {towns && D.mosaic.towns.map(([x, yy], n) => {
              const pop = frame[n * 3], pct = frame[n * 3 + k];
              if (!pop) return null;
              const s = Math.max(0.35, Math.sqrt(pop) * 0.115) * u;
              return <g key={n} transform={`rotate(45 ${x} ${yy})`}><rect className="tile-base" x={x - s} y={yy - s} width={s * 2} height={s * 2} /><rect className={`tile-${lens}`} x={x - s} y={yy - s} width={s * 2} height={s * 2} style={{ fillOpacity: pct / 100 }} /></g>;
            })}
            {lens === "blood" && (
              <>
                <path className="l-subject" d={o.s} /><path className="l-ours" d={o.o} />
                {fought.map((b) => <circle key={b.id} className={`bdot ${b.won === true ? "won" : b.won === false ? "lost" : "even"}${b.on.slice(0, 4) === String(y) ? " hot" : ""}`} cx={b.at![0]} cy={b.at![1]} r={(b.on.slice(0, 4) === String(y) ? 0.75 : 0.5) * u} style={{ strokeWidth: u * 0.12 }}><title>{`${formatWestern(b.on)}: ${b.what}`}</title></circle>)}
              </>
            )}
          </Land>
          <div className="atlas-cap">
            <p className="hc-year">{y}<span>{hijriSpan(y)} AH</span></p>
            <h2>{r.title}</h2>
            <p className="sub">{L.say}</p>
            {lens === "hold" && <p className="hc-count">{nf.format(r.realm.towns)} towns under the crown. Allies: {(r.standing?.allies ?? []).join(", ") || "none"}.</p>}
            {lens === "grew" && <p className="hc-count">{nf.format(reckonings[0].realm.towns)} towns in {Y0}; {nf.format(r.realm.towns)} in {y}.</p>}
            {lens === "faith" && souls > 0 && <p className="hc-count">Of {cf.format(souls)} souls: {share(r.peoples?.faiths, souls)}.</p>}
            {lens === "tongue" && souls > 0 && <p className="hc-count">Of {cf.format(souls)} souls: {share(r.peoples?.cultures, souls)}.</p>}
            {lens === "blood" && <p className="hc-count">{fought.length} battles placed by {y}: {fought.filter((b) => b.won === true).length} won, {fought.filter((b) => b.won === false).length} lost. The larger marks were fought this year.</p>}
            {lens === "hold" && <p className="map-key"><span><i className="sw l-ours" />The crown</span><span><i className="sw l-subject" />Ṭāʾifas and vassals</span><span><i className="sw l-ally" />Allies</span></p>}
            {lens === "grew" && <p className="map-key"><span><i className="sw ring-old" />Held since {Y0}</span><span><i className="sw ring-new" />Newly won</span></p>}
            {towns && <p className="map-key"><span><i className={`sw tile-${lens}`} />{lens === "faith" ? "All Muslim" : "All Andalusī"}</span><span><i className="sw tile-base" />None</span><span>Iberia and the near shores only</span></p>}
            {lens === "blood" && <p className="map-key"><span><i className="bd won" />Won</span><span><i className="bd lost" />Lost</span><span><i className="bd even" />Unrecorded</span></p>}
          </div>
        </div>
        {controls}
      </section>
    </>
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

/* ------------------------------------------------------------------ the house, kept tight: rulers, the people the story follows, and the links between them */
const ROOT = "ismail-i";
const inTree = (() => {
  const keep = new Set<string>([ROOT]);
  for (const [id, p] of Object.entries(cast)) {
    if (!(p.tier || p.reigns)) continue;
    const chain: string[] = []; let x: string | undefined = id;
    while (x && cast[x] && x !== ROOT) { chain.push(x); x = cast[x].father && cast[cast[x].father!] ? cast[x].father : undefined; }
    if (x === ROOT) chain.forEach((c) => keep.add(c));
  }
  return keep;
})();
type Node = { id: string; kids: Node[]; x: number; depth: number; more: number };
function grow(id: string, depth: number, next: { x: number }): Node {
  const all = Object.entries(cast).filter(([, c]) => c.father === id).sort((a, b) => (a[1].born ?? "").localeCompare(b[1].born ?? ""));
  const kids = all.filter(([c]) => inTree.has(c)).map(([c]) => grow(c, depth + 1, next));
  const x = kids.length ? (kids[0].x + kids.at(-1)!.x) / 2 : next.x++;
  return { id, kids, x, depth, more: all.length - kids.length };
}
export function FamilyTree() {
  const tree = useMemo(() => { const n = { x: 0 }; const t = grow(ROOT, 0, n); return { t, leaves: n.x }; }, []);
  const flat: Node[] = []; const walk = (n: Node) => { flat.push(n); n.kids.forEach(walk); }; walk(tree.t);
  const cw = 104, rh = 138, padX = 56, W = tree.leaves * cw + padX, H = (Math.max(...flat.map((n) => n.depth)) + 1) * rh + 10;
  const X = (n: Node) => padX / 2 + n.x * cw + cw / 2, Y = (n: Node) => n.depth * rh + 34;
  return (
    <figure className="tree">
      <div className="scroll-x">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: W * 0.72 }} role="img" aria-label="The house of Naṣr: the rulers and the people the story follows">
          {flat.flatMap((n) => n.kids.map((k) => <path key={k.id} className="tr-link" d={`M${X(n)},${Y(n) + 30} V${Y(k) - 44} H${X(k)} V${Y(k) - 30}`} />))}
          {flat.map((n) => {
            const p = cast[n.id], ruled = p.reigns?.[0], mother = p.mother && cast[p.mother]?.tier ? first(p.mother) : null;
            return (
              <a key={n.id} href={`#who-${n.id}`} className={`tr-node${ruled ? " ruled" : ""}${p.died ? "" : " living"}`}>
                <g transform={`translate(${X(n) - 30}, ${Y(n) - 30})`}><Seal id={n.id} size={60} /></g>
                {ruled && <circle className="tr-crown" cx={X(n)} cy={Y(n)} r={35} />}
                <text className="tr-name" x={X(n)} y={Y(n) + 46} textAnchor="middle">{first(n.id)}</text>
                <text className="tr-sub" x={X(n)} y={Y(n) + 60} textAnchor="middle">{ruled ? `reigned ${ruled.from.slice(0, 4)}–${ruled.to ? ruled.to.slice(0, 4) : ""}` : `${p.born?.slice(0, 4) ?? ""}–${p.died?.slice(0, 4) ?? ""}`}</text>
                {(mother || n.more > 0) && <text className="tr-sub" x={X(n)} y={Y(n) + 73} textAnchor="middle">{mother ? `by ${mother}` : ""}{mother && n.more ? ", " : ""}{n.more ? `+${n.more} more` : ""}</text>}
              </a>
            );
          })}
        </svg>
      </div>
      <figcaption>{flat.length} of the {Object.values(cast).filter((p) => p.house === "Naṣrid").length} Naṣrids on record: the rulers (ringed), the people the story follows, and the fathers who link them. "+3 more" counts children left out. "By" names the mother where the story follows her.</figcaption>
    </figure>
  );
}
