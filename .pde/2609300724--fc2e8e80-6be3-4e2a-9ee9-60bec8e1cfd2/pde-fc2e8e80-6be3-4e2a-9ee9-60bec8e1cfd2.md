# Prompt Decomposition

> Engine: **claude** (opus)

## Four Directions

### 🌅 EAST — Vision

- A reader of the milestone doc can recreate the two most used launch aliases from one short section [85%]
- A new user can reach a working Miadi setup through apt install of the miadi packages [60%] _(implicit)_
- Improvements to the distribution exist as a delegable issue, not only as scrollback [80%]

### 🔥 SOUTH — Analysis

- Find the real definitions of claudeyolo and claudeyolochroniclehoncho [80%] _(implicit)_
- Read packages/miadi/deb to learn what each of the four packages installs and configures [80%]
- Compare the deb contents against the documented variables, launchers, plugin and teams.json [70%] _(implicit)_
- Audit how far jgi on gaia is configured [65%] _(implicit)_

### 🌊 WEST — Validation

- Source the snippets in a subshell and confirm they recreate the aliases [70%] _(implicit)_
- Build and test-install the packages in a disposable context and record what fails or is missing [55%]
- Check the issue draft has the five sections and full owner/repo#number references [80%] _(implicit)_

### ❄️ NORTH — Action

- Write the MIADI_LAUNCH_ALIAS section into the milestone draft [85%]
- Create the feedback issue in jgwill/miadi-orchestration-kit [80%]
- Commit the edited files by name and push [75%] _(implicit)_

## Original Prompt

> 'MIADI_LAUNCH_ALIAS'
> 
> could have a short section where you give our most used which are :  'claudeyolo', 'claudeyolochroniclehoncho' with simple snippet that helps reproduce the aliases...
> -----
> ALso, this user is probably not fully configured, therefore and upgrade would supply an experimentation of setting ourself up forall we are talking about which relates to something maybe up to date or not which is @packages/miadi/deb/  which obviously would supply what is needed for user to set their account up... I dont know if that is too much for you here, that 'apt install ...' is new so maybe provide feedback as new issue that I might delegate to agents on what could get better either in that folder or other packages we might need to consider including in the distribution or something...
> 
> ---
> Context: this follows the cutover of user jgi on host gaia from /opt/binscripts/hooks/claude_hooks (hand-wired in ~/.claude/settings.json) to the Claude Code plugin miadi-session-observability@miadi-orchestration-kit, and a milestone draft "Miadi-Factory-Observability-Doc4Chronicle" documenting the plugin's environment variables (MIADI_SESSION_DIR, MIADI_ORCHESTRATION_KIT_ROOT, MIADI_TEAM, MIADI_LAUNCH_ALIAS, MIADI_CHRONICLE_ROOT, MIADI_CHRONICLE_PROD_EPISODE), its launchers, and the teams definition (teams/teams.json). packages/miadi/deb in jgwill/miadi-orchestration-kit builds the apt packages miadi, miadi-config, miadi-terminal, miadi-tide.
> 

## Primary Intent

**Action:** add
**Target:** a short section under MIADI_LAUNCH_ALIAS in the milestone draft (Miadi-Factory-Observability-Doc4Chronicle) listing the most used launch aliases 'claudeyolo' and 'claudeyolochroniclehoncho', each with a snippet that recreates it
**Urgency:** session
**Confidence:** 85%

## Secondary Intents

