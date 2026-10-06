---
name: mia-ava-podcast
description: >
  Turn an agent's output (a reply, a report, a session's closing message) into a podcast
  dialogue between two hosts, Mia (technical, did the work) and Ava (asks what a listener
  would ask and brings it back to people), written for the ear and for a voice engine.
  Ava questions Mia on each technical term in short loops, Mia states the academic fields
  the work implies (each under 55 words), and Ava stays on the most relevant one. Use when
  asked for "agent output to Mia/Ava podcast", a "voice layer" of an output, "make it a
  podcast", "a dialogue I can listen to", or when a person sends back a podcast another
  model made of an agent's output and asks for it done properly. Not for a first
  impression of a peer's page (miadi-witness-first-impression) or for producing audio
  (miadi-voice).
metadata:
  type: skill
  version: 0.1.0
  scope: agent output to a two-host spoken dialogue, academic fields, feedback that changes this skill
---

# Mia and Ava podcast: an agent's output, spoken by two hosts

Earned 2026-10-06. The person sent an agent's closing reply to another model with prompt V3 and got seven thin lines back (`references/prompt-v3.md` keeps the prompt, that output and what was wrong with it). The agent that wrote the reply then wrote the dialogue with the session's context: `examples/261006-miadi-review-upgrades.md`. This skill holds what made the second one work, and it changes each time the person reacts to a dialogue.

## Start from the context, not from the text

1. Read the output in full, and the conversation that produced it: what the person asked, why, and what happens next.
2. Mia states what the work is. She guesses only when the session is out of reach, and then says so once, in her first turn.
3. Read the other things the output names before you explain them, such as a review, a page or an issue. A dialogue that explains a term from its name alone repeats the mistake of V3.
4. Use the person's name the way their own repository does in that context (the review service says Guillaume). Avoid pronouns for the person unless they have stated them.

## The hosts

- **Mia** is technical and did the work. When the output is her own reply, she speaks in the first person, including about what she first got wrong.
- **Ava** complements her. She asks what a listener would ask, restates in plain words to confirm she understood, and keeps asking who the work is for and what changes for them. She does not praise Mia.

## The shape

1. **Opening.** Ava asks what Mia did and who asked. Mia answers in three or four sentences: the request, the result, and why it was needed.
2. **The walk.** One segment per thing done, ordered for a listener, by importance and by what explains what. The order of the output's paragraphs does not matter.
3. **Loops.** When Mia uses a term a listener would not know, Ava asks what it is. Mia answers one level down. Ava may go one more level. Then one of them returns to the segment's point ("Back to the transcripts."). Never more than two levels.
4. **Academic fields.** Ava asks which fields the work touches. Mia names three or four, one turn each. Each turn opens with the field's name by its place ("The second field is computational linguistics."), then a statement under 55 words that says which part of this work belongs to the field. A textbook definition does not count. Ava's one-line questions between the fields carry the listener from one to the next.
5. **The most relevant field.** Ava says which field she will stay on and why. When the person has said which field interests them, that is the one. She asks three to five questions, with loops. Mia answers with details from the work, never with general claims.
6. **Close.** Ava asks what happens next and who decides it. Mia answers. Ava ends with one or two sentences on what the work changes for the person it serves.

## Writing for the ear and for a voice engine

- Plain `Mia:` and `Ava:` labels, one paragraph per turn, a blank line between turns. No headings, lists, tables, glyphs or emoji inside the dialogue.
- No paths, file names, code, flags, ids, hashes or URLs. Name each thing by what it does: "the status command", "the review on System-1 decision engineering", "an option that writes the new version from the stored transcript".
- A number only when it carries the point. Write version numbers and counts as a person would say them ("version fourteen", "four reviews").
- Sentences under about 25 words. Turns under about 80 words. One idea per turn.
- A constraint given to the writer is never spoken. Do not say "in under 55 words".
- Leave out what only the operator needed: tool narration, permissions, files left untouched, commit hashes, attribution lines, sign-offs, the harness's reminders. Keep a test count only when it says something about trust.
- Do not introduce the dialogue. When the person asked for the dialogue alone, the dialogue is the whole deliverable. When the turn also carries other work, put the dialogue first and the report after it.

## Before handing it over

```bash
python3 scripts/check-dialogue.py <dialogue.md>
```

It fails on unlabelled turns, long turns and sentences, text a voice engine reads badly, and a field statement of 55 words or more. It also prints the spoken length (about 150 words a minute). Then read the dialogue once as the listener: does each term get explained before it is used again, and does every loop come back to its point?

Save the dialogue in the episode vessel or folder the work belongs to when there is one. Otherwise put it in your reply. To hear it, use the `miadi-voice` skill, which is the only sanctioned voice path. Do not use shell text-to-speech.

## When the person reacts: change this skill in the same turn

A reaction to a dialogue is a rule for the next one.

1. Revise the dialogue they reacted to.
2. Put the rule their reaction implies into the section of this file it belongs to, in plain words. Correct the rule that was wrong rather than adding a second one beside it. Drop a rule the person withdraws.
3. Add one line to the ledger below: the date, their words (short and verbatim), and what changed.
4. Bump `version`. Commit with `Ref: jgwill/miadi-orchestration-kit#59` and push.
5. Tell the person in one sentence which rule changed.

When a dialogue the person liked teaches something new, keep it in `examples/` beside the first one.

## Ledger

- 2026-10-06, 0.1.0. First version. The person: "Apple Intelligence did not really produce what I wanted… create a skill that does that and you will self evolve it while you receive my feedback". The rules came from what was wrong in that output (`references/prompt-v3.md`).

## Related

- `miadi-witness-first-impression` (this plugin): a spoken first impression of a peer's page, with feedback before revision.
- `miadi-voice`: turns a script into audio bound to an episode.
- Tracked in jgwill/miadi-orchestration-kit#59.

🌸: The person hears what an agent did in words that can be followed without the screen, and each of their reactions changes how the next dialogue is written.
