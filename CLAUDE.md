# Campaigns — rules for every session

This repo holds Trent's strategy-game campaigns. Each campaign lives in its own top-level folder (e.g. `eu5-nasrid/`). These rules apply to every Claude session that touches the repo. They exist so that work in one campaign can never quietly change another campaign's history.

## 1. Know your campaign before writing anything

- At the start of a session, identify which campaign it belongs to, from the chat's context or by asking Trent.
- If it's unclear, **ask before making any change.**
- Read that campaign's `SYSTEMS.md` before touching its data, story or tools. It holds that campaign's own rules.

## 2. Where a session may write

| Path | Read | Write |
|---|---|---|
| Your own campaign's folder | yes | **yes** |
| Another campaign's folder | yes (for reference) | **never**, not even for a typo or to roll out an improvement |
| `shared/` (data model, shared tools, shared docs) | yes | **only with Trent's explicit approval in the chat**, after saying exactly what will change |
| `shared/transitions/` | yes | create a new transition doc; update **your own campaign's** adoption line in an existing one |
| Repo root (`CLAUDE.md`, `README.md`, `.gitignore`, workflows) | yes | only with Trent's explicit approval |

## 3. Spreading an improvement between campaigns

When a session comes up with something worth reusing (a parser improvement, a new view, a better schema, a story convention):

1. **Write a transition doc** at `shared/transitions/YYYY-MM-DD-<origin-campaign>-<slug>.md`, using the template in `shared/transitions/README.md`. It covers what the change is, why it's worth having, how it works, and how a campaign adopts it.
2. **Promote it to `shared/` if needed.** If it's a shared tool or schema, it moves into `shared/` only after Trent approves.
3. **Each campaign adopts it in its own session.** That session makes the change inside its own folder, then marks its line in the transition doc as adopted, declined or adapted.
4. **No session ever adopts on another campaign's behalf.**

## 4. Commits

- **One campaign per commit.** Prefix the message with the folder name: `[eu5-nasrid] Add 1340 checkpoint snapshot`, `[shared] Add snapshot schema v1`.
- **Never commit save files** (`*.eu5`) or zipped saves. They're hundreds of MB and are ignored by `.gitignore`. Commit the data extracted from them instead.
- **Corrections to a campaign's history are normal,** but only that campaign's own session makes them.
