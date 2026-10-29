/**
 * Builds the site's data from the campaign folder.
 *
 *   ../story/*.md            story log (chronicle entries and OOC notes)
 *   ../data/eras.json        eras
 *   ../data/snapshots/*.json one per checkpoint
 *   ../data/events/*.json    event log (each file an array)
 *   ../data/people.json      characters
 *   ../data/gazetteer.json   places
 *   ../data/wars.json        wars
 *   ../data/countries.json   countries the views name and colour
 *   ../data/map/*.json       location shapes traced from the game's map (tools/build_map.py)
 *   ../data/extracted/*.json facts pulled from each checkpoint save (tools/extract_checkpoint.py)
 *
 * Validates every record, checks every cross-reference, renders the story's
 * Markdown, and writes src/generated/campaign.json and src/generated/map.json
 * (the game map plus who owned each location at each checkpoint).
 * Any error stops the build.
 */
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

const here = path.dirname(fileURLToPath(import.meta.url));
const CAMPAIGN = path.resolve(here, "../..");
const OUT = path.resolve(here, "../src/generated");
/** Must match `base` in vite.config.ts. */
const BASE = "/Campaigns/eu5-nasrid";

/* ------------------------------------------------------------ schemas */

const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{3,4}-\d{2}-\d{2}$/, "dates are YYYY-MM-DD game dates"),
);
const id = z.string().regex(/^[a-z0-9-]+$/, "ids are lowercase-with-dashes");
const sample = z.boolean().default(false);

const Era = z.object({ id, title: z.string(), start: isoDate, end: isoDate.nullable(), summary: z.string().optional(), sample });

const Person = z.object({
  id,
  name: z.string(),
  nameArabic: z.string().optional(),
  nameGame: z.string().optional(),
  dynasty: z.string().optional(),
  born: isoDate.optional(),
  died: isoDate.optional(),
  father: id.optional(),
  mother: id.optional(),
  roles: z.array(z.string()).default([]),
  reigns: z.array(z.object({ from: isoDate, to: isoDate.nullable() })).default([]),
  female: z.boolean().default(false),
  /** the character's id in the save */
  gameId: z.number().optional(),
  stats: z.object({ adm: z.number(), dip: z.number(), mil: z.number() }).optional(),
  traits: z.array(z.string()).default([]),
  note: z.string().optional(),
  sample,
});

const Place = z.object({
  id,
  name: z.string(),
  nameArabic: z.string().optional(),
  nameGame: z.string(),
  kind: z.enum(["location", "province", "area", "region"]),
  /** the game's location key, e.g. "granada"; places it on the map */
  key: z.string(),
  /** named on the wider views of the Atlas; the rest only close up */
  major: z.boolean().default(false),
  /** periods in Naṣrid hands; `via` is the tag of the subject that held it for Granada */
  held: z.array(z.object({ from: isoDate, to: isoDate.nullable(), via: z.string().optional() })).default([]),
  note: z.string().optional(),
  sample,
});

const War = z.object({
  id,
  name: z.string(),
  start: isoDate,
  end: isoDate.nullable(),
  goal: z.string(),
  allies: z.array(z.string()).default([]),
  enemies: z.array(z.string()),
  outcome: z.string().nullable(),
  score: z.array(z.object({ date: isoDate, value: z.number() })).default([]),
  /** belligerent: Granada fights in it; potential: Granada stands outside it but can be called in */
  involvement: z.enum(["belligerent", "potential"]).default("belligerent"),
  /** when Granada was in the war, if not the whole of it */
  joined: z.object({ from: isoDate, to: isoDate.nullable() }).optional(),
  /** both sides as the game lists them, for wars Granada did not lead */
  sides: z.object({ attackers: z.array(z.string()), defenders: z.array(z.string()) }).optional(),
  gameName: z.string().optional(),
  note: z.string().optional(),
  sample,
});

const Country = z.object({
  tag: z.string().regex(/^[A-Z][A-Z0-9]{2,5}$/), name: z.string(), nameChronicle: z.string(), nameArabic: z.string().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});

/** power is the estate's share of power (%); the save doesn't store it, so it comes from Trent's estates screen or stays null */
/** estimated: power comes from tools/estate_power.py, not from Trent's screen */
const Estate = z.object({ id, name: z.string(), power: z.number().nullable(), satisfaction: z.number().nullable(), estimated: z.boolean().default(false) });

