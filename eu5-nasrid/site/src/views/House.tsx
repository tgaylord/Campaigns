import { useMemo } from "react";
import { Link } from "react-router-dom";
import { hierarchy, tree } from "d3-hierarchy";
import { people, year, arabicDigits, hijri } from "../lib/data";
import type { Person } from "../lib/data";
import { PageHead, StarRule } from "../components/bits";
import "./house.css";

/** Long names shrink to stay inside the roundel. */
const arSize = (s?: string) => (!s ? 22 : s.length > 13 ? 14 : s.length > 9 ? 17 : 22);

type Node = { person: Person; children: Node[] };

export default function House() {
  const family = people.filter((p) => /^na[sṣ]r/i.test(p.dynasty ?? ""));
  const ids = new Set(family.map((p) => p.id));
  const roots = family.filter((p) => !p.father || !ids.has(p.father));
  const build = (p: Person): Node => ({ person: p, children: family.filter((c) => c.father === p.id).sort((a, b) => (a.born ?? "").localeCompare(b.born ?? "")).map(build) });
  const others = people.filter((p) => !ids.has(p.id));
  // Wives and mothers who married into the house, then everyone else in its service.
  const mothers = others.filter((p) => people.some((c) => c.mother === p.id));
  const servants = others.filter((p) => !mothers.includes(p));

  const layout = useMemo(() => {
    if (!roots.length) return null;
    const rootNode: Node = roots.length === 1 ? build(roots[0]) : { person: { id: "_", name: "", roles: [], reigns: [], female: false, traits: [], sample: false } as unknown as Person, children: roots.map(build) };
    const h = hierarchy(rootNode, (d) => d.children);
    const dx = 220, dy = 250;
    tree<Node>().nodeSize([dx, dy])(h);
    let x0 = Infinity, x1 = -Infinity, y1 = 0;
    h.each((n) => { x0 = Math.min(x0, n.x!); x1 = Math.max(x1, n.x!); y1 = Math.max(y1, n.y!); });
    return { h, x0, x1, y1, skipRoot: roots.length !== 1 };
  }, [roots.length]);

  return (
    <div className="page house-page">
      <PageHead
        title="The House of Naṣr"
        ar="بنو نصر"
        lede="The dynasty as the court's genealogists would have drawn it: father to son, the sultans in gold with their years of rule."
      />

      {layout ? (
        <div className="roll-tree folio">
          <svg width={layout.x1 - layout.x0 + 260} viewBox={`${layout.x0 - 130} ${layout.skipRoot ? 60 : -90} ${layout.x1 - layout.x0 + 260} ${layout.y1 + (layout.skipRoot ? 140 : 290)}`} role="img" aria-label="Family tree of the Naṣrid house">
            {layout.h.links().filter((l) => !(layout.skipRoot && l.source.depth === 0)).map((l, k) => (
              <path key={k} className="branch"
                d={`M${l.source.x},${l.source.y! + 118} C${l.source.x},${(l.source.y! + l.target.y!) / 2 + 40} ${l.target.x},${(l.source.y! + l.target.y!) / 2 + 10} ${l.target.x},${l.target.y! - 78}`} />
            ))}
            {layout.h.descendants().filter((n) => !(layout.skipRoot && n.depth === 0)).map((n) => {
              const p = n.data.person;
              const ruled = p.reigns.length > 0;
              return (
                <Link key={p.id} to={`/people/${p.id}`} data-kind="person" data-id={p.id} className={`member ${ruled ? "sultan" : ""}`}>
                  <g transform={`translate(${n.x},${n.y})`}>
                    <circle r={52} className="roundel" />
                    <circle r={45} className="inner" />
                    <text y={6} textAnchor="middle" className="ar" fontSize={arSize(p.nameArabic)}>{p.nameArabic ?? ""}</text>
                    <text y={74} textAnchor="middle" className="name">{p.name}</text>
                    <text y={92} textAnchor="middle" className="life">
                      {p.born ? year(p.born) : "?"}–{p.died ? year(p.died) : ""}
                    </text>
                    {ruled && <text y={108} textAnchor="middle" className="life ruled">ruled {p.reigns.map((r) => `${year(r.from)}–${r.to ? year(r.to) : ""}`).join(", ")}</text>}
                    {ruled && <text y={-60} textAnchor="middle" className="reign-ah">{p.reigns.map((r) => arabicDigits(hijri(r.from).y)).join("، ")}</text>}
                  </g>
                </Link>
              );
            })}
          </svg>
        </div>
      ) : <p className="muted">No members of the house recorded yet.</p>}

      {mothers.length > 0 && <>
        <StarRule />
        <h2 className="section-title">Mothers of the house</h2>
        <ul className="servants">
          {mothers.map((p) => (
            <li key={p.id}>
              <Link to={`/people/${p.id}`} data-kind="person" data-id={p.id} data-router="1" className="entity">
                {p.nameArabic && <span className="ar">{p.nameArabic}</span>}
                <span className="nm">{p.name}</span>
              </Link>
              <span className="roles ui">Mother of {people.filter((c) => c.mother === p.id).map((c) => c.name).join(", ")}</span>
            </li>
          ))}
        </ul>
      </>}
      {servants.length > 0 && <>
        <StarRule />
        <h2 className="section-title">Servants of the house</h2>
        <ul className="servants">
          {servants.map((p) => (
            <li key={p.id}>
              <Link to={`/people/${p.id}`} data-kind="person" data-id={p.id} data-router="1" className="entity">
                {p.nameArabic && <span className="ar">{p.nameArabic}</span>}
                <span className="nm">{p.name}</span>
              </Link>
              <span className="roles ui">{[p.roles.join(", "), p.born ? `born ${year(p.born)}` : "", p.died ? `died ${year(p.died)}` : ""].filter(Boolean).join(", ")}</span>
            </li>
          ))}
        </ul>
      </>}
    </div>
  );
}
