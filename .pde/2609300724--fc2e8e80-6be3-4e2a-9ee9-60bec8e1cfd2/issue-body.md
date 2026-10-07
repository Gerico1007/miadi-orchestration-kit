## Context

On 2026-09-30, user jgi on gaia switched from the hand-wired `/opt/binscripts/hooks/claude_hooks` to the `miadi-session-observability` plugin, and the milestone draft "Miadi-Factory-Observability-Doc4Chronicle" documents what a user needs around it: the capture variables, the launchers, the MCP configs and the teams list. Each of those was set up by hand. This issue records what `packages/miadi/deb` provides for them today, read from the package trees, the published apt index and gaia.

**What is built and what is published**

| package | in `packages/miadi/deb` | on apt.sanctuaireagentique.com | on gaia |
|---|---|---|---|
| `miadi` | 0.3.0 (depends on `miadi-tide`) | 0.2.0 | 0.2.0 |
| `miadi-config` | 0.2.2 | 0.2.2 | 0.2.2 |
| `miadi-terminal` | 0.1.3 | 0.1.3 | 0.1.3 |
| `miadi-tide` | 0.1.0, built in `dist/` | not published | not installed |

- The built `miadi-tide_0.1.0_amd64.deb` carries `ironsilk-0.9.34`. `tide agents list` and `tide agents restore`, which bring agents back after a reboot, need 0.9.35 or later. PyPI has 0.9.36.
- jgi's `tide` on gaia is `ironsilk` 0.9.32 from a conda env and has no `agents` command.

**What `miadi-config` covers**

- `env.sh:103` builds `MIADI_SESSION_DIR` from `MIADI_SESSIONDATA_ROOT` ("goes away later"). The milestone makes `MIADI_SESSION_DIR` the only capture variable. `settings` and the `miadi.env` template still name `MIADI_SESSIONDATA_ROOT` and do not list `MIADI_SESSION_DIR`.
- `env.sh:60` defaults `MIADI_ORCHESTRATION_KIT_ROOT` to `$MIADI_REPOS_ROOT/jgwill/miadi-orchestration-kit`, but nothing creates that clone and `settings` does not list the variable. Without the clone, the plugin records every session's team as `unassigned`.
- `settings` does not list `MIADI_TEAM`, `MIADI_LAUNCH_ALIAS`, `MIADI_CHRONICLE_PROD_EPISODE` or any `MIADI_MCP_CONFIG_*`.

**What no package provides**

- **The plugin install.** It is done by hand for each user: `claude plugin marketplace add jgwill/miadi-orchestration-kit`, `claude plugin install miadi-session-observability@miadi-orchestration-kit`, then remove the `claude_hooks` entries from `~/.claude/settings.json` with a backup, keeping other hooks such as herdr's. Claude Code applies that edit at once, so a running session captures nothing until it restarts (`claude/miadi-session-observability/README.md`).
- **The launchers.** `claudeyolo`, `claudeyolochronicle` and `claudeyolochroniclehoncho` are defined in binscripts' `etc/bash_aliases_common`, which is private. Its own TODOs (lines 7251 and 7252) name the apt packages as their destination. In the binding lines up to 2026-09-30, `claudeyolochroniclehoncho` launched 22 sessions and `claudeyolo` 18.
- **The MCP configs.**
  - `MIADI_MCP_CONFIG_VOICE` runs `$MIADI_SRC/packages/voice-mcp/dist/index.js` from a local build, although `@miadi/voice-mcp` 0.4.3 is on npm.
  - `MIADI_MCP_CONFIG_MW_CHRONICLE` runs `@medicine-wheel/mcp` pinned at 4.15.6. npm has 4.15.8.
  - `MIADI_MCP_CONFIG_HONCHO` points into another user's home (`/home/mia/workspace/.mcp.honcho.json`), and that file holds its bearer token inline.
- **The chronicle tools.** `mkepisode` comes from npm `passages` (0.3.9) and is installed by hand.

## Desired State

A new user on a Miadi host runs `sudo apt install miadi` and then one per-user command, and ends up with:

