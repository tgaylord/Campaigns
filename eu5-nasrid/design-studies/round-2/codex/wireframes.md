# The Codex: wireframes

Annotated ASCII for each screen. Numbers in brackets, like [1], point to the notes under each frame. All content is real: it is drawn from `brief2/` and matches what `mockup.html` renders. Desktop frames are about 100 columns wide; phone frames are about 40 columns (390px).

Key:
- `▓` marks a book's rubric colour.
- `╎` is a colonnette, drawn only while a book is open.
- `░` is lacuna hatching.
- `●` is a leaf on a phone lane.
- `│` is an open lane on a phone.

---

## 1. Contents: title page and the run of the years (desktop)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CONTENTS · the canon tables                     108 leaves · 738–847 AH · 1337–1443  [‹][Tables][›]│ [1]
├══════════════════════════════════════════════════════════════════════════════════════════════════┤
│                                        تاريخ بني نصر                                              │ [2]
│                            The Chronicle of the House of Naṣr                                     │
│             in eight books · 108 leaves · 64,346 words · 738–847 AH · 1337–1443 CE                │
│     Read it straight through, leaf by leaf, or follow one book down its column. Every leaf is     │
│     addressed by its Hijri date and ends with two catchwords: the next leaf of the codex, and     │
│     the next leaf of its own book.                                                                │
│   [ Resume at the ribbon · 772·02·21  Of the Last Battles… ] [ Begin at the first leaf ] [Colophon]│ [3]
│                                                                                                    │
│                                    T H E   R U N   O F   T H E   Y E A R S                         │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                 Saʿd               no save, 782–795   no save, 798–805  Ismāʿīl     Muḥammad    │ │ [4]
│ │   ▓              ┊      ▓          ░░░░░░░░░░░░░░    ░░░░░░░░░░░░░░    ┊            ┊ ▓        │ │
│ │  ▓▓   ▓▓ ▓       ┊   ▓  ▓  ▓▓      ░░░░░░░░░░░░░░    ░░░░░░░░░░░░░░    ┊▓       ▓  ▓┊▓▓        │ │
│ │ ▓▓▓▓ ▓▓▓▓▓▓▓ ▓▓ ┊▓▓ ▓▓▓▓▓▓▓▓▓▓▓▓░░░▓░░▓░░▓░░▓░░▓▓░░░▓▓░░░░░░▓░░▓▓▓ ▓ ┊▓▓ ▓▓▓▓ ▓▓▓▓┊▓▓▓▓ ▓▓▓▓▓▓│ │
│ │─┴──────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────│ │
│ │ ·:·:: ·:  ·:·  ::·:·  ·: :·: ·  ·   (no dots)  ·  ·   (no dots)  ·:  · ·  ·:·· · :· ·  ·    │ │ [5]
│ │ 740·1339  750·1349  760·1358  770·1368  780·1378  790·1388  800·1397  810·1407  820·1417 …    │ │
│ │ ▓Mending ▓Balance ▓Pestilence ▓Call ▓Marches ▓Encircling Sea ▓Franks ▓Golden Century          │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ Years run down each table; each book open at the time keeps      [ ] Fold the years into decades │ [6]
│ its own column. A canon closes when a book closes.                                               │
```

1. **Running head.** On the contents page it shows the volume's extent. ‹ is disabled here and › goes to the first page in the codex.
2. **Title page.** The title is a placeholder; the material doesn't name the work.
3. **Ribbon.** *Resume* appears only when a ribbon is stored. *Begin* opens the Book of the Mending's opening page, the first page of the codex.
4. **Strip.**
   - One column per Hijri year, stacked from one block per leaf in its book's colour. Click a block to open that leaf.
   - Dashed lines mark new reigns.
   - Grey bands mark six or more years without a save. These are computed from `checkpoints.json`: there are two, 782–795 and 798–805 AH.
5. **Dots.** One dot per save read in that year, up to four. This is where you see what was read from a save and what was remembered.
6. **Fold toggle.** It changes every table at once (see section 4). Its state is remembered in localStorage.

---

## 2. A canon table (desktop): Canon IV, excerpt

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Canon IV    772–834 AH · 1370–1431 · 48 leaves                        Call · Marches · Encircling Sea│ [1]
├──────────────┬─────────────────────────┬─────────────────────────┬────────────────────────────────┤
│              │  ╭───────────────────╮  │  ╭───────────────────╮  │  ╭───────────────────╮          │
│              │ ╱    كتاب الدعوة      ╲ │ ╱     كتاب الثغور      ╲ │ ╱  كتاب البحر المحيط   ╲         │ [2]
│              │ │       CALL          │ │ │      MARCHES        │ │ │   ENCIRCLING SEA    │         │
│              │ │      Book IV        │ │ │      Book V         │ │ │      Book VI        │         │
├──────────────┴─────────────────────────┴─────────────────────────┴────────────────────────────────┤
│ REIGN OF SAʿD IBN YŪSUF   continuing, since 1 August 1363                                         │ [3]
├──────────────┬─────────────────────────┬─────────────────────────┬────────────────────────────────┤
│          772 ╎ 20 ṢAFAR …belongs to    ╎ ┌ Here begins ┐          │                                │ [4]
│      1370–71 ╎ Canon III; here:        ╎ 22 ṢAFAR                ╎                                │
│              ╎ 7 SHAʿBĀN               ╎ Of the Three Marches,   ╎      (bare paper: the Sea      │ [5]
│              ╎ Of the Towns of the     ╎ and What Lies North…    ╎       has not opened yet)      │
│              ╎ North, and the Money-   ╎ 27 ṢAFAR                ╎                                │
│              ╎ lenders of Ishbīliya    ╎ The Survey of the King- ╎                                │
│              ╎                         ╎ doms, After the Manner… ╎                                │
├──────────────┼─────────────────────────┼─────────────────────────┤                                │
│░ No leaf · 773–774 AH · 1371–1373 · no save, the record is silent ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ [6]
├──────────────┬─────────────────────────┬─────────────────────────┬────────────────────────────────┤
│          775 ╎ 19 DHŪ AL-QAʿDA         ╎ 6 RAMAḌĀN               ╎                                │
│      1373–74 ╎ Of Duʿāʾ's Regency, and ╎ Of the March into the   ╎                                │
│              ╎ the Tithe Given to the  ╎ Upper March, and the…   ╎                                │
│              ╎ ʿUlamāʾ                 ╎ 24 RAMAḌĀN              ╎                                │
│              ╎                         ╎ Of the Pursuit to       ╎                                │
│              ╎                         ╎ Ṭarrakūna               ╎                                │
│     ⋮        ⋮                         ⋮                         ⋮                                │
├──────────────┼─────────────────────────┼─────────────────────────┼────────────────────────────────┤
│          781 ╎                         ╎                         ╎ ┌ Here begins ┐                │
│      1379–80 ╎                         ╎                         ╎ 13 SHAʿBĀN                     │
│              ╎                         ╎                         ╎ Of the Jamāʿa of 781, and the  │
│              ╎                         ╎                         ╎ Court's Removal to Ishbīliya   │
├──────────────┴─────────────────────────┴─────────────────────────┴────────────────────────────────┤
│░ No leaf · 782–784 AH · 1380–1383 · no save, the record is silent ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│     ⋮                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ REIGN OF ISMĀʿĪL IBN SAʿD   from 2 March 1405 · 29 Shaʿbān 807                                    │ [3]
├──────────────┬─────────────────────────┬─────────────────────────┬────────────────────────────────┤
│          807 ╎                         ╎ 16 RABĪʿ AL-THĀNĪ       ╎                                │
│      1404–05 ╎                         ╎ Of the Crusade of 806,  ╎                                │
│              ╎                         ╎ the March on Avignon…   ╎                                │
│              ╎                         ╎ 16 RAMAḌĀN           ▐▌ ╎  ◄ ribbon tab on the last leaf │ [7]
│              ╎                         ╎ Of the Risings of 807,  ╎    opened                      │
│              ╎                         ╎ and the Death of the…   ╎                                │
│     ⋮                                                                                              │
│          834 ╎                         ╎ 16 ṢAFAR  (a)           ╎                                │
│      1430–31 ╎                         ╎ Of the War of the Moun- ╎                                │
│              ╎                         ╎ tains, and the Peace…   ╎                                │
│              ╎                         ╎ 16 ṢAFAR  (b)           ╎                                │
│              ╎                         ╎ The Close of the Book…  ╎                                │
│              ╎                         ╎ ┌━ Here ends ━┐         ╎  ◄ the canon closes on this    │ [8]
└──────────────┴─────────────────────────┴─────────────────────────┴────────────────────────────────┘
                     (Canon V opens with columns Call · Encircling Sea · Franks · Golden Century)
```

