### Packages

miadi-tide, miadi-terminal

### System

Ubuntu 24.04

### What you ran

```shell
# 2026-10-31, eury, after the reboot test reported on jgwill/miadi-orchestration-kit#114.
dpkg -s miadi-tide miadi-terminal | grep -E '^(Depends|Recommends|Suggests):'
less /usr/share/doc/miadi-tide/README /usr/share/doc/miadi-terminal/README
less /usr/lib/miadi-tide/tide-runtime/lib/python3.12/site-packages/tide_runtime/pane_agents.py
grep -n hooks: ~/.hermes/config.yaml
cat ~/.pi/agent/settings.json
```

### What you expected

The package documentation says what `tide agents restore` needs in order to bring each kind of agent back, and where each prerequisite comes from, so a user can tell before a reboot which of their agents will return.

### What happened

The restore depends on capture hooks that no package installs and no README names.

- tide records no session itself. `pane_agents.py` reads two sources: Claude Code's own `~/.claude/sessions/<pid>.json` for a running Claude, and the binding lines in `<sessiondata>/data/terminal_bindings.jsonl` for everything else.
- On this host, the binding lines come from hooks in `/opt/binscripts/hooks/`, a clone of jgwill/binscripts, which is a private repository:
  - Hermes: `hermes_hooks/session_start_hook.sh` and `session_end_hook.sh`, wired by hand under `hooks:` in `~/.hermes/config.yaml`.
  - Pi: `pi_hooks/event_capture.ts`, which must be listed under `extensions` in `~/.pi/agent/settings.json`. On this account it is not listed, so a Pi agent in a tmux pane would not come back.
  - Claude: `claude_hooks/terminal_binding.sh` from binscripts, or the same script from this kit's `miadi-session-observability` plugin.
- The only mention of this prerequisite is a code comment in `pane_agents.py`, which points to jgwill/binscripts#158.
- `miadi-tide` depends on `tmux`, `jq` and a Python venv. Its README and the restore paragraph of the `miadi-terminal` README say that tide "relaunches each agent with its session". Neither names the hooks.
- The launch alias that tide types back also comes from binscripts: the aliases in `/opt/binscripts/etc/bash_aliases_common` export `MIADI_LAUNCH_ALIAS`. Without it, tide infers an alias (jgwill/miadi-orchestration-kit#114).

So a host installed from apt alone gets its Claude agents back, and its Pi and Hermes agents come back as empty shells.

### Proposed text

For `packages/miadi/deb/miadi-tide/usr/share/doc/miadi-tide/README`, with one line in the restore paragraph of the `miadi-terminal` README pointing to it:

```
What tide needs to bring an agent back

tide records no session itself. After a restore it relaunches the agents it
saw in each pane, from what other tools wrote:

  Claude Code  ~/.claude/sessions/<pid>.json, written by Claude Code itself.
               Resumed with `claude --resume <id>`, or with its launch alias.
  Pi           a line in <sessiondata>/data/terminal_bindings.jsonl, written by
               a capture extension listed in ~/.pi/agent/settings.json.
               Resumed with `pi --session <id>`.
  Hermes       a line in the same file, written by capture hooks listed under
               hooks: in ~/.hermes/config.yaml. Resumed with `hermes --resume <id>`.
  Codex        not seen. tide has no resume rule for it.

Without its capture hooks, a Pi or Hermes pane comes back as an empty shell.
A Claude agent that had exited before the save is also known only from that
file, through the Claude capture hooks (the miadi-session-observability plugin).

<sessiondata> is the first of CLAUDE_SESSIONDATA_ROOT, MIADI_SESSION_DIR,
MIADI_SESSIONDATA_ROOT and SESSION_DATA_ROOT that is set, else /src/_sessiondata.

The launch alias is the one named in MIADI_LAUNCH_ALIAS when the launcher
exported it. Otherwise tide infers one from the user's interactive aliases.

Check before a reboot: `tide agents list` shows each pane's agent and session id.
A pane missing from it will not be relaunched.
```

Where the Pi and Hermes hooks come from for someone outside the maintainers' hosts is for the maintainers to say, since jgwill/binscripts is private. jgwill/miadi-orchestration-kit#99 plans a Pi session-observability package.

## Action Steps

- [ ] Add the "What tide needs to bring an agent back" section to the `miadi-tide` README.
- [ ] In the restore paragraph of the `miadi-terminal` README, point to that section.
- [ ] Name, in that section, where a user outside the maintainers' hosts gets the Pi and Hermes capture hooks, or say that only Claude is supported for them today.
- [ ] Keep the table in step with `RESUME_RULES` in `launchers.py`: a kind added there gets a line here.

## Structural Tension

tide brings back only the agents whose sessions other tools recorded, and the tools that record Pi and Hermes sessions live in a private repository that no package or README names. A user reads that tide relaunches each agent, and learns otherwise only after a reboot.

## Related

- jgwill/miadi-orchestration-kit#114: agents come back after a restore (inferred launch alias)
- jgwill/miadi-orchestration-kit#56: `miadi-session-observability`, the Claude capture plugin
- jgwill/miadi-orchestration-kit#99: a Pi session-observability package
- jgwill/miadi-orchestration-kit#62: the per-user command that would install the capture plugin
- jgwill/binscripts#158: every event carries the pane it happened in
- jgwill/Miadi#691: `tide agents restore`
- `tide_runtime/pane_agents.py` (module docstring); `tide_runtime/launchers.py` (`RESUME_RULES`)
