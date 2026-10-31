### Packages

miadi-config, miadi-tmux, miadi-tide, miadi-terminal, miadi

### System

Ubuntu 24.04

### What you ran

```shell
# 2026-10-30, eury. Goal: tmux sessions and their agents come back after a reboot.
apt install miadi-tide -y                                         # 00:36  miadi-tide 0.1.12
apt-get install -y --no-install-recommends miadi-terminal         # 01:11  miadi-terminal 0.4.0, miadi-config 0.2.0 -> 0.2.8
apt-get install -y miadi-tmux                                     # 01:29  miadi-tmux 3.7c-2, tmux 3.4 removed
apt install miadi -y                                              # 07:05  miadi 0.5.0, plus miadi-node, miadi-chronicle-client, miadi-perms, miadi-chronicle-server
miadi-terminal enable restore                                     # 12:52
```

### What you expected

Someone who wants session restore on a new host runs one install command and one per-user command. They get `miadi-config`, `miadi-tmux`, `miadi-tide` and `miadi-terminal`, nothing outside session restore, and the switch-over from jgwill/miadi-orchestration-kit#115 when tmux is already running.

### What happened

It took four installs and one per-user command, in an order found by trial.

- `miadi-terminal` 0.4.0 only *recommends* `miadi-tide` and `miadi-tmux`. With `--no-install-recommends`, neither arrives.
- `miadi` 0.5.0 depends on all four. It also pulls in `miadi-perms`, `miadi-chronicle-server` and `miadi-node`, which session restore does not need.
- On 2026-10-29, `apt-get -s upgrade` listed `miadi` as kept back, because 0.5.0 needs new packages. A host that only runs `apt upgrade` stays on the older `miadi` and does not get the four.

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

- [ ] Give session restore one install that pulls in the four packages and nothing else: either `miadi-terminal` turns `miadi-tide` and `miadi-tmux` into Depends, or a small metapackage depends on the four. Which of the two, and its name, is for the maintainers to choose.
- [ ] Have its postinst name the one per-user command: `miadi-terminal enable restore`, with the switch-over from jgwill/miadi-orchestration-kit#115.
- [ ] Have the README and `miadi-config check` say when `miadi` is kept back, with `sudo apt install miadi` as the command.
- [ ] Extend `test-install.sh`: the one install on a clean Ubuntu 24.04, then `enable restore`, then check the four packages, the three user units and `tide agents list`.

## Structural Tension

Session restore needs four packages that already exist. A user reaches them either through `miadi`, which brings more than restore needs, or by guessing the order of four installs.

## Related

- jgwill/miadi-orchestration-kit#115: the switch-over for a host already running tmux
- jgwill/miadi-orchestration-kit#114: agents come back after the restore
- jgwill/miadi-orchestration-kit#62: `apt install miadi` plus one per-user command, the same shape for a whole agent account
- jgwill/miadi-orchestration-kit#52: `miadi-terminal`
- jgwill/miadi-orchestration-kit#55: `miadi-tide`
- jgwill/miadi-orchestration-kit#109: the install-feedback seat that reads this report
