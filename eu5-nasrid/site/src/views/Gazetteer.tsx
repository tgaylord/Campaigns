import { useState } from "react";
import { Link } from "react-router-dom";
import { places, latest, isHeld } from "../lib/data";
import MiniChart from "../components/MiniChart";
import { PageHead } from "../components/bits";
import "./gazetteer.css";

const FILTERS = [
  { id: "all", label: "Every place" },
  { id: "ours", label: "In Naṣrid hands" },
  { id: "lost", label: "Held once, lost" },
  { id: "never", label: "Never held" },
] as const;

export default function Gazetteer() {
  const [f, setF] = useState<(typeof FILTERS)[number]["id"]>("all");
  const now = latest?.date ?? "9999-12-31";
  const status = (p: (typeof places)[number]) => (isHeld(p, now) ? "ours" : p.held.length ? "lost" : "never");
  const shown = places.filter((p) => f === "all" || status(p) === f).sort((a, b) => a.name.localeCompare(b.name, "en"));

  return (
    <div className="page gazetteer-page">
      <PageHead title="The Gazetteer" ar="البلدان" lede="Every place the chronicle names, written as the court wrote it, with the name the game gives it and whether it is ours." />
      <MiniChart marks={places.map((p) => ({ place: p, tone: isHeld(p, now) ? "ours" as const : "theirs" as const, named: p.id === latest?.capital }))} height={420} minSpan={420} />

      <div className="filters ui" role="group" aria-label="Show places">
        {FILTERS.map((x) => (
          <button key={x.id} type="button" aria-pressed={f === x.id} onClick={() => setF(x.id)}>{x.label}</button>
        ))}
      </div>

      <ul className="tiles">
        {shown.map((p) => {
          const st = status(p);
          return (
            <li key={p.id} className={st}>
              <Link to={`/places/${p.id}`} data-kind="place" data-id={p.id}>
                <span className="ar">{p.nameArabic}</span>
                <span className="nm">{p.name}</span>
                <span className="game ui">{p.nameGame} in the game</span>
                <span className="st ui">{st === "ours" ? "Ours" : st === "lost" ? "Once ours" : "Never ours"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="muted">No places match.</p>}
    </div>
  );
}
