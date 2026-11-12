/*
 * The Codex: the whole chronicle as one bound book.
 *
 * Every chronicle entry is a leaf, in the order its dates fall, with a permanent address taken from
 * its Hijri date (772·02·21, which is already the prefix of its file name). The eight books are threads
 * through the codex, each with its own pigment. The contents are canon tables: years down the page,
 * one column per book open at the time; a canon closes when a book closes.
 *
 * Everything here is computed from the campaign data at load; nothing is laid out by hand.
 */
import { chronicle, eras, people, snapshots, sessions, type StoryEntry, type Era, type Person } from "./data";
import { toHijri, hijriToGameDate, HIJRI_MONTHS } from "./hijri";

/* ------------------------------------------------------------ pigments */

/**
 * One manuscript pigment per book, in the order the books open: vermilion, lapis, murrey, verdigris,
 * madder, azurite, kermes, orpiment, then four more for later books. Validated as a categorical set on
 * parchment (dataviz validator: all pass but one deutan pair at ΔE 7.7, which the printed book names
 * carry). A later book takes the first pigment not used by a book it shares a canon with.
 */
const PIGMENTS = ["#b23a22", "#2b4a9b", "#7a2f66", "#16865a", "#a0560f", "#0b7cb3", "#a0183f", "#856500", "#5b6b12", "#8c3b8f", "#2f6f73", "#7d4a2a"];
const PIGMENT_NAMES = ["vermilion", "lapis", "murrey", "verdigris", "madder", "azurite", "kermes", "orpiment", "terre verte", "folium", "verdigris-blue", "umber"];

/* ------------------------------------------------------------ types */

export type Book = {
  era: Era; id: string; n: number;
  /** "The Book of the Balance" */ name: string;
  /** "Balance" */ short: string;
  color: string; pigment: string;
  leaves: Leaf[]; words: number; closed: boolean;
  first?: Leaf; last?: Leaf;
};
export type Leaf = {
  entry: StoryEntry; id: string;
  /** "772-02-21", or "772-02-21b" where two leaves share a day */ addr: string;
  /** "772·02·21" */ label: string;
  hy: number; hm: number; hd: number;
  /** 1-based place in the codex, and in its book */ n: number; bn: number;
  book: Book; words: number;
  /** the first words of the prose, for the catchword that points here */ catchword: string;
  /** the prose with the closing verse lifted out (when it stands alone as the last paragraph) */ body: string;
  verseHtml: string | null;
  /** the sitting that first bound this leaf, and the save it was most likely read from */
  boundIn: string | null; save: string | null;
};
export type Reign = { person: Person; from: string; to: string | null; hy: number };
export type CanonRow =
  | { kind: "year"; hy: number; cells: Leaf[][] }
  | { kind: "lacuna"; hy0: number; hy1: number; saves: number }
  | { kind: "reign"; reign: Reign };
export type Canon = { n: number; books: Book[]; leaves: Leaf[]; hy0: number; hy1: number; rows: CanonRow[]; reignAtStart?: Reign };

/* ------------------------------------------------------------ text helpers */

const plain = (html: string) => html.replace(/<\/(p|li|h\d|blockquote)>/g, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const RUBRIC = /^Here (begins|ends) the (Book|account)/;
const paragraphs = (html: string) => html.match(/<p>[\s\S]*?<\/p>/g) ?? [];

/** Split the closing verse off the prose when the last paragraph is nothing but italics. */
function liftVerse(html: string): { body: string; verse: string | null } {
  const m = /<p><em>([\s\S]*?)<\/em><\/p>\s*$/.exec(html);
  if (!m || m[1].includes("<em>")) return { body: html, verse: null };
  return { body: html.slice(0, m.index).trimEnd(), verse: m[1] };
}

/** "Here ends the Book of …" set as a rubric line, even when it closes a longer paragraph. */
export function rubricate(html: string): string {
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (all, inner: string) => {
    const t = plain(inner);
    if (RUBRIC.test(t) && t.length < 80) return `<p class="rubric-line">${inner}</p>`;
    const m = /^([\s\S]*?[.!?])\s+(Here (?:begins|ends) the Book of [^<.]*\.)\s*$/.exec(inner);
    return m ? `<p>${m[1]}</p><p class="rubric-line">${m[2]}</p>` : all;
  });
}

/* ------------------------------------------------------------ books and leaves */

const bookTitle = (e: Era) => `The Book of ${e.title.replace(/^The /, "the ")}`;
const shortTitle = (e: Era) => e.title.replace(/^The /, "").replace(/ of the State$/, "");

const boundIn = new Map<string, string>();
sessions.forEach((s) => s.entries.forEach((e) => { if (!boundIn.has(e)) boundIn.set(e, s.id); }));
const sittingOrder = new Map(sessions.map((s, i) => [s.id, i]));