1. **Canon header.** It gives the span in both calendars, the leaf count, and the column names in their colours.
2. **Arches.** Each column head is an arch in its book's colour, holding the Arabic title, the English name and the book number. It links to the book's opening page. Column order is fixed by when each book opened, so the Call stays leftmost through Canons III–V.
3. **Reign rules.** They run the full width. Each canon starts with the reign then in force.
4. **Rows.** One row per Hijri year, labelled with Western years. The 772 row is split between two canons: the Balance's closing leaf of 21 Ṣafar is the last row of Canon III.
5. **Columns.** A column has colonnettes `╎` only from the row where its book opens. Before that it is bare paper. *Here begins* is a dashed chip linking to the opening page.
6. **Lacuna rows.** Consecutive empty years merge into one hatched band that says what the record holds: saves read with nothing written, or no save at all.
7. **Ribbon tab.** It marks the cell of the last leaf opened. "Find it in the tables" on a leaf scrolls here and outlines the cell.
8. ***Here ends*.** A solid chip. A canon closes on a book's last leaf.

---

## 3. The canon table folded into lanes (phone, 390px)

```
┌──────────────────────────────────────┐
│ CONTENTS · the canon tables [‹][Tables][›]│
├══════════════════════════════════════┤
│ Canon II  747–752 AH · 1346–1352     │
│           17 leaves                  │
│ Balance · Pestilence                 │  [1]
├──────────────────────────────────────┤
│ REIGN OF YŪSUF I continuing, since…  │
├──────────────────────────────────────┤
│ 747 AH · 1346–47                     │
│   │  ┌ Here begins the Book of the   │  [2]
│   │  │ Pestilence · كتاب الوباء       │
│   │  ●  1 RAJAB · PESTILENCE         │  [3]
│   │  │  Of the Rumour out of the     │
│   │  │  East, and the Houses of …    │
│ ┌ Here begins the Book of the Balance│
│ ●  │  1 RAJAB · BALANCE               │
│ │  │  Of the Summons of the Marīnids, │
│ │  │  and the Volunteers' Return      │
├──────────────────────────────────────┤
│ 748 AH · 1347–48                     │
│ ●  │  6 ṢAFAR · BALANCE               │
│ │  │  Of the Day of Jayyān            │
│ ●  │  23 JUMĀDĀ AL-ŪLĀ · BALANCE      │
│ │  │  Of al-Quṣayr and Balma          │
│ ●  │  9 RAMAḌĀN · BALANCE             │
│ │  │  Of Munṭīl, and the Gate of …    │
│ ●  │  15 SHAWWĀL · BALANCE            │
│ │  │  Of the Birth of Saʿd            │
├──────────────────────────────────────┤
│ 749 AH · 1348–49                     │
│ │  ●  15 ṢAFAR · PESTILENCE           │  [4]
│ │  │  Of the Coming of the Pestilence │
│ ●  │  3 RABĪʿ AL-THĀNĪ · BALANCE      │
│ │  │  Of the Madman at al-Manṣūra, …  │
│     ⋮                                │
│ 752 AH · 1351–52                     │
│ │  ●  9 DHŪ AL-ḤIJJA · PESTILENCE     │
│ │  │  Of the Departing of the Pesti-  │
│ │  ┴  Here ends the Book of the       │  [5]
│ │     Pestilence                      │
├──────────────────────────────────────┤
│░No leaf · 744 AH · 1343–1344 · no ░░░│  [6]
│░save, the record is silent        ░░░│
└──────────────────────────────────────┘
```

