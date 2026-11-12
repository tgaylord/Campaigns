import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { md } from "./md";
import { formatHijri, formatWestern, HIJRI_MONTHS } from "./hijri";
import { D, campaign, cast, threads, reckonings, beats, tellings, threadById, beatById, now, before, Y0, Y1, nf, cf, MON, dayMonth, hijriSpan, short, first, age, rulerAt, ordinal, fmt, tone, Who, type Beat, type Telling, type Person, type Thread, type Reckoning, type Data } from "./core";
import { Story, BattleMap, LifeLines, Weave, Seal, Atlas, FamilyTree, bookOf, Estates, Powers } from "./story";
import { Frieze, FriezeKey, frac } from "./frieze";

/* ------------------------------------------------------------------ routing: one plain word after the # */
type Route = { view: string; arg?: string };
const parse = (h: string): Route => {
  const s = h.replace(/^#/, "");
  const m = s.match(/^(line|thread|who|telling|book)-(.+)$/);
  if (m) return { view: m[1], arg: m[2] };
  return { view: ["now", "atlas", "line", "threads", "people", "about"].includes(s) ? s : "story" };
};
function useRoute(): Route {
  const [r, setR] = useState(() => parse(location.hash));
  useEffect(() => { const f = () => setR(parse(location.hash)); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  useEffect(() => {
    if (r.view === "line" && r.arg) requestAnimationFrame(() => document.getElementById(`y${r.arg}`)?.scrollIntoView({ block: "start" }));
    else if (r.view === "book") requestAnimationFrame(() => document.getElementById(`book-${r.arg}`)?.scrollIntoView({ block: "start" }));
    else scrollTo(0, 0);
  }, [r.view, r.arg]);
  return r;
}

/* ------------------------------------------------------------------ where a beat comes from */
const FromMarks = ({ from }: { from?: string[] }) => (
  <span className="marks" title={(from ?? []).map((f) => campaign.from[f]).join("; ")}>
    {Object.keys(campaign.from).map((k) => <i key={k} className={`mk mk-${k}${from?.includes(k) ? " on" : ""}`} />)}
    <span className="sr">{(from ?? []).map((f) => campaign.from[f]).join("; ")}</span>
  </span>
);
const FromKey = () => (
  <span className="fromkey">
    {Object.entries(campaign.from).map(([k, v]) => <span key={k}><i className={`mk mk-${k} on`} />{v}</span>)}
  </span>
);

/* ------------------------------------------------------------------ the line */
function BeatRow({ b, year }: { b: Beat; year?: boolean }) {
  const detail = Object.entries(b.detail ?? {}).filter(([, v]) => v !== null && v !== "" && typeof v !== "boolean");
  return (
    <details className={`beat t-${tone(b.kind)}${b.minor ? " minor" : ""}`}>
      <summary>
        <span className="b-date" title={formatHijri(b.on)}>{dayMonth(b.on)}{year ? ` ${b.on.slice(0, 4)}` : ""}</span>
        <span className="b-kind"><i className="dot" />{campaign.kinds[b.kind]?.label}</span>
        <span className="b-what">{b.what}</span>
        <FromMarks from={b.from} />
      </summary>
      <div className="b-more">
        <p className="b-when">{formatHijri(b.on)}, {formatWestern(b.on)}</p>
        {!!b.who?.length && <p><span className="lab">Who</span>{b.who.map((w, i) => <span key={w}>{i ? ", " : ""}<Who id={w} /></span>)}</p>}
        {!!b.where?.length && <p><span className="lab">Where</span>{b.where.map((w) => D.places[w]?.name ?? w).join(", ")}</p>}
        {!!b.threads?.length && <p><span className="lab">Threads</span>{b.threads.map((t, i) => <span key={t}>{i ? ", " : ""}<a href={`#thread-${t}`}>{threadById.get(t)?.title}</a></span>)}</p>}
        {detail.length > 0 && (
          <dl>{detail.map(([k, v]) => <div key={k}><dt>{k.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()}</dt><dd>{typeof v === "object" ? Object.entries(v as object).map(([a, c]) => `${a}: ${typeof c === "object" ? JSON.stringify(c) : c}`).join("; ") : String(v)}</dd></div>)}</dl>
        )}
        <p className="b-cite"><span className="lab">Known from</span>{b.cite ?? (b.from ?? []).map((f) => campaign.from[f]).join("; ")}</p>
      </div>
    </details>
  );
}
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_]/g, "");
function TellingCard({ t }: { t: Telling }) {
  return (
    <a className="tcard" href={`#telling-${t.id}`}>
      <span className="tc-label">A telling, {formatHijri(t.on)}</span>
      <span className="tc-title">{t.title}</span>
      <span className="tc-lede">{plain(t.text).slice(0, 210).replace(/\s+\S*$/, "")}…</span>
    </a>
  );
}
const fold = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f\u02bf\u02be]/g, "").toLowerCase();
const TONES = Object.entries(campaign.tones);

