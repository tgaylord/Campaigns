# Brief: the Chronicle itself

You are one of four designers asked, independently, to imagine how a long, growing court chronicle
should be read online. You are not building a site. You are producing ideas, wireframes and, where it
helps, a rough mockup, so the owner can find a better way to present the Chronicle, or a different
way altogether, for this campaign and the ones after it.

## What the Chronicle is for

The Chronicle is **a book first**: a court history of a strategy-game campaign, written in the voice
of the Naṣrid court as the campaign is played, read in order and returned to. Everything else (people,
places, wars, the state of the realm at a moment) is a reference shelf behind the book, there to deepen
the reading and to answer "who was that?" or "what did the realm look like then?".

**The reader** is, first, the owner, Trent: he played every year of it, he writes it with an AI
collaborator after each session, and he comes back to relive it, to look things up, and to keep the
story continuous as it grows. Second, friends he might share it with, who know nothing of the
campaign and meet it as a book. Design for both, and say which you favour where they pull apart.

**It grows.** After every play session there are new entries, people, places and checkpoints. It holds
105 years now (1337 to 1443), in 108 entries and about 68,000 words; it will hold several hundred years.

## The material

- `chronicle/`: **every chronicle entry so far** (108). Read a good number of them, across the books,
  before designing. Each is Markdown with front matter:
  - `title`, `date` (Western; the chronicle writes in Hijri first), `era` (its book), `kind`;
  - `people`, `places` (ids), `sources` (the events it draws on);
  - in the text, links to people and places as `[Name](person:id)` and `[Name](place:id)`;
  - each closes with a verse of the Qurʾān in italics, never repeated.
  The player also writes a short out-of-character note for some entries, listing what in them is
  invented colour rather than read from a save; those notes aren't included, but they exist and are
  part of the material a design can show.
- `data/books.json`: **the eight books**, with titles in English and Arabic, dates and summaries.
  Books follow threads (war, plague, faith and learning, the sea), so several overlap in time.
- `data/`: the rest of the record, as in any campaign: 762 dated events, 137 people (the Naṣrid house
  is 55 of them), 82 places with map positions, 21 wars with their battles, 72 checkpoints (one per
  save: ruler, estates, treasury, population, allies and rivals, and so on), readings of the realm's
  temper and reach, the world's rankings. Skim them; they are the reference shelf, not the brief.

Facts worth knowing:
- **Two calendars**: every date in Hijri and Western form (21 Muḥarram 846 AH is 1 June 1442; the
  Hijri date is the tabular calendar applied to the Julian date).
- **Two names for everything**: Ishbīliya and Seville, Qashtāla and Castile, the umarāʾ and the
  nobility. The owner wants readers to be able to switch between the chronicle's names and plain ones.
- **Provenance**: facts are read from a save, estimated, or invented colour, and the records say which.
- **Gaps**: saves are irregular (none between 1379 and 1394, for example), so the record is dense in
  some years and silent in others.

## The open problems

These are the questions the owner actually has. You don't need to answer all of them; a strong answer
to one or two is better than a thin answer to all.

1. **Finding your way through the book.** 108 entries in eight overlapping books, four reigns, and
   dense and empty stretches. How does a reader move through it: in order, by thread, by reign, by
   person, by year? What is the spine?
2. **Narrative and reference together.** How should the prose and the reference shelf interleave, so
   that a reader can ask "who was Faraj?" or "how big was the realm then?" without losing their place,
   and so the reference deepens the reading instead of competing with it?
3. **One entry.** What should a single entry feel like to read? Its page, its marginalia, what sits
   beside it, how it ends and leads on.
4. **The returning reader.** Trent comes back after every session. What's new, where he left off, how
   a new entry connects to what came before, how the writer keeps continuity.
5. **Scale.** How does all of it hold up at 300 years and 400 entries, and for the next campaign with
   a different country, era and voice?

## Ground rules

- **Work only from this folder** (this folder). A site already exists and you are deliberately not
  shown it. Do not look for it, do not read anything under the campaigns repository or any `site/`
  folder, and do not search the web for it.
- **Don't redo round one.** An earlier round explored other forms, and they are kept for reference.
  Start somewhere new rather than near them: a petitions game where the reader counsels the throne; a
  scrolling data-journalism long read on six key numbers with a "story finder"; a coin cabinet with one
  generated coin per save; a cause explorer tracing chains of why; and, pitched but not developed, the
  history retold from each estate's seat, a map scrubbed through time with vital signs, a card deck, and
  the realm's values drawn as tipping scales. Those were lenses on the data. This round is about the
  book.
- **Any tool or technique is fair game**: typography and layout traditions from manuscripts and
  printed editions, hypertext, annotated editions, audio, maps, timelines, print or e-book formats,
  an AI the reader can ask, anything else.
- **Practical limits** (the only hard ones): a static site on GitHub Pages with no server of its own
  (calls from the reader's browser to an AI or a third-party API are acceptable if flagged), rebuilt
  from the files after each session, and readable on a phone.
- **Say what carries over** to other campaigns, and what is specific to this one.
- Be bold, and honest about effort and about what the material can and can't support.

## How this runs

**Round one** (now): pitch **two ideas**, distinct from each other, each in about 150 to 250 words:
a name and the problem(s) above it answers; what the reader sees and does; what material it draws on
(and anything missing); campaign-specific vs reusable; rough effort and the biggest risk. Write them to
your output folder as `round1.md` and return them in your final message. The organiser will then assign
each designer a different idea.

**Round two** (later, when asked): develop the assigned idea into `pitch.md` (fuller, including how
it is built and how it grows with each session), `wireframes.md` (annotated ASCII for the key screens,
desktop and phone), and `mockup.html`: one rough, self-contained page (no build step, libraries only
from a CDN, data inlined) that uses **real chronicle entries** from this folder, so the reading can be
tried.
