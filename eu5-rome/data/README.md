# Rome campaign data

Facts read from the campaign's saves. Nothing here is written by hand.

## `snapshots/`

One JSON per save, named by the save's game date: 45 snapshots from 1349 to 1537. Each is Rome's state at that moment, made by `tools/extract_snapshot.py` (country id 203):

- **The state:** tag, rank, capital, cultures, religion, government, laws, privileges, reforms, societal values, estates and economy
- **The dynasty:** rulers and their terms, and the family
- **The realm:** owned locations, population by culture, religion and pop type, provinces and cities
- **Diplomacy:** subjects, overlord, rivals and enemies, treaties, active wars, last war and last peace, great powers and hegemons, situations

Where they came from:

| Source | Snapshots |
|---|---|
| Debug-mode text saves | 1349-10-31, 1365-05-19, 1369-05-01, 1428-04-22, 1437-03-01, 1500-08-21, 1507-01-13 |
| Compressed saves, decoded with `shared/tools/eu5-save-decoder` | all the others |

Notes on particular files:

- `1506-08-01.json` is from an autosave.
- `1527-04-12-post.json` is the second save of 12 April 1527, made just after that day's peace.
- Two pairs taken days apart, `1437-02-27` / `1437-03-01` and `1500-08-05` / `1500-08-21`, were used to validate the decoder. See its README.

## `registers/`

Built from the snapshots up to 1507, for the fact book:

- `wars-to-1507.json`: every war relation recorded in the saves (opponent, date, score, whether in progress, the save it was seen in)
- `subjects-to-1507.json`: every subject Rome has had, with its tag and names, subject types, first and last save seen, seat, culture, religion and size over time

## `world/`

The world around Rome at three dates, used for the "World in 1519" and "World in 1531" tabs of the chronicle. They were made by `tools/world_summary.py`:

- `1507.json`, `1519.json`, `1531.json`: the largest countries, great powers, wars and international organisations at each date
- `regions-1507.json`: the 1507 world broken down by game region

## `fact-book-1337-1507.md`

The campaign's fact book, read from 26 saves (seven text, nineteen compressed) from 1337 to 1507: realm, people, wars, subjects and the shape of the world. It hasn't been extended past 1507.
