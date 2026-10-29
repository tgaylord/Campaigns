import { Link } from "react-router-dom";
import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX } from "d3-shape";
import { wars, events, year, hijri, arabicDigits, yearFrac } from "../lib/data";
import type { War } from "../lib/data";
import { PageHead } from "../components/bits";
import "./wars.css";

export default function WarsIndex() {
  const sorted = [...wars].sort((a, b) => b.start.localeCompare(a.start));
  return (
    <div className="page wars-page">
      <PageHead title="Wars" ar="الحروب" lede="Every war the kingdom has fought, and those it may be drawn into, newest first. The ribbon under each is its war score: gold when the war ran our way, red when it ran against us." />
      {sorted.length === 0 && <p className="muted">No wars yet. May it stay so.</p>}
      <ul className="war-banners">
        {sorted.map((w) => {
          const fights = events.filter((e) => ["battle", "siege"].includes(e.type) && e.wars.includes(w.id));
          const won = fights.filter((f) => ["victory", "taken"].includes(String(f.data.result))).length;
          return (
            <li key={w.id}>
              <Link to={`/wars/${w.id}`} data-kind="war" data-id={w.id} className={w.involvement === "potential" ? "potential" : undefined}>
                <span className="years"><span className="ar">{arabicDigits(hijri(w.start).y)}</span>{year(w.start)}–{w.end ? year(w.end) : ""}</span>
                <span className="name">{w.name}</span>
                <span className="against ui">{againstLine(w)}</span>
                <span className="outcome ui">{w.outcome ?? (w.involvement === "potential" ? "Being fought without us" : "Still being fought")}{fights.length ? `. ${fights.length} engagements, ${won} won` : ""}</span>
                <Tide score={w.score} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Who the war is against, from Granada's side; a war we stand outside names both sides instead. */
export function againstLine(w: War) {
  if (w.involvement === "potential" && w.sides) return `${and(w.sides.attackers)} against ${and(w.sides.defenders)}. Granada stands outside it, and can be called in`;
  return `Against ${and(w.enemies)}${w.allies.length ? `, with ${and(w.allies)}` : ""}`;
}

/** "A", "A and B", "A, B and C" */
export const and = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function Tide({ score, big = false }: { score: { date: string; value: number }[]; big?: boolean }) {
  if (score.length < 2) return null;
  const W = big ? 1200 : 600, H = big ? 260 : 56;
  const x = scaleLinear().domain([yearFrac(score[0].date), yearFrac(score[score.length - 1].date)]).range([big ? 50 : 0, W - (big ? 20 : 0)]);
  // Scale to the war's own swing, so a close war still reads; the ticks show the true values.
  const peak = Math.max(25, ...score.map((d) => Math.abs(d.value)));
  const lim = peak <= 25 ? 25 : peak <= 50 ? 50 : 100;
  const y = scaleLinear().domain([-lim, lim]).range([H - (big ? 26 : 2), big ? 12 : 2]);
  const above = area<{ date: string; value: number }>().x((d) => x(yearFrac(d.date))).y0(y(0)).y1((d) => y(Math.max(0, d.value))).curve(curveMonotoneX);
  const below = area<{ date: string; value: number }>().x((d) => x(yearFrac(d.date))).y0(y(0)).y1((d) => y(Math.min(0, d.value))).curve(curveMonotoneX);
  return (
    <svg className={`tide ${big ? "big" : ""}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
      aria-label={`War score from ${score[0].value} to ${score[score.length - 1].value}`}>
      <path d={above(score) ?? ""} className="ours" />
      <path d={below(score) ?? ""} className="theirs" />
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} className="zero" />
      {big && [-lim, -lim / 2, 0, lim / 2, lim].map((t) => <text key={t} x={40} y={y(t) + 4} textAnchor="end" className="tick">{t > 0 ? `+${t}` : t}</text>)}
      {big && score.map((d) => <circle key={d.date} cx={x(yearFrac(d.date))} cy={y(d.value)} r={4} className="pt"><title>{`${d.date}: ${d.value > 0 ? "+" : ""}${d.value}`}</title></circle>)}
    </svg>
  );
}
