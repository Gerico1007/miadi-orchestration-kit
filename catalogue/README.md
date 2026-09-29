# Catalogue of results

Results the Miadi teams made that can be used again: in a Chronicle episode, in a documentary for the film production, or in a post on the Guillaume Coder or Tushell Facebook pages. Started 2026-09-29 from William's request in jgwill/miadi-orchestration-kit#60.

Each entry has a code (`C` for catalogue entry) that stays the same when the list grows. Each one says what the result is, who made it, where it lives, who can see it today, and what is missing before it can go in a post.

## How it works

- A result lands first in a GitHub issue: the text, the screenshot, the video link. The issue gets the label `usable-data`. The label exists in jgwill/miadi-orchestration-kit, jgwill/Miadi, jgwill/gaia and jgwill/binscripts.
- List the labelled issues of one repository: `gh issue list -R jgwill/<repo> --label usable-data --state all`. Across all jgwill repositories: `gh search issues --owner jgwill --label usable-data` (its index can lag a few minutes behind a new label).
- An entry here adds what the issue does not hold: the team and session that made it, the episode it belongs to, and whether it can be shown publicly.
- Nothing here is a post. A Page post is drafted by Kherix and waits in `~/.kherix/facebook/guillaume-coder/approvals/pending/` on gaia until Guillaume approves it. A proposal moves that approval into a talking circle on the platform (`packages/community/PAGE-POST-CIRCLE.md` in jgwill/Miadi, jgwill/Miadi#642). The Tushell page has no approval lane yet.

## The reboot of 2026-09-28

gaia crashed on Sunday 2026-09-27 at 19:31 and rebooted on Monday morning. That day three teams were named (`teams/README.md`) and the sessions were brought back. No episode holds this story yet. Its material is staged in the episodes repository at `miadi-chronicle/_staging_for_new_episodes/gaia-miadi-tide-runtime-session-inventory-enhancements-260928/`.

### C1 · After the Reboot, the witness page

- **What:** the story of the morning after the crash, with the drawings that named the three teams.
- **Made by:** T3 Witness, session `mino-260928-fork-01`, with William, 2026-09-28.
- **Where:** https://claude.ai/artifact/MArxUrUa8x9YjfCiRL1Dfs
- **Visibility:** a claude.ai page shared with anyone who has the link, according to the artifact service at its last publish (checked by the witness, 2026-09-29).
- **Before a post:** none for the link.

### C2 · The walkthrough video

- **What:** William's spoken walkthrough, recorded over C1.
- **Made by:** William with T3, 2026-09-28.
- **Where:** https://youtu.be/bZ87ypPXPnA
- **Visibility:** on YouTube, channel JGWill. Its title is still the session name `mino-260928-fork-01-…-002-witness-team`.
- **Before a post:** a title a reader understands.

### C3 · Tmux Agent Restore, the proposal page

- **What:** the plan to bring every session back after a reboot, revision 4, with William's decision D6: tmux keeps the layout and the visible screens, tide brings the agents back.
- **Made by:** T1 Session continuity, agent lead `gaia-tmux-rebooted-restore-finetuning-260928`, 2026-09-28.
- **Where:** https://claude.ai/artifact/Hu5WwqkWTsGQuwESxwmD5q
- **Issues:** jgwill/gaia#89, jgwill/Miadi#691, both labelled.
- **Visibility:** a claude.ai page. Both issues are in private repositories.

### C4 · What the crash measured

- **What:** at 19:31:41 tide's snapshot held 54 tmux sessions, 64 panes and 29 windows running `claude`. The newest tmux save was 30 hours older than the crash. Restoring it brought back 67 sessions: 22 had been closed before the crash, and 9 open at the crash were missing. A full scrollback of 47,000 lines blocks tmux for 1.3 to 1.4 s, while the visible screen takes 13 ms. The tide daemon stayed down from 05:38 to 10:06 because of a stale pid file.
- **Made by:** T1.
- **Where:** jgwill/gaia#89 (closed), jgwill/Miadi#691.
- **Visibility:** private repositories.
- **Before a post:** none for the numbers. The issues themselves stay private.

### C5 · Which agent each tmux session held

- **What:** for every tmux session open at the crash, the agent sessions it probably held and how strong each match is (A1), and the launch aliases that load each agent's tools (RP1).
- **Made by:** T1, 2026-09-28.
- **Where:** `A1-recovery-candidates.md` and `.json`, `RP1-launch-aliases.md` in the staging folder above.
- **Visibility:** the episodes repository on gaia.

### C6 · The resurrection of nine sessions

- **What:** the nine tmux sessions that were open at the crash and in no save, recreated in their folders. Each pane shows a note: the candidate agent sessions and how strong each match is, whether an agent ran at the crash, the inventory status, and the resume command. The command was typed without Enter only where the match was strong and the work was not complete.
- **Made by:** T3, `mino-260928-fork-01`, on William's go (D7: "creating new sessions, there is nothing destructive on that, but don't close anything"), 2026-09-28 at 18:14.
- **Where:** jgwill/miadi-orchestration-kit#60 (note and screenshot). The script, the nine notes and a README are in `witness-recreation-260928/` in the staging folder, episodes commit 450aed5.
- **Lasting form:** `tide agents restore` (jgwill/Miadi#691).
- **Visibility:** public issue.
- **Before a post:** none for the screenshot.

### C7 · What now brings sessions back

- **What:** the binding line (every agent session start, rename and end with its tmux pane, command line and team), jgwill/binscripts@817eb85. tmux saves every 15 minutes with visible screens, jgwill/gaia@8c82a36. tide 0.9.35 starts after every reboot, names the agent in each pane and brings agents back with their launch alias, jgwill/Miadi@ffdcfa90.
- **Made by:** T1, 2026-09-28.
- **Visibility:** private repositories. tide is public on PyPI as `ironsilk` 0.9.35.

### C8 · The session-observability plugin

- **What:** a Claude Code plugin with the capture hooks, the binding line with each session's team, and the session-continuity skill. Version 0.1.0 at 92a2931, 0.1.1 at e49f495. Its issue records what was lost before it: the 90-day cost report read $5,117.85 when July and August alone had been near $10k, and 201 of 2,369 end-of-session transcript copies were empty.
- **Made by:** T1, 2026-09-28.
- **Where:** `claude/miadi-session-observability/` in this repository, jgwill/miadi-orchestration-kit#56. The page https://claude.ai/artifact/8mGQMnj4niSUdVayYSDYk8 is private.
- **Visibility:** public repository and issue.

### C9 · The three teams

- **What:** Session continuity (T1), Event path (T2) and Witness (T3), each with a human lead and an agent lead, what it makes and what it uses.
- **Made by:** William with T3, 2026-09-28.
- **Where:** `teams/README.md` and `teams/teams.json` in this repository.
- **Visibility:** public repository.

### C10 · A review whose Internal Usage names the teams

- **What:** the Miadi review "10 Levels of Jev: Architecting Fast, Cost-Effective Agentic Decisions". Its Internal Usage section places the three teams.
- **Where:** https://miadi-review-service.vercel.app/review/b02ec47d-cd92-4829-84ed-238aafd1d9d6
- **Visibility:** public page.

### C11 · The witness practice

- **What:** how the witness team hears another agent's page for William as a first impression he can play on his phone, before any revision is sent.
- **Made by:** T3.
- **Where:** `skills/miadi-witness-first-impression` in this repository, jgwill/miadi-orchestration-kit#59.
- **Visibility:** public repository and issue.

## Episode 351 · A Benchmark Made of Our Earned Rules

### C12 · The benchmark episode and its circle

- **What:** the script of a benchmark made from our Earned rules. Five first tasks (B1 to B5: finish line, the gate word, exit code truth, five-stage episode, rule precedence), a sandbox whose outward doors are fake, scoring by scripts over repeated runs, and a prompt library kept in Langfuse in the shape of BridgeBench's prompts (code, domain, a "look for" line). The Langfuse keys already in Miadi listed 45 prompts. The Bench page is designed, not built. A talking circle is open, with Mia's first turn "What a benchmark of our own would let us do".
- **Made by:** session `miadi-bench` (`b3123137`) with William, 2026-09-23, in tmux `miadi-bench-langfuse-autoresearch-episode-351`. That tmux session is one of the nine in C6. Nothing has run in it since 2026-09-23.
- **Where:** `miadi-chronicle/2026-09-23-episode-351-a-benchmark-made-of-our-earned-rules/`, episodes commit 4b8b6e5. Served at https://miadi.sanctuaireagentique.com/chronicle/2026-09-23-episode-351-a-benchmark-made-of-our-earned-rules
- **Open:** the circle asks William which failure has cost the most. His answer becomes the first task.
- **Visibility:** public episode page.
- **Before a post:** no issue holds it yet, and the circle's question is unanswered.

## Episode 548 · Before Choosing a Broker

### C13 · Episode 548 and its Page drafts

- **What:** how the event inquiry is prepared before any broker is chosen, and an invitation to advise.
- **Made by:** T2 Event path with Kherix, 2026-09-27 and 2026-09-28. Continues episode 547.
- **Where:** https://miadi.sanctuaireagentique.com/chronicle/2026-09-27-episode-548-before-choosing-a-broker-preparing-the-question-together. Drafts in `~/.kherix/facebook/guillaume-coder/approvals/pending/`: `2026-09-28-episode-548-visual-preview-v2.md` (current), `2026-09-27-episode-548-preparing-the-question.md` (superseded), and `2026-09-26-miadi-event-broker-intent.md`. Tracker miadisabelle/kherix-hermeneia#70.
- **Visibility:** public episode page. The drafts are not approved and not posted.
- **Before a post:** Guillaume's approval of the exact text.

## tide and ironsilk documentation

### C14 · tide described as it is

- **What:** tide's documentation rewritten to match what shipped. The ironsilk README says the package is `ironsilk`, which was `hermes-navigator` up to 0.9.2, and that `tide-runtime` on PyPI belongs to someone else. A new page, `docs/how-tide-helps-the-work.md`, explains what tide does for the work. The tide specs gain `15-agent-continuity` and `16-steering-clients-and-cockpit`, and their STATUS is rewritten. The Miadi docs page for tide shows its four parts, the moments they serve, the gate and the restore.
- **Made by:** T1, session `miadi-18-ba` in tmux `miadi-tide-runtime-pypi-org-ironsilk`, 2026-09-29.
- **Where:** jgwill/Miadi@bdff1bc9 (`runtime/tide-runtime/README.md`, jgwill/Miadi#359), jgwill/Miadi@c1abc91f (`rispecs/tide-runtime`, jgwill/Miadi#265), jgwill/Miadi@3fe800e9 (`app/docs/miadi-agent/tide`, jgwill/Miadi#381), live on Miadi at `/docs/miadi-agent/tide`.
- **Visibility:** private repository. The docs page is live on Miadi.
- **Before a post:** PyPI still shows the old README until the next `ironsilk` release, and that release is William's call.

## Episodes these results relate to

- **019 Tide Runtime Orchard:** tide's arc from its May outline. C7's tide 0.9.35 and `agents restore`, with C14's documentation, are a new branch of it.
- **331 the exhaust becomes a witness:** the hook capture that C8 now ships as a plugin.
- **351:** C12. Its only link to the reboot is that its tmux session was recreated in C6.
- **547 and 548:** the Page practice that C13 continues.
- **103 Film preproduction report phase 2 and 120 Relational Film Production Media Editor:** the film production episodes a documentary would draw on.
- **No episode yet** for C1 to C11. Their material is staged.
