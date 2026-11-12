import raw from "./data.json";
import { toHijri } from "./hijri";

/* ------------------------------------------------------------------ the data */
export type Beat = { at?: number[]; won?: boolean; id: string; on: string; kind: string; what: string; minor?: boolean; who?: string[]; where?: string[]; threads?: string[]; from?: string[]; cite?: string; detail?: Record<string, unknown>; r: string };
export type Telling = { book?: string; id: string; on: string; title: string; verse?: string; who?: string[]; covers?: string[]; text: string; behind?: string; r: string };
export type Person = { name: string; arabic?: string; sex?: string; house?: string; tier?: string; born?: string; died?: string; father?: string; mother?: string; reigns?: { from: string; to: string | null }[]; roles?: string[]; traits?: string[]; drives?: { from: string; text: string; by: string; source?: string }[]; ties?: { with: string; kind: string; from: string; to?: string; text: string }[]; note?: string };
export type Thread = { id: string; kind: "story" | "war"; title: string; state: string; from?: string; to?: string; premise?: string; outcome?: string; part?: string; sides?: Record<string, string[]>; note?: string; game?: string };
export type Reckoning = { date: string; title: string; summary?: string; realm: Record<string, number>; court?: { ruler?: string; heir?: string; regent?: string; council?: { who: string; seat: string }[] }; peoples?: { cultures?: Record<string, number>; faiths?: Record<string, number> }; standing?: { wars?: string[]; allies?: string[]; subjects?: string[]; estates?: { name: string; power?: number; mood?: number }[] }; questions?: string[] };
export type Data = {
  campaign: { map?: { story?: number[]; wide?: number[]; towns?: number[] }; title: string; arabic?: string; subtitle: string; game: string; player: string; start: string; measures: { key: string; label: string; format?: string }[]; kinds: Record<string, { label: string; tone: string }>; tones: Record<string, string>; from: Record<string, string>; eras: { arabic?: string; id: string; title: string; from: string; to?: string; summary?: string }[] };
  threads: Thread[]; cast: Record<string, Person>; places: Record<string, { name: string; plain?: string }>; reckonings: Reckoning[]; beats: Beat[]; tellings: Telling[];
  outlines: Record<string, { o: string; s: string; a: string }>; land: string;
  neighbours: Record<string, [string, number, number, number][]>; mosaic: { towns: number[][]; frames: Record<string, number[]> };
  map: { view: number[]; labels: Record<string, string>; realms: { t: string; d: string; c: number[]; role: string }[] } | null;
};
export const D = raw as unknown as Data;
export const { campaign, cast, threads, reckonings, beats, tellings } = D;
export const threadById = new Map(threads.map((t) => [t.id, t]));
export const beatById = new Map(beats.map((b) => [b.id, b]));
export const now = reckonings.at(-1)!;
export const before = reckonings.at(-2);
export const Y0 = +campaign.start.slice(0, 4);
export const Y1 = +now.date.slice(0, 4);

/* ------------------------------------------------------------------ small helpers */
export const nf = new Intl.NumberFormat("en-GB");
export const cf = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 2 });
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dayMonth = (d: string) => `${+d.slice(8, 10)} ${MON[+d.slice(5, 7) - 1]}`;
export const hijriSpan = (y: number) => { const a = toHijri(`${y}-01-01`).y, b = toHijri(`${y}-12-31`).y; return a === b ? `${a}` : `${a}–${String(b).slice(-2)}`; };
export const short = (id: string) => { const n = cast[id]?.name ?? id; return n.split(/ (?:ibn|bint) /).slice(0, 2).join(n.includes(" bint ") ? " bint " : " ibn "); };
export const first = (id: string) => (cast[id]?.name ?? id).split(/ (?:ibn|bint|of|de) /)[0];
export const age = (p: Person, at: string) => (p.born ? Math.floor((Date.parse(p.died && p.died < at ? p.died : at) - Date.parse(p.born)) / 31557600000) : null);
export const rulerAt = (d: string) => Object.entries(cast).find(([, p]) => p.reigns?.some((r) => r.from <= d && (!r.to || r.to > d)));
export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
export const fmt = (m: { format?: string }, v: number) => (m.format === "compact" ? cf.format(v) : nf.format(Math.round(v * 10) / 10));
export const tone = (kind: string) => campaign.kinds[kind]?.tone ?? "abroad";
export const Who = ({ id, full }: { id: string; full?: boolean }) => <a href={`#who-${id}`}>{full ? cast[id]?.name ?? id : short(id)}</a>;

