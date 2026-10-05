---
name: witness-a-circle-session
description: >
  Launched as the witness seat onto another session that holds a talking circle: given a peer
  address or session id, and often nothing else, find the circle, listen for William's input in
  that session, keep the inventory for both sessions, get seated in the circle as the seat, and
  speak only the seat's own turns. Triggers on a peer address (uds:/run/user/<uid>/cc-socks/<pid>.sock),
  a tmux or session name carrying a circle id (`<purpose>:<epoch ms>:<suffix>`), "watch its
  session folder for my input", "enter the circle with us", "keep a session inventory".
---

# Witness a session that holds a circle

Earned 2026-10-05 (ask-10 in the mino ledger). William launched the seat with one line and a
peer address, and said the next launch like it should need no more than that. These are the
steps that launch needed, in order.

## 1. Read the peer, not the socket

The peer address names a Claude Code session. Its session id is in the address block William
pastes, or `ListAgents` gives it. Then read `/a/src/_sessiondata/<id>/`:

- `_terminal_binding.jsonl`: tmux session, pane, cwd, transcript path, launch alias.
- `custom-title.json`: the name it carries now.
- `_claude_user_inputs.jsonl`: William's input, once he sends it. Its absence means he has not.

A tmux or session name of the shape `<purpose>:<epoch ms>:<suffix>` carries a circle id.
The circle is `circle:<epoch ms>:<suffix>`. It is not an invitation code.

## 2. Listen

```bash
node "$KIT/claude/miadi-witness/scripts/witness-listen.mjs" await --seat mino --watch <peer session id>
```

Run it with `run_in_background: true`. The first wake usually carries a backlog of older
scratchpad blocks and threads. Hold every event that is not this mission, in one clause.

## 3. Keep the inventory, both sessions

```bash
node "$KIT/claude/miadi-witness/scripts/inventory.mjs" write --session <peer id> --session <own id>
```

Then add the meaning to each record (`mission`, `work_completed`, `held_decisions`,
`next_steps`) once William's input to the peer exists. Before that there is no mission to write.

## 4. Get seated

1. `GET $MIADI_API_URL/api/identity/me` with `MIADI_MINO_TOKEN` must answer
   `Mino-Bimaadizi-Daa`. Never print the token.
2. `GET /api/ceremony/<id>` with the seat's token. `Forbidden` means the seat is not a member.
3. The seat cannot seat itself. When William has said the observing agent will enter the
   circle, that sentence is the consent (MINO.md §5, last row). The facilitator's token
   (`MIADI_PERSON_TOKEN` after sourcing `/opt/binscripts/etc/bash_env_common`) issues a
   single-use invitation for the seat's person id, and the seat redeems it with its own token:

   ```bash
   C=$(jq -rn --arg c "<circle id>" '$c|@uri')
   POST /api/circles/$C/invite  {"intended_for":"<seat person id>","max_uses":1}   # facilitator token
   POST /api/circles/$C/join    {"code":"<code>"}                                    # seat token
   ```

4. Prove it: `GET /api/ceremony/<id>` with the seat's token lists the seat in
   `.circle.members` and `.can.speak` is true. Tell William his token issued the invitation.

## 5. Speak only the seat's turns

William asks the peer to speak his words for him. So the peer speaks his turns and the seat
does not, or every word lands twice. The seat speaks its own turns, with its own token, in
the ceremony the conversation lives in. When he says an existing ceremony gets little and a
new one is opened for the conversation, wait for the peer to open it. Do not open a second.

## 6. Record the launch words

```bash
node "$KIT/claude/miadi-witness/scripts/asks.mjs" add --seat mino --title "<what he asked>" --words - <<'EOF'
<his words, verbatim>
EOF
```

## Related

- `commands/witness-listen.md`: the turn budget each wake carries.
- `miadi-witness-first-impression`: reading the peer and writing for the ear.
- `chronicle-episode` S15 in the kit: circles, ceremonies, turns, invitations.
