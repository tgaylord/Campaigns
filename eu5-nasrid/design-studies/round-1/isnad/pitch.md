# Isnād: the chain of why

**The question it answers:** *Why did this happen?*

In hadith scholarship an *isnād* is the chain of transmission behind a report: "A told us, from B, from C". Each link is judged for how far it can be trusted. This page borrows the form for causes. A reader picks something that happened in al-Andalus, and the page lays out the chain behind it, newest at the top and oldest at the bottom. Every link says what kind of link it is and how we know it. The same discipline the court's scholars applied to their sources is applied here to cause and effect.

## What the reader sees and does

1. **Choose an outcome.** There are three ways in. Each book's ending ("Why did the Balance end in 1370?"), a named strand ("The crown and the umarāʾ"), or any record, found by search or tapped from elsewhere on the site. Each new save also adds a "Why now?" card for its main events.
2. **Read the chain.** The chain is one vertical thread: outcome, link, cause, link, cause, and so on. It runs to at most eight links. Each link is a labelled connector: *provoked by · game rule*, *followed on from · Trent's account*. The line itself is drawn differently for each source of the link: a double line for a game rule, a solid line for the saves, dashes for Trent's account, dots for the court's reading. The glyph and the word appear as well, so colour is never the only signal. Other causes sit under a record as "also:" chips, and tapping one makes that branch the main thread. Where the record is silent, the chain says so in a gap box (for example, "35 years pass… the record doesn't say why").
3. **Open a link.** The link's one-sentence claim; its source, explained; the evidence quoted from the record with its source; and a small chart where numbers bear on it (for example, the umarāʾ's satisfaction against the line the crown holds them at). Warnings appear where needed: *weak*, *contested by the numbers*, *not one of the game's conditions*.
4. **"What came of it."** The same links read forward from any record, as a tree that expands one step at a time. Each branch shows how many later records hang from it ("→ 11 later").
5. **Printable isnād cards.** Each chain prints as a narrow card, one link per row, ready for a binder or a PDF codex.

**Two real chains are built in the mockup.** They show what the format does when it meets real data:

- *Why was every estate but the burghers angry in June 1442?* The chain runs: the Jamāʿa of 846, ← the Primacy of Nobility revoked in 1428, ← the Jamāʿa of the mercenaries in 1414, ← the Catalan privileges' return in 1410, ← Catalonia and Aragon made ṭāʾifas in 1375, ← the War of the Upper March, ← the end of the Battle for the Strait in 1370. That is seven links. The umarāʾ's line shows the story plainly. The crown holds them near 40 with the tax rate, and they plunge to 11 in 1414, 16 in 1428 and 32 in 1442, one plunge at each step of the chain.
- *Why did the Golden Century come with a fleet?* The game's own conditions for the decision appear as a panel of requirements, every one sourced to a game rule. Alongside it runs the sea strand: the temper's swing to the sea, ← the arsenals of 1432, ← the second crusade, ← the destruction of Santiago, ← the princes' war plan of 1430.

**Both chains run back to the Battle for the Strait, and the page points this out where they meet.** This was a design lesson. The obvious headline, "the Golden Century, back to the Catalan privileges", isn't supported by the data. The Golden Century's causes are game conditions, and the Catalan privileges feed a different outcome. The link format makes that visible instead of letting a neat story paper over it.

## The link format

Links live in their own file, `data/causes.json`, not on the events. This keeps one record per link, so links can be suggested, confirmed, rejected and audited each save without rewriting `events.json`.

```jsonc
{
  "id": "a5",
  "cause":  "1375-03-16-two-new-taifas",         // an event id, a bundle id, or a derived/standing node
  "effect": "1410-09-01-catalan-privileges-return",
  "kind":   "enabled",                            // one of eight, below
  "basis":  "rule",                               // rule | save | owner | court  (how we know)
  "weight": "decisive",                           // decisive | contributing (chooses the main thread)
  "claim":  "The privileges hold only while there is peace with Aragon; once Catalonia and Aragon were ṭāʾifas, that war could not happen again.",
  "evidence": [                                   // quotations, each with the record's own source string
    {"q": "needs peace with Aragon", "ref": "1339-05-24-catalan-privileges-lost", "src": "eu5db.com (1.4.5)"},
    {"q": "now that Catalonia and Aragon are subjects, war with them is impossible (Trent)", "ref": "1410-09-01-catalan-privileges-return"}
  ],
  "gap":    "35 years pass between the ṭāʾifas and the privileges' return; the record doesn't say why.",
  "flag":   null,                                 // weak | contested | not-a-condition
  "series": {"key": "realm.landVsNaval", "from": "1426", "to": "1440"},   // optional chart
  "thread": "the-catalan-privileges",             // optional named strand
  "status": "confirmed",                          // suggested | confirmed | rejected
  "suggestedBy": ["rhythm"],                      // which heuristic raised it
  "decided": {"by": "Trent", "with": "save of 26 June 1443"}
}
```

