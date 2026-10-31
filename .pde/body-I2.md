### Packages

miadi-tide, miadi-terminal

### System

Ubuntu 24.04

### What you ran

```shell
# 2026-10-30, eury (Ubuntu 24.04.4, 31 GB RAM, 14 GB available). Session 0 held one Claude Code agent,
# started as plain `claude` in /home/gmusic. `tide agents list`: 0:1.1 claude running adc302f1 miadi-tide
miadi-terminal enable restore                 # 12:52
systemctl --user start tmux-save.service      # 13:25
tmux kill-server
systemctl --user start tmux-server.service
```

### What you expected

After `tmux-server.service` restores the save, every agent that was running comes back in its pane, in its recorded folder, with the command it was started with and `--resume`. If one cannot start, `tide agents list` says which one and why.

### What happened

The restore ran. The agent did not come back by itself. `~/.miadi/navigator/restore/hook-261030-132544.log`:
```
13:25:44 tmux restore finished; starting /usr/bin/tide agents restore
snapshot …17:24:45: 1 panes held an agent; room for 0 above the memory floor, started oldest first
typed: memory floor    0:1.1  claudeissue --resume adc302f1-81c5-4437-b52a-c709b918800a
```
Five causes, each seen on this host. They share one path, from the post-restore hook to `tide agents restore`:

1. **Memory floor.** `tide agents restore` defaults to `--memory-floor-gb 16`, and the hook passes no flags. The host had 14 GB available out of 31 GB, so tide typed the command and did not run it. Whether 16 GB is the intended default for a 31 GB host is the maintainers' policy; this report only records what it did here.
2. **Wrong launch alias.** The agent had been started as plain `claude`, and `MIADI_LAUNCH_ALIAS` was not exported. `tide_runtime/launchers.py:344` inferred `claudeissue` from the user's aliases (`"how": "inferred alias"`).
3. **Typed into a shell that was still starting.** The keys reached the pane before the login shell finished its startup files, and they arrived scrambled. The pane showed a bare prompt with nothing typed.
4. **Wrong folder.** The pane's recorded folder was `/home/gmusic`, but `~/.bash_profile` changed to another folder at login. The typed command has no `cd`, so `claude --resume` opened that other project's session picker ("No sessions match").
5. **Wrong `tide` possible.** `restore-agents.sh:22-30` tries `$HOME/.local/share/tide-runtime/venv/bin/tide` (absent here), then `command -v tide`. Started by systemd, the hook got `/usr/bin/tide`, which is correct. From a login shell it would get `/opt/anaconda3/bin/tide` (ironsilk 0.9.34, which has no `agents` command).

What brought the agent back by hand: wait for the prompt, then `cd /home/gmusic && claude --resume adc302f1-81c5-4437-b52a-c709b918800a`.

### miadi-config report

```
### System
Ubuntu 24.04.4 LTS
Linux 7.0.0-38-generic x86_64
Python 3.13.5

### Miadi packages
ii  miadi 0.5.0
ii  miadi-chronicle-client 0.1.3
ii  miadi-chronicle-server 0.1.2
ii  miadi-config 0.2.8
ii  miadi-node 24.21.0-1
ii  miadi-perms 0.1.0
ii  miadi-terminal 0.4.0
ii  miadi-tide 0.1.12
ii  miadi-tmux 3.7c-2

### miadi-tide/SOURCE
ironsilk 0.9.48: jgwill/Miadi runtime/tide-runtime @ 70bc485a3c14
@miadi/tide-contract 0.3.5: jgwill/Miadi packages/tide-contract @ 70bc485a3c14
@miadi/tide 0.6.8: jgwill/Miadi packages/tide @ 70bc485a3c14

### User units
miadi-capture-service.service disabled enabled
tide-runtime.service          enabled  enabled
tide-store-prune.service      static   -
tmux-save.service             static   -
tmux-server.service           enabled  enabled
tide-store-prune.timer        disabled enabled
tmux-save.timer               enabled  enabled
```

## Action Steps

- [ ] In `tide agents restore`, before typing or running a command, wait until the pane's shell is at its prompt.
- [ ] Prefix the command with `cd <recorded cwd> &&`.
- [ ] When the recorded argv is the bare `claude`, relaunch `claude`, not an alias inferred from the user's aliases.
- [ ] Make the memory floor fit the host: the hook reads a variable such as `MIADI_TIDE_MEMORY_FLOOR_GB`, or the default scales with `MemTotal`.
- [ ] Have `tide agents list` show a pane whose command was typed and is waiting for Enter.
- [ ] In `restore-agents.sh`, check `/usr/lib/miadi-tide/tide-runtime/bin/tide` before `command -v tide`.
- [ ] Add a test: an agent pane started as bare `claude`, a `cd` in `.bash_profile`, available memory under the floor; after restore, the pane is in its folder and its agent is resumed or reported.

## Structural Tension

tide already knows which agent ran in each pane and with which session id. After a restore on this host, that agent waited in its pane, typed under the wrong name and without its folder, and the typed text was lost to a shell still starting.

## Related

- jgwill/miadi-orchestration-kit#55: `miadi-tide`
- jgwill/miadi-orchestration-kit#56: `miadi-session-observability`, which records the session ids that `--resume` uses
- jgwill/miadi-orchestration-kit#109: the install-feedback seat that reads this report
- jgwill/Miadi#691: `tide agents restore`
- jgwill/gaia#89: the tmux-resurrect post-restore hook
- `/usr/share/miadi-terminal/session-continuity/restore-agents.sh` lines 22–30; `tide_runtime/launchers.py` line 344