1. **Same data, one column.** Leaves are listed in codex order, so the phone list is also the reading order.
2. **Lanes.** One 11px lane per column of the canon, in fixed order. A lane is drawn (a hairline in its colour) only while its book is open, and it starts at the *Here begins* line.
3. **The leaf's own lane.** It carries a dot in the leaf's colour, and the date and book name are set in that colour too. Titles get the full remaining width.
4. **The braid.** Alternating dots between lanes show the threads braiding, here Balance and Pestilence through the plague years.
5. **Closing.** *Here ends* stops the lane.
6. **Lacunae and reigns.** Lacuna bands and reign rules stay full width.

---

## 4. Folded by decade (desktop and phone)

```
DESKTOP: Canon IV with "Fold the years into decades" on, 790s opened
┌──────────────┬─────────────────────────┬─────────────────────────┬────────────────────────────┐
│        770s  ╎ ●● 2                    ╎ ●●●●●●●●●● 10           │                            │ [1]
│   1370–1378  ╎                         ╎                         │                            │
├──────────────┼─────────────────────────┼─────────────────────────┼────────────────────────────┤
│        780s  ╎ ●● 2                    ╎ ● 1                     ╎ ● 1                        │
├──────────────┼─────────────────────────┼─────────────────────────┼────────────────────────────┤
│  ▸ 790s      ╎ ●● 2                    ╎ ●●● 3                   ╎ ●●● 3                      │ [2]
│░ No leaf · 790 AH · 1388 · no save, the record is silent ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│         791  ╎ 15 SHAʿBĀN  Of the Ḥijāba and the Ḥisba, and the Death of Duʿāʾ                  │
│         794  ╎ 25 RABĪʿ AL-AWWAL  Of the Second…     ╎        ╎ 26 RABĪʿ AL-AWWAL  Of the Mansa's…│
│          ⋮   (the decade's year rows, as in section 2)                                           │
├──────────────┼─────────────────────────┼─────────────────────────┼────────────────────────────┤
│        800s  ╎ ● 1                     ╎ ●●● 3                   ╎ ● 1                        │
│        810s  ╎ ●● 2                    ╎ ●● 2                    ╎ ● 1                        │
│        820s  ╎ ● 1                     ╎ ●●●● 4                  ╎ ● 1                        │
│        830s  ╎                         ╎ ●●●●●● 6                ╎ ●● 2                       │
└──────────────┴─────────────────────────┴─────────────────────────┴────────────────────────────┘

PHONE (390px)
┌──────────────────────────────────────┐
│ │  │     770s AH · 1370–1378 · 12 l. │  [3]
│ │  │  │  780s AH · 1378–1388 · 4 l.  │
│ │  │  │  790s AH · 1388–1397 · 8 l.  │  ▸ tap opens the decade's leaves
│ │  │  │  800s AH · 1397–1407 · 5 l.  │
│ │  │  │  810s AH · 1407–1417 · 5 l.  │
└──────────────────────────────────────┘
```