1. **locate** — the real definitions of the claudeyolo and claudeyolochroniclehoncho aliases (jgi's shell rc files on gaia, kit launchers, the deb package contents) _(implicit)_
2. **write** — snippets that recreate each alias, including the MIADI_LAUNCH_ALIAS value and any MIADI_TEAM or chronicle variables they set _(explicit)_
   - depends on: locate the real definitions of the claudeyolo and claudeyolochroniclehoncho aliases
3. **verify** — that the snippets recreate the aliases (source them in a subshell, run 'type claudeyolo', check the plugin records MIADI_LAUNCH_ALIAS) _(implicit)_
   - depends on: write the alias snippets
4. **audit** — how far user jgi on gaia is configured against the documented variables (MIADI_SESSION_DIR, MIADI_ORCHESTRATION_KIT_ROOT, MIADI_TEAM, MIADI_LAUNCH_ALIAS, MIADI_CHRONICLE_ROOT, MIADI_CHRONICLE_PROD_EPISODE), the plugin install, and teams/teams.json _(implicit)_
5. **inspect** — packages/miadi/deb (README, build.sh, test-install.sh, prep, tests, and the miadi, miadi-config, miadi-terminal, miadi-tide package trees) to see what account setup it provides and whether it reflects the plugin cutover _(explicit)_
6. **experiment** — setting a user up from the apt packages (build, then test-install) and recording what is missing or out of date _(explicit)_
   - depends on: inspect packages/miadi/deb
7. **identify** — other packages or assets the distribution could include (the miadi-session-observability plugin install, alias snippets, env var defaults, teams.json, chronicle root setup) _(explicit)_
   - depends on: experiment with setting a user up from the apt packages
8. **load** — the structural-issue-authoring skill before drafting the issue _(implicit)_
9. **create** — a new GitHub issue in jgwill/miadi-orchestration-kit with feedback on improving packages/miadi/deb and the distribution's contents, written so the work can be delegated to agents _(explicit)_
   - depends on: identify other packages or assets the distribution could include
10. **commit and push** — only the edited milestone draft and the .pde vessel for this decomposition _(implicit)_
   - depends on: write the alias snippets

## Context Requirements

### Files Needed
- .guillaume/milestone-draft-snippet-team-and-variable-2609300643.md
- packages/miadi/deb/README.md
- packages/miadi/deb/build.sh
- packages/miadi/deb/test-install.sh
- packages/miadi/deb/prep/
- packages/miadi/deb/tests/
- packages/miadi/deb/miadi/
- packages/miadi/deb/miadi-config/
- packages/miadi/deb/miadi-terminal/
- packages/miadi/deb/miadi-tide/
- packages/miadi/deb/termux/
- teams/teams.json
- miadi-session-observability plugin sources (launchers, env var handling)
- ~/.bashrc and ~/.bash_aliases of jgi on gaia (alias definitions)
- ~/.claude/settings.json of jgi on gaia

### Tools Required
- Bash (grep, type, dpkg-deb --contents, build.sh, test-install.sh)
- Read
- Edit
- git
- gh CLI
- structural-issue-authoring skill
- pde-vessel-ceremony skill

### Assumptions
- claudeyolo and claudeyolochroniclehoncho are the most used launch aliases
- user jgi on gaia is probably not fully configured after the cutover
- packages/miadi/deb is meant to provide everything a user needs to set up their account
- the packages may or may not be current with the plugin cutover and the documented variables
- the apt install path is new and has had little real use
- the issue will be delegated to agents, so it must stand alone
- the MIADI_LAUNCH_ALIAS section belongs in the milestone draft that documents the plugin's variables

## Expected Outputs

### Artifacts
- .pde/<timestamp>--miadi-launch-alias-and-deb-feedback/ (decomposition JSON and markdown)

### Updates
- .guillaume/milestone-draft-snippet-team-and-variable-2609300643.md (short MIADI_LAUNCH_ALIAS section with alias snippets)

### Communications
- GitHub issue in jgwill/miadi-orchestration-kit: feedback on packages/miadi/deb and on packages to add to the distribution, naming the milestone by title (Miadi-Factory-Observability-Doc4Chronicle)

## Action Stack

- [ ] Confirm the target is the MIADI_LAUNCH_ALIAS entry in .guillaume/milestone-draft-snippet-team-and-variable-2609300643.md and keep the section short
- [ ] Grep jgi's shell rc files, the kit launchers and the deb trees for the claudeyolo and claudeyolochroniclehoncho definitions (depends on: Confirm the target section)
- [ ] Write the short section with one snippet per alias, including the MIADI_LAUNCH_ALIAS value each one sets (depends on: Find the alias definitions)
- [ ] Source the snippets in a subshell and check 'type claudeyolo' and 'type claudeyolochroniclehoncho' (depends on: Write the short section)
- [ ] Read packages/miadi/deb README, build.sh, test-install.sh and each package's control and postinst files
- [ ] Audit jgi on gaia against the documented variables, the plugin install and teams/teams.json
- [ ] Build the packages and run test-install.sh in a disposable context, not on the live gaia host, and record what is missing or stale (depends on: Read packages/miadi/deb)
- [ ] List what the distribution lacks relative to the milestone (plugin install, alias snippets, env var defaults, teams.json, chronicle root) (depends on: Build and test-install the packages)
- [ ] Load the structural-issue-authoring skill and draft the issue from the findings (depends on: List what the distribution lacks)
- [ ] Create the issue in jgwill/miadi-orchestration-kit, naming the milestone by title (depends on: Draft the issue)
- [ ] Stage only the milestone draft and the .pde vessel, commit without a co-author trailer, and push (depends on: Write the short section)

## Ambiguity Flags

- **"'could have a short section' does not name the file"**
  - Suggestion: Use the MIADI_LAUNCH_ALIAS entry in the milestone draft .guillaume/milestone-draft-snippet-team-and-variable-2609300643.md
- **"'this user' is not named"**
  - Suggestion: Take it as jgi on gaia, the user from the cutover context
- **"'an upgrade would supply an experimentation of setting ourself up' could mean running apt install on the live gaia host or a dry run"**
  - Suggestion: Test-install in a disposable context first. A system-wide apt install on gaia needs sudo and changes shared state, so it needs explicit consent
- **"'something maybe up to date or not' leaves the deb packages' currency unknown"**
  - Suggestion: Diff the package contents against the documented variables and the plugin cutover, and report the result in the issue
- **"'I dont know if that is too much for you here' leaves the scope open"**
  - Suggestion: Do the alias section fully, and put the deb audit and distribution proposals into the issue rather than implementing package changes
- **"'other packages we might need to consider including in the distribution' names no candidates"**
  - Suggestion: Derive candidates from what a fresh user lacks after test-install and list each one in the issue with its reason
- **"The exact flags and variables behind claudeyolo and claudeyolochroniclehoncho are not stated"**
  - Suggestion: Copy them from the real alias definitions instead of reconstructing them from the names
