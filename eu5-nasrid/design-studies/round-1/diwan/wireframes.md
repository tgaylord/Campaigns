# The Dīwān Sits: wireframes

All figures below are real, taken from `brief/data`. In the mockup, `[Qurṭuba|Córdoba]` means a name that follows the chronicle/plain toggle.

---

## 1. The docket (desktop, at least 1024px)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ THE DĪWĀN SITS                                    names: (•) chronicle ( ) plain     │
│ Counsel on the matters put before the house of Naṣr                   [ my register ]│
├──────────────────────────────────────────────────────────────────────────────────────┤
│ REIGNS  ┌─────────────┐┌────────────────┐┌──────────────┐┌──────────────────┐        │
│         │ Yūsuf I     ││ Saʿd ibn Yūsuf ││ Ismāʿīl      ││ Muḥammad V       │        │
│         │ 733–764 AH  ││ 764–807 AH     ││ 807–832 AH   ││ 832 AH –         │        │
│         │ ●○ ▪▪▪▪▪▪   ││ ●●●○○○○…       ││ ●○○ ▪        ││ ○○○              │  (A)   │
│         └─────────────┘└──[selected]────┘└──────────────┘└──────────────────┘        │
├───────────────────────────┬──────────────────────────────────────┬───────────────────┤
│ THE DOCKET OF SAʿD        │                                      │ THE SCALES        │
│ 764–807 AH · 1363–1405    │        (the open card, see §2)       │                   │
│                           │                                      │  Bayt al-Māl  ■■  │
│ ✓ 7 Shaʿbān 772           │                                      │  al-Dīn       ■■■ │
│   The Spread of Usury     │                                      │  the peace    ■   │
│   ◆ with the throne       │                                      │  the name     ·   │
│                           │                                      │                   │
│ ▪ 2 Muḥarram 780    (C)   │                                      │  (B)              │
│   The Gem of Iberia       │                                      │                   │
│   decided without counsel │                                      │ SO FAR            │
│                           │                                      │ with the throne 3 │
│ ► 7 Muḥarram 781          │                                      │ dissent entered 1 │
│   The Jamāʿa of the       │                                      │  (words, never %) │
│   Capital        ASSEMBLY │                                      │                   │
│                           │                                      │                   │
│ ○ 23 Ramaḍān 787          │                                      │                   │
│   The City of a Thousand  │                                      │                   │
│   Minarets                │                                      │                   │
│ …                         │                                      │                   │
└───────────────────────────┴──────────────────────────────────────┴───────────────────┘
```

(A) **Reign tabs.** ● marks a counsel given, ○ one still open, ▪ a closed card. The marks show how full each docket is, not a score. Regents don't get tabs; they appear on the cards.
(B) **The scales.** These are the reader's own weights, counted. No right answer exists.
(C) **Closed cards** stay in the docket in date order so a reign reads as a story. They open read-only.

---

## 2. A card before it turns (desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│ 7 MUḤARRAM 781 · 25 APRIL 1379                       ASSEMBLY    │
│ Saʿd ibn Yūsuf, Emperor · at [Gharnāṭa|Granada]                  │
│                                                                  │
│  THE JAMĀʿA OF THE CAPITAL                                       │
│                                                                  │
│  The expansion north has left [Gharnāṭa|Granada] isolated, a     │
│  long ride from the frontier, and the court is cut off from its  │
│  slowly integrating lands. Two proposals are put to the Jamāʿa.  │
│                                         ── Trent's account (D)   │
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  │
│  │ [Qurṭuba|Córdoba]          │  │ [Ishbīliya|Seville]        │  │
│  │ the old idea: the caliphs' │  │ a capital on the river and │  │
│  │ capital, at the centre of  │  │ the sea, with a trading    │  │
│  │ al-Andalus                 │  │ fleet built by the Catalan │  │
│  │                         ◯  │  │ shipwrights             ◯  │  │
│  └────────────────────────────┘  └────────────────────────────┘  │
│   (E) both proposals recorded, so both are shown in full         │
│                                                                  │
│  WHAT DO YOU WEIGH MOST?  (optional)                             │
│  ( Bayt al-Māl ) ( al-Dīn ) ( the peace ) ( the name )           │
│                                                                  │
│                              [ Give counsel and turn the card ]  │
└──────────────────────────────────────────────────────────────────┘
```

(D) **Provenance under the prompt:** *the game's text*, *Trent's account*, or *the chronicle's summary*.
(E) **The rule against leaking the answer.** Terms appear on the front only if `termsComplete` is true, as here or for a Jamāʿa vote with pass and fail terms. On the usury card only the chosen option kept its tooltip, so the front shows the two wordings and nothing more.

