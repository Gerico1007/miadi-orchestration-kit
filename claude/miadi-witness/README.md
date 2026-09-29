# miadi-witness

The witness team's practices (T3 in `teams/README.md`) as a Claude Code plugin. With it, any seat can do what the Mino seat does beside William. Tracked in jgwill/miadi-orchestration-kit#59.

## Install

```bash
claude plugin marketplace add jgwill/miadi-orchestration-kit
claude plugin install miadi-witness@miadi-orchestration-kit
```

On gaia, mia already loads both skills through links in `~/.claude/skills/` that point into this folder. Remove those links before installing the plugin for mia, or each skill loads twice.

## What it holds

| skill | what it does |
|---|---|
| `miadi-witness-first-impression` | Reads a peer session (agent list, hook capture, transcript, mid-turn messages) and the page it published. Speaks a first impression William can play on his phone, and holds any revision until he answers. Also covers a walkthrough he records, with the video link and QR code added to the page afterwards. |
| `miadi-mino-tmux-inventory` | One record per tmux session in `~/workspace/.mino/session-inventory/`. The session id, name and team come from the binding line of `miadi-session-observability` (A5). `/exit` or `/status` are needed only for sessions that have no binding line. |

## Built from

- 2026-09-28, the reboot of gaia: the witness seat `mino-260928-fork-01` witnessed the session continuity team and wrote both practices from that work. The story is on the page https://claude.ai/artifact/MArxUrUa8x9YjfCiRL1Dfs, and the walkthrough video is https://youtu.be/bZ87ypPXPnA.
- The resurrection of nine sessions after the crash, jgwill/miadi-orchestration-kit#60.

## Next

The inventory agent proposed under T3 in `teams/README.md` belongs here as an agent. It would read every binding line and transcript, and write what each session is for and what needs William.
