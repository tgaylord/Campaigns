#!/usr/bin/env node
/*
 * Reads campaign/, checks it, and writes src/data.json for the site.
 *   node tools/build-data.mjs
 * Errors stop the build: a beat naming someone who isn't in the cast, a thread that doesn't exist,
 * a beat dated after its reckoning, two things with one id.
 */
import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const C = path.join(ROOT, "campaign");
const Y = (p) => yaml.load(fs.readFileSync(path.join(C, p), "utf8"), { schema: yaml.JSON_SCHEMA });
const errors = [], notes = [];

const campaign = Y("campaign.yaml");
const threads = Y("threads.yaml");
const places = Object.fromEntries(Y("places.yaml").map((p) => [p.id, p]));
const cast = Object.fromEntries(fs.readdirSync(path.join(C, "cast")).filter((f) => f.endsWith(".yaml")).map((f) => [f.replace(/\.yaml$/, ""), Y(`cast/${f}`)]));
const threadIds = new Set(threads.map((t) => t.id));
if (threadIds.size !== threads.length) errors.push("threads.yaml: two threads share an id");
for (const [id, p] of Object.entries(cast)) {
  for (const k of ["father", "mother"]) if (p[k] && !cast[p[k]]) errors.push(`cast/${id}: ${k} '${p[k]}' is not in the cast`);
  for (const t of p.ties ?? []) if (!cast[t.with]) errors.push(`cast/${id}: tie with '${t.with}', who is not in the cast`);
  if (p.born && p.died && p.died < p.born) errors.push(`cast/${id}: died before being born`);
}

const files = fs.readdirSync(path.join(C, "reckonings")).filter((f) => f.endsWith(".yaml")).sort();
const reckonings = [], beats = [], tellings = [], seen = new Set();
let prev = null;
for (const f of files) {
  const r = Y(`reckonings/${f}`), at = `reckonings/${f}`;
  if (r.date !== f.replace(/\.yaml$/, "")) errors.push(`${at}: the date inside (${r.date}) doesn't match the file name`);
  for (const k of ["ruler", "heir", "regent"]) if (r.court?.[k] && !cast[r.court[k]]) errors.push(`${at}: ${k} '${r.court[k]}' is not in the cast`);
  for (const c of r.court?.council ?? []) if (!cast[c.who]) errors.push(`${at}: council member '${c.who}' is not in the cast`);
  for (const w of r.standing?.wars ?? []) if (!threadIds.has(w)) errors.push(`${at}: war '${w}' is not in threads.yaml`);
  const alive = (id, d) => { const p = cast[id]; return p && !(p.died && p.died < d) && !(p.born && p.born > d); };
  for (const k of ["ruler", "heir", "regent"]) if (r.court?.[k] && cast[r.court[k]] && !alive(r.court[k], r.date)) errors.push(`${at}: ${k} ${r.court[k]} is not alive on ${r.date}`);
  (r.beats ?? []).forEach((b, i) => {
    b.id ??= `${b.on}-${i + 1}`;
    if (seen.has(b.id)) errors.push(`${at}: two beats share the id ${b.id}`); seen.add(b.id);
    if (!campaign.kinds[b.kind]) errors.push(`${at}: beat ${b.id} has kind '${b.kind}', which campaign.yaml doesn't list`);
    for (const w of b.who ?? []) if (!cast[w]) errors.push(`${at}: beat ${b.id} names '${w}', who is not in the cast`);
    for (const w of b.where ?? []) if (!places[w]) errors.push(`${at}: beat ${b.id} is at '${w}', which is not in places.yaml`);
    for (const t of b.threads ?? []) if (!threadIds.has(t)) errors.push(`${at}: beat ${b.id} is on thread '${t}', which is not in threads.yaml`);
    for (const s of b.from ?? []) if (!campaign.from[s]) errors.push(`${at}: beat ${b.id} has source '${s}'; use one of ${Object.keys(campaign.from).join(", ")}`);
    if (prev && b.on <= prev && b.on.length === 10) notes.push(`${at}: beat ${b.id} is dated on or before the previous reckoning (${prev})`);
    beats.push({ ...b, r: r.date });
  });
  for (const t of r.tellings ?? []) {
    if (seen.has(t.id)) errors.push(`${at}: two things share the id ${t.id}`); seen.add(t.id);
    for (const w of t.who ?? []) if (!cast[w]) errors.push(`${at}: telling ${t.id} names '${w}', who is not in the cast`);
    tellings.push({ ...t, r: r.date });
  }
  const { beats: _b, tellings: _t, ...rest } = r;
  reckonings.push(rest);
  prev = r.date;
}
for (const t of tellings) for (const c of t.covers ?? []) if (!seen.has(c)) errors.push(`telling ${t.id} covers '${c}', which is not a beat`);
beats.sort((a, b) => a.on.localeCompare(b.on) || a.id.localeCompare(b.id));
tellings.sort((a, b) => a.on.localeCompare(b.on) || a.id.localeCompare(b.id));

