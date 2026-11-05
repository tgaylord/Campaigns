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
      powers.json         ← the powers beyond the realm the chronicle follows, in circles
      world/              ← the world at each checkpoint: the great-power ladder, rulers, strength, ties
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
- **Format:** ordinary compressed saves (tens of MB, no zipping). The shared 1.4 decoder (`shared/tools/eu5-save-decoder-1.4/`) turns them into text (checked against the start saves: identical content). The 1.3.11 decoder beside it crashes on 1.4 saves. The game moved to 1.4.6 by the save of 1 November 1370; that save decoded, extracted and ran through every per-checkpoint tool without changes (no text save was made to compare against). It moved to 1.4.7 by the save of 8 July 1405, and again the decoder and every tool ran unchanged. Text saves via debug mode are only needed when the game version changes: save once as text and once normally at the same moment, so the decoder can be checked again.
- **Naming:** `GRA_YYYY_MM_DD_short-slug`, e.g. `GRA_1340_10_30_rio-salado`. The game's own `SP_GRA_YYYY_MM_DD_…` names also work.
- **One tag for the realm.** From 16 March 1375 the realm is al-Andalus, its sovereign styled *Emperor and Sultan of al-Andalus* (the game says Emperor; a claim to the caliphate is a distant possibility). The game gave the realm a new tag when it formed Al-Andalus on 16 March 1375 (GRA became ADU; the saves are named `SP_ADU_…` from then). The campaign's data keeps the realm as **GRA** throughout, so the timelines, maps and series run on unbroken: every tool reads the save's tags through `tools/realm_tags.py`, which maps ADU to GRA, and records the game's own tag beside it (`game_tag` in the extracted file, `gameTag` in the world file and the snapshot's source). The views take the realm's name and the sovereign's style for a date from the `renamed` list on GRA in `data/countries.json`; every new save is ADU, and a session that sees ADU anywhere reads it as this realm.
- **Don't switch playsets inside the game.** Quit and relaunch instead: the one crash so far came after eight in-game playset reloads in a row.
- **When to save a checkpoint:**
  - the start of a war, and its peace
  - a ruler's death or accession; a regency
  - Strait milestones: influence crosses ±50 or 0; sovereignty crosses 50; subject status changes
  - a major reform or law, or an estate privilege granted or revoked
  - forming Al-Andalus; Golden Century thresholds
  - otherwise about every 10–15 in-game years
