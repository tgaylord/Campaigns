# Six Numbers: a long read that finds its own stories

**The question it answers:** *What actually happened to this realm, and how do we know?*

A newspaper-style long read, in the manner of the big graphics desks. Each chapter is built on **one number** that the saves can prove. The reader scrolls; one graphic stays pinned and changes step by step as short passages of text pass it. Every figure is marked with where it came from. The chapters are not chosen from scratch each time: a **story finder** runs over the data at every save and proposes numbers worth a chapter. The writer accepts, edits, merges or dismisses its proposals. The finder is the reusable part. The words stay the writer's.

## What the reader sees and does

- **An opening** (the issue's cover): a title, the span in both calendars, and a grid of six big numbers. Each number links to its chapter.
- **Chapters.** Each one opens with a huge number and a headline, then runs 5 to 8 scroll steps. Each step is a card of 40 to 80 words with a date and a provenance mark. The chapter ends on a line from the chronicle (it always ends in the court's voice), a **Make a card** button and a fold-out headed "How this chapter was found".
- **Two global toggles**, remembered per reader: **Hijri / Western** (the chronicle's order is Hijri first, with the Western date in brackets) and **chronicle names / plain names** (Ishbīliya / Seville, ʿulamāʾ / clergy). Both toggles apply to charts as well as to text.
- **Share cards**: a 4:5 card for each chapter with the number, one sentence, a thumbnail of the graphic, dates in both calendars and the provenance mark.
- **"Since this was written."** When later saves move a published chapter's number (the Sunni share keeps rising after 1442, say), the chapter gets an automatic footnote: *60% when written; 64% at the save of 1460.* The prose stays as written.
- **Print.** Every step is also rendered as a still, so a chapter prints as a strip of small multiples. The same stills make the no-JavaScript version and the share-card thumbnails.

## Issue I: the six numbers as of 1442

| Number | Chapter | Proposed by the finder as | Data |
|---|---|---|---|
| **42%** | The Pestilence took two in five, the cities first | `drop · people · −45% (same towns)`, edited to the exact same-lands figure | checkpoints; events of 1348–1352 |
| **39.7** | Sovereignty's floor, then 100 by 1360 | `record · sovereignty` | checkpoints.strait |
| **5×** | Conquered, then given away: 18 → 241 → 196 towns | `pattern: breath · towns` (found 5 times) | checkpoints; places.held (`via`) |
| **98 → 23 → 60** | Swamped by conquest, won back (the Book of the Call) | `reversal · sunni_share` | checkpoints.population |
| **38 years** | The ships came first; the realm's temper followed | `plateau broken · land_vs_naval` + `lead/lag · ships` | realm-readings; checkpoints |
| **#2 / −13** | Second power in the world, least at peace (1414) | `record · world_rank` + `record · stability`, same save | world-rankings; checkpoints |

The mockup builds the 42% and 38-year chapters in full.

## The story finder (the heart)

**Input:** every checkpoint and reading as time series, plus a small **campaign config**. The config lists which fields to read, their units, their provenance, the player's country tags over time, which series are *held* by policy and which pairs might lead or lag each other. Nothing else is campaign-specific.

**Detectors** (all working in `finder-sketch.py` against this data; its output is in `finder-output.txt`):

1. **Drop.** The steepest fall from peak to trough. For realm totals it only compares checkpoints with the same number of towns, so a conquest can't hide a loss. For bounded scales it measures the fall as a share of the series' range.
2. **Record.** An all-time high or low reached in mid-campaign.
3. **Plateau broken.** Frozen for 20 years or more, then moving: −36.9 for 51 years, then +62.9.
4. **Reversal.** A long trend one way, then the other: Sunni share 98 → 23 → 60.
5. **Breath.** Towns jump by more than 15% and fall back within a year. This is conquest followed by release to ṭāʾifas, and it fires 5 times.
6. **Lead/lag.** One series reaches half its change decades before a related one. The ships got there by 1404; the temper only in 1442.
7. **Departure from a held level.** The owner holds most estates' satisfaction at 50 and the nobles' near 40 by setting their taxes, so **a flat line is policy, and a move off it is the news**. The finder learns each held level as the series' most common value (50 in 51 of 71 saves for the ʿulamāʾ) and flags departures. It flags any single save where **three or more estates break ranks at once** as a bigger story still: 11 June 1442 (burghers 50 → 74, commoners 50 → 34, umarāʾ 40 → 32) is the Jamāʿa of 846; 20 May 1363 is the War of Independence. The finder never reads a level holding at 50 as "nothing recorded".

**Guards:**
- **Transient saves.** A save that jumps away and snaps back (a revolt, a mid-war save) is noted but not used as a peak.
- **Gaps.** More than 10 years without a save (December 1379 to March 1394) is drawn dotted, and no detector treats it as a level line.
- **Estimated series** (most estate powers) can be proposed, but always carry ≈, and never become a headline without the writer's say-so.
- **Ranking.** A score from size, duration and rarity. Each proposal is stored under a stable id (detector + series + start window), so a dismissed proposal stays dismissed.

**Output:** `stories/proposals.json`. Each proposal holds a kind, a headline number, its evidence (dates and values), a suggested graphic and its provenance. After each save the finder also lists three kinds of change: proposals that are **new**, proposals whose numbers **moved** under a published chapter, and proposals that **broke** because the history was corrected.

**The desk.** The writer sees the proposals on a desk page that is built with the site but not linked from it. In practice Trent's session reads `proposals.json` and talks them through in chat. Each proposal gets one decision, recorded in `stories/desk.yaml`:
- **accept**, which creates a chapter stub with the graphic and steps pre-filled from the evidence;
- **edit**, which keeps the story but changes the number or window (the plague: −45% became the exact −41.9%);
- **merge** into another chapter (the plateau and the lead/lag became one);
- **snooze** until N more saves have come in;
- **dismiss** with a reason. The reason teaches the config: if "stability dips during every war" is dismissed twice, the finder dampens that detector during war years.

Only accepted chapters are published. The finder never writes prose.

**What it found on this data, honestly.** Six of its top 12 proposals fed four chapters. Two more (the estates breaking ranks in 1442, and stability falling from 38.7 to −13.1 between 1378 and 1414) are strong candidates for Issue II. The other two chapters came from lower-ranked records (sovereignty 39.7, world rank #2). Further down the list there is noise (the fewest ships, 4, in 1369). **The campaign's most important number, the 42%, it found only by accident**: it compared against the checkpoint of February 1353, taken during the Sevillan revolt, when only the old eighteen towns were held. The exact figure exists only because the writer compared the same lands across two saves by hand. The fix is in the extractor: **population for each location at each checkpoint**. With that, every "same lands" comparison becomes exact and automatic.

## How the long read grows

**Issues, with a live wire between them.** An issue is a set of 5 to 8 chapters with a cover. It is closed when a book closes, or after about 25 game-years, whichever comes first, and then frozen apart from the "since this was written" footnotes. Between issues, accepted chapters go out one at a time on a running **wire** at the foot of the index. The next issue is built from the wire plus anything the finder ranks highly across the period. Over several hundred years that makes 10 to 15 issues. The index page is a wall of every number from every issue, filterable by detector type and by book. The wall works as a contents page for the whole campaign.

## Phones, scrolling and honest figures

- **Native scroll only.** No scroll-snap, no wheel capture, no locking the page. The graphic is `position: sticky`. On a phone it sits in the top half and the step cards scroll up beneath it. A step becomes active when its top passes 85% of the viewport on a phone (65% on a desktop), so the change happens as the card comes in, not after it has covered the chart. Steps advance only as fast as the reader scrolls. Reduced-motion readers get instant state changes.
- **Three marks, everywhere:** ● **read** (from a save or the game's own panels), ◌≈ **estimated** (computed, such as the estates' power; drawn dashed in charts) and ✎ **account** (the player's record of his choices). The writer's colour never carries a number and never appears in a chart. A **derived** figure (one save against another) is "read", with its method spelled out: *same lands, two saves compared*.
- **A data note.** The checkpoints set `estimated` on the whole estate record, while the notes say only the *power* is estimated. The extractor should flag power and satisfaction separately. The mockup treats satisfaction as read.

## How it's built, and what happens at each save

1. The save is decoded into a checkpoint (the existing pipeline).
2. `finder` (Python, about 300 lines) runs over all series and writes `proposals.json`, plus a diff against `desk.yaml`.
3. The writer decides in the session. Accepted chapters become `stories/<slug>.md`: front matter for the number, the series, the graphic type and a list of **steps** (date window, highlights, annotation), each with its prose. Provenance is filled in from the data, never typed by hand.
4. A static generator renders every chapter with a small graphics library (d3): **unit dots, line with needle, step area, ranked bars, breathing map from place points, rank ladder**. It also recomputes the "since this was written" footnotes.
5. Headless Chromium renders the share-card PNGs and the print PDF from the same step stills.
6. GitHub Pages serves it. Nothing calls out at runtime.

## What carries over

- **Reusable as is:** the finder and its seven detectors, the guards, the desk workflow and `desk.yaml`, the step-spec format, the graphics library, the issue-and-wire model, the provenance marks, the calendar and name toggles (for any pair of name forms) and the share-card and print pipeline.
- **Per campaign, but small:** the config (fields, tags, held series, lag pairs) and the palette.
- **This campaign's own:** the six numbers, the prose and the chronicle lines.

## Effort and risks

- **Effort:** medium to large. The finder is small to medium (the sketch already works). The graphics library is medium. The generator and cards are small. **Writing is the real cost: about 2 to 4 hours per chapter**, about a day per issue.
- **Biggest risk: the finder over-proposes,** and the desk becomes a chore. To keep it in hand: a score threshold, snoozing, dismissals that teach the config, and a cap of 5 new proposals per save.
- **Other risks:**
  - Confounds the finder can't see (conquest, revolts, held levels it hasn't learned yet).
  - A good scrolly chapter needs editing that no detector can do.
- **What the data can't support yet:**
  - population per location over time (needed for exact plague-style comparisons);
  - urban against rural share over time (one snapshot only, in the 1350 event);
  - a reliable *why* (the finder sees movements, not causes; the cause is the writer's to give).
