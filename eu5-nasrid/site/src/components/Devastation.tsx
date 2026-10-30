import { useMemo } from "react";
import type { Devastation as Reading } from "../lib/data";
import { places, western, nf, countryByTag } from "../lib/data";
import { gameMap } from "../lib/map";
import "./devastation.css";

/** Bins of population change, worst first. The last two are the land that grew. */
const BINS = [
  { max: -30, cls: "d5", label: "fell by 30% or more" },
  { max: -20, cls: "d4", label: "20–30%" },
  { max: -10, cls: "d3", label: "10–20%" },
  { max: -3, cls: "d2", label: "3–10%" },
  { max: 3, cls: "d1", label: "held within 3%" },
  { max: Infinity, cls: "d0", label: "grew" },
];
const bin = (pct: number) => BINS.find((b) => pct < b.max) ?? BINS[BINS.length - 1];
const pct = (a: number, b: number) => (a ? (b / a - 1) * 100 : 0);
const fmtPct = (p: number) => `${p > 0 ? "+" : p < 0 ? "−" : ""}${Math.abs(p).toFixed(1)}%`;

const byKey = new Map(places.map((p) => [p.key, p]));
const locName = (k: string) => byKey.get(k)?.name ?? gameMap.names?.locations[k] ?? k.replace(/_/g, " ");
const areaName = (k: string | null) => (k ? gameMap.names?.areas[k] ?? k.replace(/_area$/, "").replace(/_/g, " ") : "Unknown");

/** A map and tally of what a run of wars did to the land: people lost, and the towns looted. */
export default function Devastation({ d, checkpoint }: { d: Reading; checkpoint?: string }) {
  const locs = Object.entries(d.locations);
  const box = useMemo(() => {
    const cs = locs.map(([k]) => gameMap.locations[k]?.c).filter(Boolean) as [number, number][];
    const xs = cs.map((c) => c[0]), ys = cs.map((c) => c[1]);
    const pad = 14;
    return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
  }, [d]);
  const [vx, vy, vw, vh] = box;
  const k = vw / 900;
  const ours = checkpoint ? gameMap.realms[checkpoint]?.GRA : undefined;

  const areas = Object.entries(d.areas)
    .map(([a, v]) => ({ a, ...v, p: pct(v.pop0, v.pop1) }))
    .sort((x, y) => x.p - y.p);
  const worst = locs.map(([key, v]) => ({ key, ...v, p: pct(v.pop0, v.pop1), lost: v.pop0 - v.pop1 }))
    .sort((x, y) => y.lost - x.lost).slice(0, 12);
  const burned = areas.filter((a) => a.p < -1);
  const spared = areas.filter((a) => a.looted === 0 && a.p >= 0);
  const lostBurned = burned.reduce((s, a) => s + a.pop0 - a.pop1, 0);
  const growSpared = spared.length ? pct(spared.reduce((s, a) => s + a.pop0, 0), spared.reduce((s, a) => s + a.pop1, 0)) : 0;
  const looted = locs.filter(([, v]) => v.looted).length;

  return (
    <section className="devastation">
      <h2 className="section-title">{d.title}</h2>
      <p className="muted">{d.note}</p>
      <p className="dv-lede">
        Between {western(d.dates.before)} and {western(d.dates.peace)} the lands that burned lost{" "}
        <strong>{nf.format(lostBurned)}</strong> people, and <strong>{looted}</strong> of the region's {locs.length} towns were looted.
        In the same years the lands the armies never reached grew by {fmtPct(growSpared)}.
      </p>

      <figure className="dv-figure">
        <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} role="img" aria-label={`Map of population change by town, ${western(d.dates.before)} to ${western(d.dates.peace)}`}>
          <defs><clipPath id="dv-land"><path d={gameMap.coast} /></clipPath></defs>
          <rect x={vx - vw} y={vy - vh} width={vw * 3} height={vh * 3} className="sea" />
          <path d={gameMap.coast} className="land" />
          <g clipPath="url(#dv-land)">
            {locs.map(([key, v]) => {
              const l = gameMap.locations[key];
              if (!l) return null;
              const p = pct(v.pop0, v.pop1);
              return (
                <path key={key} d={l.d} className={`loc ${bin(p).cls}`} strokeWidth={0.5 * k}>
                  <title>{`${locName(key)}: ${nf.format(v.pop0)} → ${nf.format(v.pop1)} people (${fmtPct(p)})${v.looted ? `; looted ${western(v.looted)}` : ""}`}</title>
                </path>
              );
            })}
          </g>
          {ours && <path d={ours.d} className="ours-edge" strokeWidth={2.2 * k} />}
          <path d={gameMap.coast} className="coast" strokeWidth={1.1 * k} />
          {locs.filter(([, v]) => v.looted).map(([key]) => {
            const c = gameMap.locations[key]?.c;
            return c ? <circle key={key} cx={c[0]} cy={c[1]} r={3.2 * k} className="looted" strokeWidth={1.2 * k} /> : null;
          })}
        </svg>
        <figcaption className="dv-legend ui">
          <span className="dv-key-title">People, {western(d.dates.before)} to the peace</span>
          {BINS.map((b) => <span key={b.cls} className="dv-key"><i className={b.cls} />{b.label}</span>)}
          <span className="dv-key"><i className="dot" />looted in these years</span>
          {ours && <span className="dv-key"><i className="edge" />{countryByTag.get("GRA")?.name ?? "Granada"} at the peace</span>}
        </figcaption>
      </figure>

      <div className="dv-tables">
        <div className="dv-scroll"><table className="dv-table ui">
          <caption>By land</caption>
          <thead><tr><th>Land</th><th className="n">Before</th><th className="n">At the peace</th><th className="n">Change</th><th className="n" title="towns looted, of all its towns">Looted</th></tr></thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.a} className={bin(a.p).cls}>
                <td>{areaName(a.a)}</td><td className="n">{nf.format(a.pop0)}</td><td className="n">{nf.format(a.pop1)}</td>
                <td className="n">{fmtPct(a.p)}</td><td className="n">{a.looted}/{a.locations}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <div className="dv-scroll"><table className="dv-table ui">
          <caption>The towns that lost most</caption>
          <thead><tr><th>Town</th><th className="n">Lost</th><th className="n">Change</th><th>Looted</th></tr></thead>
          <tbody>
            {worst.map((w) => (
              <tr key={w.key}>
                <td>{locName(w.key)}</td><td className="n">{nf.format(w.lost)}</td><td className="n">{fmtPct(w.p)}</td>
                <td>{w.looted ? western(w.looted) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </section>
  );
}
