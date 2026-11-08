# The Hourglass: one date the whole site obeys

**Designer B · round two · answers problems 1, 2 and 5; touches 4.**

The Chronicle is a book about time, and it already writes like one: Hijri first, with dated leaves, and with the gaps admitted in the prose. What a reader lacks is a sense of **where they are** in 107 years, and later 400, and an assurance that everything around the prose is telling them about *that moment*, not about the end of the campaign.

The Hourglass leaves the book alone. It adds two things:

1. **A rail.** A thin instrument along the edge of the screen draws the whole campaign to scale: reigns, books, every leaf, every save, and every silence. A **bead** on it marks the reader's place.
2. **A contract.** There is one date at a time, the bead's, and every reference view answers *as of* that date: a person's card, the state of the realm, a place, the header. On a first reading, nothing past the furthest point the reader has reached is ever shown. That's the **veil**, and Trent lifts it.

The mockup (`mockup.html`) runs on all 108 real entries, all 72 saves, the 762 events and the 137 people, with a draggable bead.

---

## 1. The contract, stated exactly

The whole design rests on four dates.

| Name | What it is | Where it comes from |
|---|---|---|
| **D**, the site date | The date the whole page answers to, shown in the header in both calendars | The bead |
| **date** of a leaf | The leaf's own date | Front matter `date` |
| **asOf** of a leaf | The last moment the leaf tells | max(date, latest cited event). 17 of 108 leaves tell events after their own date. *Of the Three Marches* (15 Sep 1370) narrates Faraj's death on 18 Sep. |
| **H**, the horizon | The reader's high-water mark | The largest asOf of any leaf the reader has opened. Stored per browser. ∞ when the veil is lifted. |

Rules:

* **Reading a leaf puts D at its asOf.** The cards therefore never contradict the page in front of you: if the page says Faraj is dead, his card says so too.
* **Dragging the bead moves D freely.** Every reference view re-renders live. The reading page only changes when you let go:
  * on or near a tick, that leaf opens;
  * on empty time, you get the **between leaves** page;
  * past H on a first reading, you get the **beyond the veil** page.
* **Every reference view splits its facts into three bands:**
  * **≤ D** is shown as the present.
  * **(D, H]** is shown faded, as "Later: you have read past this". You've already read it, so rereading 1351 after reaching 1370 hides nothing you've seen.
  * **> H** is never shown on a first reading. It's reduced to "There is more of him ahead".
* **If D itself is past H, every reference view is veiled.** That covers the realm panel, the cards, the reign line in the header, the reign bands, lanes and book colours on the rail, and the register ticks. What stays visible is what carries no story: dates, how many unread leaves lie ahead and how they are spaced, and the hatched save gaps.

## 2. What the reader sees

**The rail** (wireframes §1). The desktop rail is 176px wide and full height. On a phone it becomes a 78px strip along the bottom that expands to 220px. It has five columns:

* **Years**, in the current calendar: every 10 AH, or every 10 Western years.
* **Reigns** as bands. The two regencies are hatched: Faraj's while Yūsuf I was on the Ḥajj (1351–52), and Naṣr al-Istijjī's while Saʿd was a minor (1363–64).
* **Saves**, one tick each, all 72.
* **Eight book lanes.** Hairlines run side by side where books overlap, so today four lanes run to the present. Each leaf is a tick on its lane.
* **The register.** Every dated event is a 1px tick, grey if it was read from a save, orange if it comes from Trent's account or a screenshot. Dense years look dense, and the reader can see where the record leans on Trent's word.

Across all five columns, **hatching** marks every stretch without a save longer than two years. There are 14 of them, the longest running from 2 Dec 1379 to 4 Mar 1394.

The open leaf draws two things on the rail:

* Its **reach**, a thick stroke on its lane, from the earliest event it is the first to tell to its asOf.
* **Dotted rings** on the earlier leaves it deliberately recalls.

**The bead and the loupe** (§2). The bead is a red line with a year tab and a handle. While you drag, a loupe beside it shows the exact date in both calendars, the reign and regnal year, the five nearest leaves, whether you are inside a silence, and how many later leaves look back over this date. The loupe is the hourglass's neck: the one place where the rail is read at full detail.

**The header** always reads *The site stands at 25 Ṣafar 772 · 18 September 1370 / 8th year of Saʿd, Sultan of Gharnāṭa*. A toggle puts the Western date first.