- the capture plugin, installed from the kit's GitHub marketplace, with no hooks wired in `settings.json`
- `MIADI_SESSION_DIR` as the one capture variable
- a clone of the kit that the teams list is read from
- the launchers, each recording `MIADI_LAUNCH_ALIAS`
- MCP configs that run the npm packages and read tokens from `~/.env`
- `tide agents restore` from `miadi-tide`

`miadi-config check` says what that user still lacks. The same flow passes in a clean container before anything is published.

## Action Steps

- [ ] Rebuild `miadi-tide` with `ironsilk` 0.9.35 or later, bump its version, and run `test-install.sh` on `ubuntu:22.04` and `ubuntu:24.04`.
- [ ] Publish `miadi-tide` first, then `miadi` 0.3.0, in the order the deb README gives.
- [ ] In `miadi-config`, list `MIADI_SESSION_DIR`, `MIADI_ORCHESTRATION_KIT_ROOT`, `MIADI_TEAM`, `MIADI_LAUNCH_ALIAS` and `MIADI_CHRONICLE_PROD_EPISODE` in `settings`, and switch the `miadi.env` template to `MIADI_SESSION_DIR`.
- [ ] Make `miadi-config check` report a missing kit clone and a missing plugin.
- [ ] Ship the launchers as a package file, for example `/usr/share/miadi/launchers.sh`, starting with `claudeyolo`, `claudeyolochronicle` and `claudeyolochroniclehoncho`. Binscripts then sources that file instead of defining them itself. The shapes are in the milestone draft.
- [ ] Ship MCP config templates that run `npx -y @miadi/voice-mcp` and `npx -y @medicine-wheel/mcp` and use `${VAR}` for URLs and tokens.
- [ ] Give the Honcho config the same shape, reading its URL and token from the user's `~/.env` instead of another user's home.
- [ ] Add a per-user command, like `miadi-terminal enable`. Run by the user, it:
  - clones or updates the kit at `MIADI_ORCHESTRATION_KIT_ROOT`
  - installs the plugin from the marketplace
  - removes the `claude_hooks` entries from `~/.claude/settings.json`, keeping a backup and every other hook
  - writes the MCP configs to `~/.config/miadi/`
  - adds one line to `~/.bashrc` that sources the launchers
  - tells the user to restart running sessions

  Whether this goes in `miadi-config` or a new package, and what the command is called, is William's decision.
- [ ] Decide whether `passages` (for `mkepisode`) joins the distribution, and how, since it is an npm package.
- [ ] Extend `test-install.sh` or `runtime/miadi-host` (miadisabelle/workspace) to cover the per-user command. Create a user, run the command, feed the plugin's `session_start_hook.sh` a sample event, and check that a binding line appears with `team`, `launch_alias` and `episode`.
- [ ] Try the flow on one real account, jgi on gaia: upgrade to `miadi` 0.3.0, run the per-user command, and record what `miadi-config check` reports. This changes gaia system-wide, so it waits for William.

## Structural Tension

The plugin, the teams list, the launchers and the MCP configs now determine how an agent session is observed, grouped by team and brought back after a reboot. A user gets them only by hand, from gaia's history and a private aliases file. The apt packages already own the host's settings and tide, and they can deliver a user's account setup the same way.

## Related

- jgwill/miadi-orchestration-kit#56: the `miadi-session-observability` plugin and its cutover rule
- jgwill/miadi-orchestration-kit#55: `miadi-tide`
- jgwill/miadi-orchestration-kit#52: `miadi-terminal`, whose `enable` is the model for a per-user command
- jgwill/Miadi#691: tide 0.9.36
- jgwill/Miadi#697: teams, and how this work reaches jgwill/Miadi
- jgwill/binscripts#158: the binding line for the other agents
- Milestone: Miadi-Factory-Observability-Doc4Chronicle (being drafted)
- `packages/miadi/deb/README.md`, `packages/miadi/deb/miadi-config/usr/share/miadi/env.sh`, `packages/miadi/deb/miadi-config/usr/share/miadi/settings`
- `claude/miadi-session-observability/README.md`, `teams/teams.json`
- Decomposition: `.pde/2609300724--fc2e8e80-6be3-4e2a-9ee9-60bec8e1cfd2/`
