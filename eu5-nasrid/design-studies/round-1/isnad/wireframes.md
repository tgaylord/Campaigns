# Isnād: wireframes

**Key to the link lines** (the same on every screen):

| line | mark | basis |
|---|---|---|
| `‖` | ▲ | game rule |
| `│` | ◆ | the saves |
| `┆` | ● | Trent's account |
| `⋮` | ○ | the court's reading |
| `◌` | | suggested (never shown to readers) |

The arrows point upward, from cause to effect. A chain reads from top to bottom, newest to oldest, the way an isnād runs from the latest teller back to its source. Every screen has a **Names** toggle (Chronicle / Plain) and a **Dates** toggle (Hijri first / Western first) in its header.

Records, dates and quotations on these screens come from the brief's data. Some figures are illustrative: the "Why now?" card titles, the Workshop's queue and rejection counts, and the confirmation dates.

---

## 1. Choosing an outcome

### Desktop (≥ 1000 px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Isnād إسناد   the chain of why · al-Andalus 1337–1443                                        │
│ [Chains] [What came of it] [Workshop*]     Names (Chronicle|Plain)   Dates (Hijri|Western)    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Ask why about…  [ search any record, person, place ……………………………………… ] ①                      │
│                                                                                              │
│  WHY NOW?  new with the save of 26 June 1443 ②                                               │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────┐ │
│  │ Why did the first Jamāʿa of  │ │ Why Fernando Po?             │ │ Why is stability 14? │ │
│  │ the new regime back the      │ │ 3 links · ▲▲●                │ │ 4 links · ◆▲○●       │ │
│  │ umarāʾ? 5 links · ▲◆●●○      │ │                              │ │                      │ │
│  └──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────┘ │
│                                                                                              │
│  THREADS ③                                  THE BOOKS' ENDINGS ④                              │
│  ▸ The crown and the umarāʾ   1402–1442     ▸ The Mending ends: Morocco declares war (1346)  │
│      8 links · ends at the Jamāʿa of 846    ▸ The Balance ends: the Strait won (1370)        │
│  ▸ The Catalan privileges     1337–1440     ▸ The Pestilence ends: the last town free (1352) │
│  ▸ The turn to the sea        1379–1442     ▸ The Marches end: the Peace of Ṣafar (1430)     │
│  ▸ The Strait                 1337–1370       …                                              │
│                                                                                              │
│  BIG QUESTIONS (curated) ⑤                                                                  │
│  “Why was every estate but the burghers angry in June 1442?”   7 links · back to 1370        │
│  “Why did the Golden Century come with a fleet?”               5 links + 5 conditions        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

① Search covers events, people and places. Picking any record opens its chain, or its forward tree if nothing is linked behind it yet.
② "Why now?" cards are built for each save's main new events, so the page grows with the campaign without anyone curating it. Each card shows its link count and its row of source marks, which tells readers at a glance how much of the chain is rule and how much is reading.
③ Named threads come from the links' `thread` field. They are curated, long-running strands.
④ One question per book: why it ended where it did.
⑤ Hand-written questions, a few per book.
`*` The Workshop tab appears only when the page is opened with `?workshop` (static; there is no login).

### Phone (390 px)

```
┌────────────────────────────────────┐
│ Isnād إسناد               ☰ names  │
│ [Chains][Came of it]               │
├────────────────────────────────────┤
│ [ Ask why about… ……………………… ]      │
│                                    │
│ WHY NOW? · 26 June 1443        →→  │
│ ┌──────────────┐┌─────────────     │  ← cards scroll sideways
│ │ Why did the  ││ Why Fernando     │
│ │ first Jamāʿa ││ Po?              │
│ │ ▲◆●●○ 5 links││ ▲▲● 3 links      │
│ └──────────────┘└─────────────     │
│                                    │
│ THREADS                            │
│ ▸ The crown and the umarāʾ         │
│ ▸ The Catalan privileges           │
│ ▸ The turn to the sea              │
│                                    │
│ BIG QUESTIONS                      │
│ ▸ Why was every estate but the     │
│   burghers angry in June 1442?     │
│ ▸ Why did the Golden Century come  │
│   with a fleet?                    │
└────────────────────────────────────┘
```

---

## 2. A chain

### Desktop: three columns (chooser · thread · link panel)

