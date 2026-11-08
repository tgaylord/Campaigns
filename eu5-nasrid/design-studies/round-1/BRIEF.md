# Brief: new ways to present a strategy-game chronicle

You are one of four designers asked, independently, to imagine new ways to present a long-running
campaign history. You are not building a site. You are producing ideas, wireframes and, where it helps,
a rough mockup, so that the owner can be inspired: for new pages, for an entirely different interface,
or for the campaigns that come after this one.

## Ground rules

- **Work only from this folder** (`brief/`). A site for this campaign already exists, and you are
  deliberately not being shown it. Do not look for it, do not read anything under the campaigns repository
  or any `site/` folder, and do not search the web for it. The point is a fresh start.
- **Any tool or technique is fair game**: 3D or WebGL maps, scroll-driven storytelling, sound, generative
  art, printable formats (a PDF codex, a fold-out map, a deck of cards), game-like interaction, pages that
  let the reader ask an AI about the campaign, anything else. Don't limit yourself to what's usual for
  a history site.
- **Practical limits** (the only hard ones): the result must work as a static site on GitHub Pages with
  no server of its own (calls out to an AI or a third-party API from the reader's browser are acceptable
  if you flag them), it is rebuilt from the data each time a new save comes in, and it has to be readable
  on a phone. A printable or downloadable format alongside is welcome.
- **Say what carries over.** The owner plays several campaigns (other countries, other eras) and will
  keep making these. For each idea, say which part is specific to this campaign and which part is a
  pattern any campaign could use.
- Be bold, but be honest about effort and about what the data can and can't support.

## The campaign

A game of *Europa Universalis V* (a grand strategy game of the years 1337 onward) played as the
Naṣrid sultanate of **Granada**, the last Muslim state in Iberia. The player (Trent) plays, saves at
moments that matter, and tells the story; each save is decoded into data; a chronicle is written in the
voice of the Naṣrid court.

The arc so far, 1337 to 1443 (105 years, and it keeps going):

- **1337**: a young sultan, tributary to Castile and in debt, puts the state in order.
- **1346 to 1370**: Granada balances between Castile, Aragon, Portugal and the Marīnids of Morocco. The
  Black Death kills 42% of its people (it was the most urban realm in Iberia). A war of independence
  breaks Castile's hold (1363 to 1366); the Battle for the Strait of Gibraltar ends in 1370 with Granada
  surviving and holding it.
- **1375**: Granada becomes **al-Andalus**, an empire, and the ruler an Emperor.
- **1370 to 1430**: six wars of reconquest (the *Istirdād*) take the peninsula from the north: Portugal
  ends, Castile breaks, and by the Peace of Ṣafar (3 November 1430) all of Iberia belongs to the Emperor
  and his ṭāʾifas (subject kingdoms ruled by vassal dynasties, several of them branches of the house).
- **From 1379**: a turn to the sea and to trade. The court moves to Ishbīliya (Seville) for its river and
  market; a fleet; trade offices from Mali to Cairo and Constantinople; voyages down the African coast;
  the Atlantic islands (Azores, Madeira, Canaries, Cape Verde).
- **1431 to 1432**: Christendom answers with a crusade; al-Andalus and its Muslim allies win it.
- **1442**: the Emperor seats the merchants (burghers) in the assembly (the *Jamāʿa*) as equals of the
  nobles and scholars, every other estate is furious, and on 7 August 1442 the **Golden Century** of
  al-Andalus is proclaimed, with a twenty-year Thalassocracy (a sea-power programme). The realm is
  turning outward in every direction.

The chronicle is organised in **eight books** (see `data/books.json`), some overlapping in time because
they follow different threads (war, plague, faith and learning, the sea).

## The material (`data/`)

All of it is real campaign data. Field names are mostly self-explanatory; skim before you design.

