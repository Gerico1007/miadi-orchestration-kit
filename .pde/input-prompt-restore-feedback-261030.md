# Input prompt: publish the Eury install feedback to jgwill/miadi-orchestration-kit

Written 2026-10-30 on Eury (account gmusic) by the Claude session `cc421423-ce95-487b-816c-d873bbe85933`.

## The person's words, in order

1. (/fork, 13:1x) "I want us to contribute to the creator of this package that we are working on. We don't work on it, we use it. So it's a package that permits the computer to be able to restart session after a reboot. [...] I just tried to install it here and I realized that there are something to modify. It's basically some command that could be run after an installation. So save the actual Tmux and save [...] the save dot services. So and after kill the Tmux and start the Tmux. So it will permit someone installing that package to be able to continue his session without having to questioning if we will lose some stuff or not. [...] We needed to install the miadi terminal too, and probably other stuff. So there is four components that is important in the usage of this. So those four components should be installed with the install of the main one. So gather all information that we made in that conversation to facilitate the installation to another computer by only one command."
2. (13:4x) "ok le feed back peuvent etre publier sur le repo https://github.com/jgwill/miadi-orchestration-kit/issues"

## Material already written

- `/home/gmusic/salix/production/MIADI-RESTORE-ISSUE-DRAFT-2026-10-30.md`: a five-section draft for the switch-over of a host whose tmux 3.4 is already running, and the five reasons the agent did not come back by itself after the restore (memory floor, inferred `claudeissue` alias, keys typed into a shell still starting, no `cd` to the recorded folder, `tide` lookup order).
- `/home/gmusic/salix/production/MIADI-INSTALL-REVIEW-PLAN-2026-10-30.md`: findings K1 to K5 (minor), requests K6 to K8 (reboot check and report, herdr restore, Docker containers after boot), open question Q1 (one report or several issues). Its K2 is wrong: a 3.7c client lists a 3.4 server's sessions but cannot attach to it. Its K3 and K4 are covered by the draft above. Its A1 reboot test has not been run.

## Facts verified in this session

- 13:04: `tmux` (3.7c client) against the running 3.4 server, in a real pty: `open terminal failed: not a terminal`, exit 1. The server's `/proc/<pid>/exe` pointed to `/usr/bin/tmux (deleted)`.
- 13:25: `systemctl --user start tmux-save.service`, `tmux kill-server`, `systemctl --user start tmux-server.service` gave a 3.7c server with session `0`. The hook log `~/.miadi/navigator/restore/hook-261030-132544.log` shows `tide agents restore` ran and typed `claudeissue --resume adc302f1-…` because of the 16 GB memory floor (14 GB available). The typed text was lost in the starting shell.
- The agent was brought back by hand with `cd /home/gmusic && ~/.local/bin/claude --resume adc302f1-…`.
- `claude attach` needs the short id; the full uuid answers "No job matching". That belongs to Claude Code, not the kit.
- The broken `~/.local/miette-claude-bin/claude` shim is host-local: nothing in the kit references it, and the script it calls was never in the kit's history.

## Channel

jgwill/miadi-orchestration-kit, form "Installation report" (title `[install] `, label `feedback:install`, fields Packages, System, What you ran, What you expected, What happened, miadi-config report). Per jgwill/miadi-orchestration-kit#109, a seat reads a new report within 5 minutes, ships minor fixes and brings major ones to William. Filing account: Gerico1007 (`gh`), outside the maintainers' circle, so the issue wakes a seat and must be final when sent.

## Question for the decomposition

Which issues to open now, with what content, and what waits (for the reboot test or for a maintainer's decision)?
