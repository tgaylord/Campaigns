/*
 * The Folio: the apparatus around a leaf (round-two design study, "the Glossed Folio").
 *
 * - The left margin answers "who and where": each person, place, war, realm and court word is glossed
 *   beside the paragraph where it first appears on the leaf, as it stood on the leaf's own date, so the
 *   margin never tells what the page hasn't reached.
 * - The right margin answers "on what authority": the records the leaf draws on, each set beside the
 *   paragraph it best supports, with how we know it (a save, a screenshot, Trent's account, estimated).
 * - The running head gives the realm as the entry opens, and says plainly when the saves are silent.
 * - The foot keeps what couldn't be pinned to a paragraph, and the realm at the close.
 */
import { events, snapshots, personById, placeById, warById, countries, isHeld, hijri, type CampaignEvent, type Snapshot, type Person } from "./data";
import { reignAt, regnalYear, type Leaf } from "./codex";
import { TERMS, plainOf } from "./names";
import { HIJRI_MONTHS } from "./hijri";

export type Gloss =
  | { kind: "person"; id: string; p: Person; age: number | null; station: string | null; died: string | null; parent: string | null; unborn: boolean }
  | { kind: "place"; id: string; name: string; plain: string; arabic?: string; held: boolean | null; since: string | null }
  | { kind: "war"; id: string; name: string; start: string; ended: string | null; outcome: string | null }
  | { kind: "realm"; id: string; court: string; plain: string }
  | { kind: "term"; id: string; court: string; plain: string; gloss: string };
export type Record = { ev: CampaignEvent; how: Provenance[]; score: number };
export type Provenance = "save" | "screen" | "account" | "estimated" | "record";
export type Block = { html: string; n: number; glosses: Gloss[]; records: Record[] };
export type Folio = {
  blocks: Block[]; loose: Record[];
  opening: string; headSnap?: Snapshot; nextSnap?: Snapshot; closeSnap?: Snapshot;
  ageDays: number | null; silent: boolean; leans: { screen: number; account: number; save: number };
};

const plain = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'");
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const evById = new Map(events.map((e) => [e.id, e]));