const Snapshot = z.object({
  date: isoDate,
  checkpoint: z.string(),
  note: z.string().optional(),
  ruler: id,
  heir: id.nullable().default(null),
  regent: id.nullable().default(null),
  capital: id,
  rank: z.string(),
  locations: z.number(),
  overlord: z.object({ country: z.string(), type: z.string() }).nullable(),
  subjects: z.array(z.object({ country: z.string(), type: z.string(),
    /** 0–100; below 50 the subject is disloyal. Not in the save: read off the game by Trent. */
    loyalty: z.object({ value: z.number().nullable(), status: z.enum(["loyal", "disloyal"]).optional(), trend: z.string().optional(), source: z.string() }).optional() })).default([]),
  allies: z.array(z.string()).default([]),
  rivals: z.array(z.string()).default([]),
  cabinet: z.array(z.object({ person: id, role: z.string() })).default([]),
  crownPower: z.number().optional(),
  politicalInfluence: z.number().optional(),
  population: z.object({
    total: z.number(),
    cultures: z.record(z.string(), z.number()),
    religions: z.record(z.string(), z.number()),
  }),
  /** empty, and economy/military null, until a checkpoint the game has ticked through records them */
  estates: z.array(Estate).default([]),
  economy: z.object({ treasury: z.number(), income: z.number(), expenses: z.number(), debt: z.number().default(0) }).nullable().default(null),
  military: z.object({ manpower: z.number(), maxManpower: z.number(), regiments: z.number(), ships: z.number() }).nullable().default(null),
  /** armies in the field at the checkpoint (not yet named armies; see SYSTEMS.md §5) */
  armies: z.array(z.object({ leader: id.optional(), men: z.number(), at: z.string(), makeup: z.string(), source: z.string().default("save") })).default([]),
  stability: z.number().optional(),
  prestige: z.number().optional(),
  source: z.object({ save: z.string(), gameVersion: z.string(), extracted: z.string() }).optional(),
  government: z.object({
    type: z.string(), heirSelection: z.string(),
    laws: z.array(z.object({ slot: z.string(), law: z.string() })), reforms: z.array(z.string()), privileges: z.array(z.string()),
    culture: z.string(), tolerated: z.array(z.string()), religion: z.string(),
    /** −100 (left pole) to +100 (right pole); values the country doesn't have are left out */
    societalValues: z.record(z.string(), z.number()).default({}),
    parliament: z.object({ type: z.string(), lastCalled: isoDate.nullable(), agenda: z.array(z.object({ estate: z.string(), type: z.string() })) }).nullable().default(null),
    privilegeDates: z.record(z.string(), isoDate).default({}),
  }).optional(),
  wars: z.array(id).default([]),
  strait: z.object({
    active: z.boolean(), influence: z.number(), sovereignty: z.number(), yearsSubject: z.number(),
    /** locations of the Granada, Andalusia and Murcia areas held by Granada or its subjects, of all of them */
    areas: z.object({ held: z.number(), total: z.number() }).optional(),
  }).nullable(),
  goldenCentury: z.object({ european: z.number(), colonial: z.number(), flashpoint: z.number() }).nullable().default(null),
  sample,
});

const EVENT_TYPES = [
  "war_declared", "war_joined", "battle", "siege", "peace", "ruler_change", "birth", "death", "marriage",
  "estate_change", "law_change", "reform", "territory_change", "strait_change", "gc_change",
  "situation", "formable", "appointment", "diplomacy", "player_note",
];
const Event = z.object({
  id,
  date: isoDate,
  type: z.enum(EVENT_TYPES),
  title: z.string(),
  people: z.array(id).default([]),
  places: z.array(id).default([]),
  wars: z.array(id).default([]),
  data: z.record(z.string(), z.unknown()).default({}),
  source: z.string(),
  sample,
});

const StoryFront = z.object({
  title: z.string(),
  date: isoDate,
  endDate: isoDate.optional(),
  era: id,
  kind: z.enum(["chronicle", "ooc"]).default("chronicle"),
  /** for an OOC note: the chronicle entry it glosses (default: the nearest earlier one) */
  about: id.optional(),
  people: z.array(id).default([]),
  places: z.array(id).default([]),
  wars: z.array(id).default([]),
  sources: z.array(z.string()).default([]),
  sample,
});

/* ------------------------------------------------------------ helpers */

