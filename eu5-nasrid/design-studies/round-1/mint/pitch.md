# Dār al-Sikka: the Mint Cabinet

**The question it answers:** *what was the realm worth at each moment, and how did it change from one hand to the next?*

Every save strikes a gold dinar for the reign it falls in. There are 72 coins so far, kept in a cabinet with one drawer per ruler: Yūsuf I (25 coins), Saʿd (23), Ismāʿīl (13) and Muḥammad V (11). A coin is something people already know how to read: who issued it, where, when, and whether the gold is good. It's also a fixed shape, so a row of coins is a chart. The cabinet uses both: one coin is one moment you can read at a glance, and one drawer is a reign you can see whole. The coins are struck for this chronicle and are not replicas. They carry the Naṣrid motto and the ruler's name, and nothing else in the way of religious text.

## The coin grammar: four readings, nothing more

There are four readings on a coin, and the legend card explains all four on a card the size of a playing card.

| Reading | What it encodes | Scale | In this campaign |
|---|---|---|---|
| **Size** | Land: locations held directly (`locations`) | **Area** is proportional to locations: diameter = 11 px × √locations at drawer scale. The scale is fixed for the whole campaign and never refitted per drawer. | 18 locations gives 47 px (1337), 118 gives 120 px (1378), 241 gives 171 px (Ṣafar 1430). The legend has gauge rings at 25, 50, 100 and 200. |
| **Metal** | The purse: treasury against debt | Three grades plus a blank. **Fine gold**: the treasury holds at least what is owed. **Pale gold**: debt exceeds treasury. **Base** (grey billon): debt is more than 5× the treasury. **Blank**: nothing recorded. | 48 fine, 13 pale, 10 base, 1 blank (the start save, before the economy settles) |
| **Countermarks** | Wars under way at the save (`wars`) | One square punch per war. Tapping a punch names the war. | 46 coins have no punch, 23 have one, 3 have two |
| **Words** | Who, where and when | The square cartouche holds the Naṣrid motto *wa-lā ghāliba illā-llāh* ("no victor but God", the same on every coin) over the ruler's name in Arabic, with the Latin form beneath. The four segments around it hold the title, the mint (capital), the Hijri year and the Western year. The rim is beaded and plain. | The title turns from *Sulṭān* to *Emperor* on 16 March 1375. The mint moves from Gharnāṭa to Ishbīliya in 1379. |

At drawer scale only size, metal and punches show. The words appear once a coin is bigger than about 90 px. That's on purpose: the drawer reads as a chart and the single coin reads as a document.

**Encodings I cut, and where they went.** I dropped rank rings, because the title already says it. I dropped a clipped edge for plague years, because population swings at treaty saves when lands pass to the ṭāʾifas, so clipping would be noisy. I dropped wear for stability, a pierced hole for years under tribute, a star for each subject kingdom, and estate tinting. **All of these move to the reverse.** Every one of them was tempting. Together they made the coin something you decode rather than read.

## The reverse: the ledger

Flipping the coin shows the save's ledger. The full Hijri and Western date runs around the lower rim. The centre gives the purse: treasury, debt, and monthly income against expenses. A ring of six arcs shows the estates' power (crown, umarāʾ, ʿulamāʾ, burghers, commoners, dhimmī), with arc length as power.

Satisfaction is drawn **against the level the crown holds each estate at**, not on an absolute scale. The owner sets each estate's tax rate to keep it at a chosen level. For most estates that's 50, where one bad event or a privilege given to a rival can't tip them into anger. The umarāʾ are held nearer 40 so they can be taxed harder. A flat 50 is policy, and a move away from it is news. So an estate sitting at its held level gets a plain arc with no mark. An estate more than 3 points off gets a notch showing which way it moved and by how much (▲+24, ▼−16). Most reverses are therefore quiet. The 1442 coin, ten days after the burghers were seated, shows five notches: burghers ▲+24, commoners ▼−16, umarāʾ ▼−8, ʿulamāʾ ▼−6, dhimmī ▼−5. That is the crisis of the Golden Century's eve, at a glance.

The held level isn't in the data, so the build infers it as each estate's most common satisfaction across the campaign. That gives 50 for five estates and 40 for the umarāʾ, which matches what the owner describes, and a per-campaign setting can override it. Because the umarāʾ's power is the figure that really moves over the century (from about 47 in 1337 to about 17 to 19 from 1428), the drawer has a **thread** option. It draws the umarāʾ's power as a thin line along the rail under the coins, a decades-long cut you can see at drawer scale without adding anything to the coin. Around those sit the land, the people (with the Muslim share), the realm's peace (stability), men and ships, and the overlord or the subject kingdoms. Sovereignty over the Strait closes the ring.

**Provenance becomes relief.** A figure read straight from the save is struck sharp. An estimated one is stippled; this campaign's estate powers are all estimated, so the whole estate ring is stippled. Anything the writer added sits off the coin, on a paper ledger slip tucked under it: the save's title, the note, the source save file. The ledger slip also gives every figure as plain text, for screen readers and for anyone who would rather read than decode.

## Reading the coins as a set

