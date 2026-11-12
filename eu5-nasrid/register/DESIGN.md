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

## Second pass: showing the story

The first version was clean but still mostly rows. The second leads with pictures and keeps the rows
underneath as the record.

- **The story** is now the front page. A map of the western Mediterranean shows the realm at any of the 85
  reckonings; the frieze is its scrubber and "Play" runs the whole campaign, 1337 to the present. Beside it:
  the year, the reckoning's headline, the ruler, and whether the realm is at war.
- **Eight books as chapters.** Each has its summary, a map of the realm at its end with the outline of where
  it began, one sentence of growth, the people who drove it as seals (an eight-pointed star holding the
  name), and its tellings as a strip of scenes.
- **A war on its ground.** A war's page opens with its battles on the map, numbered in order, won or lost.
- **Lives side by side.** A person's page opens with their life as a line beside their parents, children,
  allies and rivals, with reigns marked and the turns in their story pinned to the year.
- **The weave.** The threads page shows every story thread across the years, entries as strokes and
  tellings as tiles.

## Third pass: the atlas, a narrated map, the house

- **The atlas** is one map looked at five ways, at any reckoning: who holds what (with the neighbours
  named), how the realm grew (every border laid over the last, oldest darkest), faith and tongue (each town a
  tile sized by its people and filled by the share who are Muslim or Andalusī), and every battle placed so
  far. It draws realms as outlines and towns as tiles, with no location polygons, so it stays light.
- **The story's map narrates.** Beside the year and the reckoning's headline it now names the books in
  progress and shows the ruler's seal with what drives them at that date.
- **The house of Naṣr** is a tree of 24 of the 71 Naṣrids on record: rulers, the people the story follows,
  and the fathers who link them. Each node counts the children left out and names the mother where the
  story follows her.

## Three closing passes

**Finding your way.** The record's head stays in place: the frieze marks the year under it, a panel replaces
the long thread menu, the four tones are a legend that can be switched off, and there is a word search and a
count of what matches. A button returns to the top from anywhere. Books have links of their own, a telling
says which book it belongs to, a war's page leads with its map, and on a phone the scrubber sits directly
under the map.

**Seeing more.** The atlas colours Castile, Portugal, Aragon, France and England (later the Angevins) while
they are not subjects, enlarges to the full window, and steps with the arrow keys. War maps join al-Andalus's
own battles in order.

**What was missing.** Three things from the Chronicle earned a place:
- the crown against the estates, as one chart of shares of power since 1346 with the decrees and Jamāʿas
  marked under it, and contentment in a table beside;
- the realm's rank among the great powers;
- the Muslim and Andalusī shares of the people, in the count.

Left out on purpose: prosperity, control, occupation and ruin by province; the building ledger; the cabinet
through time; the verse index. Each is a table of facts with no story attached yet. If one becomes a story it
should arrive as a thread with its own picture, as the estates did.

## What it does not carry over (yet)

- The Atlas's finer lenses (prosperity, control, ruin, occupation) and its province-level detail.
- The names switch (court names or plain names), the book structure of eras, the verse checker.
- Places as pages.

## Limits of the prototype

- Threads were assigned by rule during import (by war, by kind, by keyword). They need a pass by hand.
- "Lesser" entries (allied battles, minor births) were also chosen by rule.
- The writer's notes were attached to the telling they named; some cover several tellings.
- The long notes on people are carried as they were. In this model they should shrink to a few lines, since
  the record now does their work.

## Pass seven: vassals, fading battles, wars before and after, character

- **Atlas, who holds what.** Allies' and rivals' own vassals are drawn in a paler wash of the same colour, as the crown's ṭāʾifas already were. A rival that changes its name is one entry in `campaign.yaml` with several tags and a name per tag, so the legend reads "England" until the save in which it becomes "The Angevins".
- **Atlas, battles.** A battle is bright while its war is being fought and fades over the dozen years after the war ends, down to a faint mark. This year's battles are largest.
- **Enlarged map.** The enlarged atlas fits the whole frame inside the box instead of cropping to fill it, so no lens loses the north of Iberia.
- **Wars.** Under the battle map, each war with sides that could be matched to realms shows the land before and after: the crown, its subjects, its side and the other side, with each side's vassals paler. Sides are matched by name through `aliases`, so a minor lord can be missing.
- **People.** The three measures (Rule, Counsel, War; out of 100) are drawn as gauges beside the traits as chips. Childhood traits are dashed.
- **Story.** Each book folds to its title, span and a one-line tally. The choice is remembered in the browser; a link to a book opens it.
