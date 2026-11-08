# The Dīwān Sits

*Designer A, round two. The reader takes a seat in the dīwān and gives counsel on the decisions the house of Naṣr actually faced.*

**The one question:** *Would you have counselled as the throne chose?*

## What the reader sees and does

The history is laid out as a **docket**: one sheaf of petitions for each reign (Yūsuf I, Saʿd, Ismāʿīl, Muḥammad V), in date order. Each card is dated the way the chronicle dates things (*7 Shaʿbān 772 · 24 February 1371*) and names who sat on the throne that day, including regents. Faraj decided the precious-metals policy of 1351 while the amir was on the Ḥajj, and the crown prince Ismāʿīl sold fire-tubes to Mali in 1391 while his father was on the road to Makka.

A card shows the matter, in the game's own words wherever those were captured, and the options as they were worded. The reader does two things:

1. **Gives counsel.** They choose an option.
2. **Lays a weight on the scales (optional).** They pick the one consideration they weighed most: *Bayt al-Māl* (the treasury), *al-Dīn* (the faith), *the peace of the realm*, or *the name of the house*. This is the reader saying why. It is never graded.

Then the card **turns**. The back shows:
- **The throne's word**: what was chosen, by whom, and the recorded terms.
- **The other road**: the terms recorded for the options not taken, if any were recorded. Otherwise the card says plainly: "*The record keeps no terms for this road. No one walked it.*" Nothing is invented.
- **At the next reading of the realm**: the checkpoint after the decision, compared with the one before it. It shows three or four figures, chosen because the decision's own terms name them, each tagged by provenance (*read from the save* or *estimated*). Estate satisfaction is read as **policy**. Trent sets each estate's tax rate to hold it at a chosen level: most at 50, the umarāʾ nearer 40. A satisfaction that stays at its held level is marked *held* and drawn quietly. A move off it is news and is highlighted: the commoners falling from 50 to 42 after the Maid Draft, or the umarāʾ at 32 against the burghers at 74 after the Jamāʿa of 846. A fixed line goes with them: *"What followed is not the same as what it caused."* The panel also counts the other entries in the record between the decision and the reading, so the reader can see how much else happened in that gap. The cards never draw cause-and-effect chains; that is another designer's idea.
- **Why the throne chose it**, only when Trent recorded a reason at the time, and labelled as his.

The reader's counsel goes into **the Register of Counsel**. When a reign's docket is finished, the register is shown as a court document:

> *In six matters put before the dīwān you counselled with the throne four times, and twice your dissent was entered in the margin: on the silver of 752, and on the naft of 824. The weight you laid most often on the scales was the faith.*

It closes with *"and consult them in the matter; and when you have decided, rely upon Allāh"* (3:159). The writer should check the rendering or replace it with one of his own choosing.

## The scoring problem, and how this framing answers it

A score turns a court history into a quiz with a right answer, the throne's. Here, agreement is never "correct":
- Agreement and dissent are recorded the way a chancery records them: a seal for counsel *with* the throne, a marginal note for dissent. Both look equally formal.
- No percentages, stars or ranks. The register is written in sentences.
- The scales give the reader a self-portrait, not a grade. Dissent is presented as honourable: courts did not speak with one voice, and the chronicle itself shows the princes mending what their father's Jamāʿa of 846 broke without asking them.
- There is no leaderboard and no comparison with other readers. A static site can't aggregate readers without a server, and it shouldn't try.

## A rule about leaking the answer

Records are uneven. Often only the chosen option has its tooltip captured. If the front of the card showed terms for one option and not the others, it would give the answer away. So:
- **Terms appear before the turn only when every option has them.** That covers the three-way metals policy of 1351, every Jamāʿa vote (pass and fail terms), and the Mamlūk call to arms (join and refuse costs).
- Otherwise the front shows only the option wording, and all terms move to the back.

Decisions where only the chosen option survives become **closed cards** ("*decided without your counsel*"). They sit in the docket so a reign's story stays continuous, but the reader can only read them.

## Card kinds

| Kind | Example | Before the turn |
|---|---|---|
| Petition (game event) | Spread of Usury, 1371; the Sephardim of al-Mariyya, 1404 | option wording |
| Jamāʿa vote or choice | Capital at Qurṭuba or Ishbīliya, 1379; tithes, 1374 | proposals, plus pass and fail terms |
| Policy | Precious metals, 1351 (three laws) | all terms |
| Call to arms | Cairo's call, 1423 | join and refuse costs |
| Closed | The Maid Draft, 1348 | none: a record only |

## Data it draws on