const errors = [];
function check(schema, value, where) {
  const r = schema.safeParse(value);
  if (!r.success) {
    for (const issue of r.error.issues) errors.push(`${where}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    return null;
  }
  return r.data;
}
async function readJson(p) { return JSON.parse(await readFile(p, "utf8")); }
async function listJson(dir) {
  try { return (await readdir(dir)).filter((f) => f.endsWith(".json")).sort(); } catch { return []; }
}

/** [Yūsuf](person:yusuf-i) → <a class="entity" data-kind="person" data-id="yusuf-i" href="…">Yūsuf</a> */
const KIND_ROUTE = { person: "people", place: "places", war: "wars", era: "chronicle" };
function entityLinks(refs) {
  return () => (tree) => {
    visit(tree, "link", (node) => {
      const m = /^(person|place|war|era):([a-z0-9-]+)$/.exec(node.url);
      if (!m) return;
      const [, kind, ref] = m;
      refs.push({ kind, ref });
      node.url = kind === "era" ? `${BASE}/chronicle#era-${ref}` : `${BASE}/${KIND_ROUTE[kind]}/${ref}`;
      node.data = { hProperties: { className: ["entity"], "data-kind": kind, "data-id": ref } };
    });
  };
}

/* ------------------------------------------------------------ load */

const eras = (await readJson(path.join(CAMPAIGN, "data/eras.json"))).map((e, i) => check(Era, e, `eras.json[${i}]`)).filter(Boolean);
const people = (await readJson(path.join(CAMPAIGN, "data/people.json"))).map((e, i) => check(Person, e, `people.json[${i}]`)).filter(Boolean);
const places = (await readJson(path.join(CAMPAIGN, "data/gazetteer.json"))).map((e, i) => check(Place, e, `gazetteer.json[${i}]`)).filter(Boolean);
const wars = (await readJson(path.join(CAMPAIGN, "data/wars.json"))).map((e, i) => check(War, e, `wars.json[${i}]`)).filter(Boolean);
// What each privilege, law, reform, societal value and agenda does (tools/government_catalog.py).
const Mod = z.object({ key: z.string(), label: z.string(), value: z.union([z.number(), z.string()]), text: z.string(), percent: z.boolean(), good: z.boolean(), size: z.string().optional() });
const CatEntry = z.object({
  name: z.string(), desc: z.string().nullable().optional(), modifiers: z.array(Mod), power: z.record(z.string(), z.number()),
  satisfaction: z.record(z.string(), z.number()), estate: z.string().optional(), revoke: z.string().nullable().optional(),
  years: z.number().nullable().optional(), favouredBy: z.array(z.string()).optional(), nameIsOurs: z.boolean().optional(),
});
const Catalog = z.object({
  gameVersion: z.string(),
  privileges: z.record(z.string(), CatEntry), reforms: z.record(z.string(), CatEntry),
  laws: z.record(z.string(), z.object({ name: z.string(), category: z.string().nullable(), options: z.record(z.string(), CatEntry) })),
  societalValues: z.record(z.string(), z.object({ name: z.string(), left: z.string(), right: z.string(), leftModifiers: z.array(Mod), rightModifiers: z.array(Mod) })),
  agendas: z.record(z.string(), z.object({ name: z.string(), desc: z.string().nullable(), estate: z.string(), moves: z.array(z.object({ value: z.string().nullable(), direction: z.string() })) })),
  parliaments: z.record(z.string(), z.object({ name: z.string(), desc: z.string().nullable(), nameIsOurs: z.boolean().optional() })),
});
const catalog = check(Catalog, await readJson(path.join(CAMPAIGN, "data/government-catalog.json")), "government-catalog.json");
const countries = (await readJson(path.join(CAMPAIGN, "data/countries.json"))).map((e, i) => check(Country, e, `countries.json[${i}]`)).filter(Boolean);

const snapshots = [];
for (const f of await listJson(path.join(CAMPAIGN, "data/snapshots"))) {
  const s = check(Snapshot, await readJson(path.join(CAMPAIGN, "data/snapshots", f)), `snapshots/${f}`);
  if (s) snapshots.push({ id: f.replace(/\.json$/, ""), ...s });
}
snapshots.sort((a, b) => a.date.localeCompare(b.date));

const events = [];
for (const f of await listJson(path.join(CAMPAIGN, "data/events"))) {
  (await readJson(path.join(CAMPAIGN, "data/events", f))).forEach((e, i) => {
    const v = check(Event, e, `events/${f}[${i}]`);
    if (v) events.push(v);
  });
}
events.sort((a, b) => a.date.localeCompare(b.date));

