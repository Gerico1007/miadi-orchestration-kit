# Held ledger: Eury install feedback (2026-10-30)

Filed on 2026-10-30 by Gerico1007, from PDE `2610302137--fcc3210c-1e7b-4fd5-9192-69af5bd11759`:

- I2 jgwill/miadi-orchestration-kit#114: agents come back after a restore (five causes)
- I1 jgwill/miadi-orchestration-kit#115: switch-over for a host already running tmux (+ K4, K5)
- I3 jgwill/miadi-orchestration-kit#116: one install for the four restore packages (+ K1)

Held, each with what it waits for:

| item | waits for |
|---|---|
| K6 ready-to-reboot check and what-came-back report | the A1 reboot test on Eury, which ends live agents and other accounts' sessions: needs a reboot window agreed with the people running them |
| K7 herdr sessions come back after a reboot | A1, and where it belongs (kit tide, upstream herdr, or both) |
| K8 declared Docker containers checked after boot | A1, and whether it lives in the kit |
| 16 GB memory floor as a default | the maintainers' answer on jgwill/miadi-orchestration-kit#114 |

Not filed, on purpose: K2 of the review plan (wrong: a 3.7c client cannot attach to a 3.4 server); `claude attach` needing the short id (Claude Code, not the kit); the host-local `~/.local/miette-claude-bin/claude` shim (not in the kit).

- I4 jgwill/miadi-orchestration-kit#117: the miadi-tide README names the capture hooks each agent needs (filed 2026-10-31)