- **Not every save is a checkpoint.** A save that meets none of the triggers above is a *reading*: Claude decodes it, logs what it shows as events (sourced "save of <date>"), and adds no snapshot, extracted file or realm map. Snapshots are what the timelines plot (the Atlas slider, the Strait's banners, the Council's trails, the Provinces), so they should mark turning points, not every glance at the game. While saves come quickly, a reading is the default; when one changes the story enough (by Trent's account or by what it shows), it becomes a checkpoint after all. The checkpoints already recorded stay.
- **Princes moved to a wife's court:** the game moves a husband to his wife's court when he marries, which took Prince Yūsuf to Aragon (by January 1394). Undone on 3 September 1398 in the Script Runner on the realm: `ruler = { every_child = { limit = { is_female = no is_heir = no } every_child = { limit = { is_female = no } move_country = root } move_country = root } }` (moves the ruler's non-heir sons and their sons home; drop the outer `move_country = root` to move only the grandsons). Check the wife's place in her own realm's succession first: Yūsuf's wife Caterina was heir of Aragon.
- **Historical capital after a capital move:** when the capital moved from Granada to Seville (November 1379) the game recorded no historical capital for al-Andalus, though other powers that moved have one; probably a side effect of the Al-Andalus formation. That switched off Granada's capital-only buildings (al-Ḥamrāʾ needs `counts_as_capital`). No script effect sets a historical capital, but `set_capital` does record the old seat: in the Script Runner on the realm, `set_capital = location:granada`, then `set_capital = location:sevilla`. Fixed this way on 3 May 1380 (the save shows `historical_capitals={2894}`). Check for it after any future capital move.
- **Patches:** when a save edit is needed, Claude writes a verified patch script (with SHA-256 checks) and Trent runs it. Claude never overwrites a save, and works on copies only.

---

## 4. Campaign data

### Snapshot (one per checkpoint)
- **Date:** Gregorian (from the game) and Hijri (computed).
- **Ruler, heir, consort, regent;** the cabinet and the head of the cabinet. The game bars the consort (the principal wife) from the cabinet; the chronicle treats her as a member of the dīwān anyway, by the strength of the harem, without a formal office (Trent, March 1375).
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
- **Truces aren't stored in the save,** only each relation's last peace and the war score it was signed at. The game's truce is 5 years plus 1.2 months per point of war score, rounded down and counted in calendar months from the peace (defines `TRUCE_YEARS` 5, `SCALED_TRUCE_YEARS` 10). Checked to the day against Trent's tooltips in November 1370: Castile and Portugal until 5 June 1375 (war score 42), Aragon until 2 June 1373 (28), Morocco and its subjects until 12 September 1382 (70). `tools/world_powers.py` computes them with fidelity by relevance (Trent, November 1370): every truce of Granada's; for the followed powers, only their truces with each other and with Granada; none for the rest of the world. The Kingdoms hall shows them on each dispatch and in *Truces to watch*, where subjects are left out (their truces follow their overlords') and the pairs are split close to home (the Peninsula, the Maghrib, Granada's allies and rivals) and further off.
- Facts come from saves, or from Trent's account labelled as his account. Nothing is invented.
- If a save and the story disagree, the save is right about facts and the story gets corrected. The same goes for Trent's figures against the game's screens: use the game's number (a battle screen's host, a war score) unless Trent gives a reason to prefer his, since the map doesn't always show a retreating army's true size (Trent, June 1376). The story decides voice, emphasis and interpretation.

---

## 5. The story log

- **Voice:** a Nasrid court chronicle in the manner of Ibn al-Khatib. It should be **more flavourful than the Rome chronicle**: ornate where the moment earns it, with Qur'anic and poetic flourishes, the court's own view of its enemies, and honorifics. Out-of-character notes stay rare and short.
- **Dates:** Hijri first, Gregorian beside it, e.g. *15 Rajab 741 AH (4 January 1341)*. **The house reckoning:** Hijri dates are computed with the tabular (arithmetic) Islamic calendar from the game date read as a Julian date. The game itself runs in Gregorian, so every Hijri date in the chronicle falls about eight days after a strict Gregorian conversion. The chronicle has always counted this way and keeps doing so, so that its dates stay consistent with each other (Trent, March 1405).
- **Place names:** Arabic forms with **full diacritics** are the baseline in the chronicle text (Gharnāṭa, Mālaqa, al-Mariyya, Qurṭuba, Ishbīliya …).
  - With Oikoumenē, the game files usually supply these names already. Claude takes them from the game where they exist.
  - When the game name isn't in that form (a place Trent renamed, a name the mod lacks, or a name visible only in screenshots), Claude flags it and uses the diacritic form in the text.
  - The gazetteer maps every place to its game name.
- **Eras (the books):** a book follows events, not one ruler's life (the reigns have their own place in the House of Naṣr and the Long Scroll). Books may overlap; the Long Scroll gives overlapping books their own rows. Each one is written in a single pass once it closes, with live entries for the current books. So far:
  - Book I, *The Mending of the State* (كتاب الإصلاح), 1 April 1337 – 16 October 1346: the calm before the storm, from tributary and debt to the Jamāʿa of 1344 and the debt paid; it ends the day Morocco declares war again.
  - Book II, *The Balance* (كتاب الميزان), 1 August 1346 – 14 September 1370: Granada on the scales between the three crowns and the Marīnids. It closed when the game's Battle for the Strait situation ended with *The Throne of Granada Endures* (Trent's rule: independence alone wasn't enough while the Marīnids held the north shore).
  - Book III, *The Pestilence* (كتاب الوباء), 1 August 1346 – 27 January 1352: the Black Death, from the first rumours and the hospitals to the day it left the last town of the realm. It ran beside Book II. Its central thread is the demographic reshaping of Granada (an urban realm that lost its cities, burghers and scholars hardest). Trent closed it in 1356 although the game's situation was still open, since no one had died of it in years.
  - Book IV, *The Call* (كتاب الدعوة), from late 1356: education and the reconversion of al-Andalus as the Emirate expands: roads, libraries, the return of Islam and Andalusī culture to Qurṭuba and the lands purged of them under Castile. It ran beside Book II until 1370 and now goes on alone.
  - Book V, *The Marches* (كتاب الثغور), from 14 September 1370: looking north, and outward (the Surveys of the Kingdoms of 1370 and 1420, on the Kingdoms hall's data). The old thughūr of al-Andalus (the Lower, Middle and Upper Marches of Badajoz, Toledo and Zaragoza) are the frontier again, with Lisbon and Barcelona at the borders and Castile the one equal left. Its aim is the restoration of al-Andalus (Trent, September 1370). The formal Restoration of al-Andalus (16 March 1375) does not close it: the Marches carry on through the Castilian wars, several of them (Trent, March 1375). The Peace of Rajab (1411) does not close it either: the book ends with the last war of the Istirdād, when Castile is pushed into the sea (Trent, November 1411).
  - Book VI, *The Encircling Sea* (كتاب البحر المحيط), from the Jamāʿa of 25 April 1379: the turn to the sea and to trade, from the capital's move to Ishbīliya through the fleet, the Ḥisba and the banks, the Mali trade and the Atlantic voyages, toward the Age of Discovery. Its running thread is the crown's economic building (mills, smelters, workshops, markets, plantations, hammams). It runs beside Books IV and V. The capital-move entry (781) and the Western Ocean entry (794) were moved into it when it opened. If real colonies come, the New World may split off into a book of its own (Trent, June 1395).
- **The Istirdād (الاسترداد, "the Recovery"):** the court's name for the run of wars to recover the peninsula, taking the Arabic word for the Christian Reconquista and turning it around (Trent, June 1395). The game's *Reconquest of Iberia* casus belli marks its wars. Each war is numbered in the series and also has a name of its own:
  1. *The War of the Upper March* (1373–1375), against Aragon.
  2. *The War of the Aragonese Restoration* (1375–1378), against Castile and Portugal.
  3. *The War of the League* (1394–1395), against Castile and Portugal, named after the coalition sworn against the empire in 1393; it ended with *the Peace of Ramaḍān* (22 June 1395).
  4. *The War of Jillīqiya* (29 June 1410 – 1 November 1411), against Castile and Portugal, declared the day the truce of 1395 ran out and named by the Emperor Ismāʿīl after the old Arab name for the Christian north-west beyond the Duero, the country al-Manṣūr's armies had marched through to Shant Yāqub. It ended with *the Peace of Rajab* (1 November 1411): Portugal annexed whole and Castile cut down to 45 towns in the north, ruled from Oviedo (Trent, November 1411).
  On 4 September 1420 the rump of Castile fell apart into petty kingdoms in the northern mountains: Galicia (GLC, 23 towns), Asturias (ATU, 8, at Oviedo) and Navarre (NAV, the 10 Basque towns of the coast, at Bilbao; not the Navarre of Pamplona, which is the Ṭāʾifa of Banbalūna). King Pedro kept four towns around Santander (his son Fernando from 1422). The truce of the Peace of Rajab with Castile ran out on 1 February 1426. Galicia took all of Asturias on 25 March 1425, leaving three kingdoms: Galicia (31 towns), Navarre and Castile. In May 1428 the Emperor's spies went north to prepare the casus belli for the last war, and the crown built armouries in ten cities to raise its own men (Trent, May 1428). Castile's one ally is England, which on 28 November 1428 won the Hundred Years' War, made Languedoc its dominion of Toulouse along the Pyrenees beside Catalonia, and on 1 December took the French crown in personal union; this matters for the last war because the English are allied with the Castilians (Trent, December 1428). The save showed Navarre's state faith as Sunni though its people are all Catholic; Trent fixed it in game (Catholic by November 1423), and the chronicle treats Navarre as Christian throughout. On 4 November 1421 the Ṭāʾifa of Burtuqāl proclaimed itself the Kingdom of Portugal (tag POR, formerly ABA10), still the Emperor's ṭāʾifa, with a Catholic state faith under its Muslim king Aḥmad.
  5. *The War of Shant Yāqub* (from 18 May 1430), against Galicia, named for Santiago de Compostela (Shant Yāqub), Galicia's capital, which al-Manṣūr took in 997. Muḥammad V wanted Castile first; the two princes steered him to Galicia, with Navarre next and the Basques reckoned harder than the Castilians (Trent, May 1430).
  The ʿulamāʾ coined the name in January 1394, so entries dated before then never use the word or the numbers; the War of the League entry tells how the first two wars were counted into the series afterwards.
  More are expected. A new one gets both its number and its own name, recorded as `series` in `wars.json`; the war pages and the wars hall show the number under the name.
- **The succession question (from 1398):** the law is cognatic primogeniture, which puts the crown prince's unfit eldest son Muḥammad next after him. The Emperor leaves it for now: if Ismāʿīl's son Saʿd develops well, it waits for Ismāʿīl's reign; if not, the Emperor will choose (Favored Son Succession costs 50 stability and 50 legitimacy). Watch the grandsons' traits and education in each save (Trent, September 1398). **Settled for now (August 1408):** the Emperor Saʿd died in 1405 with the law unchanged, and under Ismāʿīl the heir Muḥammad's two gifted sons, Ismāʿīl and Aḥmad (born 1402 and 1403), are enough to set the thought of changing the succession aside, if Ismāʿīl reigns long. Saʿd ibn Ismāʿīl is married to Maryam, Shaykha of Qūnka, and his line is meant to rule the frontier (Trent, August 1408). The law held: on 2 July 1429 Ismāʿīl died and Muḥammad succeeded as Muḥammad V, with his eldest son Ismāʿīl (born 1402) next by primogeniture.
- **Ruler character:** each ruler's traits in the latest save shape how the chronicle shows him, as habit, gesture and word rather than as named traits: Yūsuf I the healer, negotiator and builder; Saʿd the soldier who shared the camp, the merchant's eye and the honest books ("the Conqueror" who became the realm's greatest builder, Trent's reading); Ismāʿīl (deceitful, goal-oriented, just, and from late 1414 greedy; his silver tongue is his diplomacy of 100) who tells men in private what they wish to hear and judges fairly in public, and whose eye on the treasury hardens into greed. Muḥammad V (from 28 June 1429; 15/20/16, an extortioner, worldly from 1430): slow in the dīwān since childhood and judged unfit at twelve, but another man on a deck (he likes boats, Trent, 1411); his eyes stay on the sea and his own projects, while his three wives, chosen for their minds as well as their blood, and his two eldest sons (Aḥmad an architect, a builder like his forebears) carry much of the state (Trent, June 1430). Invented colour stays within the data and is listed in an OOC gloss (Trent, March 1405).
- **Deaths the court keeps quiet:** when the game gives a death the court would hide (a suicide, a murder), the chronicle tells the court's version (a hunting accident, a short illness), perhaps with a hint, and the event's data records the game's cause (Trent, December 1387).
- **Battles:** every battle and siege goes in the war tables. Only those that move war score by **5 or more** get prose in the chronicle.
- **Standing threads:**
  - **The crown and the estates**, a running thread. Each swing in power or privilege is recorded and explained. From 1402 the crown's aim is to break the power of the umarāʾ (the nobles) now that the state is built, softening the blows with gifts when their temper runs too low; the burghers are the rising estate (Trent, August 1402). Milestones: the Jamāʿa of 817 (October 1414) took the mercenary contracts; the Jamāʿa of 831 (25 May 1428) revoked the Primacy of Nobility, leaving the umarāʾ 16% content and stability at 1.
  - **The Strait**: the balance between Castile and Morocco.
  - **Ṭāʾifas and the crown**: the far north (Burtuqāl, Liyūn, Burghush, Banbalūna, Qūnka) is held through ṭāʾifas; the lands south of it are integrated into the crown. Shalamanka's annexation on 11 June 1415 was not planned, but it fits the pattern (Trent, January 1416): on 18 November 1416 sixteen of its 21 towns went on to Liyūn and Burghush. Balansiyya, a ṭāʾifa since 1340, was integrated into the crown on 1 August 1420, leaving seven ṭāʾifas: Catalonia, Aragon, Qūnka, Burtuqāl, Liyūn, Burghush and Banbalūna. Catalonia is next: from December 1428 its integration is a first concern at court, expected to be complete by the middle of 1437 (Trent, December 1428).
  - **Cultures at court**: besides the Andalusī, the Portuguese are accepted (by 1416) and the Catalans followed once Balansiyya was integrated (accepted by November 1423), and the Sephardim, long tolerated, were accepted with them; the Castilians are left out, ignored at best (Trent, April 1419).
  - **The two princes** (from June 1429): Muḥammad V's sons Ismāʿīl (the heir, born 1402) and Aḥmad (born 1403) sit in the dīwān and wield great influence. Unlike the princes of earlier generations they are united, not rivals, in one aim: to keep the realm together in the face of their father's tendencies (Trent, July 1429).
- **The tribes**: a new estate that came with the Guanche islanders of Maxorata in the Canaries, settled in April 1415 (4,553 tribesmen and under 1% of power on 31 December 1415). Ignore it until it holds a significant share of power, more than 3–4%; Trent can give the breakdown of where its power comes from (Trent, October 1414).
  - **The rebuilding of the north** (Book IV, from February 1371): the sultan's investment in the lands won since the 1360s, the valley and the north shore, to rebuild their economy and bring them back to Islam and Andalusī culture, with Ishbīliya at its centre (Trent).
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
| **The Kingdoms** (الممالك) | The world as the dīwān reckons it, at any checkpoint: the followed powers on circles around Gharnāṭa, each in the direction of its capital, with their alliances, rivalries, unions and subjects; a dispatch for each (standing, sovereign and heir, towns, people, men under arms, ships, treasury, ties); the game's great-power ladder; Granada's rise in points against Portugal, Castile, Morocco and the last Great Power; wars abroad and the orders of Christendom. |
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
- **The Atlas** is province-first. Each province is one shape, coloured by a lens: Realms, Faith, Tongue, People, Ruin (people gained or lost since the previous checkpoint, with towns looted in between hatched) or Hold (control). Clicking a province flies to it and splits it into its locations, with a folio of its towns, people, faith and tongue and its entries in the record. The map pans and zooms (drag, wheel, pinch), shows the battles since the previous checkpoint as pins, and can play through the checkpoints. The lenses come from `tools/map_layers.py`, one file per checkpoint, fetched when needed. A fourth voyage, **the Middle Sea**, swaps in a wide chart from Lisbon to Alexandria (`tools/build_map.py --lite`): every realm at the checkpoint, the followed powers in their own colours and Granada in gold, each with a dispatch from the Kingdoms on click.
- The Atlas and every small chart are drawn from the game's own map: `tools/build_map.py` traces each location from `locations.png`, and realm outlines are rebuilt for each checkpoint.
- Hijri dates come from `site/src/lib/hijri.ts`.
- Story entries link to records with `[name](person:id)`, `place:`, `war:` and `era:`.
- See `site/README.md` for running it locally and for the story-entry format.

**Publishing:** the root workflow (`.github/workflows/pages.yml`) builds every campaign's site on each push to `main` and deploys them to GitHub Pages. Pages has to be set to deploy from GitHub Actions in the repo settings.

---

## 7. A session, step by step

1. Trent plays and makes an ordinary checkpoint save (compressed). If the estates matter at that checkpoint, he screenshots the estate power panel at the same moment, since the save doesn't store the shares.
2. He opens the chat on the gaming PC (or links that computer) and gives his account of what happened, including anything screenshots show that a save can't. When a screenshot shows an event with several options, the option whose tooltip is open is the one he picked (nine times in ten; he says when it isn't).
3. Claude parses the save into a snapshot and new events, then checks them against the previous snapshot. For each new checkpoint it also redraws the realm outlines (`tools/build_map.py --owners`, and `--lite` for the Middle Sea), writes the Atlas's lenses (`tools/map_layers.py`) and reads the world beyond the realm (`tools/world_powers.py`). A power that becomes worth following is added to a circle in `data/powers.json` and named in `data/countries.json`; its ruler gets a record in `people.json` when the chronicle names him.
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