const story = [];
let storyFiles = [];
try { storyFiles = (await readdir(path.join(CAMPAIGN, "story"))).filter((f) => f.endsWith(".md")).sort(); } catch {}
for (const f of storyFiles) {
  const raw = await readFile(path.join(CAMPAIGN, "story", f), "utf8");
  const { data, content } = matter(raw);
  const front = check(StoryFront, data, `story/${f}`);
  if (!front) continue;
  const refs = [];
  const html = String(
    await unified().use(remarkParse).use(entityLinks(refs)).use(remarkRehype).use(rehypeStringify).process(content),
  );
  story.push({ id: f.replace(/\.md$/, ""), ...front, html, refs });
}
story.sort((a, b) => a.date.localeCompare(b.date));

/* ------------------------------------------------------------ cross-references */

const ids = {
  era: new Set(eras.map((e) => e.id)),
  person: new Set(people.map((p) => p.id)),
  place: new Set(places.map((p) => p.id)),
  war: new Set(wars.map((w) => w.id)),
  story: new Set(story.map((s) => s.id)),
};
function ref(kind, value, where) {
  if (value != null && !ids[kind].has(value)) errors.push(`${where}: unknown ${kind} "${value}"`);
}
for (const p of people) { ref("person", p.father, `people ${p.id}.father`); ref("person", p.mother, `people ${p.id}.mother`); }
for (const s of snapshots) {
  const w = `snapshots/${s.id}`;
  ["ruler", "heir", "regent"].forEach((k) => ref("person", s[k], `${w}.${k}`));
  ref("place", s.capital, `${w}.capital`);
  s.cabinet.forEach((c) => ref("person", c.person, `${w}.cabinet`));
  s.armies.forEach((a) => ref("person", a.leader, `${w}.armies`));
  s.wars.forEach((x) => ref("war", x, `${w}.wars`));
}
for (const e of events) {
  e.people.forEach((x) => ref("person", x, `event ${e.id}`));
  e.places.forEach((x) => ref("place", x, `event ${e.id}`));
  e.wars.forEach((x) => ref("war", x, `event ${e.id}`));
}
for (const s of story) {
  const w = `story/${s.id}`;
  ref("era", s.era, `${w}.era`);
  if (s.about) ref("story", s.about, `${w}.about`);
  s.people.forEach((x) => ref("person", x, w));
  s.places.forEach((x) => ref("place", x, w));
  s.wars.forEach((x) => ref("war", x, w));
  s.refs.forEach((r) => ref(r.kind, r.ref, `${w} (link in text)`));
  s.sources.forEach((x) => {
    if (x !== "player" && !events.some((e) => e.id === x) && !snapshots.some((n) => n.id === x)) errors.push(`${w}.sources: unknown event or checkpoint "${x}"`);
  });
}
const dupes = (arr, what) => {
  const seen = new Set();
  for (const x of arr) { if (seen.has(x.id)) errors.push(`duplicate ${what} id "${x.id}"`); seen.add(x.id); }
};
dupes(people, "person"); dupes(places, "place"); dupes(wars, "war"); dupes(events, "event"); dupes(eras, "era");

if (errors.length) {
  console.error(`\nCampaign data has ${errors.length} problem(s):\n  - ${errors.join("\n  - ")}\n`);
  process.exit(1);
}

/* ------------------------------------------------------------ derived */

// OOC notes attach to a chronicle entry as marginal glosses.
const chronicle = story.filter((s) => s.kind === "chronicle");
for (const note of story.filter((s) => s.kind === "ooc")) {
  const target = note.about ?? [...chronicle].reverse().find((c) => c.date <= note.date)?.id ?? chronicle[0]?.id ?? null;
  note.about = target;
}

const sampleData = [eras, people, places, wars, snapshots, events, story].some((list) => list.some((x) => x.sample));

/* ------------------------------------------------------------ map */

