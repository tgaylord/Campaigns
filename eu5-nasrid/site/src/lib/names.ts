/*
 * The names switch: the chronicle's own names (Ishbīliya, Qashtāla, the umarāʾ) or plain ones (Seville,
 * Castile, the nobles). People keep their names either way. The choice is per browser; changing it
 * re-renders the page (App keys the page on it), so plain functions here can read it directly.
 */
import { places, countries, type Place, type Country } from "./data";

import { nameMode } from "./mode";
export { nameMode, setNameMode, onNameMode, type NameMode } from "./mode";

type PlainPlace = Place & { namePlain?: string };
export const plainOf = (p: Place) => (p as PlainPlace).namePlain ?? p.nameGame;
/** A place's name in the current mode. */
export const placeLabel = (p: Place) => (nameMode() === "plain" ? plainOf(p) : p.name);
/** A realm's name in the current mode (the chronicle's form, or the plain one). */
export const countryLabel = (c: Pick<Country, "name" | "nameChronicle">) => (nameMode() === "plain" ? c.name : c.nameChronicle);

/** The court's words and their plain equivalents, singular and plural forms included. */
export const TERMS: { court: string; plain: string; gloss: string }[] = [
  { court: "umarāʾ", plain: "nobles", gloss: "the nobility, the great houses (the game's nobles estate)" },
  { court: "ʿulamāʾ", plain: "clergy", gloss: "the learned men of the faith: judges, jurists, teachers (the clergy estate)" },
  { court: "dīwān al-inshāʾ", plain: "chancery", gloss: "the chancery, where the crown's letters and decrees were written" },
  { court: "dīwān", plain: "cabinet", gloss: "the council of state (the game's cabinet)" },
  { court: "Jamāʿa", plain: "assembly", gloss: "the assembly of the estates (the game's parliament)" },
  { court: "ṭāʾifas", plain: "taifas", gloss: "subject kingdoms ruled by vassal dynasties under the Emperor" },
  { court: "ṭāʾifa", plain: "taifa", gloss: "a subject kingdom ruled by a vassal dynasty under the Emperor" },
  { court: "dhimmī", plain: "dhimmī", gloss: "the protected peoples, Jews and Christians living under Muslim rule (an estate)" },
];

/* ------------------------------------------------------------ rewriting story text */

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** Spellings the prose uses that differ from the gazetteer's. */
const ALIASES: { [spelling: string]: string } = { "Ishbīliyya": "ishbiliyya", "Jarghal": "jarghal" };
let swap: { re: RegExp; map: Map<string, string> } | null = null;
function swapTable() {
  if (swap) return swap;
  const map = new Map<string, string>(); // lower-cased court form → plain form
  const add = (from: string, to: string) => { if (from && to && from !== to && !map.has(from.toLowerCase())) map.set(from.toLowerCase(), to); };
  for (const p of places) add(p.name, plainOf(p));
  for (const [s, id] of Object.entries(ALIASES)) { const p = places.find((x) => x.id === id); if (p) add(s, plainOf(p)); }
  const noThe = (s: string) => s.replace(/^the /i, "");
  for (const c of countries) {
    // a dynasty's name ("Banū Marīn") reads badly as a country in running text; the margin translates those
    if (!/^Banū |^Naṣrid /.test(c.nameChronicle)) add(noThe(c.nameChronicle), noThe(c.name));
    for (const r of c.renamed ?? []) if (!/^Banū /.test(r.nameChronicle)) add(noThe(r.nameChronicle), noThe(r.name));
  }
  // an office's proper name stays as the chronicle gives it, since the prose glosses it there
  for (const t of TERMS) if (t.court !== "dīwān al-inshāʾ") add(t.court, t.plain);
  const keys = [...map.keys()].sort((a, b) => b.length - a.length).map(esc);
  // a court word that begins an office's proper name (Dīwān al-Inshāʾ, Dīwān al-Mustakhlaṣ) is left alone
  swap = { re: new RegExp(`(?<![\\p{L}\\p{M}])(${keys.join("|")})(?![\\p{L}\\p{M}])(?!\\s+al-)`, "giu"), map };
  return swap;
}

/** Rewrite the names in a piece of the chronicle's HTML for the current mode (text only, never tags). */
export function namesHtml(html: string): string {
  if (nameMode() === "court") return html;
  const { re, map } = swapTable();
  // a link to a place takes the place's plain name outright, whatever spelling the prose used
  html = html.replace(/(<a [^>]*data-kind="place" data-id="([^"]+)"[^>]*>)([^<]*)(<\/a>)/g, (all, open: string, id: string, _t: string, close: string) => {
    const p = places.find((x) => x.id === id);
    return p ? `${open}${plainOf(p)}${close}` : all;
  });
  return html.replace(/(<[^>]+>)|([^<]+)/g, (all, tag: string | undefined, text: string | undefined) =>
    tag ? tag : (text ?? "").replace(re, (m) => {
      const to = map.get(m.toLowerCase()) ?? m;
      return /^\p{Lu}/u.test(m) ? cap(to) : to;
    }));
}
