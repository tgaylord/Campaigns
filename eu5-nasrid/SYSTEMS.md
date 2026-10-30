# Campaign Systems — The Nasrid Campaign (EU5)

Working rules for the Granada campaign. Every chat in this Project should read this before touching saves, the repo or the story log.

**Canonical copy:** `tgaylord/Campaigns` → `eu5-nasrid/SYSTEMS.md`. The copy in the Claude Project's docs is a mirror. If the two disagree, the repo wins.

---

## 1. The campaign

| | |
|---|---|
| Game | Europa Universalis V, patch 1.4 "Rio Salado" |
| DLC | Across the Pillars (plus whatever else is owned) |
| Country | Granada (`GRA`), Nasrid dynasty, 1 April 1337 start |
| Mode | **Non-Ironman.** Ordinary compressed saves, read with the shared decoder; mods and save patches allowed; no achievements |
| Mods | Playset "Granada": Community Mod Framework, Free Console Access, National Destinies, Custom Nation Designer Revived (for custom vassals; built for 1.3, test it before first use). **Not** Oikoumenē: it overwrites 64 of 1.4's place-name files and seven language files, and its ship names break in 1.4. Revisit before the first colony, and once added, keep it (§10). |
| Long arc | Survive and win the Battle for the Strait → form Al-Andalus → Golden Century (Andalusi path) → colonial empire |

### Strategic anchors (from eu5db 1.4.5)
- **Battle for the Strait, Granada win:** independent; owns or has subjects covering the Granada, Andalusia and Murcia areas; influence over Granada between −50 and +50; Granadan sovereignty above 50. It goes to a neutral outcome if the Age of Discovery arrives first.
- **Protection:** every Granadan location has −500% war score efficiency for 50 years after the situation starts.
- **Al-Andalus has two routes, both giving the same `ADU` tag:**
  - Restored version (Strait winner): 25% of Iberia, at peace.
  - Classic version (if the Strait is lost): 75% of Iberia, with every Iberian location under Muslim or our subjects' rule.
- **Andalusia unlocks:** Gold Caravan; Crown of al-'Andalus (Golden Century action); Islamic Golden Century colonial track. That track has Wealth of the Sahel at 25, The Golden Road at 50, Da'wa Colonial Administration at 75, and Mastery of the Sudan plus Integrate Colonial Charter at 100.

---

## 2. Architecture: three layers

1. **Campaign data**, generated from saves. These are checkpoint snapshots plus a running event log. They're facts, never invented.
2. **The story log**, written by hand. This is the point of truth for the narrative: Nasrid court chronicle entries plus out-of-character notes, each tagged with dates and with links to people, places, wars and eras.
3. **The views**, a static website built from layers 1 and 2. They can be redesigned freely without touching the history.

**Home:** the public GitHub repo `tgaylord/Campaigns`, published with GitHub Pages at an unlisted address, `tgaylord.github.io/Campaigns/eu5-nasrid/`. It's just for Trent, so there's no need to design for other readers.

### Repo layout
```
Campaigns/
  CLAUDE.md               ← repo-wide rules every session follows
  shared/                 ← shared data model, docs, transition docs
  eu5-nasrid/
    SYSTEMS.md            ← this document
    data/
      snapshots/          ← one JSON per checkpoint, e.g. 1337-04-01.json
      events/             ← event log, one JSON array per year (1337.json …)
      eras.json           ← the books of the chronicle
      people.json         ← characters: Nasrids, viziers, generals, notables
      gazetteer.json      ← places: game name ↔ Arabic name, coordinates, held from/to
      wars.json           ← wars, sides, goals, war score over time
    story/                ← the story log: one Markdown file per entry
    tools/                ← save parser, Hijri converter, map builder
    map/                  ← phase 2: geometry built from game map files
    site/                 ← the static site source
  .github/workflows/      ← Pages build + deploy
```
Each campaign gets its own top-level folder; Rome or any other campaign would sit beside `eu5-nasrid/`. Folders are created as they're first needed.

---

## 3. Saves: getting them to Claude

