# Six Numbers: wireframes

Desktop is about 1280 wide; phone is 390 wide. `[ ]` marks a control, `●` marks read figures, `◌≈` estimated ones, and `✎` the player's account. The mockup (`mockup.html`) builds screens 1, 2 and 4 with real data.

---

## 1. The opening (the issue's cover)

### Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Six Numbers                                    [Hijri|Western]  [Ishbīliya|Seville]  │ ← sticky bar; both toggles
├──────────────────────────────────────────────────────────────────────────────────────┤   remembered per reader
│                                                                                      │
│   ISSUE I · 737 AH (1337) TO 846 AH (1442) · 72 SAVES · 762 EVENTS                   │ ← span computed from data
│                                                                                      │
│   Six Numbers of al-Andalus                                                          │ ← display serif, 76px
│                                                                                      │
│   In 105 years a tributary sultanate of eighteen towns became an empire              │
│   that held the whole peninsula. These are the numbers that tell how…                │
│                                                                                      │
│   ┌────────────────────────┬────────────────────────┬────────────────────────┐       │
│   │ 42%                    │ 39.7                   │ 5×                     │       │ ← each tile links to
│   │ of the old lands'      │ sovereignty at its     │ conquered, then given  │       │   its chapter; colour
│   │ people died, 1346–50   │ lowest, July 1348      │ away: 18→241→196       │       │   = chapter accent
│   ├────────────────────────┼────────────────────────┼────────────────────────┤       │
│   │ 98→23→60               │ 38 yrs                 │ #2 / −13               │       │
│   │ percent Sunni: swamped │ between the fleet and  │ second in the world,   │       │
│   │ by conquest, won back  │ the turn to the sea    │ least at peace: 1414   │       │
│   └────────────────────────┴────────────────────────┴────────────────────────┘       │
│                                                                                      │
│   ── THE WIRE (since Issue I closed) ────────────────────────────────────────────    │ ← appears once the
│   • 11 Jun 1442  Three estates break ranks at once      [new chapter]                │   issue is closed;
│                                                                                      │   chapters published
└──────────────────────────────────────────────────────────────────────────────────────┘   one at a time
```

### Phone

```
┌──────────────────────────────────┐
│ Six Numbers  [Hij|Wes] [Ish|Sev] │
├──────────────────────────────────┤
│ ISSUE I · 737–846 AH             │
│ (1337–1442) · 72 SAVES           │
│                                  │
│ Six Numbers                      │
│ of al-Andalus                    │ ← 40px
│                                  │
│ In 105 years a tributary         │
│ sultanate of eighteen towns…     │
│ ┌───────────────┬──────────────┐ │
│ │ 42%           │ 39.7         │ │ ← 2 columns on a phone,
│ │ died in the   │ sovereignty  │ │   3 rows
│ │ Pestilence    │ at its floor │ │
│ ├───────────────┼──────────────┤ │
│ │ 5×            │ 98→23→60     │ │
│ ├───────────────┼──────────────┤ │
│ │ 38 yrs        │ #2 / −13     │ │
│ └───────────────┴──────────────┘ │
└──────────────────────────────────┘
```

---

## 2. A pinned-graphic chapter: "42%" at three scroll steps

The chapter opens with a full-width head: a huge number (180px, plague red), the headline and a two-line dek. Then the scrolly section starts. The graphic is `position: sticky`; the text cards scroll past it. The page never takes over the scroll.

### Desktop, step 0 ("489,600 souls")

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│                                 489,600                                              │ ← headline figure for
│                                 souls in the eighteen towns · one dot ≈ 5,000        │   this step
│  ┌──────────────────────────┐   in cities       towns    countryside                 │
│  │ 11 Rabīʿ al-Thānī 747    │   ● ● ● ● ●       ● ●      ● ● ● ● ● ●                 │
│  │ (1 Aug 1346)             │   ● ● ● ● ●       ● ●      ● ● ● ● ● ●                 │ ← unit chart: 98 dots,
│  │                          │   ● ● ● ● ●                ● ● ● ● ● ●                 │   blocks by settlement
│  │ Eighteen towns and their │   ● ● ● ● ●                ● ● ● ● ● ●                 │   rank (40 / 4 / 54)
│  │ districts: 489,600 souls │   ● ● ● ● ●                ● ● ● ● ● ●                 │
│  │ …rumours of a great      │   ● ● ● ● ●                ● ● ● ● ● ●                 │
│  │ pestilence at Yāyiq…     │   ● ● ● ● ●                ● ● ● ● ● ●                 │
│  │                          │   ● ● ● ● ●                ● ● ● ● ● ●                 │
│  │ (● read) save 1 Aug 1346 │                            ● ● ● ● ● ●                 │ ← provenance mark
│  └──────────────────────────┘                                                        │   on every card
│        ↑ active card (full opacity); the others are dimmed                           │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Desktop, step 4 ("−42%")

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                 −42%                                                 │ ← turns plague red
│                                 489,600 → 284,300 in the same eighteen towns         │
│  ┌──────────────────────────┐   in cities       towns    countryside                 │
│  │ by 28 Jumādā al-Ākhira   │   ● ● ● ● ●       ● ●      ● ● ● ● ● ●                 │
│  │ 751 (2 Sep 1350)         │   ● ● ● ● ●       · ·      ● ● ● ● ● ●                 │ ← 42 dots shrink and
│  │                          │   ● ● ● ● ●                ● ● ● ● ● ●                 │   fade (18 / 2 / 22),
│  │ Then the Great Dying.    │   ● ● ● ● ●                ● ● ● ● ● ●                 │   with a light random
│  │ …the same eighteen towns │   ● ● · · ·                ● ● ● ● ● ●                 │   stagger (none with
│  │ hold 284,300. The cities │   · · · · ·                ● ● · · · ·                 │   reduced motion)
│  │ lost 45%, the villages   │   · · · · ·                · · · · · ·                 │
│  │ 40%.                     │   · · · · ·                · · · · · ·                 │
│  │ (● read) same lands,     │                            · · · · · ·                 │
│  │ two saves compared       │                                                        │
│  └──────────────────────────┘                                                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Desktop, step 6 ("No realm lost more")

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                Share of people lost, same lands, Aug 1346–Sep 1350   │
│  ┌──────────────────────────┐   Granada (old lands) ███████████████████  −41.9%      │ ← the dots cross-fade
│  │ by 2 Sep 1350            │   Mallorca            █████████████████░   −39.3%      │   to ranked bars;
│  │                          │   Naples              ███████████████░     −35.7%      │   Granada in full red,
│  │ No realm the court could │   Qashtāla            ███████████████░     −35.1%      │   the rest pale.
│  │ count lost more. Iberia  │   All Iberia          ██████████████░      −34.3%      │   Country names follow
│  │ lost a third, Qashtāla   │   …                                                    │   the names toggle
│  │ 35%. Across the water    │   Banū Marīn          ████████░            −18.5%      │   (Banū Marīn /
│  │ the Marīnids lost 19%…   │   The known world     █████░               −11.6%      │   Morocco)
│  │ (● read) every location  │   Banū Ḥafṣ           ███░                  −7.4%      │
│  └──────────────────────────┘                                                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Phone, the same chapter (graphic above, cards below)

```
┌──────────────────────────────────┐
│ Six Numbers  [Hij|Wes] [Ish|Sev] │ ← 44px bar
├──────────────────────────────────┤
│  −42%                            │ ┐
│  489,600 → 284,300, same towns   │ │ sticky graphic, about 50vh,
│  cities    towns  countryside    │ │ labels enlarged for the
│  ●●●●●     ●●     ●●●●●●         │ │ phone (19px in the
│  ●●●●●     ··     ●●●●●●         │ │ viewBox, about 11px
│  ●●···            ●●●●●●         │ │ on screen)
│  ·····            ●●····         │ │
│  ·····            ······         │ ┘
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │ ← the card scrolls UP over
│ │ by 28 Jumādā al-Ākhira 751   │ │   the page's lower half;
│ │ (2 Sep 1350)                 │ │   the step fires when the
│ │ Then the Great Dying. When it│ │   card's top passes 85% of
│ │ fades, the same eighteen     │ │   the viewport, so the chart
│ │ towns hold 284,300…          │ │   changes as the card comes
│ │ (● read) same lands          │ │   in, not after it has
│ └──────────────────────────────┘ │   covered the chart
│               ⋮  60vh gap        │ ← room to look at the chart
│ ┌──────────────────────────────┐ │   between cards; no snap,
│ │ next card…                   │ │   no locked scroll
└──────────────────────────────────┘
```

### Chapter close (both sizes)

```
┌──────────────────────────────────────────────┐
│ ┃ "…lost 42% of its people in four years,    │ ← a chronicle line, always
│ ┃ the cities and their burghers and scholars │   (it closes in the court's voice)
│ ┃ worst of all, hospitals or no."            │
│   From the summary of the Book of the        │
│   Pestilence                                 │
│                                              │
│ [Make a card]  [Next number ↓]               │
│                                              │
│ ▸ How this chapter was found                 │ ← fold-out: the finder's raw
│   proposed: drop · people · −45% (same       │   proposal, and what the
│   towns) · 1339-05-24 → 1353-02-02           │   writer changed and why
│   edited: −41.9%, same-lands comparison of   │
│   2 Sep 1350                                 │
│                                              │
│ ┄ Since this was written ┄                   │ ← only appears if a later save
│   (none: this number is closed history)      │   moves the number
└──────────────────────────────────────────────┘
```

---

## 3. "38 years" at three steps (desktop only; the phone follows the pattern in screen 2)

```
 step 2: 1379–1411                         step 3: 1429                         step 6: 1442
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
│                       −36.9  │ │                       −36.6  │ │                       +26.3  │ ← needle readout,
│              1411 · 47 ships │ │              1429 · 50 ships │ │              1442 · 58 ships │   brown for land,
│ sea ↑    ¦court ¦prince      │ │ sea ↑                        │ │ sea ↑                    ●   │   blue for sea
│  0 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │ │  0 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │ │  0 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╱┈┈ │
│ ╲__                          │ │ ╲__                          │ │ ╲__                    ╱     │
│    ╲_____ ┈┈┈ ▓▓▓▓▓▓▓▓●      │ │    ╲_____ ┈┈┈ ▓▓▓▓▓▓▓▓▓▓▓▓▓● │ │    ╲_____ ┈┈┈ ________╱      │ ← plateau band:
│ land ↓      "−36.9, unmoved  │ │ land ↓                       │ │ land ↓                       │   "unmoved for 51
│              for 51 years"   │ │                              │ │            ├── 38 years ──▶│ │   years"; dotted
│ ships         ┌─┐            │ │ ships         ┌─┐┌──────     │ │ ships     ●───┐┌────────┬──┐ │   = no saves for
│ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁┘ └            │ │ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁┘ └┘           │ │ ▁▁▁▁▁▁▁▁▁▁┘   └┘        └──┘ │   15 years
│ 1340   1380   1400   1440    │ │                              │ │ 1340   1380   1400   1440    │
└──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
   the line is revealed up to the step's date by a clip; annotations come and go by step
```

---

## 4. The share card (4:5, rendered to PNG at build time)

```
┌────────────────────────────────┐ ← accent bar (the chapter's colour)
│ SIX NUMBERS OF AL-ANDALUS · 1  │
│                                │
│ 42%                            │ ← 96px
│ of the old lands' people died  │
│ in the Pestilence; the cities  │
│ lost 45%, the burghers 60%.    │
│                                │
│ ●●●●●●●●●●●●●●●●●●●●●●●●●      │ ← thumbnail: the chapter's
│ ●●●●··················         │   final step, small
│                                │
│ 747 AH (1346) – 751 AH (1350)  │ ← calendar order follows the
│ (● read) same lands, two saves │   reader's toggle at the time
│ …/six-numbers/42-percent       │   (the build makes one card
└────────────────────────────────┘   per calendar)
```

---

## 5. The desk: the story finder's proposals as the writer sees them

This is a page built with the site but not linked from it. In practice the same list is walked through in the session, and the decisions go into `stories/desk.yaml`.

### Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ THE DESK · save of 1 Ṣafar 846 (11 Jun 1442) · 5 new · 1 moved · 0 broken            │
│ [New] [Moved under a chapter] [Snoozed] [Dismissed]              threshold: 20 ▾     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ 113.9  PLATEAU BROKEN   land_vs_naval        ● read                                  │
│        frozen 51 years at −36.6, then +62.9                                          │
│        ▁▁▂▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▅█        1378-04-06 … 1429-07-02 → 1442-06-11     │ ← sparkline with the
│        suggested graphic: flat line, then a needle                                   │   evidence window
│        [Accept → new chapter] [Edit] [Merge into…] [Snooze] [Dismiss…]               │   highlighted
├──────────────────────────────────────────────────────────────────────────────────────┤
│  48    ESTATES BREAK RANKS   satisfaction @ 1442-06-11     ● read                    │
│        3 estates off their held levels at once                                       │
│        burghers  50 ─────────────────────▶ 74                                        │ ← the held level is
│        commoners 50 ◀──────── 34                                                     │   drawn as a band;
│        umarāʾ    40 ◀─── 32         (held levels learned: 50, 50, 40)                │   only the departure
│        nearby events: Jamāʿa of 846 (1 Jun 1442), Shipwright Contracts               │   is ink
│        [Accept] [Edit] [Merge] [Snooze] [Dismiss…]                                   │ ← the desk pulls the
├──────────────────────────────────────────────────────────────────────────────────────┤   events within ±1
│  44.7  DROP   people   −45% (same towns)    ● read   ⚠ window ends on a transient    │   save to help the
│        1339-05-24 495,359 → 1353-02-02 274,147                                       │   writer
│        ⚠ 1353-02-02 holds only 18 towns (Sevillan revolt); compare same lands        │ ← guard warnings are
│        ✓ ACCEPTED, EDITED → "42%" (−41.9%, event 1350-09-02)                         │   shown, not hidden
├──────────────────────────────────────────────────────────────────────────────────────┤
│  35.6  DROP   burgher_power   fell 6.9    ◌≈ estimated                               │
│        1346-11-08 12.0 → 1349-06-04 5.1                                              │ ← an estimated series
│        cannot be a headline without [Override ≈]                                     │   needs an explicit
│        [Accept] [Edit] [Snooze] [Dismiss…]                                           │   override
├──────────────────────────────────────────────────────────────────────────────────────┤
│ MOVED UNDER A PUBLISHED CHAPTER                                                      │
│  (example) "98→23→60" (sunni_share): at a later save 64% → footnote "60% when written"│ ← no action needed;
│                                                                                      │   shown for awareness
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Dismiss…** asks for a reason from a short list ("war-time noise", "already told", "not interesting", or free text). A reason given twice for the same detector and series becomes a damping rule in the campaign config.

### Phone (the same desk, one proposal per screen)

```
┌──────────────────────────────────┐
│ THE DESK · 11 Jun 1442 · 5 new   │
├──────────────────────────────────┤
│ 113.9 · PLATEAU BROKEN           │
│ land_vs_naval  ● read            │
│                                  │
│ frozen 51 years, then +62.9      │
│ ▁▁▂▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▅█          │
│ 1378 … 1429 → 1442               │
│                                  │
│ [ Accept ]  [ Edit ]             │
│ [ Merge ]   [ Snooze ]           │
│ [ Dismiss… ]                     │
│                         1 / 5  ▶ │ ← swipe or tap through
└──────────────────────────────────┘
```

---

## 6. The print strip (the same step specs, rendered as stills)

```
┌───────────┬───────────┬───────────┬───────────┬───────────┐
│ 489,600   │ 41% urban │ 3 hosp.   │ −9,055    │ −42%      │ ← each step's state as a
│ ●●●●●●●●  │ ●●●●●●●●  │ ●●●●●●+●  │ ●●●●●●●·  │ ●●●●····  │   small multiple; captions
│ ●●●●●●●●  │ ●●●●●●●●  │ ●●●●●●●●  │ ●●●●●●●●  │ ●●······  │   are the cards' first
│ Aug 1346  │ cities vs │ Oct 1346  │ Nov 1348  │ Sep 1350  │   sentence
│           │ Qashtāla  │           │           │           │
└───────────┴───────────┴───────────┴───────────┴───────────┘
  the same stills serve the no-JavaScript version and the share-card thumbnails
```
