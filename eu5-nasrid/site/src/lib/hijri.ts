/**
 * Calendar conversion for the chronicle.
 *
 * The game labels dates in the Western calendar. Following historians' usage,
 * a game date before 15 October 1582 is read as Julian, and from that day on as
 * Gregorian, so Hijri dates line up with the historical sources.
 *
 * Hijri dates use the tabular (arithmetic) Islamic calendar, civil epoch
 * 16 July 622 Julian. Observed months could differ by a day or two: the battle of
 * the Río Salado (30 October 1340) comes out as 8 Jumādā al-Ūlā 741 here, where
 * the sources give the 7th; the fall of Granada (2 January 1492) as 1 Rabīʿ
 * al-Awwal 897 rather than the 2nd.
 */

export type YMD = { y: number; m: number; d: number };

const ISLAMIC_EPOCH = 1948439.5; // JD of 1 Muharram 1 AH (civil)

/** Parse "YYYY-MM-DD" (also accepts "YYYY.M.D"). */
export function parseDate(s: string): YMD {
  const [y, m, d] = s.split(/[-.]/).map(Number);
  return { y, m, d };
}

function gregorianToJd({ y, m, d }: YMD): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
    - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045 - 0.5;
}

function julianToJd({ y, m, d }: YMD): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083 - 0.5;
}

/** Julian Day of a game date (Julian before 1582-10-15, Gregorian after). */
export function gameDateToJd(date: YMD): number {
  const reform = date.y > 1582 || (date.y === 1582 && (date.m > 10 || (date.m === 10 && date.d >= 15)));
  return reform ? gregorianToJd(date) : julianToJd(date);
}

function islamicToJd(y: number, m: number, d: number): number {
  return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + ISLAMIC_EPOCH - 1;
}

export function jdToHijri(jd: number): YMD {
  jd = Math.floor(jd) + 0.5;
  const y = Math.floor((30 * (jd - ISLAMIC_EPOCH) + 10646) / 10631);
  const m = Math.min(12, Math.ceil((jd - (29 + islamicToJd(y, 1, 1))) / 29.5) + 1);
  const d = jd - islamicToJd(y, m, 1) + 1;
  return { y, m, d };
}

export function toHijri(game: string | YMD): YMD {
  const date = typeof game === "string" ? parseDate(game) : game;
  return jdToHijri(gameDateToJd(date));
}

export const HIJRI_MONTHS = [
  "Muḥarram", "Ṣafar", "Rabīʿ al-Awwal", "Rabīʿ al-Thānī",
  "Jumādā al-Ūlā", "Jumādā al-Ākhira", "Rajab", "Shaʿbān",
  "Ramaḍān", "Shawwāl", "Dhū al-Qaʿda", "Dhū al-Ḥijja",
];

export const HIJRI_MONTHS_AR = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

export const WESTERN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "7 Jumādā al-Ūlā 741" */
export function formatHijri(game: string | YMD, opts: { year?: boolean } = {}): string {
  const h = toHijri(game);
  const base = `${h.d} ${HIJRI_MONTHS[h.m - 1]}`;
  return opts.year === false ? base : `${base} ${h.y}`;
}

/** "30 October 1340" */
export function formatWestern(game: string | YMD): string {
  const g = typeof game === "string" ? parseDate(game) : game;
  return `${g.d} ${WESTERN_MONTHS[g.m - 1]} ${g.y}`;
}

/** "7 Jumādā al-Ūlā 741 AH (30 October 1340)" */
export function formatDual(game: string): string {
  return `${formatHijri(game)} AH (${formatWestern(game)})`;
}

export function hijriYear(game: string): number {
  return toHijri(game).y;
}
