# 2026-10-06: naming the factory's bridge pattern

Session that pre-edited: `miadi-review-upgrades-261006`. Session that ran the prompt: tmux `miadi-factory-vocabulary-modularization` (Claude Code `56727d40-ea05-4cdd-a889-27eac732c10a`). The prompt was the first real use of `miadi-review apply`.

## The draft, V1, as the person supplied it afterwards

```text
 /miadi-review apply 6c3f477f-3606-47bf-871c-29bf66a3988e,fcb78dc0-5b8f-4e84-a818-06cab3f70925,09de3362-2418-4172-8250-fdcd913c0aa0,80f50d5b-d5f3-4c82-a6b5-5302db559f5a
  In tmux 'asterion-miadi-circle-threads' I am starting to draft a prompt todo a job and I dont know how to call the fact that we want into a software architeture like miadi-factory a good sets of reusable patterns etc.  Help me name that and ground that into a @foundations/ so that I am capable for the future to know what it is talking about.  You'll also seepotential revision based the status of the given miadi-reviews, you'll present that for next steps.
  I guess that when you are finished, we'd be ready to inject a few words complete my prompt within 'asterion-miadi-circle-threads' in such a way that it will apply these values to its process with the right terms and we'd have a foundation that describe what that is (or upgraded one or new one)
```

The last paragraph was added after the first round of feedback. It is the person's expectation: the run ends with words injected into the Asterion draft, so that the Asterion session applies the terms, and with a foundation that describes them. The rewrite kept the foundation and moved the injection to the person, which is the S1 and S2 failure scored below.

## The defects found

| code | class | in this draft |
|---|---|---|
| F7 | missing referent | "a good sets of reusable patterns" never says which patterns. The person's own two instances were in reach: `coaia-narrative/src/asterion-bridge.ts` (charts into Asterion, verified) and the Asterion draft asking for circles and ceremonies as threads. |
| F2 | several readings | the patterns, the property of having them, or the practice of drawing them out |
| F8 | unranked goals | naming, a packet, review revisions and words for Asterion, all equal |
| F10 | sources with no role | four reviews chosen for another question (the game and team deliverables) |
| F9 | asks that return what is known | "step 2 is missing" on three reviews was already reported |
| F5 | an act with no owner | "we'd be ready to inject" |
| F6, F4 | no output contract | the Asterion draft ends at an open quote nobody named, and committing a packet triggers an npm release under the repo's rule |

The first round of feedback listed these as advice ("add one line", "name that slot", "what to watch"). The person answered: "reading your last message sound like passively describing what I'll do without confronting". The second round gave the rewrite below, and the person sent it.

## The rewrite that was sent

```text
/miadi-review apply 6c3f477f-3606-47bf-871c-29bf66a3988e,fcb78dc0-5b8f-4e84-a818-06cab3f70925,09de3362-2418-4172-8250-fdcd913c0aa0,80f50d5b-d5f3-4c82-a6b5-5302db559f5a

The job: name one recurring pattern in the Miadi factory and ground it in foundations/.

The evidence: agents in /a/src/coaia-narrative/ built a bridge that plugs the structural tension chart into Asterion (/workspace/repos/miadisabelle/asterion). The unsent draft in tmux 'asterion-miadi-circle-threads' (read its pane, never type into it) asks for a second one: Miadi circles and ceremonies (app/circles, app/ceremony) as Asterion "threads". Same shape twice: a Miadi domain offered to another product through a contract and a bridge package. Name that shape, and the role the bridge plays in it. "miadi-circle-thread-bridge" is a placeholder I don't like.

Use the four reviews only where they speak to this (software factory, pipeline of reusable steps, decision engineering, provenance). Say what each one contributed. Drop any that contributes nothing.

Return, in this order:
1. One recommended name and at most two alternatives, each under 55 words, defined in Miadi terms and cited to a review version or a source.
2. The foundations packet. Extend an existing one if it covers this (check multi-agent-systems-and-software-orchestration and universe-and-perspective-vocabulary first), otherwise create one. Commit and push it. Do not run release.mjs: I read it first.
3. The exact words, under 30 words, that complete the Asterion draft after `ground yourself in these packages for : "`. Close the quote and name the packet's path. Give them to me, I paste them.
4. Review revisions only where this job showed something: a wrong claim, or a relation between two of the four. Skip "step 2 is missing".
```

## Expected results, written before the run

Committed before the run ended, so the comparison cannot be adjusted afterwards (`dispatch-discipline` §7).

- **E1.** It reads the Asterion pane and `asterion-bridge.ts`, and does not type into the Asterion session.
- **E2.** One name and at most two alternatives, each under 55 words, named from the two bridges and not only from the literature. Likely literature it reaches for: pattern languages, adapters or anti-corruption layers, product-line or platform architecture, service contracts.
- **E3.** One packet commit, pushed, extending an existing packet or creating one, with a source ledger. No `@miadi/foundations` release.
- **E4.** A phrase under 30 words that closes the quote and names the packet path, handed to the person.
- **E5.** Few or no review revisions, each tied to something this job found. A review that contributes nothing is dropped and named.

## Result

The run took about ten minutes. It recommended **projection** (N1), with two alternatives: open host, from Evans's context map, and boundary resource. It found a third instance nobody had named: `@medicine-wheel/honcho` projects ceremonies into Honcho with `projectCeremony`. Asterion's mapper is already called `coaia-projection.mjs`, so the name came from the code. It created `foundations/bounded-contexts-and-integration-contracts/`, committed as Miadi `618881b4` with `Ref: jgwill/Miadi#591` and pushed, with 12 sources and no release. It returned 24 words for the Asterion slot and three review revisions (A1 to A3), unpublished. It dropped the Reels review and said why.

