# The Codex, with Canon Tables

*Designer A, round two. Owns problem 1 (the spine) and the scale half of problem 5: the shape of the whole book.*

## The idea

The Chronicle is published as **one codex**: a single bound book in which every entry is a leaf, in the order its dates fall. Each leaf carries a permanent **address taken from its Hijri date** (leaf 772·02·21). That address is its URL and its citation, and it never moves however much the book grows. The eight books are not separate volumes. They are **threads through the codex**, and each has its own rubric colour, opening page and closing rubric. The way into the codex is a set of **canon tables**. Medieval Gospel books used these arcaded concordances to show which passages ran in parallel. Here the years run down the page and each book open at the time keeps its own column, so the braid of overlapping books, the dense years and the silent ones can all be seen at once. Every leaf ends with two **catchwords**, as a scribe's quire ended with the first words of the next: one for the next leaf of the codex and one for the next leaf of this book. Reading in order and reading by thread are the same act. At each leaf you choose which catchword to follow.

Nothing in the design is decoration taken from manuscripts for its own sake. Each device solves one of the navigation problems:

| Device | Problem it solves |
|---|---|
| Hijri leaf address | A stable place to come back to, which also sorts the leaves into date order. |
| Canon tables | Eight overlapping books in one picture: read across for order, down for a thread. |
| Rubric colour per book | You always know which thread you are in, even while the codex braids. |
| Running head | Book, reign and year at the top of every screen, wherever you have scrolled. |
| Opening pages, *Here begins / Here ends* | The books' own boundaries, set in the reading order where they fall. |
| Two catchwords | "What next?" answered both ways, with no reading mode to switch on. |
| Ribbon | Where you stopped, kept in the browser. |
| Colophon | What the book holds as it stands, and a log of each binding. |

## Who it favours

Where they differ, it favours **the friend who meets it as a book**. A friend should be able to open it, press *Begin*, and read leaf to leaf with nothing to learn. The catchword at the foot of each leaf is the only control they need. **Trent** gets the tables as a map he can scan in a few seconds ("where was the Survey of the Kingdoms? the fourth column, 772"). He also gets addresses he can cite while writing ("as at 772·02·22") and a ribbon that remembers where he stopped. What's new for the returning writer belongs to another designer. This design only gives it a place to stand.

## 1. The spine: codex order and leaf addresses

- **Order.** Leaves are sorted by date. In this chronicle the Hijri order and the Western order are identical for all 108 entries (checked), so there is no ambiguity.
- **Address.** The address is `year-month-day` in the Hijri calendar, which is already the prefix of every filename (`0772-02-21-…`). It is shown as **772·02·21**, with "21 Ṣafar 772 AH · 14 September 1370" beside it. URL: `/leaf/772-02-21/`.
- **Collisions.** Six days hold two leaves each (747·07·01, 753·02·20, 797·09·03, 823·08·01, 834·02·16, 835·08·29), so those leaves get **a/b** suffixes, as folios have recto and verso. The rule is that a suffix is assigned once and never reassigned. A third leaf later written for the same day becomes **c**, even if it belongs between a and b in reading order, and an optional `seq:` field orders it. Today the build falls back to filename order, which gives a sensible result in all six cases. For example, *The Close of the Book of the Marches* comes after *The War of the Mountains*.
- **Corrections.** Correcting a leaf's text never moves it. Correcting its date does, and then the old address keeps a one-line page pointing to the new one.
- **Why not leaf numbers.** "Leaf 46 of 108" is shown in the running head for orientation. It is never used as an address, because back-filled leaves (the 1380s were written retrospectively) would renumber everything after them.

## 2. The canon tables

The contents page is a title page, a strip called "the run of the years", and then the canon tables.

**How canons are cut.** *A canon closes when a book closes.* The cut falls on the closing book's last leaf, which in this chronicle is always the leaf whose text says *Here ends the Book of…*. The canon's columns are the books that have leaves in it, ordered by when each book opened, so a book's column keeps its relative position from one canon to the next. This chronicle comes out as five canons, computed with no hand-tuning:

| Canon | Hijri / Western | Columns | Leaves |
|---|---|---|---|
| I | 738–747 · 1337–1347 | Mending | 12 |
| II | 747–752 · 1346–1352 | Balance · Pestilence | 17 |
| III | 753–772 · 1352–1371 | Balance · Call | 17 |
| IV | 772–834 · 1370–1431 | Call · Marches · Encircling Sea | 48 |
| V | 835–847 · 1431–1444 | Call · Encircling Sea · Franks · Golden Century | 14 |

