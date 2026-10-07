---
description: Check a stateloom system — every name that crosses between its drawings, and each scenario replayed through the machines — and report only what needs attention.
argument-hint: [path.sysdf.json]
---

Load the `stateloom-system` skill, then run `check_system` on: $ARGUMENTS (the active system when nothing is named)

Report, in this order and nothing more:

1. Errors, by rule, one line each (the rule, the drawing, what is wrong).
2. For each scenario path that stops: the message where it stops and why, in one line. The stops after it on the same path are its consequence — count them, do not list them.
3. The reconcile mode, and when it is `propose`, how many changes `reconcile_scenario` would make.

If there is nothing in 1 and 2, say "the drawings agree" and stop.