export const books: Book[] = eras.map((era, i) => ({
  era, id: era.id, n: i + 1, name: bookTitle(era), short: shortTitle(era),
  color: PIGMENTS[i % PIGMENTS.length], pigment: PIGMENT_NAMES[i % PIGMENTS.length],
  leaves: [], words: 0, closed: era.end != null,
}));
export const bookById = new Map(books.map((b) => [b.id, b]));

const saveDates = snapshots.map((s) => s.date).sort();
const minusDays = (d: string, n: number) => new Date(Date.parse(d + "T00:00:00Z") - n * 864e5).toISOString().slice(0, 10);

function addressOf(e: StoryEntry) {
  const m = /^(\d{4})-(\d{2})-(\d{2})-/.exec(e.id);
  const h = m ? { y: +m[1], m: +m[2], d: +m[3] } : toHijri(e.date);
  return { hy: h.y, hm: h.m, hd: h.d, base: `${h.y}-${String(h.m).padStart(2, "0")}-${String(h.d).padStart(2, "0")}` };
}

// Codex order: by date; two leaves on one day keep the order they were first bound in, then file order,
// so a suffix once given is not taken back when a later leaf is written for the same day.
const ordered = [...chronicle].sort((a, b) =>
  a.date.localeCompare(b.date) || addressOf(a).base.localeCompare(addressOf(b).base)
  || (sittingOrder.get(boundIn.get(a.id) ?? "") ?? 1e9) - (sittingOrder.get(boundIn.get(b.id) ?? "") ?? 1e9)
  || a.id.localeCompare(b.id));
const perDay = new Map<string, number>();
ordered.forEach((e) => { const b = addressOf(e).base; perDay.set(b, (perDay.get(b) ?? 0) + 1); });
const seenDay = new Map<string, number>();

export const leaves: Leaf[] = ordered.map((e, i) => {
  const a = addressOf(e);
  const k = seenDay.get(a.base) ?? 0; seenDay.set(a.base, k + 1);
  const suffix = (perDay.get(a.base) ?? 1) > 1 ? "abcdefgh"[k] : "";
  const book = bookById.get(e.era) ?? books[0];
  const { body, verse } = liftVerse(e.html);
  const first = paragraphs(body).map(plain).find((p) => p && !RUBRIC.test(p)) ?? "";
  const words = plain(e.html).split(" ").filter(Boolean).length;
  const slack = minusDays(e.date, 7);
  const leaf: Leaf = {
    entry: e, id: e.id, addr: a.base + suffix, label: `${a.hy}·${String(a.hm).padStart(2, "0")}·${String(a.hd).padStart(2, "0")}${suffix}`,
    hy: a.hy, hm: a.hm, hd: a.hd, n: i + 1, bn: 0, book, words,
    catchword: first.split(" ").slice(0, 11).join(" ").replace(/[,;:]$/, "") + "…",
    body: rubricate(body), verseHtml: verse,
    boundIn: boundIn.get(e.id) ?? null, save: saveDates.find((s) => s >= slack) ?? null,
  };
  book.leaves.push(leaf); leaf.bn = book.leaves.length; book.words += words;
  return leaf;
});
for (const b of books) { b.first = b.leaves[0]; b.last = b.leaves[b.leaves.length - 1]; }
export const leafByAddr = new Map(leaves.map((l) => [l.addr, l]));
export const leafById = new Map(leaves.map((l) => [l.id, l]));
export const totalWords = leaves.reduce((n, l) => n + l.words, 0);

/* ------------------------------------------------------------ reigns, saves, silences */

export const reigns: Reign[] = people
  .flatMap((p) => p.reigns.filter((r) => (r.to ?? "9999") >= (leaves[0]?.entry.date ?? "")).map((r) => ({ person: p, from: r.from, to: r.to, hy: toHijri(r.from).y })))
  .sort((a, b) => a.from.localeCompare(b.from));
export const reignAt = (date: string) => reigns.find((r) => r.from <= date && (r.to === null || r.to > date));
/** Lunar regnal year, as the chronicle counts it. */
export function regnalYear(date: string, r: Reign) {
  const a = toHijri(r.from), b = toHijri(date);
  return (b.y - a.y) - ((b.m < a.m || (b.m === a.m && b.d < a.d)) ? 1 : 0) + 1;
}