/** How a record knows what it says, from its source line. */
export function provenance(source: string): Provenance[] {
  const s = source.toLowerCase(), out: Provenance[] = [];
  if (/\bsave\b|autosave|checkpoint|extracted/.test(s)) out.push("save");
  if (/screenshot|screen|tooltip/.test(s)) out.push("screen");
  if (/account|trent's|trent \(|\(trent\)|trent,/.test(s)) out.push("account");
  if (/estimat/.test(s)) out.push("estimated");
  return out.length ? out : ["record"];
}
export const PROV_WORD: { [k in Provenance]: string } = { save: "read from a save", screen: "seen on screen", account: "Trent's account", estimated: "estimated", record: "the record" };

/** The roles a person held on a date, from roles dated "(1405–1429)" or "(from 1396)"; undated roles are left out, since they may lie ahead. */
function stationAt(p: Person, date: string): string | null {
  const y = +date.slice(0, 4);
  const r = reignAt(date);
  if (r && r.person.id === p.id) return `on the throne, ${ordinal(regnalYear(date, r))} year`;
  for (const role of p.roles) {
    const m = /^(.*?)\s*\((?:from\s+)?(\d{4})(?:[–-](\d{4}))?\)\s*$/.exec(role);
    if (!m) continue;
    const from = +m[2], to = m[3] ? +m[3] : role.includes("from") ? 9999 : from;
    if (from <= y && y <= to) return m[1];
  }
  return null;
}
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as { [k: number]: string })[n % 10] ?? "th"}`;
const ageAt = (born: string, d: string) => { const [y, m, dd] = born.split("-").map(Number); const [Y, M, D] = d.split("-").map(Number); return Y - y - (M < m || (M === m && D < dd) ? 1 : 0); };

function glossFor(kind: string, id: string, date: string): Gloss | null {
  if (kind === "person") {
    const p = personById.get(id);
    if (!p) return null;
    const parentId = p.father ?? p.mother;
    const parent = parentId ? personById.get(parentId) : undefined;
    const unborn = !!p.born && p.born > date;
    return {
      kind, id, p, unborn,
      age: p.born && !unborn && !p.born.endsWith("-01-01") ? ageAt(p.born, date) : null,
      station: stationAt(p, date), died: p.died && p.died <= date ? p.died : null,
      parent: parent ? `${p.female ? "daughter" : "son"} of ${parent.name}` : null,
    };
  }
  if (kind === "place") {
    const p = placeById.get(id);
    if (!p) return null;
    const run = p.held.filter((h) => h.from <= date).pop();
    return { kind, id, name: p.name, plain: plainOf(p), arabic: p.nameArabic, held: p.held.length ? isHeld(p, date) : null, since: run && (run.to === null || run.to > date) ? run.from : null };
  }
  if (kind === "war") {
    const w = warById.get(id);
    if (!w) return null;
    const ended = w.end && w.end <= date ? w.end : null;
    return { kind, id, name: w.name, start: w.start, ended, outcome: ended ? w.outcome : null };
  }
  return null;
}

/* realms and court words that the text names without a link */
const realmWords = countries.flatMap((c) => [{ id: c.tag, court: c.nameChronicle, plain: c.name }, ...(c.renamed ?? []).map((r) => ({ id: `${c.tag}:${r.from}`, court: r.nameChronicle.replace(/^the /, ""), plain: r.name }))])
  .filter((r) => r.court && r.court !== r.plain && r.court.length > 3);
const wordRe = (w: string) => new RegExp(`(?<![\\p{L}\\p{M}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{M}])`, "u");
const realmRes = realmWords.map((r) => ({ ...r, re: wordRe(r.court) }));
const termRes = TERMS.filter((t) => t.court !== "Ṭāʾifa").map((t) => ({ ...t, re: wordRe(t.court) }));

/** Split a leaf's HTML into its top-level blocks (paragraphs, rubric lines, lists, quotations). */
const blocksOf = (html: string) => html.match(/<(p|ul|ol|blockquote|h\d)\b[^>]*>[\s\S]*?<\/\1>/g) ?? [html];

const cache = new Map<string, Folio>();
export function folioFor(leaf: Leaf): Folio {
  const hit = cache.get(leaf.id);
  if (hit) return hit;
  const date = leaf.entry.endDate ?? leaf.entry.date;
  const seen = new Set<string>();
  const blocks: Block[] = blocksOf(leaf.body).map((html, n) => {
    const glosses: Gloss[] = [];
    for (const m of html.matchAll(/data-kind="(person|place|war)" data-id="([^"]+)"/g)) {
      const key = `${m[1]}:${m[2]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const g = glossFor(m[1], m[2], date);
      if (g) glosses.push(g);
    }
    const text = plain(html);
    for (const r of realmRes) {
      const key = `realm:${r.court}`;
      if (seen.has(key) || !r.re.test(text)) continue;
      seen.add(key); glosses.push({ kind: "realm", id: r.id, court: r.court, plain: r.plain });
    }
    for (const t of termRes) {
      const key = `term:${t.plain}`;
      if (seen.has(key) || !t.re.test(text)) continue;
      seen.add(key); glosses.push({ kind: "term", id: t.court, court: t.court, plain: t.plain, gloss: t.gloss });
    }
    return { html, n, glosses, records: [] };
  });

  // the records, each beside the paragraph it best supports
  const srcEvents = leaf.entry.sources.map((s) => evById.get(s)).filter(Boolean) as CampaignEvent[];
  const loose: Record[] = [];
  const blockIds = blocks.map((b) => new Set([...b.html.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1])));
  const blockText = blocks.map((b) => plain(b.html).toLowerCase());
  for (const ev of srcEvents) {
    const h = hijri(ev.date);
    const dayMonth = `${h.d} ${HIJRI_MONTHS[h.m - 1]}`.toLowerCase();
    const month = HIJRI_MONTHS[h.m - 1].toLowerCase();
    const words = ev.title.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length > 5);
    let best = -1, bestScore = 0;
    blocks.forEach((_, i) => {
      let s = 0;
      for (const id of [...ev.people, ...ev.places, ...ev.wars]) if (blockIds[i].has(id)) s += 2;
      if (blockText[i].includes(dayMonth)) s += 4;
      else if (blockText[i].includes(month) && blockText[i].includes(String(h.y))) s += 2;
      s += words.filter((w) => blockText[i].includes(w)).length * 0.75;
      if (s > bestScore) { bestScore = s; best = i; }
    });
    const rec = { ev, how: provenance(ev.source), score: bestScore };
    if (best >= 0 && bestScore >= 3) blocks[best].records.push(rec); else loose.push(rec);
  }
  blocks.forEach((b) => b.records.sort((a, c) => a.ev.date.localeCompare(c.ev.date)));
  loose.sort((a, c) => a.ev.date.localeCompare(c.ev.date));

  // the realm as the entry opens: the last save at or before the earliest thing it tells
  const opening = [leaf.entry.date, ...srcEvents.map((e) => e.date)].sort()[0];
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const headSnap = [...sorted].reverse().find((s) => s.date <= opening) ?? sorted[0];
  const nextSnap = headSnap ? sorted[sorted.indexOf(headSnap) + 1] : undefined;
  const closeSnap = [...sorted].reverse().find((s) => s.date <= date);
  const ageDays = headSnap ? days(headSnap.date, opening) : null;
  const silent = !!headSnap && ageDays !== null && ageDays > 730;
  const allHow = srcEvents.map((e) => provenance(e.source));
  const leans = { screen: allHow.filter((x) => x.includes("screen")).length, account: allHow.filter((x) => x.includes("account") && !x.includes("save")).length, save: allHow.filter((x) => x.includes("save")).length };
  const f: Folio = { blocks, loose, opening, headSnap, nextSnap, closeSnap: closeSnap !== headSnap ? closeSnap : undefined, ageDays, silent, leans };
  cache.set(leaf.id, f);
  return f;
}

/** "on this very day", "2 months before", "6 years before" */
export function ageWords(d: number | null): string {
  if (d === null) return "";
  if (d <= 3) return "on this very day";
  if (d < 45) return `${d} days before`;
  if (d < 700) return `${Math.round(d / 30.4)} months before`;
  return `${Math.round(d / 365.25)} years before`;
}
