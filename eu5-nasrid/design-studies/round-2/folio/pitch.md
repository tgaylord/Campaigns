# The Glossed Folio

*Designer C, round two. This covers problems 2 (narrative and reference together) and 3 (one entry).*

## The idea in one paragraph

Each chronicle entry is set the way scholars have set texts that need explaining for eight hundred years: the text in the middle, the commentary around it, each kind of commentary in its own register.
- The prose is never interrupted, rewritten or decorated. It keeps the court's voice and the court's names.
- **The left margin** answers *who and where*. Every person, place, realm and court term is glossed beside the line where it first appears, as it stood **on that page's own date**.
- **The right margin** answers *on what authority*. The dated record that each claim rests on is set in plain ledger type beside the sentence it supports, with a mark that says how we know: read from a save, seen on screen, Trent's account, or estimated.
- **The running head** says what the realm looked like as the entry opens, and says plainly when the record is silent.
- **The foot** closes the leaf: the records that couldn't be pinned to a line, the realm at the close, Trent's own note in his own hand, and the verse.
- **A density control** turns the apparatus up or down.
- **On a phone** the margins fold into the text, and a gloss opens inline under its paragraph, so the reader never leaves the page.

The reference shelf comes to the reader one line at a time, beside the sentence that raised the question, and only as far as the page itself knows.

## Who it favours

The default (density **Names**) is set for **the friend reading it as a book**. They get the names they need and the plain name for every place and realm at first mention, and nothing that spoils what comes later. **Full** is for **Trent**: the record, the provenance, why each note sits where it does, and what was invented. Where the two pull apart, the friend wins the default and Trent wins one tap.

---

## The leaf, region by region

### 1. Leaf header (reserved)
This is a dashed slot at the top. Book, place in the book, catchword and previous/next belong to the book-structure designer. The folio only promises the slot and passes it the entry's book id.

### 2. The running head: the realm as this entry opens

> 14 RAJAB 814 · 1 Nov 1411 — *Ismāʿīl ibn Saʿd, 7th year of the reign* — 161 crown towns · 2,040,408 souls · treasury 386 · 274 in / 238 out · 1 war
> *The realm as this entry opens (29 Jun 1410), as last reckoned 29 Jun 1410. Next reckoning: 1 Nov 1411.*

- **Dates.** The Hijri date leads in rubric small capitals, as the chronicle does, with the Western date beside it.
- **Reign.** The regnal year is computed from `people[].reigns`.
- **Figures.** They come from the last checkpoint at or before **the opening of the entry**: the earliest date among its sources. They don't come from its closing date. A head that already showed the conquests would give away the page below it.
- **It always says how old its figures are:** "on this very day", "2 months before", "6 years before".

**The silence.** When the last reckoning is more than two years older than the entry's opening, the figures go grey and italic, with "(as of 2 Dec 1379)" after them, and a line in a warning colour appears:

> *The record is silent here. No save between 2 Dec 1379 and 4 Mar 1394 (14 years): the figures above are from the last reckoning, and this page rests on Trent's screenshots (4) and his account of play (3), not on a save.*

Beneath that line sits a thin strip covering twelve years either side. It shows a tick for each reckoning, the gap shaded, and a rubric pointer at this leaf. This is not a time control: it only shows where this page sits in the evidence. The provenance counts come from the entry's own records, so the head tells the reader both *that* the save record is silent and *what the page rests on instead*.

On a phone the head collapses to one line: the date, then the reign. A "the realm ▾" pill opens the figures, the reckoning line and the silence strip.

