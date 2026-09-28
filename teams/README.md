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
- **Leads:** William (human). The gaia session `gaia-tmux-rebooted-restore-finetuning-260928` (agent).
- **Makes:** the capture hooks (`/opt/binscripts/hooks/*`) and their binding line (`hooks/claude_hooks/terminal_binding.sh`: every agent session start, end and rename with its tmux `session:window.pane`, argv and name), tmux save and restore (`jgwill/gaia` `14-tmux-resurrect.sh`), tide runtime and its snapshots, the session-observability plugin (jgwill/miadi-orchestration-kit#56), the session inventory format.
- **Uses:** Claude Code's session records (`~/.claude/sessions/<pid>.json`, transcripts), the launch aliases in `/opt/binscripts/etc/bash_aliases_common` that load each agent's tools and plugins.
- **Proposal:** https://claude.ai/artifact/Hu5WwqkWTsGQuwESxwmD5q (Tmux Agent Restore, revision 2).
- **Done 2026-09-28:**
  - A1, which agent each tmux session held at the crash of Sunday 2026-09-27 19:31:47: `miadi-chronicle/_staging_for_new_episodes/gaia-miadi-tide-runtime-session-inventory-enhancements-260928/A1-recovery-candidates.md` in the episodes repository, with the launcher inventory `RP1-launch-aliases.md` beside it.
  - A2, the binding line, jgwill/binscripts@817eb85, checked in one tmux pane through start, rename, /clear, exit, resume and exit.
  - tide's last snapshot before the crash kept at `~/.miadi/navigator/context/snapshot-20260927T233141Z-precrash-preserved.json` on gaia. The tide daemon runs again since 10:06, after its stale pid file (a thread id of another program) kept it down, and a start guard in its service (`tide-runtime.service.d/10-stale-pid.conf`) now clears such a file (A8, tested).
  - Measured for William's tide and herdr question: a tmux save of 68 sessions with visible screens costs 12.6 s and 13.5 s of CPU and does not interrupt typing; full scrollback blocks every pane for about 1.4 s per 47,000-line pane.
- **Open work:** jgwill/gaia#89 (A3, tmux saves with screens and the restore brings agents back), jgwill/Miadi#691 (A4, tide starts after a reboot and names the agent in each pane), jgwill/binscripts#158 (A6, the other seven agents write the same line), jgwill/Miadi#607.
- **Waiting on William:** D6, go for A3 and A4, recommended as O3: tmux keeps layout and visible screens, and tide brings agents back, for tmux now and herdr later. D7, which of the sessions that differ from the crash to close or recreate. D8, whether the T1 practice ships as a skill or in the plugin.
- **Sessions:** `gaia-tmux-rebooted-restore-finetuning-260928` (outside tmux). Before the crash, for example `gaia-var-disk-space`, `miadi-tide-reusable-components-260923`, `episode-019-tide-runtime-orchard`, `miadi-orchestration-kit-apt`, `mia-claude-plugin-mia-episode-companion`.
- **Skill:** held while William decides whether a team's practice ships as a skill or inside the session-observability plugin.

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
- **Proposed, William 2026-09-28: an inventory agent.** Until now the inventory was made by hand. William gives a session name, Mino looks at the session, works out what it is doing and where it stands, and records it, either after `/exit` gives the session id or while it keeps running. An inventory agent would do this for every session. It would read T1's binding line (every start, rename and end, with the terminal and the launch) and the session's transcript, then write and update the inventory entry with its meaning: mission, relations, state, and what needs William. It builds on T1's line (A5 in the Tmux Agent Restore proposal). Where it runs is not decided.

## Not named yet

Other sessions point to teams William has not named: trading (`trading-draw-on-ao-issue-154`, `mia-trading-wave-labeler-blueprint-service`), film production (`mw-film-prod-devops-credibility`), story (`miadi-ncp-story-studio`, `miadi-orchestration-kit-storytelling`), research (`ep316-concordia-pitch-revising`). Naming them is William's.
