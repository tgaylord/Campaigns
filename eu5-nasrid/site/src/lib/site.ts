import { getCollection } from "astro:content";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Site-relative URL with the deploy base, always with a trailing slash for pages. */
export function url(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}

export const nf = new Intl.NumberFormat("en-GB");
export function compact(n: number): string {
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export async function snapshotsSorted() {
  const all = await getCollection("snapshots");
  return all.sort((a, b) => a.data.date.localeCompare(b.data.date));
}

export async function storySorted() {
  const all = await getCollection("story");
  return all.sort((a, b) => a.data.date.localeCompare(b.data.date));
}

export async function eventsSorted() {
  const all = await getCollection("events");
  return all.sort((a, b) => a.data.date.localeCompare(b.data.date));
}

/** True while any scaffold record is still loaded. */
export async function hasSampleData(): Promise<boolean> {
  const names = ["story", "eras", "snapshots", "events", "people", "places", "wars"] as const;
  for (const n of names) {
    const items = await getCollection(n);
    if (items.some((i: any) => i.data.sample)) return true;
  }
  return false;
}

export const EVENT_LABELS: Record<string, string> = {
  war_declared: "War declared", battle: "Battle", siege: "Siege", peace: "Peace",
  ruler_change: "New ruler", birth: "Birth", death: "Death", marriage: "Marriage",
  estate_change: "Estates", law_change: "Law", reform: "Reform",
  territory_change: "Territory", strait_change: "The Strait", gc_change: "Golden Century",
  situation: "Situation", formable: "Formable", player_note: "Player note",
};

/** Story entries and events that mention a record. */
export async function mentions(kind: "people" | "places" | "wars", id: string) {
  const story = (await storySorted()).filter((s) => (s.data[kind] as { id: string }[]).some((r) => r.id === id));
  const events = (await eventsSorted()).filter((e) => (e.data[kind] as { id: string }[]).some((r) => r.id === id));
  return { story, events };
}
