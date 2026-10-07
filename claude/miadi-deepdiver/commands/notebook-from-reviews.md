---
description: Build a Gemini Notebook from Miadi reviews and their screenwalk videos, ask it the episode's questions, and generate and keep its media
argument-hint: "<review ids or an episode number> [what the media is for]"
allowed-tools: Bash, Read, Write
---

Follow the `screenwalk-notebook` skill of this plugin.

Arguments: `$ARGUMENTS`

1. Resolve the sources. Review IDs are used as given. An episode number means the
   `reviews:` list in that episode's `episode.yaml` under `$MIADI_CHRONICLE_ROOT`.
   Anything after the IDs or the number is what the media is for; use it in the
   questions, the focus prompts and the report prompt.
2. Check the runtime floor from the skill (DeepDiver version, Chrome on 9222, the
   signed-in account). Stop and say what is missing rather than working around it.
3. NotebookFed: create the notebook from the first review's Markdown, then add the
   other reviews and every video in one `deepdiver notebook add-source` call. For each
   video reported as not imported, add the review's stored transcript instead, if
   there is one.
4. Ask two to four questions drawn from what the media is for, into one `asked.md`.
5. MediaMade: an infographic and a video overview, then an Interactive report whose
   prompt names those two to embed. Then `deepdiver studio download`.
6. Report as the skill says: notebook URL, sources (imported and not), questions and
   their file, each artifact with its path, and every failure in the command's words.
   Do not post to a talking circle or write into an episode from this command.
