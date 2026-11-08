# Designer A, round one

Angle: the reader as a participant.

## Idea 1: The Dīwān Sits

**Question:** *Would you have counselled as the house of Naṣr chose?*

**Sees and does:** the reader takes a seat in the dīwān. Petitions arrive as cards in date order, dated in Hijri and Western form: Amazigh volunteers at the gate (1339), adulterated medicines in the plague markets (1348), Mali asking to buy fire-tubes (1391), a silver seam to announce or hush up (1402), the Jamāʿa of 1379 choosing between Qurṭuba and Ishbīliya. The reader picks an option. The card turns over to show what the throne chose, its recorded effects, and the next checkpoint's numbers. It never invents what happened on the untaken road. Where the record holds the alternative's terms, it says "this is what the other road promised; no one walked it." At the end a ledger says "your counsel was heeded 9 times in 23".

**Data:** about 40 events already carry `choice`, `rejected`, `alternatives`, `options` or `ifPassed/ifFailed`, often in the game's own words. Checkpoints supply the consequences. **Missing:** many records keep only the chosen option. A `decision {prompt, options[], chosen}` field, filled in at play time, would fix this.

**Carries over:** the pattern "recorded decision becomes a docket card" fits any EU5 campaign, since every game event has options. What belongs to this campaign: the dīwān framing, the voice, the Jamāʿa.

**Effort:** medium. **Risk:** the decisions are uneven, and many are flavour worth only a few ducats. Scoring could also cheapen the chronicle's dignity.

## Idea 2: Whose Golden Century? (The Six Benches)

**Question:** *What did this century look like from where I sat?*

**Sees and does:** the reader chooses a bench in the Jamāʿa: the umarāʾ, the ʿulamāʾ, a burgher of Ishbīliya, a commoner, a dhimmī (a Jew of al-Mariyya or a Catholic of Ṭulayṭula), or the crown. The history re-renders on one phone-friendly scroll:
- the bench's fortune line across 72 checkpoints, with estimated values marked;
- events re-ranked by what touched that bench: privileges given or taken, the Maid Draft, the usury ruling, each Jamāʿa;
- "your people" counted by religion and culture.

"Change seats" keeps your place in time. Every seat ends on 7 August 1442, with the burghers at 74 and the umarāʾ at 32. From about 1365 to the 1420s, **Catholics outnumbered Muslims**: the realm was Christian-majority under a Muslim court. You see this only from the dhimmī bench. A printable version would be six pamphlets.

**Data:** checkpoint estates, 42 `estate_change` events, privileges by estate (the `:estate` keys in realm-names) across 70 readings, laws, and population. **Missing:** an `estates[]` tag on events, partly derivable from `estate`, `favours` and `against`.

**Carries over:** every EU5 campaign has estates, and the stakeholder lens fits CK3 vassals or Victoria 3 interest groups. What belongs to this campaign: the dhimmī bench and the voice.

**Effort:** medium to large. **Risk:** estate figures are mostly estimated, and satisfaction often sits at the default of 50, so the fortune lines may be flat. Privileges rarely change.
