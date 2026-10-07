# Prompt V3, and the output that taught this skill

## The prompt, as dictated (2026-10-06)

> agent output to Mia/Ava podcast V3  produce a voice layer it means that you take on all that content and two persona or agent or gonna simply speak up the content like if they were presenting a podcast of the content so you need to remove all of things that doesn't read well and create something that will be synthesis and read well. (do not introduce your work just output the dialogue). host 1 is "Mia" (more technical) and host 2 is Ava (good at complementing all that Mia is )  because these are replies from Mia, you could orient the script throuah a discussion where Ava is a g her about what she's doing and who. (please filter out any junk that LLM agent might've left us in the original content that don't serve the narrative)   —— what is above is the main idea of what you have to create? Given the fact that the input is very technical? Contains a lot of files reference and a lot of things like that? Ava is going to question Mia on these elements so you'll have some loops if you can consider this as fractal inside the usual dialogue it could help and also Mia is gonna give a statement of. I don't have enough context to tell you exactly what that is and she would try to hypothesise these in potential academic fields implied in less than 55 words per academic fields excluding the title and if relevant Ava will ask question regarding the most relevant field

## What a model without the session made of it

The input was the reply that closed the session `miadi-review-upgrades-261006`. Apple Intelligence returned:

> Ava: Mia, you're tweaking a client and skill—what's the core here?
> Mia: I lack full context. Hypotheses:
> Software engineering: API additions, test alignment, command flow under 55 words.
> Ava: Why software engineering?
> Mia: Transcript commands, commit hooks, review IDs suggest code orchestration.
> Ava: What field fits best?
> Mia: Computational linguistics: transcript parsing, section detection, prompt handling.

What went wrong, each one now a rule in `SKILL.md`:

- Mia opens by saying she lacks context. The person hears a disclaimer before any content.
- "under 55 words" was read aloud as part of the answer. The limit is a constraint on the writer, never spoken.
- "commit hooks" is not in the reply. The guess came from the surface of the text.
- Nothing from the reply was explained: no transcript, no new action, no reviews, no next step.
- The fields were labels with keywords, not statements about the work.
- It was seven lines. There was no loop where Ava asks what a term means.

What it got right: computational linguistics was the most relevant field. The person found it the most interesting, and the version in `examples/261006-miadi-review-upgrades.md` stays on it.