```
┌───────────────┬─────────────────────────────────────────────────────┬──────────────────────────┐
│ ◂ questions   │ Why was every estate but the burghers angry in      │  (link panel: empty      │
│               │ June 1442?                                           │   until a link is        │
│ ● Why angry   │ 7 links back to 1370 · newest at the top             │   opened; see screen 3)  │
│   in 1442?    │                                                      │                          │
│ ○ Golden      │ ┌─ OUTCOME · a reading ── 1 Ṣafar 846 · 11 June 1442─┐                          │
│   Century…    │ │ Every estate but the burghers pushed off its line  │ ①                        │
│ ○ What came   │ │ umarāʾ     ▓▓|            32  −8   (line 40)       │                          │
│   of the      │ │ ʿulamāʾ      ▓|           44  −6   (line 50)       │                          │
│   Strait?     │ │ burghers      |▓▓▓▓▓▓     74 +24                   │                          │
│               │ │ commoners  ▓▓▓|           34 −16                   │                          │
│ HOW SURE?     │ │ dhimmī        ▓|          45  −5                   │                          │
│ ‖ ▲ game rule │ │ ▸ the record   also: ▲ provoked by Land Rights 1438│ ②                        │
│ │ ◆ saves     │ └────────────────────────────────────────────────────┘                          │
│ ┆ ● Trent     │   ‖                                                  │                          │
│ ⋮ ○ court     │   ‖ ( ▲ provoked by · game rule )  ③                 │                          │
│               │   ‖                                                  │                          │
│ KINDS         │ ┌─ KNOT · 2 records ── 21 Muḥarram 846 · 1 June 1442─┐                          │
│ required      │ │ The Jamāʿa of 846 seats the burghers as equals     │                          │
│ enabled …     │ │ ▸ 2 records   also: ○ made possible by The burghers│                          │
│               │ │               given the coinage… (1402)  [weak]    │                          │
│               │ └────────────────────────────────────────────────────┘                          │
│               │   ⋮ ( ○ made possible by · the court's reading )     │                          │
│               │ ┌─ KNOT ── 10 Shaʿbān 831 · 25 May 1428 ─────────────┐                          │
│               │ │ The Primacy of Nobility revoked                    │                          │
│               │ └────────────────────────────────────────────────────┘                          │
│               │   ┆ ( ● followed on from · Trent's account )         │                          │
│               │ ┌─ KNOT ── 9 Shaʿbān 817 · 24 October 1414 ──────────┐                          │
│               │ │ The Jamāʿa of the mercenaries; the umarāʾ curtailed│                          │
│               │ │ also: ● prompted by The court resolves… (1402)     │                          │
│               │ └────────────────────────────────────────────────────┘                          │
│               │   ‖ ( ▲ tipped by · game rule )                       │                          │
│               │ ┌─ REFORM ── 1 Jumādā al-Ūlā 813 · 1 September 1410 ─┐                          │
│               │ │ The Catalan privileges return, for good            │                          │
│               │ └────────────────────────────────────────────────────┘                          │
│               │   ‖ ( ▲ made possible by · game rule )                │                          │
│               │ ╔═ GAP ══════════════════════════════════════════════╗ ④                        │
│               │ ║ 35 years between the ṭāʾifas and the privileges'   ║                          │
│               │ ║ return. The record doesn't say why.                ║                          │
│               │ ╚════════════════════════════════════════════════════╝                          │
│               │   ‖                                                  │                          │
│               │ ┌─ KNOT ── 15 March 1375 ── Catalonia and Aragon ────┐                          │
│               │ │ made ṭāʾifas                                       │                          │
│               │ └────────────────────────────────────────────────────┘                          │
│               │   │ ( ◆ made possible by · the saves )                │                          │
│               │ ┌─ WAR · 12 records folded ── 1373–1375 ─────────────┐ ⑤                        │
│               │ │ The War of the Upper March   ▸ 5 battles, peace    │                          │
│               │ └────────────────────────────────────────────────────┘                          │
│               │   ‖ ( ▲ made possible by · game rule )                │                          │
│               │ ┌─ SITUATION ── 21 Ṣafar 772 · 14 September 1370 ────┐                          │
│               │ │ The Battle for the Strait ends: Granada stands free│                          │
│               │ │ ★ the Golden Century chain runs through here too   │ ⑥                        │
│               │ └────────────────────────────────────────────────────┘                          │
│               │  [ …n earlier causes: continue from here ]  ⑦        │                          │
└───────────────┴─────────────────────────────────────────────────────┴──────────────────────────┘
```

