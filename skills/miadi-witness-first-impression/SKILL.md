---
name: miadi-witness-first-impression
description: >
  Witness another agent's session and the page it published, then write a first
  impression William can play aloud on his phone, collect his feedback, and only
  after that draft the revision message for that agent. The witness team's
  practice: read the peer, translate its page for the ear, hold the revision
  until he answers. Triggers on "observe the artifact", "what does that page
  say", "witness that session", "give me a first impression", "something I can
  play", "before we send it a revision", a peer address such as
  uds:/run/user/<uid>/cc-socks/<pid>.sock, or a claude.ai artifact link another
  session published.
metadata:
  type: skill
  version: 1.0.0
  scope: witnessing a peer session and its artifact, spoken first impression, feedback before revision
---

# Witness a page, speak its first impression

Earned 2026-09-28 in `mino-260928-fork-01`. William called it one of the most helpful requests he had made. What helped him most was hearing that the page was dense, and being told where on the page to look first (the drawing of a restored terminal, in the middle).

## Who does this

Three teams work on the system. Name them when it helps William place the work.

| team | level | job |
|---|---|---|
| Session continuity | the machine | a terminal still knows which agent conversation it held after a reboot or an exit, and another agent can find it. Hooks, tmux save and restore, tide, the session-observability plugin, the inventory format |
| Event path | the application | how an event travels inside Miadi and what stays attached to it. The broker exploration, episode 548, its community invitation |
| Witness | between William and the others | reads what the other teams produce, makes it hearable, prepares the messages that go back, keeps the inventory and the chart. Builds nothing |

This skill is the witness team's main practice.

## The loop

1. **See the peer. Read only.**
   - `ListAgents` gives its name, short id, and whether it is busy or idle.
   - Session id: from its name in `ListAgents`, or `~/.claude/sessions/<pid>.json` where `<pid>` is the number in `cc-socks/<pid>.sock`.
   - What William sent it: `/a/src/_sessiondata/<session_id>/_claude_user_inputs.jsonl`.
   - What it is doing: the tail of `_claude_PreToolUse.jsonl` in the same folder.
   - What it answered: `~/.claude/projects/<cwd-slug>/<session_id>.jsonl`, assistant text blocks:
     `jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="text") | .text'`
   - The socket itself cannot be read. Never answer "I can't see it" before looking in these places.
2. **Read the whole page.** `Artifact` with `action: "read"` and the URL from the peer's last reply. Read every section, including what toggles and tabs hide, because the impression has to say where things are.
3. **Record before speaking.**
   - Add one `observations[]` line to the peer's ONGOING entry in `~/workspace/.mino/session-inventory/` (SCHEMA.md, "Witnessed sessions"). Commit and push it.
   - Keep one master chart for the conversation, with action steps and narrative beats. Chart ids stay seat-private.
4. **Write the spoken first impression.** It is the whole reply. William presses play on his phone.
5. **Hold.** Do not message the peer. Wait for William's feedback.
6. **Draft the revision message from his feedback and show it to him.** Send it only after his go, with `SendMessage` to the peer's name while it is idle, because a message to a busy session interrupts it. Add an inventory observation saying it was sent.
7. He comments on the revised page. Start again at step 2.

## Writing for the ear

In this order:

1. **What the page proposes.** Its promise in two sentences, the one-sentence reason it is needed, the steps as a short numbered list, and what it asks him to decide.
2. **Your impression.** Is it dense? What is too much for a first read? **Where on the page should he look first?** Name the section and where it sits.
3. **Context he needs.** Which team the work belongs to, what else it touches, and anything lost or found.
4. **What you need from him.** Three or four feedback prompts he can answer out loud, coded `FB1`, `FB2`, and so on. Tie each one to a code the page already uses (`D1`, `D2`) rather than inventing new decisions.
5. Miette's sentence.

Rules:

- No paths, code, URLs, pane ids, hashes or chart ids in the spoken body. Allow at most one link, on its own line so he can skip it.
- Use a number only when it carries the point. Say "four of twenty-eight", never a table.
- No tables. Short headings and short paragraphs read well aloud.
- Keep the page's own codes. Introduce any new prefix once, for example "I'll mark feedback questions with FB".
- Ask fewer decisions than the page does, never more. When one of the page's decisions is a sensible default, say so and let him drop it.
- Translate the page. Do not restate it.

## A walkthrough William records

Sometimes William records his screen while the reply plays, then publishes the video. The first one is https://youtu.be/bZ87ypPXPnA (2026-09-28).

- **The reply is only the narration.** Everything in the reply is read aloud, so there is no preamble, no status, and no account of the steps you took. Produce it in a turn with no tool calls, or with no text before the narration starts.
- **Address him and the community together.** Say once who is speaking and which team you belong to.
- **Follow the page from top to bottom.** Open each part with the section's heading exactly as it appears on the page, so he can scroll along.
- **Explain any term a community listener would not know**, such as tmux or hooks, in one clause.
- **After he shares the video:** add its link and a QR code to the page. Generate the code with `qrencode -t SVG --inline --svg-path -m 2 "<short url>"` and inline it on a white background so it scans in both themes. Record the URL in the chart, and hold the video as an internal source for `miadi-review` until he decides to review it.

## What not to do

- Do not send the peer a revision before William has heard the page. The first version is for the witness to read.
- Do not paste into the peer's tmux pane. That interrupts it.
- Do not summarise with the page's paths and file names. That density is exactly what he could not hear.

## Related

- `proposal-visualization` (this kit): how the other side builds the page this skill reads.
- `miadi-mino-tmux-inventory` (this kit): the inventory the witness keeps.
- Tracked in jgwill/miadi-orchestration-kit#59.
- The example that taught this: the gaia session `gaia-tmux-rebooted-restore-finetuning-260928` and its page "Tmux Agent Restore", witnessed on 2026-09-28.

🌸: William decides what an agent revises only after hearing its work, so the revision follows his judgment rather than the agent's first draft.
