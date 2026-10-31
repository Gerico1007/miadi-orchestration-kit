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

Someone who wants session restore on a new host runs one install command and one per-user command. They get `miadi-config`, `miadi-tmux`, `miadi-tide` and `miadi-terminal`, nothing outside session restore, and the switch-over from jgwill/miadi-orchestration-kit#I1_NUMBER when tmux is already running.

### What happened

It took four installs and one per-user command, in an order found by trial.

- `miadi-terminal` 0.4.0 only *recommends* `miadi-tide` and `miadi-tmux`. With `--no-install-recommends`, neither arrives.
- `miadi` 0.5.0 depends on all four. It also pulls in `miadi-perms`, `miadi-chronicle-server` and `miadi-node`, which session restore does not need.
- On 2026-10-29, `apt-get -s upgrade` listed `miadi` as kept back, because 0.5.0 needs new packages. A host that only runs `apt upgrade` stays on the older `miadi` and does not get the four.

REPORT_BLOCK

## Action Steps

- [ ] Give session restore one install that pulls in the four packages and nothing else: either `miadi-terminal` turns `miadi-tide` and `miadi-tmux` into Depends, or a small metapackage depends on the four. Which of the two, and its name, is for the maintainers to choose.
- [ ] Have its postinst name the one per-user command: `miadi-terminal enable restore`, with the switch-over from jgwill/miadi-orchestration-kit#I1_NUMBER.
- [ ] Have the README and `miadi-config check` say when `miadi` is kept back, with `sudo apt install miadi` as the command.
- [ ] Extend `test-install.sh`: the one install on a clean Ubuntu 24.04, then `enable restore`, then check the four packages, the three user units and `tide agents list`.

## Structural Tension

Session restore needs four packages that already exist. A user reaches them either through `miadi`, which brings more than restore needs, or by guessing the order of four installs.

## Related

- jgwill/miadi-orchestration-kit#I1_NUMBER: the switch-over for a host already running tmux
- jgwill/miadi-orchestration-kit#I2_NUMBER: agents come back after the restore
- jgwill/miadi-orchestration-kit#62: `apt install miadi` plus one per-user command, the same shape for a whole agent account
- jgwill/miadi-orchestration-kit#52: `miadi-terminal`
- jgwill/miadi-orchestration-kit#55: `miadi-tide`
- jgwill/miadi-orchestration-kit#109: the install-feedback seat that reads this report