① The outcome card for a *reading*. Each estate is measured against the line the crown holds it at with its tax rate (50 for most, 40 for the umarāʾ). It is not measured against zero. A flat line is policy; a bar is news.
② "also:" chips are the other causes. Tapping one makes it the main branch, and the thread below re-flows from that point.
③ The connector pill. Its line style, glyph and word all name the source. Tapping the pill opens the link (screen 3).
④ A gap box appears wherever a link records that the record is silent.
⑤ Bundles count as one link. A war folds its battles, sieges and peace. A Jamāʿa folds the grants and reactions of the same days.
⑥ Where two chains meet, the page says so.
⑦ This appears only past eight links. It starts a new chain from the oldest record shown.

### Phone

```
┌────────────────────────────────────┐
│ ◂  Why was every estate but the    │
│    burghers angry in June 1442?    │
│    7 links · back to 1370          │
├────────────────────────────────────┤
│ ┌ OUTCOME · 11 June 1442 ────────┐ │
│ │ Every estate but the burghers  │ │
│ │ pushed off its line            │ │
│ │ umarāʾ    ▓|        32  −8     │ │
│ │ burghers   |▓▓▓▓    74 +24     │ │
│ │ … 3 more                       │ │
│ │ also: ▲ Land Rights (1438)     │ │
│ └────────────────────────────────┘ │
│  ‖                                 │
│  ‖ (▲ provoked by · game rule)     │
│ ┌ 1 June 1442 ───────────────────┐ │
│ │ The Jamāʿa of 846 seats the    │ │
│ │ burghers as equals             │ │
│ │ ▸ 2 records                    │ │
│ └────────────────────────────────┘ │
│  ⋮                                 │
│  ⋮ (○ made possible by · court)    │
│ ┌ 25 May 1428 ───────────────────┐ │
│ │ The Primacy of Nobility revoked│ │
│ └────────────────────────────────┘ │
│  ┆ (● followed on from · Trent)    │
│        …                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ‖▲ rule  │◆ saves  ┆● Trent  ⋮○ court│ ← legend pinned to the bottom
└────────────────────────────────────┘
```

On a phone the Hijri date is shown alone in each card, and tapping it shows the Western date. The legend stays pinned at the bottom of the screen.

---

## 3. A link opened

### Desktop: the right-hand panel

```
┌──────────────────────────────────────────┐
│ ENABLED · 1375 → 1410                    │
│ Catalonia and Aragon made ṭāʾifas        │
│   made possible                          │
│ The Catalan privileges return, for good  │
│                                          │
│ “The privileges hold only while there is │ ① the claim, one sentence
│  peace with Aragon. Once Catalonia and   │
│  Aragon were the Emperor's own ṭāʾifas,  │
│  that war could not happen again.”       │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ▲ Basis: game rule. The game's own   │ │ ② the source, in words
│ │   rules or texts state this.         │ │
│ └──────────────────────────────────────┘ │
│ EVIDENCE                                 │
│ ▌“needs peace with Aragon”               │ ③ quoted from the record,
│ ▌ eu5db.com (1.4.5), on the 1339 record  │   with its own source
│ ▌“now that Catalonia and Aragon are      │
│ ▌ subjects, war with them is impossible” │
│ ▌ saves of 1410–1411; Trent's account    │
│                                          │
│ THE RHYTHM (found by the suggester)      │ ④ only on links it raised
│ ▕█▏░▕████▏░░░░░░░░░░░░░░░░░▕██████████▏   │
│ 1337 ↑war    ↑war     1375       1410    │
│ 1 ▲ 24 May 1339  war declared; lost      │
│ 2 ▲ 11 Aug 1340  peace; back in 1342     │
│ 3 ◇ 18 Oct 1346  war; gone by 8 Nov      │
│                  (derived: no event)     │
│ 4 ▲ 16 Mar 1375  Aragon a ṭāʾifa         │
│ 5 ◆ 1 Sep 1410   back for good           │
│                                          │
│ ╔ GAP ═══════════════════════════════╗   │
│ ║ 35 years; the record doesn't say   ║   │
│ ║ why.                               ║   │
│ ╚════════════════════════════════════╝   │
│                                          │
│ ─────────────────────────────────────    │
│ Confirmed by Trent · save of 26 Jun 1443 │ ⑤ status and audit trail
│ suggested by: rhythm                     │
│ [ what came of this ▸ ]   [ print card ] │
└──────────────────────────────────────────┘
```

