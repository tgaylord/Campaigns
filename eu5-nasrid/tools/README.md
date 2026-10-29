# Tools

Run by Claude in the workspace when a checkpoint save comes in. Inputs come from the gaming PC; outputs land in `../data/`.

| Tool | What it does |
|---|---|
| `extract_checkpoint.py` | Pulls the facts the campaign tracks out of a save already split by the shared decoder: the realm's locations and population by culture and religion, the court and the dynasty, laws, reforms and privileges, treaties, situations, and the owner of every location in the world. Writes `data/extracted/<date>.json`. `--no-computed` leaves out values the game only settles after a few monthly ticks (use it for a start-date save). |
| `build_map.py` | Traces every location in a frame of the game map from `locations.png` into SVG paths, plus the coastline. With `--owners`, also writes the outline of every realm at each checkpoint (`data/map/realms-<date>.json`). |
| `b2t-1.4.patch` | The change the shared decoder (`shared/tools/eu5-save-decoder/b2t.c`) needs for 1.4 compressed saves. See below. |

## A checkpoint, step by step

```sh
# 1. split the save (a text save is only split; a compressed 1.4 save needs the patched b2t)
python3 ../../shared/tools/eu5-save-decoder/decode.py SAVE.eu5 /tmp/sections
# 2. pull the facts
python3 tools/extract_checkpoint.py /tmp/sections data/extracted/1340-10-30.json
# 3. realm outlines for the map (the map itself only needs rebuilding if the game's map changes)
python3 tools/build_map.py GAME/in_game/map_data data/map/strait-region.json --frame 7120,2290,8220,3130 \
  --owners data/extracted/*.json --realms-dir data/map
# 4. write data/snapshots/<date>.json, people, gazetteer and events by hand from the extracted file
```

## Compressed saves in 1.4

1.4 stores almost every field name as an index into the save's string table instead of a numeric token: about 6 million of them in the 1337 save, against 31 numeric tokens, all in the metadata. Four token types carry them: `0x0d5a` (1-byte index), `0x0d5b` (2-byte), `0x0d5c` (3-byte, assumed, not yet seen) and `0x0d43` (a 1-byte value index). The 1.3.11 converter doesn't know them, loses its place in the stream and crashes.

With the patch, the compressed start save decodes to the same content as the text save made at the same moment: 31.6 million tokens compared, all equal apart from the save's own label and one disease field (`resistance`) whose fixed-point scaling differs. The token table barely matters in 1.4; the metadata tokens it still covers are unchanged from 1.3.11.

The patch lives here until Trent approves updating the shared tool (`/CLAUDE.md` §2).
