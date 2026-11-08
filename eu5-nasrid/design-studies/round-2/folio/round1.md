# Designer C, round one: the text and its apparatus

Both ideas start from how editions have always handled a text that needs explaining. They keep the chronicle's voice untouched in the centre and put everything else around it in its own register. Idea 1 is the apparatus **of the moment**: what the record says about this page. Idea 2 is the apparatus **across time**: what the rest of the book says about this page.

---

## 1. The Glossed Folio

**Answers:** 2 (narrative and reference) and 3 (one entry).

**What the reader sees.** Each entry is set out as a folio: the text column in the middle with numbered paragraphs, and glosses beside the line where they apply, the way a critical edition or a Glossa Ordinaria page works.
- **Inner margin, the names.** Each person is glossed *as of this page*: age, office, kin. The gloss is spoiler-safe, so no future deaths appear. Each place gets its plain name the first time it appears ("Uryūla: Orihuela"). The margin does the translating, so the prose can stay in the court's voice. The names switch remains for readers who want it.
- **Outer margin, the record.** The events the entry draws on, with their figures (Uryūla: 24,342 against 11,217, losses 4,502 and 6,025). Each carries a provenance mark: read from a save, estimated, or Trent's account.
- **Running head, the realm.** Taken from the nearest checkpoint: ruler, regnal year, towns, souls, treasury. It is honest about silence: "last reckoned Dec 1379 · next Mar 1394".
- **Foot of the page.** Trent's out-of-character note on what is invented, written in a visibly different hand, then the verse.

On a phone, the margins fold into small marks in the text. Tapping one opens the gloss *inline under the paragraph*, not in a modal, so the reader never loses their place. A density control runs from bare text to names only to the full apparatus. Its default favours the friend reading the book.

**Material.** Everything except two things. First, the links from claims to sentences: the front matter keys sources only to the whole entry. Anchors can be inferred by converting the Hijri dates in the prose to Western dates and matching them to events (the fifth of Jumādā al-Ūlā 740 gives the Uryūla battle). Anything left unmatched sits at the foot as "drawn on". Second, the player's notes, which exist but aren't in this folder.

**Reuse.** The layout carries over to any campaign. The calendar parser and the provenance marks are set per campaign.

**Effort and risk.** Medium. The risk is crowding: an entry like Porto has 16 sources and 9 people. A second risk is a wrong anchor attributing a claim to the wrong source, which would be fatal for a provenance feature. So when in doubt, don't anchor.

---

## 2. Later Hands

**Answers:** 4 (the returning reader) and 2, with a partial answer to 1.

**What the reader sees.** Manuscripts collected scholia, and the Talmud page collected commentators centuries apart. This chronicle already comments on itself. The second survey opens by finding the first one in the treasury and laughing at its last section. Every reign closes with "Consider what he left." Later entries cite events from earlier ones: there are 84 such links already.

On a second reading, each entry's margin shows **later hands**: the passage from a later entry that recalls this one, dated by the year it was written.
- *Recalled 1420:* "He read it and laughed at the last section…"
- *Faraj, next seen 1355:* gone south to Ghāna.

**Earlier hands** work the other way and are always on: when the second survey mentions the first, the margin quotes it.

Friends reading for the first time see only earlier hands, so they get the memory without the spoilers. Trent sees both.

**For the returning reader and the writer.** After each session the new entry leaves fresh ink in old margins, and the "what's new" view lists it: "new hands in 7 earlier entries." A **loose threads** view lists people and matters whose last gloss is long ago, such as the Pórtico de la Gloria waiting in its storeroom since 1430. That is the continuity checklist before writing, and it can be handed to the AI collaborator. Following one hand from gloss to gloss gives a reading path by thread.

This differs from round one's cause explorer. It traces *what the book remembers*, quoted in its own words, not chains of why in the data.

**Material.** The source overlaps, `people` and `places`, and the reign formulas. What's missing is an optional `recalls:` line in the front matter for the best echoes, and a rule for picking which sentence to quote (for example, the one naming the shared person).

**Reuse.** Wholly generic, because it runs on the link graph.

**Effort and risk.** Medium-low for the graph, higher for quoting well. The risk is noise: the reigning Emperor appears in most entries, so only rare shared mentions, shared sources and tagged recalls should earn a gloss.