// One traced map for now (the Strait theatre); more frames can sit beside it later.
const MAP_FILE = path.join(CAMPAIGN, "data/map/strait-region.json");
const gameMap = await readJson(MAP_FILE);
const inFrame = new Set(Object.keys(gameMap.locations));
for (const p of places) {
  const loc = gameMap.locations[p.key];
  if (!loc) { errors.push(`gazetteer ${p.id}: location "${p.key}" is not on the map`); continue; }
  p.x = loc.c[0]; p.y = loc.c[1];
}
// Who owned each location at each checkpoint, from the extracted facts, and how each of
// Granada's own locations stood: people, faith, control, integration, tax and buildings.
const owners = {};
const lands = {};
const subjectLands = {};
function iso(d) { return d ? d.split(".").map((x, i) => (i ? x.padStart(2, "0") : x)).join("-") : null; }
for (const s of snapshots) {
  if (!s.source?.extracted) continue;
  const ex = await readJson(path.join(CAMPAIGN, "data", s.source.extracted));
  const o = {};
  for (const [k, tag] of Object.entries(ex.world_owners ?? {})) if (inFrame.has(k)) o[k] = tag;
  owners[s.id] = o;
  lands[s.id] = landRows(ex.realm?.locations);
  // Granada's subjects at this checkpoint, with their own lands.
  subjectLands[s.id] = Object.fromEntries(Object.entries(ex.subjects ?? {}).map(([tag, sj]) => [tag, {
    type: sj.type, since: iso(sj.since), rank: sj.rank?.replace(/^rank_/, "") ?? null,
    culture: sj.primary_culture ?? null, religion: sj.primary_religion ?? null, capital: sj.capital ?? null,
    ruler: sj.ruler ? (people.find((p) => p.gameId === sj.ruler.id)?.id ?? null) : null,
    population: Math.round((sj.population_k ?? 0) * 1000),
    lands: landRows(sj.locations),
  }]));
}
function landRows(locs) {
  return Object.entries(locs ?? {}).map(([key, v]) => ({
    key, province: v.province ?? null, area: gameMap.locations[key]?.area ?? null, region: gameMap.locations[key]?.region ?? null,
    rank: v.rank ?? null, controller: v.controller ?? null, culture: v.culture ?? null, religion: v.religion ?? null,
    population: Math.round((v.population_k ?? 0) * 1000),
    cultures: Object.fromEntries(Object.entries(v.cultures_k ?? {}).map(([c, n]) => [c, Math.round(n * 1000)])),
    religions: Object.fromEntries(Object.entries(v.religions_k ?? {}).map(([c, n]) => [c, Math.round(n * 1000)])),
    popTypes: Object.fromEntries(Object.entries(v.pop_types_k ?? {}).map(([c, n]) => [c, Math.round(n * 1000)])),
    control: v.control ?? null, development: v.development ?? null, prosperity: v.prosperity ?? null,
    culturalUnity: v.cultural_unity ?? null, religiousUnity: v.religious_unity ?? null,
    goods: v.raw_material ?? null, tax: v.tax ?? null, possibleTax: v.possible_tax ?? null, estateTax: v.estate_tax ?? {},
    core: v.core ?? null, coreOfOverlord: v.core_of_overlord ?? null, integration: v.integration ?? null, since: iso(v.last_owner_change), buildings: v.buildings ?? [],
  }));
}
const names = await readJson(path.join(CAMPAIGN, "data/map/names.json"));
// Realm outlines per checkpoint (tools/build_map.py --owners).
const realms = {};
for (const s of snapshots) {
  try { realms[s.id] = await readJson(path.join(CAMPAIGN, `data/map/realms-${s.id}.json`)); }
  catch { errors.push(`snapshots/${s.id}: no data/map/realms-${s.id}.json (run tools/build_map.py --owners)`); }
}
for (const c of countries) if (![...Object.values(owners)].some((o) => Object.values(o).includes(c.tag))) {
  // a country no checkpoint shows on the map is harmless, but say so
  console.warn(`note: country ${c.tag} owns nothing on the map at any checkpoint`);
}
if (errors.length) {
  console.error(`\nCampaign data has ${errors.length} problem(s):\n  - ${errors.join("\n  - ")}\n`);
  process.exit(1);
}
// Sea zones aren't drawn one by one; the sea is the ground the land sits on.
const drawn = Object.fromEntries(Object.entries(gameMap.locations).filter(([, l]) => l.kind !== "sea")
  .map(([k, l]) => [k, { kind: l.kind, d: l.d, c: l.c, province: l.province, area: l.area }]));
const mapOut = { frame: gameMap.frame, coast: gameMap.coast, locations: drawn, owners, realms,
  names: { locations: names.locations, provinces: names.provinces, areas: names.areas } };

/* ------------------------------------------------------------ write */

await mkdir(OUT, { recursive: true });
const campaign = { generated: new Date().toISOString(), sample: sampleData, eras, people, places, wars, countries, snapshots, events, story, catalog, lands, subjectLands };
await writeFile(path.join(OUT, "campaign.json"), JSON.stringify(campaign));
await writeFile(path.join(OUT, "map.json"), JSON.stringify(mapOut));
console.log(
  `campaign data: ${snapshots.length} checkpoints, ${events.length} events, ${story.length} story entries, ` +
  `${people.length} people, ${places.length} places, ${wars.length} wars${sampleData ? " (includes sample data)" : ""}; ` +
  `map: ${inFrame.size} locations, owners at ${Object.keys(owners).length} checkpoint(s)`,
);
