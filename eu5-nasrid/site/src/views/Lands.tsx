import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { snapshots, lands, subjectLands, places, western, hijri, nf, compact, faithName, cultureName, rankName, countryByTag, personById } from "../lib/data";
import type { Land } from "../lib/data";
import { gameMap } from "../lib/map";
import { PageHead, CheckpointSelect, StarRule } from "../components/bits";
import "./lands.css";

/* Colours: the validated reference palette, assigned in fixed order to fixed entities
   (never by rank), and a four-step single-hue ramp for control and development. */
const CULTURE_COLOR: Record<string, string> = { andalusi: "#2a78d6", catalan: "#eb6834", aragonese: "#1baf7a", castilian: "#eda100", sephardi: "#e87ba4" };
const FAITH_COLOR: Record<string, string> = { sunni: "#2a78d6", catholic: "#eb6834", judaism: "#1baf7a" };
const OTHER = "#a39a86";
const RAMP = ["#5598e7", "#2a78d6", "#1c5cab", "#0d366b"];
const INTEG_COLOR = { core: "#2a78d6", conquered: "#eb6834" };

type Lens = "control" | "culture" | "faith" | "integration" | "development";
const LENSES: { id: Lens; label: string }[] = [
  { id: "control", label: "Control" },
  { id: "culture", label: "Peoples" },
  { id: "faith", label: "Faiths" },
  { id: "integration", label: "Integration" },
  { id: "development", label: "Development" },
];
const CONTROL_BINS = [0.25, 0.5, 0.75];
const DEV_BINS = [10, 20, 30];
const bin = (v: number, edges: number[]) => edges.filter((e) => v >= e).length;

const byKey = new Map(places.map((p) => [p.key, p]));
/** The chronicle's name where the gazetteer has one, else the game's. */
export function landName(key: string) {
  const p = byKey.get(key);
  return { name: p?.name ?? gameMap.names?.locations[key] ?? key.replace(/_/g, " "), ar: p?.nameArabic, id: p?.id };
}
const provinceName = (k: string | null) => (k ? gameMap.names?.provinces[k] ?? k.replace(/_province$/, "").replace(/_/g, " ") : "Unknown");
const areaName = (k: string | null) => (k ? gameMap.names?.areas[k] ?? k.replace(/_area$/, "").replace(/_/g, " ") : "Unknown");
const pct = (v: number | null) => (v == null ? "" : `${Math.round(v * 100)}%`);
const integrated = (l: Land) => (l.core ? "core" : "conquered");

function fill(l: Land, lens: Lens) {
  switch (lens) {
    case "control": return l.control == null ? OTHER : RAMP[bin(l.control, CONTROL_BINS)];
    case "development": return l.development == null ? OTHER : RAMP[bin(l.development, DEV_BINS)];
    case "culture": return CULTURE_COLOR[l.culture ?? ""] ?? OTHER;
    case "faith": return FAITH_COLOR[l.religion ?? ""] ?? OTHER;
    case "integration": return INTEG_COLOR[integrated(l)];
  }
}
function lensValue(l: Land, lens: Lens) {
  switch (lens) {
    case "control": return `Control ${pct(l.control)}`;
    case "development": return `Development ${l.development?.toFixed(1) ?? "?"}`;
    case "culture": return `Mostly ${cultureName(l.culture ?? "")} (${pct((l.cultures[l.culture ?? ""] ?? 0) / (l.population || 1))})`;
    case "faith": return `Mostly ${faithName(l.religion ?? "")} (${pct((l.religions[l.religion ?? ""] ?? 0) / (l.population || 1))})`;
    case "integration": return l.core ? "Core of Granada" : "Conquered, not yet a core";
  }
}
function legend(lens: Lens, rows: Land[]) {
  if (lens === "control") return [["below 25%", RAMP[0]], ["25–50%", RAMP[1]], ["50–75%", RAMP[2]], ["75% or more", RAMP[3]]];
  if (lens === "development") return [["below 10", RAMP[0]], ["10–20", RAMP[1]], ["20–30", RAMP[2]], ["30 or more", RAMP[3]]];
  if (lens === "integration") return [["Core", INTEG_COLOR.core], ["Conquered", INTEG_COLOR.conquered]];
  const colors = lens === "culture" ? CULTURE_COLOR : FAITH_COLOR;
  const name = lens === "culture" ? cultureName : faithName;
  const present = new Set(rows.map((r) => (lens === "culture" ? r.culture : r.religion) ?? ""));
  const out: [string, string][] = Object.entries(colors).filter(([k]) => present.has(k)).map(([k, c]) => [name(k), c]);
  if ([...present].some((k) => !colors[k])) out.push(["Other", OTHER]);
  return out;
}