1. **Decade rows.** A folded decade is one row: one dot per leaf in the book's colour, plus a count. A dense decade (the Marches in the 770s, 10 leaves of war) shows as a long run of dots. A sparse one (the Sea in the 800s) shows as a single dot.
2. **Opening a decade.** Click it to unfold only that decade. "Find it in the tables" unfolds the ribbon's decade automatically.
3. **Phone.** The same fold, with the lanes kept so the braid still shows at decade grain.

---

## 5. At 400 years: volumes and the table of canons (desktop and phone)

*Projected; not in the mockup.* The numbers are what this campaign would look like if it ran to about 1737 at the current rate of roughly one leaf a year. The book names after *Golden Century* are invented for the projection.

```
DESKTOP: contents, top level, when the codex passes ~150 years
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            The Chronicle of the House of Naṣr                                     │
│                    in 23 books · 402 leaves · 738–1150 AH · 1337–1737                             │
│   THE RUN OF THE YEARS: one bar per decade, hover for years                                       │ [1]
│   ▁▃▆▅▃▂▄▆▇▅▁ ▁▂▃▅▄▃▃▆▅▄▂▃▄▅▃▂▁▃▄▆▅▃▂▂▃▅▄▃▂▁                                                       │
│ ──────────────────────────────────────────────────────────────────────────────────────────────── │
│ VOLUME I · the eighth century AH · 738–799 · 1337–1397 · 79 leaves                         [open] │ [2]
│   Canon I    738–747   Mending                                       12 leaves  ▁▃▆▃              │
│   Canon II   747–752   Balance · Pestilence                          17 leaves  ▆▇▅               │ [3]
│   Canon III  753–772   Balance · Call                                17 leaves  ▂▃▂▄▃▅            │
│   Canon IV   772–799   Call · Marches · Encircling Sea               33 leaves  ▆▅▂▁▃▂            │
│ VOLUME II · the ninth century AH · 800–899 · 1397–1494 · 104 leaves                        [open] │
│   Canon IV (cont.)  800–834   Call · Marches · Encircling Sea        15 leaves                    │ [4]
│   Canon V    835–…    Call · Encircling Sea · Franks · Golden Century   …                         │
│   ⋮                                                                                              │
│ VOLUME IV · the eleventh century AH · 1000–1099 · 1591–1688                                      │
│   Canon XIII 1044–1071  Call · Sea · Indies · Restoration · Ottoman War · New Spain  ⇢ lanes      │ [5]
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

PHONE
┌──────────────────────────────────────┐
│ VOL. I  738–799 AH · 1337–1397  ▸    │
│ VOL. II 800–899 AH · 1397–1494  ▾    │
│   Canon IV (cont.) 800–834  15 l. ▸  │
│   Canon V  835–871   ▸               │
│   Canon VI 871–902   ▸               │
│ VOL. III 900–999 AH · 1494–1591 ▸    │
│ ▐▌ Resume at the ribbon · 912·04·03  │  ◄ the ribbon opens its volume, canon and decade
└──────────────────────────────────────┘
```

