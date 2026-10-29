# Tools

Run by Claude in the workspace when a checkpoint save comes in. Inputs come from the gaming PC; outputs land in `../data/`.

| Tool | What it does |
|---|---|
| `extract_checkpoint.py` | Pulls the facts the campaign tracks out of a save already split by the shared decoder: the realm's locations and population by culture and religion, the court and the dynasty, laws, reforms and privileges, treaties, situations, the Battle for the Strait (influence, sovereignty, years as a subject), every war Granada is in or can be called into, and the owner of every location in the world. Unless `--no-computed` is given, also the treasury, income and expenses, manpower, estates (satisfaction, gold, tax rate), the cabinet and its actions, and every regiment and ship. Use `--no-computed` for a start-date save, whose computed values aren't settled yet. Writes `data/extracted/<date>.json`. |
| `build_map.py` | Traces every location in a frame of the game map from `locations.png` into SVG paths, plus the coastline. With `--owners`, also writes the outline of every realm at each checkpoint (`data/map/realms-<date>.json`). |

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

The save holds each estate's satisfaction, gold and tax rate, but not its share of power, so shares come from Trent's estates screen at the moment of a save. An attempt to derive them (16 November 1337, save plus every tooltip) found:

- An estate's power is the sum over its pops of size × the pop type's `power_per_pop` (`common/pop_types`: nobles 25, clergy 10, burghers 4, soldiers 0.0625, labourers 0.0375, peasants 0.025 per thousand) × (1 + the country modifiers in the tooltip + the town's own modifiers), then × (1 + tolerance).
- The dhimmī estate matches this exactly (no town modifiers apply to it).
- Town modifiers come from estate buildings and castles (`local_<estate>_estate_power` in `common/building_types`). With them the nobles come within 1% and the ʿulamāʾ within 3%.
- Not reproducible from the files and save: `possible_promotion_percentage` (a town modifier giving commoners 10× and taking 1× from the upper estates; the percentage isn't saved), Andalusi burghers abroad who count for Granada's burghers (Lisbon, Fez, Timbuktu…; 1,791 at that checkpoint, and the save has no link from pop to country), and nearly half of the crown's power (130 of 241 from population; the rest isn't itemised anywhere).

So shares stay a reading from the screen: the estate power panel (one screenshot) is enough.

## Compressed saves in 1.4

1.4 stores almost every field name as an index into the save's string table instead of a numeric token. The 1.3.11 decoder (`shared/tools/eu5-save-decoder/`) crashes on these saves, so this campaign uses `shared/tools/eu5-save-decoder-1.4/`, which this campaign adapted from it. Its README covers the format change and the validation: the compressed start save decodes to the same content as the text save made at the same moment, 31.6 million tokens compared.
