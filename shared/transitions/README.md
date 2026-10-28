# Transition docs

A transition doc carries an improvement from the campaign that invented it to the others, without any session writing outside its own folder (see `/CLAUDE.md` §3).

Name: `YYYY-MM-DD-<origin-campaign>-<slug>.md`

## Template

```markdown
# <Short title>

- **Origin:** <campaign folder>, <date>
- **Kind:** tool | data model | view | story convention | workflow
- **Moves into shared/?** yes (path) | no (each campaign copies and adapts)

## What it is
<One or two paragraphs.>

## Why it's worth having
<What problem it solved in the origin campaign.>

## How it works
<Enough detail to rebuild it, or a link to the shared/ path.>

## How a campaign adopts it
<Steps a session follows inside its own folder.>

## Adoption
| Campaign | Status | Date | Notes |
|---|---|---|---|
| <origin> | adopted | <date> | origin |
| <other> | pending | | |
```