| File | What it holds |
|---|---|
| `books.json` | The eight books: title in English and Arabic, dates, summary. |
| `events.json` | 762 dated events: battles (with hosts, losses, result), sieges, wars declared and joined, peaces, reforms, estate changes, appointments, births, deaths, marriages, territory changes, the player's notes on the state of things. Each links people, places and wars by id. |
| `people.json` | 137 people: the Naṣrid house (55 of them) and those around it. Names in chronicle form and Arabic, birth, death, reigns, roles, parents, ruler stats, traits. |
| `places.json` | 82 places with chronicle, Arabic and game names, map position, and when the realm held them. |
| `wars.json` | 21 wars: sides, goals, outcomes, war-score series over time, who joined when. |
| `countries.json` | The countries the chronicle names, with colours and renamings. |
| `checkpoints.json` | 72 checkpoints (one per save): ruler, heir, capital, number of locations, subjects and their loyalty, allies and rivals, the cabinet, the estates' power and satisfaction (crown, nobles, clergy, burghers, commoners, dhimmī), treasury and income, manpower and ships, population by culture and religion, the Strait's status, laws. |
| `realm-readings.json` | 70 readings of the realm's temper and reach: 13 societal values (each a scale from −100 to +100 between two named ends, e.g. land vs naval), laws, estate privileges, reforms, fleet and army by type, buildings held abroad (trade offices with levels, trading posts, an embassy) with positions, expeditions completed. `realm-names.json` names every key. |
| `world-rankings.json` | The top 20 powers of the world at every checkpoint (tag, rank, points). |
| `world-1442-06-11.json` | The whole world at the latest save: every ranked power's ruler, heir, towns, people, armies, ships, treasury, allies, rivals, subjects, truces; personal unions; wars; the orders of Christendom. |
| `followed-powers.json` | The powers the chronicle follows, in circles of closeness. |
| `battle-places.json` | Each battle's location on the game map. |

Facts about the material worth knowing:

- **Two calendars.** Every date exists in the Hijri (Islamic lunar) calendar and the Western one; the
  chronicle writes in Hijri first (e.g. 21 Muḥarram 846 AH is 1 June 1442).
- **Two names for everything.** Each place, estate and office has a chronicle form and a plain one:
  Ishbīliya and Seville, Qashtāla and Castile, the umarāʾ and the nobility, the ʿulamāʾ and the clergy,
  the dīwān and the cabinet. The owner wants readers to be able to switch between them.
- **Provenance.** Facts are read from a save, estimated (some estate powers are computed, not read),
  or added by the writer as colour; the records say which, and the reader should be able to tell.
- **Map positions** are in game-map pixels (the world map is 16,384 by 8,192, roughly equirectangular;
  Seville is near x 7425, y 2727; Cairo x 9128, y 3151). Beyond what is here, the game's map can be
  traced into outlines of every location, province and country at every checkpoint, if an idea needs it.
- **It grows.** Every new save adds a checkpoint, events, people and chronicle entries. A design has to
  hold 105 years now and several hundred later.
- **The voice.** `chronicle-samples/` holds four chronicle entries. They are written as a court history
  would be, never mention the game, and each closes with a verse of the Qurʾān.

## Your starting angle

You each have a different angle (given in your instructions). It's a nudge, not a rule: if it leads
somewhere you didn't expect, follow it.

## How this runs

**Round one** (now): pitch **two ideas**, distinct from each other, each in about 150 to 250 words:
- a name, and the one question it answers for the reader;
- what the reader sees and does;
- what data it draws on (and anything missing);
- what's campaign-specific vs reusable;
- rough effort (small, medium, large) and the biggest risk.

Write them to your output folder as `round1.md` and return them in your final message. Another
designer may pitch something close to yours; the organiser will assign each of you a different idea
for round two.

**Round two** (later, when asked): develop the assigned idea into:
- `pitch.md`: a one-page pitch (as above, fuller), including how it would be built and how it updates
  with each new save;
- `wireframes.md`: wireframes in ASCII for the key screens or spreads (desktop and phone), annotated;
- optionally `mockup.html`: one rough, low-fidelity, self-contained HTML page (no build step; libraries
  only from a CDN) showing the core interaction or look with real data from this folder. Rough is fine;
  this is for inspiration, not production.