---

## 3. The same card after it turns

```
┌──────────────────────────────────────────────────────────────────┐
│ 7 MUḤARRAM 781 · 25 APRIL 1379                      ASSEMBLY     │
│                                                                  │
│ YOUR COUNSEL   [Qurṭuba|Córdoba]  · weighed: the name            │
│ THE THRONE'S WORD  [Ishbīliya|Seville]                           │
│                        ┌──────────────────────────────┐          │
│                        │ ✒ Your dissent is entered in │  (F)     │
│                        │   the margin of the register │          │
│                        └──────────────────────────────┘          │
│ ── the throne's word ──────────────────────────────────────────  │
│ The assembly and the Emperor choose Ishbīliya. The move is to be │
│ complete by the end of November; new roads to Sharīsh, Mālaqa,   │
│ Baṭalyaws and Ṭulayṭula, paid for with loans from the estates.   │
│ Why: Gharnāṭa is far from the frontier and the new lands.        │
│                                     ── Trent's account           │
│ ── the other road ─────────────────────────────────────────────  │
│ Qurṭuba: "the caliphs' capital, at the centre of al-Andalus".    │
│ That is all the record keeps. No one walked it.            (G)   │
│                                                                  │
│ ── at the next reading of the realm ───────────────────────────  │
│ 21 Shaʿbān 781 · 2 Dec 1379 · "The Capital at Ishbīliya"         │
│ 7 months after the counsel                                       │
│                         before (6 Apr 1378)     after            │
│  capital                Gharnāṭa           →    Ishbīliya   save │
│  treasury               1,016              →    50          save │
│  debt                   0                  →    565         save │
│  income / month         79.9               →    101.4       save │
│                                                                  │
│  What followed is not the same as what it caused.                │
│  The record holds 1 other entry between counsel and reading. (H) │
│                                                                  │
│                            [ next matter → ]                     │
└──────────────────────────────────────────────────────────────────┘
```

(F) **Concord and dissent carry equal formality.** Concord gets a seal: "*◆ your counsel is sealed with the throne's*". Dissent gets a marginal note. Neither uses red or green.
(G) **The other road.** It shows the proposal's own words and nothing invented. With no terms at all, the card says "*The record keeps no terms for this road.*"
(H) **Context, not causes.** A count of the entries in between, linked to the timeline. This card draws no chains of cause, which belong to another designer.

Every figure carries a provenance chip: `save` (read from a save) or `est.` (estimated, shown dimmed and italic; this applies to estate *power*, which is computed). Estate satisfaction that stays at its held level carries a `held` chip; a move off it is highlighted as news.

---

## 4. The ledger: the Register of Counsel (end of a reign, or any time)

```
┌──────────────────────────────────────────────────────────────────┐
│                   THE REGISTER OF COUNSEL                        │
│          kept for a member of the dīwān · 6 matters              │
│ ──────────────────────────────────────────────────────────────── │
│  752 AH  The silver of [Qusanṭīna|Constantina]                   │
│          you: Regulated Export    throne: Unlimited Export   ✒   │
│          weighed: Bayt al-Māl                                    │
│  772 AH  The Spread of Usury                                     │
│          you: "overreacting"      throne: "overreacting"     ◆   │
│          weighed: the peace                                      │
│  781 AH  The Jamāʿa of the Capital                               │
│          you: Qurṭuba             throne: Ishbīliya          ✒   │
│  807 AH  The Sephardim of al-Mariyya          ◆                  │
│  824 AH  The Secret of the Naft               ◆                  │
│  844 AH  The Palace-City of Qurṭuba           ◆                  │
│ ──────────────────────────────────────────────────────────────── │
│  In six matters put before the dīwān you counselled with the     │
│  throne four times, and twice your dissent was entered in the    │
│  margin: on the silver of 752 and the capital of 781. The weight │
│  you laid most often on the scales was Bayt al-Māl.        (I)   │
│                                                                  │
│     and consult them in the matter; and when you have            │
│     decided, rely upon Allāh.   (3:159)                          │
│                                                                  │
│  [ print my register ]   [ begin again ]                         │
└──────────────────────────────────────────────────────────────────┘
```

(I) **The summary is generated in sentences** from the counts. No percentages, ranks or stars. If no weights were laid, that sentence is left out. Print styles produce one parchment page.

---

## 5. Phone (360–414px)

Docket list, then the card front, then the card back:

