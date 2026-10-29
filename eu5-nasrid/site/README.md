# The Nasrid Chronicle: site

The explorer for the Granada campaign, built from `../data` and `../story`. See `../SYSTEMS.md` §6 for what each hall shows and why.

## Running it

```sh
npm ci
npm run dev        # checks the data, then serves at http://localhost:5173/Campaigns/eu5-nasrid/
npm run build      # checks the data, builds to dist/, copies index.html to 404.html for Pages
npm run data       # only check the data and write src/generated/
```

`npm run data` is the quickest way to validate a new checkpoint or story entry. It exits with a list of every bad record or broken reference, and the build stops on the same errors.

## How it fits together

| Path | Role |
|---|---|
| `scripts/build-data.mjs` | zod schemas for every record, cross-reference checks, Markdown rendering, coastline clipping. Writes `src/generated/` (not committed). |
| `src/lib/data.ts` | Typed access to the bundle, lookups, date helpers, estate colours. |
| `src/lib/hijri.ts` | Gregorian (Julian before October 1582) to tabular Hijri. |
| `src/views/` | One file (plus its CSS) per hall. |
| `src/components/` | `EntityCard` (hover cards and in-app links), `MiniChart` (small portolan charts), shared bits. |
| `src/styles/base.css` | Palette, type, the rail, parchment folios, shared furniture. |

Fonts are Gentium Book Plus (text, full diacritics), Amiri (Arabic naskh) and Reem Kufi, all self-hosted through `@fontsource`.

## Writing a story entry

One Markdown file per entry in `../story/`. The file name, without `.md`, is the entry's id.

```markdown
---
title: The Day of the Salado
date: 1340-10-30          # Gregorian, as in the game
era: era-id
kind: chronicle           # or ooc
people: [yusuf-i]
places: [tarifa]
wars: [war-id]
sources: [event-id]       # events or checkpoints the entry draws on
---

The text, with links like [Yūsuf](person:yusuf-i), [Ṭarīf](place:tarifa),
[the war](war:war-id) and [the book](era:era-id).
```

An `ooc` note can add `about: <entry-id>` to sit in that entry's margin. Without it, it glosses the nearest earlier chronicle entry.

## Estate colours

Estates take the validated categorical slots in a fixed order (`ESTATE_ORDER` in `src/lib/data.ts`), with separate steps for the night ground and for parchment. Gilt is an interface colour only and never stands for an estate.
