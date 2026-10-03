---
name: chart-path
description: T4 · Chart path's practice. How a structural tension chart an agent writes reaches Asterion, who may see it, the words the teams use for repository, checkout, chart memory, project, seat and workspace, what Miadi's /stc-config holds that Asterion must keep when it moves into Miadi, and how a chart is steered without Asterion writing its file. Use when registering or syncing a coaia-narrative memory in Asterion, when a chart does not show on Asterion, before registering anything from a private repository, when moving Asterion into jgwill/Miadi or packaging it, when naming any of these things, or when someone wants to steer or edit a chart from Asterion. Triggers on "Asterion", "chart path", "coaia-sync", "register a chart", "private chart", "steer a chart", "stc-config", "workspace vs project".
---

# Chart path

Written by T4 · Chart path (`teams/README.md` in this kit) from its own work. Any agent of any
kind reads this, and any agent that learns something about the chart path writes it here, not in
its own private memory. That is how the practice evolves where every seat can see it.

## Desired outcome

Every chart an agent writes reaches one place where the people it concerns can read and steer it,
and whether that place is public is decided per source.

## The path, as it runs today (2026-10-03)

1. An agent writes charts through the COAIA MCP (`coaia-narrative`). Every write ends in one save of
   a **chart memory**, a `.jsonl` file. The file is the record. Asterion only holds a projection of it.
2. The memory reaches Asterion one of two ways:
   - **The door.** With `COAIA_ASTERION_URL`, `COAIA_ASTERION_TOKEN` and `COAIA_ASTERION_PROJECT` set
     on the MCP server (coaia-narrative 0.18.0 or later), each save posts the whole file to
     `POST /api/ingest/coaia-narrative`.
   - **The registry sync.** On gaia, `asterion-coaia-sync.timer` runs every 5 minutes and reads each
     registered file, from disk (`--file`) or from a repository's `origin/main` (`--git`).
3. One mapper (`app/lib/asterion/coaia-projection.mjs` in miadisabelle/asterion) turns charts into
   tensions, steps into action steps, beats into beats, and a chart family with beats into a thread.

See it live at `/bridge` and `/settings` on any Asterion address. List the registry from
`miadisabelle/asterion/app` with `node scripts/coaia-sync.mjs list` (it needs `app/.env.local`, so
on gaia only).

## Private sources

Asterion's public addresses (asterion.jgwill.com, asterion.tushell.com,
asterion.sanctuaireagentique.com, asterion-zeta.vercel.app) answer anyone. A **private** project
is shown only to a signed-in writer (signed in at `/signin` with a Miadi token, or holding the
writer token).

- A memory that lives in a private repository is registered with `--private`, **in the same command
  that first registers it**, so no sync runs before it is private:
  `node scripts/coaia-sync.mjs register <key> --name "<name>" --file <path> --private`
- `--public` makes a project public again. `list` marks private projects `PRIVATE`.
- Earned twice. On 2026-10-01, `jgwill/dummass` (private) showed on the public site for about ten
  minutes. On 2026-10-03, Mino's chart (`miadisabelle/workspace`, private) was kept off Asterion
  until private projects existed. It is now registered as `mino-triage`, private.
- How it holds: every read route asks `viewerOf(request)` (`lib/asterion/visibility.ts`). A read that
  does not ask hides private rows. `scripts/check-read-gates.mjs` fails the build when a GET route
  never asks, beside `check-write-gates.mjs` for writes. Public list caches use the keys
  `projects:public` and `tensions:public:*`, which no earlier deployment writes.

## The words

The factory used "workspace" for three different things. T4 uses one word per thing. Correct this
section when William does.

| word | means | where it lives today |
|---|---|---|
| **repository** | `owner/repo` on GitHub | everywhere |
| **checkout** | one repository cloned on one host, at a path | Miadi `config/stc-workspaces.json` (`repository`, `localPath`), shown at `/stc-config`, where it is called a "workspace" |
| **chart memory** | one coaia-narrative `.jsonl` file of charts | a checkout's `.coaia/`, an episode folder, `~/workspace/.mino/coaia/` |
| **project** | Asterion's unit: one key, one or more chart memories, public or private | `asterion.projects`, registered with `coaia-sync.mjs` |
| **seat** | the agent session responsible for steering a project's charts | Miadi `config/stc-steering.json` (`seats`, each a tmux session) |
| **workspace** | an agent's home, the way Mia's `~/workspace` is hers | `miadisabelle/workspace` for Mia; the example community users follow |

When Asterion moves into Miadi, `/stc-config`'s "workspaces" become **checkouts**, and "workspace"
stays free for the agent's home.

## What Miadi's /stc-config holds that Asterion must keep

Asterion knows where a chart memory is. It does not know where the work happens. `/stc-config`
(29 entries in `config/stc-workspaces.json`, 2026-10-03) holds, per repository:

- the host path of its checkout (`localPath`), which is where an agent works on the issue a chart steps into
- which STC files the checkout carries (`STC.md`, `STCGOAL.md`, `STCISSUE.md`, `STCMASTERY.md`) and whether to create them
- which of the four STC bots are on for it (`stcgoal`, `stcissue`, `stcmastery`, `stckin`)

When Asterion moves into Miadi, a project gains its checkouts (repository, host, path) and its seat.
Keep `/stc-config` working beside Asterion's pages until the project page shows all three.

## Steering a chart (design, not built)

Asterion does not write a chart memory. The sync would overwrite the edit, and the memory belongs to
the agent that keeps it. Steering goes to the seat instead:

1. A person steers a chart on Asterion. Asterion records the steer as an event on that chart.
2. The steer goes to the project's **seat** through Miadi's steering (`config/stc-steering.json`,
   `lib/stc/steering.ts`), the same path a GitHub action takes to reach a seat today.
3. If the seat's session is closed, it is brought back first (T1: `tide agents restore`, the binding line).
4. The seat changes the chart through its MCP, and the save returns through the door or the sync.

What is missing: a project names no seat yet, and a steer is not yet an event a seat receives.

## Where Asterion goes (absorption into jgwill/Miadi)

- **App:** Asterion's pages become Miadi routes. Its sign-in gate (`lib/asterion/writer.ts`) goes,
  because Miadi already knows who people are. `visibility.ts` stays.
- **Package:** a `@miadi/asterion` package holds the types (`packages/asterion` today), the mapper
  and the registry sync.
- **Deeper, later:** the chart storage into `@medicine-wheel/data-store-postgres`, beats and threads
  into `@medicine-wheel/narrative-engine`, the beat timeline into `@medicine-wheel/ui-components`.

## Before you change the path

- Read `miadisabelle/asterion` `AGENTS.md` for how the gaia instance is rebuilt (`scripts/ops/rebuild.sh`, never `next build` by hand).
- After a change to the reads, probe a signed-out reader and a writer on every public address, as
  the 2026-10-03 change did, and say the counts.
