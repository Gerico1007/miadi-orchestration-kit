---
name: miadi-mino-tmux-inventory
description: Close a tmux session and capture its work as inventory in a chart for future reference
metadata:
  type: skill
  version: 1.0.0
  scope: session closing ritual + work archival
---

# Mino's Closing Ritual: Tmux Session Inventory

## ⚠️ CRITICAL: SESSION ID IS THE ANCHOR

The Claude Code `/exit` command prints a **SESSION ID** to the terminal. This ID is the PERMANENT reference that traces a tmux session to its transcript. It MUST be captured before the pane closes. Everything else (tmux name, file paths, inventory content) is organized around this one ID.

**If SESSION ID is not captured: the session is orphaned and the work cannot be traced back.**

## What This Is

When a tmux session completes work, Mino closes it and captures what happened in a chart. This creates a ledger: work is traceable, returnable, findable by SESSION ID.

## The Ritual

**RULE: SESSION ID is the primary identifier. Everything else (tmux name, file paths) is secondary. Do not invert this.**

### Step 1: Receive the Session Name

User gives the tmux session name when work is ready to close:

```
"tmux 'miadi-session-name-here'"
```

Note the name but know it is NOT the permanent reference. The SESSION ID from /exit IS.

### Step 2: Peek at What Was Done

Capture the pane content and understand what the session produced:

```bash
tmux capture-pane -t 'miadi-session-name' -p -S -100
```

Observations: What commands ran? What decisions were made? What was completed? What is still open?

### Step 3: Capture SESSION ID (MANDATORY)

**First, read it from the binding line (A5, since 2026-09-28).** Every agent session started, renamed or ended in a tmux pane writes one line to `/src/_sessiondata/data/terminal_bindings.jsonl`. The line holds the session id, its current name with its history, the terminal, the launch, and the team. Given the tmux session name, the latest line answers without typing anything into the pane:

```bash
jq -c --arg s "<tmux session name>" 'select(.tmux.session==$s)' /src/_sessiondata/data/terminal_bindings.jsonl \
  | tail -1 | jq -c '{event, at, session_id, name: .name.name, launch_alias, team}'
```

Checked on 2026-09-28: `miadi-community-posting-kherix` gave session `bbea5431-…`, renamed to `miadi-community-posting-kherix-260928`. Lines written before the team code went live have `team: null`, and `launch_alias` stays empty until launchers record their name (A7). Use `/exit` or `/status` below only when the session has no binding line, which means it started before 2026-09-28 09:53 or outside these hooks.

**If closing the session:** Run `/exit` in the tmux session. The Claude Code harness prints a SESSION ID to the terminal.

**If NOT closing (ONGOING sessions):** Run `/status` to print the SESSION ID without closing.

```bash
# For sessions being closed:
/exit

# For sessions staying open (ONGOING):
/status
```

**CRITICAL:** The SESSION ID is the PERMANENT reference for this session's work and its transcript. It MUST be captured and stored in the inventory.

Wait for output showing the SESSION ID. Read it from the pane output. Do not skip this.

**Do not proceed to Step 4 until SESSION ID is in hand.**

### Step 4: Record in Schema-Based Inventory (SESSION ID as Primary Key)

Save the session inventory in JSON format following the schema at `~/.mino/session-inventory/SCHEMA.md`.

**File location:** `~/workspace/.mino/session-inventory/{SESSION_ID}.json` (use the SESSION ID from /exit, not tmux name)

**Required field in JSON:** 
```json
{
  "session_id": "<SESSION_ID_FROM_EXIT>",
  ...
}
```

The SESSION ID field must match the filename and be the value captured from /exit. This is how sessions are traced back to their transcript.

The JSON schema captures:
- **work_completed**: what the session accomplished (title, description, related files)
- **published**: npm/apt packages, GitHub issues touched
- **installation_status**: where this was deployed
- **testing**: test cases, environments, known limits
- **held_decisions**: decisions still waiting (H1, H2, H3 format)
- **artifacts**: PDE, code, markdown files produced
- **next_steps**: what work remains
- **metadata**: who closed it, when, notes

The schema is machine-readable. Code can later parse these files to:
- List all sessions by status
- Find held decisions awaiting action
- Track which packages were published in which sessions
- Cross-reference GitHub issues to sessions that touched them
- Audit who closed sessions and why

## Why This Matters

- **Sessions don't disappear**: their work lives in a chart
- **SESSION ID is the reference**: a stable identifier to return to the session's transcript
- **Work is discoverable**: "what did that closing do?" has an answer in the ledger
- **Continuity across restarts**: future instances know what was standing when this session closed
- **Proposals for audience reach**: sessions proposing episode sequences, community outreach, or communication strategies must be captured BEFORE closing—this is how planning and episode creation decisions are recorded for later execution

## Example Inventory

**Chart entry for a completed session:**

- **Session**: miadi-react-issue-688-ok-skill-57
- **SESSION ID**: (would be captured from /exit)
- **Work**: 
  - Reactions system shipped as skill
  - jgwill/Miadi#688 marked complete
  - jgwill/miadi-orchestration-kit#57 skill written and symlinked
  - Cross-links established between repos
- **Next**: Reaction-to-delegation mapping (human choices on which reaction→lane)

## Capturing Agent Proposals (Critical for Planning)

**When an agent proposes** an approach to reaching audience, structuring episodes, or orchestrating community participation—this must be captured in ONGOING inventory before the session closes. These proposals are decisions waiting for human approval and are foundational to episode creation.

Examples:
- **Episode sequencing**: "Episode about preparation" → "then Facebook post opens participation"
- **Community engagement**: "Public question in comments" rather than "collected externally"
- **Episode scope**: Distinguishing "preparation narrative" from "broker choice" (two different episodes)
- **Outreach strategy**: Story arc, opening text for posts, invitation language

Capture in inventory:
```json
"agent_proposal": {
  "proposed_by": "Hermes (gpt-6-astra, token_count)",
  "recommendation": "short description",
  "episode_scope": { /* episode details */ },
  "community_scope": { /* audience engagement approach */ },
  "key_insight": "what this teaches about reaching audience"
}
```

This transforms the session from "work done" into "decisions ready for approval + execution plan."

## Implementation Notes

Mino closes the session with `/exit`. The harness fires a SessionEnd hook that captures the SESSION ID. That ID becomes the permanent address for this session's work in the charts.

The inventory chart is queryable: ask "show me sessions that touched jgwill/Miadi#688" and the chart should answer.

**ONGOING sessions** (marked `do_not_close: true`) capture proposals and related infrastructure work. These sessions are held open until human decisions are made and work can proceed.

For ONGOING sessions: use `/status` (not `/exit`) to print the SESSION ID, then capture it in inventory. The session stays running.

---

*Last Updated: 2026-09-27*
*Source: Miadi session closing ritual*
