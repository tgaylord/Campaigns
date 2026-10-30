import { useEffect, useState } from "react";
import { campaign, countryByTag, people } from "./data";
import type { Person } from "./data";

/* The world beyond the realm (tools/world_powers.py): a small series in the bundle,
   the full file for a checkpoint fetched when it is shown. */

export type Ruler = { gameId: number; name: string | null; born: string | null; female: boolean; stats: number[]; since?: string | null; regnal?: number | null };
export type Power = {
  name: string; rank: number | null; points: number | null; regional: boolean; level: number;
  locations: number; people: number; subjectLocations: number; subjectPeople: number;
  tax: number; trade: number; gold: number; stability: number; prestige: number;
  men: number; regulars: number; levies: number; ships: number;
  capital: string | null; capitalProvince?: string | null; culture: string | null; religion: string | null;
  ruler: Ruler | null; heir: Ruler | null; overlord: [string, string | null] | null;
  subjects: [string, string | null][]; allies: string[]; rivals: string[]; guarantees: string[];
};
export type WorldWar = { started: string | null; attacker: string | null; defender: string | null; cb: string | null; revolt: boolean; attackers: string[]; defenders: string[]; score: number | null };
export type World = {
  date: string;
  /** [tag, rank, points, regional power?] */
  ladder: [string, number, number, boolean][];
  powers: Record<string, Power>;
  unions: { members: string[]; leader: string | null; kind: string; since: string | null }[];
  orders: { emperor?: string; empireMembers?: number; pope?: string; guelphs?: { leader: string | null; members: string[]; count: number }; ghibellines?: { leader: string | null; members: string[]; count: number } };
  wars: WorldWar[];
};
export type Circle = { id: string; name: string; nameArabic: string; note: string; ring: number; tags: string[] };
/** per followed power: [rank, points, own locations, people (thousands), men under arms, overlord] */
export type SeriesRow = { id: string; date: string; powers: Record<string, [number | null, number | null, number, number, number, string | null]>; greatLine: number | null };
type WorldBundle = {
  circles: Circle[]; series: SeriesRow[];
  capitals: Record<string, { x: number; y: number; province: string; location: string; onChart: boolean }>;
  frame: { x: number; y: number; width: number; height: number };
};
export const world = (campaign as unknown as { world: WorldBundle }).world;
export const circleOf = new Map(world.circles.flatMap((c) => c.tags.map((t) => [t, c] as const)));
export const followed = new Set(["GRA", ...world.circles.flatMap((c) => c.tags)]);

const base = import.meta.env.BASE_URL;
const cache = new Map<string, Promise<any>>();
function load<T>(url: string): Promise<T | null> {
  if (!cache.has(url)) cache.set(url, fetch(base + url).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return cache.get(url)!;
}
export function useFetched<T>(url: string | null): T | null {
  const [v, setV] = useState<T | null>(null);
  useEffect(() => {
    let live = true;
    if (!url) { setV(null); return; }
    load<T>(url).then((x) => { if (live) setV(x); });
    return () => { live = false; };
  }, [url]);
  return v;
}
export const useWorld = (id: string | undefined) => useFetched<World>(id ? `world/${id}.json` : null);
/** the English name and map colour of every landed country */
export const useTags = () => useFetched<Record<string, { name: string; color: string | null }>>("world/tags.json");

/** The chronicle's name for a power, or the game's. */
export function powerName(tag: string, w?: World | null, tags?: Record<string, { name: string }> | null): string {
  return countryByTag.get(tag)?.nameChronicle ?? w?.powers[tag]?.name ?? tags?.[tag]?.name ?? tag;
}
export function gameName(tag: string, w?: World | null, tags?: Record<string, { name: string }> | null): string {
  return countryByTag.get(tag)?.name ?? w?.powers[tag]?.name ?? tags?.[tag]?.name ?? tag;
}
const byGameId = new Map<number, Person>();
for (const p of people) {
  if (p.gameId) byGameId.set(p.gameId, p);
  for (const g of (p as Person & { gameIds?: number[] }).gameIds ?? []) byGameId.set(g, p);
}
/** The chronicle's record of a ruler, when it has one. */
export const personOf = (r: Ruler | null | undefined) => (r ? byGameId.get(r.gameId) : undefined);

/** "fiefdom" → "fief"; the game's subject types in plain words */
export const SUBJECT: Record<string, string> = {
  vassal: "vassal", fiefdom: "fief", tributary: "tributary", taifa: "ṭāʾifa", dominion: "dominion", appanage: "appanage",
  march: "march", colony: "colony", hanseatic_member: "Hanseatic member", maha_samanta: "great feudatory", samanta: "feudatory",
};
export const subjectWord = (t: string | null) => (t ? SUBJECT[t] ?? t.replace(/_/g, " ") : "subject");
export const LEVEL: Record<number, string> = { 1: "county", 2: "kingdom", 3: "great kingdom", 4: "empire" };

export const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
