# EU5 save decoder

> **Game version 1.3.11. Deprecated for 1.4.** This decoder crashes on 1.4 compressed saves, which moved field names into the string table. For 1.4 saves use [`../eu5-save-decoder-1.4/`](../eu5-save-decoder-1.4/). This folder stays unchanged for campaigns still on 1.3.11, such as Rome.

Turns a compressed Europa Universalis V save (`.eu5`) into the same Jomini-style text the game writes in debug mode, split into one file per top-level section. Any EU5 campaign can then work from the small compressed saves (about 80 MB) instead of 500–900 MB text saves.

- **Origin:** the Rome campaign (`eu5-rome`), October 2026.
- **Token table:** learned from game version **1.3.11**. A save from another version may decode with wrong or missing field names; see [Extending to a new game version](#extending-to-a-new-game-version).

## Files

| File | What it is |
|---|---|
| `decode.py` | Command-line entry point: save in, sections out |
| `b2t.c` | The converter from binary gamestate to text, in C for speed (about 15 s for a 300 MB gamestate) |
| `tokens-1.3.11.txt` | Token table: one `hexid name` per line, 986 entries |
| `jomini.py` | A small parser for the text format (`parse`, `get`, `getall`, and `DB`, a lazy index of `id={…}` entries in a section file) |
| `learn_tokens.py` | Learns a token table by aligning a compressed save with a text save |
| `Makefile` | Builds `b2t` |

## Usage

```sh
make                                   # builds ./b2t (needs a C compiler)
python3 decode.py SAVE.eu5 OUT_DIR     # writes OUT_DIR/index.json and OUT_DIR/<section>.txt
```

Options:

- `--tokens FILE`: use another token table (the default is `tokens-1.3.11.txt` next to the script)
- `--b2t PATH`: use a `b2t` binary somewhere else
- `--whole`: also keep the full text as `OUT_DIR/gamestate.txt`

Text (debug-mode) saves are accepted too; they are only split. Python 3.8+ with the standard library only.

## What it reads and what it writes

**The container.** A compressed `.eu5` file is a one-line ASCII header (starting `SAV`), a short binary block, then a zip archive. `decode.py` finds the zip by its `PK\x03\x04` signature and reads two members:

- `gamestate`: the whole game state as a stream of little-endian 16-bit tokens
- `string_lookup`: a 5-byte header, then strings as (u16 length, bytes) records. The gamestate refers to them by index.

**The token stream.** Every item starts with a u16:

| Token | Meaning | Payload |
|---|---|---|
| `0x0001` | `=` | none |
| `0x0003` / `0x0004` | `{` / `}` | none |
| `0x000c` | i32 (printed as a date if it falls in the date range, see below) | 4 bytes |
| `0x0014` | u32 | 4 bytes |
| `0x000d` | f32 | 4 bytes |
| `0x000e` | bool | 1 byte |
| `0x000f` / `0x0017` | quoted / unquoted string | u16 length + bytes |
| `0x029c` / `0x0317` | u64 / i64 | 8 bytes |
| `0x0167` | 8-byte value of unknown type, printed raw as `F64_<int>` | 8 bytes |
| `0x0d40`, `0x0d3e`, `0x0d44`, `0x0d41` | index into `string_lookup` | 1, 2, 2, 3 bytes |
| `0x0d47` | fixed-point zero | none |
| `0x0d48`–`0x0d4e` | positive fixed-point, 5 decimal places | 1–7 bytes |
| `0x0d4f`–`0x0d55` | negative fixed-point, 5 decimal places | 1–7 bytes |
| anything else | a field name, looked up in the token table | none |

Dates are i32 hours counted from year −5000 on a 365-day calendar, written `Y.M.D` or `Y.M.D.H`.

**The output.** Text matching the debug-mode layout, including the game's habit of writing entries inside a `database={…}` block one tab shallower. It is split into depth-0 sections (`metadata`, `countries`, `war_manager`, `locations`, `character_db` and so on, about 78 in a 1537 save). `index.json` lists `[section, start, end]` byte offsets into the full text. Field tokens missing from the table appear as `T_xxxx` (hex id). String indexes beyond the lookup table would appear as `LOOKUP_n`, though none have been seen.

## How the token table was learned

Field names aren't in the save; each is a bare 16-bit id. The table was learned by aligning compressed saves against text saves of the same campaign taken a few days apart:

1. Decode the compressed save with an empty table, so every field shows as `T_xxxx`.
2. Parse both into trees. Pair the top-level sections by position. Small sections are aligned whole. In the big database sections (countries, characters, locations and so on), up to 2,500 entries with the same numeric id in both saves are aligned.
3. Within each pair of blocks, line up the children by sequence alignment on their (key, kind) signatures. Every `T_xxxx` that falls opposite a name collects a vote for that name.
4. Keep a token when one name holds at least 60% of its votes.
5. Repeat, seeding each pass with the previous table. Known names let the aligner match lists whose lengths differ, so each pass resolves more.

`tokens-1.3.11.txt` is the third pass with 28 lines changed by hand:

- **Removed (17):** section names the aligner had tied to the wrong id, such as `estate_manager`, `event_manager` and `resolution_manager`, plus `navy`, `periphora` and `autobalance_dirty`. Some section keys are stored as plain strings rather than tokens, so the aligner's guesses for them were wrong.
- **Added (11):** names the votes missed, such as `tags`, `rgb`, `formed_from`, `previous_tags` and `omens`.

`learn_tokens.py` is a tidied version of the aligner used.

## How it was validated

Two text saves were checked against compressed saves of the same campaign taken shortly before them. Each pair went through the same snapshot extractor (one country's realm, government, family, wars and diplomacy) and the results were compared.

| Pair | Identical in both | Differences |
|---|---|---|
| text 1 Mar 1437 vs compressed 27 Feb 1437 (2 days) | owned locations (369 of 369), laws (22), privileges, reforms, rulers and ruler terms, family, capital, cultures accepted and tolerated, religion, overlord, active wars, last war, rivals, great-power ranks, situations | population 6,941.5k vs 6,937.9k (−0.05%); small moves in culture and religion shares, estates and the economy, as expected over two days |
| text 21 Aug 1500 vs compressed 5 Aug 1500 (16 days) | owned locations (627 of 627), laws (24), privileges, reforms, rulers, estates, economy, manpower, societal values, last war and last peace, treaties, overlord, rivals, situations | population 22,011.3k vs 22,013.2k (+0.01%); subjects, family and active wars moved, as they could in 16 days |

Two more checks:

- **The converter.** The cleaned-up `b2t.c` was checked against the original converter on a 1537 save. All 78 sections came out byte-identical.
- **The learner.** `learn_tokens.py`, seeded with the shipped table, was run on the 1437 pair. It reproduced all 986 entries, changed none, and proposed 19 new ones, which are unchecked and not in the table.

## Known gaps

- **Unresolved tokens.** A 1.3.11 save from 1537 still has 84 distinct `T_xxxx` field names, about 156,000 occurrences in all. Four of them make up 98% of those: `T_364b` (about 112,000), `T_2d33`, `T_3759` and `T_3dd1`. Everything a campaign snapshot needs resolves.
- **Guessed value types:**
  - `0x0167` is an 8-byte value of unknown type, left raw as `F64_<int>`.
  - An i32 between 43,800,000 and 61,320,000 is printed as a date (years 0 to 2000). A genuine integer in that range would be misprinted, and a date outside it is printed as a number.
  - f32 is printed with `%g` (6 significant digits).
  - Fixed-point is assumed to have 5 decimal places throughout.
- **The pre-zip header** (`SAV…` line and binary metadata) isn't decoded. The same metadata is repeated inside the gamestate, so nothing is lost.
- **Section pairing** in `learn_tokens.py` assumes both saves list their top-level sections in the same order.
- **Only 1.3.11** has been tested.

## Extending to a new game version

You need one text save and one compressed save taken at the same moment in the same game: save once in debug mode, then save again normally without unpausing.

```sh
python3 decode.py text_save.eu5 text_sections/
python3 decode.py compressed_save.eu5 bin_raw/ --tokens /dev/null
python3 learn_tokens.py text_sections/ bin_raw/ tokens-NEW.txt --seed tokens-1.3.11.txt
# repeat with --seed tokens-NEW.txt once or twice, then check:
python3 decode.py compressed_save.eu5 bin_check/ --tokens tokens-NEW.txt
```

Then compare `bin_check/` with `text_sections/`. Check for `T_xxxx` left over (`grep -o 'T_[0-9a-f]\{4\}' bin_check/*.txt | sort | uniq -c | sort -rn`), wrong names in the places you rely on, and whether the snapshot you extract matches. Look over the `.votes.json` file for close calls. Name the new table after its version (`tokens-1.4.x.txt`), keep the old one, and update this README.
