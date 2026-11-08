# Dār al-Sikka: wireframes

These are ASCII sketches. `( )` is a coin, and bigger brackets mean a bigger coin. `▓` is fine gold, `▒` pale gold, `░` base metal and `·` an unstruck blank. `#` is a countermark punch.

---

## 1. The cabinet (desktop, home)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  DĀR AL-SIKKA · the Mint of al-Andalus          [Chronicle|Plain] [Table] [Print]│
│  72 coins · 4 reigns · 738–846 AH / 1337–1442                    [? Legend card] │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ╔══════════════════════════════════════════════════════════════════════════════╗ │
│ ║  YŪSUF I · يوسف الأول      737–764 AH · 1337–1363       25 coins     ◉ pull  ║ │ ← drawer front
│ ║  ·▓▓▓▓░▒░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓  ......o.....OOO.OOOOOO                             ║ │ ← silhouette strip:
│ ╠══════════════════════════════════════════════════════════════════════════════╣ │   metal ticks + size
│ ║  SAʿD · سعد بن يوسف        764–807 AH · 1363–1405       23 coins     ◉ pull  ║ │   profile, a reign's
│ ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░▓▒▒░░▒  oooooooooooOOO@@@@@@@@@                            ║ │   shape before
│ ╠══════════════════════════════════════════════════════════════════════════════╣ │   opening it
│ ║  ISMĀʿĪL · إسماعيل بن سعد  807–832 AH · 1405–1429       13 coins     ◉ pull  ║ │
│ ║  ▒▒▒▓▓▓▒▒▒▒▒▒▓              @@@@@@@@@@@@@                                     ║ │
│ ╠══════════════════════════════════════════════════════════════════════════════╣ │
│ ║  MUḤAMMAD V · محمد بن إسماعيل  832 AH– · 1429–      11 coins  ✦ new  ◉ pull ║ │ ← "newly struck"
│ ║  ▓▓▓▓▓▓▓▓▓▓▓                @@@@@@@@@@@                                       ║ │   marker on the
│ ╚══════════════════════════════════════════════════════════════════════════════╝ │   latest save
│   [ the scales: drop two coins here to compare ]  ( ) ⚖ ( )                      │
└──────────────────────────────────────────────────────────────────────────────────┘
```
- Drawers open as an accordion; only one is open at a time on phones, several on desktop.
- The drawer fronts are reign headers. Hijri dates come first, matching the chronicle's convention.

## 2. One drawer open (desktop): the drawer as a chart

```
╔═ YŪSUF I ═══════════════════════════════ sort: [date•] [land] [purse] ══ time-true ☑ ═╗
║ gauge                                                                                 ║
║ ◯200                                                                ( ▓ )  ( ▓ )(▓)   ║
║ ◯100                                ( ▓ )(▓)             (▓)  (▓)                     ║
║ ◯50       (▒)                                                                         ║
║ ◯25  · ░ ░  ░ ░ ░  ░  ░ ░ ▓ ▓#         ░?        ...                                  ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║ ← the rail: coins
║ 1337   1340      1343   1346   1349        1353     1355        1359   1363          ║   stand on it,
║  ↑        ↑               ↑     ↑            ↑                                        ║   bottom-aligned
║ blank   31 locs at the  plague  Peace of   Kingdom of Sevilla save:                   ║
║ (start) Aragon peace,   & war   Qurṭuba    18 locs for one save                       ║
║         ṭāʾifas not yet         (41 locs)  (hover explains)                           ║
║         split off                                                                     ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```
- Bottom alignment turns the size profile into the land curve. Metal colour is the purse, and `#` punches are wars.
- With time-true spacing on, the gaps between saves show as empty felt (Saʿd's drawer has an empty 1379–1394 span).
- The **gauge** at the left is the legend's reference rings, drawn on the same scale as the coins.
- **Sort** slides the coins into rank order by land or purse. Dates stay on each coin's label so it's clear the axis has changed.
- Hover or tap: a tooltip gives the save title, date, locations, treasury/debt and wars. Click opens the coin.

## 3. One drawer open (phone, 375 px)

```
┌───────────────────────────────┐
│ ☰ Dār al-Sikka   [Ch|Pl] [▤] │ ← ▤ = table
├───────────────────────────────┤
│ ▸ Yūsuf I        25 · 1337–63 │
│ ▾ Saʿd           23 · 1363–05 │
│ ┌───────────────────────────┐ │
│ │  ◀ swipe ▶   sort:[date▾] │ │
│ │                    (▓▓▓)  │ │ ← horizontal tray, snap
│ │         (▓▓)  (▓▓)  (▓▓▓) │ │   scrolling, coins at
│ │ (▓) (▓#)(▓)               │ │   0.6× drawer scale
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │ 1363 1364 1365 1366 ...   │ │
│ └───────────────────────────┘ │
│  ▬▬▬▬▬▬○▬▬▬▬▬▬▬▬ minimap      │ ← whole-reign silhouette
│ ▸ Ismāʿīl        13 · 1405–29 │   as a scrub bar
│ ▸ Muḥammad V     11 · 1429–   │
├───────────────────────────────┤
│ ⚖ scales: ( )  ( )   [compare]│ ← sticky footer, long-
└───────────────────────────────┘   press a coin to add it
```

## 4. A coin, obverse (detail view, desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◀ prev coin        SAʿD · 9 of 23 · 16 March 1375        next coin ▶     │
│                                                                          │
│                .-~~~~~~~~~~~-.          ┌ LEGEND (always pinned) ──────┐ │
│            .~  · · · · · · · ·  ~.      │ SIZE   land: locations held  │ │
│          /  · · · · · · · · · ·  \      │        ◯25 ◯50 ◯100 ◯200      │ │
│         | ·  ┌──ولا غالب إلا الله──┐ · |   │ METAL  purse                 │ │
│         |·   │   سعد بن يوسف   │   ·|     │   ▓ fine: holds ≥ owes       │ │
│  [AH 776]·   │  Saʿd ibn Yūsuf│ ·[1375]  │   ▒ pale: owes more          │ │
│         |·   └───────────────┘   ·|     │   ░ base: owes 5× more       │ │
│         | ·    Ishbīliya→mint   · |     │ PUNCH  # one per war         │ │
│          \  ·      [#]        ·  /      │ WORDS  name · title · mint · │ │
│            '~ · · · · · · · · ~'        │        AH year · AD year     │ │
│                 '-~~~~~~~~~-'           └──────────────────────────────┘ │
│   top segment: EMPEROR (was SULṬĀN until this save)                      │
│                                                                          │
│   [ ⟲ Flip to the ledger ]   [ ⚖ Put on the scales ]   [ ▤ Row in table ]│
│   72 locations · ▓ fine (286 held, 0 owed) · no war                      │
└──────────────────────────────────────────────────────────────────────────┘
```
- The one-line plain reading under the coin repeats all four readings as text, so the coin never hides a number.
- Arrow keys or swipe step through the coins in order. The URL updates (`#1375-03-16`).

## 5. A coin, reverse: the ledger (detail view)

```
                .-~~~~~~~~~~~-.                ┌ LEDGER SLIP (paper, under coin) ─┐
            .~ ▲  OFF THE HELD LEVEL ▼~.       │ The Peace of Ramaḍān             │
          /   ╭── estates ring ──╮    \        │ save SP_GRA_1395_06_22           │
         |  crown ░░░    ░░ burghers |         │ ● read  ◌ estimated  ✎ writer    │
         |  umarāʾ ░░░░  ░ dhimmī    |         │ ● treasury 235 · owed 565        │
         |     ʿulamāʾ ░░ ░ commoners|         │ ● income 113.7 / exp 143.8 /mo   │
         |   ┌────────────────────┐  |         │ ● 189 locations                  │
         |   │ 235 held · 565 owed│  |         │ ● 2,333,984 people (…% Sunni)    │
         |   │ +113.7 −143.8 / mo │  |         │ ● peace 38.3 · prestige …        │
         |   └────────────────────┘  |         │ ● 4 ṭāʾifas: …                   │
          \  189 locs · 2.33M souls  /         │ ◌ estates: umarāʾ 31 (sat 40) …  │
            '~ 3 RAMAḌĀN 797 · 1395 ~'         │ ✎ note: "…"                      │
                 '-~~~~~~~~~-'                 └──────────────────────────────────┘
```
- The estate arcs are **stippled** because those powers are estimated (`estimated: true`). Arc length is power.
- **Satisfaction is shown only when it's news.** Each estate has a held level, inferred as its most common value: 50 for most, 40 for the umarāʾ, the owner's tax-rate policy. An arc at its held level stays plain. An arc more than 3 points off carries a notch: `▲+24` or `▼−16`. The 1442 reverse looks like this:

```
         crown ░░░░░          ░░░░░░ burghers ▲+24
     umarāʾ ▼−8 ░░░░          ░░░ dhimmī ▼−5
         ʿulamāʾ ▼−6 ░░░    ░ commoners ▼−16
```
  Most reverses have no notches at all, which is how you can tell when one does.
- Drawer option **thread**: the umarāʾ's power drawn as a thin line under the rail across the whole reign (about 47 falling to about 17), the slow cut the owner has made over decades.
- The slip uses the same three glyphs throughout: ● read from save, ◌ estimated, ✎ added by the writer.
- On the phone, the slip sits under the coin as a pull-up sheet.

## 6. The scales: comparing two coins

```
┌──────────────────────────────────────────────────────────────────────┐
│             ⚖  pan tips toward the richer purse                      │
│        ( ░ )                                    (   ▓   )            │
│     1346-08-01 · Yūsuf I               1442-06-11 · Muḥammad V       │
│ ──────────────────────────────────────────────────────────────────── │
│                  1346            1442          change                │
│  land             18             222           ×12.3                 │
│  treasury          5           1,767           +1,762                │
│  owed             96             565           +469                  │
│  people       489,571       3,327,740          ×6.8                  │
│  peace            10            14.2           +4.2                  │
│  wars              0               0                                 │
│  burghers ◌     (power …)      24.2            …                     │
└──────────────────────────────────────────────────────────────────────┘
```
- Both coins are drawn at true relative size; this pairing is the hundred years in one picture.
- Phone: the coins stack vertically and the table scrolls under them.

## 7. The legend card (also printed)

```
┌───────────── HOW TO READ A COIN OF AL-ANDALUS ─────────────┐
│  SIZE ─ land        ◯ 25   ◯ 50   ◯ 100   ◯ 200 locations   │
│         (area grows with land; same scale for every reign) │
│  METAL ─ the purse  ▓ fine   holds at least what it owes   │
│                     ▒ pale   owes more than it holds       │
│                     ░ base   owes over five times as much  │
│                     · blank  nothing recorded              │
│  PUNCHES ─ wars     #  one for each war under way          │
│  WORDS ─ the square: ruler's name · around it: title,      │
│          mint (capital), Hijri year, Western year          │
│          the motto sits above the name, same on every coin │
│  Flip a coin for its ledger.  Stippled = estimated.        │
└────────────────────────────────────────────────────────────┘
```

## 8. The table (one tap from anywhere)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ▤ All coins          filter: [reign ▾] [metal ▾] [at war ☐]     [CSV] [◉ coins]  │
├────────────┬──────────────┬────────┬──────────┬──────┬──────┬──────┬──────┬──────┤
│ date       │ Hijri        │ ruler  │ mint     │ land │ held │ owed │ metal│ wars │
├────────────┼──────────────┼────────┼──────────┼──────┼──────┼──────┼──────┼──────┤
│ 1337-04-01 │ 28 Shaʿbān 737│ Yūsuf I│ Gharnāṭa │  18  │  —   │  —   │ ·    │  0   │
│ 1337-08-18 │ …            │ Yūsuf I│ Gharnāṭa │  18  │ 166  │  0   │ ▓    │  0   │
│ …          │              │        │          │      │      │      │      │      │
└────────────┴──────────────┴────────┴──────────┴──────┴──────┴──────┴──────┴──────┘
```
- The table has the same columns as the legend, plus the ledger fields. Clicking a row opens its coin.
- Phone: the first column is pinned and the rest scroll sideways inside the table, not the page.

## 9. The printable rubbing sheet (A4 landscape, one reign)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ DĀR AL-SIKKA · Drawer I · Yūsuf I · 737–764 AH / 1337–1363                 │
│                                                                            │
│                                               ◎    ◎     ◎    ◎   ◎        │
│                     ◎         ◎  ◎   ◎                                     │
│   ○  ◌ ◌ ◌ ◌ ◌ ◌ ◌  ◌ ◎                                                    │
│ ──────────────────────────────────────────────────────────────────────────  │
│ 37  39 40 40 40 41 43 45 46 46 48 49 49 51 53 53 55 59 60 63               │
│                                                                            │
│  charcoal "rubbing": outline + raised lettering; metal shown as rubbing    │
│  density (fine = dense, pale = medium, base = hatched) so it survives B&W  │
│                                                       ┌ legend card ┐      │
│  printed 1442 build · 25 coins                        └─────────────┘      │
└────────────────────────────────────────────────────────────────────────────┘
```
- Made with CSS `@media print` from the same SVG. Metal becomes texture density, so the sheet works on a monochrome printer.
- A "whole cabinet" variant puts all four reigns on one long rail (A3, or tiled A4).