- **The cabinet.** Four drawer fronts, each with the reign, its dates, its coin count and a thin silhouette of the coin sizes. You can tell the shape of a reign before opening it.
- **The drawer as a chart.** Coins stand on a rail, bottom-aligned, spaced by real time, so the fifteen silent years between 1379 and 1394 show as empty felt. The size profile is the realm's land, the metal is its purse and the punches are its wars. Yūsuf's drawer reads as a story without a word: a run of small grey coins through the debt years of 1340 to 1346, with one coin briefly swollen at the Aragonese peace. Gold returns as the debt is paid. The coins grow after the Peace of Qurṭuba in 1349, drop back for a single save in February 1353, and stay large and gold until his death.
- **Sort the tray.** Coins slide into order by *date*, *land* or *purse*. Sorting by purse brings out the two lean stretches at once: the base coins of 1340 to 1346, and the long run of pale and base coins from 1379 to 1428.
- **Compare two coins.** Drop any two coins (from any drawers) on the scales. They sit side by side at true relative size, and the pan tips toward the richer purse. Below is a short table of differences: land, treasury, debt, people, peace, wars and estates.
- **The plain table** is one tap away from any view. It's the same 72 rows with the legend's columns plus the ledger's, sortable, with the Hijri date beside the Western one. The coin never stands between a reader and a number.
- **A names toggle** switches the coin and the ledger between chronicle names (Ishbīliya, umarāʾ, dīwān) and plain names (Seville, nobility, cabinet).

## Printable: the rubbing sheet

Each drawer prints as a rubbing sheet (A4 or Letter): charcoal impressions of every coin at true relative scale on a time rail, with the date and save title under each and the legend card in the corner. A one-page "whole cabinet" sheet puts all reigns on one rail. It's made with CSS `@media print` from the same SVG, so there's no separate pipeline.

## How it's built, and how each save strikes a coin

1. **Build step.** A small script, run in the same rebuild that already handles the data, reads `checkpoints.json` (plus people, wars and places for names) and writes `coins.json`. That's one trimmed record per save, about 1.3 KB each: 95 KB now, about 0.5 MB at 400 saves, split per reign if needed. Hijri dates are computed with the tabular calendar, treating the game's dates as Julian. That matches the chronicle samples to the day (1 June 1442 is 21 Muḥarram 846, 7 August 1442 is 29 Rabīʿ al-Awwal 846, 3 November 1430 is 16 Ṣafar 834).
2. **Renderer.** A deterministic `strikeCoin(record, skin, size)` function returns SVG. It uses no images, and its only dependency is a webfont for Arabic (Amiri).
3. **Pages.** These are static HTML on GitHub Pages: cabinet, drawer, coin detail (a deep link per save, e.g. `#1442-06-11`), compare, table and print.
4. **A new save.** The extractor appends a checkpoint, the rebuild writes the new record, and the coin appears at the end of the current drawer, marked as *newly struck*. A new ruler opens a new drawer. The size scale is a single constant for the campaign. If a realm ever outgrows it, changing the constant rescales every coin together, so comparisons stay honest.

## What the data can't support (or needs checking)

- **Debt sits at 565 in every save from 1379 to 1442.** It is read from the save, and the 1442 note repeats it, but sixty years without change is worth checking. It decides the metal of most of the 13 pale coins.
- **Land swings at treaty saves.** 1430-11-03 shows 241 locations and 1430-11-05 shows 196, once the ṭāʾifas of the north are made. The coins show the swing as it is, with a tooltip explaining it. It's a real story, but a reader could mistake it for a loss.
- **No plain English place names.** `places.json` has the chronicle, Arabic and game forms (*sevilla*) but no "Seville". The names toggle needs a short list of plain names, or a new field.
- **The level each estate is held at isn't recorded.** The data has satisfaction but not the tax rate or target behind it, so "policy versus news" comes from the inferred most-common level. That inference is right for this campaign as the owner describes it (50 for most estates, about 40 for the umarāʾ). A per-save field for the estate tax rate or target would make it exact, and would carry to campaigns played differently.
- **Estate powers are all estimated**, and the stippling says so. The Hijri dates are computed, not read, so they're flagged as tabular.

## What carries over

The **engine** and the **grammar** carry over to any campaign: one token per save, and the same four readings of size for land, metal for purse, punches for wars, and words for who, where and when. Someone who learns one cabinet can read the next.

The **skin** is specific to each realm: the coin's shape, the field layout, the script, the motto, the metal names and the rim. Naṣrid Granada gets a legend-only dinar with a square in a circle. A Christian kingdom gets a cross-and-shield penny or florin; there are no portraits in the data, so heraldry stands in. A Ming campaign gets a round cash coin with a square hole and four reign characters, and a Japanese one gets an oval koban. A skin is a small config plus one SVG layout function. A ṭāʾifa seal tray (a token per subject kingdom) is a natural later addition.

**Effort:** medium. Roughly: renderer and skin 2 to 3 days; cabinet, drawer, compare and table 3 to 4; print sheets 1 to 2; about two weeks for one person in all.

**Biggest risk:** the coin becomes a puzzle. The four-reading limit, the words only appearing at large size, and the table one tap away are all there to stop that.