1. **The strip.** It becomes one bar per decade above about 300 years.
2. **Volumes.** Volumes follow the Hijri century, the way biographical dictionaries were divided. The writer can override the breaks with a `volumes:` list.
3. **Canon lines.** One line per canon: its span, its columns, a leaf count and a mini strip. Click a line to open its table, in decade-folded form by default.
4. **Canons across a volume break.** A canon that crosses a volume break is shown in both volumes, marked "(cont.)".
5. **More than five columns.** Above five columns a canon renders as lanes on desktop too. Colours are assigned so that no two books sharing a canon have the same pigment.

---

## 6. A book's opening (desktop and phone)

```
DESKTOP
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ The Book of the Call · opening                              Book IV · 757 AH · 1356  [‹][Tables][›]│ [1]
├════════════════════════════════════════════════(verdigris rule)══════════════════════════════════┤
│          ┌───────────────────────────────────────────────────────────────────────────┐           │
│          │┌─────────────────────────────────────────────────────────────────────────┐│           │ [2]
│          ││                              BOOK IV OF 8                               ││           │
│          ││                              كتاب الدعوة                                ││           │
│          ││                          The Book of the Call                           ││           │
│          ││              757–… AH · 1 October 1356 – written as it happens          ││           │
│          ││                                                                         ││           │
│          ││    Education and the return of Islam to al-Andalus as the Emirate       ││           │ [3]
│          ││    grows: roads through the mountains, libraries in the cities of the   ││           │
│          ││    south and then the north, and the slow reconversion of Qurṭuba…      ││           │
│          ││                                                                         ││           │
│          ││  18 leaves · 10,318 words · in Canons III, IV, V · runs beside the Book ││           │ [4]
│          ││  of the Balance, the Marches, the Encircling Sea, the Franks            ││           │
│          ││    ───────────────────────────────────────────────────────────────      ││           │
│          ││    758·07·12   Of Roads, Libraries, and the Charter of the Weavers      ││           │ [5]
│          ││    759·09·02   Of the Great Madrasa of Qurṭuba, and the Foreign Wisdom  ││           │
│          ││    768·01·26   Of the Slow Return, and the Day Qurṭuba Turned           ││           │
│          ││    772·02·20   Of the Reckoning of the Faithful, in the Year the Strait…││           │
│          ││       ⋮   (18 lines)                                                    ││           │
│          ││                 HERE BEGINS THE BOOK OF THE CALL.                       ││           │
│          ││                ─────────────────────────────────────────────────────    ││           │
│          ││                         NEXT LEAF, AND NEXT IN THE BOOK OF THE CALL      ││           │ [6]
│          ││                 Read, in the name of your Lord who created. The first…  ││           │
│          ││                 758·07·12 · Of Roads, Libraries, and the Charter of the…││           │
│          │└─────────────────────────────────────────────────────────────────────────┘│           │
│          └───────────────────────────────────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

PHONE
┌──────────────────────────────────────┐
│ Call · opening        [‹][Tables][›] │
├══════════════════════════════════════┤
│┌────────────────────────────────────┐│
││          BOOK IV OF 8              ││
││          كتاب الدعوة                ││
││      The Book of the Call          ││
││  757–… AH · 1 Oct 1356 – written   ││
││  as it happens                     ││
││  Education and the return of Islam ││
││  to al-Andalus as the Emirate…     ││
││  18 leaves · 10,318 words · …      ││
││  758·07·12  Of Roads, Libraries…   ││
││  759·09·02  Of the Great Madrasa…  ││
││   ⋮                                ││
││  HERE BEGINS THE BOOK OF THE CALL. ││
││       NEXT LEAF, AND NEXT IN …     ││
││  Read, in the name of your Lord…   ││
│└────────────────────────────────────┘│
└──────────────────────────────────────┘
```

