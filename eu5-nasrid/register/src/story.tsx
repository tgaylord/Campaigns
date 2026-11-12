/* The story told with pictures: the realm growing on a map, the books as chapters, wars on their ground, lives side by side. */
import { useEffect, useMemo, useState } from "react";
import { D, campaign, cast, reckonings, beats, tellings, threads, threadById, beatById, now, Y0, Y1, cf, nf, first, short, age, rulerAt, ordinal, hijriSpan, type Beat, type Person, type Telling } from "./core";
import { Frieze, frac } from "./frieze";
import { formatHijri, formatWestern } from "./hijri";

const VIEW = campaign.map?.story ?? [1215, 1225, 1440, 900];
const outline = (date: string) => {
  const x = D.outlines[date] ?? D.outlines[Object.keys(D.outlines).filter((d) => d <= date).at(-1) ?? ""];
  const S = D.shapes;
  return x ? { o: S[x.o], s: S[x.s], a: S[x.a], as: S[x.as], r: x.r.map((k) => S[k]), rs: x.rs.map((k) => S[k]), rn: x.rn } : { o: "", s: "", a: "", as: "", r: [] as string[], rs: [] as string[], rn: [] as string[] };
};
const RIVALS = campaign.map?.rivals ?? [];
const rivalFill = (k: number, pct = 62) => `color-mix(in srgb, light-dark(${RIVALS[k].color[0]}, ${RIVALS[k].color[1]}) ${pct}%, var(--surface))`;
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
function Land({ view = VIEW, children, label, whole }: { view?: number[]; children: React.ReactNode; label: string; whole?: boolean }) {
  return (
    <svg className="land" viewBox={view.join(" ")} role="img" aria-label={label} preserveAspectRatio={whole ? "xMidYMid meet" : "xMidYMid slice"}>
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
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test((e.target as HTMLElement)?.tagName ?? "")) return;
      if (e.key === "ArrowLeft") { setPlaying(false); setI((x) => Math.max(0, x - 1)); }
      if (e.key === "ArrowRight") { setPlaying(false); setI((x) => Math.min(last, x + 1)); }
    };
    addEventListener("keydown", key); return () => removeEventListener("keydown", key);
  }, []);
  const controls = (
    <>
      <div className="hero-ctl">
        <button type="button" className="play" onClick={() => { if (i >= last) setI(0); setPlaying((p) => !p); }}>{playing ? "Pause" : i >= last ? `Play from ${reckonings[0].date.slice(0, 4)}` : "Play on"}</button>
        <button type="button" onClick={() => { setPlaying(false); setI(Math.max(0, i - 1)); }} disabled={i === 0} aria-label="The reckoning before">Earlier</button>
        <button type="button" onClick={() => { setPlaying(false); setI(Math.min(last, i + 1)); }} disabled={i === last} aria-label="The reckoning after">Later</button>
        <span className="hint">or choose a year on the band, or use the arrow keys</span>
      </div>
      <Frieze at={+reckonings[i].date.slice(0, 4)} onPick={pick} />
    </>
  );
  return { r: reckonings[i], controls };
}
const booksAt = (d: string) => { const t = tellings.findLast((x) => x.on <= d && x.book) ?? tellings[0]; return campaign.eras.filter((e) => e.id === t?.book); };

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
        <div className="ctl">{controls}</div>
      </div>
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