- **`events.json`.** About 40 records carry a decision: `choice` together with `rejected`, `alternative(s)`, `options`, `otherChoices`, `proposals`, `ifPassed`/`ifFailed` or `costs`. Twenty-one have at least two options with their wording and can be played. About 18 keep only the chosen option and become closed cards.
- **`checkpoints.json`** for the before and after readings: treasury, income, debt, stability, crown power, capital, locations, estate satisfaction (read from the save; held levels treated as policy) and estate power (estimated, and flagged). **`realm-readings.json`** for societal values. The Sephardim card's "humanist +10" shows up at the next reading as spiritualist–humanist moving from −60 to −50, which is a satisfying confirmation.
- **`people.json`** for reigns. Regents come from checkpoints and from event notes.
- **Hijri dates** come from the tabular calendar applied to the Julian date. It reproduces every Hijri date in the samples (9 Shaʿbān 817, 21 Muḥarram 846, 29 Rabīʿ al-Awwal 846).

### What the data can't support (yet)

- **Uneven distribution.** Yūsuf I's reign has one playable card (the 1351 policy) and about a dozen closed ones. Saʿd has about 15. Ismāʿīl and Muḥammad V have about three each.
- **A held estate hides the price of holding it.** The usury card records that the ʿulamāʾ lost 10% satisfaction, yet both readings show them held at 50, because the tax rate keeps them there. The card says the policy held. The cost of holding it (lighter taxes on the ʿulamāʾ) isn't in the checkpoint data, so the card doesn't claim it. Estate *power*, unlike satisfaction, is estimated, and is tagged that way.
- **Readings can be far from the decision.** For the naft card the next reading is 27 months later. The gap is printed on the card.
- **A record was cut short:** "a second effect, cut off in the screenshot."

## The data-model addition (recorded at play time)

One optional `decision` object on any event, filled in from the screenshot when Trent makes a choice that matters:

```json
"decision": {
  "kind": "petition",                // petition | assembly | policy | call_to_arms
  "prompt": "Ethiopia has offered us a sum of money ...",
  "promptSource": "game_text",       // game_text | paraphrase
  "decidedBy": "ismail-ibn-saad",    // ruler or regent; build checks reigns if absent
  "options": [
    { "id": "a", "text": "It will never backfire",
      "terms": { "gold": 419.55, "Ethiopia": "unlocks Naft Throwers" },
      "termsSource": "tooltip", "chosen": true },
    { "id": "b", "text": "They will not have our weapons!",
      "terms": null, "termsSource": null }
  ],
  "termsComplete": false,            // true only if every option's tooltip was captured
  "reason": "...",                   // optional: Trent's reason at the time, in his words
  "result": null,                    // assemblies: "passed" | "failed"
  "docket": "major"                  // major | minor | closed
}
```

The habit at play time is **one screenshot per option tooltip, not just the chosen one.** That single habit turns closed cards into playable ones and makes `termsComplete` true more often, which in turn gives the reader the same terms the court saw. An adapter converts the roughly 40 legacy records into this shape, so nothing has to be re-entered by hand.

## How it's built and how it updates

- **Build step** (runs with the existing site rebuild; Python or Node):
  1. Normalise decisions, using the adapter for legacy fields.
  2. For each decision, pick the previous and next checkpoints, and read the figures its terms name (estate, societal value, treasury), plus a default set.
     Each estate's held level comes from a small campaign config (`heldSatisfaction: { default: 50, nobles: 40 }`) that Trent edits whenever he changes a target. A satisfaction more than a couple of points off its held level is flagged as news.
  3. Attach `decidedBy`, the reign and the Hijri date, and count the events in between.
  4. Write `docket.json`, about 40 cards of roughly 1.5 KB each.
- **Page:** one static HTML page with vanilla JS. It works on a phone (one card per screen, thumb-sized options). The chronicle/plain name toggle is shared with the rest of the site (*Ishbīliya / Seville*, *ʿulamāʾ / clergy*). The reader's counsel is stored in `localStorage` as a per-reader convenience; if storage is blocked the page still works.
- **Print:** "Print my register" produces a single-page register on a parchment layout.
- **With each new save:** new decisions join the current reign's docket. If a card's next reading doesn't exist yet, it says "*The realm has not been read since this counsel*", and the next build fills it in. When the ruler changes, a new docket opens automatically. Nothing is written by hand except the `decision` capture at play time.

## Specific to this campaign, and reusable

- **Reusable:** "a recorded decision becomes a docket card" works for any EU5 campaign, since every game event has options, and for CK3 or Victoria 3 too. So do the leak-proof terms rule, the next-reading panel with provenance, closed cards, and the register.
- **Campaign-specific:** the dīwān and Jamāʿa framing, the four weights (the set is configurable per campaign: a Burgundian council might weigh *the treasury, the Church, the duke's honour, the towns*), the voice, Hijri dating and the closing verse.

## Effort and risk

- **Effort: medium.** About a day for the adapter and build step, two or three days for the page and register, and half a day to tidy the roughly 40 legacy records.
- **Biggest risk:** the docket is thin and lopsided until the play-time habit takes hold. Many matters are small: 19 ducats for burning bad medicine sits beside choosing an imperial capital. The `major`/`minor` docket flag and the closed cards help, but this idea depends on Trent capturing every option going forward.
