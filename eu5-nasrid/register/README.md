# The Register

A prototype companion site for the Naṣrid campaign, and a template other campaigns could start from.
Read `DESIGN.md` for why it exists.

## Layout

```
campaign/
  campaign.yaml        title, calendar, the measures in the count, the kinds of entry, the map
  threads.yaml         wars and stories: id, title, state, premise
  places.yaml          the gazetteer
  cast/<id>.yaml       one person: name, dates, parents, reigns, what drives them, ties
  reckonings/<date>.yaml        the hand-written half of one reckoning: title, summary, beats, tellings
  reckonings/<date>.save.yaml   the numbers half, written by reckon.py from the save. Never edited
  reports/<date>.md             what changed since the save before, written by reckon.py
tools/
  reckon.py            one save in: the facts, the maps, the numbers half and the report
  build-data.mjs       checks campaign/ and writes src/data.json
src/                   the site (React, one file of views)
```

## A save, step by step

`campaign/` is the source of truth. It was first filled by a one-time import from the old Chronicle's
data (reckonings up to 21 December 1451); since then it is written directly.

```sh
# 1. read the save (about five minutes; GAME is the game's `game` folder, or set EU5_GAME)
python3 tools/reckon.py SAVE.eu5 --game GAME
# 2. read campaign/reports/<date>.md: settle what it lists under "To settle by hand",
#    ask the player what it lists under "Ask before writing"
# 3. write campaign/reckonings/<date>.yaml by hand (below)
# 4. check and build
npm run build
```

`reckon.py` decodes the save, keeps every fact it pulls in `../data/extracted/<date>.json`, draws the
three map files the site reads (realm outlines, the world's powers, the towns' faith and tongue), and
writes `<date>.save.yaml`: the count, the court, the council, wars, allies, subjects, the estates'
mood, the peoples and the map's tags. It then compares the save with the one before and writes the
report: towns won and lost, wars and battles, changes at court and on the council, births and deaths
in the cast's families, laws and privileges, treaties, buildings, and shifts in the peoples. A treasury
that moves further than income explains, or a swing in stability, is put at the top as a question for
the player.

The game's keys are turned into the campaign's words by the `save` block of `campaign.yaml`: `names`
for countries the game leaves unnamed, `seats` for council actions, `estates`, `words`. People are
matched by `game: { id }` in their cast file, places by `game:` in `places.yaml`, wars by a thread's
`from` date. Anything it cannot match is listed in the report, not guessed.

The hand file wins wherever both files speak, so a wrong or missing number is overridden there (an
estate's share of power from a screen reading, for one: the save does not hold it). A reckoning made
before `reckon.py` existed is a single hand file holding both halves.

The hand-written half, `campaign/reckonings/YYYY-MM-DD.yaml` (the `realm`, `court` and `standing`
lines are only needed where there is no `.save.yaml`):

```yaml
date: "1451-12-21"
title: The Governor of Palermo
source: { save: SP_ADU_1451_12_21, game: 1.4.7 }
summary: One paragraph on where things stand.
realm: { towns: 244, souls: 3881949, treasury: 26, stability: 16.1, prestige: 93, regiments: 13, ships: 97 }
court: { ruler: muhammad-ibn-ismail-ibn-saad, heir: ismail-ibn-muhammad-ibn-ismail, council: [] }
standing: { wars: [mamluk-war-on-lam], allies: [Mamluks, Morocco, Tunis] }
beats:
  - on: "1451-11-26"
    kind: world                  # one of the kinds in campaign.yaml
    what: One sentence, past or present tense, that stands on its own.
    who: [muhammad-ibn-ismail-ibn-saad]
    threads: [voyages]
    from: [seen, told]           # save, seen (a screenshot), told (the player's account)
    minor: true                  # optional: hidden from the line unless asked for
tellings:
  - id: of-the-governor-of-balarm
    on: "1451-12-21"
    title: Of the Governor of Balarm and the Holy Cities
    covers: [1451-11-26-the-new-world]   # the beats it rests on
    text: |
      The prose, in Markdown. Link people as [Aḥmad](person:ahmad-ibn-muhammad-ibn-ismail).
    behind: |
      What was recorded and what was invented.
questions:
  - Stability fell from 23.6 to 16.1 during 1451. Why?
```

A new person is a new file in `cast/`. A new war or story is a new item in `threads.yaml`. Nothing else
needs touching: the person's page, the thread's page and the front page all follow from the beats.

`npm run data` checks the folder and stops on an entry that names someone not in the cast, a thread that
doesn't exist, a ruler who is dead on the day, or two things with one id.

## Building

```
npm install
npm run build      # checks the data, type-checks, writes dist/index.html (one self-contained file)
npm run dev        # local preview
```

## Starting another campaign from this

Copy the folder, empty `campaign/`, and write a new `campaign.yaml`. The measures shown in the count, the
kinds of entry and their four tones and the provenance marks are settings there. The map is optional.
The second calendar is one file, `src/hijri.ts`; the prototype always shows it, so a campaign without one
would need that made optional.