/* a battle stays bright while its war is being fought, then fades over the next dozen years */
const warOf = (b: Beat) => (b.threads ?? []).map((t) => threadById.get(t)).find((t) => t?.kind === "war");
const liveWar = (b: Beat, d: string) => { const w = warOf(b); return !!w && (!w.to || w.to >= d); };
const fade = (b: Beat, d: string) => { const w = warOf(b), since = frac(d) - frac(w?.to ?? b.on); return Math.max(0.14, 0.7 - since * 0.05); };

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
  const [big, setBig] = useState(false);
  useEffect(() => { document.documentElement.toggleAttribute("data-wide", big); return () => document.documentElement.removeAttribute("data-wide"); }, [big]);
  return (
    <>
      <header className="page-head"><h1>The atlas</h1><p className="sub">One map of the realm, looked at five ways, at any reckoning from {Y0} to {Y1}.</p></header>
      <section className="atlas">
        <div className="lenses" role="tablist" aria-label="Ways of looking">
          {LENSES.map((l) => <button key={l.id} role="tab" type="button" aria-selected={lens === l.id} onClick={() => setLens(l.id)}>{l.label}</button>)}
          <button type="button" className="grow" aria-pressed={big} onClick={() => setBig((b) => !b)}>{big ? "Shrink the map" : "Enlarge the map"}</button>
        </div>
        <div className={`atlas-map${big ? " big" : ""}`}>
          <Land view={view} label={`${L.label}, ${y}`} whole={big}>
            {lens === "hold" && (
              <>
                {o.rs.map((d, n) => d && <path key={`s${n}`} className="l-rival" d={d} style={{ fill: rivalFill(n, 28) }} />)}
                {o.r.map((d, n) => d && <path key={n} className="l-rival" d={d} style={{ fill: rivalFill(n) }} />)}
                <path className="l-allysub" d={o.as} /><path className="l-ally" d={o.a} /><path className="l-subject" d={o.s} /><path className="l-ours" d={o.o} />
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
                {fought.map((b) => { const live = liveWar(b, r.date), hot = b.on.slice(0, 4) === String(y); return <circle key={b.id} className={`bdot ${b.won === true ? "won" : b.won === false ? "lost" : "even"}${hot ? " hot" : ""}`} cx={b.at![0]} cy={b.at![1]} r={(hot ? 0.75 : live ? 0.6 : 0.42) * u} style={{ strokeWidth: u * 0.12, opacity: live ? 1 : fade(b, r.date) }}><title>{`${formatWestern(b.on)}: ${b.what}`}</title></circle>; })}
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
            {lens === "blood" && <p className="hc-count">{fought.length} battles placed by {y}: {fought.filter((b) => b.won === true).length} won, {fought.filter((b) => b.won === false).length} lost. Wars still being fought are bright, with this year's battles largest; a finished war fades over the next dozen years.</p>}
            {lens === "hold" && <p className="map-key"><span><i className="sw l-ours" />The crown</span><span><i className="sw l-subject" />Ṭāʾifas and vassals</span><span><i className="sw l-ally" />Allies</span>{RIVALS.map((v, n) => o.r[n] ? <span key={v.name}><i className="sw" style={{ background: rivalFill(n) }} />{o.rn[n] || v.name}</span> : null)}<span>Paler land of the same colour is that power's own vassals.</span></p>}
            {lens === "grew" && <p className="map-key"><span><i className="sw ring-old" />Held since {Y0}</span><span><i className="sw ring-new" />Newly won</span></p>}
            {towns && <p className="map-key"><span><i className={`sw tile-${lens}`} />{lens === "faith" ? "All Muslim" : "All Andalusī"}</span><span><i className="sw tile-base" />None</span><span>Iberia and the near shores only</span></p>}
            {lens === "blood" && <p className="map-key"><span><i className="bd won" />Won</span><span><i className="bd lost" />Lost</span><span><i className="bd even" />Unrecorded</span></p>}
          </div>
          <div className="ctl">{controls}</div>
        </div>
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
export const bookOf = (t: Telling) => { const n = chapters.findIndex((c) => c.id === t.book); return n < 0 ? null : { n: n + 1, title: chapters[n].title }; };
const reckonAt = (d: string) => reckonings.findLast((r) => r.date <= d) ?? reckonings[0];

function ChapterPanel({ c, n, open, toggle }: { c: Chapter; n: number; open: boolean; toggle: () => void }) {
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
    <section className={`chapter${open ? "" : " shut"}`} id={`book-${n}`}>
      <header>
        <p className="ch-n">Book {n}, {c.from.slice(0, 4)} to {c.to.slice(0, 4) === String(Y1) ? "the present" : c.to.slice(0, 4)}{open ? "" : `. ${c.tales.length} tellings, ${nf.format(a.realm.towns)} to ${nf.format(b.realm.towns)} towns`}</p>
        <h2><button type="button" className="ch-toggle" aria-expanded={open} onClick={toggle}><span>{c.title}</span>{c.arabic && <bdi className="ar" lang="ar" dir="rtl">{c.arabic}</bdi>}<i aria-hidden="true" /></button></h2>
      </header>
      {open && <ChapterBody c={c} a={a} b={b} oa={oa} ob={ob} drivers={drivers} wars={wars} line={line} grew={grew} />}
    </section>
  );
}
type Out = ReturnType<typeof outline>;
function ChapterBody({ c, a, b, oa, ob, drivers, wars, line, grew }: { c: Chapter; a: (typeof reckonings)[number]; b: (typeof reckonings)[number]; oa: Out; ob: Out; drivers: string[]; wars: typeof threads; line: (id: string) => string; grew: boolean }) {
  return (
    <>
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
      <p className="scenes-n">{c.tales.length} {c.tales.length === 1 ? "telling" : "tellings"}{c.tales.length > 4 ? ". Scroll sideways for the rest." : "."}</p>
      <div className="scenes" role="list" aria-label={`The tellings of ${c.title}`}>
        {c.tales.map((t) => (
          <a role="listitem" key={t.id} href={`#telling-${t.id}`} className="scene">
            <span className="sc-year">{t.on.slice(0, 4)}</span>
            <span className="sc-title">{t.title}</span>
            <span className="sc-lede">{firstSentence(t.text)}</span>
          </a>
        ))}
      </div>
    </>
  );
}

const SHUT_KEY = "register.books.shut";
export function Story() {
  const [shut, setShut] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(SHUT_KEY) ?? "[]"); } catch { return []; } });
  const save = (v: string[]) => { setShut(v); try { localStorage.setItem(SHUT_KEY, JSON.stringify(v)); } catch { /* fine without */ } };
  // a link to one book opens it
  useEffect(() => { const f = () => { const m = location.hash.match(/^#book-(\d+)$/); const id = m && chapters[+m[1] - 1]?.id; if (id) setShut((s) => s.filter((x) => x !== id)); }; f(); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  return (
    <>
      <Hero />
      <header className="page-head story-head">
        <h2 className="big">The story in {chapters.length} books</h2>
        <p className="sub">The books are themes, so some run side by side. Each one says what changed, shows it on the map, and names the people who drove it. The tellings are its scenes.</p>
        <p className="fold-all"><button type="button" className="clear" onClick={() => save(shut.length ? [] : chapters.map((c) => c.id))}>{shut.length ? "Open every book" : "Fold every book"}</button></p>
        <nav className="toc" aria-label="The books">{chapters.map((c, k) => <a key={c.id} href={`#book-${k + 1}`}>{c.title}</a>)}</nav>
      </header>
      {chapters.map((c, k) => <ChapterPanel key={c.id} c={c} n={k + 1} open={!shut.includes(c.id)} toggle={() => save(shut.includes(c.id) ? shut.filter((x) => x !== c.id) : [...shut, c.id])} />)}
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
  const own = pts.filter((b) => !b.minor);
  return (
    <figure className="battlemap">
      <Land view={view} label="Where the war was fought">
        <path className="l-subject" d={o.s} /><path className="l-ours" d={o.o} />
        {own.length > 1 && <polyline className="march" points={own.map((b) => b.at!.join(",")).join(" ")} style={{ strokeWidth: u * 0.22, strokeDasharray: `${u * 0.9} ${u * 0.7}` }} />}
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
      <figcaption><span><i className="bd won" />Won</span><span><i className="bd lost" />Lost</span><span><i className="bd even" />Undecided or unrecorded</span><span>Small marks are allies' fights. Numbers follow the order of the fighting, and the dashed line joins al-Andalus's own battles in that order. Hover a mark for the day.</span></figcaption>
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
  const L = 190, W = 900, rowH = 26, top = 92, H = top + rows.length * rowH + 30;
  const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (W - L - 16);
  const drives = p.drives ?? [];
  // pins closer than their own width climb a row, so no number hides another
  const pinRow: number[] = [];
  drives.forEach((d, n) => { let row = 0; while (drives.some((e, m) => m < n && pinRow[m] === row && Math.abs(x(frac(e.from)) - x(frac(d.from))) < 18)) row++; pinRow[n] = row; });
  return (
    <figure className="lives">
      <div className="scroll-x">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The life of ${p.name} beside the people around ${p.sex === "f" ? "her" : "him"}`}>
          {Array.from({ length: (t1 - t0) / 10 + 1 }, (_, k) => t0 + k * 10).map((t) => <g key={t}><line className="lv-grid" x1={x(t)} x2={x(t)} y1={top - 12} y2={H - 24} /><text className="lv-year" x={x(t)} y={H - 8} textAnchor="middle">{t}</text></g>)}
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
                {main && drives.map((d, n) => { const px = x(frac(d.from)), up = pinRow[n] * 18; return <g key={d.from + n}><line className="lv-stem" x1={px} x2={px} y1={y - 9.5 - up} y2={y - 2} /><circle className="lv-pin" cx={px} cy={y - 18 - up} r={8.5} /><text className="lv-pinn" x={px} y={y - 14.3 - up} textAnchor="middle">{n + 1}</text></g>; })}
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

/* ------------------------------------------------------------------ the crown and the estates */
const ESTATE_CLASS: Record<string, string> = { Crown: "crown", Nobility: "e0", "ʿUlamāʾ": "e1", Burghers: "e2", Commoners: "e3", "Dhimmī": "e4" };
export function Estates() {
  const rs = reckonings.filter((r) => r.standing?.estates?.some((e) => typeof e.power === "number"));
  const [hover, setHover] = useState<number | null>(null);
  if (rs.length < 3) return null;
  const names = rs.at(-1)!.standing!.estates!.map((e) => e.name);
  const W = 920, H = 300, L = 40, R = 150, T = 14, B = 44;
  const t0 = frac(rs[0].date), t1 = frac(rs.at(-1)!.date);
  const max = Math.ceil(Math.max(...rs.flatMap((r) => r.standing!.estates!.map((e) => e.power ?? 0))) / 10) * 10;
  const x = (d: string) => L + ((frac(d) - t0) / (t1 - t0)) * (W - L - R), y = (v: number) => T + (1 - v / max) * (H - T - B);
  const val = (r: (typeof rs)[number], n: string) => r.standing!.estates!.find((e) => e.name === n);
  const marks = beats.filter((b) => b.threads?.includes("estates") && !b.minor && b.on >= rs[0].date);
  const at = hover === null ? rs.length - 1 : hover, cur = rs[at];
  // labels at the right end, nudged apart so none sits on another
  const ends = names.map((n) => ({ n, v: val(rs.at(-1)!, n)?.power ?? 0 })).sort((a, b) => b.v - a.v);
  const ly: Record<string, number> = {}; let prev = -99;
  for (const e of ends) { const want = y(e.v) + 4; ly[e.n] = Math.max(want, prev + 15); prev = ly[e.n]; }
  const move = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect(), px = ((e.clientX - box.left) / box.width) * W;
    let best = 0; rs.forEach((r, k) => { if (Math.abs(x(r.date) - px) < Math.abs(x(rs[best].date) - px)) best = k; });
    setHover(best);
  };
  return (
    <figure className="estates">
      <div className="scroll-x">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The share of power held by the crown and each estate, over the campaign" onMouseMove={move} onMouseLeave={() => setHover(null)}>
          {Array.from({ length: max / 10 + 1 }, (_, k) => k * 10).map((v) => <g key={v}><line className="lv-grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} /><text className="lv-year" x={L - 8} y={y(v) + 4} textAnchor="end">{v}%</text></g>)}
          {Array.from({ length: Y1 - Y0 + 1 }, (_, k) => Y0 + k).filter((yy) => yy % 10 === 0 && yy >= t0 && yy <= t1).map((yy) => <text key={yy} className="lv-year" x={x(`${yy}-01-01`)} y={H - 6} textAnchor="middle">{yy}</text>)}
          {marks.map((b) => <a key={b.id} href={`#line-${b.on.slice(0, 4)}`}><line className="es-mark" x1={x(b.on)} x2={x(b.on)} y1={H - B + 6} y2={H - B + 16}><title>{`${formatWestern(b.on)}: ${b.what}`}</title></line></a>)}
          {names.map((n) => <polyline key={n} className={`es-line es-${ESTATE_CLASS[n] ?? "e4"}`} points={rs.map((r) => `${x(r.date).toFixed(1)},${y(val(r, n)?.power ?? 0).toFixed(1)}`).join(" ")} />)}
          {names.map((n) => <text key={n} className={`es-label${n === "Crown" ? " crown" : ""}`} x={W - R + 22} y={ly[n]}>{n === "Crown" ? "The crown" : n} {Math.round(val(rs.at(-1)!, n)?.power ?? 0)}%</text>)}
          {names.map((n) => <line key={n} className={`es-tie es-${ESTATE_CLASS[n] ?? "e4"}`} x1={W - R + 2} x2={W - R + 18} y1={y(val(rs.at(-1)!, n)?.power ?? 0)} y2={ly[n] - 4} />)}
          {hover !== null && <line className="es-cross" x1={x(cur.date)} x2={x(cur.date)} y1={T} y2={H - B} />}
          {hover !== null && names.map((n) => <circle key={n} className={`es-dot es-${ESTATE_CLASS[n] ?? "e4"}`} cx={x(cur.date)} cy={y(val(cur, n)?.power ?? 0)} r={3.5} />)}
        </svg>
      </div>
      <table className="es-table">
        <caption>{hover === null ? `At the last reckoning, ${formatWestern(cur.date)}` : `At the reckoning of ${formatWestern(cur.date)}`}</caption>
        <thead><tr><th /><th>Share of power</th><th>Contentment</th></tr></thead>
        <tbody>
          {names.map((n) => { const e = val(cur, n); return (
            <tr key={n}><th scope="row"><i className={`sw es-${ESTATE_CLASS[n] ?? "e4"}`} />{n === "Crown" ? "The crown" : n}</th><td className="num">{e?.power !== undefined ? `${e.power.toFixed(1)}%` : ""}</td>
              <td>{typeof e?.mood === "number" ? <span className="mood"><span className="mood-bar"><i style={{ width: `${e.mood}%` }} className={e.mood < 40 ? "low" : ""} /></span><span className="num">{Math.round(e.mood)}</span></span> : null}</td></tr>
          ); })}
        </tbody>
      </table>
      <figcaption>Each line is a share of the realm's power. The strokes under the chart are the decrees, privileges and Jamāʿas on record; choose one to read its year. Contentment runs from 0 to 100 and settles at 50. Power is the save's own reading where there is one and an estimate between readings.</figcaption>
    </figure>
  );
}

/* the powers of the world, and where the realm stands among them */
export function Powers({ r }: { r: (typeof reckonings)[number] }) {
  if (!r.world?.top?.length) return null;
  const max = Math.max(...r.world.top.map((t) => t[1]));
  const ranks = reckonings.filter((x) => x.world?.rank);
  const firstTop = ranks.find((x) => x.world!.rank! <= 8);
  return (
    <section>
      <h2>Among the great powers</h2>
      <ol className="powers">
        {r.world.top.map(([name, pts, me], k) => <li key={name} className={me ? "me" : ""}><span className="pw-n">{k + 1}</span><span className="pw-name">{name}</span><span className="pw-bar"><i style={{ width: `${(pts / max) * 100}%` }} /></span><span className="num">{Math.round(pts)}</span></li>)}
      </ol>
      <p className="key">{r.world.rank ? `${campaign.title} ranks ${ordinal(r.world.rank)}` : ""}{ranks[0]?.world?.rank && ranks[0].world.rank !== r.world.rank ? `; it ranked ${ordinal(ranks[0].world.rank)} in ${ranks[0].date.slice(0, 4)}` : ""}{firstTop && firstTop !== ranks[0] ? `, and first stood among the eight great powers in ${firstTop.date.slice(0, 4)}` : ""}.</p>
    </section>
  );
}

/* ------------------------------------------------------------------ a war, before and after */
export function WarMaps({ id, bs }: { id: string; bs: Beat[] }) {
  const w = D.warmaps[id];
  if (!w) return null;
  const pts = bs.filter((b) => b.at).map((b) => b.at!);
  const S = D.shapes;
  // frame both maps alike: around the fighting if there was any, else the story's usual view
  let view = VIEW;
  if (pts.length > 1) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const wd = Math.max((Math.max(...xs) - Math.min(...xs)) * 1.5, (Math.max(...ys) - Math.min(...ys)) * 1.5 * 1.45, 560);
    view = [cx - wd / 2, cy - wd / 1.45 / 2, wd, wd / 1.45];
  }
  const One = ({ side, label }: { side: typeof w.before; label: string }) => { const o = outline(side.date); return (
    <figure>
      <Land view={view} label={label}>
        <path className="w-foe sub" d={S[side.es]} /><path className="w-friend sub" d={S[side.fs]} />
        <path className="w-foe" d={S[side.e]} /><path className="w-friend" d={S[side.f]} />
        <path className="l-subject" d={o.s} /><path className="l-ours" d={o.o} />
      </Land>
      <figcaption>{label}, at the reckoning of {formatWestern(side.date)}</figcaption>
    </figure>
  ); };
  return (
    <section className="warmaps">
      <h2>{w.open ? "Before the war, and now" : "Before and after"}</h2>
      <div className="wm-grid"><One side={w.before} label="Before" /><One side={w.after} label={w.open ? "Now" : "After"} /></div>
      <p className="map-key"><span><i className="sw l-ours" />The crown</span><span><i className="sw l-subject" />Its ṭāʾifas and vassals</span><span><i className="sw w-friend" />Its side</span><span><i className="sw w-foe" />The other side</span><span>Paler land is a vassal of that side. Sides are matched from the names on record, so a small lord may be missing.</span></p>
    </section>
  );
}

/* ------------------------------------------------------------------ what kind of person: the three measures and the traits */
const TRAIT_WORDS: Record<string, string> = { hajji: "made the Hajj", bubonic_plague_trait: "survived the plague", "gifted child": "gifted", inspirational_leader_general: "inspiring leader", born_to_the_saddle: "born to the saddle" };
const traitLabel = (t: string) => { const child = t.startsWith("child_"); const w = TRAIT_WORDS[t] ?? t.replace(/^child_/, "").replace(/_trait$/, "").replace(/_/g, " "); return { w, child }; };
export function Character({ p }: { p: Person }) {
  const st = p.stats, traits = (p.traits ?? []).map(traitLabel);
  if (!st && !traits.length) return null;
  const grown = traits.filter((t) => !t.child), young = traits.filter((t) => t.child);
  const M: [string, number | undefined, string][] = [["Rule", st?.adm, "administration"], ["Counsel", st?.dip, "diplomacy"], ["War", st?.mil, "the military art"]];
  return (
    <div className="character">
      {st && (
        <dl className="gauges">
          {M.map(([label, v, long]) => typeof v === "number" && <div key={label} title={`${label}: ${long}, ${v} of 100`}><dt>{label}</dt><dd><span className="gauge"><i style={{ width: `${v}%` }} className={v >= 70 ? "high" : v < 35 ? "low" : ""} /></span><span className="num">{v}</span></dd></div>)}
        </dl>
      )}
      {traits.length > 0 && <p className="traits">{grown.map((t) => <span key={t.w} className="trait">{t.w}</span>)}{young.map((t) => <span key={t.w} className="trait young">{t.w} as a child</span>)}</p>}
    </div>
  );
}