**The glance strip and the realm panel** (§4). A one-line strip sits above the side panel at all times. It names the save behind the numbers and its age ("Save of 2 Dec 1379, 5 years 5 months before: the record is silent"), and gives towns, people and treasury.

The full realm panel then gives:

* the ruler at D, taken from the reign dates and so current even inside a silence;
* heir, capital, rank and place among the world's powers, labelled "at the save";
* towns, people, Muslim share, treasury, income, expenses, debt, stability and sovereignty, each with the value at the previous save;
* shares of power. These are drawn dashed and tagged *estimated* when the record says so, with the save note's own sentence on why: "Shares of power are estimated from the 1 June 1349 reading". In 1385 that sentence points to a reading 36 years old, and the panel lets the reader see that.

Its last section, "Since that save, up to this date", lists the register's events between the save and D, with provenance. That's what a silence actually holds: 11 items between December 1379 and June 1385, five of them from Trent's account or screenshots.

The panel has three freshness levels, so a stale save is never passed off as current:

* **under 3 months:** green;
* **under 2 years:** amber;
* **2 years or more:** hatched red, with the sentence "These figures describe 781 AH, not 787 AH".

**A person's card** (§3) opens from any name in the text and then **follows the bead**. It shows:

* **Status at D**: not yet born; living, with age (marked "about" when the record's birth date is a 1 January placeholder, as 24 of the 131 are); or died on a given date at a given age.
* **Station at D**: ruler and regnal year, regent, heir, or seat in the dīwān, each labelled with the save it comes from.
* **Known by this date**: the person's note, line by line, each line released once everything it mentions has happened.
* **In the register**: up to three dated events naming them, with provenance.
* **In the chronicle**: where you first met them, how many leaves by D, and where you last saw them.
* **Later**: the faded band, then the dashed "more ahead" line.

Undated roles and traits can't be placed in time. The card says how many it is holding back, and shows them only with the veil lifted.

A place's card follows the same rules: whether the crown held it at D, since when, or when it was lost; the dated lines of its note; and its mentions.

**Between leaves** (§5). Dropping the bead on empty time gives an honest page. It shows:

* that no leaf is dated here;
* the nearest leaves on either side, with distances;
* how long the chronicle is silent at this point;
* the record's state ("inside a 14 years 3 months stretch with no save…");
* **Told later**: the later leaves whose reach covers this date;
* the register for these months, labelled *data, not the chronicle's voice*.

**Beyond the veil** (§6). Dropping past H gives "This is past the point you've read to", says how many unread leaves would be skipped, and offers three ways on: *Back to where I left off*, *Read ahead anyway*, or *Lift the veil*.

**Trent, with the veil lifted.** The rail runs in full colour to the present. A dotted "last visit" line marks where his previous session ended. Leaves added since then carry a ring. Cards show the whole of "Later in the record", including undated facts. That's all the returning-reader support this design takes on. Open threads, the living court and continuity tools belong to another designer.

## 3. Derived dates the build computes

Everything above comes from fields the material already has, plus these derivations. They're computed once per build, not by hand.

| Derived | Rule | Notes from the real data |
|---|---|---|
| **Hijri date** of anything | The tabular calendar applied to the Julian date, with 1 Muḥarram AH 1 = JDN 1948440 and leap years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 | Checked against all 108 Hijri filenames: 108/108 match. A converter of about 30 lines runs in the browser. |
| Leaf **reach** | The earliest event the leaf is the **first** to cite. A source already cited by a strictly earlier leaf counts as a **callback**, not part of the reach. | This is finding 1. Without the rule, the 1429 leaf would reach back to 1405, because it cites Saʿd's death to echo it. With it, its reach starts on 1 Dec 1428, and the 1405 leaf gets a callback ring. 44 leaves contain callbacks. 21 leaves reach more than two years back. |
| Leaf **asOf** | max(date, latest cited event) | Applies to 17 leaves |
| **Told later** for a date | Later leaves whose reach covers that date | 1 Jun 1385 is told by *Of the County of Teruel* (1386) and *Fifteen Years of Building* (1395) |
| **First mentioned / last seen** for a person or place | The earliest and latest leaf listing them in `people:` or `places:` | 19 of 137 people are never mentioned in a leaf |
| **Dated note lines** | Split each note into sentences, and date each sentence by the **latest** date it mentions: day, month or year, with a month or bare year taken at its end. An undated sentence inherits the previous line's date; leading undated lines are background. | 507 sentences, 47 of them undated. Taking the latest date errs on the side of not spoiling, at the cost of releasing some lines late. |
| **Role ranges** | Parse "(1405–1429)" or "(from 1396)" inside role strings | 39 of 139 roles are dated this way. The other 100 are undated. |
| **Reigns and regencies** | `people[].reigns`, plus the two regencies dated in events (`1351-08-09` to `1352-04-07`, `1363-08-01` to `1364-01-18`) | Regnal years counted in lunar years, to match the chronicle |
| **Silences** | Gaps of more than 2 years between consecutive saves, and between consecutive leaves | 14 save gaps. 46 of 107 Western years have no leaf of their own. |
| **Save age** at D | D minus the date of the last save at or before D | Gives the green / amber / hatched levels |
| **Provenance class** per event | From its `source` string: save · save + account · Trent's account · screenshot · record | 399 · 146 · 96 · 119 · 2 |
| **Estimated flags** | `estates[].estimated`, plus the save note's sentence that mentions *estimat-* | 68 of the 71 saves with estates are flagged |
| **Birth precision** | A `born` of `YYYY-01-01` is treated as year-only | 24 of 131 |
| **High-water mark H** and **last visit** | Per reader, in browser storage, wrapped so the page works without it | Never leaves the browser |

**Finding 2: the 1437/1439 slip, caught by the card.** On 1 Mar 1437 the leaf says Muḥammad V "had never read a book for pleasure in his life". On 15 Jul 1439 the leaf says that "in the years since the pilgrimage he had begun to read", which places it in the mid-1430s. With the veil lifted, his card at 1437 already shows, under *Later in the record*, "On 15 July 1439, at fifty-three, he gained the Scholar trait (Trent's screenshot)". At 1439 that line moves into *Known by this date*, beside the matching register event. The record dates the change to July 1439, which supports the 1437 leaf; the 1439 prose has backdated it. Nobody had to look for this: a card that answers to a date puts the record's date next to the prose's claim. Building continuity tools on top of it is another designer's job, but the data they would need is this layer.

## 4. How it is built

* **One build step, after each session**, run by the same script that already turns saves into JSON. It reads `chronicle/*.md` and `data/*.json` and writes one `hourglass.json`:
  * the time index (books, reigns, regencies, saves, gaps);
  * per leaf: date, Hijri date, asOf, reach, callbacks, people and places;
  * per person and place: dated note lines, role ranges and mentions;
  * the trimmed register.

  The mockup's inline build is the prototype: `build.py`, about 180 lines of Python, which produces about 590KB of data before the leaf texts (about 135KB gzipped).
* **Pages stay static.** Each leaf page loads `hourglass.json`, which caches across pages and is about 135KB gzipped at today's size, and renders three pieces:
  * the rail, as one SVG redrawn on resize and on a change of veil or calendar;
  * the bead layer, redrawn every animation frame while dragging;
  * the side panel.

  No server or account is needed, and nothing calls a third party. It fits GitHub Pages.
* **Reading positions are per browser.** H and the last-visit mark live in `localStorage`, behind try/catch. With storage blocked, the site behaves as a first reading from the leaf you opened.
* **Effort:** about a week for the build step and rail, and another for the cards and realm panel at production quality. Accessibility comes on top: the rail as an ARIA slider whose value text is the date in both calendars, keyboard steps by leaf and by year, and reduced motion.

## 5. How it grows each session

The writer does nothing new for most of it:

* New leaves, events and saves appear on the rail at the next build. The rail rescales to the new present, the hatching recomputes, and new leaves get their reach and callbacks automatically.
* **"New since your last visit"** needs one more fact: which build each leaf first appeared in. The build keeps a small manifest (`builds.json`: build id, date, leaf ids added). A reader's browser remembers the last build it saw, and the rail rings anything newer. The mockup simulates this with the save of 11 June 1442.

Three light authoring conventions make the as-of layer sharper. None is required:

1. **Override reach** in front matter when the rule gets it wrong: `reach: 1379-04-01` or `asOf:`.
2. **Write people notes as dated lines**, one fact per sentence, each with its own date. The heuristic already handles about 90%, but some lines are released late. Faraj's regency line waits until April 1352 because it names his return.
3. **Date roles.** `"heir (1405–1429)"` is placed in time. `"heir"` isn't, and the veil has to hold it back.

## 6. Scale: 400 years, and the next campaign

* **400 years** (wireframes §8). The 108 ticks now sit about 8px apart. 400 would sit about 2px apart: enough to read as density, too close to target. The rail becomes **overview plus neck**:
  * the 30 years around the bead are magnified to about a third of the rail (fisheye) and move with it;
  * everywhere else, leaves render as density;
  * finished books fold into their age once lanes overflow, past about 12.

  The loupe already carries the detail and doesn't change. The derived data grows linearly. Even at four times the size, the time index is a few hundred KB, and the register can be split by century.
* **Carries over unchanged:** the contract (D, asOf, H), the rail anatomy, the derivation rules, the realm panel's freshness levels and estimated flags, the veil, and the between-leaves page. Every campaign is dated leaves plus irregular saves.
* **Plugs in per campaign:**
  * the calendar module: Hijri here, or Julian/Gregorian with a switch-over, Byzantine Anno Mundi, Japanese era names, regnal years;
  * the wording of the header ("Sultan of Gharnāṭa", "Emperor and Sultan of al-Andalus" after 16 Mar 1375, from `countries.json`);
  * the figures the realm panel shows, which are a list in config;
  * the lanes, one per book.

  The provenance classes depend on how each campaign's records are kept.
* **Specific to this campaign:** Hijri-first ordering, the regencies, and the particular fields of an EU5 save.

## 7. Friends and Trent

Where the two readers pull apart, **the default favours the friend**. A shared link opens on a first reading, and the veil is what lets someone meet the book as a book: no card announces a death a hundred leaves early, and the rail promises more without saying what. Trent pays one click, once per browser, and from then on gets the writer's view: the full record behind every card, the last-visit line, and new leaves ringed.

## 8. What the material can't support (yet)

* **100 of 139 roles and all 126 traits are undated.** The veil has to withhold them, so first-reading cards are thinner than they could be. Fixing this is a writing task (convention 3), not a design one.
* **People notes aren't written as dated lines.** The latest-date heuristic is safe but blunt. Some lines arrive late, and the 47 undated sentences inherit a neighbour's date and may sometimes be wrong. A line can only leak if its *own* dates are wrong.
* **The out-of-character notes**, which say what in each leaf is invented colour, aren't in this folder. The design has a slot for a provenance line under the leaf's dateline, but couldn't populate it.
* **A leaf's asOf comes only from its cited events.** If the prose tells something it doesn't cite, as it sometimes does with forward-looking lines, the bead won't know. The `asOf:` override covers this.
* **The veil can't police the chronicle's own voice.** "Those who mocked the order would remember it within two years" is the court historian foreshadowing, and it stays. The veil governs the reference shelf, not the prose.
* **Dates are missing in places.** 48 of 137 people have no death date, which for living people is correct. 24 births are year-only placeholders, and only 58 of 82 places have holding ranges. Cards say so rather than guess.
* **Estimates are only flagged on estates.** Elsewhere a figure is presented as read from the save, because nothing in the data says otherwise.
* **The 400-year fisheye** is drawn in the wireframes but not built in the mockup, since there is no real data to put in it.

## 9. Risks

1. **Chrome.** The rail must stay quiet: one colour per book, no animation at rest, and a reading page that never moves while you drag. If it starts to feel like an app, it fails the "book first" brief.
2. **False precision.** "As of 1 June 1385" sounds authoritative even when the nearest save is five years old. The design's answer is the always-visible glance strip and the hatched stale state. If those were ever softened, the contract would become a lie.
3. **Veil rules that leak.** Every new reference view has to apply the three bands. The mockup found three leaks during testing: the reign line, the reign bands and the people chips past H. All three are fixed, but a new view must pass the same test before it ships.

## 10. Boundaries respected

These belong to other designers and are only touched where they had to be:

* **The reading page.** The mockup keeps it plain: title, dateline, prose, earlier and later leaf.
* **The margins and glosses.** This design specifies what a card says at a date, not where it sits beside the prose.
* **Open threads, the living court and the writer's continuity.** "Last visit" and "new since" are deliberately minimal.

## Files

* `pitch.md`: this document.
* `wireframes.md`: desktop and phone frames. They cover the rail at rest and dragged, Faraj's card at 1351 and 1370, the realm panel fresh and over the 1379–1394 silence, the between-leaves page, the veil and lifting it, and the rail at 400 years.
* `mockup.html`: a self-contained page of about 1MB, with all data inlined and fonts from Google Fonts with serif fallbacks. URL parameters for review:
  * `?entry=<file id>` opens a leaf;
  * `?date=1385-06-01` stands at a date;
  * `?card=faraj-ibn-ismail` opens a card;
  * `?veil=off` lifts the veil.