- **Source:** the gaming PC (Windows), the game's `save games` folder under `Documents\Paradox Interactive\Europa Universalis V`. That computer has to be linked to the chat (open the chat in the Claude desktop app there), with this folder connected.
- **Format:** ordinary compressed saves (tens of MB, no zipping). The shared 1.4 decoder (`shared/tools/eu5-save-decoder-1.4/`) turns them into text (checked against the start saves: identical content). The 1.3.11 decoder beside it crashes on 1.4 saves. Text saves via debug mode are only needed when the game version changes: save once as text and once normally at the same moment, so the decoder can be checked again.
- **Naming:** `GRA_YYYY_MM_DD_short-slug`, e.g. `GRA_1340_10_30_rio-salado`. The game's own `SP_GRA_YYYY_MM_DD_…` names also work.
- **Don't switch playsets inside the game.** Quit and relaunch instead: the one crash so far came after eight in-game playset reloads in a row.
- **When to save a checkpoint:**
  - the start of a war, and its peace
  - a ruler's death or accession; a regency
  - Strait milestones: influence crosses ±50 or 0; sovereignty crosses 50; subject status changes
  - a major reform or law, or an estate privilege granted or revoked
  - forming Al-Andalus; Golden Century thresholds
  - otherwise about every 10–15 in-game years