1. **Place in the codex.** The opening page sits in the reading order just before the book's first leaf. ‹ goes to the leaf before it, *Of the Governor of Qurṭuba* (Balance), and › goes to 758·07·12.
2. **Frame.** A double frame in the book's colour: the one place the design allows itself an ornament.
3. **Summary.** Taken verbatim from `books.json`.
4. **Context line.** "Runs beside" is computed from overlapping leaves, and each name links to that book's opening.
5. **The book's own column.** Its leaves as a list. Reading down it is reading by thread.
6. **Catchword.** It leads to the first leaf. Here the codex and the thread agree, so there is only one.

---

## 7. An entry leaf (desktop)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ The Book of the Balance · reign of Saʿd ibn Yūsuf          772 AH · 1370 · leaf 46 of 108 [‹][Tables][›]│ [1]
├══════════════════════════════════════════════════(lapis rule)════════════════════════════════════┤
│   ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                           │  │
│   │     LEAF 772·02·21                          Balance, leaf 24 of 24      ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │  │ [2]
│   │     ─────────────────────────────────────────────────────────────      ╎ OUTER MARGIN  ╎ │  │
│   │     Of the Last Battles, the Peace of the Northern                     ╎ Reserved for  ╎ │  │ [3]
│   │     Shore, and the Throne That Endures                                 ╎ the glosses   ╎ │  │
│   │     21 Ṣafar 772 AH · 14 September 1370                                ╎ of the anno-  ╎ │  │
│   │                                                                        ╎ tated-edition ╎ │  │ [4]
│   │     ┏━━━━┓ fter Antaqīra the war belonged to Khālid. On the            ╎ design. This  ╎ │  │
│   │     ┃ A  ┃ twentieth of Rabīʿ al-Thānī 771 he fell on a Marīnid        ╎ leaf names 4  ╎ │  │ [5]
│   │     ┗━━━━┛ landing at Abdara and left none of its nine hundred         ╎ people and 18 ╎ │  │
│   │     and seventy alive. In Jumādā al-Ūlā the Egyptians came down        ╎ places.       ╎ │  │
│   │     from Jarghal and joined him before Mālaqa. It was a strange        ╎ (sticky)      ╎ │  │
│   │     army: Andalusīs, men of Balansiyya, mercenaries from every…        └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │  │
│   │         In Ramaḍān the Egyptians wanted a victory of their own…                           │  │ [6]
│   │                                ⋮                                                          │  │
│   │         So the scale that had hung between Qashtāla and Fās for                           │  │
│   │     twenty-four years came to rest… belongs to another book.                              │  │
│   │                                                                                           │  │
│   │                    HERE ENDS THE BOOK OF THE BALANCE.                                     │  │ [7]
│   │                                                                                           │  │
│   │                                    ✶                                                      │  │ [8]
│   │              For indeed, with hardship comes ease. Indeed, with                           │  │
│   │                          hardship comes ease.                                             │  │
│   │                                                                                           │  │
│   │                    EXPLICIT · THE BOOK OF THE BALANCE                                     │  │ [9]
│   │               24 leaves · 12,736 words · 747–772 AH · 1346–1370                           │  │
│   │                                                                                           │  │
│   │     ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                         │  │ [10]
│   │     ╎ APPARATUS  10 sources · 4 people · 18 places. Reserved for  ╎                         │  │
│   │     ╎ the annotated-edition design (sources, provenance, note).   ╎                         │  │
│   │     └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘                         │  │
│   │     ─────────────────────────────────────────────────────────────                         │  │
│   │                                               NEXT IN THE CODEX                           │  │ [11]
│   │                                The Book of the Marches begins                             │  │
│   │                                     كتاب الثغور · Book V · 29 leaves                       │  │
│   │                                                 THE BOOK OF THE BALANCE                   │  │ [12]
│   │                  is closed. Its 24 leaves end here; the codex goes on.                    │  │
│   │                                                                                           │  │
│   │     ‹ previous in the codex     ‹ previous in Balance     find it in the tables           │  │ [13]
│   │                 668 words · read from quire 27, the save of 13 September 1370             │  │ [14]
│   └───────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Running head** (sticky).
   - Left: the book in rubric colour and the reign at the leaf's date.
   - Right: the year in both calendars and the position in the codex.
   - The rule under the head carries the book's colour, so the thread shows at any scroll position.
