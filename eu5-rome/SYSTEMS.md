# Campaign Systems: Rome (EU5)

Working rules for the Byzantium → Rome campaign. Every session that touches this campaign reads this first. It follows the repo-wide rules in [`/CLAUDE.md`](../CLAUDE.md).

---

## 1. The campaign

| | |
|---|---|
| Game | Europa Universalis V, patch 1.3.11 |
| Country | Byzantium (`BYZ`) from the 1 April 1337 start; **Rome (`ROM`)** since the 1480s. Palaiologos dynasty. Country id 203 in the save. |
| Mode | Non-Ironman. Saves are patched when needed (see §5). |
| Mod | **Romani Provinciales**, Trent's own: hybrid Roman provincial cultures (§5) |
| State faith | Hellenism, re-established 1410 |
| Long arc | A Latinised West and a Greek East standing as equals. The Mediterranean is ruled through provincial vassals, Gaul through the Gaulish Wars, and Meropis (Mesoamerica) through the Meropian Wars. |

Never conflate this campaign with the Tunis/Carthage campaign or the Nasrid campaign.

---

## 2. Where things live

| What | Where | Point of truth? |
|---|---|---|
| The chronicle (narrative) | Claude Doc **"Chronicle of the Romans"**, with tabs: Chronicle, Wars, Legions, Provinces, The World in 1519, The World in 1531 | **Yes**, for the narrative. Not migrated to the repo; whether and when to migrate is Trent's call. |
| Facts from saves | `data/` in this folder | Yes, for facts |
| Save decoder | [`shared/tools/eu5-save-decoder/`](../shared/tools/eu5-save-decoder/) | |
| Campaign scripts | `tools/` in this folder | |
| The mod and save-patch scripts | Trent's PC. Not in the repo yet (§8). | |

If a save and the chronicle disagree, the save is right about facts and the chronicle gets corrected. The chronicle decides voice, emphasis and interpretation.

---

## 3. The chronicle's conventions

**Voice.** An in-world Roman court history: the court's view of events, with flourish where the moment earns it. Out-of-character notes are kept few and short. They say where a fact comes from: a save, a battle report, or the player's account, marked as his account.

**Accuracy.** Strict. Nothing is invented and nothing overclaimed. If a save's date and the player's date differ, the save's date wins.

**Naming.** Roman and Greek mythic names for new lands, Roman Latin names for provinces and vassals. Directly ruled areas get Roman-style names. Decisions so far:

| Name | What it is |
|---|---|
| Hesperian Sea | the Caribbean |
| Hesperia, Ogygia, Scheria, Erytheia | Cuba, Hispaniola, Jamaica, Puerto Rico |
| Hesperides | the Lesser Antilles |
| Cyclades Occidentales | the Bahamas |
| Meropis | Mesoamerica (only) |
| Kerne | São Tomé |
| Eschate | the Cape, including the Karoo |
| Theon Ochema | Calabar |
| Illyricum | the Balkan coast annexed directly (never a vassal) |
| Narbonensis Prima / Secunda | Languedoc / Provence vassals |

Wars in a series take the region's name: the Gaulish Wars, the Meropian Wars.

**Wars tab.** Every war gets a heading with its years, a summary (war goal, Rome's side, the enemy), then tables and a journal.

- **Battles of the legions.** Every battle a legion fights, columns `Battle | Legions | Commander | Result | Rome | Losses | Enemy | Losses | War score`, with a Total row.
- **Allied and vassal battles.** A separate table, columns `Battle | Army | Men | Losses | Enemy | Men | Losses | Result | War score`.
- **Sieges.** Columns `Place | Taken by | Length | Date`, with "by storm" where it applies.
- **Prose.** The journal and the Chronicle tell only the battles that mattered. War score is mentioned in prose only when a battle moves it by **5 or more**.
- **Reading battle reports.** The first unit column is light infantry.
- **After the peace.** A "What was won" section, from the save.

**Legions.** The armies are Legions (they were Tagmata before the reorganisation of Italy). Each legion's battles and sieges are tracked on the Legions tab: commander successions with dates, and a dated list of every action. A new legion stays unnamed until it earns a name in battle. A destroyed legion stays dead unless it is revived in-game.

**Subjects.**
- Provincial vassals are made duchy rank with Inspect → Script Runner → Effect `set_country_rank = country_rank:rank_duchy`. They stay monarchies.
- Vassal flags use game charges on plain fields, colour-coded by region: purple for Gaul, green for Iberia. A vassal's flag doesn't change with the Age.
- Colonies follow a Crown → Colony model. The Crown holds new land until it can stand on its own, then hands it to the colonial province.

---

## 4. Saves

- **Source:** the game's `save games` folder on Trent's gaming PC, reached through the linked desktop app.
- **Format.**
  - Normal compressed saves (about 80 MB) are preferred. They decode with the shared decoder.
  - Debug-mode text saves are 500–900 MB, above the 400 MB transfer limit, so they have to be zipped first.
  - Never commit either kind (see `/CLAUDE.md`).
- **Checkpoints:**
  - the start and the peace of every war
  - deaths and successions
  - reorganisations of subjects
  - anything Trent flags
- **From save to snapshot:**
  ```sh
  python3 shared/tools/eu5-save-decoder/decode.py SAVE.eu5 SECTIONS_DIR
  python3 eu5-rome/tools/extract_snapshot.py SECTIONS_DIR 203 eu5-rome/data/snapshots/YYYY-MM-DD.json
  ```
  Snapshots are named by the save's game date, with a suffix for a second save on the same day (`1527-04-12-post.json`).

---

## 5. The mod and save patches

**Romani Provinciales** adds hybrid provincial cultures:

| Culture | Built from |
|---|---|
| Afri | Maghrebi group + Roman (Greek) group |
| Hispani | Iberian group + Roman (Greek) group |
| Galli | French group + Roman (Greek) group |
| Britanni | British group + Roman (Greek) group |

Each is its base regional group plus the Roman group, not the Italian group.

**Save patches** put these cultures into the game:

- How it works: Claude writes a PowerShell patch script that runs on the PC against a debug-mode text save. The script checks SHA-256 hashes on the way in and out and writes a new file. The original save is never overwritten.
- Done so far:
  - **1516:** Afri for the African provinces.
  - **1531:** Galli for Narbonensis Prima and Secunda and Viennensis, Hispani for Tarraconensis. Rulers' families and courts were converted too.
- The standing rule: **don't touch non-Roman pops**. The provinces still have to convert the rest in-game.

---

## 6. Data in this folder

See [`data/README.md`](data/README.md).

---

## 7. Repo scope

A Rome session writes only inside `eu5-rome/`. Changes under `shared/` or at the repo root need Trent's explicit approval. Ideas worth spreading go through a transition doc in `shared/transitions/`.

---

## 8. Open questions

1. Migrating the Claude Docs chronicle into Markdown here (`story/`): Trent's call, not started.
2. Versioning the Romani Provinciales mod source in `eu5-rome/mod/`.
3. Keeping the save-patch scripts here. They would first need their local paths turned into arguments.
4. The fact book stops at 1507. It could be rebuilt from the later snapshots.
