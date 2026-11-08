# Design studies

Independent design explorations for presenting this campaign, made by designers (Claude agents) who
were deliberately not shown the existing site. Each round keeps its brief, every pitch, and the
studies developed from them. Nothing here is built into the site; the studies are for inspiration,
and a later session that adopts an idea does so in `site/` like any other change.

## Round 1 (November 2026): new forms

Brief: [`round-1/BRIEF.md`](round-1/BRIEF.md). Four designers, four starting angles (the reader as a
participant, data journalism, the chronicle as an object, systems and causes), two pitches each
(`round1.md` in each folder), one developed per designer.

| Study | Folder | What it is |
|---|---|---|
| The Dīwān Sits | [`round-1/diwan/`](round-1/diwan/) | A petitions game: give counsel on the decisions the throne faced, then see what it chose and the next reading of the realm. |
| Six Numbers | [`round-1/six-numbers/`](round-1/six-numbers/) | A scrolling long read on six numbers, with a story finder (`finder-sketch.py`) that proposes chapters at each save. |
| Dār al-Sikka | [`round-1/mint/`](round-1/mint/) | A coin cabinet: one generated dinar per save, encoding land, purse and wars; its reverse is the save's ledger. |
| Isnād | [`round-1/isnad/`](round-1/isnad/) | Chains of cause traced back from any outcome, each link marked by its source. |

Runners-up (pitched, not developed): the Six Benches (the century from each estate's seat), the
Breath of the Realm (a scrubbable map with vital signs), the Naṣrid Deck (a card deck in the Mamlūk
suits), the Mīzān (the realm as balances in tension).

**What came of it.** The studies were strong as lenses but none served the Chronicle's own job, a
court history read in order and returned to, because the brief centred the data and not the prose.
Worth keeping: the story finder as a writer's aid at each save; cause links as a small "why" margin
on entries; recording every option of a decision; a per-checkpoint emblem; the honesty conventions
(a held level drawn quietly, "what followed is not what it caused"). The round also caught the
debt carried forward from 1379, corrected in the data.

Each folder has `pitch.md`, `wireframes.md`, `mockup.html` (self-contained; open in a browser) and
screenshots.

## Round 2 (November 2026): the Chronicle itself

Brief: [`round-2/BRIEF.md`](round-2/BRIEF.md). Aimed at what the first round missed: the reading and
returning experience of the chronicle as a book. Four new designers, given all 108 entries and the five
open problems (finding your way, story and reference together, one entry, the returning reader, scale),
from four angles (the book as a made thing, time as the spine, the text and its apparatus, a chronicle
still being written). Each developed study owns one part of the reading, so together they compose into
a single book.

| Study | Folder | The part it owns |
|---|---|---|
| The Codex, with Canon Tables | [`round-2/codex/`](round-2/codex/) | The spine: one book in date order, canon tables with a column per book, permanent Hijri addresses, catchwords. `build/build.py` computes order, canons, reigns and save gaps. |
| The Hourglass | [`round-2/hourglass/`](round-2/hourglass/) | Where the reader stands in time: a rail with a bead, every card "as of" that date, the future veiled for first readers. |
| The Glossed Folio | [`round-2/folio/`](round-2/folio/) | One entry's page: names glossed as of the page, the record behind each claim in the margin, the realm in the running head. `anchor-report.txt` has the claim-to-record matching for all 108 entries. |
| The Desk | [`round-2/desk/`](round-2/desk/) | Coming back and continuity: a cover per session, open and tied threads, the living court, the verse concordance. |

Runners-up: Annals and Chronicle (a facing-page edition), the Annals (al-Ḥawliyyāt, a scroll of Hijri
years), Later Hands (the book's memory of itself in the margins), the Fascicles (each session as a
numbered part; its cover became the Desk's front door).

**Found in the chronicle while reading** (listed for approval, not yet corrected): eight closing verses
used twice, three entries without one; Muḥammad V's reading backdated in the 1439 entry; Yūsuf ibn Saʿd
seated in the dīwān after his death; nine children of the house without records; a second long gap in
the saves (1395 to 1403); roles and traits without dates; no record of which session added what.
