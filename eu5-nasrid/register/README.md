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
  reckonings/<date>.yaml   one reading of a save (see below)
tools/
  build-data.mjs       checks campaign/ and writes src/data.json
  import-chronicle.mjs the one-time import from ../data and ../story
src/                   the site (React, one file of views)
```

## Logging a session

Add one file, `campaign/reckonings/YYYY-MM-DD.yaml`:

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
