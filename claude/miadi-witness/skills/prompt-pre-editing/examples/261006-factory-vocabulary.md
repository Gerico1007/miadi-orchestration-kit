# 2026-10-06: naming the factory's bridge pattern

Session that pre-edited: `miadi-review-upgrades-261006`. Session that ran the prompt: tmux `miadi-factory-vocabulary-modularization` (Claude Code `56727d40-ea05-4cdd-a889-27eac732c10a`). The prompt was the first real use of `miadi-review apply`.

## The draft, as the person typed it

```text
/miadi-review apply
6c3f477f-3606-47bf-871c-29bf66a3988e,fcb78dc0-5b8f-4e84-a818-06cab3f70925,09de3362-2418-4172-8250-fdcd913c0aa0,80f50d5b-d5f3-4c82-a6b5-5302db559f5a
In tmux 'asterion-miadi-circle-threads' I am starting to draft a prompt todo a job and I dont know how to call the fact that we want into a software architeture like miadi-factory a good sets of reusable patterns etc.  Help me name that and ground that into a @foundations/ so that I am capable for the future to know what it is talking about.  You'll also seepotential revision based the status of the given miadi-reviews, you'll present that for next steps.
I guess that when you are finished, we'd be ready to inject a few words complete my prompt within 'asterion-miadi-circle-threads' in such a way that it will apply these values to its process with the right terms and we'd have a foundation that describe what that is (or upgraded one or new one)
```

The second paragraph was added after the first round of feedback.

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

(Filled after the run.)
