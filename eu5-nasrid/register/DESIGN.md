# The Register: a second take on the Chronicle

A prototype, built from scratch on the same campaign. This note says what a campaign site is for, where the
Chronicle falls short of that, and what the Register does instead.

## What a campaign site is for

1. **Pick the game back up.** After a week away the player needs to know where the realm stands, what is
   still open, and who is alive. This is the most frequent use and it should take one screen.
2. **Read the campaign as a story.** For the player later, and for anyone he shows it to.
3. **Know what is true.** The save, the player's account and the writer's invention are three different
   kinds of claim. A reader should be able to tell them apart at the level of a single statement.
4. **Cost little to keep.** If logging a session is slow, the log falls behind play.
5. **Carry over.** The next campaign, in this game or another, should start from the same structure.

## Where the Chronicle falls short

- **Sixteen halls, twenty-four routes.** The Atlas, the World, the Kingdoms, the Provinces and the Strait
  are five maps. The Chronicle, the Codex and the Long Scroll are three ways to read the same entries. The
  Court, the Council and the House are three views of the same people. Each was a reasonable addition; the
  sum has no front door. The page that answers "where am I?" (the Desk) is the fourteenth item in the menu
  and is 12,000 pixels tall.
- **The prose carries the record.** A fact lives in a chronicle entry, and the structured data sits in its
  margins. To find out when Bastia fell you read a story.
- **Every fact is written many times.** The fall of Bastia is in an event title, the war's note, the
  general's note, a checkpoint note, a chronicle entry and an out-of-character note. Six places to keep in
  step, by hand. Notes on people and wars grow by appending and are never rewritten.
- **Provenance is a sentence.** "Save of 5 October 1447; Trent's account" is free text, so it can't be
  shown consistently or filtered. What was invented is listed in a separate note as long as the entry.
- **Open questions get lost.** "Where did 2,100 gold come from in March 1447?" was asked in chat and in a
  note. Nothing on the site holds it open.
- **Updating is a pipeline.** One save means edits to events by year, the people file, the wars file, a
  checkpoint, two Markdown files, then five generator scripts.
- **Three visual worlds at once.** Navy interface, parchment pages and gold display type, with an Arabic
  twin for every menu label. It is rich, and it is heavy.

## What the Register does

**Three things, one direction of derivation.**

- A **reckoning** is one reading of a save: the count of the realm, the court, and what was learned since
  the last one. One file each.
- An **entry** (a beat) is one dated fact in one sentence, with who, where, which threads, and how it is
  known: read from the save, seen on a screenshot, or told by the player.
- A **telling** is the story written over a handful of entries. It lists the entries it rests on. What it
  says beyond them is invention, and the page says so.

People, wars and stories are small registry files. Everything else, a person's record, a war's course, the
open threads, the line of years, is worked out from the entries. Nothing is written twice.

**Five pages instead of twenty-four.**

- **Now**: the realm at the last reckoning, what happened since the one before, the open threads with
  their latest entry, the questions nobody has answered, the count with its change, the court, one map.
- **The line**: every year of the campaign, entries as one-line rows, tellings set among them where they
  fall. Follow one thread or show everything.
- **Threads**: wars and stories. A thread page is the line filtered to it.
- **People**: fourteen at the centre, thirty-six often on the page, the rest on record.
- **About**: how to read the marks and how it is kept.

**One piece of ornament.** The frieze is a band of year-tiles in the glaze colours of Naṣrid tilework:
every year of the campaign, larger and darker the more was recorded, the reigns above and the wars below.
It is the timeline, the navigation, and the only decoration. Everything else is plain rows on white.

## What it does not carry over (yet)

- The Atlas and its lenses. The Register has one small map on the front page. The maps are the best part of
  the Chronicle and could be linked rather than rebuilt.
- The names switch (court names or plain names), the book structure of eras, the verse checker.
- Places as pages.

## Limits of the prototype

- Threads were assigned by rule during import (by war, by kind, by keyword). They need a pass by hand.
- "Lesser" entries (allied battles, minor births) were also chosen by rule.
- The writer's notes were attached to the telling they named; some cover several tellings.
- The long notes on people are carried as they were. In this model they should shrink to a few lines, since
  the record now does their work.