```
┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
│ THE DĪWĀN SITS   ☰  Aa │   │ ‹ Saʿd        2 of 6   │   │ ‹ Saʿd        2 of 6   │
│ ◀ Yūsuf I│Saʿd│Ismāʿ ▶ │(J)│ 7 Shaʿbān 772          │   │ THE THRONE'S WORD      │
│ ────────────────────── │   │ 24 Feb 1371 · PETITION │   │ "The ʿUlamāʾ are       │
│ THE DOCKET OF SAʿD     │   │ Saʿd ibn Yūsuf         │   │  clearly overreacting."│
│ 764–807 AH             │   │                        │   │ ◆ sealed with yours    │
│                        │   │ THE SPREAD OF USURY    │   │                        │
│ ◆ 772 Spread of Usury  │   │ Muslim merchant        │   │ terms: ʿulamāʾ −10%    │
│ ▪ 780 Gem of Iberia    │   │ families of the growing│   │ satisfaction; a second │
│ ► 781 The Capital      │   │ towns lend at interest;│   │ effect was cut off in  │
│ ○ 787 Thousand Minarets│   │ the ʿulamāʾ demand it  │   │ the screenshot         │
│ ○ 793 Guns for Mali    │   │ be stopped.            │   │ ──────────────────     │
│ …                      │   │       ─ chronicle summ.│   │ THE OTHER ROAD         │
│                        │   │ ┌────────────────────┐ │   │ "These vultures shall  │
│                        │   │ │ "The ʿUlamāʾ are   │ │   │ not steer us…" The     │
│                        │   │ │ clearly over-      │ │   │ record keeps no terms. │
│                        │   │ │ reacting."       ◯ │ │   │ ──────────────────     │
│                        │   │ └────────────────────┘ │   │ NEXT READING · 1373    │
│                        │   │ ┌────────────────────┐ │   │ 33 months later        │
│                        │   │ │ "These vultures    │ │   │ treasury  160 → 344 s  │
│                        │   │ │ shall not steer us │ │   │ stability 32.0→32.3 s  │
│                        │   │ │ away from the light│ │   │ ʿulamāʾ   50 → 50 held │
│                        │   │ │ of Allāh."       ◯ │ │   │ held at 50 by the tax  │
│                        │   │ └────────────────────┘ │   │ rate: policy.     (K)  │
│                        │   │ weigh: ⚖ (optional) ▾ │   │                        │
│ [ my register ]        │   │[  Give counsel     ]  │   │[  Next matter →     ]  │
└────────────────────────┘   └──────────────────────(L)┘   └────────────────────────┘
```

(J) **Reigns on a phone** are a horizontal chip strip that scrolls; the current reign is centred. Swiping left or right on a card moves within the reign. Crossing into the next reign shows a one-line interstitial card: "*19 Shawwāl 764: Yūsuf I dies; Saʿd, fifteen, succeeds under a regent.*"
(K) **Estate satisfaction is read as policy.** Trent sets each estate's tax rate to hold it at a chosen level: most at 50, the umarāʾ nearer 40. A flat 50 (or a flat 40 for the umarāʾ) gets the label *held* and is drawn quietly. A move off the held level is news and is highlighted, as with the commoners' fall from 50 to 42 after the Maid Draft, or the umarāʾ at 32 and the burghers at 74 after the Jamāʿa of 846. On the usury card the ʿulamāʾ are held at 50 at both readings. The reading shows the policy held, but it can't show what holding it cost.
(L) **The "Give counsel" button** is pinned to the bottom of the screen within thumb reach, and stays disabled until an option is chosen. Weights fold into a disclosure so the card stays short.

---

## 6. Moving between reigns

```
 Yūsuf I ─────── Saʿd ─────────────── Ismāʿīl ───────── Muḥammad V ──▶ (grows)
 1333–63         1363–1405             1405–29           1429–
  │ regent Faraj   │ regent Naṣr al-     │                 │
  │ (Ḥajj, 1351)   │ Istijjī (1363–64);  │                 │
  │                │ regent Ismāʿīl      │                 │
  │                │ (1385–86, 1391)     │                 │
  ▪▪▪▪●▪▪▪▪▪▪     ●●●●○○○○○○○○○▪▪     ●○○              ●○○
```

- Readers can open any reign in any order. Within a reign, cards run by date, and none is locked.
- Cards decided by a regent are marked on the card ("*decided by Faraj, regent, while the amir is on the Ḥajj*") and with a small ring on the reign strip.
- When a new save brings a ruler change, the build opens a new reign tab, and the previous tab shows its end date.