**The eight kinds.** Each kind has a phrase for reading backward and one for reading forward:

| kind | backward (effect ← cause) | forward | example |
|---|---|---|---|
| required | needed | was needed for | al-Andalus restored → the Golden Century decision |
| enabled | made possible by | made possible | the ṭāʾifas of 1375 → the privileges' return |
| prompted | prompted by | prompted | the crusade → the arsenals ("to match the Genoese fleet") |
| provoked | provoked by | provoked | the Jamāʿa of 846 → every estate but the burghers angry |
| paid for | bought by | paid for | Land Rights given up → Majrīṭ's charter |
| shifted | tipped by | tipped | Catalan privileges → nobles' power −20% |
| continued | followed on from | led on to | the Jamāʿa of 1414 → the Primacy revoked, 1428 |
| ended | ended by | ended | war on Aragon → the privileges lost, 1339 |

**The four sources (`basis`).** This is the provenance of the *link*, not of the facts at each end, which keep their own sources:

| basis | mark | line | meaning |
|---|---|---|---|
| rule | ▲ | double | the game's own rules or texts state it: a requirement, an effect, a tooltip |
| save | ◆ | solid | the saves measure it: the timing or the numbers. They show *that*, not *why* |
| owner | ● | dashed | Trent said so in his account |
| court | ○ | dotted | the chronicle's interpretation; plausible, labelled as a reading |

Suggested links (◌) never reach readers. A link records one source: the strongest thing its claim rests on. Weaker supporting evidence still appears in its evidence list.

**Nodes that aren't events.** A link can start or end at three things besides an event:

- A *bundle*: a war folded with its battles, sieges and peace (the War of the Upper March holds 12 records), or a Jamāʿa folded with the grants and reactions of the same days.
- A *derived* node: a change found by comparing two readings that no event records. The Catalan privileges vanish between the readings of 18 October and 8 November 1346, and nothing says so.
- A *standing* node: a policy held over a span. Trent sets each estate's tax rate to hold it at a chosen satisfaction, 50 for most and about 40 for the umarāʾ. A flat 50 is therefore a cause in its own right, and **a move off the line is news**. The 1442 outcome card measures each estate against its own line (burghers +24, commoners −16, umarāʾ −8, ʿulamāʾ −6, dhimmī −5), not against zero.

## The suggester: proposals, not truth

A build step, `tools/suggest_causes.py`, runs after each save is extracted. It proposes links; Trent confirms them. I ran a rough probe of the heuristics on today's data (`_work/suggest_probe.py`):

| heuristic | what it proposes | today's yield | default source |
|---|---|---|---|
| structural | war declared → battles → peace → territory, via shared war ids | 21 wars, 328 records folded | save, **auto-confirmed** |
| explicit fields | `cause`, `why`, `reason`, `thread`, `history` in a record's data, matched to the event they name (e.g. "the 30-day pause in al-Qāhira (28 October 1385)") | 43 records | owner |
| cue words | "price of", "in exchange", "sparked by", "after the …" in titles | 27 titles | owner |
| readings diff | a law, privilege or reform appears or vanishes between two readings; ties it to the event that names it, or proposes a derived node | 26 changes; a handful (my crude matcher says up to 8) with no event | rule (when the effects are known) |
| rhythm | a reform whose effects name a condition ("needs peace with Aragon") gets its on/off spans lined up with that country's wars and peaces | 1 seed, the Catalan privileges: 4 toggles, each explained | rule |
| requirements | "requires …" or "enables the decision …" in a record, matched to the event that first met each condition | 7 records, including the Golden Century's full list | rule |
| departures | an estate moves 5 or more points off its held line (50, or 40 for the umarāʾ); finds candidate causes in the window before | 31 episodes in 105 years | save, or asks the owner |
| estate reactions | an estate change within 60 days of a law, reform or privilege that names the estate | 16 pairs | rule, if a tooltip preview exists |
| co-citation | two events cited together in one chronicle entry's `sources:` | 55 pairs from just 4 entries | court; **lowest rank** |

**Co-citation is the noisiest heuristic.** One entry alone pairs the death of Fāṭima with a war in Tlemcen. It is ranked last and is used mostly to confirm what other heuristics raise.

**The per-save routine stays small:**

1. The suggester scores each candidate. The score combines the heuristic's base strength, how many heuristics agree, how close the dates are, and whether either end already sits on a chain.
2. It shows **at most eight** candidates, highest first. The rest wait in a queue that carries over from save to save.
3. Structural links are confirmed without asking.
4. A **rejected pair is remembered** and never proposed again.
5. Departures with no candidate become a question ("The umarāʾ sat at 45–48 in 1431–32, above the 40 you hold them at. Why?"). Trent can pick a candidate or type a reason. A typed reason becomes an owner-sourced node, for example "tax rate lowered for the war".
6. Trent answers in the chat the chronicle session already runs ("1 yes, 2 yes but 'ended', 3 no"), or on the Workshop page, which exports the same decisions as JSON. Either way the session writes `causes.json` and commits it with that campaign's prefix.

