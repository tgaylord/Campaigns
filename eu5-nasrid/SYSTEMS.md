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
| Mode | **Non-Ironman.** Text saves via debug mode; mods and save patches allowed; no achievements |
| Mods | To confirm against 1.4: Oikoumenē (likely), National Destinies (maybe), others TBD |
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

**Home:** GitHub repo `tgaylord/Campaigns`, published with GitHub Pages. It's private to Trent in practice (just for him), so there's no need to design for other readers.

### Repo layout
```
Campaigns/
  CLAUDE.md               ← repo-wide rules every session follows
  shared/                 ← shared data model, docs, transition docs
  eu5-nasrid/
    SYSTEMS.md            ← this document
    data/
      snapshots/          ← one JSON per checkpoint, e.g. 1337-04-01.json
      events/             ← event log, one file per year (1337.jsonl …)
      people.json         ← characters: Nasrids, viziers, generals, notables
      gazetteer.json      ← places: game name ↔ Arabic name, held from/to
    story/                ← the story log: one Markdown file per entry
    tools/                ← save parser, Hijri converter, map builder
    map/                  ← phase 2: geometry built from game map files
    site/                 ← the static site source
  .github/workflows/      ← Pages build + deploy
```
Each campaign gets its own top-level folder; Rome or any other campaign would sit beside `eu5-nasrid/`. Folders are created as they're first needed.

---

## 3. Saves: getting them to Claude

- **Source:** the gaming PC (Windows), at `C:\Users\trent\Documents\Paradox Interactive\Europa Universalis V\save games`. That computer has to be linked to the chat (open the chat in the Claude desktop app there), with this folder connected.
- **Format:** plain-text saves via debug mode. They're about 500–900 MB, and Claude can pull 400 MB at most, so **zip each checkpoint save** (Send to → Compressed folder) in the same folder.
- **Naming:** `GRA_YYYY_MM_DD_short-slug`, e.g. `GRA_1340_10_30_rio-salado`.
- **When to save a checkpoint:**
  - the start of a war, and its peace
  - a ruler's death or accession; a regency
  - Strait milestones: influence crosses ±50 or 0; sovereignty crosses 50; subject status changes
  - a major reform or law, or an estate privilege granted or revoked
  - forming Al-Andalus; Golden Century thresholds
  - otherwise about every 10–15 in-game years
- **Patches:** when a save edit is needed, Claude writes a verified patch script (with SHA-256 checks) and Trent runs it. Claude never overwrites a save, and works on copies only.

---

## 4. Campaign data

### Snapshot (one per checkpoint)
- **Date:** Gregorian (from the game) and Hijri (computed).
- **Ruler, heir, consort, regent;** the cabinet and the head of the cabinet.
- **Realm:** locations, areas and provinces held; capital; subjects and ṭā'ifas.
- **Population:** total, by culture, by religion.
- **Estates:** power and satisfaction for each estate, crown power, privileges held.
- **Government:** laws, reforms, policies, bureaucracies, political influence.
- **Economy:** treasury, income and expenses, debt, main goods.
- **Military:** levies, regiments, fleets and their locations. Named armies come later (see §5).
- **Diplomacy:** overlord, allies, rivals, truces, active wars with their war score.
- **The Strait:** influence over Granada, Granadan sovereignty, years as a subject (overall, under Castile, under Morocco).
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

### Rules
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
- **Eras:** eras may overlap. Each one is written in a single pass once it closes, with live entries for the current era.
- **Battles:** every battle and siege goes in the war tables. Only those that move war score by **5 or more** get prose in the chronicle.
- **Standing threads:**
  - **The crown and the estates**, a running thread. Each swing in power or privilege is recorded and explained.
  - **The Strait**: the balance between Castile and Morocco.
  - **Armies:** none at the start. Named-army tracking begins once Granada has a significant professional force, and that moment becomes part of the story of the Nasrid state. A destroyed army stays dead unless it's revived in-game.
- **File format:** one Markdown file per entry in `story/`, with front matter for the id, dates, era, title, kind (`chronicle` or `ooc`) and linked people, places and wars.

---

## 6. The views (the site)

The first build will have:
- **Timeline scrubber:** the realm at any checkpoint.
- **Chronicle reader:** by era, with linked names.
- **Estates:** power and satisfaction over time, annotated with causes.
- **The Strait:** its values over time, with the actions and wars that moved them.
- **Wars:** one page per war, with the war score curve and battle tables.
- **People:** the Nasrid family tree, plus pages for courtiers and generals.
- **Gazetteer:** places, names, and when each was gained or lost.

**Phase 2:**
- A **real map** built from the game's own map files on the gaming PC. It would show ownership at each checkpoint and battle sites.
- The colonies, and an armies view once tracking starts.

The site's stack hasn't been decided. It will be a static build so GitHub Pages can host it.

---

## 7. A session, step by step

1. Trent plays, makes a checkpoint save in text mode, and zips it.
2. He opens the chat on the gaming PC (or links that computer) and gives his account of what happened, including anything screenshots show that a save can't.
3. Claude parses the save into a snapshot and new events, then checks them against the previous snapshot.
4. Claude drafts the story entries and Trent corrects them.
5. Claude commits the data and story to the repo, and the site rebuilds.

---

## 8. Subjects and saves

- Vassals are normally **counties or duchies**, unless a specific exception is agreed.
  - The Script Runner rank fix (`set_country_rank = country_rank:rank_duchy`) was a workaround for the custom-nation mod in Rome. It's a tool to reach for if that bug shows up again, not a standing rule.
- Claude only ever works on copies of saves, never the originals.

---

## 9. Repo scope

This campaign follows the repo-wide rules in `/CLAUDE.md`:
- A Nasrid session writes only inside `eu5-nasrid/`.
- Changes to anything under `shared/` need Trent's explicit approval.
- Ideas worth spreading to other campaigns go through a transition doc in `shared/transitions/`.

---

## 10. Open questions

1. The site's stack (decided at build time).
2. Final mod list, checked against 1.4.
