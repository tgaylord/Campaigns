/**
 * The campaign's data model, as the site reads it.
 *
 *   ../story/*.md           the story log: chronicle entries and OOC notes (hand-written)
 *   ../data/eras.json       eras of the chronicle
 *   ../data/snapshots/*.json one snapshot per checkpoint save (generated)
 *   ../data/events/*.json   the event log, one array per year (generated + player notes)
 *   ../data/people.json     characters
 *   ../data/gazetteer.json  places
 *   ../data/wars.json       wars
 *
 * Anything marked `sample: true` is scaffolding, not campaign history; the site
 * shows a banner while any sample record is loaded.
 */
import { defineCollection, reference } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

/** YYYY-MM-DD game date. Unquoted YAML dates arrive as Date objects; turn them back into strings. */
const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{3,4}-\d{2}-\d{2}$/, "dates are YYYY-MM-DD game dates"),
);
const sample = z.boolean().default(false);

/* ---------------------------------------------------------------- story */

const story = defineCollection({
  loader: glob({ pattern: "*.md", base: "../story" }),
  schema: z.object({
    title: z.string(),
    date: isoDate,
    endDate: isoDate.optional(),
    era: reference("eras"),
    kind: z.enum(["chronicle", "ooc"]).default("chronicle"),
    people: z.array(reference("people")).default([]),
    places: z.array(reference("places")).default([]),
    wars: z.array(reference("wars")).default([]),
    /** Where the facts come from: checkpoint ids, or "player" for Trent's account. */
    sources: z.array(z.string()).default([]),
    sample,
  }),
});

const eras = defineCollection({
  loader: file("../data/eras.json"),
  schema: z.object({
    title: z.string(),
    start: isoDate,
    end: isoDate.nullable(),
    summary: z.string().optional(),
    sample,
  }),
});

/* ------------------------------------------------------------ snapshots */

const estate = z.object({
  id: z.string(),
  name: z.string(),
  /** share of total estate power, 0–100 */
  power: z.number(),
  /** satisfaction, 0–100 */
  satisfaction: z.number().nullable(),
});

const snapshots = defineCollection({
  loader: glob({
    pattern: "*.json",
    base: "../data/snapshots",
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
  schema: z.object({
    date: isoDate,
    checkpoint: z.string(),
    note: z.string().optional(),
    ruler: reference("people"),
    heir: reference("people").nullable().default(null),
    regent: reference("people").nullable().default(null),
    capital: reference("places"),
    rank: z.string(),
    locations: z.number(),
    overlord: z.object({ country: z.string(), type: z.string() }).nullable(),
    subjects: z.array(z.object({ country: z.string(), type: z.string() })).default([]),
    population: z.object({
      total: z.number(),
      cultures: z.record(z.string(), z.number()),
      religions: z.record(z.string(), z.number()),
    }),
    estates: z.array(estate),
    economy: z.object({
      treasury: z.number(),
      income: z.number(),
      expenses: z.number(),
      debt: z.number().default(0),
    }),
    military: z.object({
      levies: z.number(),
      regiments: z.number(),
      ships: z.number(),
    }),
    wars: z.array(reference("wars")).default([]),
    strait: z
      .object({
        active: z.boolean(),
        /** −100 (Castile) … +100 (Morocco) */
        influence: z.number(),
        /** 0–100 */
        sovereignty: z.number(),
        yearsSubject: z.number(),
      })
      .nullable(),
    goldenCentury: z
      .object({ european: z.number(), colonial: z.number(), flashpoint: z.number() })
      .nullable()
      .default(null),
    sample,
  }),
});

/* --------------------------------------------------------------- events */

const eventType = z.enum([
  "war_declared", "battle", "siege", "peace",
  "ruler_change", "birth", "death", "marriage",
  "estate_change", "law_change", "reform",
  "territory_change", "strait_change", "gc_change",
  "situation", "formable", "player_note",
]);

const eventSchema = z.object({
  date: isoDate,
  type: eventType,
  title: z.string(),
  people: z.array(reference("people")).default([]),
  places: z.array(reference("places")).default([]),
  wars: z.array(reference("wars")).default([]),
  /** type-specific detail: casualties, war score change, estate deltas … */
  data: z.record(z.string(), z.unknown()).default({}),
  source: z.string(),
  sample,
});

/** Reads every ../data/events/*.json file (each an array) into one collection. */
const events = defineCollection({
  loader: {
    name: "event-log",
    load: async ({ store, parseData, config, watcher }) => {
      const dir = fileURLToPath(new URL("../data/events/", config.root));
      store.clear();
      let files: string[] = [];
      try {
        files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
      } catch {
        return; // no events yet
      }
      for (const f of files) {
        const filePath = path.join(dir, f);
        watcher?.add(filePath);
        const rows = JSON.parse(await readFile(filePath, "utf8")) as Array<Record<string, unknown>>;
        for (const row of rows) {
          const id = String(row.id);
          const data = await parseData({ id, data: row });
          store.set({ id, data });
        }
      }
    },
  },
  schema: eventSchema.extend({ id: z.string() }),
});

/* ---------------------------------------------------- people, places, wars */

const people = defineCollection({
  loader: file("../data/people.json"),
  schema: z.object({
    name: z.string(),
    nameGame: z.string().optional(),
    dynasty: z.string().optional(),
    born: isoDate.optional(),
    died: isoDate.optional(),
    father: z.string().optional(),
    mother: z.string().optional(),
    roles: z.array(z.string()).default([]),
    note: z.string().optional(),
    sample,
  }),
});

const places = defineCollection({
  loader: file("../data/gazetteer.json"),
  schema: z.object({
    name: z.string(),
    nameGame: z.string(),
    kind: z.enum(["location", "province", "area", "region"]),
    held: z.array(z.object({ from: isoDate, to: isoDate.nullable() })).default([]),
    note: z.string().optional(),
    sample,
  }),
});

const wars = defineCollection({
  loader: file("../data/wars.json"),
  schema: z.object({
    name: z.string(),
    start: isoDate,
    end: isoDate.nullable(),
    goal: z.string(),
    allies: z.array(z.string()).default([]),
    enemies: z.array(z.string()),
    outcome: z.string().nullable(),
    /** war score from our side, −100 … 100 */
    score: z.array(z.object({ date: isoDate, value: z.number() })).default([]),
    sample,
  }),
});

export const collections = { story, eras, snapshots, events, people, places, wars };
