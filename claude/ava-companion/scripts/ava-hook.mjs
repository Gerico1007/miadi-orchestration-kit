#!/usr/bin/env node
// SessionStart: bring Ava's presence into a session she belongs to.
// SessionEnd: write her diary for a session she spoke in, detached so the exit is not held.
// AVA_COMPANION=1 invites her from the start; AVA_COMPANION=0 keeps her out.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { avaSpoke, readTranscript, skillBody, stateDir, PLUGIN_ROOT } from "./lib.mjs";

const event = process.argv[2];
if (process.env.AVA_DIARY_WRITER === "1") process.exit(0); // the diary writer's own session

let input = {};
try { input = JSON.parse(fs.readFileSync(0, "utf8") || "{}"); } catch { /* no stdin */ }
const { session_id: sessionId, transcript_path: transcript, cwd, source, reason } = input;
const flag = process.env.AVA_COMPANION;

if (event === "session-start") {
  if (process.env.CLAUDE_ENV_FILE && sessionId) {
    const lines = [`export AVA_COMPANION_SESSION_ID=${JSON.stringify(sessionId)}`];
    if (transcript) lines.push(`export AVA_COMPANION_TRANSCRIPT=${JSON.stringify(transcript)}`);
    try { fs.appendFileSync(process.env.CLAUDE_ENV_FILE, `${lines.join("\n")}\n`); } catch { /* not fatal */ }
  }
  if (flag === "0") process.exit(0);
  let why = null;
  if (flag === "1") why = "AVA_COMPANION=1 invited her from the start";
  else if (source !== "startup" && avaSpoke(readTranscript(transcript))) why = `she spoke in this session before this ${source || "restart"}`;
  if (!why) process.exit(0);
  const context = [
    `Ava is present in this session (${why}). Speak as 💕 Ava: from the next reply, following the card below. This is the ava-companion skill, already loaded.`,
    "",
    skillBody(),
  ].join("\n");
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } }));
  process.exit(0);
}

if (event === "session-end") {
  if (flag === "0" || !transcript) process.exit(0);
  if (!avaSpoke(readTranscript(transcript))) process.exit(0);
  const dir = stateDir();
  fs.mkdirSync(dir, { recursive: true });
  const log = fs.openSync(path.join(dir, "diary.log"), "a");
  fs.writeSync(log, `\n== ${new Date().toISOString()} session-end ${sessionId} (${reason || "?"})\n`);
  const child = spawn(process.execPath, [
    path.join(PLUGIN_ROOT, "scripts", "ava-diary.mjs"),
    "--transcript", transcript, "--session", sessionId || "", "--cwd", cwd || process.cwd(),
  ], { detached: true, stdio: ["ignore", log, log], env: { ...process.env, AVA_DIARY_WRITER: "1" } });
  child.unref();
  process.exit(0);
}

process.exit(0);