/** The Western years a Hijri year spans: [1370, 1371]. */
export function hyWestern(hy: number): [number, number] {
  return [+hijriToGameDate(hy, 1, 1).slice(0, 4), +hijriToGameDate(hy + 1, 1, 1).slice(0, 4) - (hijriToGameDate(hy + 1, 1, 1).slice(5) === "01-01" ? 1 : 0)];
}
export function hyLabel(hy: number) {
  const [a, b] = hyWestern(hy);
  return a === b ? `${a}` : `${a}–${String(b).slice(a.toString().slice(0, 2) === b.toString().slice(0, 2) ? 2 : 0)}`;
}
const hyStart = (hy: number) => hijriToGameDate(hy, 1, 1);
const hyEnd = (hy: number) => hijriToGameDate(hy + 1, 1, 1);

export const savesByHy = new Map<number, number>();
snapshots.forEach((s) => { const y = toHijri(s.date).y; savesByHy.set(y, (savesByHy.get(y) ?? 0) + 1); });

/** Stretches of more than five years between one save and the next. */
export const silences = saveDates.slice(1).map((d, i) => ({ from: saveDates[i], to: d }))
  .filter((g) => Date.parse(g.to) - Date.parse(g.from) > 5 * 365.25 * 864e5);

/* ------------------------------------------------------------ canons */

/** A book is open during a Hijri year if any of that year falls between its start and end. */
export const bookOpenIn = (b: Book, hy: number) => b.era.start < hyEnd(hy) && (b.era.end == null || b.era.end >= hyStart(hy));
/** "Here begins" / "Here ends" of a book in a Hijri year, if either falls in it. */
export const beginsIn = (b: Book, hy: number) => b.era.start >= hyStart(hy) && b.era.start < hyEnd(hy);
export const endsIn = (b: Book, hy: number) => b.era.end != null && b.era.end >= hyStart(hy) && b.era.end < hyEnd(hy);

export const canons: Canon[] = (() => {
  const groups: Leaf[][] = [];
  let cur: Leaf[] = [];
  for (const l of leaves) {
    cur.push(l);
    if (l.book.closed && l === l.book.last) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);
  return groups.map((ls, ci) => {
    const bs = [...new Set(ls.map((l) => l.book))].sort((a, b) => a.era.start.localeCompare(b.era.start) || a.n - b.n);
    const hy0 = ls[0].hy, hy1 = ls[ls.length - 1].hy;
    const rows: CanonRow[] = [];
    let gap: number | null = null;
    const flush = (until: number) => {
      if (gap === null) return;
      let saves = 0;
      for (let y = gap; y <= until; y++) saves += savesByHy.get(y) ?? 0;
      rows.push({ kind: "lacuna", hy0: gap, hy1: until, saves });
      gap = null;
    };
    for (let y = hy0; y <= hy1; y++) {
      for (const r of reigns) if (r.hy === y && y > hy0) { flush(y - 1); rows.push({ kind: "reign", reign: r }); }
      const cells = bs.map((b) => ls.filter((l) => l.book === b && l.hy === y));
      if (cells.every((c) => c.length === 0)) { if (gap === null) gap = y; continue; }
      flush(y - 1);
      rows.push({ kind: "year", hy: y, cells });
    }
    flush(hy1);
    return { n: ci + 1, books: bs, leaves: ls, hy0, hy1, rows, reignAt: undefined, reignAtStart: reignAt(ls[0].entry.date) };
  });
})();
export const canonOf = (l: Leaf) => canons.find((c) => c.leaves.includes(l))!;

/* ------------------------------------------------------------ reading order */

export type Catch =
  | { kind: "leaf"; label: string; color: string; leaf: Leaf; follow: "codex" | "book" | "both" }
  | { kind: "opening"; label: string; color: string; book: Book }
  | { kind: "closed"; label: string; color: string }
  | { kind: "continues"; label: string; color: string }
  | { kind: "end"; label: string; color: string };

/** The catchwords at the foot of a leaf: the next leaf of the codex, and the next of its own book. */
export function catchwordsFor(l: Leaf): Catch[] {
  const next = leaves[l.n] as Leaf | undefined;
  const nextInBook = l.book.leaves[l.bn] as Leaf | undefined;
  const out: Catch[] = [];
  if (next && next === nextInBook) out.push({ kind: "leaf", label: `Next leaf, and next in ${l.book.name.replace(/^The /, "the ")}`, color: l.book.color, leaf: next, follow: "both" });
  else {
    if (next) {
      if (next.book.first === next && next.book !== l.book) out.push({ kind: "opening", label: `Next in the codex: ${next.book.name} begins`, color: next.book.color, book: next.book });
      else out.push({ kind: "leaf", label: `Next leaf · ${next.book.name.replace(/^The /, "the ")}`, color: next.book.color, leaf: next, follow: "codex" });
    }
    if (nextInBook) out.push({ kind: "leaf", label: `Next in ${l.book.name.replace(/^The /, "the ")}`, color: l.book.color, leaf: nextInBook, follow: "book" });
    else if (l.book.closed) out.push({ kind: "closed", label: `${l.book.name} is closed. Its ${l.book.leaves.length} leaves end here; the codex goes on.`, color: l.book.color });
    else out.push({ kind: "continues", label: `${l.book.name} continues, written as it happens. Its next leaf is not yet written.`, color: l.book.color });
  }
  if (!next) out.push({ kind: "end", label: "This is the last leaf bound. The book stands open here.", color: l.book.color });
  return out;
}