/* ------------------------------------------------------------ the map */

function LandsMap({ rows, lens }: { rows: (Land & { holder?: string })[]; lens: Lens }) {
  const [hover, setHover] = useState<{ l: Land; x: number; y: number } | null>(null);
  const box = useMemo(() => {
    const cs = rows.map((r) => gameMap.locations[r.key]?.c).filter(Boolean) as [number, number][];
    const xs = cs.map((c) => c[0]), ys = cs.map((c) => c[1]);
    const pad = 45;
    let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
    // keep a landscape frame so the realm doesn't become a sliver
    const w = x1 - x0, h = y1 - y0, want = Math.max(w, h * 1.4);
    x0 -= (want - w) / 2; x1 += (want - w) / 2;
    const hh = want / 1.4; y0 -= (hh - h) / 2; y1 += (hh - h) / 2;
    return { x0, y0, w: want, h: hh };
  }, [rows]);
  const ours = new Set(rows.map((r) => r.key));
  const k = box.w / 900;
  return (
    <div className="lands-map">
      <svg viewBox={`${box.x0} ${box.y0} ${box.w} ${box.h}`} role="img" aria-label={`Granada's lands coloured by ${lens}; the table below has every value`}
        onMouseLeave={() => setHover(null)}>
        <defs>
          <pattern id="subj-hatch" width={6 * k} height={6 * k} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={6 * k} stroke="#f4ead2" strokeWidth={1.6 * k} strokeOpacity={0.75} />
          </pattern>
        </defs>
        <rect x={box.x0} y={box.y0} width={box.w} height={box.h} className="sea" />
        <path d={gameMap.coast} className="land" />
        {Object.entries(gameMap.locations).filter(([key, l]) => !ours.has(key) && l.kind === "land").map(([key, l]) => (
          <path key={key} d={l.d} className="other" strokeWidth={0.6 * k} />
        ))}
        {rows.map((r) => {
          const l = gameMap.locations[r.key];
          if (!l) return null;
          const nm = landName(r.key);
          const subj = r.holder && r.holder !== "GRA";
          return (
            <g key={r.key}>
            <path d={l.d} className={`mine ${hover?.l.key === r.key ? "on" : ""}`} style={{ fill: fill(r, lens) }} strokeWidth={1.4 * k}
              tabIndex={0} aria-label={`${nm.name}: ${lensValue(r, lens)}`}
              onMouseMove={(e) => {
                const host = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({ l: r, x: e.clientX - host.left, y: e.clientY - host.top });
              }}
              onFocus={() => setHover({ l: r, x: 20, y: 20 })} onBlur={() => setHover(null)} />
            {subj && <path d={l.d} fill="url(#subj-hatch)" pointerEvents="none" />}
            </g>
          );
        })}
        <path d={gameMap.coast} className="coast" strokeWidth={1.3 * k} />
      </svg>
      {hover && (() => {
        const nm = landName(hover.l.key);
        return (
          <div className="lands-tip ui" style={{ left: hover.x + 14, top: hover.y + 14 }}>
            <div className="t">{nm.ar && <span className="ar">{nm.ar}</span>} {nm.name}</div>
            <div>{lensValue(hover.l, lens)}</div>
            <div className="m">{provinceName(hover.l.province)}, {compact(hover.l.population)} people{(hover.l as Land & { holder?: string }).holder && (hover.l as Land & { holder?: string }).holder !== "GRA" ? `, held through ${countryByTag.get((hover.l as Land & { holder?: string }).holder!)?.nameChronicle}` : ""}</div>
          </div>
        );
      })()}
    </div>
  );
}