① The claim is written in the court's voice but stays plain. It never says more than its source allows.
② The source is explained every time, in words. For example: "Measured in the saves: they show that it happened, not why."
③ Evidence is quoted verbatim, with each record's own source string.
④ A chart appears where numbers bear on the link, such as the umarāʾ's satisfaction against its held line of 40, or the realm's temper from land to sea.
⑤ The flags (*weak*, *contested by the numbers*, *not one of the game's conditions*) appear in this panel as tinted notes.

**An example of a flag** (the sea strand, 1379 → 1438):

```
│ ● Trent's account  [contested]           │
│ ┌──────────────────────────────────────┐ │
│ │ The numbers disagree: the temper sat │ │
│ │ at −37.0 in 1379 and −36.9 in 1428.  │ │
│ │  ─────────────────────────╱ +1 1438  │ │
│ │ ·····held·············╱·············· │ │
│ │ −37 ━━━━━━━━━━━━━━━━━━┛               │ │
│ │ 1379               1428  1438        │ │
│ └──────────────────────────────────────┘ │
```

### Phone: the link opens inline, beneath its pill

```
│  ‖ (▲ made possible by · game rule) ▾ │
│ ┌──────────────────────────────────┐ │
│ │ “The privileges hold only while  │ │
│ │  there is peace with Aragon…”    │ │
│ │ ▲ game rule: the game's own …    │ │
│ │ EVIDENCE (2) ▸                   │ │  ← collapsed by default
│ │ RHYTHM ▕█▏░▕███▏░░░░░░▕█████▏     │ │
│ │ GAP · 35 years, reason unknown   │ │
│ │ confirmed · save of 26 Jun 1443  │ │
│ └──────────────────────────────────┘ │
│ ┌ 15 March 1375 ─────────────────┐   │
```

---

## 4. "What came of it" (the reverse view)

### Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ What came of it: The Battle for the Strait ends (14 September 1370)    [ change record ▾] │
│ 13 later records over 72 years · through confirmed links                                  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ The Battle for the Strait ends: Granada stands free                                       │
│ ├─ ▲ made possible ─ Mursiyya absorbed into the crown (1370)                               │
│ ├─ ▲ made possible ─ The War of the Upper March (1373–75)                    → 11 later ① │
│ │   └─ ◆ made possible ─ Catalonia and Aragon made ṭāʾifas (1375)            → 10 later   │
│ │       ├─ ● made possible ─ Catalan shipwrights sent to the Mamlūk ports (1376)           │
│ │       ├─ ● made possible ─ The court moves to Ishbīliya (1379)              → 2 later    │
│ │       │      [ show 2 more ▸ ]  ②                                                        │
│ │       ├─ ▲ made possible ─ The Catalan privileges return (1410)             → 4 later    │
│ │       │      [ show 4 more ▸ ]   ── the “angry in 1442” chain ③                          │
│ │       └─ ◆ led on to ───── Catalonia annexed to the crown (1436)            → 2 later    │
│ └─ ▲ made possible ─ The Golden Century proclaimed (1442)  ── the “fleet” chain            │
│                                                                                            │
│ ┌ MINI TIMELINE ④ ───────────────────────────────────────────────────────────────────────┐ │
│ │ 1370 ●──●─────●─●──●─────────────────────────●───────────●──────●─●──────●● 1442        │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

① Descendant counts, so readers can tell which branch is heavy before opening it.
② The tree opens three levels deep, then one step at a time.
③ The tree points out where a branch is part of a named chain or thread.
④ The same descendants on a strip, to show how far forward the ripple runs. Tapping a dot opens that record's chain.

### Phone

```
┌────────────────────────────────────┐
│ ◂ What came of it                  │
│   The Battle for the Strait ends   │
│   1370 · 13 later over 72 years    │
├────────────────────────────────────┤
│ ▲ made possible                    │
│   Mursiyya absorbed (1370)         │
│ ▲ made possible                    │
│   War of the Upper March  → 11  ▸  │
│ ▲ made possible                    │
│   The Golden Century (1442)        │
└────────────────────────────────────┘
   tap ▸ drills in one level:
┌────────────────────────────────────┐
│ ◂ The War of the Upper March       │
│ ◆ made possible                    │
│   Catalonia and Aragon made        │
│   ṭāʾifas (1375)           → 10 ▸  │
└────────────────────────────────────┘
```

On a phone the tree becomes drill-down lists, one level at a time, with a breadcrumb back.

---

## 5. Confirming a suggestion (owner only, `?workshop`)

### Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Workshop · save of 26 June 1443                                                           │
│ 8 shown of 23 queued (cap 8) · 6 structural links auto-confirmed · 41 pairs rejected      │
│ ① before (never asked again)                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ readings diff + rhythm                                               rank ▓▓▓▓▓▓▓▓▓░ 0.92 │
│ NEW DERIVED EVENT: “The Catalan Merchant Privileges lapse” (between 18 Oct and 8 Nov 1346)│
│ ┌ CAUSE · 18 Oct 1346 ───────────────────┐    ┌ EFFECT · 8 Nov 1346 ───────────────────┐ │
│ │ Granada answers Morocco's call and goes│ →  │ Catalan Merchant Privileges no longer  │ │
│ │ to war with Castile, Portugal and      │    │ among the reforms (reading of 8 Nov)   │ │
│ │ Aragon…   src: checkpoint 1346-11-08   │    │ src: realm-readings diff               │ │
│ └────────────────────────────────────────┘    └────────────────────────────────────────┘ │
│ why: the reform's effects say it “needs peace with Aragon”; Aragon is on the other side.  │
│ kind [ended ▾]  basis [▲ game rule ▾]  claim [ ……prefilled, editable…… ]  ②               │
│                                        [✓ Confirm]  [✕ Reject]  [… Later]                 │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ departure from a held line · no cause yet                            rank ▓▓▓▓▓▓▓░░░ 0.70 │
│ “The umarāʾ sat at 45–48 from October 1431 to July 1432, above the 40 you hold them at.   │
│  Why?” ③                                                                                  │
│ ( ) The second crusade proclaimed (1 Oct 1431)                                            │
│ ( ) Iberia conquered (3 Nov 1430)                                                         │
│ ( ) something else: [ tax rate lowered for the war ……………… ]  → a new ● standing node      │
│                                        [✓ Confirm]  [✕ Reject]  [… Later]                 │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ co-cited in “Of the Princes' Mending”                                 rank ▓▓▓▓░░░░░░ 0.44 │
│ The Radiant City restored (1440)  →  The Golden Century (1442)   proposed: ○ court        │
│ why: cited together; “the new age had been given both its symbols at once”. A reading.    │
│                                        [✓ Confirm]  [✕ Reject]  [… Later]                 │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ DECISIONS → causes.json   [ copy for the chat ]  [ download ]  ④                          │
│ { "confirmed": [ {cause, effect, kind:"ended", basis:"rule", confirmedWith:"…1443"} ],     │
│   "rejected":  [ {cause, effect} ], "later": [ … ] }                                      │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

① The page states the size of the job up front. At most eight suggestions are shown. Structural links aren't asked about. Rejections are remembered.
② Kind, basis and claim are prefilled by the heuristic and can be edited. Confirming with a different kind is one change in a dropdown.
③ A departure with no candidate cause becomes a question. A free-text answer creates an owner-sourced *standing* node, for example "tax rate lowered for the war".
④ The page is static and cannot write files. Decisions go out as JSON, either pasted into the chronicle session's chat or downloaded and committed. The same decisions can be given in chat with no page at all: "1 yes, 2 the crusade, 3 no".

### Phone

```
┌────────────────────────────────────┐
│ Workshop · 26 Jun 1443   3 of 8    │
├────────────────────────────────────┤
│ departure · no cause yet     0.70  │
│ The umarāʾ sat at 45–48 in         │
│ 1431–32, above the 40 you hold     │
│ them at. Why?                      │
│ ( ) The second crusade (Oct 1431)  │
│ ( ) Iberia conquered (Nov 1430)    │
│ ( ) other: [………………………]           │
│ kind [shifted▾] basis [●Trent ▾]   │
│ [ ✓ ]      [ ✕ ]      [ later ]    │
│        ◂ swipe for the next ▸      │
└────────────────────────────────────┘
```

On a phone the suggestions are one card at a time, so a save's review fits on the couch.

---

## 6. Printable isnād card (A6, one chain)

```
┌──────────────────────────────┐
│ إسناد  Why was every estate   │
│ but the burghers angry,      │
│ June 1442?                   │
│──────────────────────────────│
│ 846 Every estate off its line│
│  ‖▲ provoked by              │
│ 846 The Jamāʿa of 846        │
│  ⋮○ made possible by         │
│ 831 The Primacy revoked      │
│  ┆● followed on from         │
│ 817 The Jamāʿa of the        │
│     mercenaries              │
│  ‖▲ tipped by                │
│ 813 The Catalan privileges   │
│  ‖▲ made possible by  ⟨gap⟩  │
│ 776 Catalonia & Aragon       │
│     made ṭāʾifas             │
│  │◆ made possible by         │
│ 773 War of the Upper March   │
│  ‖▲ made possible by         │
│ 772 The Strait won           │
│──────────────────────────────│
│ ▲ rule ◆ saves ● Trent       │
│ ○ court · links confirmed    │
│ to the save of 26 Jun 1443   │
└──────────────────────────────┘
```

The card is generated from the same data, with one page per chain and print CSS only. A set of these could be gathered into the PDF codex.