- **Not every save is a checkpoint.** A save that meets none of the triggers above is a *reading*: Claude decodes it, logs what it shows as events (sourced "save of <date>"), and adds no snapshot, extracted file or realm map. Snapshots are what the timelines plot (the Atlas slider, the Strait's banners, the Council's trails, the Provinces), so they should mark turning points, not every glance at the game. While saves come quickly, a reading is the default; when one changes the story enough (by Trent's account or by what it shows), it becomes a checkpoint after all. The checkpoints already recorded stay.
- **Patches:** when a save edit is needed, Claude writes a verified patch script (with SHA-256 checks) and Trent runs it. Claude never overwrites a save, and works on copies only.

---

## 4. Campaign data

### Snapshot (one per checkpoint)
- **Date:** Gregorian (from the game) and Hijri (computed).
- **Ruler, heir, consort, regent;** the cabinet and the head of the cabinet.
- **Realm:** locations, areas and provinces held; capital; subjects and ṭā'ifas. For each location the extracted facts keep its control, development, prosperity, cultural and religious unity, goods, tax (actual, possible, by estate), core and integration, peoples, faiths and buildings; the Provinces hall reads them straight from `data/extracted/`. Names fall back to the game's (`tools/place_names.py`, data/map/names.json) where the gazetteer has none.
- **Population:** total, by culture, by religion.
- **Estates:** power and satisfaction for each estate, crown power, privileges held. Satisfaction, gold and tax rates come from the save; **share of power does not** (the game computes it as it runs). It comes from Trent's estate power panel where he has one, and otherwise from `tools/estate_power.py`, calibrated on the latest reading and marked as estimated on the site. A single estate's tooltip is enough for a partial reading: that estate is shown as read and the rest are scaled to the tooltip's total. Reforms, privileges and modifiers the save names but doesn't define are looked up on eu5db.com (1.4.5) and cited in the event or model entry.
- **Government:** laws, reforms, privileges (with the date each was granted), societal values, the parliament and each estate's agenda in it, policies, bureaucracies, political influence. What each of these does comes from the game's own definition files, through `tools/government_catalog.py` (data/government-catalog.json); rerun it when a checkpoint brings one not seen before. A privilege granted or revoked, or a law changed, gets an event.
- **Economy:** treasury, income and expenses, debt, main goods.
- **Military:** levies, regiments, fleets and their locations. Named armies come later (see §5).
- **Diplomacy:** overlord, allies, rivals, truces, active wars with their war score.
- **The Strait:** influence over Granada, Granadan sovereignty, years as a subject (overall, under Castile, under Morocco).
- **The court (for the views):** `cabinet` as `{person, role}` pairs, `crownPower`, `politicalInfluence`, `allies` and `rivals`.
- **Golden Century (later):** European and Colonial Dominance, flashpoint meter, Grand Alliance members.

### Event log entries
Each entry has a date, a type, references to the entities involved and source details (which checkpoint, or the player's account). The types are:
- `war_declared`, `battle`, `siege`, `peace`
- `ruler_change`, `birth`, `death`, `marriage`
- `estate_change`, `law_change`, `reform`
- `territory_change`
- `strait_change`, `gc_change`
- `situation`, `formable`
- `player_note`

### Records
- **People:** `nameArabic` (in Arabic script), `father`, `reigns` (`from`/`to`), born and died, roles, dynasty.
- **Places:** `nameArabic`, `nameGame`, `lat`/`lon` (for the charts until the real map exists), `held` periods.
- Anything made up for testing carries `"sample": true`; the site flags it, and the first real checkpoint replaces it.

### Rules
- **Strength means men under arms.** When comparing sides, count regulars plus raised levies: the sum of each country's army subunits' strength (a missing strength is full; 1.0 is 1,000 men). The manpower pool only reinforces regulars, so it is never the measure of an army (Trent, October 1368). In the game this is the Army Strength figure on the war screen (levies / regulars per country). A save taken before levies are called up shows only the regulars, so for a war in progress Trent's war screen or a later save is the better source.
- Facts come from saves, or from Trent's account labelled as his account. Nothing is invented.
- If a save and the story disagree, the save is right about facts and the story gets corrected. The story decides voice, emphasis and interpretation.

---

## 5. The story log

- **Voice:** a Nasrid court chronicle in the manner of Ibn al-Khatib. It should be **more flavourful than the Rome chronicle**: ornate where the moment earns it, with Qur'anic and poetic flourishes, the court's own view of its enemies, and honorifics. Out-of-character notes stay rare and short.
- **Dates:** Hijri first, Gregorian beside it, e.g. *15 Rajab 741 AH (4 January 1341)*. The game runs in Gregorian, so Hijri dates are computed with the tabular (arithmetic) Islamic calendar and may be off by a day or two.
- **Place names:** Arabic forms with **full diacritics** are the baseline in the chronicle text (Gharnāṭa, Mālaqa, al-Mariyya, Qurṭuba, Ishbīliya …).
  - With Oikoumenē, the game files usually supply these names already. Claude takes them from the game where they exist.
  - When the game name isn't in that form (a place Trent renamed, a name the mod lacks, or a name visible only in screenshots), Claude flags it and uses the diacritic form in the text.
  - The gazetteer maps every place to its game name.
- **Eras (the books):** a book follows events, not one ruler's life (the reigns have their own place in the House of Naṣr and the Long Scroll). Books may overlap; the Long Scroll gives overlapping books their own rows. Each one is written in a single pass once it closes, with live entries for the current books. So far:
  - Book I, *The Mending of the State* (كتاب الإصلاح), 1 April 1337 – 16 October 1346: the calm before the storm, from tributary and debt to the Jamāʿa of 1344 and the debt paid; it ends the day Morocco declares war again.
  - Book II, *The Balance* (كتاب الميزان), 1 August 1346 – 14 September 1370: Granada on the scales between the three crowns and the Marīnids. It closed when the game's Battle for the Strait situation ended with *The Throne of Granada Endures* (Trent's rule: independence alone wasn't enough while the Marīnids held the north shore).
  - Book III, *The Pestilence* (كتاب الوباء), 1 August 1346 – 27 January 1352: the Black Death, from the first rumours and the hospitals to the day it left the last town of the realm. It ran beside Book II. Its central thread is the demographic reshaping of Granada (an urban realm that lost its cities, burghers and scholars hardest). Trent closed it in 1356 although the game's situation was still open, since no one had died of it in years.
  - Book IV, *The Call* (كتاب الدعوة), from late 1356: education and the reconversion of al-Andalus as the Emirate expands: roads, libraries, the return of Islam and Andalusī culture to Qurṭuba and the lands purged of them under Castile. It ran beside Book II until 1370 and now goes on alone.
- **Battles:** every battle and siege goes in the war tables. Only those that move war score by **5 or more** get prose in the chronicle.
- **Standing threads:**
  - **The crown and the estates**, a running thread. Each swing in power or privilege is recorded and explained.
  - **The Strait**: the balance between Castile and Morocco.
  - **Armies:** none at the start. Named-army tracking begins once Granada has a significant professional force, and that moment becomes part of the story of the Nasrid state. A destroyed army stays dead unless it's revived in-game.
- **File format:** one Markdown file per entry in `story/`, with front matter for the id, dates, era, title, kind (`chronicle` or `ooc`) and linked people, places and wars. An `ooc` note can name the chronicle entry it comments on with `about: <entry-id>`; otherwise it attaches to the nearest earlier entry. Either way it appears as a gloss in that folio's margin.

---

## 6. The views (the site)

The site should feel like being at the Naṣrid court, not like reading a dashboard. The ground is night lapis with a faint zellij lattice; documents are parchment folios in iron-gall ink with cinnabar rubrics and gilt initials; maps are drawn in the manner of the Catalan Atlas (1375), with wind lines, a 32-point rose and Arabic region names. Each hall has an Arabic name beside its English one.

| Hall | What it shows |
|---|---|
| **The Atlas** (الأطلس), the home page | A full-screen portolan chart of the realm at any checkpoint: held places as towers, a medallion with the ruler and the date, and a drawer with the state of the realm and what changed since the last checkpoint. |
| **The Chronicle** (الأخبار) | A *fihris* (table of books) by era, and each entry as a folio with an illuminated initial, Trent's own notes as glosses in the margin, the people and places it names, and page turns (arrow keys work). |
| **The Strait** (الزقاق) | The Battle for the Strait as a ship's course between the shores of Castile and Morocco: height of the banner is sovereignty, position in the channel is influence; the events that moved it; the win conditions as they stand. |
| **The Council** (الديوان) | A hundred-seat hemicycle split as power is split, the crown at the centre; each estate's mood; the charters of the estates (every privilege held, ranked by the power it gives, with its effects from the game files) and the reforms of the state; the Jamāʿa's agenda; where the realm stands on each societal value, with a trail of earlier checkpoints; every law with its alternatives; power across the reigns as a stream; satisfaction as a grid. |
| **The Provinces** (الكور) | Granada's own lands at any checkpoint, by area and province (the *kūra*): a map coloured by control, wealth, untaxed wealth, peoples, faiths, integration or development; area totals; the locations where a firmer grip would pay most; and a table of every location with its rank, people, peoples and faiths, control, development, core or conquered, wealth and tax base. In the game's own terms, a location's *wealth* is what its goods and buildings earn at market (the save's `possible_tax`), and its *tax base* is wealth × control (the save's `tax`); the rest goes to the estates untaxed. |
| **The Long Scroll** (الدرج) | The whole campaign on one sideways roll: books, reigns, wars, the Strait, the estates, chronicle entries and events, year by year. |
| **The Court** (البلاط) | The sultan on his throne, the heir and regent, the dīwān and who joined or left it, crown power and political influence, friends and enemies of the throne. |
| **House of Naṣr** (بنو نصر) | The family tree as roundels, sultans in gold with their reign years in both calendars, and the servants of the house. |
| **Wars** (الحروب) | Each war with its tide of war score; a war's page has the tide, a chart of where it was fought, and every battle and siege with its two hosts drawn man by man (one figure for 500). |
| **Gazetteer** (البلدان) | Every place on a chart and as a tile, filterable by held, lost and never held; each place's page has its neighbourhood, its time in Naṣrid hands, how it stood at the latest checkpoint that held it (people, faiths, control, tax, buildings) and every mention. |

Every person, place and war name anywhere on the site shows a card on hover and links to its page.

**Next:**
- The map already comes from the game's own files (the Strait theatre, about 1,000 locations). Still to add: battle sites, and further frames as the realm grows.
- The colonies, and an armies view once tracking starts.

**Stack:** React, React Router, Vite and D3 in `site/`, built to a static site.
- `site/scripts/build-data.mjs` reads `data/` and `story/`, checks every record against its schema and every reference (person, place, war, era, story entry), renders the Markdown and writes the bundle the site reads. **A bad record or a broken reference fails the build.**
- A war page can carry a devastation reading (`tools/devastation.py`, `data/devastation/<war-id>.json`). It shows a map of population change by town between a save before the fighting and the peace save, with the towns looted in between, and tables by land and by the worst-hit towns. The first covers 1359–1366, on the War of Independence.
- The Atlas and every small chart are drawn from the game's own map: `tools/build_map.py` traces each location from `locations.png`, and realm outlines are rebuilt for each checkpoint.
- Hijri dates come from `site/src/lib/hijri.ts`.
- Story entries link to records with `[name](person:id)`, `place:`, `war:` and `era:`.
- See `site/README.md` for running it locally and for the story-entry format.

**Publishing:** the root workflow (`.github/workflows/pages.yml`) builds every campaign's site on each push to `main` and deploys them to GitHub Pages. Pages has to be set to deploy from GitHub Actions in the repo settings.

---

## 7. A session, step by step

1. Trent plays and makes an ordinary checkpoint save (compressed). If the estates matter at that checkpoint, he screenshots the estate power panel at the same moment, since the save doesn't store the shares.
2. He opens the chat on the gaming PC (or links that computer) and gives his account of what happened, including anything screenshots show that a save can't. When a screenshot shows an event with several options, the option whose tooltip is open is the one he picked (nine times in ten; he says when it isn't).
3. Claude parses the save into a snapshot and new events, then checks them against the previous snapshot.
4. Claude drafts the story entries and Trent corrects them.
5. Claude commits the data and story to the repo, and the site rebuilds.

---

## 8. Subjects and saves

- Vassals are normally **counties or duchies**, unless a specific exception is agreed.
  - The Script Runner rank fix (`set_country_rank = country_rank:rank_duchy`) was a workaround for the custom-nation mod in Rome. It's a tool to reach for if that bug shows up again, not a standing rule.
- Claude only ever works on copies of saves, never the originals.
- **Ṭāʾifas and other subjects:** released through the game's own tags where one exists (VAL, MUC), so they keep their historical claims. The extractor records each subject's type, rank, state culture and faith, ruler and lands; the Provinces hall shows them beside Granada's own, and the Atlas draws them in a lighter gold. A place a subject holds stays "in Naṣrid hands" in the gazetteer, with `via` naming the subject. Subject loyalty isn't in the save (the game computes it), so it comes from Trent's readings and is stored on the snapshot's `subjects` entry. Rulers of subjects who convert keep the Christian names the game gives them, so they stay recognisable.

---

## 9. Repo scope

This campaign follows the repo-wide rules in `/CLAUDE.md`:
- A Nasrid session writes only inside `eu5-nasrid/`.
- Changes to anything under `shared/` need Trent's explicit approval.
- Ideas worth spreading to other campaigns go through a transition doc in `shared/transitions/`.

---

## 10. Open questions

1. ~~Mod list~~: settled (§1).
2. ~~Publishing~~: settled. The repo is public and the site is published to an unlisted Pages address.
3. ~~Decoder for 1.4~~: settled. A separate shared tool, `shared/tools/eu5-save-decoder-1.4/`; the 1.3.11 one stays unchanged for Rome.
4. Place names the game files leave doubtful: Órgiva (the game has "Yuz Aryuba"), Olvera (no Arabic script), and the Arabic script for Gérgal, Mojácar, Vélez-Rubio, Adra, Íllora, Píñar, Antequera and Vélez-Málaga, which the chronicle supplies itself. Each is marked in `data/gazetteer.json`.
5. ~~Heir~~: settled. Faraj ibn Ismāʿīl, Yūsuf's elder half-brother, is heir from the August 1337 save.
6. ~~Deriving estate power~~: settled. `tools/estate_power.py` rebuilds the shares from the save, within about a point uncalibrated; readings from the estate power panel calibrate it (see `tools/README.md`).
