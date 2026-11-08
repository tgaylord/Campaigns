# Designer D, round one: systems and causes

## Idea 1: Isnād, the chain of why

**Question:** *Why did this happen?*

**What the reader sees and does.** Pick any outcome (the Golden Century, the umarāʾ's fury of 1442, the failed Hajj of 1386) and the page draws its *isnād*: the chain of transmission Islamic scholarship uses for a hadith, borrowed here as a chain of causes. One vertical thread, ideal on a phone: *the Golden Century ← the burghers seated in the Jamāʿa of 846 ← the nobles' Land Rights revoked (1438) ← the law to curtail the nobles (1414) ← the Catalan privileges made permanent once Aragon became a ṭāʾifa ← the wars of the Istirdād*, and so on back to 1339, when war with Aragon first cost Granada those privileges. Each link is labelled with its kind (*required, enabled, provoked, paid for*) and its source: the save, a game rule, or the court's own reading. Flip the thread around to see "what came of it". A printable set of chain cards could come with it.

**Data.** Events, chronicle `sources:` lists (events cited together are a first guess at links), the existing `cause` and `effects` fields, and law, privilege and reform changes worked out by comparing one reading with the next. **Missing:** explicit links between events. This needs a new `causes` field on events, which the writing session would fill in, with suggested links for Trent to confirm.

**Carries over:** the link format, the suggester and the chain viewer. **Specific to this campaign:** the isnād framing (a Burgundian campaign might use a "chain of title" instead).

**Effort:** medium to build; writing the links is ongoing. **Risk:** interpretation passing as fact, or a tangled web of links. To guard against both, show chains rather than a full graph, keep each chain to about eight links, and mark the source of every link.

## Idea 2: The Mīzān, the scales of the realm

**Question:** *What forces pulled on this realm, and which decisions moved them?*

**What the reader sees and does.** The realm drawn as balances in tension: crown against estates, land against sea, aristocracy against plutocracy, Sunni against Catholic subjects. The 13 societal values become beams that tip as the reader scrubs through 105 years, with estate power drawn as shifting weights. Laws, privileges, reforms and each Jamāʿa are pinned on the timeline. Tap one to see what moved in the 1, 5 and 10 years after it. The swings are striking: land against sea goes from −37 (1395) to +26 (1442), the economy swings from traditional toward capital, and the nobles fall from about 46 to 19 while the burghers rise from 11 to 24. A "roads not taken" layer shows the 40 or so recorded choices as forks, some naming the option refused (*"against: The sword of the Maghreb shall unite the faithful"*, 1375). An AI "what if" could be added, clearly marked as speculation.

**Data.** `realm-readings` (values, laws, privileges), `checkpoints` (estates, stability, population by faith), and the `choice` fields on events.

**Carries over:** almost all of it, since every EU5 campaign has the same values and estates. **Specific to this campaign:** the labels and voice.

**Effort:** medium. **Risk:** estate figures are estimated and satisfaction often sits at a flat 50, which is probably a placeholder value. It would also be easy to imply that a decision caused a change when other things happened at the same time. The page needs to state this caveat plainly.