2. **Leaf head.** The permanent address on the left; the position in the book on the right.
3. **Title.** In the entry's own words.
4. **Double date.** Hijri first, as the chronicle writes it.
5. **Framed initial.** In the book's colour, three lines deep.
6. **Paragraphs.** Marked by indent, with no space between them, and justified with hyphenation. Person and place names keep a faint dotted underline, the hook the gloss layer will use.
7. **Rubrics.** *Here ends* / *Here begins* sentences are lifted out of the paragraph and set as centred small-caps rubrics.
8. **Verse colophon.** The closing verse, centred under an eight-pointed star.
9. **Explicit tally.** Shown only on a book's closing leaf. An open book's latest leaf says *continues, written as it happens* instead.
10. **Reserved slots.** These belong to another designer and are deliberately undesigned here:
    - the outer margin (glosses);
    - the foot apparatus (sources, provenance, the player's out-of-character note).
11. **Codex catchword.** Here the next page in the codex is an opening page.
12. **Thread catchword.** Here it is a closure notice, because the Balance ends.
13. **Quiet links.** Previous in the codex, previous in this book, and back to this leaf's cell in the tables.
14. **Leaf colophon.** Word count and the quire (save) the leaf was read from.

### The ordinary case: two catchwords that differ (foot of 772·02·20, Book of the Call)

```
│     ─────────────────────────────────────────────────────────────                         │
│                                       NEXT LEAF · THE BOOK OF THE BALANCE      (lapis)     │
│                       After Antaqīra the war belonged to Khālid. On the twentieth of…      │
│                     772·02·21 · Of the Last Battles, the Peace of the Northern Shore…      │
│                                                                                            │
│                                       NEXT IN THE BOOK OF THE CALL         (verdigris)     │
│                When the war chest was empty and the mercenaries had gone…        ◄ first   │
│                     772·08·07 · Of the Towns of the North, and the Moneylenders…    words  │
```

The catchword the reader followed last time is listed first, so a reader going along a thread sees the thread's catchword on top without choosing anything.

---

## 8. An entry leaf (phone)

```
TOP                                     FOOT
┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐
│ Franks  835 AH · 1432 [‹][Tables][›] │ │ …the first time since his accession  │
├════════════(crimson rule)════════════┤ │ that they had seen him look happy.   │
│ LEAF 835·08·29b   Franks, leaf 1 of 3│ │                  ✶                   │
│ ──────────────────────────────────── │ │ And of His signs are the ships in    │
│ Of the Warmonger's Name, the Crusade │ │ the sea, like mountains. If He       │
│ of 835, and the Arsenals             │ │ willed, He could still the wind…     │
│ 29 Shaʿbān 835 AH · 1 May 1432       │ │ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │
│ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │ │ ╎ APPARATUS 16 sources · 10 people ╎ │
│ ╎ GLOSSES open as sheets from the  ╎ │ │ ╎ · 7 places. Reserved.            ╎ │
│ ╎ names. Reserved.                 ╎ │ │ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │ │ ──────────────────────────────────── │
│   HERE BEGINS THE BOOK OF THE FRANKS.│ │        NEXT LEAF · THE BOOK OF THE   │
│ ┏━━━┓ or seven hundred years, since  │ │        PESTILENCE… (as it applies)   │
│ ┃ F ┃ the first governors of al-     │ │  …the first words of the next leaf…  │
│ ┗━━━┛ Andalus failed to take a cave  │ │  835·11·28 · Of the Peace of the …   │
│ in the Asturian hills, there had     │ │                                      │
│ always been some corner of the       │ │ ‹ previous   ‹ in Franks   tables    │
│ peninsula where a Christian king…    │ └──────────────────────────────────────┘
└──────────────────────────────────────┘
```

On a phone:
- the running head shortens to the book's short name and the year;
- the paper goes full-bleed with an 18px gutter, and the text is ragged right;
- the outer-margin slot becomes an inline note, where the glosses would open as sheets;
- the catchwords stack, right-aligned;
- the incipit rubric sits above the initial, as the court's text puts it.

The second wireframe shows a book opening inside an entry, *Here begins the Book of the Franks*. The phone foot's catchword label is schematic: in the mockup, after 835·08·29b the next leaf in both the codex and the Franks is 835·11·28, so it shows one merged catchword.

---

## 9. The colophon (desktop; the phone version is the same, stacked)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ COLOPHON                                                            55 quires   [‹][Tables][ ]   │
├══════════════════════════════════════════════════════════════════════════════════════════════════┤
│                                          Colophon                                                 │
│       Here the book stands at 108 leaves in eight books, 64,346 words, from 2 Muḥarram 738 AH     │
│       (31 July 1337) to 27 Ṣafar 847 AH (26 June 1443). 4 books are closed and 4 are written     │
│       as it happens. It is set down by Trent, with an AI collaborator, after each session…        │
│   QUIRE   READ FROM                          LEAVES                                               │ [1]
│   1       the save of 18 August 1337         738·01·02                                            │
│   5       the save of 11 August 1340         741·01·05  741·02·16                                 │
│    ⋮                                                                                              │
│   32      the save of 4 March 1394           785·02·26  787·12·04  791·08·15  794·03·25 794·03·26 │ [2]
│    ⋮                                                                                              │
│   55      after the last save in the record  846·03·29  847·02·27                                 │
│   The real colophon is a session log: one line per binding, with the date bound, the leaves       │ [3]
│   added and any book opened or closed. A build takes those dates from the commit history.         │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Quires.** The leaves grouped by the save each was read from. Each address is coloured by its book and links to its leaf. This is a stand-in, because the folder has no session dates.
2. **The memory quire.** The 1380s leaves all come out of the save of March 1394. The colophon shows the gap honestly, without saying a word about it.
3. **The real log.** The real binding log is the simple log my brief allows. What's new for the writer (open threads, the living court) belongs to another designer.