/* ------------------------------------------------------------ stacked bar */

function Shares({ parts, total, colors, name }: { parts: Record<string, number>; total: number; colors: Record<string, string>; name: (k: string) => string }) {
  const entries = Object.entries(parts).sort((a, b) => b[1] - a[1]);
  const label = entries.map(([k, v]) => `${name(k)} ${Math.round((100 * v) / (total || 1))}%`).join(", ");
  return (
    <span className="shares" role="img" aria-label={label} title={label}>
      {entries.map(([k, v]) => <i key={k} style={{ width: `${(100 * v) / (total || 1)}%`, background: colors[k] ?? OTHER }} />)}
    </span>
  );
}

/* ------------------------------------------------------------ the page */

export default function Lands() {
  // Every checkpoint carries its lands (from the extracted facts).
  const withLands = snapshots;
  const [i, setI] = useState(withLands.length - 1);
  const [lens, setLens] = useState<Lens>("control");
  const snap = withLands[i];
  const rows = lands[snap.id] ?? [];
  const subjects = Object.entries(subjectLands[snap.id] ?? {});
  const allRows = [...rows.map((r) => ({ ...r, holder: "GRA" })), ...subjects.flatMap(([tag, s]) => s.lands.map((r) => ({ ...r, holder: tag })))];
  const keysAt = (id: string) => [...(lands[id] ?? []), ...Object.values(subjectLands[id] ?? {}).flatMap((s) => s.lands)].map((l) => l.key);
  const prev = i > 0 ? new Set(keysAt(withLands[i - 1].id)) : null;

  // Area → province → locations, largest first.
  const groups = useMemo(() => groupLands(rows), [rows]);
  const subjectGroups = useMemo(() => subjects.map(([tag, s]) => ({ tag, s, provinces: groupLands(s.lands).flatMap((g) => g.provinces) })), [snap.id]);
  function groupLands(rows: Land[]) {
    const areas = new Map<string, Map<string, Land[]>>();
    for (const r of rows) {
      const a = r.area ?? "?", p = r.province ?? "?";
      if (!areas.has(a)) areas.set(a, new Map());
      const m = areas.get(a)!;
      if (!m.has(p)) m.set(p, []);
      m.get(p)!.push(r);
    }
    const pop = (ls: Land[]) => ls.reduce((s, l) => s + l.population, 0);
    return [...areas.entries()].map(([a, m]) => ({
      area: a,
      provinces: [...m.entries()].map(([p, ls]) => ({ province: p, lands: ls.sort((x, y) => y.population - x.population) }))
        .sort((x, y) => pop(y.lands) - pop(x.lands)),
    })).sort((x, y) => pop(y.provinces.flatMap((p) => p.lands)) - pop(x.provinces.flatMap((p) => p.lands)));
  }

  const sum = (ls: Land[], f: (l: Land) => number) => ls.reduce((s, l) => s + f(l), 0);
  const wmean = (ls: Land[], f: (l: Land) => number | null) => {
    const p = sum(ls, (l) => (f(l) == null ? 0 : l.population));
    return p ? sum(ls, (l) => (f(l) ?? 0) * l.population) / p : null;
  };
  const muslims = (ls: Land[]) => sum(ls, (l) => l.religions.sunni ?? 0);

  const renderProvince = (p: { province: string; lands: Land[] }, holder: string) => (
    <Fragment key={p.province}>
      <tr className="prov-row">
        <th scope="rowgroup" className="place">{provinceName(p.province)}</th>
        <td />
        <td className="num">{nf.format(sum(p.lands, (l) => l.population))}</td>
        <td colSpan={2} className="sub">{p.lands.length} {p.lands.length === 1 ? "location" : "locations"}</td>
        <td className="num">{pct(wmean(p.lands, (l) => l.control))}</td>
        <td className="num">{wmean(p.lands, (l) => l.development)?.toFixed(1)}</td>
        <td /><td className="num">{sum(p.lands, (l) => l.tax ?? 0).toFixed(1)}</td><td />
      </tr>
      {p.lands.map((l) => {
        const nm = landName(l.key);
        const isNew = prev && !prev.has(l.key);
        return (
          <tr key={l.key} className={isNew ? "new" : ""}>
            <th scope="row" className="place">
              {nm.id ? <Link to={`/places/${nm.id}`} data-kind="place" data-id={nm.id}>{nm.ar && <span className="ar">{nm.ar}</span>}{nm.name}</Link>
                : <span>{nm.name}</span>}
              {isNew && <span className="flag-new">New</span>}
            </th>
            <td>{rankName(l.rank)}</td>
            <td className="num">{nf.format(l.population)}</td>
            <td><Shares parts={l.cultures} total={l.population} colors={CULTURE_COLOR} name={cultureName} /></td>
            <td><Shares parts={l.religions} total={l.population} colors={FAITH_COLOR} name={faithName} /></td>
            <td className="num"><span className="ctl"><i style={{ width: pct(l.control) }} /></span>{pct(l.control)}</td>
            <td className="num">{l.development?.toFixed(1)}</td>
            <td>{holder === "GRA" ? (l.core ? "Core" : "Conquered") : (l.core ? `Core of ${countryByTag.get(holder)?.name ?? holder}` : "Not yet a core")}{l.controller && l.controller !== holder ? `, held by ${l.controller}` : ""}</td>
            <td className="num" title={l.possibleTax != null ? `${l.tax?.toFixed(2)} of a possible ${l.possibleTax.toFixed(2)}` : ""}>
              {l.tax?.toFixed(1)}<span className="of"> of {l.possibleTax?.toFixed(1)}</span>
            </td>
            <td>{l.goods ? l.goods.replace(/_/g, " ") : ""}</td>
          </tr>
        );
      })}
    </Fragment>
  );

  return (
    <div className="page lands-page">
      <PageHead
        title="The Provinces"
        ar="الكور"
        lede="Every town and district under the sultan and his ṭāʾifas, by the province (the kūra) it belongs to: who lives there, what they believe, how firmly it is held, and how far it has become its ruler's own."
      />

      <div className="lands-date">
        <span className="ar">{hijri(snap.date).arabic}</span>
        <span className="ui">{western(snap.date)}: {rows.length} locations, {nf.format(sum(rows, (l) => l.population))} people{subjects.length ? `; through ${subjects.length === 1 ? "a ṭāʾifa" : `${subjects.length} ṭāʾifas`}, ${allRows.length - rows.length} more locations and ${nf.format(sum(subjects.flatMap(([, s]) => s.lands), (l) => l.population))} more people` : ""}</span>
      </div>
      <CheckpointSelect value={i} onChange={setI} />

      <section className="area-cards ui" aria-label="The realm by area">
        {groups.map((g) => {
          const ls = g.provinces.flatMap((p) => p.lands);
          const pop = sum(ls, (l) => l.population);
          return (
            <div key={g.area} className="area-card">
              <span className="an">{areaName(g.area)}</span>
              <span className="row"><b>{ls.length}</b> {ls.length === 1 ? "location" : "locations"}, <b>{compact(pop)}</b> people</span>
              <span className="row"><b>{pct(muslims(ls) / (pop || 1))}</b> Muslim, control <b>{pct(wmean(ls, (l) => l.control))}</b></span>
              <span className="row">{ls.filter((l) => l.core).length} of {ls.length} {ls.filter((l) => l.core).length === 1 ? "is a core" : "are cores"}</span>
            </div>
          );
        })}
        {subjectGroups.map(({ tag, s }) => {
          const ls = s.lands, pop = sum(ls, (l) => l.population);
          const c = countryByTag.get(tag);
          return (
            <div key={tag} className="area-card subject" style={{ borderLeftColor: c?.color }}>
              <span className="an">{c?.nameChronicle ?? tag}</span>
              <span className="row">Ṭāʾifa since {western(s.since ?? snap.date)}{s.ruler ? <>, under <b>{personById.get(s.ruler)?.name}</b></> : null}</span>
              <span className="row"><b>{ls.length}</b> {ls.length === 1 ? "location" : "locations"}, <b>{compact(pop)}</b> people, <b>{pct(muslims(ls) / (pop || 1))}</b> Muslim</span>
              <span className="row">Control <b>{pct(wmean(ls, (l) => l.control))}</b>; a {faithName(s.religion ?? "")}, {cultureName(s.culture ?? "")} {s.rank ?? ""}</span>
              {(() => {
                const ly = snap.subjects.find((x) => x.country === c?.name)?.loyalty;
                if (!ly) return <span className="row muted-s">Loyalty not read at this checkpoint</span>;
                return (
                  <span className={`row loyalty ${ly.value < 50 ? "disloyal" : ""}`}>
                    <span>Loyalty <b>{ly.value}</b>{ly.trend ? `, ${ly.trend}` : ""}{ly.value < 50 ? "; disloyal below 50" : ""}</span>
                    <span className="lbar" aria-hidden="true"><i style={{ width: `${ly.value}%` }} /><em /></span>
                  </span>
                );
              })()}
            </div>
          );
        })}
      </section>

      <div className="lens-bar ui" role="radiogroup" aria-label="Colour the map by">
        {LENSES.map((l) => (
          <button key={l.id} type="button" role="radio" aria-checked={lens === l.id} className={lens === l.id ? "on" : ""} onClick={() => setLens(l.id)}>{l.label}</button>
        ))}
        <span className="legend">
          {legend(lens, allRows).map(([t, c]) => <span key={t}><i style={{ background: c }} />{t}</span>)}
          {subjects.length > 0 && <span><i className="hatch-key" />held through a ṭāʾifa</span>}
        </span>
      </div>
      <LandsMap rows={allRows} lens={lens} />

      <StarRule />
      <h2 className="section-title">Province by province</h2>
      <p className="muted lede-s">
        Control is how firmly the crown's writ runs; a conquered location becomes a core only after it is integrated.
        Tax is what the location yields now, of what it could yield at full control. The bars show each location's
        peoples and faiths; hover one for the shares.
      </p>
      <div className="lands-table-wrap">
        <table className="lands-table ui">
          <thead>
            <tr>
              <th className="place">Place</th><th>Rank</th><th className="num">People</th><th>Peoples</th><th>Faiths</th>
              <th className="num">Control</th><th className="num"><abbr title="Development">Dev.</abbr></th><th>Standing</th><th className="num">Tax</th><th>Goods</th>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.area}>
              <tr className="area-row"><th colSpan={10} scope="colgroup">{areaName(g.area)}</th></tr>
              {g.provinces.map((p) => renderProvince(p, "GRA"))}
            </tbody>
          ))}
          {subjectGroups.map(({ tag, s, provinces }) => {
            const c = countryByTag.get(tag);
            return (
              <tbody key={tag} className="subject-body">
                <tr className="area-row subject"><th colSpan={10} scope="colgroup">
                  {c?.nameArabic && <span className="ar">{c.nameArabic}</span>}{c?.nameChronicle ?? tag}
                  <span className="sub-note">a ṭāʾifa of Granada since {western(s.since ?? snap.date)}{s.ruler ? `, under ${personById.get(s.ruler)?.name}` : ""}</span>
                </th></tr>
                {provinces.map((p) => renderProvince(p, tag))}
              </tbody>
            );
          })}
        </table>
      </div>
      <p className="muted ui foot">
        From the save at each checkpoint. Place names are the chronicle's where it has named a place, otherwise the game's;
        province and area names are the game's.
      </p>
    </div>
  );
}

/** A location's standing at the latest checkpoint that holds it, for its gazetteer page. */
export function latestLand(key: string): { land: Land; date: string } | null {
  for (let k = snapshots.length - 1; k >= 0; k--) {
    const l = lands[snapshots[k].id]?.find((x) => x.key === key);
    if (l) return { land: l, date: snapshots[k].date };
  }
  return null;
}
export { CULTURE_COLOR, FAITH_COLOR, Shares, provinceName, areaName };
