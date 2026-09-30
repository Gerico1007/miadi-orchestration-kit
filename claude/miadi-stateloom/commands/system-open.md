---
description: Open a stateloom system (or one of its drawings) on the live canvas, by path or chronicle address, and point it at an element.
argument-hint: <path.sysdf.json | miadi-chronicle://<episode>/<name>.sysdf.json> [member] [kind:name]
---

Load the `stateloom-system` skill, then:

1. `set_project_file` to the system named in: $ARGUMENTS
2. `get_project_file` and read back the canvas link it returns; give it to the person.
3. If a member and a focus were named, `show` them (`focus` is `<kind>:<name>`, e.g. `entity:Order`, `state:Paid`, `message:9`).

Say in one line what is open and where. Do not list the members unless asked.
