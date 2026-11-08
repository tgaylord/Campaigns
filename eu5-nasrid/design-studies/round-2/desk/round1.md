# Designer D, round one

Angle: a chronicle that is still being written. Both ideas take the play session as a real unit
of the book. One idea faces the reader coming back; the other faces the writer's desk.

---

## Idea 1: The Fascicles (a serial edition with a ribbon bookmark)

**Answers:** 4 (the returning reader), 1 (a second spine), and part of 2.

**What the reader sees and does.** Each session's output comes out as a numbered *fascicle*, the way
long works once came out in parts. Its cover shows the span ("Ṣafar 846 to Ṣafar 847"), *In this
number* (the new entries), *New to the court* (people introduced or born) and *Gone from it* (deaths),
and a strip of what changed between the session's checkpoints (umarāʾ 32, burghers 74). It opens with
**"What has passed"**, about 80 words in the chronicle's own voice. The voice already recaps itself,
in "Consider what he left" and the book closings, so this is native, not bolted on. The player's
out-of-character note goes on the back as *From the copyist*. A ribbon bookmark, kept in the browser,
opens Trent on what he hasn't read yet. A friend can read in **edition order** (by date, books
interleaved) or **as published**.

The key move is that **the reference shelf is dated to your ribbon**. Look up Ismāʿīl at 1375 and he
is a charming nine-year-old who has just been betrothed. Nothing says he will be Emperor. Trent can
switch it to "I know everything."

**Material.** Entries, people, events and checkpoints are all here. **Missing:** which session added
what. A `session:` field, or a `sessions.json` built from commits, would fix it. The recap can be
drafted by the AI collaborator during the session, so the site makes no live AI calls. A dated shelf
works from `events.json`, but the prose notes in `people.json` are undated and won't cut cleanly at
a date.

**Reusable:** all of it except the voice of the recap. **Effort:** medium. **Biggest risk:** the
session log is a new habit, and an early recap that gets something wrong is hard to put right.

---

## Idea 2: The Desk (open threads, the living court, and promises kept)

**Answers:** 4 (the writer's continuity), 5 (scale), and 1 (threads as paths through the book).

**What the reader sees and does.** The chronicle makes promises. "This one, alone of them, would
hold" (1348) is paid off decades later. Others are still open: the Pórtico de la Gloria "waits in a
storeroom" (1430), the princes promise the ʿulamāʾ their rights on Ismāʿīl's accession (1442), the
chancery warns of a league (1442), and Fernando Po is named (1443). Motifs come back too: Ismāʿīl
"tells each man what he wishes to hear" from the age of nine through to his obituary.

**The Desk** is a page at the open end of the book. It has:
- **threads**, open and tied, each linked to where it began and where it was paid;
- **the court as it stands**: the living, their ages and offices, and who has gone unmentioned the
  longest;
- **the verse concordance**, all 108 verses used, since none may repeat;
- **facts awaiting the next save** ("exact date to come").

In the reading view, a small knot in the margin marks a thread opening, and its tie links forward.
"Follow this thread" becomes a way of reading across the books.

**Material.** Verses, ages and deaths can be computed. Threads aren't marked anywhere: they need
`[…](thread:portico)` links or a `threads.json`, seeded by one AI pass over the 108 entries that
Trent then reviews.

**Reusable:** the whole schema. Each campaign brings its own threads and closing convention. **Effort:**
medium, plus a few hours of seeding. **Biggest risk:** keeping threads up becomes homework, and the
open list gives the ending away to friends unless it is kept to the frontier.