**Rows** are Hijri years, labelled with the Western years they span ("772 · 1370–71"). A cell holds that book's leaves for that year, each with its day and month and its full title, clamped to three lines. Rows with no leaves merge into a **lacuna row**, a hatched band that says what the record holds: "No leaf · 792–793 AH · 1389–1391 · no save, the record is silent", or "1 save read, nothing written". A **reign rule** crosses the whole table where a reign begins ("Reign of Saʿd ibn Yūsuf, from 1 August 1363 · 19 Ramaḍān 764"). Each canon opens with the reign then in force. A column is drawn with fine colonnettes in its book's colour only while the book is open. Above that it is bare paper, so you can see a book begin partway down a table. *Here begins* and *Here ends* chips sit in the column at the row where they happen. Each column head is an arch carrying the book's Arabic title, its English name and its number, and links to the book's opening page.

**The run of the years** is a strip with one bar per Hijri year, stacked from leaf blocks in each book's colour. Below it, one dot marks each save read. Dashed lines mark each new reign, and grey bands mark any stretch of six or more years without a save. Click a block and you open that leaf. This is where the density and the gaps show at a glance. It also showed me something the brief had understated: there are **two** long stretches without a save, 782–795 AH (1380–1393) and 798–805 AH (1395–1403). The leaves of the 1380s sit inside the first, and the strip makes it obvious they were written from memory.

**What the tables answer**
- **In order:** read across the rows.
- **By thread:** read down one column, or open the book's page.
- **By reign:** read between two rules.
- **By year:** use the row labels or the strip.

**By person** is not answered here. That is the reference shelf's job, handled by other designers.

## 3. Rubrics, running head and the leaf

**Rubric colours.** Each book takes a manuscript pigment: vermilion (Mending), lapis (Balance), murrey (Pestilence), verdigris (Call), madder brown (Marches), azurite (Encircling Sea), kermes crimson (Franks) and orpiment gold (Golden Century). Each has a darker ink for paper and a lighter one for the dark theme. Colour is never the only signal. The book's name is always printed beside its colour.

**Running head** (sticky). The left side shows the book in its rubric colour and the reign: *The Book of the Balance · reign of Saʿd ibn Yūsuf*. The right side shows the Hijri year, the Western year and "leaf 46 of 108", followed by ‹ Tables › controls. A rule in the book's colour runs under the head, so the thread is visible at the top of the screen at every scroll position. The ← and → keys move through the codex.

**The leaf**, from top to bottom:
1. A **leaf head** line: *Leaf 772·02·21* on the left in the rubric colour, *Balance, leaf 24 of 24* on the right.
2. The **title** in the entry's own words, then the double date, Hijri first: *21 Ṣafar 772 AH · 14 September 1370*.
3. The **prose**, set as a book page: about 65 characters a line, justified with hyphenation on desktop and ragged right on a phone, paragraphs marked by indent rather than space. The first paragraph opens with a **framed initial** in the book's colour. The bold run-in headings that some entries use (the Survey of the Kingdoms: "**Of the far East.**") become rubricated small capitals, as in a manuscript. Person and place links keep a faint dotted underline, the hook the gloss design will use.
4. **Incipit and explicit rubrics.** A paragraph that says *Here begins the Book of…* or *Here ends the Book of…* is set as a centred red small-caps line, even when the sentence closes a longer paragraph, as in *The Debt Paid*.
5. **The verse colophon.** The closing Qurʾānic verse is set centred and apart, under a small eight-pointed star in the rubric colour. The page closes on it as a manuscript closes on its colophon.
6. **Explicit tally**, on a book's closing leaf only: *Explicit · The Book of the Balance — 24 leaves · 12,736 words · 747–772 AH · 1346–1370*. A still-open book's latest leaf says instead *The Book of the Franks continues, written as it happens*.
7. **Apparatus slot** (reserved). A dashed box at the foot marks where the annotated-edition design puts the sources, their provenance and the player's note. The outer margin is also reserved, as a dashed column on desktop, for its glosses. On a phone that column disappears and the slot becomes a note that glosses open as sheets from the names. I have deliberately designed neither.
8. **Catchwords** (section 4).
9. Quiet links: *‹ previous in the codex · ‹ previous in Balance · find it in the tables*. "Find it in the tables" returns to the contents with that leaf's cell outlined and centred on screen, its decade unfolded.
10. A one-line **leaf colophon**: word count, and the quire (save) it was read from.

**Book openings** are pages in their own right, and they sit in the reading order just before the book's first leaf, so a reader going straight through meets *The Book of the Call begins* between two Balance leaves, as they would meet a new part-title in a printed history. The page carries the frame, *Book IV of 8*, the Arabic title in large Amiri, the English title, the span in both calendars, the summary from books.json, and a line such as "18 leaves · 10,318 words · in Canons III, IV, V · runs beside the Book of the Balance, the Marches…" with each name linked. Below that comes the book's own column as a list of addresses and titles, the rubric *Here begins the Book of the Call.*, and a catchword to its first leaf.

