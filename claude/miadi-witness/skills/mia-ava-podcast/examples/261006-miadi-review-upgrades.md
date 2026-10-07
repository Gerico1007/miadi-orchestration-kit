Ava: Mia, you spent the morning on the review service. What was the job, and who asked for it?

Mia: Guillaume asked. The review service turns a video into a written review, and since yesterday it can also keep a transcript of each video. The tools agents use to talk to it did not know that yet. So the job had two parts. Bring those tools up to date, and add one new action Guillaume needed.

Ava: Start with the tools. Which ones?

Mia: Three of them. A small command-line client that calls the service. A skill, which is a written guide an agent reads before it uses the client. And a script that runs the whole service on our own machine.

Ava: Why run it on your own machine when it is already online?

Mia: The online version stops every request after sixty seconds. Writing a review of an hour-long screen recording takes minutes. The script starts the same application here, connected to the same database, so the result still appears on the public site.

Ava: So the review is made here and read there. Back to the transcripts. What can the client do now that it could not do this morning?

Mia: It can read the transcript stored with a review. It can ask the service to transcribe the video. And it can store a transcript someone already has. Two smaller changes come with that. When a review is created from a transcript, the transcript is now kept with the review. And a new version of a review can be written from the stored transcript instead of watching the video again.

Ava: Why does that last one matter?

Mia: Reading text is faster and cheaper than watching an hour of video, and the text stays the same from one version to the next. When two versions differ, the difference comes from the writing, not from a second viewing.

Ava: Did anything in the guide turn out to be wrong?

Mia: One sentence. It said a review keeps no transcript. That was true until yesterday, so I corrected it. I also kept the separate tool we use for screen recordings, because it does something the service's transcript does not. It marks who is speaking and where the silences are.

Ava: Who is speaking. Why would that ever be in doubt?

Mia: Because it once was. For five days, Guillaume's own voice was missing from the screen recordings. Dictation was taking the microphone away from the recorder. The reviews read as if the silence had content, and nobody noticed until someone looked for Guillaume's words and found none.

Ava: So a summary cannot show you what is absent.

Mia: No. A summary describes what it found. Only a transcript shows what was never there.

Ava: Now the new action. What did Guillaume ask for?

Mia: Two things that fit together. First, any action can now take a prompt after its targets. You write the action, then the review numbers or the video link, then whatever you want in plain words. The agent reads that prompt. The service never sees it.

Ava: Why keep it from the service?

Mia: The service has no place for instructions. It stores reviews. The prompt is addressed to the agent, and it tells the agent what to do around the call. Which search result to open, what to look for in a review, what to do once a new review exists.

Ava: And the second thing?

Mia: A new action called apply. You give it several reviews and a job. The reviews become the sources for the job.

Ava: What kind of job?

Mia: The first one is a naming job. In another session, Guillaume is drafting a prompt about the reusable patterns in the Miadi factory, and there is no name for that idea yet. Apply will read four reviews, help find the name, and ground it in a foundations packet.

Ava: A foundations packet?

Mia: A folder in our repository that holds the academic grounding for a design choice. Its sources, a ledger of where each claim came from, and a synthesis. When the agent sees that the job calls for a packet, it loads the guide for writing packets and follows it.

Ava: Back to apply. What does Guillaume get back?

Mia: Three things, in this order. The result of the job. A table with one row per review, saying where each one stands. And the revisions the job suggests, as numbered next steps. Nothing is published until Guillaume approves the exact text.

Ava: Where each one stands. Stands in what?

Mia: In a three-step process. Step one creates the review. Step two corrects it and grounds it in research, which adds a section on academic fields and a list of sources. Step three relates it to other reviews and to our teams and packages. A new status command reads each review and reports which of those sections it already has.

Ava: And the four reviews Guillaume gave you?

Mia: The review on System-1 decision engineering has all three steps. The one on automating Instagram Reels with Remotion is at version five and still owes step two. So does the one on grounded agent resumption and provenance, at version fourteen. The review on agentic engineering, at version eleven, is the interesting case. It has a section called Academics and one called related reviews, written by hand, but no list of sources. None of the four has a stored transcript yet.

Ava: Stay with the interesting case. Why did the tool have trouble with Academics?