**Expected cost: a few minutes a save.** That is 8 or fewer decisions, most of them a single tap. The backfill of the first 105 years is the real job. Guessing from the probe, it might be 150 to 250 links worth keeping. Done thread by thread (the crown and the umarāʾ, the Catalan privileges, the turn to the sea, the Strait, the plague), it is perhaps an evening per thread. The session drafts and Trent reviews.

## Keeping chains readable as the campaign grows

- **One thread, eight links.** A chain shows one main cause per record, chosen by `weight`, then by source, then by recency. Longer ancestry folds into "…n earlier causes: continue from here", which starts a new chain from that record. Other causes are "also:" chips that swap the branch in. The full graph is never drawn.
- **Bundling before counting.** Wars and Jamāʿas count as one link, so 194 battles never clutter a chain.
- **Conditions are a panel, not a thread.** When the game lists requirements, they appear together inside the outcome's card.
- **Named threads** are the curated way in. The data already hints at them: the 1414 record carries `thread: "the crown and the umarāʾ"`.
- **"What came of it"** opens one step at a time and shows counts rather than the whole tree. At several hundred years, the forward tree from the Strait could hold hundreds of records, so depth stays capped at three with "show more".
- **Gaps are first-class.** A link can carry a gap, and readers see what is unknown. Several hundred years in, the gaps are where the next chronicle entries could come from.

## How it's built and how it updates

All of it is static, which suits GitHub Pages:

- `causes.json` holds the links. The site's existing build reads it with `events.json`, the readings and the checkpoints. It folds bundles, computes derived and departure nodes, computes Hijri dates, checks that every cause comes before its effect and every id resolves, and writes one `chains.json` with every link and node the page needs.
- The page is plain HTML and JavaScript (no framework is needed). It walks the chains in the browser.
- For scale: the mockup carries 25 nodes and 26 links in 47 KB with full quotations. A thousand links would be about 1–2 MB, which can be split per thread if needed.
- **Each new save:** extraction, then the suggester, then up to eight suggestions for Trent, then decisions written to `causes.json`, then a rebuild. New records get "Why now?" chains, and confirmed links appear in every chain they touch.

**The mockup's data** was assembled by `_work/build_mockup_data.py` straight from the brief's files. Titles, dates and sources are verbatim, and the script asserts that every cause comes before its effect.

**Calendars.** The chronicle's Hijri dates match the Western date read as a *Julian* date, converted with the tabular Islamic calendar. That is 21 Muḥarram 846 for 1 June 1442, 9 Shaʿbān 817 for 24 October 1414, and 16 Ṣafar 834 for the Peace of Ṣafar. The mockup reproduces all of these. JavaScript's own Islamic calendars are nine days off because they read the date as Gregorian.

**An optional AI "ask why" box** could send a reader's question with the confirmed links to an AI from the browser, and answer only from those links with their sources. This is flagged as an outside call. It isn't needed for the core idea.

## What carries over

- **Any campaign:** the link schema, kinds, sources, gap and flag fields, the chain viewer, the reverse tree, the Workshop, and the structural, explicit-field, cue-word and co-citation heuristics.
- **Any EU5 campaign:** readings diffs, conditional-reform rhythms, decision requirements, and estate departures from held tax lines. The same saves give the same fields.
- **This campaign only:** the isnād framing and its Arabic labels, the chronicle names, Hijri-first dates, and the court-voice claims. For a Burgundian campaign the frame could be a "chain of title"; for the Tunis/Carthage campaign the isnād works as it is.

## Effort and risks

**Effort: medium to build, large to backfill.** The viewer and reverse view are about a week of evenings. The suggester and Workshop are another week. The backfill is ongoing.

**The biggest risk is interpretation passing as fact.** Three things guard against it: a source on every link, gaps shown openly, and flags where the numbers disagree with the story. The mockup's sea chain already contains one such flag. The court's story that moving to Ishbīliya turned the realm seaward meets a temper that sat at −37 from 1379 to 1428.

**Second risk: the backfill stalls.** The mitigation is to start with three threads and let "Why now?" chains grow forward from each new save.

**Third risk: tangled chains.** The mitigation is the hard cap and bundling.

## What the data can and can't support

- **No links between events exist yet.** Every link is new writing. The mockup's links are my draft from the record, and none is confirmed by Trent.
- **Some changes have no event.** The 1346 lapse of the Catalan privileges exists only as a difference between readings.
- **Some dates are approximate**, such as month-only records like "1402-08" and "1432-05". The order checks must tolerate this.
- **Estate power figures are estimated**, so a "shifted" link measured on power must say so. Satisfaction is read from the saves, and departures from the held lines are reliable news.
- **Some links are claims about motive**, such as "the Emperor loved the sea". These can only ever rest on Trent's account or the court's reading. The format says so instead of hiding it.
