import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { hierarchy, tree } from "d3-hierarchy";
import { people, year, arabicDigits, hijri, latest, rulerAt } from "../lib/data";
import type { Person } from "../lib/data";
import { PageHead, StarRule } from "../components/bits";
import "./house.css";

/** "Muḥammad ibn Ismāʿīl ibn Saʿd" → "Muḥammad ibn Ismāʿīl": two names are enough under a roundel. */
const shortName = (n: string) => n.split(" ibn ").slice(0, 2).join(" ibn ").split(" bint ").slice(0, 2).join(" bint ");

/** Long names shrink to stay inside the roundel. */
const arSize = (s?: string) => (!s ? 22 : s.length > 13 ? 14 : s.length > 9 ? 17 : 22);

type Node = { person: Person; children: Node[] };

/** "ruler of the Ṭāʾifa of Burghush (from 1428)" → "Ṭāʾifa of Burghush" */
function taifaOf(p: Person): string | null {
  for (const r of p.roles) {
    const m = r.match(/Ṭāʾifa of [^,(]+/i);
    if (m) return m[0].trim();
    if (/ṭāʾifa/i.test(r)) return r.replace(/^(ruler|king|queen|heir|shaykha?) of /i, "").replace(/\s*\(.*\)/, "").trim();
  }
  return null;
}

export default function House() {
  const family = people.filter((p) => /^na[sṣ]r/i.test(p.dynasty ?? ""));
  const ids = new Set(family.map((p) => p.id));
  const byId = new Map(family.map((p) => [p.id, p]));
  const kids = (id: string) => family.filter((c) => c.father === id).sort((a, b) => (a.born ?? "").localeCompare(b.born ?? ""));
  const roots = family.filter((p) => !p.father || !ids.has(p.father));
  const others = people.filter((p) => !ids.has(p.id));
  // Wives and mothers who married into the house, then everyone else in its service.
  const mothers = others.filter((p) => people.some((c) => c.mother === p.id));
  const servants = others.filter((p) => !mothers.includes(p));

  const reigning = rulerAt(latest.date);
  const heir = latest.heir ? byId.get(latest.heir) : undefined;
  // The line from the founder down to the reigning sultan, drawn heavier.
  const line = new Set<string>();
  for (let p = reigning; p; p = p.father ? byId.get(p.father) : undefined) line.add(p.id);
  // The main line: every sultan, the heir, and their forefathers. Their children are drawn too (the main
  // branches); anyone further from the throne is folded into a cadet line, mentioned by name below.
  const main = new Set<string>();
  for (const s of [...family.filter((p) => p.reigns.length), ...(heir ? [heir] : [])])
    for (let p: Person | undefined = s; p && !main.has(p.id); p = p.father ? byId.get(p.father) : undefined) main.add(p.id);
  const descendants = (id: string): Person[] => kids(id).flatMap((c) => [c, ...descendants(c.id)]);
  type Cadet = { head: Person; members: Person[]; taifas: string[] };
  const cadets: Cadet[] = [];
  const build = (p: Person): Node => ({
    person: p,
    children: main.has(p.id) ? kids(p.id).map((c) => {
      if (main.has(c.id)) return build(c);
      const members = descendants(c.id);
      if (members.length) cadets.push({ head: c, members, taifas: [...new Set([c, ...members].map(taifaOf).filter(Boolean) as string[])] });
      return { person: c, children: [] };
    }) : [],
  });
  const box = useRef<HTMLDivElement>(null);

  const layout = useMemo(() => {
    if (!roots.length) return null;
    cadets.length = 0;
    const mainRoots = roots.filter((r) => main.has(r.id));
    const rs = mainRoots.length ? mainRoots : roots;
    const rootNode: Node = rs.length === 1 ? build(rs[0]) : { person: { id: "_", name: "", roles: [], reigns: [], female: false, traits: [], sample: false } as unknown as Person, children: rs.map(build) };
    const h = hierarchy(rootNode, (d) => d.children);
    const dx = 168, dy = 215;
    tree<Node>().nodeSize([dx, dy]).separation((a, b) => (a.parent === b.parent ? 1 : 1.25))(h);
    let x0 = Infinity, x1 = -Infinity, y1 = 0;
    h.each((n) => { x0 = Math.min(x0, n.x!); x1 = Math.max(x1, n.x!); y1 = Math.max(y1, n.y!); });
    return { h, x0, x1, y1, skipRoot: rs.length !== 1, cadets: [...cadets] };
  }, [roots.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const cadetOf = new Map((layout?.cadets ?? []).map((c) => [c.head.id, c]));
  const shown = layout ? layout.h.descendants().length - (layout.skipRoot ? 1 : 0) : 0;

  // The tree is wider than the page: open it on the line from the founder to the reigning sultan,
  // centred between them, so the roll never opens on empty parchment above a sultan off to one side.
  useEffect(() => {
    const el = box.current;
    const nodes = el ? [...el.querySelectorAll<SVGGElement>(".member.in-line g")] : [];
    if (!el || !nodes.length) return;
    const xs = nodes.map((n) => { const r = n.getBoundingClientRect(); return r.left + r.width / 2; });
    const b = el.getBoundingClientRect();
    el.scrollLeft += (Math.min(...xs) + Math.max(...xs)) / 2 - (b.left + b.width / 2);
  }, [layout]);

  return (
    <div className="page house-page">
      <PageHead
        title="The House of Naṣr"
        ar="بنو نصر"
        lede={<>The dynasty as the court's genealogists would have drawn it: the sultans in gold with their years of rule, their forefathers and their children. {family.length} Naṣrids are recorded; {shown} are drawn here, and the {layout?.cadets.length ?? 0} cadet lines, several of them ruling ṭāʾifas, are named below the roll.</>}
      />

      {layout ? (
        <>
        <div className="roll-tree folio" ref={box} tabIndex={0} aria-label="Family tree; scroll sideways to see the whole house">
          <svg width={layout.x1 - layout.x0 + 260} viewBox={`${layout.x0 - 130} ${layout.skipRoot ? 60 : -90} ${layout.x1 - layout.x0 + 260} ${layout.y1 + (layout.skipRoot ? 140 : 290)}`} role="img" aria-label="Family tree of the Naṣrid house">
            {layout.h.links().filter((l) => !(layout.skipRoot && l.source.depth === 0)).map((l, k) => (
              <path key={k} className={`branch ${line.has(l.target.data.person.id) ? "line" : ""}`}
                d={`M${l.source.x},${l.source.y! + 118} C${l.source.x},${(l.source.y! + l.target.y!) / 2 + 40} ${l.target.x},${(l.source.y! + l.target.y!) / 2 + 10} ${l.target.x},${l.target.y! - 78}`} />
            ))}
            {layout.h.descendants().filter((n) => !(layout.skipRoot && n.depth === 0)).map((n) => {
              const p = n.data.person;
              const ruled = p.reigns.length > 0;
              const cad = cadetOf.get(p.id);
              const tf = taifaOf(p);
              const R = ruled ? 52 : 40;
              return (
                <Link key={p.id} to={`/people/${p.id}`} data-kind="person" data-id={p.id} className={`member ${ruled ? "sultan" : ""} ${p.id === reigning?.id ? "reigning" : ""} ${line.has(p.id) ? "in-line" : ""} ${main.has(p.id) ? "main" : "branch-member"}`}>
                  <g transform={`translate(${n.x},${n.y})`}>
                    <circle r={R} className="roundel" />
                    <circle r={R - 7} className="inner" />
                    <text y={6} textAnchor="middle" className="ar" fontSize={Math.min(arSize(p.nameArabic), ruled ? 22 : 16)}>{p.nameArabic ?? ""}</text>
                    <text y={R + 22} textAnchor="middle" className="name">{main.has(p.id) ? shortName(p.name) : p.name.split(/ (?:ibn|bint) /)[0]}</text>
                    <text y={R + 40} textAnchor="middle" className="life">
                      {p.born ? year(p.born) : "?"}–{p.died ? year(p.died) : ""}
                    </text>
                    {!ruled && (tf || cad) && <text y={R + 56} textAnchor="middle" className="cadet">{[tf, cad ? `line of ${cad.members.length + 1}` : null].filter(Boolean).join(", ")}</text>}
                    {ruled && <text y={R + 56} textAnchor="middle" className="life ruled">ruled {p.reigns.map((r) => `${year(r.from)}–${r.to ? year(r.to) : ""}`).join(", ")}</text>}
                    {ruled && <text y={-60} textAnchor="middle" className="reign-ah">{p.reigns.map((r) => arabicDigits(hijri(r.from).y)).join("، ")}</text>}
                  </g>
                </Link>
              );
            })}
          </svg>
        </div>
        {layout.x1 - layout.x0 + 260 > 900 && <p className="tree-hint ui muted">The house is wider than the page: scroll the roll sideways to see every branch. The heavier line runs from the founder to {reigning?.name ?? "the reigning sultan"}.</p>}
        </>
      ) : <p className="muted">No members of the house recorded yet.</p>}

      {layout && layout.cadets.length > 0 && <>
        <StarRule />
        <h2 className="section-title">The cadet lines</h2>
        <p className="muted cadet-lede">Branches of the house beyond the sultans' children, by the son or daughter they descend from{layout.cadets.some((c) => c.taifas.length) ? ", with the ṭāʾifas their members have ruled" : ""}.</p>
        <ul className="cadets">
          {layout.cadets.map((c) => (
            <li key={c.head.id}>
              <div className="cadet-head">
                <Link to={`/people/${c.head.id}`} data-kind="person" data-id={c.head.id} data-router="1" className="entity">{c.head.name}</Link>
                {c.head.father && byId.get(c.head.father) && <span className="ui muted"> child of {byId.get(c.head.father)!.name}</span>}
              </div>
              {c.taifas.length > 0 && <div className="cadet-taifas">{c.taifas.join(" and ")}</div>}
              <div className="cadet-members ui">
                {c.members.map((m, k) => (
                  <span key={m.id}>{k ? ", " : ""}<Link to={`/people/${m.id}`} data-kind="person" data-id={m.id} data-router="1" className="entity">{shortName(m.name)}</Link>{taifaOf(m) ? ` (${taifaOf(m)})` : ""}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </>}

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
