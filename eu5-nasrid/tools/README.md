# Tools

Run by Claude in the workspace when a checkpoint save comes in. Inputs come from the gaming PC; outputs land in `../data/`.

| Tool | What it does |
|---|---|
| `extract_checkpoint.py` | Pulls the facts the campaign tracks out of a save already split by the shared decoder: the realm's locations and population by culture and religion, the court and the dynasty, laws, reforms and privileges, treaties, situations, the Battle for the Strait (influence, sovereignty, years as a subject), every war Granada is in or can be called into, and the owner of every location in the world. Unless `--no-computed` is given, also the treasury, income and expenses, manpower, estates (satisfaction, gold, tax rate), the cabinet and its actions, and every regiment and ship. Use `--no-computed` for a start-date save, whose computed values aren't settled yet. Writes `data/extracted/<date>.json`. |
| `estate_power.py` | Estimates each estate's share of power from a decoded save, using `data/estate-power-model.json`; `--calibrate DATE` fits it to a screen reading. See 'Estate power' below. |
| `build_map.py` | Traces every location in a frame of the game map from `locations.png` into SVG paths, plus the coastline. With `--owners`, also writes the outline of every realm at each checkpoint (`data/map/realms-<date>.json`). |
| `devastation.py` | Compares the people, prosperity and looting of every location in a game region between a save before a run of wars and a save at the peace (and optionally one after). Writes `data/devastation/<war-id>.json`, which the war's page draws as a map and tables. |

## A checkpoint, step by step

```sh
# 1. split the save with the 1.4 decoder (build it once with `make` in that folder)
python3 ../shared/tools/eu5-save-decoder-1.4/decode.py SAVE.eu5 /tmp/sections
# 2. pull the facts
python3 tools/extract_checkpoint.py /tmp/sections data/extracted/1340-10-30.json
# 3. realm outlines for the map (the map itself only needs rebuilding if the game's map changes)
python3 tools/build_map.py GAME/in_game/map_data data/map/strait-region.json --frame 7120,2290,8220,3130 \
  --owners data/extracted/*.json --realms-dir data/map
# 4. write data/snapshots/<date>.json, people, gazetteer, wars and events by hand from the extracted file
#    (estate shares of power are not in the save: they come from Trent's estates screen, or stay null)
```

## Reading the extracted values

- Script values (the Strait's influence and sovereignty) are 64-bit fixed-point integers with five decimal places; negative ones wrap round from 2^64. `fx()` in the extractor converts them. Influence runs from −100 (Castile) to +100 (Morocco).
- Estate satisfaction is 0–1 in the save; snapshots store it as 0–100.
- `max_manpower` and `manpower` are in thousands of men.

## Estate power

The save holds each estate's satisfaction, gold and tax rate, but not its share of power. `estate_power.py` rebuilds the shares from the game's own rules, worked out from Trent's tooltips against the 16 November 1337 save. `data/estate-power-model.json` holds the inputs.

**The estates.** Each pop counts for its own estate (the pop record says which): size × its type's `power_per_pop` (`common/pop_types`: nobles 25, clergy 10, burghers 4, soldiers 0.0625, labourers 0.0375, peasants 0.025 per thousand) × (1 + country modifiers + the town's own bonuses), then × (1 + tolerance).
- Country modifiers are the tooltip's list (privileges, laws, societal values, cabinet, wealth), stored per reading.
- Town bonuses: estate buildings and castles (`local_<estate>_estate_power` in `common/building_types`), and the peasant-promotion term (`possible_promotion_percentage`: +10× for commoners, −1× for nobles, clergy and burghers). The promotion percentage isn't saved; one share of 8% fits the nobles, ʿulamāʾ and commoners together.
- The burghers also count Andalusi Sunni burghers abroad (merchants in Lisbon, Fez, Timbuktu and so on), at the country rate with no town bonuses. This is the least certain part: the save doesn't link a pop to a country.

**The crown.** Every pop in every owned town counts for the crown too, at the same weights: × max(0, 1 + crown modifiers − (1 − control) + the town's crown bonuses) — "Lack of Control" adds, it doesn't multiply — then the whole × (1 + 0.5 × (mean control − 0.5)), the "Crown power from population" line (`average_control_50`).

**Calibration.** At a checkpoint with an estates screen, `estate_power.py SECTIONS --calibrate DATE` compares model and screen and stores a correction per estate. On 16 November 1337 the uncalibrated model was within 1.1 points of every share (crown 22.4% against 23.0%); the corrections were crown 1.05, nobles 1.00, ʿulamāʾ 1.00, burghers 1.10, commoners 1.05, dhimmī 0.99. The crown's gap probably comes from a crown bonus in Málaga that the save doesn't show.

**Partial readings.** When Trent reads only one estate's tooltip, the reading stores `screen` with that estate's absolute power, `screenTotal` (the tooltip's "of a total" figure) and a `baseReading`. `--calibrate` then gives the estates read their own screen ÷ model correction and scales the rest together, keeping the base reading's relative corrections, so that the total matches. On 11 August 1340 the Dhimmī breakdown matched powerPerPop × 1.73 to the hundredth for every pop type (model 141.9 before tolerance against 140.53 on screen); the other five estates came out about 10% high together and were scaled by 0.897 against the 2 May 1340 corrections.

**Adjustments.** A change to the country modifiers seen on screen between readings goes into `adjustments` in the model file with its date, and applies to later saves. The first is debt to the estates: on 9 March 1340, with 1,351.73 owed, "Impact of Debt to the Estate" cut crown power by 65.81%. It scales with the debt, so it needs refreshing whenever the debt moves.

**Using it.** Checkpoints with a screen reading use the screen's figures. Others use `estate_power.py SECTIONS --out FILE` (the latest reading's modifiers and corrections) and are marked `estimated: true`. A new reading is worth taking after any change of privilege, law, cabinet or ruler, since the stored modifiers then go stale.

## What the privileges and laws do

The save names privileges, laws, reforms, societal values and parliament agendas by key only. `government_catalog.py GAME_DIR` reads their definitions from the game's own files (base game and the Across the Pillars DLC, with English localization) and writes `data/government-catalog.json`: each entry's name, the estate it belongs to, its modifiers with the game's own labels and percent/flat formatting, and summaries of the estate power and satisfaction it changes. Only what some checkpoint has held is written, plus every option of each law held, so the Council can show the alternatives.

Run it again when a checkpoint brings a privilege, law or agenda not seen before (it prints anything it can't find). The game files come from the PC's install (`game/in_game/common/...`, `game/dlc/*/in_game/common/...`, `game/main_menu/common/{modifier_type_definitions,script_values}`, `game/main_menu/localization/english`). A few keys have no English name in the game; the tool gives them the chronicle's own (`OWN_NAMES`) and marks them `nameIsOurs`.

The snapshots carry `government.societalValues`, `government.parliament` (type, when last called, each estate's agenda) and `government.privilegeDates`, copied from the extracted facts.

## Compressed saves in 1.4

1.4 stores almost every field name as an index into the save's string table instead of a numeric token. The 1.3.11 decoder (`shared/tools/eu5-save-decoder/`) crashes on these saves, so this campaign uses `shared/tools/eu5-save-decoder-1.4/`, which this campaign adapted from it. Its README covers the format change and the validation: the compressed start save decodes to the same content as the text save made at the same moment, 31.6 million tokens compared.
