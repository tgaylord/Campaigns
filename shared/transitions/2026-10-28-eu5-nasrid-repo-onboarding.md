# Onboarding a campaign onto the Campaigns repo (and publishing the EU5 save decoder)

- **Origin:** eu5-nasrid, 2026-10-28
- **Kind:** workflow, plus one tool going into `shared/`
- **Moves into shared/?** The repo layout and rules don't move; each campaign follows them in its own folder. The EU5 save decoder moves to `shared/tools/eu5-save-decoder/`.
- **First adopter:** the Rome (Byzantium → Rome, Palaiologos) EU5 campaign.

## What it is

The Campaigns repo (`tgaylord/Campaigns`) holds every campaign's history in one place. Each campaign gets its own folder of data, story and tools, and can also have an explorer site that GitHub Pages publishes automatically. The Nasrid campaign set this up first. This doc is how another campaign joins without disturbing anyone else's history.

It also asks the Rome session for one thing only it has: the decoder it built for EU5's compressed (binary) saves. That decoder belongs in `shared/`, so every EU5 campaign can read compressed saves instead of 500 MB text saves.

## Why it's worth having

- **One home, versioned.** History, extracted data and tools live in git instead of scattered docs and session workspaces that disappear. Corrections are commits, so nothing is lost.
- **Isolation by rule.** `CLAUDE.md` stops a session for one campaign from editing another's history.
- **Shared tools.** A save decoder, parser or schema is written once, kept in `shared/`, and adopted per campaign.
- **Optional explorer site.** Any campaign with `<folder>/site/package.json` is built and published at `https://tgaylord.github.io/Campaigns/<folder>/`.

## How it works

### Repo layout

```
Campaigns/
  CLAUDE.md                ← rules for every session: read first
  README.md                ← one row per campaign
  shared/
    transitions/           ← docs like this one
    tools/                 ← shared tools (decoder goes here)
  .github/workflows/pages.yml   ← builds every <campaign>/site
  eu5-nasrid/              ← Granada campaign: an example, never edit it
    SYSTEMS.md             ← that campaign's own rules and conventions
    data/  story/  site/
  <your-campaign>/         ← new folder
```

### Rules that matter most (full text in `/CLAUDE.md`)

- Write only inside your own campaign's folder.
- Read other campaigns' folders for reference only; never change them, not even to fix a typo.
- Changes to `shared/` or the repo root need Trent's explicit approval in the chat, after saying exactly what will change.
- Commit messages start with the folder name, one campaign per commit: `[eu5-rome] Add 1500 snapshot`.
- Never commit save files (`*.eu5`) or zipped saves. Commit the data extracted from them.

## How a campaign adopts it

### 1. Attach the repo and read the rules

- Add `tgaylord/Campaigns` to the session with push access.
- Clone it and read `CLAUDE.md` and this doc.
- Skim `eu5-nasrid/SYSTEMS.md` as an example of a campaign's systems doc. It is an example, not a template to copy.

### 2. Create the campaign folder

- Agree the folder name with Trent. `eu5-rome` is the suggestion.
- Write `<folder>/SYSTEMS.md` describing how this campaign actually works:
  - where its chronicle and other documents live (Claude Docs tabs, Markdown in `story/`, or both, and which is the point of truth)
  - its story conventions, such as the Roman-court voice, the war-score threshold for prose, and how legions are tracked
  - its save workflow and checkpoint naming
  - its custom mod (Romani Provinciales) and the save-patching approach, if those should live in the repo
- Bring in what already exists, where it's worth keeping in git:
  - the fact book
  - extracted snapshots and war registers as data files
  - the mod's source, if Trent wants it versioned
- Migrating the Claude Docs content into Markdown is optional and Trent's call. Don't assume it.

### 3. Root README row (needs Trent's approval)

Add one row to `/README.md` for the campaign. This is a repo-root change, so confirm it with Trent first.

### 4. Publish the save decoder to `shared/tools/eu5-save-decoder/` (needs Trent's approval)

**What to include:**
- the decoder code
- the token table (numeric field code → field name), labelled with the game version it was learned from (1.3.11)
- a `README.md` covering:
  - what it reads (the binary gamestate inside the `.eu5` zip, and the string lookup) and what it outputs
  - how the token table was learned: aligning binary saves against text saves from a few days apart
  - how it was validated: the 1437 and 1500 comparisons, matched on land, population, rulers, subjects, laws and war records
  - known gaps, such as unresolved tokens and value types it guesses
  - how to extend the table to a new game version from one text save plus one compressed save taken at the same moment
- **command-line usage:** input and output paths as arguments, with nothing hard-coded

**Privacy scrub before committing.** Remove anything that identifies Trent's computer or accounts:
- absolute paths:
  - `C:\Users\…` or any Windows user folder
  - `/home/claude/…`, `/mnt/user-data/…` or other session paths
  - Steam library paths
- the PC's device name, the Windows user name, email addresses
- Steam, Paradox or other account IDs
- saves or save fragments, including test fixtures cut from real saves; describe the format instead
- logs, crash dumps, `pdx_settings.json`, `playsets.json`
- the save-patch script (`Galli_Hispani_patch.ps1`) and anything else that embeds local paths, unless scrubbed; it's Rome-specific anyway, so it belongs in the Rome folder if anywhere

Then grep the staged files for `Users`, `trent`, `C:\`, `/home/`, `/mnt/`, `steamapps` and `@` before committing. The Nasrid session will check the published tool again before adopting it.

**Commit and note it:**
- commit as `[shared] Add EU5 save decoder (1.3.11 token table)`
- add this campaign's row in the Adoption table below

### 5. Commit and push

- Commit the campaign folder as `[<folder>] …`.
- Commit `shared/` changes separately as `[shared] …`.
- Commit the README row separately as `[shared]` or a root commit, as Trent prefers.
- Push to `main`.

## Adoption

| Campaign | Status | Date | Notes |
|---|---|---|---|
| eu5-nasrid | adopted | 2026-10-28 | origin; will adopt the decoder and extend it to 1.4 |
| eu5-rome | adopted | 2026-10-28 | folder `eu5-rome/` with SYSTEMS.md, snapshots, registers and tools; decoder published at `shared/tools/eu5-save-decoder/` (1.3.11 table); chronicle stays in Claude Docs for now |
