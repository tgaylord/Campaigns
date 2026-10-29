# Campaign data

| Path | What it holds | Written by |
|---|---|---|
| `extracted/<date>.json` | Raw facts from one checkpoint save, keyed by the game's own ids | `tools/extract_checkpoint.py` |
| `map/strait-region.json` | Every location in the Strait theatre, traced from the game map, plus the coast | `tools/build_map.py` |
| `map/realms-<date>.json` | The outline of each realm at a checkpoint | `tools/build_map.py --owners` |
| `snapshots/<date>.json` | The checkpoint as the views use it: ruler, realm, people, government, and (once ticked) estates, economy, levies, the Strait | by hand from `extracted/` |
| `people.json` | The court and the house of Naṣr, with the chronicle's names and the game's ids | by hand from `extracted/` |
| `gazetteer.json` | Places the chronicle names: chronicle form, Arabic script, the game's form, map key | by hand, from the game's 1.4 place-name files |
| `countries.json` | Countries the views name and colour, with the court's names for them | by hand |
| `events/*.json` | The event log, one array per year | by hand, from saves and Trent's account |
| `wars.json`, `eras.json` | Wars and the chronicle's books | by hand |

Facts come from saves or from Trent's account, never invented. See `../SYSTEMS.md` §4.
