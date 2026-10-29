# Tools

Run by Claude in the workspace when a checkpoint save comes in. Inputs come from the gaming PC; outputs land in `../data/`.

| Tool | What it does |
|---|---|
| `extract_checkpoint.py` | Pulls the facts the campaign tracks out of a save already split by the shared decoder: the realm's locations and population by culture and religion, the court and the dynasty, laws, reforms and privileges, treaties, situations, and the owner of every location in the world. Writes `data/extracted/<date>.json`. `--no-computed` leaves out values the game only settles after a few monthly ticks (use it for a start-date save). |
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
# 4. write data/snapshots/<date>.json, people, gazetteer and events by hand from the extracted file
```

## Compressed saves in 1.4

1.4 stores almost every field name as an index into the save's string table instead of a numeric token. The 1.3.11 decoder (`shared/tools/eu5-save-decoder/`) crashes on these saves, so this campaign uses `shared/tools/eu5-save-decoder-1.4/`, which this campaign adapted from it. Its README covers the format change and the validation: the compressed start save decodes to the same content as the text save made at the same moment, 31.6 million tokens compared.