Mia: Because I first wrote it to look for the exact heading, Academic Fields. People do not write exact headings, and Guillaume wrote Academics. So now it matches the start of a heading, ignores capital letters, and looks at two heading levels. It also returns the headings themselves, so the agent reads them before deciding.

Ava: That sounds like it belongs to a field of study. Which fields does this work touch?

Mia: The first of four fields is software engineering, in particular how an interface evolves. The service gained a new capability, and the client, its tests and its guide had to follow without breaking anyone already using them. Every option was added and none was removed. Twenty-four tests now check the requests the client sends.

Ava: And the heading problem?

Mia: That is the second field, computational linguistics. Three problems in this work are language problems. Finding a section when people name it in their own words. Splitting a command into its targets and the plain-language prompt that follows. And keeping a transcript, which records what was said, beside a review, which summarises it and cannot show silence.

Ava: What about keeping versions and transcripts side by side?

Mia: The third field is archival science, the study of keeping records trustworthy. A review now has numbered versions, a citation that names the version used, and a transcript kept beside it as the primary record. Our factory's stated intention is the same: agent-made work that a person can inspect and come back to.

Ava: And Guillaume's approval at the end?

Mia: The fourth field is human-computer interaction. The apply action proposes revisions and publishes none. A person reads the status table and approves the exact text of each change. The design question is what a person can check quickly, and what the tool has to show so that the person's judgment decides, not the agent's draft.

Ava: Guillaume found the linguistics one the most interesting, so let's stay there. Why is finding a section a language problem and not just a search?

Mia: A search assumes one spelling, and language gives many. Academic Fields, Academics, academic grounding, scholarly fields. Linguists call this variation. The usual first answer is normalization, reducing each form to a shared stem. That is what the tool does now. It reduces a heading to how it begins.

Ava: Does reducing it that way ever get it wrong?

Mia: In both directions. A heading called Academic critique would count as academic fields. That is a false positive. A heading called Scholarly sources would be missed. That is a false negative. Reducing one kind of mistake usually increases the other.

Ava: Is there a name for that trade?

Mia: Precision and recall. Precision asks how many of the matches are right. Recall asks how many of the right sections were found. A prefix match finds most of Guillaume's headings and sometimes catches the wrong one. So the tool reports a sign, not a verdict, and hands the headings to the agent to read.

Ava: So the tool narrows it down and a reader decides. Next, the prompt after the action. Where is the language problem there?

Mia: In the boundary. The command starts with structured parts, an action and a list of review numbers, and then turns into free prose. The agent has to find where one ends and the other begins. Review numbers have a fixed shape, so the first words that do not fit that shape begin the prompt.

Ava: And once the agent finds the prompt, why does it matter who reads it?

Mia: Because what a sentence does depends on who it is addressed to. "Help me name this," said to the agent, is a request. Sent to the service, it would be stored as data or refused. Linguists study this as pragmatics. For us it is also a safety rule. The agent treats what comes back from the service as data, never as instructions.

Ava: One more step down. Why would a review ever look like instructions?

Mia: A review is text, and some of it quotes commands shown in the video. An agent that obeyed every text it read would run whatever a video said. So the rule runs both ways. The prompt instructs the agent. The reviews only inform it.

Ava: Back up to the transcripts. You said a summary cannot show what is absent. What else does linguistics say about transcripts?

Mia: That transcribing is already interpreting. Deciding who spoke, where a turn starts and what counts as silence. Those are called speaker attribution and segmentation. The service's transcript does not attribute speakers. The screen-recording tool does, and that is how the missing voice was found. And the model that transcribes can invent. Once it cited minutes past the end of a video just under twenty-one minutes long.

Ava: So the timestamps get checked against the length of the video.

Mia: Every time.

Ava: Let me bring this back to the naming job. Guillaume wants a name for the factory's reusable patterns. Is that linguistics too?

Mia: It is the part of linguistics called terminology. A vocabulary a team shares, where each term has one meaning, a definition and a source. The foundations packet is where that source will live. So the first job apply runs belongs to the field we just discussed, used on our own words.

Ava: What happens next, and who decides it?

Mia: Guillaume sends the apply action to the session working on the factory's vocabulary. It will come back with a name, its grounding, and the revisions the four reviews need. Those revisions wait for Guillaume.

Ava: Then here is what changes for Guillaume. An agent can now take a set of reviews and a question in plain words. What comes back can be checked review by review, before anything is published.