## 4. Catchwords

At the foot of every leaf and every opening page, right-aligned like a scribe's catchword, each catchword has three parts: a label in the target's colour, the **first words of the next leaf** in italics ("*When the peace with Fās was sealed, our lord Saʿd ordered…*"), and the address and title in small type.

| Situation | What the foot shows |
|---|---|
| The next leaf is also the next of this book | One catchword: *Next leaf, and next in the Book of the Balance* |
| They differ (the common case while books overlap) | Two: *Next leaf · the Book of the Marches* and *Next in the Book of the Call* |
| A book opens next | *Next in the codex: The Book of the Marches begins · كتاب الثغور · Book V · 29 leaves* |
| This book is closed here | *The Book of the Mending of the State is closed. Its 12 leaves end here; the codex goes on.* |
| This book is open but has no later leaf yet | *The Book of the Franks continues, written as it happens. Its next leaf is not yet written.* |
| Last leaf of the codex | *This is the last leaf bound. The book stands open here.* |

There is no switch between reading modes. The page remembers which catchword you last followed, through or along a thread, and puts that one first next time. A reader who follows the Book of the Call from leaf to leaf finds its catchword on top without choosing anything.

## 5. Ribbon and colophon

**Ribbon.** The last leaf opened is stored in the browser's localStorage, wrapped in try/catch so the page works without it. The title page offers *Resume at the ribbon · 772·02·21*, and the leaf's cell in the tables carries a small red ribbon tab. That is all: the time control that would veil later events is another designer's.

**Colophon page.** It states what the book holds now: leaves, words, first and last leaf in both calendars, how many books are closed and how many open, and who sets it down. Below that is **the binding log**, one line per session, giving the date bound, the leaves added and any book opened or closed. *The brief's folder has no session dates*, so the mockup substitutes **quires**: leaves grouped by the save each was read from. That gives 55 quires, the largest holding 6 leaves. A real build takes binding dates from the commit history, assuming one commit per session.

## 6. On a phone

- **The tables fold into lanes.** The arcade cannot fit three or four columns at 390px, so each canon becomes a single list in codex order. Every leaf is a full-width line, with a narrow strip of **lanes** to its left, one 11px track per column. The leaf's own track carries a dot in its colour. The other tracks show a hairline while their book is open and nothing before it opens. The braid stays visible as the lanes thread down the edge of the screen, and the titles get the full width. *Here begins* and *Here ends* lines start and stop their lanes. Lacuna rows and reign rules stay full width.
- **Running head:** the short book name and the year only, plus ‹ Tables ›.
- **The leaf:** full-bleed paper with an 18px gutter, ragged-right text, the initial kept, and the margin slot moved inline. Catchwords stack.
- **Openings:** the same page, smaller.

## 7. Scale: 300 years, 400 leaves, many books

- **Canons are computed, never laid out by hand.** The rule (*a canon closes when a book closes*) keeps working however long the book runs. At this chronicle's rate (one canon per 20 years or so) 300 years means about 15 canons.
- **Decade folding.** Every table already groups years by Hijri decade. *Fold the years into decades* (working in the mockup) turns each decade into one row of coloured counts, ●●● 3, per column, and you click a decade to open it. Above about 200 leaves the build makes folding the default, with the current decade and the ribbon's decade left open.
- **Volumes.** Above about 150 years the contents gains a level above the canons: **volumes by Hijri century**, so this campaign would have the eighth century AH and the ninth (the change falls at 800 AH, 1397). That is how Arabic biographical dictionaries were divided, by century. The writer can override the breaks with a `volumes:` list. The contents then opens on a *table of volumes and canons*: one line per canon with its span, columns and leaf count, and a mini strip, each expanding to its table.
- **More books at once.** The table caps at **five columns**. If more than five books are open together, the desktop table also switches to lanes. The lanes still read well at eight tracks.
- **Colours beyond eight books.** There is a palette of twelve pigments, assigned like map colouring: a book takes the first pigment not used by any other book it shares a canon with. Two books can share a colour only if they never appear side by side.
- **The strip** stays one bar per year up to about 300 years, then becomes one bar per decade with the year bars on hover.
- **Size.** Static pages per leaf, plus one contents page that holds titles only. That is tens of kilobytes today and a few hundred at 400 leaves; volumes split it further. The mockup inlines all the text only because it is a single file.

## 8. How it is built

`build/build.py` beside the mockup is the real core of the build, not a sketch. It runs in well under a second:

