### Packages

miadi-tmux, miadi-terminal

### System

Ubuntu 24.04

### What you ran

```shell
# 2026-10-30, eury. A tmux 3.4 server (Ubuntu's package) was running session 0 with a Claude Code agent in it.
apt-get install -y miadi-tmux                 # 01:29  miadi-tmux 3.7c-2, tmux 3.4 removed
miadi-terminal enable restore                 # 12:52  tmux-server.service enabled, not started
tmux                                          # 13:04  fails, see below
systemctl --user start tmux-save.service      # 13:25  the switch-over that worked
tmux kill-server
systemctl --user start tmux-server.service
```

### What you expected

On a host that already runs tmux, after installing `miadi-tmux` and running `miadi-terminal enable restore` from outside tmux, the running sessions are saved, the old server is stopped, `tmux-server.service` starts 3.7c and restores them, and typing `tmux` works right afterwards.

### What happened

**After the swap, the old tmux server lists sessions but cannot be attached.**
- `miadi-tmux` has no `postinst`. The 3.4 server kept running from a deleted binary: `/proc/<pid>/exe -> /usr/bin/tmux (deleted)`.
- `tmux ls` from 3.7c works against it. Attaching does not. Inside a real pty:
  ```
  $ tmux new-session -s probe 'exit'
  open terminal failed: not a terminal        (exit 1)
  ```
- A fresh 3.7c server on its own socket works. The old binary still attaches through `/proc/<pid>/exe attach -t 0`.

**`enable restore` turns restore on but leaves the running server in place.**
- `/usr/bin/miadi-terminal:480` only enables `tmux-server.service`, with the comment "starting tmux-server.service while a tmux server runs adds a session 0".
- Nothing tells the user how to move over. The save, `tmux kill-server`, start sequence above did it. Until it ran, the first reboot had no shutdown save either: `tmux-server.service` was not active, so its `ExecStop` save would not run.

**Running agents depend on jgwill/miadi-orchestration-kit#114.** `tmux kill-server` ends the agents in the old server. The restore brings their panes back, but on this host the agent was only typed, not relaunched. Until that is fixed, the switch-over is safe for running agents only if the user resumes them by hand.

**Minor, same command.** The `miadi-terminal` postinst says "each user runs 'miadi-terminal enable' once (desktop, terminator, tmux, defaults)". `defaults` comments out lines of the user's `~/.tmux.conf` that repeat `/etc/miadi/tmux.conf`. The message does not say it edits that file.

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

- [ ] Give `miadi-terminal enable restore` a switch-over mode (for example `--now`) that refuses to run inside tmux. When a server is running, it:
  1. saves with `tmux-save.service`
  2. makes sure tide's snapshot is newer than the last agent change
  3. runs `tmux kill-server`
  4. starts `tmux-server.service`
  5. prints `tide agents list`
- [ ] In `miadi-tmux`'s `postinst`, detect tmux servers whose `/proc/<pid>/exe` is deleted, and print the switch-over command for each user who has one. The postinst runs as root and those users may have agents running, so it only reports.
- [ ] Without the switch-over mode, have `enable restore` print the three commands above when a tmux server is running.
- [ ] Say in the postinst message that `enable defaults` comments out lines of `~/.tmux.conf`.
- [ ] Extend `test-install.sh`: start a tmux 3.4 server, install `miadi-tmux`, run the switch-over, check that `tmux` attaches and the session is back.

## Structural Tension

`miadi-tmux` replaces the tmux binary under a server that keeps running, and the new client cannot attach to it. `enable restore` already holds the save and the server unit that would move the user over, and stops one step short of using them.

## Related

- jgwill/miadi-orchestration-kit#114: agents come back after the restore
- jgwill/miadi-orchestration-kit#52: `miadi-terminal`
- jgwill/miadi-orchestration-kit#109: the install-feedback seat that reads this report
- jgwill/gaia#89: tmux brings every session back after a reboot
- `/usr/bin/miadi-terminal` line 480