### 3. The text column
- **Typography.** A book face (EB Garamond in the mockup) at about 34em. The entry opens with a rubricated initial.
- **Paragraph numbers** sit in rubric in the gutter. Each is a link (`#p4`) and a citation: "Porto ¶4". Any later apparatus (an index, a person page, the other designers' threads) can point into a leaf by paragraph and sentence.
- **Sentences** are wrapped invisibly (`data-s="3.4"`, paragraph 4, sentence 5, counted from zero), so a record note can sit beside the exact sentence it supports.
- **Marks in the text are minimal.**
  - At Names density, first mentions get a faint dotted underline, and nothing else.
  - At Full, small ledger-blue superscript numbers mark the sentences that have a record note.
  - No colours, no icons, no hover cards over the prose.
- **The names switch** (Court / Plain) rewrites place and realm names in the text: Qashtāla becomes Castile, Uryūla becomes Orihuela. The gloss flips to match ("Orihuela · the chronicle's Uryūla"). People keep their names. The margin already translates at first mention, so most readers never need the switch. It is there for the reader who wants a plain-names copy.

### 4. The left margin: names, as of this page
Each first mention gets one gloss, aligned to its line, right-aligned towards the text, with a short hairline running into the gutter.

| Kind | What the gloss holds (all computed, all spoiler-safe) |
|---|---|
| **Person** | Name and Arabic name. Age on this date. Dynasty. Father and mother if known. **Standing at the opening reckoning**: ruler, heir, regent, or seat in the dīwān with its brief, from `checkpoints[].cabinet`. **Up to two dated lines of the record from before the entry's events begin** (appointments, marriages, births, battles). "First met in ⟨entry⟩ (year)", computed only from earlier entries. |
| **Place** | Court name · plain name · Arabic. Held by the crown on this date or not (from `places[].held`). First met in. |
| **Realm** | Court name · plain name (from `countries[].nameChronicle` against `name`). Qashtāla · Castile. Arghūn · Aragon. Jillīqiya · Galicia. Unlinked mentions are caught by exact match. |
| **Court term** | *dīwān* · the royal council. *ṭāʾifa* · a vassal kingdom under the crown. Tagged *proposed*, because this needs a small new glossary file (see *Gaps*). |

**The as-of rule.** A gloss knows only what the record knew by the moment **this entry's events begin**: the earliest source date, which is shown under the title as "people glossed as of 29 Jun 1410". That keeps a gloss on ¶1 of the Porto entry from mentioning the Battle of Guimarães in ¶6.

**What the rule excludes.** The `people` records are written from the end of the campaign. Their `roles` and `note` fields carry the whole future: on the Uryūla page, Ibn al-Khaṭīb's record already reads "admiral of Castile". So the folio uses **only dated evidence**: births, deaths, reigns, checkpoint cabinets and dated events. It never uses an undated role. This makes the glosses leaner than the data, which is the right trade for a book. The full record lives on the reference shelf's person page, behind a link that warns it runs ahead of the page.

**Repeat mentions.** A later mention opens its gloss *inline under the paragraph*, on every screen size. The margin holds first mentions only, so it never has to repeat itself.

### 5. The right margin: the record behind the text
On a tinted ledger slip, in monospace, beside the sentence it supports:

```
5 · 13 Jan 1411 · 17 Ramaḍān 813                   ▣ SCREEN
The Emperor's first great battle. On 17 Ramaḍān, the day
of Badr, the Emperor Ismāʿīl with 25,730 men…
ours / theirs  25,734 / 19,288
lost            9,586 / 8,446
result          victory
```

- **The header line** gives the number, the Western and Hijri dates, and the provenance mark:
  - **■ save**: read from a save
  - **▣ screen**: a screenshot
  - **◇ told**: Trent's account, not yet confirmed by a save
  - **~ est.**: estimated
  These come from `events[].source` and the `estimated` flags.
- **The title** is clamped to three lines.
- **The figures** are battle strengths and losses, or the result, choice or effect of a situation. They are what the prose turns into words ("nearly ten thousand of ours fell").
- **Clicking a slip** opens it in full, with the **basis for its position**: *"Anchored by a written date. date: '17 Ramaḍān 813' read as 17 Ramaḍān 813 AH = 13 Jan 1411; checked by 5 words of the record in the sentence. Inferred at build · not yet confirmed by the writer. Source: Trent's battle screen, 13 January 1411."*

This is the apparatus answering Trent's real question: not just "what does the save say" but "why does the site think this sentence rests on that record".

### 6. The foot
In this order:
1. **Drawn on.** The records behind the entry that could not be tied to one line, in the same ledger type and with the same marks, each with its reason: *"Not anchored: best sentence shares 6 words but the runner-up shares 6."* (Shown at Full.)
2. **The realm at the close.** This appears when the entry spans two reckonings. It is a small ledger table of opening → close with the change in each figure. For Porto: crown towns 161 → 161 (±0), ṭāʾifas 5 → 9 (+4), treasury 386 → 816, income 274 → 220, wars 1 → 0. The table shows something the prose says in passing: the conquests of Jillīqiya were given away as four new ṭāʾifas, so the crown itself gained no towns. The head shows how the leaf opens and the foot shows how it ends, so the reader turns the page knowing what changed. (Shown at Full.)
3. **The player's note**, in a visibly different hand (a handwriting face in green ink on faint ruled lines), signed "T.". It is Trent's out-of-character list of what in the entry is invented colour. In the mockup it is a **marked placeholder**, because the real notes are not in brief2/. (Shown at Names and Full.)
4. **The verse**, centred, under a rubric ornament. It closes every leaf, as the chronicle intends.
5. A small line of anchoring statistics (Full only): "15 of 16 records anchored (11 by a written date, 4 by wording), 1 drawn on. Inferred at build, not yet confirmed."

### 7. Density control

| | Text | Names (default) | Full |
|---|---|---|---|
| Prose, ¶ numbers, verse | ✓ | ✓ | ✓ |
| Running head | date and reign only | full | full |
| Left margin (names) | – | ✓ | ✓ |
| Right margin (record), superscripts | – | – | ✓ |
| Foot: player's note | – | ✓ | ✓ |
| Foot: drawn on, realm at close, anchor statistics | – | – | ✓ |

The text column **does not move** between Names and Full on a wide screen: the record margin is reserved and simply fills in. Switching density never makes the reader lose their line. The choice is remembered per reader (localStorage, wrapped in try/catch, and the page is fine without it).

### 8. Phone behaviour
- One column, 16px gutters, no horizontal scroll. Paragraph numbers sit inline at the start of each paragraph.
- **Tapping** a dotted name or a record superscript opens the gloss as a block **inserted directly under that paragraph**: left-ruled in rubric for names, ledger blue for records, with a close button. It is never a modal or a bottom sheet, and the page never jumps. Opening another gloss closes the first. Tapping the same word again closes it.
- The running head is one line plus the "the realm ▾" pill. The foot stacks as on desktop.
- Without JavaScript the page still reads. The build emits the glosses as notes after each paragraph (the phone layout, permanently open). The script only positions them into the margins.

---

## How anchors are inferred and checked

The front matter keys sources to the entry, never to a sentence. The build infers the sentence and, by rule, **anchors only when the evidence is unambiguous**. Everything else goes under "Drawn on".

**Step 1: read the dates the prose writes.** The chronicle dates events in Hijri, so the build parses:
- "the fifth of Jumādā al-Ūlā", "17 Ramaḍān 813", "In Dhū al-Qaʿda", "Rabīʿ al-Thānī in the year 740";
- Western dates ("16 March 1375");
- "that same day" (which inherits the last date given).

Names are not dates: "Peace of Ramaḍān" and "Peace of Ṣafar" are skipped. Missing years are inferred in narrative order: the last written year carries forward, and a month earlier than the last one rolls into the next year. Each date is converted with the **tabular Islamic calendar, civil epoch, to the Julian calendar**. This reproduces the brief's example (21 Muḥarram 846 = 1 June 1442) and every day-level date tested. A day gives an exact date; a month gives a range.

**Step 2: match records to sentences, in two tiers.**
- **By date.** A record whose date equals a day the prose writes is anchored to that sentence if at least one check agrees: the record names a person, place or war linked in the paragraph, or the sentence shares two or more distinctive words with the record's title. A record that falls inside a month the prose writes needs two checks (or three shared words), *and* must be the only record that fits that month as strongly. If two fit equally, neither is anchored.
- **By wording.** With no date, a sentence must share at least four distinctive words with the record (diacritics folded, light stemming, stop-words removed), and **at least twice as many as the next best sentence**. Example: Cape Mondego, Pedro, Tilimsān, admiral, Castilian against a runner-up of 3. A tie is never anchored.
- **The verse** is never anchored.

**Step 3: report and confirm.** Every build writes an anchor report. Each line gives the sentence, the tier, the full basis, or the reason it was not anchored (see `anchor-report.txt`). The writer (Trent's AI collaborator, as part of the session) reads the lines for the **new** entry and either:
- leaves an anchor as **inferred** (shown with "not yet confirmed" in its basis);
- **confirms** it: an `anchors:` map in the front matter (`1411-10-07-porto-falls: 5.10`), shown as confirmed;
- **moves** it (the same map, a different sentence);
- or **pins it to nothing** (`1411-11-01-four-new-taifas: none`), which keeps it under Drawn on for good.

Confirmed anchors are keyed to a hash of the sentence, so if the text is later revised the anchor drops back to "inferred" and shows in the next report.

**Results on the whole chronicle today:** 713 source references across 108 entries.
- 261 anchored by date, 135 by wording, **317 (44%) drawn on**.
- At most 15 anchored records in one entry. 8 entries have nothing anchored at all (typically the surveys and summary chapters, which is correct).
- **Spot check:** 14 anchors sampled at random from across the book were all on the right sentence.
- **Deliberately left unanchored** in the mockup: Porto's "four new ṭāʾifas" (two sentences share six words each) and Teruel's "theological seminaries" (7 against 5).

That is the rule doing its job: a provenance feature that is wrong is worse than one that is silent.

**Regression guard.** A handful of hand-confirmed entries become a fixture set. The build fails if a change to the matcher moves any confirmed anchor.

---

## How it is built

- **Static.** A build script reads `chronicle/*.md` and `data/*.json` and writes one HTML file per entry, plus a small shared CSS/JS. That suits GitHub Pages: no server and no API calls. (`build.py` and `hijri.py` in this folder are the working core: parsing, date reading, anchoring and the as-of glosses. They produced the mockup's data.)
- **Per entry it emits:**
  - the paragraphs with sentence spans and name spans;
  - the name glosses, already resolved as of the entry's opening;
  - the anchored record notes and the drawn-on list;
  - the running head (opening reckoning and silence data) and the realm at the close;
  - the verse and the player's note.
- **Layout.** A CSS grid of names margin | text | record margin. About 60 lines of JavaScript lay the margins out: each gloss starts level with its anchor and is pushed down past the one above.
  - **Crowding.** If a gloss would sit more than about 150px below its line, it shrinks to one line ("Fās · Fez ＋") and opens on click. In the Porto entry this happens to most of the names in ¶1 and to the six battle slips in ¶4, and the leaf stays readable.
  - **Hover.** Hovering a gloss highlights its sentence or name, and the reverse.
- **Phone.** The same markup with CSS that hides the margins, plus a tap handler that clones a gloss into an inline block.

## How it grows each session

1. Trent plays, saves, and the session writes the new entry or entries, events, people and checkpoints as now.
2. **The build re-runs on everything.**
   - New entries get anchors and glosses.
   - Old entries are re-anchored too, because new records can change old ones. For example, a save that confirms something earlier marked ◇ told turns it into ■ save, or a later checkpoint fills a silence. Old leaves therefore improve without anyone editing them.
   - The anchor report shows only what changed: new inferred anchors, anchors that moved, records newly drawn on.
3. **The writer confirms** the new entry's anchors (a minute's work per entry), and writes the player's note in the out-of-character file.
4. **Silences heal themselves.** When a session adds a checkpoint inside an old gap, every leaf in that gap recomputes its head. The grey "as of" figures and the warning line disappear where the record now exists.
5. **"First met in"** only ever looks backwards, so adding entries never changes an older gloss's facts. It can only add new first mentions.

## Scale (300 years, 400 entries, the next campaign)

- **Per leaf the cost is flat.** One leaf never needs more than its own sources, the people and places it names, and two checkpoints. 400 entries are 400 static files of about the same size as today's.
- **The crowding risk grows with the density of an entry, not the length of the chronicle.** The worst entry today has 31 glossable names and 20 sources. Compaction handles that, but a 40-source entry would want a third rule: group record slips that share a paragraph into one slip with a count.
- **For the next campaign, most of it carries over unchanged:** the layout, the density control, the phone behaviour, the anchoring tiers, the report-and-confirm loop, the as-of rule, the silence head and the realm at the close. These are all **generic**.
- **These are set per campaign:**
  - the calendar reader (Hijri tabular → Julian here; a Byzantine, Chinese or Japanese era campaign plugs in its own date reader, or just Western dates);
  - the provenance vocabulary and its marks;
  - the head's fields (crown towns and treasury here; something else elsewhere);
  - the glossary of court terms;
  - the colours of the rubric.
- **Specific to this campaign:** the Hijri-first running head, the Arabic names in the glosses, the Court/Plain switch (which assumes a campaign with two naming registers), and the verse as the fixed close of each leaf.

---

## Gaps: what the material can't support yet

- **Sentence-level sources don't exist.** They are inferred, and 44% of references stay under Drawn on until the writer confirms or places them. The design is honest about this rather than hiding it.
- **The player's notes are not in brief2/.** The foot shows a marked placeholder. The note needs to be a field or a sidecar file per entry, so the build can set it.
- **People records are written with hindsight.** Undated `roles` and `note` would spoil, so glosses use only dated evidence. A person with no dated events before the page (Pedro of Castile on the Porto page) gets a thin gloss: dynasty, age, first met. Dated role spans (`roles: [{role, from, to}]`) would fix this cleanly.
- **Plain names come from game keys,** so they lack accents and particles: "Cordoba", "Sevilla", "Santiago Compostela". A `namePlain` field on places (and the same for realms) is needed. Place `name` is also sometimes spelled differently from the prose ("Ishbīliyya" against "Ishbīliya"), which defeats exact matching of unlinked mentions.
- **Places named in the prose but not in `places.json`** go unglossed: al-Qāhira, Makka, Porto, Tafilalt. The writer could link more, or the build could take them from a light gazetteer.
- **`places[].held` records direct crown holding only,** so a place in a ṭāʾifa reads as "not held by the crown". That is true but easily misread. Subject status by date would let the gloss say "in the Ṭāʾifa of Qūnka".
- **Court terms** (dīwān, ṭāʾifa, umarāʾ, ʿulamāʾ, Jamāʿa, Istirdād…) have no data source. The mockup uses a **proposed** eight-term glossary, tagged as such on the page.
- **War links** (`war:` in the prose) are not yet glossed. `wars.json` has everything needed for an as-of war gloss: begun, sides, "still being fought on this date".
- **Figures in the prose are spelled out** ("nearly ten thousand"), so the matcher ignores numbers. A number tier (spelled numbers against `data` within 5%) could anchor some of the remaining 44%, but it would need its own fixtures before it was trusted.

## Effort and risk

- **Effort:** medium. The anchoring core and the as-of glosses already work (in this folder). A production version needs:
  - the confirm and override loop and the sentence hashes (small);
  - the no-JavaScript fallback and print styles (small);
  - grouping for very crowded leaves (small);
  - a first confirmation pass over the existing 108 entries (an afternoon of reviewing the report).
- **Biggest risk:** the margins becoming the main event. Dense leaves could feel like a spreadsheet beside a book. The safeguards:
  - Names is the default, not Full;
  - glosses never move the text column;
  - crowded glosses compact themselves;
  - the rule is first mentions only and anchors only when certain.

  The second risk is trust. One wrong anchor undermines the whole provenance layer. That is why every slip shows its basis and its confirmation state, and why drawn-on is a normal, visible outcome rather than a failure.
