# The Desk

*Designer D, round two. Problems 4 (the returning reader, and the writer's continuity) and 5 (scale).*

## The idea

The Chronicle is written serially. After each session Trent and his collaborator add a few entries,
and every entry has to know what the earlier ones promised, who is alive, what the save actually says,
and which verses are already spent. At the moment all of that lives in their heads and in a 68,000-word
pile of Markdown.

**The Desk** is the open end of the book, where that working knowledge is set out. Its front door is
the **session cover**: what came out of the last session, what has passed, and what changed. Behind the
cover are five drawers:

1. **Threads.** Promises, questions, warnings and grudges the prose has made to itself. Each one shows
   where it began, where it was knotted again, and where (if anywhere) it was tied off.
2. **The court as it stands.** Everyone alive at the frontier, with their age, their office, and how
   long the book has gone without naming them.
3. **The verse concordance.** Every closing verse, in sura order, with a check before the next one is
   chosen.
4. **Awaiting the save.** Facts the book already tells but no save yet confirms, plus the continuity
   flags the build finds in the record.
5. **Before the next session.** A checklist generated from the other four, for the writers.

The Desk puts exactly one mark in the reading view: a **knot** in the margin wherever a thread begins
or comes back, with "follow this thread" beside it.

The mockup (`mockup.html`) has all of this built from the real material: the real latest session, 19
real threads (10 open, 9 tied) with every quote checked against the entries, the real living court of
48, the real concordance of 105 verses, and one real entry with its knots in the margin.

## Who it is for

**Trent first**, in both of his roles.

- **As the reader coming back**, he gets the cover. He played the session, so he doesn't need a
  summary of the game. He needs to see what the *book* did with it: seven entries, 3,166 words, six
  threads begun, one tied, stability down ten, the burghers delighted and everyone else angry.
- **As the writer about to go on**, he gets the drawers and the checklist. A promise falls due at
  Ismāʿīl's accession. The naft sold to Ethiopia has been quiet for sixteen years. Muḥammad ibn Yūsuf,
  a prince of the blood, hasn't been named in 35 years. Three granddaughters turn sixteen in 1446 and
  have no person records.

**Friends come second.** For them the Desk is a curiosity at the back of the book: the chronicle's own
notebook. It is protected by the **frontier rule**:

- The Desk stands at the end of the book and says so at its door.
- Open threads describe only the frontier.
- Tied threads are folded away behind "Tied threads tell you how things turn out. Show them anyway."
- In the reading margin, a knot only ever points **backward**. It says where the thread began, and
  "follow this thread" shows the knots up to the one the reader is on, then "this thread goes on for
  three more knots".

A switch in the masthead ("Reading as Trent / a friend") sets this. It is not the site-wide veil over
the future, which belongs to another designer. It is only the Desk keeping its own counsel.

Where the two readers pull apart, I favour Trent. The Desk is a working surface first.

## What the material showed (found while building the mockup)

Building the Desk against the real record turned up problems that the current site, whatever it is,
evidently doesn't catch. That is the strongest argument for it.

- **The verse rule has been broken eight times.** The brief says each verse is "never repeated", but
  eight āyāt are used twice, almost always in different English wordings. 3:26 closes both the Peace of
  Balansiyya (1340) and the Restoration of al-Andalus (1375). 94:5–6 closes the Debt Paid (1346) and
  the Throne That Endures (1370). 2:216, 3:140, 17:81 and 49:13 are each used twice, and 2:251 and
  65:2–3 are used twice in part. A check by wording misses all of these. Only a check by sura and āya
  catches them, and **the material doesn't record the reference.** For the mockup I supplied all 105
  references myself. They need confirming.
- **Not every entry closes with a verse.** Three entries close without one (1339, 1348, 1350), and one
  (the Summons of 1346) opens with its verse instead.
- **A dead man sits in the dīwān.** Yūsuf ibn Saʿd died in 1435 (*Of the Emperor's Pilgrimage*), but
  the cabinets of the 1438 and 1442 saves still list him, "promoting Andalusī culture". Probably the
  extractor matched the wrong Yūsuf.
- **Eight people were never buried.** No death is recorded, and they would be past 85 or have been out
  of the record for half a century. Najīb of the ʿulamāʾ would be 126.
- **Nine children of the house have no person records.** They were born between 1430 and 1434. The
  chronicle counts them as "nine grandchildren" and names two. The eldest come of age in 1446.
- **The oldest unsettled fact is from 1339.** A player note says "exact date to come from the next
  save". It never came.
- **Two princes still carry stale offices.** Their person records say "member of the dīwān", but they
  are absent from the 1442 cabinet.
- **There is no session log.** Nothing records which session wrote what, so the cover in the mockup is
  reconstructed: everything after the save of 16 January 1438. Of that session's 12 facts, 2 rest on a
  save and 10 on Trent's account and screenshots. The last two entries come after the last save.

## The data it records

As little new data as possible. Most of the Desk is computed.

### New: `sessions.json` (one record per session, appended at the end of each)

```json
{ "n": 41, "played": "2026-11-07",
  "span": { "from": "1438-01-16", "to": "1443-06-26" },
  "checkpoints": ["1442-06-11"],
  "entries": ["0841-10-12-of-the-charter-of-majrit-...", "..."],
  "recap": "In the years after the admiral prince put to sea, ...",
  "copyist": "path/to/ooc-note.md",
  "threadPass": { "opened": ["fernando-po"], "knotted": ["umara-grievance"], "tied": ["the-slow-prince"], "letGo": [] } }
```

The session number, and which entries came out of it, can be **backfilled from git**: one commit per
session already exists by the repo's rules. The `recap` is about 80 words in the chronicle's own voice.
The voice already recaps itself in "Consider what he left" and in its book-closings, so the recap is
native to it, not bolted on.

### New: `threads.json`, anchored by quotation, not by markup

```json
{ "id": "price-of-shant-yaqub", "title": "The price of Shant Yāqub",
  "kind": "debt", "status": "open",
  "gist": "Muḥammad pulls down the Apostle's shrine. ...",
  "frontier": "The cost of the Apostle's shrine 'remains to be seen'.",
  "due": null, "people": ["muhammad-ibn-ismail-ibn-saad"],
  "knots": [
    { "entry": "0833-10-23-of-the-war-of-shant-yaqub-...", "role": "open",
      "quote": "What the destruction of the Apostle's shrine would cost al-Andalus, and when, and to whom it would be paid, remains to be seen." },
    { "entry": "0834-02-16-the-close-of-the-book-of-the-marches", "role": "knot",
      "quote": "The court has not forgotten Shant Yāqub." } ] }
```

- **Kinds:** promise, question, omen, grudge, debt, motif, venture, object.
- **Roles:** open, knot, tie, echo.
- **Statuses:** open, tied, and **let go**, for a thread the writers deliberately drop. Recording that
  is more honest than leaving it hanging.

The quote is the anchor, so the prose stays clean Markdown with no `{{knot}}` tags. If an edit removes
the sentence, the build reports a **broken anchor**.

### Small additions to existing files

- Entry front matter gets `verse: "3:26"`, plus `verseAt: opens` for the rare entry whose verse comes
  first.
- The person record gets `fate: "offstage"` (with an optional year) when the writers decide that
  someone died without a line.

### Computed at build (nothing to keep up)

- **The court:** the living, their ages at the frontier, their offices from the person records and the
  latest cabinet, their last mention, and the silence since.
- **Verse:** the concordance and the repeat check.
- **Awaiting the save:** everything dated after the last checkpoint, and every `player_note` still
  marked "to come".
- **Flags:** the dead in a later cabinet, the unburied, the unrolled, stale offices.
- **The cover:** the deltas between the session's checkpoints and the one before it: vitals, estates,
  privileges gained and lost, the land and sea temper, deaths and first appearances.

## Seeding the threads, and keeping them up without homework

**The seed (once, about an evening).** The collaborator reads all 108 entries, looking for the
chronicle's own forward-pointing idioms. The voice is consistent, so they are easy to find: *"in time
the court would learn"*, *"would one day"*, *"did not forget"*, *"remains to be seen"*, *"belongs to
another book"*, *"the question did not die"*, *"waits"*, *"promised"*. A plain grep over the folder
found about 70 candidate sentences. The collaborator turns them into draft threads with their quotes,
and finds the later knots by meaning, not wording. This is where the runner-up idea of **the book's
memory of itself** helps: later entries echo earlier ones ("the court did not forget it" in 1371, "the
ʿulamāʾ … let it pass" in 1392), and a similarity pass between entries proposes those links. Trent
accepts or rejects them in one sitting. The 19 threads in the mockup took one careful read of about
35 entries, which suggests a full seed of 40 to 60 threads.

**The thread pass (each session, about five minutes).** It is folded into the ritual that already
exists. After the new entries are written, the collaborator reads them against the open threads and
proposes a short diff:

```
+ knot   umara-grievance  ← "The two estates that had hated each other for a year voted together…"
+ open   fernando-po      ← "The Jamāʿa asked for it, the burghers offered to share the cost…"
= tie    the-slow-prince  ← "…he understood a new idea, once he had it, better and faster than most of them."
? let go catalan-privileges (quiet 12 years)
```

Trent ticks each line. That is the whole chore. The session record (span, recap, copyist's note) is
written in the same pass.

**Before the next session**, the Desk turns all of this into a checklist: promises falling due, the
threads gone quietest, the members of the house the book has forgotten, who is coming of age, the
verses already spent, and what to confirm from the save first. The writing side gets its value from
the Desk without anyone having to open it like a database.

**Why it won't become homework:**
- Nothing is hand-maintained except the thread diff and the session record, and both are proposed by
  the collaborator.
- A thread is never "due for update". It is only re-touched when the prose touches it.
- The Desk flags, but never blocks a build.
- "Let go" is a legitimate ending, so the open list cannot silt up.

## How it's built, and how it grows

- **One build script** in the campaign folder (Python, the same shape as `work/gen.py` in my output).
  It runs inside the session, after the entries and data are written, and emits `desk.json` and static
  pages for GitHub Pages. There is no server and **no runtime AI**: every AI step (seed, thread pass,
  recap) happens in the session, where the collaborator already is, and is committed as data.
- **Checks the build runs:**
  - every thread quote still occurs in its entry;
  - every entry has a `verse:`, and no reference repeats;
  - no one in a checkpoint's cabinet died before that checkpoint;
  - no living person is past an age threshold without a `fate`;
  - births with no person record;
  - `player_note` facts marked "to come";
  - facts dated after the last save.
- **Each session adds:**
  - one `sessions.json` record and one cover (the old covers become a list of fascicles, each with its
    own "since you were last here");
  - a handful of thread changes;
  - the computed drawers, which refresh themselves.
- **For the reading view**, the Desk hands one thing to whoever builds the entry page: `knotsByEntry`,
  a map from each entry to the knots in it, with each knot's thread, index and quote. The entry page
  draws a small knot glyph in the margin beside the quoted sentence. Nothing else.

## Scale: 300 years, 400 entries, the next campaign

- **Open threads stay bounded.** They get tied or let go, so the frontier list stays at 10 to 30
  whatever the length of the book. The tied archive grows (perhaps 150 threads by entry 400) and is
  filtered by kind, person and book. The strips that place each thread on a 1337-to-frontier line need
  a zoomable or per-book axis past 200 years. In the mockup, recent threads already crowd the right
  edge.
- **The court is bounded** by mortality, at roughly 40 to 80 at any frontier. "Never buried" grows
  unless `fate` is used, which is the point.
- **The concordance grows linearly** (one verse per entry) and is read by sura, so at 400 it is still
  one sorted table with a check box. The real defence is the `verse:` reference, not the page.
- **Data size.** Thread paragraphs are embedded for the follow view. At 400 entries, split
  `desk.json` per thread, which is lazy and cheap.
- **Sessions:** a few hundred covers, listed newest first.

**Carries over to any campaign:**
- sessions and covers;
- threads, their kinds, the quote-anchor and the thread pass;
- the court and its silences;
- awaiting the save, the flags, the checklist;
- the knot in the margin.

**Specific to this one:**
- **The verse concordance.** It generalises to a register of the campaign's closing device, if it has
  one. A Burgundian chronicle might close on a motto, a Roman one on an augury. Same table, same
  repeat check, different reference scheme.
- **Hijri-first dates.**
- **The "never buried" thresholds,** set by era.
- **The kinds vocabulary.** "Debt" and "grudge" are this court's way of thinking.

## Boundaries

- I don't order the book: no contents, no catchwords. The cover lists the session's entries and
  defers to the book's own table of contents.
- I don't hold a site-wide reading position or veil. The friend switch and frontier rule are local to
  the Desk.
- The knot is my only mark in the margin. Glosses are someone else's.

## Effort and risks

**Effort**
- Build script and Desk pages: about 3–4 days.
- Thread seed: one evening with the collaborator, then an hour of Trent's review.
- Backfilling `sessions.json` from git: half a day.
- Confirming the 105 verse references and adding `verse:`: an hour.
- Per session after that: about five minutes.

**Risks**
- **The thread pass slides.** If Trent stops ticking, threads go stale silently. *Mitigation:* the
  cover shows "thread pass not done" for the latest session, and the checklist won't show "quiet
  threads" as trustworthy until it is.
- **Over-threading.** If every sentence with "would" becomes a thread, the list loses meaning.
  *Mitigation:* the seed proposes and Trent disposes. Motifs are kept few.
- **Spoilers.** The open list is about the frontier, which is itself a spoiler for a friend on page
  one. *Mitigation:* the frontier rule and the warning at the door. This is the weakest point for
  friends, and I accept it.
- **Wrong verse references** would make the check confidently wrong. They must be confirmed once by
  someone who knows the text.

## What the material couldn't support

- **Session boundaries.** The cover is reconstructed; it needs `sessions.json`, backfilled from git.
- **Verse references.** None are recorded; mine are proposals.
- **Threads.** None are marked; mine are 19 hand-read examples, not a full seed.
- **Trent's out-of-character notes** aren't in the folder, so the copyist's corner shows the provenance
  tally and a placeholder.
- **Foreign deaths are rarely recorded,** so "Abroad" means "last heard of".
- **No children born after 1434 are in the record.** The house is probably larger than the court
  drawer shows.