1. Read every `chronicle/*.md`. Take the Hijri address from the filename and `title`, `date`, `era`, `people`, `places` and `sources` from the front matter.
2. Sort by address and assign a/b suffixes to shared days. Number each leaf within its book. Take the catchword text (the first eleven words of the first prose paragraph).
3. From `books.json`, take each book's first and last leaf, whether it is closed, and its span in both calendars, using the tabular Hijri calendar on Julian dates as the brief specifies. The conversion is checked against 21 Muḥarram 846 = 1 June 1442.
4. Cut canons (*a canon closes when a book closes*) and order columns by opening date.
5. Take reigns from `people.json` (`reigns`) and saves from `checkpoints.json`, giving the reign rules, the lacuna wording, the strip's dots and the quires.
6. Render pages: `/` (contents), `/book/<id>/`, `/leaf/<addr>/`, `/colophon/`. Each page is plain HTML that reads without JavaScript. Small scripts add the ribbon, the decade folding and the catchword ordering.

It is a static site on GitHub Pages, with no server and no third-party calls.

## 9. How it grows each session

| The writer does | The build does |
|---|---|
| Adds new leaves as usual (`HHHH-MM-DD-slug.md` with an `era`) | Places them in codex order and gives them addresses. Every existing address is untouched. |
| Opens a new book: adds it to `books.json` with `start` | Adds its opening page into the reading order before its first leaf, and adds a column to the current canon from that row down, with a colour from the palette. |
| Closes a book: sets `end`, and writes *Here ends the Book of…* | Sets the rubric and the explicit tally, and closes the canon there, so the next leaf starts a new canon. |
| Writes two leaves on one day | Assigns the next free suffix. Optional `seq:` orders them. |
| Commits the session | Adds a colophon line: date, leaves added, books opened or closed. |
| Nothing else | Lacunae, reign rules, the strip and the catchwords recompute. The previously last leaf's catchword now points forward to the new one. |

## 10. Carries over, and specific to this campaign

**Carries over unchanged:** the codex order, leaf addresses (with a pluggable calendar), canon tables and the canon rule, lanes on a phone, decade and volume folding, rubric-per-book assignment, the running head, opening pages, catchwords, the ribbon and the colophon log.

**Per-campaign configuration (a small file):**
- the address calendar and month names (Hijri here; Julian with regnal years for a Byzantine campaign, or Japanese era names);
- the century used for volumes;
- the pigment palette;
- the incipit and explicit phrasing, *Here begins / Here ends*;
- how the closing formula is detected (here, a final italic paragraph holding a verse; elsewhere, a psalm, a proverb, or none);
- the work's title and script.

**Specific to this campaign:** the Hijri addressing, the Qurʾānic verse as colophon with its star, the Arabic book titles in Amiri, and the title page's *تاريخ بني نصر* (*The Chronicle of the House of Naṣr*, a placeholder title of mine, since the material doesn't name the work).

## 11. What the material supports, and what it doesn't

- **Supports well:** stable addresses (the filenames already encode them), books with spans and Arabic titles, the court's own *Here begins / Here ends* sentences (seven of them), reigns, and saves to show where the record is dense and where it is silent.
- **Missing: session dates.** The binding log needs them. The mockup uses quires by save as a stand-in, and the real build uses commit dates.
- **Missing: same-day order.** Six days hold two leaves and nothing says which comes first. Filename order works today, and a `seq:` field would make it explicit.
- **Leaves are dated at their end.** An entry's `date` is the latest event it covers, so a leaf that looks back over years, such as *Of the Encircling Sea, and Fifteen Years of Building*, sits in a single row. An optional `from:` date would let the table draw a faint span bar up its column.
- **Thin columns.** Franks has 3 leaves in 12 years and the Golden Century has 3. Their columns in Canon V are mostly bare colonnettes. That is honest, but it looks sparse. Folding helps.
- **Book titles.** The English titles vary in form ("The Mending of the State", "The Call"), so the design builds "The Book of the …" from them and trims "of the State" in short labels.

## 12. Effort and risks

**Effort:** small to medium. The data pass (`build.py`, about 200 lines) and the renderer (the script in the template) already produce everything in the mockup. A production version adds per-page output, the config file, the colophon from git, and a typographic polish pass (real small capitals, hanging punctuation, a print stylesheet: the codex prints well).

**Risks:**
- **Hijri addresses are opaque to friends.** A friend sees "772·02·21" and learns nothing from it. Mitigation: Western dates always sit beside them, and the tables are labelled in both calendars.
- **Strict date order breaks scenes apart.** The Ṣafar 772 cluster reads Call → Balance → Marches over three days, and a friend may feel bounced between threads. That is exactly what the second catchword and the rubric colours are for. The opening pages also brief each thread as it enters.
- **Canon IV is long:** 48 leaves over 60 years. Decade folding handles it, and at scale the volume break at 800 AH cuts it.
- **The arcade can look twee.** It must stay hairline and quiet: paper, ink and a little colour, with no gilding or texture beyond the lacuna hatching.
