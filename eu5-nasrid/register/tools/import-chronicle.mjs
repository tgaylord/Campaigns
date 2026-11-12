#!/usr/bin/env node
/*
 * One-time import: reads the Chronicle's data (../data, ../story) and writes the Register's
 * campaign folder. After this, the campaign folder is the source and is edited by hand or by tools.
 *   node tools/import-chronicle.mjs
 */
import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(HERE, "..", "..");
const OUT = path.join(HERE, "..", "campaign");
const J = (p) => JSON.parse(fs.readFileSync(path.join(SRC, p), "utf8"));
const dump = (o) => yaml.dump(o, { lineWidth: 110, noRefs: true, quotingType: '"' });
const write = (p, o) => { fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true }); fs.writeFileSync(path.join(OUT, p), typeof o === "string" ? o : dump(o)); };
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && !v.length) && !(typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length)));

fs.rmSync(OUT, { recursive: true, force: true });

/* ---------------------------------------------------------------- cast */
const people = J("data/people.json");
const tierOf = new Map(people.map((p) => [p.id, p.tier]));
for (const p of people) {
  write(`cast/${p.id}.yaml`, clean({
    name: p.name, arabic: p.nameArabic, sex: p.female ? "f" : undefined, house: p.dynasty, tier: p.tier,
    born: p.born, died: p.died, father: p.father, mother: p.mother,
    reigns: p.reigns, roles: p.roles, traits: p.traits, stats: p.stats,
    drives: p.arc, ties: p.ties, stations: p.stations,
    note: p.note, game: clean({ id: p.gameId, name: p.nameGame }),
  }));
}

/* ---------------------------------------------------------------- places */
write("places.yaml", J("data/gazetteer.json").map((g) => clean({ id: g.id, name: g.name, plain: g.nameGame, arabic: g.nameArabic, kind: g.kind, major: g.major || undefined, held: g.held, game: g.key })));

/* ---------------------------------------------------------------- threads */
const wars = J("data/wars.json");
const STORY_THREADS = [
  { id: "house", title: "The House of Naṣr", state: "standing", premise: "Births, marriages, deaths and successions in the ruling house and its ṭāʾifa branches." },
  { id: "two-princes", title: "The two princes", state: "open", from: "1408-08-05", premise: "Ismāʿīl and Aḥmad, half-brothers bound since childhood: Ismāʿīl talks, allies and converts; Aḥmad builds. Aḥmad is expected to head Ismāʿīl's council when Ismāʿīl reigns." },
  { id: "towns", title: "The towns and the bridges", state: "open", premise: "Where the treasury goes: workshops, foundries, bridges, harbours, palaces and roads. In the present reign this is Aḥmad's work." },
  { id: "estates", title: "The Jamāʿa and the estates", state: "open", premise: "The crown's bargain with the umarāʾ, the ʿulamāʾ, the burghers, the dhimmī and, from 1448, the commons." },
  { id: "strait", title: "The Strait", state: "closed", premise: "The struggle for both shores of the Strait, settled with all 72 of its areas held." },
  { id: "europe", title: "Europe's answer", state: "open", premise: "Crusades, embargoes and envoys: how Christendom has treated a Muslim Iberia, from the crusade of 806 to 'We have arrived'." },
  { id: "voyages", title: "The voyages", state: "open", premise: "The islands, the African coast, the Cape and whatever lies beyond it." },
  { id: "umayyad-claim", title: "The borders of the Umayyads", state: "open", from: "1447-08-01", premise: "Since 1447 al-Andalus holds a claim to the old caliphate's borders. Outside Persia and Arabia, nearly all of that land belongs to its allies. The court has not said what the claim is for." },
  { id: "sicily", title: "Sicily", state: "open", from: "1450-09-28", premise: "Won in 1450 and kept under the crown with a governor at Palermo, for now. A ṭāʾifa is the alternative; Naples holds a claim across the strait of Messina." },
];
const RULES = [
  ["towns", (e) => e.type === "reform" && /bridge|town|foundr|gunsmith|paper|mill|palace|harbo|built|build|arsenal|armour|road|workshop|treasury/i.test(e.title) || /palace by the sea|sea-side palace/i.test(e.title)],
  ["estates", (e) => ["estate_change", "law_change"].includes(e.type) || /Jamāʿa/.test(e.title)],
  ["strait", (e) => e.type === "strait_change"],
  ["europe", (e) => /embargo|crusade|envoy|Angevin|excommunicat|Pope calls/i.test(e.title) && e.type !== "battle"],
  ["voyages", (e) => e.people.includes("abd-al-jalil-al-qubbasi") || /\bcape\b|voyage|explor|Fernando Po|Kongo|Canar|Madeira|Azores|New World|Cape Verde/i.test(e.title)],
  ["umayyad-claim", (e) => e.date >= "1447-08-01" && /Umayyad/i.test(e.title + JSON.stringify(e.data ?? {}))],
  ["sicily", (e) => e.date >= "1450-09-28" && /Sicily|Palermo|Athens/i.test(e.title) && !["battle", "reform"].includes(e.type)],
  ["two-princes", (e) => e.people.includes("ismail-ibn-muhammad-ibn-ismail") && e.people.includes("ahmad-ibn-muhammad-ibn-ismail")],
  ["house", (e) => ["birth", "death", "marriage", "ruler_change"].includes(e.type) && e.people.some((id) => people.find((p) => p.id === id)?.dynasty === "Naṣrid")],
];
write("threads.yaml", [
  ...STORY_THREADS.map((t) => ({ kind: "story", ...t })),
  ...wars.map((w) => clean({ id: w.id, kind: "war", title: w.name, state: w.end ? "closed" : "open", from: w.start, to: w.end, premise: w.goal, outcome: w.outcome,
    part: w.involvement === "belligerent" ? undefined : w.involvement, sides: w.sides ?? clean({ ours: w.allies, theirs: w.enemies }), note: w.note, game: w.gameName })),
]);

