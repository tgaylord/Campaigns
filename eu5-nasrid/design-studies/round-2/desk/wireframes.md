# The Desk: wireframes

All screens share a masthead and a tab rail. Content in the frames is real, taken from the mockup.
`[ ]` marks a control, `(k)` the open-knot glyph, `(K)` the tied-knot glyph, and `»` a link.

```
MASTHEAD (all screens)
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ The Desk  المكتب   The book stands at 27 Ṣafar 847 · 26 June 1443 · 108 entries ·        │
│                    last save 11 June 1442                     Reading as [Trent|a friend] │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ Since you were last here │ Threads 10 open │ The court 40 │ Verses 105 │ Awaiting the save│
│ │ Before the next session │ In the margin                                                 │
└──────────────────────────────────────────────────────────────────────────────────────────┘
  ① The frontier line is the Desk's one fixed fact: where the book stops, and how far behind
    it the last save is (here, a year).
  ② "Reading as" switches the frontier rule on. It is not a site-wide veil; it only governs
    what the Desk shows.
  ③ On a phone the tab rail scrolls sideways and the frontier line wraps under the title.
```

---

## 1. A session's cover ("Since you were last here"), desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ FASCICLE · NO. 41 · (reconstructed in the mockup)           There is no session log in the│
│ The session of 1438–1443                                    folder; this boundary is      │
│ after 19 Rajab 841 (16 Jan 1438) to 27 Ṣafar 847 (26 Jun 1443) inferred from the saves. ④│
│══════════════════════════════════════════════════════════════════════════════════════════│
│ WHAT HAS PASSED                              ⑤ │ ┌ WHAT CHANGED ──────────────────────── ⑥┐│
│ I n the years after the admiral prince put to  │ │ saves 16 Jan 1438 → 11 Jun 1442       ││
│   sea, the Emperor Muḥammad gave Majrīṭ its    │ │ Towns of the crown      221 → 222  +1  ││
│ charter and took the umarāʾ's land rights as   │ │ Subjects        3,246,583 → 3,327,740  ││
│ its price. At fifty-three he became a scholar, │ │ Stability             24.2 → 14.2  −10 ││
│ … and the new Jamāʿa, lords and merchants      │ │ Legitimacy             100 → 65    −35 ││
│ together, asked for Fernando Po.               │ │ Land ↔ sea (+ sea)     1.1 → 26.3  +25 ││
│ drafted by the collaborator, approved by Trent │ │ Estates  Nobility ▓▓▓▓░░  41 → 32      ││
│────────────────────────────────────────────────│ │          Burghers ▓▓▓▓▓▓▓ 50 → 74      ││
│ IN THIS NUMBER                               ⑦ │ │ + Shipwright Contracts  + Urban Grants ││
│  I  Of the Charter of Majrīṭ …        398 w    │ │ − Land Rights                          ││
│     12 Shawwāl 841 · 8 Apr 1438 · Enc. Sea     │ └────────────────────────────────────────┘│
│  II Of the Emperor Who Became a Scholar 413 w  │ ┌ NEW TO THE COURT ─────────────────── ⑧┐│
│  …                                             │ │ No new names. Nine children of the     ││
│  VII Of the Jamāʿa of 847, and Fernando Po     │ │ house (1430–34) still have no records» ││
│  7 entries · 3,166 words · open them from the  │ │ GONE FROM IT: none. Last: Bernarda,    ││
│  book's own contents                           │ │ 6 Nov 1437, told last session.         ││
│────────────────────────────────────────────────│ └────────────────────────────────────────┘│
│ THREADS THIS SESSION                         ⑨ │ ┌ FROM THE COPYIST ─────────────────── ⑩┐│
│ Begun   (k) The umarāʾ's grievance             │ │ Of 12 facts, 2 rest on a save and 10 on││
│         (k) The Catalan privileges in Arghūn   │ │ Trent's account and screenshots.       ││
│         (k) The trade war  (k) The princes'    │ │ 3 come after the last save »           ││
│         promise  (k) The league  (k) Fernando Po│ │ [Trent's OOC note: invented colour]   ││
│ Tied    (K) The slow prince                    │ └────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────────┘
  ④ The number and entry list come from sessions.json. Without it the cover says it is guessing.
  ⑤ The recap is about 80 words in the chronicle's voice, written in the session's last pass. A drop
    cap marks it as part of the book's apparatus, not a UI summary.
  ⑥ The deltas run between this session's last checkpoint and the previous session's. Colour shows
    good or bad only where that is unambiguous; land↔sea stays neutral.
  ⑦ The entries are listed, not ordered: the book's structure belongs to another design.
  ⑧ "New to the court" means first appearance in these entries; "gone" means deaths dated in the
    span. Both can be empty, and the cover says so plainly.
  ⑨ Each chip opens the thread followed through the book (screen 3).
  ⑩ Provenance at session level. Trent's out-of-character note prints here when it exists.
```

### Session cover, phone (390 px)

```
┌──────────────────────────────┐
│ The Desk  المكتب              │
│ Book at 27 Ṣafar 847 ·       │
│ 26 Jun 1443 · save 11 Jun 1442│
│        Reading as [Trent|fr.]│
├──────────────────────────────┤
│ Since you were last here│Thre›│  ← rail scrolls
├──────────────────────────────┤
│ FASCICLE · NO. 41            │
│ The session of 1438–1443     │
│ 19 Rajab 841 → 27 Ṣafar 847  │
│ (reconstructed: no log) ⓘ    │
│                              │
│ WHAT HAS PASSED              │
│ I n the years after the      │
│   admiral prince put to sea, │
│ the Emperor Muḥammad gave …  │
│                              │
│ ┌ WHAT CHANGED ────────────┐ │  ← cards stack under the
│ │ Stability   24.2→14.2 −10│ │    recap; the order is
│ │ Legitimacy   100→65   −35│ │    recap, changes, contents,
│ │ Burghers ▓▓▓▓▓▓▓ 50→74   │ │    threads, court, copyist
│ │ …                        │ │
│ └──────────────────────────┘ │
│ IN THIS NUMBER               │
│ I   Of the Charter of Majrīṭ │
│     8 Apr 1438 · 398 w       │
│ …                            │
│ THREADS THIS SESSION         │
│ (k) The umarāʾ's grievance   │
│ …                            │
└──────────────────────────────┘
```

---

## 2. The Desk: threads, desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ THE DESK                                                                                  │
│ Threads                                                                                   │
│ Promises, questions and warnings the chronicle has made to itself. 10 open, 9 tied.       │
│ [open|tied|all]   [all][promise][omen][grudge][question][motif][debt][object][venture] ⑪ │
│──────────────────────────────────────────────────────────────────────────────────────────│
│ (k) The naft of Ethiopia                                                                  │
│     [open][omen] begun 1427, in Of the Islands of the Ocean… · 2 knots ·                  │
│     quiet for 16 years, 21 entries                                                     ⑫ │
│     Ismāʿīl sells fire weapons to Christian Ethiopia … says it will never backfire.       │
│     1337 ─────────────────────────────────────────────────────────o━━━━━━━━━━━━━━━│ now ⑬│
│──────────────────────────────────────────────────────────────────────────────────────────│
│ (k) The price of Shant Yāqub   [open][debt] begun 1430 · 4 knots · quiet 11 yrs           │
│     ──────────────────────────────────────────────────────────────────o─o━━━━━━━━━│       │
│──────────────────────────────────────────────────────────────────────────────────────────│
│ (k) The princes' promise to the ʿulamāʾ  [open][promise] [due at the accession of        │
│     Ismāʿīl ibn Muḥammad] ⑭                                                               │
│──────────────────────────────────────────────────────────────────────────────────────────│
│ … (tied, under the "tied" filter)                                                         │
│ (K) The law of the house  [tied][question] begun 1398 · tied 1408 · 5 knots               │
│     ───────────────────────────────o──o──●─────────── · ────o(echo 1429) ──────────────│  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
  ⑪ Kind filters use the chronicle's own vocabulary (debt, grudge). Each campaign brings its own list.
  ⑫ "Quiet for" is computed from the last knot. It drives the checklist's "threads gone quiet".
  ⑬ The strip places each knot on the whole span of the book: hollow knots for begun and knotted,
    filled for tied, dotted for an echo. The gold tick is the frontier. Past 200 years it needs a
    per-book or zoomable axis.
  ⑭ A "due" condition is the one hand-written field that makes a thread time-sensitive.
```

**Friend mode:** a gold-ruled note at the top says that the Desk stands at the end of the book. The
"tied" filter shows "Tied threads tell you how things turn out. [Show them anyway]" instead of the
list.

### Threads, phone

```
┌──────────────────────────────┐
│ Threads                      │
│ 10 open · 9 tied             │
│ [open|tied|all]              │
│ [all][promise][omen][grudge] │
│ [question][motif][debt]…     │  ← chips wrap
├──────────────────────────────┤
│ (k) The naft of Ethiopia     │
│ [open][omen]                 │
│ begun 1427 · 2 knots         │
│ quiet for 16 years           │
│ Ismāʿīl sells fire weapons…  │
│ ───────────────────o━━━━━━│  │
├──────────────────────────────┤
│ (k) The price of Shant Yāqub │
│ …                            │
└──────────────────────────────┘
```

---

## 3. One thread followed through the book, desktop (phone is the same column, full width)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← all threads                                                                 │
│ FOLLOWING A THREAD · DEBT                                                     │
│ (k) The price of Shant Yāqub                                                  │
│ Muḥammad pulls down the Apostle's shrine. The chronicle says plainly that the │
│ cost is still to be paid. The Crusade of 835 is the first instalment.         │
│ [open] [4 knots across 2 years]                                               │
│                                                                               │
│ (k)┐ BEGUN                                                                    │
│    │ Of the War of Shant Yāqub, and the Shrine of the Apostle                 │
│    │ 23 Shawwāl 833 · 15 July 1430 · The Marches                              │
│    │ ┌───────────────────────────────────────────────────────────────────┐   │
│    │ │ No one in the dīwān asked the Emperor why. … now had a different  │   │
│    │ │ story to tell. ▒What the destruction of the Apostle's shrine would│ ⑮ │
│    │ │ cost al-Andalus, and when, and to whom it would be paid, remains  │   │
│    │ │ to be seen.▒                                                      │   │
│    │ └───────────────────────────────────────────────────────────────────┘   │
│    ┆ later the same year                                                ⑯    │
│ (k)┤ KNOTTED · The Close of the Book of the Marches · 16 Ṣafar 834            │
│    │ ▒The court has not forgotten Shant Yāqub.▒ In Ishbīliya the Pórtico …    │
│    ┆ 2 years later                                                            │
│ (k)┤ KNOTTED · Of the Warmonger's Name, the Crusade of 835 …                  │
│    ┆ later the same year                                                      │
│ (k)┤ KNOTTED · Of the Peace of the Pope … ▒Some of the old men of the dīwān   │
│    │ wondered what the Christians would call it now.▒                         │
│    ┆ open at the frontier, 26 June 1443                                       │
│ ┌ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐  │
│   (k) Still to be paid. Last touched 11 years and 11 entries ago.            │
│ └ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘  │
└──────────────────────────────────────────────────────────────────────────────┘
  ⑮ The whole paragraph is shown, with the anchoring sentence marked. The thread is read as prose,
    not as a list of facts. Each entry title opens the entry at that paragraph.
  ⑯ The gaps between knots say how much time passed. A thread that crosses books (Marches into
    Franks) shows the book on each knot.

  FRIEND MODE, arrived from a knot in the margin at knot 1:
  │ [as far as you have read: knot 1]                                             │
  │ (k)┐ BEGUN · Of the War of Shant Yāqub …  (paragraph)                         │
  │ ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐            │
  │ This thread goes on for 3 more knots. You'll meet them as you read on.        │
  │ [Show the rest]                                                               │
  The gist is swapped for the thread's "frontier" line, and status and knot count are hidden.
```

### The knot in the reading margin (how a thread is met)

```
DESKTOP                                                         │ MARGIN (Desk owns only knots)
 …His three wives … had been chosen by his father and           │
 grandfather for their minds as well as their blood. With the   │ (k) Prince Aḥmad's drawings
 two princes they did most of the governing … ▁Prince Aḥmad had │     begun here · 1 knot, open
 begun to draw buildings, as his forebears had, and to talk of  │     follow this thread »
 the great works he would raise in the capital one day.▁        │
                                                                │
 … ▁was taken down stone by stone and carted south to           │ (k) The Pórtico in the storeroom
 Ishbīliya.▁ The rest became a field of rubble.                 │     begun here · 2 knots, open

PHONE: the knot drops beneath its paragraph as a thin rubricated strip:
 │ …the great works he would raise in the capital one day. │
 │ ┃(k) Prince Aḥmad's drawings · begun here · follow »    │
  The anchoring sentence gets a faint underline. In friend mode the margin note gives only "knot 2 of ?
  · first in 1430", never the total or the outcome.
```

---

## 4. The court as it stands, desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ The court as it stands         ages at 26 June 1443 · offices from the 11 June 1442 save  │
│ Arrange [by house|by silence|by age]                                                  ⑰  │
│                                                                                           │
│ THE HOUSE OF NAṢR  15                                                                     │
│ ┌────────────────────────┐┌────────────────────────┐┌────────────────────────┐┌────────┐ │
│ │ Muḥammad ibn Ismāʿīl   ││ Ismāʿīl ibn Muḥammad   ││ Muḥammad ibn Yūsuf     ││ …      │ │
│ │ محمد بن إسماعيل         ││ إسماعيل بن محمد          ││ محمد بن يوسف            ││        │ │
│ │ 57 · b. 1385           ││ 40 · b. 1402           ││ 53 · b. 1389           ││        │ │
│ │ emperor as Muḥammad V  ││ in the dīwān: Andalusī ││ member of the dīwān    ││        │ │
│ │                        ││ culture · heir         ││ [not in the 1442 dīwān]⑱│        │ │
│ │ in the latest entry    ││ last 1442 · 1 yr       ││ last 1408: unmentioned ││        │ │
│ │ ░░░░░░░░░░░░░░░░       ││ ▓░░░░░░░░░░░░░░        ││ 35 yrs, 32 entries ▓▓▓▓││        │ │
│ └────────────────────────┘└────────────────────────┘└────────────────────────┘└────────┘ │
│ THE COURT AND THE ṬĀʾIFAS 13   ·   ABROAD 12 ("last heard of")                            │
│ NOT YET ON THE ROLL 9   Sun, 13, daughter of the heir Ismāʿīl · turns sixteen in 1446 ⑲  │
│ NEVER BURIED 8          Najīb, 126 · last in 1352 · unmentioned 91 yrs               ⑳  │
│ A DEAD MAN IN THE DĪWĀN Yūsuf ibn Saʿd, d. 1435, still in the 1438 and 1442 cabinets      │
└──────────────────────────────────────────────────────────────────────────────────────────┘
  ⑰ "By silence" is the writer's view: everyone in one grid, the longest-unmentioned first.
  ⑱ An office claimed in a person record but missing from the latest cabinet is flagged, not trusted.
  ⑲ Births in the record with no person record. They are about to matter to the story.
  ⑳ The unburied are kept out of the living count, and each is a decision for the writers: died
    offstage (set `fate`), or give them a line. These groups are hidden in friend mode.
```

### The court, phone

```
┌──────────────────────────────┐
│ The court as it stands       │
│ [house|silence|age]          │
│ THE HOUSE OF NAṢR 15         │
│ ┌──────────────────────────┐ │  ← one card per row
│ │ Muḥammad ibn Yūsuf   53  │ │
│ │ محمد بن يوسف              │ │
│ │ member of the dīwān      │ │
│ │ [not in the 1442 dīwān]  │ │
│ │ unmentioned 35 yrs ▓▓▓▓▓ │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## 5. The writer's checklist before a session, desktop (phone: one column)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ FOR THE WRITERS · Before the next session          (ticks kept in this browser only)      │
│ ┌───────────────────────────────────────────┐ ┌────────────────────────────────────────┐ │
│ │ [ ] Pick up where the book stopped        │ │ [ ] Choosing the closing verse         │ │
│ │     last: Of the Jamāʿa of 847… (27 Ṣafar)│ │     105 used. Check the next one by    │ │
│ │     read "What has passed" »              │ │     reference »  The sea has closed 7  │ │
│ │ [ ] Promises that fall due                │ │ [ ] From the save, first thing         │ │
│ │     The princes' promise to the ʿulamāʾ:  │ │     Golden Century situation active?   │ │
│ │     due at Ismāʿīl's accession. The       │ │     Thalassocracy, 20 years left?      │ │
│ │     Emperor is 57.                        │ │     Jamāʿa of 847, Fernando Po target? │ │
│ │ [ ] Threads gone quiet                    │ │     Yūsuf ibn Saʿd still in cabinet?   │ │
│ │     The naft of Ethiopia: 16 yrs          │ │ [ ] After the session: the thread pass │ │
│ │     The Pórtico in the storeroom: 13 yrs  │ │     collaborator proposes:             │ │
│ │     Prince Aḥmad's drawings: 13 yrs …     │ │     + knot  umara-grievance ← "…"      │ │
│ │ [ ] Members of the house forgotten        │ │     + open  fernando-po    ← "…"       │ │
│ │     Muḥammad ibn Yūsuf, 53: 35 yrs        │ │     = tie   the-slow-prince ← "…"      │ │
│ │     Abū al-Ḥasan ʿAlī ibn Saʿd, 33: 30 yrs│ │     ? let go catalan-privileges        │ │
│ │ [ ] Coming of age                         │ │     Trent ticks each line, then writes │ │
│ │     Sun, ʿĀʾisha, Fāṭima turn 16 in 1446  │ │     the session record (span, recap,   │ │
│ │     Give each a person record first       │ │     copyist's note).                   │ │
│ └───────────────────────────────────────────┘ └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────┘
  Every line is generated. None of it is typed by hand except the thread-pass decisions.
```

---

## 6. Verses and Awaiting the save (shorter notes)

```
VERSES                                              AWAITING THE SAVE
[ Paste a verse, or type 3:26 ............ ]        TOLD SINCE THE LAST SAVE (11 JUNE 1442)
→ Already used: 3:26 closes the Peace of             [ ] Golden Century (7 Aug 1442) · Trent's
  Balansiyya, 1340, and the Restoration, 1375            screenshots → next save shows it active
USED TWICE (8)                                       [ ] Thalassocracy (7 Aug 1442)
 3:26   "Owner of Sovereignty…" │ "…Owner of         [ ] Jamāʿa of 847 (26 Jun 1443)
        sovereignty… take sovereignty away"         NEVER SETTLED
 94:5–6 "So verily, with hardship…" │ "For           [ ] Volunteers fall back from Uryūla, 1339:
        indeed, with hardship…"                         "exact date to come from the next save"
NO CLOSING VERSE: 1339, 1348, 1350; 1346 opens      CONTINUITY FLAGS
BY THEME  war and victory 19 · the sea 7 · …         a dead man in the dīwān · 8 verse repeats ·
CONCORDANCE (sura order)                             8 never buried · 9 unrolled · 2 stale offices
 2:143 │ al-Baqara │ "And thus We have made …" │ Of Barshalūna Returned…, 1437
```