/** The books running beside this one: those whose spans overlap it. */
export const besides = (b: Book) => books.filter((x) => x !== b && x.era.start < (b.era.end ?? "9999") && (x.era.end ?? "9999") > b.era.start);

/* ------------------------------------------------------------ the closing verse */

export const SURAS = ["al-Fātiḥa", "al-Baqara", "Āl ʿImrān", "al-Nisāʾ", "al-Māʾida", "al-Anʿām", "al-Aʿrāf", "al-Anfāl", "al-Tawba", "Yūnus", "Hūd", "Yūsuf", "al-Raʿd", "Ibrāhīm", "al-Ḥijr", "al-Naḥl", "al-Isrāʾ", "al-Kahf", "Maryam", "Ṭā Hā", "al-Anbiyāʾ", "al-Ḥajj", "al-Muʾminūn", "al-Nūr", "al-Furqān", "al-Shuʿarāʾ", "al-Naml", "al-Qaṣaṣ", "al-ʿAnkabūt", "al-Rūm", "Luqmān", "al-Sajda", "al-Aḥzāb", "Sabaʾ", "Fāṭir", "Yā Sīn", "al-Ṣāffāt", "Ṣād", "al-Zumar", "Ghāfir", "Fuṣṣilat", "al-Shūrā", "al-Zukhruf", "al-Dukhān", "al-Jāthiya", "al-Aḥqāf", "Muḥammad", "al-Fatḥ", "al-Ḥujurāt", "Qāf", "al-Dhāriyāt", "al-Ṭūr", "al-Najm", "al-Qamar", "al-Raḥmān", "al-Wāqiʿa", "al-Ḥadīd", "al-Mujādila", "al-Ḥashr", "al-Mumtaḥana", "al-Ṣaff", "al-Jumuʿa", "al-Munāfiqūn", "al-Taghābun", "al-Ṭalāq", "al-Taḥrīm", "al-Mulk", "al-Qalam", "al-Ḥāqqa", "al-Maʿārij", "Nūḥ", "al-Jinn", "al-Muzzammil", "al-Muddaththir", "al-Qiyāma", "al-Insān", "al-Mursalāt", "al-Nabaʾ", "al-Nāziʿāt", "ʿAbasa", "al-Takwīr", "al-Infiṭār", "al-Muṭaffifīn", "al-Inshiqāq", "al-Burūj", "al-Ṭāriq", "al-Aʿlā", "al-Ghāshiya", "al-Fajr", "al-Balad", "al-Shams", "al-Layl", "al-Ḍuḥā", "al-Sharḥ", "al-Tīn", "al-ʿAlaq", "al-Qadr", "al-Bayyina", "al-Zalzala", "al-ʿĀdiyāt", "al-Qāriʿa", "al-Takāthur", "al-ʿAṣr", "al-Humaza", "al-Fīl", "Quraysh", "al-Māʿūn", "al-Kawthar", "al-Kāfirūn", "al-Naṣr", "al-Masad", "al-Ikhlāṣ", "al-Falaq", "al-Nās"];
/** "9:41" → { sura: 9, from: 41, to: 41, name: "al-Tawba" } */
export function parseVerse(v?: string) {
  const m = v ? /^(\d+):(\d+)(?:-(\d+))?$/.exec(v) : null;
  if (!m) return null;
  return { sura: +m[1], from: +m[2], to: +(m[3] ?? m[2]), name: SURAS[+m[1] - 1] ?? `Sura ${m[1]}` };
}
export const verseCite = (v?: string) => { const p = parseVerse(v); return p ? `${p.name} ${v}` : null; };

/* ------------------------------------------------------------ dates */

export function dualDate(date: string) {
  const h = toHijri(date);
  return `${h.d} ${HIJRI_MONTHS[h.m - 1]} ${h.y} AH`;
}

/* ------------------------------------------------------------ the reader's ribbon (this browser only) */

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage blocked: the codex works without it */ } },
};
export const ribbon = { get: () => store.get("codex.ribbon"), set: (addr: string) => store.set("codex.ribbon", addr) };
/** Which catchword the reader last followed, so it can be put first next time. */
export const follow = { get: () => (store.get("codex.follow") === "book" ? "book" : "codex") as "book" | "codex", set: (v: "book" | "codex") => store.set("codex.follow", v) };