/* The thread picker: a panel instead of a long native menu, with what each thread is and how much is on it. */
function Follow({ thread, setThread }: { thread: string; setThread: (t: string) => void }) {
  const box = useRef<HTMLDetailsElement>(null);
  const pick = (id: string) => { setThread(id); if (box.current) box.current.open = false; };
  const count = (id: string) => beats.filter((b) => b.threads?.includes(id)).length;
  const t = threadById.get(thread);
  useEffect(() => {
    const close = (e: Event) => { if (box.current?.open && !(e instanceof KeyboardEvent ? e.key !== "Escape" : box.current.contains(e.target as Node))) box.current.open = false; };
    document.addEventListener("click", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", close); };
  }, []);
  return (
    <div className="follow-wrap">
      <details className="follow" ref={box}>
        <summary>{t ? <>Following <b>{t.title}</b></> : "Follow a thread"}</summary>
        <div className="follow-panel">
          <div>
            <h4>Stories</h4>
            {threads.filter((x) => x.kind === "story").map((x) => <button type="button" key={x.id} aria-pressed={thread === x.id} onClick={() => pick(x.id)}><span>{x.title}</span><span className="th-n">{count(x.id)}</span></button>)}
          </div>
          <div>
            <h4>Wars</h4>
            {threads.filter((x) => x.kind === "war").reverse().map((x) => <button type="button" key={x.id} aria-pressed={thread === x.id} onClick={() => pick(x.id)}><span>{x.title}</span><span className="th-n">{x.from?.slice(0, 4)}{x.to ? "" : ", open"}</span></button>)}
          </div>
        </div>
      </details>
      {t && <button type="button" className="clear" onClick={() => setThread("")} aria-label="Stop following this thread">Show everything</button>}
    </div>
  );
}

function Line({ items, tales, filters, startOpen, head }: { items: Beat[]; tales: Telling[]; filters?: boolean; startOpen?: boolean; head?: (at?: number) => ReactNode }) {
  const [all, setAll] = useState(!!startOpen);
  const [thread, setThread] = useState("");
  const [off, setOff] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [at, setAt] = useState<number | undefined>();
  const bar = useRef<HTMLDivElement>(null);
  const needle = fold(q.trim());
  const shown = items.filter((b) => (all || !b.minor) && (!thread || b.threads?.includes(thread)) && !off.includes(tone(b.kind)) && (!needle || fold(b.what).includes(needle)));
  const tshown = (thread ? tales.filter((t) => t.covers?.some((c) => beatById.get(c)?.threads?.includes(thread))) : tales).filter((t) => !needle || fold(t.title + " " + t.text).includes(needle));
  const years = useMemo(() => {
    const m = new Map<number, (Beat | Telling)[]>();
    for (const x of [...shown, ...tshown].sort((a, b) => a.on.localeCompare(b.on) || ("what" in a ? -1 : 1))) { const y = +x.on.slice(0, 4); m.set(y, [...(m.get(y) ?? []), x]); }
    return [...m.entries()];
  }, [shown.length, tshown.length, thread, all, needle, off.join()]);
  const hidden = items.filter((b) => b.minor).length;
  // the sticky head knows its own height (so a year lands below it) and which year is under it
  useEffect(() => {
    if (!filters || !bar.current) return;
    const el = bar.current;
    const size = () => document.documentElement.style.setProperty("--stuck", `${el.offsetHeight + 12}px`);
    const ro = new ResizeObserver(size); ro.observe(el); size();
    let tick = 0;
    const scroll = () => { cancelAnimationFrame(tick); tick = requestAnimationFrame(() => {
      const line = el.getBoundingClientRect().bottom + 24;
      let y: number | undefined;
      for (const s of document.querySelectorAll<HTMLElement>(".year")) { if (s.getBoundingClientRect().top <= line) y = +s.id.slice(1); else break; }
      setAt(y);
    }); };
    addEventListener("scroll", scroll, { passive: true }); scroll();
    return () => { ro.disconnect(); removeEventListener("scroll", scroll); document.documentElement.style.removeProperty("--stuck"); };
  }, [filters]);
  const toggle = (t: string) => setOff((o) => (o.includes(t) ? o.filter((x) => x !== t) : [...o, t]));
  const filtered = !!(thread || needle || off.length);
  return (
    <div className="line">
      <div className={filters ? "sticky" : "unstuck"} ref={bar}>
        {head?.(at)}
        <div className="line-bar">
          {filters && <Follow thread={thread} setThread={setThread} />}
          <div className="tones" role="group" aria-label="Kinds of entry">
            {TONES.map(([k, label]) => <button type="button" key={k} className={`tone t-${k}`} aria-pressed={!off.includes(k)} onClick={() => toggle(k)} title={off.includes(k) ? `Show ${label.toLowerCase()}` : `Hide ${label.toLowerCase()}`}><i className="dot" />{label}</button>)}
          </div>
          {filters && <input id="record-find" className="find" type="search" placeholder="Find a word" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a word in the record" />}
          {hidden > 0 && <label className="check"><input id={filters ? "show-minor" : undefined} type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Lesser entries ({hidden})</label>}
        </div>
      </div>
      <p className="line-count">{shown.length} {shown.length === 1 ? "entry" : "entries"} and {tshown.length} {tshown.length === 1 ? "telling" : "tellings"}{filtered ? " match" : ""}. <FromKey /></p>
      {years.map(([y, xs]) => {
        const r = rulerAt(`${y}-07-01`);
        const reign = r?.[1].reigns?.find((g) => g.from <= `${y}-12-31` && (!g.to || g.to > `${y}-01-01`));
        return (
          <section className="year" key={y} id={`y${y}`}>
            <header>
              <h3>{y}</h3>
              <p>{hijriSpan(y)} AH</p>
              {r && reign && <p><a href={`#who-${r[0]}`}>{first(r[0])}</a>, {ordinal(y - +reign.from.slice(0, 4) + 1)} year</p>}
            </header>
            <div className="rows">{xs.map((x) => ("what" in x ? <BeatRow key={x.id} b={x} /> : <TellingCard key={x.id} t={x} />))}</div>
          </section>
        );
      })}
      {!years.length && <p className="empty">Nothing matches. {filtered && <button type="button" className="clear" onClick={() => { setThread(""); setQ(""); setOff([]); }}>Clear the filters</button>}</p>}
    </div>
  );
}

/* a way back up from anywhere on a long page */
function ToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => { const f = () => setShow(scrollY > 900); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, []);
  return show ? <button type="button" className="totop" onClick={() => scrollTo({ top: 0, behavior: "smooth" })}>Back to the top</button> : null;
}

/* ------------------------------------------------------------------ now */
const shareOf = (key: "faiths" | "cultures", name: string) => (r: Reckoning) => { const v = r.peoples?.[key]?.[name], t = r.realm?.souls; return typeof v === "number" && t ? (v / t) * 100 : null; };
const SHARES: [string, (r: Reckoning) => number | null][] = [["Muslim", shareOf("faiths", "Sunni")], ["Andalusī", shareOf("cultures", "Andalusi")]];
function Spark({ k, pick }: { k?: string; pick?: (r: Reckoning) => number | null }) {
  const get = pick ?? ((r: Reckoning) => (typeof r.realm?.[k!] === "number" ? r.realm[k!] : null));
  const pts = reckonings.map((r) => [frac(r.date), get(r)] as const).filter((p): p is readonly [number, number] => p[1] !== null);
  if (pts.length < 3) return null;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const P = pts.map(([x, y]) => `${(2 + ((x - x0) / (x1 - x0)) * 116).toFixed(1)},${(22 - ((y - y0) / (y1 - y0 || 1)) * 20).toFixed(1)}`);
  return <svg className="spark" viewBox="0 0 120 24" width="120" height="24" aria-hidden="true"><polyline points={P.join(" ")} /><circle cx={P.at(-1)!.split(",")[0]} cy={P.at(-1)!.split(",")[1]} r="2.2" /></svg>;
}
function RealmMap() {
  const m = D.map;
  if (!m) return null;
  return (
    <figure className="map">
      <svg viewBox={m.view.join(" ")} role="img" aria-label="The realm, its subjects and its allies at the last reckoning">
        {m.realms.filter((r) => r.role === "other").map((r) => <path key={r.t} className="m-other" d={r.d} />)}
        {m.realms.filter((r) => r.role !== "other").map((r) => <path key={r.t} className={`m-${r.role}`} d={r.d} />)}
        {m.realms.filter((r) => m.labels[r.t]).map((r) => <text key={r.t} x={r.t === "GRA" ? 1600 : r.c[0]} y={r.t === "GRA" ? 1500 : r.c[1]} textAnchor="middle">{m.labels[r.t]}</text>)}
      </svg>
      <figcaption><span><i className="sw m-ours" />The crown</span><span><i className="sw m-subject" />Ṭāʾifas and vassals</span><span><i className="sw m-ally" />Allies</span></figcaption>
    </figure>
  );
}
function Now() {
  const since = beats.filter((b) => b.r === now.date && !b.minor);
  const told = tellings.filter((t) => t.r === now.date);
  const ruler = now.court?.ruler, reign = ruler ? cast[ruler].reigns?.at(-1) : undefined;
  const open = threads.filter((t) => t.state === "open").map((t) => ({ t, last: beats.filter((b) => b.threads?.includes(t.id) && !b.minor).at(-1), n: beats.filter((b) => b.threads?.includes(t.id)).length }))
    .filter((x) => x.last).sort((a, b) => b.last!.on.localeCompare(a.last!.on));
  const questions = reckonings.flatMap((r) => (r.questions ?? []).map((q) => ({ q, r: r.date }))).reverse();
  return (
    <>
      <header className="now-head">
        <p className="eyebrow">The realm as last reckoned</p>
        <h1>{formatHijri(now.date)}</h1>
        <p className="sub">{formatWestern(now.date)}. {now.title}.</p>
        {ruler && <p className="sub"><Who id={ruler} full />{reign ? `, in the ${ordinal(+now.date.slice(0, 4) - +reign.from.slice(0, 4) + 1)} year of his reign` : ""}{now.court?.heir ? <>. Heir: <Who id={now.court.heir} /></> : null}.</p>}
      </header>
      <Frieze at={Y1} />
      <FriezeKey />
      <div className="now-grid">
        <div className="main">
          <section>
            <h2>Since the reckoning of {before ? formatWestern(before.date) : "the start"}</h2>
            <div className="rows">{since.map((b) => <BeatRow key={b.id} b={b} year />)}</div>
            {told.map((t) => <TellingCard key={t.id} t={t} />)}
          </section>
          <section>
            <h2>Open threads</h2>
            <ul className="threads">
              {open.map(({ t, last, n }) => (
                <li key={t.id}>
                  <a className="th-title" href={`#thread-${t.id}`}>{t.title}</a>
                  <span className={`pill ${t.kind}`}>{t.kind === "war" ? "War" : "Story"}</span>
                  <p className="th-premise">{t.premise}</p>
                  <p className="th-last"><span className="lab">Last, {dayMonth(last!.on)} {last!.on.slice(0, 4)}</span>{last!.what}</p>
                  <p className="th-n">{n} entries since {(t.from ?? beats.find((b) => b.threads?.includes(t.id))!.on).slice(0, 4)}</p>
                </li>
              ))}
            </ul>
          </section>
          {questions.length > 0 && (
            <section>
              <h2>Unanswered</h2>
              <p className="key">Things the saves show but don't explain. An answer from the player closes one.</p>
              <ul className="questions">{questions.map((x) => <li key={x.q}>{x.q} <span className="q-when">Asked at the reckoning of {formatWestern(x.r)}.</span></li>)}</ul>
            </section>
          )}
        </div>
        <aside>
          <RealmMap />
          <section>
            <h2>The count</h2>
            <table className="count">
              <tbody>
                {campaign.measures.filter((m) => typeof now.realm[m.key] === "number").map((m) => {
                  const v = now.realm[m.key], p = before?.realm?.[m.key], d = typeof p === "number" ? v - p : 0;
                  return (
                    <tr key={m.key}>
                      <th scope="row">{m.label}</th>
                      <td className="num">{fmt(m, v)}</td>
                      <td className={`delta ${d > 0 ? "up" : d < 0 ? "down" : ""}`}>{d ? `${d > 0 ? "+" : "−"}${fmt(m, Math.abs(d))}` : ""}</td>
                      <td><Spark k={m.key} /></td>
                    </tr>
                  );
                })}
                {SHARES.map(([label, pick]) => {
                  const v = pick(now), p = before ? pick(before) : null;
                  if (v === null) return null;
                  const d = p === null ? 0 : Math.round(v) - Math.round(p);
                  return <tr key={label}><th scope="row">{label}</th><td className="num">{Math.round(v)}%</td><td className={`delta ${d > 0 ? "up" : d < 0 ? "down" : ""}`}>{d ? `${d > 0 ? "+" : "−"}${Math.abs(d)}` : ""}</td><td><Spark pick={pick} /></td></tr>;
                })}
              </tbody>
            </table>
            <p className="key">Change since the last reckoning; the line runs from {Y0}.</p>
          </section>
          <Powers r={now} />
          {!!now.standing?.estates?.length && (
            <section>
              <h2>The crown and the estates</h2>
              <div className="es-stack" role="img" aria-label="Shares of power at the last reckoning">
                {now.standing.estates.map((e) => <i key={e.name} className={`es-${({ Crown: "crown", Nobility: "e0", "ʿUlamāʾ": "e1", Burghers: "e2", Commoners: "e3", "Dhimmī": "e4" } as Record<string, string>)[e.name] ?? "e4"}`} style={{ flexGrow: e.power ?? 0 }} title={`${e.name}: ${e.power?.toFixed(1)}%`} />)}
              </div>
              <ul className="es-legend">{now.standing.estates.map((e) => <li key={e.name}><i className={`sw es-${({ Crown: "crown", Nobility: "e0", "ʿUlamāʾ": "e1", Burghers: "e2", Commoners: "e3", "Dhimmī": "e4" } as Record<string, string>)[e.name] ?? "e4"}`} />{e.name === "Crown" ? "The crown" : e.name} <span className="num">{Math.round(e.power ?? 0)}%</span></li>)}</ul>
              <p className="key"><a href="#thread-estates">How the shares have moved since 1346</a></p>
            </section>
          )}
          <section>
            <h2>The court</h2>
            <dl className="court">
              {ruler && <div><dt>Emperor</dt><dd><Who id={ruler} />, aged {age(cast[ruler], now.date)}</dd></div>}
              {now.court?.heir && <div><dt>Heir</dt><dd><Who id={now.court.heir} />, aged {age(cast[now.court.heir], now.date)}</dd></div>}
              {(now.court?.council ?? []).map((c) => <div key={c.who + c.seat}><dt>{c.seat}</dt><dd><Who id={c.who} /></dd></div>)}
            </dl>
          </section>
          <section>
            <h2>Friends and wars</h2>
            <dl className="court">
              <div><dt>At war</dt><dd>{(now.standing?.wars ?? []).map((w, i) => <span key={w}>{i ? ", " : ""}<a href={`#thread-${w}`}>{threadById.get(w)?.title}</a></span>)}{!now.standing?.wars?.length && "At peace"}</dd></div>
              <div><dt>Allies</dt><dd>{(now.standing?.allies ?? []).join(", ")}</dd></div>
              <div><dt>Subjects</dt><dd>{(now.standing?.subjects ?? []).map((s) => s.replace(/ \((\w+)\)$/, "")).join(", ")}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
      {now.summary && <section className="summary"><h2>The reckoning in full</h2><p>{now.summary}</p></section>}
    </>
  );
}

/* ------------------------------------------------------------------ a telling */
function TellingPage({ id }: { id: string }) {
  const i = tellings.findIndex((t) => t.id === id), t = tellings[i];
  if (!t) return <Missing />;
  const body = md(t.text, (p) => !!cast[p]);
  const rests = (t.covers ?? []).map((c) => beatById.get(c)).filter(Boolean) as Beat[];
  const r = rulerAt(t.on);
  const book = bookOf(t);
  return (
    <article className="telling">
      <header>
        <p className="eyebrow">{book ? <><a href={`#book-${book.n}`}>{book.title}</a>. </> : null}A telling{r ? <> from the reign of <Who id={r[0]} /></> : null}</p>
        <h1>{t.title}</h1>
        <p className="sub">{formatHijri(t.on)}, {formatWestern(t.on)}</p>
      </header>
      <div className="t-grid">
        <div className="prose">
          <div dangerouslySetInnerHTML={{ __html: body.html }} />
          {body.verse && <blockquote className="verse"><p dangerouslySetInnerHTML={{ __html: body.verse }} />{t.verse && <footer>Qurʾān {t.verse}</footer>}</blockquote>}
        </div>
        <aside>
          {rests.length > 0 && (
            <section>
              <h2>What it rests on</h2>
              <p className="key">The record behind this telling. Anything in the prose that isn't here was invented for colour.</p>
              <div className="rows compact">{rests.map((b) => <BeatRow key={b.id} b={b} year />)}</div>
            </section>
          )}
          {t.behind && (
            <details className="behind">
              <summary>The writer's note: what was recorded and what was invented</summary>
              <div dangerouslySetInnerHTML={{ __html: md(t.behind).html }} />
            </details>
          )}
        </aside>
      </div>
      <nav className="pager">
        {tellings[i - 1] ? <a href={`#telling-${tellings[i - 1].id}`}><span className="lab">Before</span>{tellings[i - 1].title}</a> : <span />}
        {tellings[i + 1] ? <a href={`#telling-${tellings[i + 1].id}`}><span className="lab">After</span>{tellings[i + 1].title}</a> : <span />}
      </nav>
    </article>
  );
}

/* ------------------------------------------------------------------ threads */
function Threads() {
  const count = (id: string) => beats.filter((b) => b.threads?.includes(id)).length;
  return (
    <>
      <header className="page-head"><h1>Threads</h1><p className="sub">Every entry belongs to the line of years. Some also belong to a story that runs across them. Follow one on its own.</p></header>
      <Weave />
      <section>
        <h2>Stories</h2>
        <ul className="threads two">
          {threads.filter((t) => t.kind === "story").map((t) => (
            <li key={t.id}><a className="th-title" href={`#thread-${t.id}`}>{t.title}</a><span className={`pill state-${t.state}`}>{t.state === "standing" ? "Always running" : t.state === "open" ? "Open" : "Settled"}</span><p className="th-premise">{t.premise}</p><p className="th-n">{count(t.id)} entries</p></li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Wars</h2>
        <div className="scroll-x">
          <table className="wars">
            <thead><tr><th>War</th><th>Years</th><th>Entries</th><th>How it ended</th></tr></thead>
            <tbody>
              {threads.filter((t) => t.kind === "war").reverse().map((t) => (
                <tr key={t.id}><th scope="row"><a href={`#thread-${t.id}`}>{t.title}</a>{t.part && <span className="pill">{t.part}</span>}</th><td className="num">{t.from?.slice(0, 4)}–{t.to?.slice(0, 4) ?? ""}</td><td className="num">{count(t.id)}</td><td>{t.to ? (t.outcome ?? "").split(/(?<=\.)\s/)[0] : "Still fought"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function ThreadPage({ id }: { id: string }) {
  const t = threadById.get(id);
  if (!t) return <Missing />;
  const bs = beats.filter((b) => b.threads?.includes(id));
  const ts = tellings.filter((x) => x.covers?.some((c) => beatById.get(c)?.threads?.includes(id)));
  const who = new Map<string, number>();
  for (const b of bs) for (const w of b.who ?? []) who.set(w, (who.get(w) ?? 0) + 1);
  const from = t.from ?? bs[0]?.on, to = t.to ?? (t.state === "closed" ? bs.at(-1)?.on : undefined);
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{t.kind === "war" ? "A war" : "A story"}{t.game ? `, the game's “${t.game}”` : ""}</p>
        <h1>{t.title}</h1>
        <p className="sub">{from ? formatWestern(from) : ""}{to ? ` to ${formatWestern(to)}` : t.state === "standing" ? ", always running" : ", still open"}</p>
        {t.premise && <p className="lede">{t.premise}</p>}
        {t.outcome && <p className="lede"><span className="lab">How it ended</span>{t.outcome.split(/(?<=\.)\s/)[0]}</p>}
        {(t.sides || (t.outcome && t.outcome.split(/(?<=\.)\s/).length > 1)) && (
          <details className="behind">
            <summary>The sides, and the ending in full</summary>
            <div>
              {t.sides && <dl className="sides">{Object.entries(t.sides).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v.join(", ")}</dd></div>)}</dl>}
              {t.outcome && <p>{t.outcome}</p>}
            </div>
          </details>
        )}
        {who.size > 0 && <p className="sub"><span className="lab">In it</span>{[...who.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w], i) => <span key={w}>{i ? ", " : ""}<Who id={w} /></span>)}</p>}
      </header>
      {t.kind === "war" && <BattleMap bs={bs} from={t.from} />}
      {t.id === "estates" && <Estates />}
      <Line items={bs} tales={ts} startOpen={bs.filter((b) => !b.minor).length < 8} />
    </>
  );
}

/* ------------------------------------------------------------------ people */
const lifespan = (p: Person) => `${p.born ? p.born.slice(0, 4) : "?"}–${p.died ? p.died.slice(0, 4) : ""}`;
function People() {
  const by = (tier?: string) => Object.entries(cast).filter(([, p]) => p.tier === tier).sort((a, b) => (a[1].born ?? "").localeCompare(b[1].born ?? ""));
  const Card = ({ id, p }: { id: string; p: Person }) => (
    <li className="pcard"><Seal id={id} size={64} /><a className="th-title" href={`#who-${id}`}>{p.name}</a><p className="th-n">{lifespan(p)}{p.died ? "" : `, aged ${age(p, now.date)}`}</p><p className="th-premise">{(p.drives?.at(-1)?.text ?? p.roles?.[0] ?? "")}</p></li>
  );
  return (
    <>
      <header className="page-head"><h1>People</h1><p className="sub">The story is told through a few of them. The rest are on record.</p></header>
      <section><h2>The house of Naṣr</h2><FamilyTree /></section>
      <section><h2>The story's centre</h2><ul className="threads two">{by("central").map(([id, p]) => <Card key={id} id={id} p={p} />)}</ul></section>
      <section><h2>Often on the page</h2><ul className="names">{by("key").map(([id, p]) => <li key={id}><Who id={id} full /> <span className="th-n">{lifespan(p)}</span></li>)}</ul></section>
      <details className="everyone"><summary>Everyone else on record ({by(undefined).length})</summary><ul className="names">{by(undefined).map(([id, p]) => <li key={id}><Who id={id} full /> <span className="th-n">{lifespan(p)}</span></li>)}</ul></details>
    </>
  );
}
function PersonPage({ id }: { id: string }) {
  const p = cast[id];
  if (!p) return <Missing />;
  const bs = beats.filter((b) => b.who?.includes(id));
  const ts = tellings.filter((t) => t.who?.includes(id));
  const children = Object.entries(cast).filter(([, c]) => c.father === id || c.mother === id).sort((a, b) => (a[1].born ?? "").localeCompare(b[1].born ?? ""));
  const ties = [...(p.ties ?? []).map((t) => ({ ...t, other: t.with })), ...Object.entries(cast).flatMap(([o, c]) => (c.ties ?? []).filter((t) => t.with === id).map((t) => ({ ...t, other: o })))];
  const alive = !p.died;
  return (
    <>
      <header className="page-head person">
        {p.arabic && <p className="ar big" lang="ar" dir="rtl">{p.arabic}</p>}
        <h1>{p.name}</h1>
        <p className="sub">{p.born ? `Born ${formatWestern(p.born)}` : "Birth unrecorded"}{p.died ? `, died ${formatWestern(p.died)}, aged ${age(p, p.died)}` : p.born ? `, aged ${age(p, now.date)} at the last reckoning` : ""}{p.house ? `. Of the ${p.house} house` : ""}.</p>
        {!!p.roles?.length && <p className="sub">{p.roles.join("; ")}</p>}
        <dl className="sides">
          {(p.father || p.mother) && <div><dt>Parents</dt><dd>{[p.father, p.mother].filter(Boolean).map((x, i) => <span key={x}>{i ? " and " : ""}<Who id={x!} full /></span>)}</dd></div>}
          {children.length > 0 && <div><dt>Children</dt><dd>{children.map(([c], i) => <span key={c}>{i ? ", " : ""}<Who id={c} /></span>)}</dd></div>}
          {(p.reigns ?? []).map((r) => <div key={r.from}><dt>Reigned</dt><dd>{formatWestern(r.from)} to {r.to ? formatWestern(r.to) : alive ? "the present" : ""}</dd></div>)}
        </dl>
      </header>
      <LifeLines id={id} />
      {!!p.drives?.length && (
        <section>
          <h2>What drives {p.sex === "f" ? "her" : "him"}</h2>
          <ol className="drives">{p.drives.map((d, n) => <li key={d.from + d.text}><span className="b-date"><b className="pin">{n + 1}</b>{d.from.slice(0, 4)}</span><span>{d.text} <span className="th-n">{d.by === "trent" ? "The player's reading." : "The telling's reading."}</span></span></li>)}</ol>
        </section>
      )}
      {ties.length > 0 && (
        <section>
          <h2>Allies and rivals</h2>
          <ul className="ties">{ties.map((t) => <li key={t.other + t.from + t.kind}><span className={`pill tie-${t.kind}`}>{t.kind}</span><Who id={t.other} /> <span className="th-n">{t.from.slice(0, 4)}{t.to ? `–${t.to.slice(0, 4)}` : ""}</span><p className="th-premise">{t.text}</p></li>)}</ul>
        </section>
      )}
      <section>
        <h2>On the record</h2>
        {bs.length + ts.length ? <Line items={bs} tales={ts} startOpen /> : <p className="empty">No entry names {p.sex === "f" ? "her" : "him"} yet.</p>}
      </section>
      {p.note && <details className="behind"><summary>The long note carried over from the old Chronicle</summary><p>{p.note}</p></details>}
    </>
  );
}

/* ------------------------------------------------------------------ about */
function About() {
  return (
    <article className="about prose">
      <h1>How the Register is kept</h1>
      <p>The Register is a prototype of a different companion to the campaign. It holds the same history as the Chronicle, {reckonings.length} reckonings, {beats.length} entries and {tellings.length} tellings, rebuilt around three questions: where does the realm stand, what happened, and how do we know.</p>
      <h2>Three kinds of thing</h2>
      <p><strong>A reckoning</strong> is one reading of a save: the count of the realm, the court, and everything learned since the last one. <strong>An entry</strong> is one dated fact in one sentence. <strong>A telling</strong> is the story written over a handful of entries, in the chronicle's voice, and it lists the entries it rests on.</p>
      <h2>How we know</h2>
      <p>Every entry carries up to three marks: <FromKey /></p>
      <p>A telling may invent colour. Whatever it says that isn't among the entries it rests on is invented, and the writer's note under each telling says so in detail.</p>
      <h2>One file per reckoning</h2>
      <p>Logging a session means adding one file, <code>reckonings/1451-12-21.yaml</code>, with the count, the entries and any telling. People, wars and stories are small files of their own. Every page here, the line, the threads, each person's record, the open threads on the front, is worked out from those files. Nothing is written twice.</p>
      <p>The same folder layout would hold any campaign in any game: the measures in the count, the kinds of entry and the calendar are settings in one file.</p>
      <p className="th-n">{campaign.game}. Played by {campaign.player}. Months of the Hijri year: {HIJRI_MONTHS.slice(0, 3).join(", ")} and the rest, reckoned by the tabular calendar.</p>
    </article>
  );
}
const Missing = () => <div className="page-head"><h1>Nothing is recorded here</h1><p className="sub"><a href="#now">Go to the realm as it stands</a></p></div>;

/* ------------------------------------------------------------------ the frame */
export function App() {
  const r = useRoute();
  const tab = r.view === "thread" ? "threads" : r.view === "who" ? "people" : r.view === "telling" || r.view === "book" ? "story" : r.view;
  const link = (v: string, label: ReactNode) => <a href={`#${v}`} aria-current={tab === v ? "page" : undefined}>{label}</a>;
  return (
    <>
      <header className="top">
        <div className="wrap">
          <a className="mark" href="#story"><span>{campaign.title}</span>{campaign.arabic && <bdi className="ar" lang="ar" dir="rtl">{campaign.arabic}</bdi>}</a>
          <nav aria-label="Sections">{link("story", "The story")}{link("atlas", "Atlas")}{link("now", "Now")}{link("line", "The record")}{link("threads", "Threads")}{link("people", "People")}</nav>
        </div>
      </header>
      <main className="wrap">
        {(r.view === "story" || r.view === "book") && <Story />}
        {r.view === "atlas" && <Atlas />}
        {r.view === "now" && <Now />}
        {r.view === "line" && (
          <>
            <header className="page-head"><h1>The record, year by year</h1><p className="sub">{campaign.subtitle}. {beats.length} entries and {tellings.length} tellings, {Y0} to {Y1}.</p></header>
            <Line items={beats} tales={tellings} filters head={(at) => <Frieze at={at ?? (r.arg ? +r.arg : undefined)} />} />
          </>
        )}
        {r.view === "threads" && <Threads />}
        {r.view === "thread" && <ThreadPage id={r.arg!} key={r.arg} />}
        {r.view === "people" && <People />}
        {r.view === "who" && <PersonPage id={r.arg!} key={r.arg} />}
        {r.view === "telling" && <TellingPage id={r.arg!} key={r.arg} />}
        {r.view === "about" && <About />}
      </main>
      <ToTop />
      <footer className="foot wrap"><p>The Register, a prototype. Reckoned to {formatWestern(now.date)}. <a href="#about">How it is kept</a></p></footer>
    </>
  );
}
