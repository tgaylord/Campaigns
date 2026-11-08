# The Hourglass: wireframes

Annotated ASCII. Every figure, date and line below is real and comes from `brief2/`. The reading page in the middle belongs to another designer, so it is drawn as a plain box. These frames cover the rail, the bead, the "as of" layer around the reading page, and the veil.

Key: `▮` entry tick · `┃` book lane · `╱╱` a stretch with no save · `░` the veil (fog past the point you've read to) · `●` the bead · `◌` a callback ring · `━` an entry's reach

---

## 1. Desktop at rest: reading *Of the Three Marches* (1370)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ THE HOURGLASS   THE SITE STANDS AT                                [First reading|Veil lifted]      │
│                 25 Ṣafar 772 · 18 September 1370                  [Hijri first|Western first]      │
│                 8th year of Saʿd, Sultan of Gharnāṭa                                    (1)        │
├────────────┬─────────────────────────────────────────────────────┬────────────────────────────────┤
│yr reign sv │ lanes: M B P C Ma S F G   register                   │ ┌Save of 13 Sep 1370, 5 days ┐ │
│740 ▒ │  ┃▮       ▌▌                    │  The Marches  كتاب الثغور             │ │before · 60 towns · 748,976 │ │
│    ▒ │  ┃▮▮      ▌▌▌                   │                                        │ │people · treasury 160  (6)  │ │
│750 ▒ │  ┃ ┃▮┃▮    ▌▌                   │  Of the Three Marches, and What        │ └────────────────────────────┘ │
│Yūsuf ▒ │   ┃▮┃▮    ▌▌▌                  │  Lies North of Them                    │  [Faraj] [The realm]           │
│760 ▒ ╱╱╱╱┃╱╱╱╱┃▮╱╱╱╱╱╱  (2)              │  22 Ṣafar 772 · 15 Sep 1370            │ ┌────────────────────────────┐ │
│    ▒ ╱╱╱╱┃╱╱╱╱┃▮╱╱╱╱╱╱                   │ ┌────────────────────────────────────┐ │ │ As of 25 Ṣafar 772.        │ │
│770 ▒ │   ◌ ◌ ┃━━━▮       (3)            │ │This leaf tells events up to 25 Ṣafar│ │ │ Follows the bead.          │ │
│[772]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●  (4)│ │772, 3 days after its own date, so  │ │ │ Faraj ibn Ismāʿīl          │ │
│ ░░░░░░ read to here ░░░░░░░░░░░░░░░░    │ │the site stands at that later date.  │ │ │ فرج بن إسماعيل               │ │
│ ░ ▮   ▮  ▮ ░░░░ ▮▮ ░░░  (5)              │ │It looks back to 8 Ṣafar 769: events │ │ │ ┌────────────────────────┐ │ │
│ ░ ▮ ▮ ░░░░╱╱╱╱╱╱╱╱╱╱░░░░                 │ │no earlier leaf told. It recalls 3   │ │ │ │Died 25 Ṣafar 772       │ │ │
│ ░ ░░░╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱░░░                  │ │earlier leaves (◌ on the rail).      │ │ │ │(18 Sep 1370), aged     │ │ │
│ ░ ▮ ░░░░░╱╱╱╱╱╱╱╱╱░░░░                   │ └────────────────────────────────────┘ │ │ │about 53.               │ │ │
│ ░ ▮▮ ▮ ░░░░░░░░░░░░░░                    │  The day after the reckoning of the     │ │ └────────────────────────┘ │ │
│ ...                                      │  Strait was read, our lord Saʿd had…    │ │ KNOWN BY THIS DATE …       │ │
│                                          │        [the reading page is given]      │ └────────────────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────┴────────────────────────────────┘
```

1. **The header is the contract.** It shows one date, in both calendars, in the order the reader has chosen, with the reign and regnal year under it. Everything on the screen answers to this date.
2. **Hatching marks stretches with no save** longer than two years. It runs across every column, so the silence reads as a property of the record, not of one thread. The 1379–1394 hatch is drawn denser.
3. **The open leaf's reach** is the thick stroke on its lane. It runs from the earliest event no earlier leaf had told (8 Ṣafar 769, 4 Oct 1367) to the last moment the leaf tells (18 Sep 1370). Callbacks get dotted rings on the leaves they recall, not a longer stroke.
4. **The bead** is a red line across the rail. A tab on the left shows the year in the current calendar, and a handle on the right is the drag target. When a leaf is open, the bead sits at the leaf's **as-of** date, which for 17 of the 108 entries is later than its stated date.
5. **The veil.** Past the reader's high-water mark, the rail is fogged. Unread ticks fall into one grey column, so the reader sees how much is ahead and how it is spaced, but not which book any of it belongs to. Reign bands stop at the mark, because a reign boundary would give away a death.
6. **The glance strip** sits above the tabs on every screen: the save behind the numbers, how old that save is, and three headline figures. It is green when the save is under 3 months old, amber under 2 years, and hatched red beyond that.

Column widths on the 176px rail: years 0–30 · reigns 32–46 · saves 50–57 · eight book lanes 63–124 · register 130–170. In the register, each event is a 1px tick: grey on the left half if it was read from a save, orange on the right half if it comes from Trent's account or a screenshot. That makes the dense years visibly dense, and shows where the record leans on Trent's word.

---

## 2. Desktop, dragging (first reading, high-water at 18 Sep 1370)

```
│ 770 ▒ │  ◌ ◌ ┃━━━▮       │
│ ░░░░░░ read to here ░░░░ │┌─────────────────────────────────┐
│ ░ ▮   ▮  ▮ ░░░░ ▮▮ ░░░   ││ 3 Jumādā al-Ākhira 788           │  ← the loupe, the hourglass's
│ ░ ▮ ▮ ░░░░╱╱╱╱╱╱╱╱╱╱░░   ││ 2 July 1386                     │    "neck": what is near the bead,
│[788]━━━━━━━━━━━━━━━━━━━━●┤│ ╱ Past the point you've read to ╱│    at a legible scale
│ ░ ░░░╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱░░░  ││ ● Unread leaf · 785             │
│ ░ ▮ ░░░░░╱╱╱╱╱╱╱╱╱░░░░   ││ ● Unread leaf · 787  ← nearest  │
│                          ││ ● Unread leaf · 791             │
│                          ││ ╱ 14 years 3 months without a   │
│                          ││   save (2 Dec 1379 to 4 Mar 1394)│
│                          ││ Told in retrospect by 1 later   │
│                          ││ leaf                            │
│                          │└─────────────────────────────────┘
```

* While you drag, the header, the glance strip, the realm tab and any open card all update every frame. The reading page stays where it is until you let go.
* **When you let go**, what happens depends on where:
  * within 6px of a tick, that leaf opens;
  * on empty time, you get the **between leaves** page (§5);
  * past the high-water mark on a first reading, you get the **beyond the veil** page (§6).
* On the same drag with the veil lifted, the loupe gives each leaf's title, the reign line comes back ("24th year of Saʿd"), and the lanes keep their colours.
* Keyboard: ↑/↓ moves to the previous or next leaf, PgUp/PgDn moves a year, Home and End go to the start and to now. The rail is an ARIA slider whose value text is the date in both calendars.

---

## 3. One person's card at two dates: Faraj ibn Ismāʿīl

The card is opened from a name in the text. It then **follows the bead**: drag, and it rewrites itself.

```
 bead at 11 Ramaḍān 752 · 1 Nov 1351              bead at 25 Ṣafar 772 · 18 Sep 1370
┌───────────────────────────────────────┐        ┌───────────────────────────────────────┐
│ As of 11 Ramaḍān 752 (1 Nov 1351)     │        │ As of 25 Ṣafar 772 (18 Sep 1370)      │
│ Faraj ibn Ismāʿīl     فرج بن إسماعيل    │        │ Faraj ibn Ismāʿīl     فرج بن إسماعيل    │
│ Naṣrid · game name Faraj              │        │ Naṣrid · game name Faraj              │
│┌─────────────────────────────────────┐│        │┌─────────────────────────────────────┐│
││Living, aged about 34 (birth year    ││        ││Died 25 Ṣafar 772 (18 Sep 1370),     ││
││only).                               ││        ││aged about 53.                       ││
││Regent while Yūsuf I is on the Ḥajj  ││        │└─────────────────────────────────────┘│
││In the dīwān: Increase control in    ││        │ KNOWN BY THIS DATE                    │
││Mālaqa (at the save of 3 Jun 1351)   ││        │ 31 Dec 1355  Around the new year of   │
│└─────────────────────────────────────┘│        │ KNOWN BY THIS DATE                    │
│ KNOWN BY THIS DATE                    │        │ 1 Mar 1354  His first wife was Shamʿa,│
│ Elder brother of Yūsuf I.             │        │   of a ruling house of the central    │
│                                       │        │   Sahara (married 1 March 1354).      │
│ IN THE REGISTER, UP TO THIS DATE      │        │ 31 Dec 1359  The chronicle reads his  │
│ [SCREENSHOT] 6 Oct 1351  Najīb al-    │        │   going… as the harem clearing the    │
│   ʿĀbidīn handed over to Qashtāla…    │        │   court of the amir's grown brothers. │
│ [SCREENSHOT] 1 Oct 1351  The regent   │        │ 18 Sep 1370  He died far from         │
│   Faraj founds the Great Madrasa of   │        │   Gharnāṭa on 18 September 1370.      │
│   Gharnāṭa…                           │        │ ▸ 3 earlier lines                     │
│ [TRENT'S ACCOUNT] 9 Aug 1351  The     │        │ IN THE REGISTER, UP TO THIS DATE      │
│   amir sets out east to make the Hajj │        │ [RECORD] 18 Sep 1370  …dies far from  │
│ IN THE CHRONICLE                      │        │   Gharnāṭa in the south beyond the    │
│ First met in Of the Spring of the     │        │   desert                              │
│ Year 737… (31 Jul 1337)               │        │ [SAVE + ACCOUNT] 28 Mar 1355  A       │
│ 2 leaves by this date. Last seen in   │        │   daughter, ʿĀʾisha, is born…         │
│ Of the Birth of Saʿd                  │        │ IN THE CHRONICLE                      │
│ ┄ LATER: YOU HAVE READ PAST THIS ┄    │        │ 6 leaves by this date. Last seen in   │
│ (faded) 18 Sep 1370  Dies, aged about │        │ Of the Three Marches…                 │
│   53.                                 │        │┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐│
│ 7 Apr 1352  Regent of Granada from 9  │        │  There is more of him ahead in the    │
│   August 1351 until the sultan's      │        ││ chronicle.                          ││
│   return…                             │        │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Appears in 4 later leaves you have    │        │ 2 undated facts are held back by the  │
│   read.                               │        │ veil, because they can't be placed in │
│┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐│        │ time ("in the dīwān", "heir").        │
│  There is more of him ahead in the    │        └───────────────────────────────────────┘
││ chronicle.                          ││
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
└───────────────────────────────────────┘
 Both cards: first reading, read to 18 Sep 1370. On both, "more of him ahead"
 stands for the 1395 line about his son and Qūnka, which lies past the mark.
```

* **Status line.** It is computed from `born`, `died`, the reigns, the regencies, and the last save's heir, regent and cabinet. "About" and "birth year only" appear because the record gives his birth as 1 January 1317, a placeholder date that 24 of the 131 birth dates share.
* **Known by this date.** These are sentences from the person's note, and each one appears only once *every* date in it has passed. That is why, in November 1351, the line "Regent … from 9 August 1351 until the sultan's return on 7 April 1352" is still missing: it mentions 1352. The status line already says he's regent, because that comes from a dated range.
* **In the register.** These are the dated events naming him, each with a provenance chip (save · save + account · Trent's account · screenshot · record).
* **Later.** On a first reading, facts between the bead and the high-water mark appear faded, under the heading "Later: you have read past this". Anything past the high-water mark is reduced to one dashed line. With the veil lifted, the card shows the whole of "Later in the record": the death, later lines, and how many later leaves he appears in. It also shows undated roles and traits.

**The same card, catching a slip (veil lifted).** On the 1437 leaf, Muḥammad V's card lists, under *Later in the record*, "On 15 July 1439, at fifty-three, he gained the Scholar trait (Trent's screenshot)." On the 1439 leaf that line moves into *Known by this date*, beside a register entry of the same day. The 1439 prose says he had begun reading "in the years since the pilgrimage", which places it in the mid-1430s, while the 1437 leaf says he "had never read a book for pleasure". The card shows the date the record gives (July 1439), and that date supports the 1437 leaf. The writer can see which leaf is out of step without opening any other page.

---

## 4. The realm panel, fresh and over a silent stretch

```
 bead at 18 Sep 1370 (fresh)                     bead at 21 Rabīʿ al-Thānī 787 · 1 Jun 1385 (silent)
┌───────────────────────────────────────┐        ┌───────────────────────────────────────┐
│▌From the save of 13 Sep 1370 ("The    │        │▌╱From the save of 21 Shaʿbān 781 (2 Dec│
│▌Peace of the North Shore"): 5 days    │        │▌╱1379, "The Capital at Ishbīliya"): 5  │
│▌before this date. The next save comes │        │▌╱years 5 months before this date. The  │
│▌3 years 2 months later.        green  │        │▌╱record is silent here. These figures  │
│                                       │        │▌╱describe 781 AH, not 787 AH. The next │
│ RULER AT THIS DATE                    │        │▌╱save comes 8 years 9 months later,    │
│ Saʿd ibn Yūsuf, 22                    │        │▌╱ending a 14 years 3 months silence.   │
│ HEIR (AT THE SAVE)  Ismāʿīl ibn Saʿd  │        │ RULER AT THIS DATE                    │
│ CAPITAL  Gharnāṭa                     │        │ Saʿd ibn Yūsuf, 37  (from the reigns, │
│ RANK  …, 13th among the powers        │        │   not the save: always current)       │
│ TOWNS  60   (49 at the save before)   │        │ CAPITAL  Ishbīliyya                   │
│ PEOPLE 748,976  (661,841 before)      │        │ RANK  empire, 10th among the powers   │
│ TREASURY 160  (770 before)            │        │ TOWNS 118 · PEOPLE 1,293,827          │
│ INCOME 62.8 · EXPENSES 144.5          │        │ TREASURY 50 · INCOME 101.4 · DEBT 565 │
│ STABILITY 32.0 · SOVEREIGNTY 100%     │        │ STABILITY 38.3 · SOVEREIGNTY 100%     │
│ SHARES OF POWER [ESTIMATED]           │        │ SHARES OF POWER [ESTIMATED]           │
│ Crown    ▓▓▓▓▓▓░░░  (dashed bar = est)│        │ Crown ┆┆┆┆┆┆┆  29.5%                  │
│ "Shares of power are estimated from   │        │ "Shares of power are estimated from   │
│  the 1 June 1349 reading."            │        │  the 1 June 1349 reading."  ← 36 years│
│ SINCE THAT SAVE, UP TO THIS DATE: …   │        │  old by now                           │
└───────────────────────────────────────┘        │ SINCE THAT SAVE, UP TO THIS DATE:     │
                                                 │ 11 items in the register, 5 from      │
                                                 │ Trent's account or screenshots        │
                                                 │ [SCREENSHOT] 3 May 1385 Rebellion     │
                                                 │   puts off the Hajj once more…        │
                                                 │ ▸ What the save's note says           │
                                                 └───────────────────────────────────────┘
```

* **Age is stated, never implied.** The panel names the save, its date, how long before the bead it was taken, and when the next save comes. The next save is mentioned only if it falls inside what the reader has seen.
* **Stale means hatched.** Past two years, the source line is hatched and says plainly which year the figures describe.
* **The ruler comes from the reigns, not the save.** The ruler line is computed from reign dates, so it stays current inside a silence. Heir, capital and cabinet are labelled "(at the save)".
* **Estimates are drawn differently.** An estimated share of power gets a dashed bar, an `estimated` tag, and the save note's own sentence on where the estimate comes from. In 1385 that sentence points to a reading from 1349.
* **"Since that save" bridges the gap.** It lists the dated events between the save and the bead, with their provenance, so a silence shows what it does hold.

---

## 5. Between leaves (bead dropped on empty time, veil lifted)

```
┌─────────────────────────────────────────────────────┐
│ Between leaves                                      │
│ 21 Rabīʿ al-Thānī 787 · 1 Jun 1385                   │
│ No leaf of the chronicle is dated here.             │
│┌───────────────────────────────────────────────────┐│
││ THE NEAREST LEAVES                                ││
││ 2 years 1 month before · 30 Apr 1383              ││
││ Of the Deaths of Sayyida and Abū ʿInān, and the    ││
││ So-Called Kingdom of Ṭulayṭula                     ││
││ 7 months after · 6 Jan 1386                       ││
││ Of the County of Teruel, and the Pilgrimage That  ││
││ Came Too Late                                     ││
││ The chronicle says nothing for 2 years 8 months   ││
││ here.                                             ││
│└───────────────────────────────────────────────────┘│
│┌╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱┐│
││ THE RECORD  You are inside a 14 years 3 months    ││
││ stretch with no save, from 2 Dec 1379 to          ││
││ 4 Mar 1394. Nothing here was read from a game file.││
│└╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱┘│
│┌───────────────────────────────────────────────────┐│
││ TOLD LATER (leaves whose reach covers this date)  ││
││ looks back from 6 Jan 1386: Of the County of      ││
││   Teruel…                                         ││
││ looks back from 22 Jun 1395: Of the Encircling    ││
││   Sea, and Fifteen Years of Building              ││
│└───────────────────────────────────────────────────┘│
│ THE REGISTER FOR THESE MONTHS: DATA, NOT THE         │
│ CHRONICLE'S VOICE   [SCREENSHOT] 3 May 1385 …        │
└─────────────────────────────────────────────────────┘
```

**"Told later" uses reach, not every source.** The 1429 leaf on Ismāʿīl's death cites the 1405 death of Saʿd, but it doesn't *tell* 1405, so it isn't listed for a date in 1405. On a first reading, a later leaf that covers this date appears as "a later leaf of 797 AH, not yet read", with no title.

---

## 6. The veil, and lifting it

```
 FIRST READING, bead dropped in 1386                    VEIL LIFTED (Trent)
┌─────────────────────────────────────────────┐   rail: lanes, colours and reigns run to now;
│ Beyond the veil                              │         a dotted "last visit" line at the
│ 4 Dhū al-Ḥijja 787 · 6 Jan 1386              │         save of 11 Jun 1442; rings mark the
│┌╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱┐│         2 leaves added since then
││ This is past the point you've read to       ││
││ (18 Sep 1370). On a first reading, the site ││   header: the reign line comes back
││ shows nothing beyond that point, so that no ││   cards: a "Later in the record" section,
││ card, panel or title gives away what comes  ││          with the death and undated facts
││ next.                                       ││   gap page: the next save's date, titles
││ Opening this leaf would skip 14 unread      ││          of "told later" leaves
││ leaves.                                     ││   leaf page: "later leaf →" shows the
││ [Back to where I left off] [Read ahead      ││          title
││  anyway (unveils the skipped leaves)]       ││
││ [Lift the veil]                             ││
│└╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱┘│
│ header: "Past the point you've read to: the  │
│ reign is veiled"                             │
│ realm & card: "lies past what you've read,   │
│ so it stays veiled"                          │
└─────────────────────────────────────────────┘
```

* **The horizon H** is the reader's high-water mark: the latest as-of date of any leaf they have opened. It is stored in the browser and only ever moves forward. Rereading 1350 after reaching 1400 hides nothing from 1351–1400, since those years are already read. They appear as "Later: you have read past this".
* **What the veil hides past H:** the ruler and regnal year, reign boundaries, book lanes and titles, the colours of unread ticks, the register's ticks, every card fact, and the realm panel.
* **What it leaves visible:** dates, the rhythm of unread ticks, and the save hatching. These tell you *how much* is ahead and *how dense* it is, but not *what* happens.
* **Who gets which:** a link shared with a friend opens on a first reading at leaf 1. Trent's browser remembers that he lifted the veil. The two modes never need accounts.

---

## 7. Phone (390 × 844)

```
 at rest                     rail expanded                  card sheet (tap "Saʿd")
┌──────────────────────┐    ┌──────────────────────┐       ┌──────────────────────┐
│ THE SITE STANDS AT   │    │ 25 Ṣafar 772 ·       │       │ 25 Ṣafar 772 · 18 Sep│
│ 25 Ṣafar 772 ·       │    │ 18 September 1370    │       │ …                    │
│ 18 September 1370    │    │ …                    │       │┌────────────────────┐│
│ 8th year of Saʿd…    │    │                      │       ││As of 25 Ṣafar 772 ×││
│[First|Veil][H|W][↺]  │    │ Of the Three Marches,│       ││Saʿd ibn Yūsuf      ││
├──────────────────────┤    │ and What Lies North… │       ││سعد بن يوسف          ││
│ The Marches كتاب الثغور│    │ This leaf tells …    │       ││Living, aged 22.    ││
│ Of the Three Marches,│    ├─[Collapse the rail]──┤       ││Sultan of Gharnāṭa, ││
│ and What Lies North  │    │Yūsuf I        │Saʿd  │       ││8th year of the     ││
│ of Them              │    │▮▮ ▮▮▮ ▮ ▮▮▮▮ ▮│▮ ░░░░│       ││reign               ││
│ 22 Ṣafar 772 · 15 Sep│    │━┃━┃▮▮ ┃ ▮▮  ┃━▮●░░░░│       ││KNOWN BY THIS DATE  ││
│ ┊ This leaf tells…   │    │ ┃▮┃▮  ┃▮  ◌◌┃━━●░░░░│       ││13 Dec 1364 His     ││
│ The day after the    │    │ ▌▌▌▌▌ ▌▌▌▌ ▌▌▌▌●░░░░ │       ││first child…        ││
│ reckoning of the     │    │740 750 760 770│░░░░░ │       │└────[Collapse rail]─┘│
├─[Expand the rail]────┤    │ read to here ┘       │       │ ▮▮ ▮▮▮━━━●░░░░░░░    │
│▮▮▮ ▮ ▮▮ ┃━━●░░░░░░░░│    └──────────────────────┘       └──────────────────────┘
│740  760 ░░░░░░░░░░░░ │
└──────────────────────┘
```

* **The rail turns horizontal** and sits at the bottom of the screen, 78px tall, always visible, with the thumb on the bead (●). A drag scrubs left and right. The "Expand the rail" tab raises it to 220px, which adds reign names, year labels every five years, and the "read to here" mark.
* **The loupe** floats above the strip while you drag, with the same content as on desktop.
* **Cards open as a bottom sheet** above the rail, so you can keep dragging the bead with the card open and watch it change. The realm panel flows under the leaf, starting with the glance strip.
* **Targets:** the bead's grab area is the whole strip, so a touch anywhere moves the bead there. Leaves snap within 6px. The previous and next leaf links at the end of the leaf are the precise alternative.

---

## 8. The rail at 400 years (sketch: the same 176px, 1337–1737)

```
┌──────────────────┐
│1350 ▒▒│▌▌▌▌▌▌▌▌  │  overview: every reign as a band,
│1400 ▒▒│▌▌▌ ▌▌▌▌  │  books as lanes (8 here, perhaps 20
│1450 ▒ │▌▌▌▌ ▌▌▌  │  later, merged into ages when the
│1500 ▒▒│ ▌▌▌▌▌▌▌  │  lanes overflow), entries as density
│1550 ▒ │▌▌▌▌▌▌    │  (darker = more leaves per year)
├──────────────────┤
│1588 ─ ─ ─ ─ ─ ─ ─│  the neck: the 30 years around the bead
│1590 ▮  ▮ ▮       │  get ~35% of the rail's length (fisheye).
│1592   ▮▮  ━━▮    │  At this scale individual ticks, saves,
│1594 ━━━━━━━━━━●  │  the open leaf's reach and callbacks
│1596 ▮   ▮        │  are back to the 1337–1443 density
│1598 ╱╱╱╱╱╱╱╱     │  seen in §1. The loupe works as now.
│1618 ─ ─ ─ ─ ─ ─ ─│
├──────────────────┤
│1650 ▒ │▌▌ ▌▌ ▌▌  │
│1700 ▒▒│▌▌▌▌▌▌▌▌  │
│1737 ▒ │▌▌▌ ░░░░░ │  veil fog past the high-water mark
└──────────────────┘
```

* **Fisheye around the bead** is the scale answer. Today 108 ticks over about 840px of rail average about 8px apart. 400 leaves would be about 2px apart, still readable as density but not as individual targets, so the 30 years around the bead are magnified and the rest compressed. The magnified window moves with the bead.
* **When lanes overflow,** say past 12 books, finished books fold into the "age" or reign they belong to, and open books keep their own lanes.
* **On the phone** the same fisheye applies to the horizontal strip. The expanded rail shows the overview, with the neck as a raised window.
