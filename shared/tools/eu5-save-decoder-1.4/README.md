# EU5 save decoder, game version 1.4

Turns a compressed Europa Universalis V **1.4** save (`.eu5`) into the same Jomini-style text the game writes in debug mode, split into one file per top-level section.

- **Built from:** [`../eu5-save-decoder/`](../eu5-save-decoder/), the 1.3.11 decoder from the Rome campaign. That folder stays as it is for 1.3.11 saves. Use this one for 1.4.
- **Adapted by:** the Nasrid campaign (`eu5-nasrid`), October 2026.
- **Tested on:** game version **1.4.5** (build `ud009/release/next`, 23 October 2026). It has not been tried on 1.3.11 saves; use the 1.3.11 decoder for those.

The container, the value types, the output layout and the parser are unchanged from the 1.3.11 decoder, so its README remains the full reference. This page covers what 1.4 changed.

## Files

| File | What it is |
|---|---|
| `decode.py` | Command-line entry point: save in, sections out. Defaults to `tokens-1.4.5.txt` |
| `b2t.c` | The converter from binary gamestate to text, with the 1.4 changes below |
| `tokens-1.4.5.txt` | Token table: the 25 numeric field tokens a 1.4 save still uses, all in `metadata` |
| `jomini.py` | Parser for the text format (`parse`, `get`, `getall`, `DB`), unchanged |
| `learn_tokens.py` | Learns a token table by aligning a compressed save with a text save, unchanged. Kept for a later version that moves names back into tokens |
| `Makefile` | Builds `b2t` |

## Usage

```sh
make                                   # builds ./b2t (needs a C compiler)
python3 decode.py SAVE.eu5 OUT_DIR     # writes OUT_DIR/index.json and OUT_DIR/<section>.txt
```

Options are the same as before: `--tokens FILE`, `--b2t PATH`, `--whole`. Text saves are accepted and only split.

## What changed in 1.4

**Field names moved into the string table.** In 1.3.11 every field name was a bare 16-bit token, and the decoder needed a learned table of nearly 1,000 of them. In 1.4 almost every field name is written as an index into `string_lookup`, just as string values already were. Four token types are new:

| Token | Meaning | Payload |
|---|---|---|
| `0x0d5a` | field name, string-lookup index | 1 byte |
| `0x0d5b` | field name, string-lookup index | 2 bytes |
| `0x0d5c` | field name, string-lookup index | 3 bytes (assumed by analogy, not yet seen) |
| `0x0d43` | value, string-lookup index | 1 byte |

The 1.3.11 decoder doesn't know these tokens. It reads their index bytes as tokens, the brace depth goes negative, and `b2t` crashes. In `b2t.c` here they are value types that print the looked-up string. A field name read this way is treated like any other key: when it is `database`, the following block is indented one tab shallower, as the game does.

**Only the metadata still uses numeric tokens.** A 1.4.5 save from 1337 has 25 distinct numeric field tokens, every one inside `metadata` (`date`, `version`, `playthrough_id`, `code_version_info`, `compatibility` and so on). 23 have the same ids as in 1.3.11. The other two, `0x3fcf generic_action_keys_hash` and `0x3fce generic_action_keys`, are new, and their names were read off the text save. Nothing else in the gamestate needs a token table. Even with an empty table (`--tokens /dev/null`), every section but `metadata` decodes fully.

**Quoted strings are escaped.** `b2t.c` now escapes `"` and `\` inside quoted strings, as the game's text saves do. Before, the metadata `flag` (a quoted script with quotes of its own) came out unescaped and threw off a parser. This applies to any version. The 1.3.11 decoder still has the old behaviour.

## How it was validated

One text save and one compressed save were taken at the same moment (1 April 1337, start date, Granada). Both were decoded and compared token by token across all 88 sections:

- **31,604,133 tokens** in all; every one matches except two kinds:
  - `save_label` (1 token): the two saves were given different names.
  - `resistance` in `disease_outbreak_manager` (102,559 tokens): the text save writes `107374182`, the compressed save stores it as fixed-point and the decoder prints `1073.74182`. It is the same raw number, written with the decimal point five places in. Scale it by 100,000 if you need it to match the text save.
- `b2t` finishes at brace depth 0 with 49,195 string lookups.

## Known gaps

- **One save.** Only a single start-date save has been checked. A later save may use tokens not yet seen, such as `0x0d5c` (3-byte field index) once the string table passes 65,536 entries. Unknown field tokens still appear as `T_xxxx`, so they are easy to spot.
- **Value types** are guessed exactly as in 1.3.11: the date range for i32, `%g` for f32, 5 decimal places for fixed-point, raw `F64_<int>` for `0x0167`. The `resistance` case above shows that fixed-point isn't always meant as a decimal.
- **The pre-zip header** isn't decoded; its metadata repeats inside the gamestate.

## Extending to a new game version

First decode with an empty table and look for `T_xxxx`:

```sh
python3 decode.py compressed_save.eu5 bin_raw/ --tokens /dev/null
grep -oh 'T_[0-9a-f]\{4\}' bin_raw/*.txt | sort | uniq -c | sort -rn
```

If only a few remain, as in 1.4, name them from a text save taken at the same moment. If `b2t` crashes or the depth isn't 0, the version has added token types; find the token just before the depth goes wrong and work out its payload. If field names have moved back into numeric tokens, use `learn_tokens.py` as described in the 1.3.11 README. Either way, compare the result token by token with the text save, then make a new folder or table named after the version, and keep the old ones.
