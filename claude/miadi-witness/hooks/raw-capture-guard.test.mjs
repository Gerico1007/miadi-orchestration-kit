// node --test claude/miadi-witness/hooks/raw-capture-guard.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const GUARD = fileURLToPath(new URL("./raw-capture-guard.sh", import.meta.url));
const KEEPER = "miadi-witness:inventory-keeper";

function run(payload, spaced = false) {
  const input = spaced ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
  const r = spawnSync("bash", [GUARD], { input, encoding: "utf8" });
  return { code: r.status, stderr: r.stderr };
}
const bash = (command, agent_type) => ({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command }, ...(agent_type ? { agent_id: "a1", agent_type } : {}) });
const read = (file_path, agent_type) => ({ hook_event_name: "PreToolUse", tool_name: "Read", tool_input: { file_path }, ...(agent_type ? { agent_id: "a1", agent_type } : {}) });

test("the keeper is refused the raw ledgers, transcripts and binding line, and told what to use", () => {
  for (const payload of [
    bash("cd /src/_sessiondata/5ed20a97 && jq -r .prompt _claude_user_inputs.jsonl", KEEPER),
    bash("jq . /src/_sessiondata/x/last_claude_AssistantResponse.json", KEEPER),
    bash("grep commit /home/mia/.claude/projects/-a-src/f3bb7273.jsonl | head", KEEPER),
    bash("tail -3 /src/_sessiondata/data/terminal_bindings.jsonl", KEEPER),
    read("/home/mia/.claude/projects/-a-src/abc/subagents/agent-a1.jsonl", KEEPER),
  ]) {
    const r = run(payload);
    assert.equal(r.code, 2, JSON.stringify(payload.tool_input));
    assert.match(r.stderr, /miadi-hooks-interpret digest/);
  }
  assert.equal(run(bash("jq . _claude_PreToolUse.jsonl", KEEPER), true).code, 2, "pretty-printed input is matched too");
});

test("the keeper keeps the interpreter, the inventory script, the schema and its records", () => {
  for (const payload of [
    bash("miadi-hooks-interpret digest e549d4a2-a95e-4d64-882b-06bd1f759f89 985ad58a-9301-4f10-bf3e-f4b3d7faa490", KEEPER),
    bash("node $S write --session e549d4a2-a95e-4d64-882b-06bd1f759f89", KEEPER),
    read("/home/mia/workspace/.mino/session-inventory/SCHEMA.md", KEEPER),
    bash("git -C /a/src/IAIP log -1 --format=%s fbb0966", KEEPER),
  ]) assert.equal(run(payload).code, 0, JSON.stringify(payload.tool_input));
});

test("every other session and agent passes untouched", () => {
  assert.equal(run(bash("jq . /src/_sessiondata/x/_claude_PreToolUse.jsonl")).code, 0);
  assert.equal(run(bash("jq . /src/_sessiondata/x/_claude_PreToolUse.jsonl", "miadi-witness:witness-editor")).code, 0);
});
