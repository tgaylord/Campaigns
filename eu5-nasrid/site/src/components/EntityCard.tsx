import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { personById, placeById, warById, eraById, year, hijri } from "../lib/data";

/**
 * One hover card for every reference to a person, place, war or era anywhere
 * on the page: links rendered from story Markdown and <EntityLink>s alike.
 * Also turns clicks on story links into in-app navigation.
 */
type Card = { x: number; y: number; kind: string; id: string };

function describe(kind: string, id: string) {
  if (kind === "person") {
    const p = personById.get(id);
    if (!p) return null;
    const life = p.born || p.died ? `${p.born ? year(p.born) : "?"}–${p.died ? year(p.died) : ""}` : "";
    const reign = p.reigns.map((r) => `reigned ${year(r.from)}–${r.to ? year(r.to) : ""}`).join(", ");
    return { ar: p.nameArabic, title: p.name, kind: p.roles.join(", ") || "Person", sub: [life, reign].filter(Boolean).join(" · ") };
  }
  if (kind === "place") {
    const p = placeById.get(id);
    if (!p) return null;
    return { ar: p.nameArabic, title: p.name, kind: `${p.nameGame} in the game`, sub: p.held.length ? "Held by the Naṣrids" : "Not in Naṣrid hands" };
  }
  if (kind === "war") {
    const w = warById.get(id);
    if (!w) return null;
    return { ar: undefined, title: w.name, kind: "War", sub: `${year(w.start)}–${w.end ? year(w.end) : ""}, against ${w.enemies.join(", ")}` };
  }
  if (kind === "era") {
    const e = eraById.get(id);
    if (!e) return null;
    return { ar: undefined, title: e.title, kind: "Era", sub: `${hijri(e.start).y}–${e.end ? hijri(e.end).y : ""} AH` };
  }
  return null;
}

export default function EntityCard() {
  const [card, setCard] = useState<Card | null>(null);
  const navigate = useNavigate();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    const over = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-kind][data-id]");
      if (!el) return setCard(null);
      setCard({ x: e.clientX, y: e.clientY, kind: el.dataset.kind!, id: el.dataset.id! });
    };
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a.entity[href]");
      if (!a || a.dataset.router === "1") return;
      const href = a.getAttribute("href")!;
      if (!href.startsWith(base)) return;
      e.preventDefault();
      setCard(null);
      navigate(href.slice(base.length) || "/");
    };
    document.addEventListener("mousemove", over);
    document.addEventListener("click", click);
    return () => { document.removeEventListener("mousemove", over); document.removeEventListener("click", click); };
  }, [navigate, base]);

  if (!card) return null;
  const d = describe(card.kind, card.id);
  if (!d) return null;
  const left = Math.min(card.x + 16, window.innerWidth - 300);
  const top = card.y + 20 + 160 > window.innerHeight ? card.y - 150 : card.y + 20;
  return (
    <div className="entity-card" style={{ left, top }} role="tooltip">
      <div className="kind">{d.kind}</div>
      {d.ar && <span className="ar">{d.ar}</span>}
      <div style={{ fontWeight: 700 }}>{d.title}</div>
      {d.sub && <div className="sub">{d.sub}</div>}
    </div>
  );
}