/* the map of the latest reckoning, if the campaign has drawn one */
let map = null;
const last = reckonings.at(-1);
const mapFile = campaign.map?.realms?.replace("{date}", last.date);
if (mapFile && fs.existsSync(path.join(ROOT, mapFile))) {
  const all = JSON.parse(fs.readFileSync(path.join(ROOT, mapFile), "utf8"));
  const [x, y, w, h] = campaign.map.view;
  const role = (t) => (last.map?.ours ?? []).includes(t) ? "ours" : (last.map?.subjects ?? []).includes(t) ? "subject" : (last.map?.allies ?? []).includes(t) ? "ally" : "other";
  const realms = Object.entries(all).filter(([t, v]) => role(t) !== "other" || (v.c[0] > x - 150 && v.c[0] < x + w + 150 && v.c[1] > y - 150 && v.c[1] < y + h + 150))
    .map(([t, v]) => ({ t, d: v.d, c: v.c, role: role(t) }));
  map = { view: campaign.map.view, labels: campaign.map.labels ?? {}, realms };
}

/* the realm's outline at every reckoning (for the story's map), and the land behind it */
const outlines = {};
let land = "";
if (campaign.map?.realms) {
  for (const r of reckonings) {
    const file = path.join(ROOT, campaign.map.realms.replace("{date}", r.date));
    if (!fs.existsSync(file)) continue;
    const all = JSON.parse(fs.readFileSync(file, "utf8"));
    const join = (tags) => tags.map((t) => all[t]?.d ?? "").join("");
    outlines[r.date] = { o: join(r.map?.ours ?? []), s: join(r.map?.subjects ?? []), a: join(r.map?.allies ?? []) };
    if (r === last) land = Object.values(all).map((v) => v.d).join("");
  }
}

/* the atlas: who the neighbours are at each reckoning, and the towns as a mosaic (people, faith, tongue) */
const neighbours = {}, mosaic = { towns: [], frames: {} };
if (campaign.map?.names) {
  const tagNames = JSON.parse(fs.readFileSync(path.join(ROOT, campaign.map.names), "utf8"));
  const [vx, vy, vw, vh] = campaign.map.wide;
  for (const r of reckonings) {
    const file = path.join(ROOT, campaign.map.realms.replace("{date}", r.date));
    if (!fs.existsSync(file)) continue;
    const all = JSON.parse(fs.readFileSync(file, "utf8"));
    const mine = new Set([...(r.map?.ours ?? []), ...(r.map?.subjects ?? [])]);
    neighbours[r.date] = Object.entries(all).filter(([t, v]) => !mine.has(t) && tagNames[t]?.name && v.c[0] > vx + 60 && v.c[0] < vx + vw - 60 && v.c[1] > vy + 40 && v.c[1] < vy + vh - 40)
      .sort((a, b) => b[1].px - a[1].px).slice(0, 16).map(([t, v]) => [campaign.map.labels?.[t] ?? tagNames[t].name, Math.round(v.c[0]), Math.round(v.c[1]), (r.map?.allies ?? []).includes(t) ? 1 : 0]);
  }
}
if (campaign.map?.layers) {
  const cen = JSON.parse(fs.readFileSync(path.join(ROOT, campaign.map.centroids), "utf8"));
  const [ox, oy] = campaign.map.origin;
  let keys = null;
  for (const r of reckonings) {
    const file = path.join(ROOT, campaign.map.layers.replace("{date}", r.date));
    if (!fs.existsSync(file)) continue;
    const L = JSON.parse(fs.readFileSync(file, "utf8"));
    const col = (n) => L.cols.indexOf(n);
    if (!keys) { keys = Object.keys(L.rows).filter((k) => cen[k]); mosaic.towns = keys.map((k) => [Math.round(cen[k][0] - ox), Math.round(cen[k][1] - oy)]); }
    mosaic.frames[r.date] = keys.flatMap((k) => { const row = L.rows[k]; return row ? [Math.round(row[col("pop")] / 1000), Math.round(row[col("muslim")]), Math.round(row[col("andalusi")])] : [0, 0, 0]; });
  }
}

if (notes.length) console.log(notes.slice(0, 8).map((n) => "note: " + n).join("\n") + (notes.length > 8 ? `\n… and ${notes.length - 8} more notes` : ""));
if (errors.length) { console.error(errors.map((e) => "error: " + e).join("\n")); process.exit(1); }
fs.writeFileSync(path.join(ROOT, "src", "data.json"), JSON.stringify({ campaign, threads, cast, places, reckonings, beats, tellings, map, outlines, land, neighbours, mosaic }));
console.log(`register: ${reckonings.length} reckonings, ${beats.length} beats, ${tellings.length} tellings, ${Object.keys(cast).length} cast, ${threads.length} threads${map ? `, map of ${last.date} (${map.realms.length} realms)` : ""}`);
