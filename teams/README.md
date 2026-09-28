# Teams

Named 2026-09-28, the morning gaia rebooted, in the witness session `mino-260928-fork-01` with William. The story and the drawings: https://claude.ai/artifact/MArxUrUa8x9YjfCiRL1Dfs (After the Reboot).

## How teams work

- Every terminal session belongs to one team.
- Each team has a **human lead** and an **agent lead**. Leads coordinate with the other teams' leads.
- A team makes packages and practices that the other teams use. It names what it makes and what it uses.
- Each team's practice becomes a skill in this kit, written by the team from its own work.
- A team's section below is kept current by its agent lead.

## T1 · Session continuity

- **Level:** the machine.
- **Desired outcome, in William's words (2026-09-28):** "Picture that I'm rebooting my computer and when it comes back up, all of the sessions are the same way that they were. I should not even know that the computer rebooted."
- **Leads:** William (human). The gaia session `gaia-tmux-rebooted-restore-finetuning-260928` (agent, proposed).
- **Makes:** the capture hooks (`/opt/binscripts/hooks/*`), tmux save and restore (`jgwill/gaia` `14-tmux-resurrect.sh`), tide runtime and its snapshots, the session-observability plugin (jgwill/miadi-orchestration-kit#56), the session inventory format.
- **Uses:** Claude Code's session records (`~/.claude/sessions/<pid>.json`, transcripts), the launch aliases in `~/.bash_aliases` that load each agent's tools and plugins.
- **Open work:** jgwill/binscripts#158, jgwill/Miadi#607 (the line joining a terminal to its agent session and launch).
- **Sessions before the reboot, examples:** `gaia-screen-reboot`, `gaia-var-disk-space`, `miadi-tide-reusable-components-260923`, `episode-019-tide-runtime-orchard`, `miadi-orchestration-kit-apt`, `mia-claude-plugin-mia-episode-companion`.
- **Skill:** not written yet. The agent lead writes it from the restore work.

## T2 · Event path

- **Level:** the application.
- **Desired outcome:** Miadi knows which events travel, what stays attached to them, and how anyone can see that an event arrived or visibly failed.
- **Leads:** William (human). The episode 548 session (agent, proposed).
- **Makes:** the broker choice and its first proof, episode 548 and its community invitation.
- **Uses:** T1's session events (a session starting in a terminal is one event it may carry), the Facebook page skills.
- **Sessions before the reboot, examples:** `kafka`, `miadi-eda-broker-episode-community-prepare`, `miadi-kafka-pto-potentially-as-factory-eda`, `miadi-provider-repo-file-replacement-by-r2-cloudflare`, `miadi-org-webhook-schema-ep074`.
- **Skill:** not written yet.

## T3 · Witness

- **Level:** between William and the teams that build.
- **Desired outcome:** William hears and judges what the building teams produce before anything is revised, and his answers reach them as clear messages.
- **Leads:** William (human). Mino, the `stcbot` seat (agent).
- **Makes:** spoken first impressions and walkthroughs, revision messages, the session inventory (`miadisabelle/workspace` `.mino/session-inventory/`), charts.
- **Uses:** T1's hook capture and Claude Code's transcripts and session list, to see what other sessions received and did.
- **Sessions:** `stcbot`, `mino-260928-fork-01`, `miadi-review-in-episode`.
- **Skill:** `skills/miadi-witness-first-impression` (jgwill/miadi-orchestration-kit#59).

## Not named yet

Other sessions point to teams William has not named: trading (`trading-draw-on-ao-issue-154`, `mia-trading-wave-labeler-blueprint-service`), film production (`mw-film-prod-devops-credibility`), story (`miadi-ncp-story-studio`, `miadi-orchestration-kit-storytelling`), research (`ep316-concordia-pitch-revising`). Naming them is William's.