/* ---------------------------------------------------------------- beats */
const KIND = { war_declared: "war", war_joined: "war", battle: "battle", siege: "battle", peace: "peace", death: "death", birth: "birth", marriage: "marriage",
  ruler_change: "crown", appointment: "office", reform: "realm", law_change: "realm", estate_change: "realm", formable: "realm",
  territory_change: "land", strait_change: "land", diplomacy: "world", situation: "world", player_note: "note" };
const fromOf = (s) => { const out = []; if (/\b(auto)?saves?\b|checkpoint/i.test(s)) out.push("save"); if (/screen/i.test(s)) out.push("seen"); if (/account|direction|Trent:|Trent's (note|reading)/i.test(s)) out.push("told"); return out.length ? out : ["told"]; };
const events = fs.readdirSync(path.join(SRC, "data/events")).filter((f) => f.endsWith(".json")).flatMap((f) => J(`data/events/${f}`)).map((e) => ({ people: [], places: [], wars: [], title: "", ...e })).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
const important = (e) => {
  if (e.type === "battle") return Object.keys(e.data?.ours ?? {}).some((k) => /Andalus|Granada|Gharn/i.test(k)) || e.people.length > 0;
  if (["birth", "marriage"].includes(e.type)) return e.people.some((id) => tierOf.get(id) === "central");
  if (e.type === "appointment") return e.people.some((id) => tierOf.get(id));
  return true;
};
const battlePlaces = J("data/map/battle-places.json").places;
const MAP_ORIGIN = [5900, 1100]; // the world map's frame; battle places are stored in whole-map pixels
const beat = (e) => clean({
  at: battlePlaces[e.id] ? [Math.round(battlePlaces[e.id][1] - MAP_ORIGIN[0]), Math.round(battlePlaces[e.id][2] - MAP_ORIGIN[1])] : undefined,
  won: e.type === "battle" || e.type === "siege" ? (/defeat|disaster/i.test(e.data?.result ?? "") ? false : /victory|won|falls/i.test((e.data?.result ?? "") + e.title) ? true : undefined) : undefined,
  id: e.id, on: e.date, kind: KIND[e.type] ?? "note", what: e.title, minor: important(e) ? undefined : true,
  who: e.people, where: e.places, threads: [...(e.wars ?? []), ...RULES.filter(([, t]) => t(e)).map(([id]) => id)],
  from: fromOf(e.source ?? ""), cite: e.source, detail: e.data,
});

/* ---------------------------------------------------------------- tellings */
const front = (file) => { const raw = fs.readFileSync(path.join(SRC, "story", file), "utf8"); const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/); return { id: file.replace(/\.md$/, ""), ...yaml.load(m[1], { schema: yaml.JSON_SCHEMA }), body: m[2].trim() }; };
const story = fs.readdirSync(path.join(SRC, "story")).filter((f) => f.endsWith(".md")).map(front);
const ooc = story.filter((s) => s.kind === "ooc");
const eventIds = new Set(events.map((e) => e.id));
const tellings = story.filter((s) => s.kind !== "ooc").map((s) => clean({
  id: s.id, on: String(s.date), title: s.title, book: s.era, verse: s.verse, who: s.people, where: s.places,
  covers: (s.sources ?? []).map(String).filter((x) => eventIds.has(x)),
  text: s.body + "\n", behind: ooc.filter((o) => o.about === s.id).map((o) => o.body).join("\n\n") || undefined,
}));
const looseNotes = ooc.filter((o) => !o.about || !story.some((s) => s.id === o.about)).map((o) => ({ on: String(o.date), title: o.title, text: o.body + "\n" }));

/* ---------------------------------------------------------------- reckonings */
const tags = J("data/world/tags.json");
const tagOfName = new Map(Object.entries(tags).map(([t, v]) => [v.name, t]));
const snaps = fs.readdirSync(path.join(SRC, "data/snapshots")).filter((f) => f.endsWith(".json")).map((f) => J(`data/snapshots/${f}`)).sort((a, b) => a.date.localeCompare(b.date));
const QUESTIONS = {
  "1447-03-28": ["The treasury rose from 570 to 2,680 between February and March 1447. Income was about 70 a month net and there was no loan. Where did the gold come from?"],
  "1450-02-01": ["The treasury rose from 175 in August 1449 to 2,990 by February 1450, the same kind of jump as in 1447. What pays for these?"],
  "1451-12-21": ["Stability fell from 23.6 to 16.1 during 1451. Why?", "Two armouries and a grand palace are gone from the building count since November 1450. What happened to them?", "Sicily: a governor 'for now'. What would make the court raise a ṭāʾifa after all?"],
};
const top = (o, n) => Object.fromEntries(Object.entries(o ?? {}).sort((a, b) => b[1] - a[1]).slice(0, n));
let prev = "0000";
snaps.forEach((s, i) => {
  const last = i === snaps.length - 1;
  const inSpan = (d) => d > prev && (d <= s.date || last);
  let subjectTags = [];
  try { subjectTags = Object.keys(J(`data/extracted/${s.date}.json`).subjects ?? {}); } catch { /* early saves */ }
  write(`reckonings/${s.date}.yaml`, clean({
    date: s.date, title: s.checkpoint,
    source: clean({ save: s.source?.save, game: s.source?.gameVersion }),
    summary: s.note,
    realm: clean({ towns: s.locations, souls: s.population?.total, treasury: s.economy?.treasury, income: s.economy?.income, expenses: s.economy?.expenses, debt: s.economy?.debt || undefined,
      stability: s.stability, prestige: s.prestige, regiments: s.military?.regiments, ships: s.military?.ships, manpower: s.military?.manpower }),
    court: clean({ ruler: s.ruler, heir: s.heir, regent: s.regent, capital: s.capital, council: (s.cabinet ?? []).map((c) => ({ who: c.person, seat: c.role })) }),
    standing: clean({ wars: s.wars, allies: s.allies, rivals: s.rivals, subjects: (s.subjects ?? []).map((x) => `${x.country} (${x.type})`),
      estates: (s.estates ?? []).map((e) => clean({ name: e.name, power: e.power, mood: e.satisfaction })) }),
    peoples: clean({ cultures: top(s.population?.cultures, 6), faiths: top(s.population?.religions, 5) }),
    map: clean({ ours: ["GRA"], subjects: subjectTags, allies: (s.allies ?? []).map((n) => ({ Mamluks: "MAM" })[n] ?? tagOfName.get(n)).filter(Boolean) }),
    beats: events.filter((e) => inSpan(e.date)).map(beat),
    tellings: tellings.filter((t) => inSpan(t.on)),
    notes: looseNotes.filter((n) => inSpan(n.on)),
    questions: QUESTIONS[s.date],
  }));
  prev = s.date;
});

/* ---------------------------------------------------------------- campaign */
const eras = J("data/eras.json");
write("campaign.yaml", {
  map: { realms: "../data/map/world/realms-{date}.json", view: [1240, 1230, 2640, 1190], story: [1215, 1225, 1440, 900], wide: [1130, 1130, 2760, 1300], towns: [1215, 1195, 1110, 840], origin: [5900, 1100],
    names: "../data/world/tags.json",
    aliases: { "al-Andalus": "GRA", Granada: "GRA", "Papal States": "PAP", Mamluks: "MAM", Egypt: "MAM", Angevins: "ANV", "Angevin": "ANV" }, world: "../data/world/{date}.json",
    rivals: [
      { name: "Castile", tags: ["CAS"], color: ["#b8860b", "#c99a2e"] },
      { name: "Portugal", tags: ["POR"], color: ["#5e8c31", "#86b34f"] },
      { name: "Aragon", tags: ["ARA"], color: ["#a33a63", "#cf6a9c"] },
      { name: "France", tags: ["FRA"], color: ["#6d4bb5", "#a48be0"] },
      { name: "England", tags: ["ENG", "ANV"], names: { ENG: "England", ANV: "The Angevins" }, color: ["#b3261e", "#e0655c"] },
    ], layers: "../data/map/layers/{date}.json", centroids: "../data/map/centroids.json", labels: { GRA: "al-Andalus", MOR: "Morocco", TUN: "Tunis", MAM: "The Mamlūks", ANV: "The Angevins", TIM: "The Tīmūrids", ENG: "England" } },
  id: "eu5-nasrid", title: "al-Andalus", arabic: "الأندلس", subtitle: "The Naṣrid campaign: Granada, 1337, to an empire across the Strait",
  game: "Europa Universalis V 1.4 (Across the Pillars)", player: "Trent", start: "1337-04-01",
  calendar: "hijri",
  measures: [
    { key: "towns", label: "Towns" }, { key: "souls", label: "Souls", format: "compact" }, { key: "treasury", label: "Treasury" },
    { key: "stability", label: "Stability" }, { key: "prestige", label: "Prestige" }, { key: "regiments", label: "Regiments" }, { key: "ships", label: "Ships" },
  ],
  kinds: { war: { label: "War", tone: "war" }, battle: { label: "Battle", tone: "war" }, peace: { label: "Peace", tone: "war" },
    crown: { label: "Throne", tone: "house" }, birth: { label: "Birth", tone: "house" }, marriage: { label: "Marriage", tone: "house" }, death: { label: "Death", tone: "house" },
    office: { label: "Office", tone: "realm" }, realm: { label: "Realm", tone: "realm" }, land: { label: "Land", tone: "realm" },
    world: { label: "Abroad", tone: "abroad" }, note: { label: "Account", tone: "abroad" } },
  tones: { war: "War and peace", house: "The house", realm: "The realm", abroad: "Abroad and accounts" },
  from: { save: "read from the save", seen: "seen on a screenshot", told: "told by the player" },
  eras: eras.map((e) => clean({ id: e.id, title: e.title, arabic: e.titleArabic, from: e.start, to: e.end, summary: e.summary })),
});
console.log(`imported: ${people.length} cast, ${snaps.length} reckonings, ${events.length} beats (${events.filter((e) => !important(e)).length} minor), ${tellings.length} tellings (${tellings.filter((t) => t.behind).length} with notes behind), ${looseNotes.length} loose notes`);
