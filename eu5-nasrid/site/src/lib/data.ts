import raw from "../generated/campaign.json";
import { toHijri, HIJRI_MONTHS, HIJRI_MONTHS_AR, WESTERN_MONTHS, parseDate } from "./hijri";

/* ------------------------------------------------------------ types */

export type Era = { id: string; title: string; start: string; end: string | null; summary?: string; sample: boolean };
export type Person = {
  id: string; name: string; nameArabic?: string; nameGame?: string; dynasty?: string;
  born?: string; died?: string; father?: string; mother?: string; roles: string[];
  reigns: { from: string; to: string | null }[]; female: boolean; gameId?: number;
  stats?: { adm: number; dip: number; mil: number }; traits: string[]; note?: string; sample: boolean;
};
export type Place = {
  id: string; name: string; nameArabic?: string; nameGame: string; kind: string;
  /** the game's location key; x, y are its centre on the game map (map pixels) */
  key: string; x: number; y: number; major: boolean;
  held: { from: string; to: string | null; via?: string }[]; note?: string; sample: boolean;
};
export type Country = { tag: string; name: string; nameChronicle: string; nameArabic?: string; color: string };
export type War = {
  id: string; name: string; start: string; end: string | null; goal: string;
  allies: string[]; enemies: string[]; outcome: string | null;
  score: { date: string; value: number }[]; sample: boolean;
  involvement: "belligerent" | "potential"; joined?: { from: string; to: string | null };
  sides?: { attackers: string[]; defenders: string[] }; gameName?: string; note?: string;
};
export type Estate = { id: string; name: string; power: number | null; satisfaction: number | null; estimated: boolean };
export type Snapshot = {
  id: string; date: string; checkpoint: string; note?: string;
  ruler: string; heir: string | null; regent: string | null; capital: string; rank: string; locations: number;
  overlord: { country: string; type: string } | null; subjects: { country: string; type: string; loyalty?: { value: number; trend?: string; source: string } }[];
  allies: string[]; rivals: string[]; cabinet: { person: string; role: string }[];
  crownPower?: number; politicalInfluence?: number;
  population: { total: number; cultures: Record<string, number>; religions: Record<string, number> };
  /** empty / null until a checkpoint the game has ticked through records them */
  estates: Estate[];
  economy: { treasury: number; income: number; expenses: number; debt: number } | null;
  military: { manpower: number; maxManpower: number; regiments: number; ships: number } | null;
  stability?: number; prestige?: number;
  armies: { leader?: string; men: number; at: string; makeup: string; source: string }[];
  source?: { save: string; gameVersion: string; extracted: string };
  government?: {
    type: string; heirSelection: string; laws: { slot: string; law: string }[]; reforms: string[]; privileges: string[];
    culture: string; tolerated: string[]; religion: string;
    societalValues: Record<string, number>;
    parliament: { type: string; lastCalled: string | null; agenda: { estate: string; type: string }[] } | null;
    privilegeDates: Record<string, string>;
  };
  wars: string[];
  strait: { active: boolean; influence: number; sovereignty: number; yearsSubject: number; areas?: { held: number; total: number } } | null;
  sample: boolean;
};
export type CampaignEvent = {
  id: string; date: string; type: string; title: string;
  people: string[]; places: string[]; wars: string[]; data: Record<string, any>; source: string; sample: boolean;
};
export type StoryEntry = {
  id: string; title: string; date: string; endDate?: string; era: string; kind: "chronicle" | "ooc";
  about?: string | null; people: string[]; places: string[]; wars: string[]; sources: string[];
  html: string; sample: boolean;
};

export type Mod = { key: string; label: string; value: number | string; text: string; percent: boolean; good: boolean; size?: string };
export type CatEntry = {
  name: string; desc?: string | null; modifiers: Mod[]; power: Record<string, number>; satisfaction: Record<string, number>;
  estate?: string; revoke?: string | null; years?: number | null; favouredBy?: string[];
};
export type Catalog = {
  gameVersion: string;
  privileges: Record<string, CatEntry>; reforms: Record<string, CatEntry>;
  laws: Record<string, { name: string; category: string | null; options: Record<string, CatEntry> }>;
  societalValues: Record<string, { name: string; left: string; right: string; leftModifiers: Mod[]; rightModifiers: Mod[] }>;
  agendas: Record<string, { name: string; desc: string | null; estate: string; moves: { value: string | null; direction: string }[] }>;
  parliaments: Record<string, { name: string; desc: string | null; nameIsOurs?: boolean }>;
};

/** One of Granada's own locations at a checkpoint (from the extracted facts). */
export type Land = {
  key: string; province: string | null; area: string | null; region: string | null; rank: string | null; controller: string | null;
  culture: string | null; religion: string | null; population: number;
  cultures: Record<string, number>; religions: Record<string, number>; popTypes: Record<string, number>;
  control: number | null; development: number | null; prosperity: number | null; culturalUnity: number | null; religiousUnity: number | null;
  goods: string | null; tax: number | null; possibleTax: number | null; estateTax: Record<string, number>;
  core: boolean | null; coreOfOverlord?: boolean | null; integration: { stage: string; progress: number } | null; since: string | null; buildings: { type: string; level: number }[];
};

