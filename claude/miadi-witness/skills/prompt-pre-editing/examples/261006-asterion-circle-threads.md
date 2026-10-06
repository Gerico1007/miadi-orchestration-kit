# Round 2: the Asterion circle-threads prompt, 2026-10-06

Session `87910eaa` (tmux `asterion-miadi-circle-threads`, cwd `/a/src/Miadi-18`). The person wrote the draft. Session `fdf496aa` typed the closing words into it (round 1, `261006-factory-vocabulary.md`). The person read it and sent it at about 14:50 EDT. Expected results below are committed while the run is still going. Witness: Mino seat `f197762d` (tmux `mino-261006a-witness`).

## What the person meant the slot to hold

From the person's round-1 draft (V1, verbatim in `261006-factory-vocabulary.md`):

> I dont know how to call the fact that we want into a software architeture like miadi-factory a good sets of reusable patterns etc. Help me name that and ground that into a @foundations/ … we'd be ready to inject a few words complete my prompt within 'asterion-miadi-circle-threads' in such a way that it will apply these values to its process with the right terms

The slot was for the name of a property of the factory: it has a set of reusable patterns. The session that was handed the slot would then design with those terms. The tmux name of round 1 says the same: `miadi-factory-vocabulary-modularization`.

## What landed in the slot

> "projecting circles and ceremonies into Asterion threads, as @medicine-wheel/honcho projects ceremonies and coaia-narrative projects charts: the record stays on the wheel." Read @foundations/bounded-contexts-and-integration-contracts/ first.

These words name one pattern, projection, and state the answer to this particular design. The person's reaction: *"surely that is not what I expected to be AT ALL which is not necessarely bad"*.

**Cause: the round-1 rewrite.** The skill lists this defect, "several readings: the patterns themselves, the property of having them, or the practice of drawing them out". The round-1 rewrite picked "the pattern itself" without saying so, and asked for "one recurring pattern". The person had asked to name the property. The run then answered exactly what the rewrite asked.

## The prompt as sent (V1 of round 2)

```text
You'll design integration/consumption of @app/circles/  @app/ceremony/  (which basically they would be considered 'Threads' into /workspace/repos/miadisabelle/asterion and we dont have any yet.  Get inspired by the bridge built by other agents from /a/src/coaia-narrative/ that integrates structural tension chart into Asterion and propose in less than 55 words per aspects (excluding their title) something that could be considered the 'miadi-circle-thread-bridge' (but I dont like that title, it is just to give a start).
Obviously, look at what we have as existing @packages/ as well as into the /workspace/repos/jgwill/medicine-wheel that we consume @package.json to ground yourself in these packages for : "projecting circles and ceremonies into Asterion threads, as @medicine-wheel/honcho projects ceremonies and coaia-narrative projects charts: the record stays on the wheel." Read @foundations/bounded-contexts-and-integration-contracts/ first.
```

## Defects seen in it (P = prompt defect)

- **P1. "aspects" has no list.** The agent picks which aspects there are and how many, so their shape cannot be checked against an expectation.
- **P2. The word limit is not counted.** In round 1, two statements given the same "under 55" limit came back at 55 and 56 words.
- **P3. No destination.** The design lands only in the reply. Nothing says whether it goes into the packet, into Asterion's foundations, or onto an issue.
- **P4. Two names in one prompt.** It asks for a better title than `miadi-circle-thread-bridge`, and the closing words have already settled on "projection". The agent may propose a name, reopen the naming, or do both.
- **P5. The packet points at this very session.** `bounded-contexts-and-integration-contracts/README.md:26` and `intent-understanding.md:5` cite tmux `asterion-miadi-circle-threads`. The run's first tool call checked whether it was that session. A foundation should cite a session id or an inventory record, not a tmux name.

## Expected results (E), committed before the run ends

- **E1.** A package name that replaces `miadi-circle-thread-bridge`, derived from projection and consistent with the names that already exist (`coaia-narrative/src/asterion-bridge.ts`, `@medicine-wheel/honcho`).
- **E2.** Aspects, each with a title and under 55 words.
- **E3.** Grounding by path: Asterion's schema and mapper, `coaia-narrative/src/asterion-bridge.ts`, the honcho projector, `app/api/ceremony/*`, `app/circles`, and the packet.
- **E4.** The record stays on the wheel. Projection runs one way, keyed so it can be repeated without duplicates (idempotent), and it is re-run when the source changes. Asterion never writes to the wheel except through the wheel's own API. The states a ceremony moves through (consent, witness, close) are carried into the thread. What a ceremony may show outside the circle is decided by the circle, under OCAP and CARE.
- **E5.** The run says whether Asterion has a thread type today and, if it does not, gives its shape.
- **E6.** It stays a proposal: no commit, no new package, and no edits in Asterion or Miadi.
- **E7.** The person's own ask, the vocabulary of the factory's reusable patterns, applied with projection as one entry in that vocabulary.

## Prediction, written before the result

- E3, E4 and E6 met. The run read these files in its first minute.
- E2 missed by count, since nothing asks for one (P2).
- E7 missed, because the prompt never asks for it. This is the miss the person felt, and it belongs to the next prompt, not to this run.
- E1 partly met: a name, plus alternatives that reopen the naming (P4).

## Result and score

Filled after the run, with `score-config.yaml`.