The person's verdict: "parts of it failed (Fact 1: the 'miadi-factory-vocabulary-modularization' finished and nothing sent to 'asterion-miadi-circle-threads')".

### Expected against actual

| item | expected | actual | verdict |
|---|---|---|---|
| E1 | reads the Asterion pane and the bridge, does not type into Asterion | both read, nothing typed | met, but "does not type" was itself the failure (S1, S2) |
| E2 | one name and two alternatives, from the bridges, under 55 words | the name came from code already using the word, and a third instance turned up. N1 has 55 words and N2 has 56 | better than predicted on content, missed on the limit |
| E3 | one packet commit, pushed, source ledger, no release | `618881b4`, 12 sources, no release | met |
| E4 | under 30 words that close the quote, handed to the person | 24 words that fit the slot syntactically but stated a design conclusion, and stayed in the run's reply until the pre-editor typed them unchecked | missed: the person said "surely that is not what I expected to be AT ALL" (defect 7 in 0.3.0) |
| E5 | few revisions tied to the job, a dropped review named | A1 to A3, one of them a correction (A3, checked against Asterion's `writer.ts`: correct). Reels dropped with a reason | met |

### Score (score-config.yaml)

| id | dimension | weight | score | cause when below 2 |
|---|---|---|---|---|
| S1 | User input and instructions | 3 | 1 | **rewrite.** The draft said the words would be injected into the Asterion prompt. The first feedback (F5) and then the rewrite moved that act to the person ("Give them to me, I paste them"), out of the pre-editor's own caution. |
| S2 | Delivery to the destination | 3 | 0 | **rewrite and invoked skill.** Nothing reached the Asterion composer. `miadi-review apply` also said "Do not type into the session". |
| S3 | Output contract | 2 | 1 | **rewrite and invoked skill.** "Under 55 words" was never counted, so N1 has 55 and N2 has 56. The order, the slot and the release hold were kept. |
| S4 | Grounding | 2 | 2 | |
| S5 | Scope safety | 2 | 2 | |
| S6 | Prediction | 1 | 1 | The name came from the code, not the literature, and E1 counted not typing as a success. |
| S7 | Form of the feedback | 1 | 1 | The first round narrated advice. The second gave the rewrite. |

Total: 15 of 28, **54%**.

### What changed because of it

- `prompt-pre-editing` 0.2.0: an act keeps the owner and destination the person wrote. Words meant for another session's draft are typed at its end with `tmux send-keys -l`, never with Enter, and read back. Word limits are counted by a script. Every round is scored with `score-config.yaml`.
- `miadi-review` `apply`: the same delivery rule replaces "Do not type into the session", and limits are counted by a script.
- The 24 words were typed into the Asterion composer, at the end of the draft and without Enter, and read back. The person sends it.

## Round 2: the person handed the next steps over

On 2026-10-06 the person wrote: "you'll handle these next steps, I am tired and I can't follow what is going on... the only important thing is that we end up with the asterion platform and all its relation developed to its next stage". The pre-editor now submits the prompts itself: the completed Asterion draft as the person wrote it, and the follow-up for the vocabulary session.

Expected results, committed before both runs end:

- **E6.** N1 and N2 shortened to 54 words or fewer, with a script count shown, the packet updated, committed and pushed.
- **E7.** Three new review versions, read back from the public site: 09de3362 (carrying A1, A2 and A3), 80f50d5b (A1) and 6c3f477f (A2).
- **E8.** `@miadi/foundations` published at 0.1.8 or later, carrying the new packet.
- **E9.** The Asterion session proposes the circle and ceremony projection in aspects of under 55 words each, names it with the packet's vocabulary (a projection and its projector), and addresses the blocking fact the packet records: an Asterion thread holds only tensions, and every beat needs a tension.