type Campaign = {
  generated: string; sample: boolean; eras: Era[]; people: Person[]; places: Place[]; wars: War[];
  countries: Country[]; snapshots: Snapshot[]; events: CampaignEvent[]; story: StoryEntry[]; catalog: Catalog;
  lands: Record<string, Land[]>;
  /** checkpoint id → subject tag → the subject and its lands */
  subjectLands: Record<string, Record<string, SubjectLands>>;
};
export type SubjectLands = {
  type: string; since: string | null; rank: string | null; culture: string | null; religion: string | null;
  capital: string | null; ruler: string | null; population: number; lands: Land[];
};

export const campaign = raw as unknown as Campaign;
export const { eras, people, places, wars, countries, snapshots, events, story, catalog, lands, subjectLands } = campaign;

/** Names of peoples and faiths as the rest of the site writes them. */
const FAITH: Record<string, string> = { judaism: "Jewish", nyama_religion: "Nyama" };
const title = (k: string) => k.replace(/_(religion|culture)$/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const faithName = (k: string) => FAITH[k] ?? title(k);
export const cultureName = (k: string) => title(k);
export const rankName = (k: string | null) => ({ city: "City", town: "Town", rural_settlement: "Rural" } as Record<string, string>)[k ?? ""] ?? (k ? title(k) : "");
export const chronicle = story.filter((s) => s.kind === "chronicle");
export const notes = story.filter((s) => s.kind === "ooc");

const index = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
export const personById = index(people);
export const placeById = index(places);
export const warById = index(wars);
export const eraById = index(eras);
export const storyById = index(story);
export const countryByTag = new Map(countries.map((c) => [c.tag, c]));
/** The chronicle's name for a country, by tag or by its game name. */
export function countryName(tagOrName: string) {
  const c = countryByTag.get(tagOrName) ?? countries.find((x) => x.name === tagOrName);
  return c?.nameChronicle ?? tagOrName;
}

export const latest = snapshots[snapshots.length - 1];

/* ------------------------------------------------------------ dates */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const arabicDigits = (n: number | string) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d]);

export function hijri(date: string) {
  const h = toHijri(date);
  return {
    ...h, month: HIJRI_MONTHS[h.m - 1], text: `${h.d} ${HIJRI_MONTHS[h.m - 1]} ${h.y}`,
    /** fully Arabic: "٢ جمادى الآخرة ٧٧١" */
    arabic: `${arabicDigits(h.d)} ${HIJRI_MONTHS_AR[h.m - 1]} ${arabicDigits(h.y)}`,
  };
}
export function western(date: string) {
  const g = parseDate(date);
  return `${g.d} ${WESTERN_MONTHS[g.m - 1]} ${g.y}`;
}
export const year = (date: string) => parseDate(date).y;
export const hijriYear = (date: string) => toHijri(date).y;

/** Fractional year, for laying dates on a time axis. */
export function yearFrac(date: string): number {
  const g = parseDate(date);
  return g.y + (g.m - 1) / 12 + (g.d - 1) / 365;
}

/* ------------------------------------------------------------ lookups */

export const isHeld = (p: Place, date: string) =>
  p.held.some((h) => h.from <= date && (h.to === null || h.to > date));

export function rulerAt(date: string): Person | undefined {
  return people.find((p) => p.reigns.some((r) => r.from <= date && (r.to === null || r.to > date)));
}

export function mentionsOf(kind: "people" | "places" | "wars", id: string) {
  return {
    story: story.filter((s) => s.kind === "chronicle" && (s[kind] as string[]).includes(id)),
    events: events.filter((e) => (e[kind] as string[]).includes(id)),
  };
}

export const ESTATE_ORDER = ["crown", "nobles", "clergy", "burghers", "peasants", "tribes", "dhimmi", "cossacks"];
/**
 * Each estate keeps one colour everywhere (colour follows the entity, never its rank).
 * The dataviz reference categorical order, validated: `night` for the lapis ground,
 * `folio` for parchment. Gilt stays an interface colour, never a series colour.
 */
const SLOTS_NIGHT = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];
const SLOTS_FOLIO = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
export function estateColor(id: string, surface: "night" | "folio" = "night"): string {
  const i = ESTATE_ORDER.indexOf(id);
  const slots = surface === "night" ? SLOTS_NIGHT : SLOTS_FOLIO;
  return slots[i >= 0 ? i : 7];
}

export const EVENT_LABEL: Record<string, string> = {
  war_declared: "War declared", war_joined: "Joined a war", battle: "Battle", siege: "Siege", peace: "Peace",
  ruler_change: "Succession", birth: "Birth", death: "Death", marriage: "Marriage",
  estate_change: "Estates", law_change: "Law", reform: "Reform", territory_change: "Territory",
  strait_change: "The Strait", gc_change: "Golden Century", situation: "Situation",
  formable: "Formable", appointment: "Appointment", diplomacy: "Diplomacy", player_note: "Note",
};

export const nf = new Intl.NumberFormat("en-GB");
export const compact = (n: number) =>
  new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);
export const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
