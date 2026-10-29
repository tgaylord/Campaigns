# The Nasrid Chronicle: site

An Astro static site built from `../data/` and `../story/`. See `../SYSTEMS.md` §6 for what it's for.

## Run it locally

```sh
cd eu5-nasrid/site
npm install
npm run dev        # http://localhost:4321/Campaigns/eu5-nasrid/
```

`npm run build` writes the static site to `dist/`.

## How it's put together

| Path | What it is |
|---|---|
| `src/content.config.ts` | The data model: schemas for story entries, eras, snapshots, events, people, places, wars. A build fails if any record breaks its schema or points at a missing id. |
| `src/lib/hijri.ts` | Game date → Hijri date (tabular calendar; Julian before 15 Oct 1582). |
| `src/lib/remark-entity-links.mjs` | Turns `[Yūsuf I](person:yusuf-i)`, `place:`, `war:` and `era:` links in story entries into site links. |
| `src/components/LineChart.astro` | Time-series chart over game dates; SVG at build time, crosshair tooltip in the browser. |
| `src/pages/` | One file per view. |

## Writing a story entry

One Markdown file per entry in `../story/`, named `YYYY-MM-DD-short-title.md`:

```markdown
---
title: The Sultan in the Year of the Tribute
date: 1337-04-01
era: era-id-from-eras-json
kind: chronicle        # or ooc
people: [yusuf-i]
places: [gharnata]
wars: []
sources: [checkpoint-id]   # or player
---

Text, linking [Gharnāṭa](place:gharnata) and [the sultan](person:yusuf-i).
```

## Sample data

Every record with `"sample": true` (and every `sample-*` file) is scaffolding. The site shows a banner while any is loaded. Delete them all with the first real checkpoint.
