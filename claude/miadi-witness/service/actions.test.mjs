import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { authorised, nextThreadName, planOpen, send, sendRefusal, shellQuote, writerToken } from "./actions.mjs";

const day = new Date(2026, 8, 29);

test("a new thread takes the next number any mino thread carried, and William's name pattern", () => {
  const names = ["mino-260926-fork-02", "mino-260928-fork-01-x", "mino-260929-fork-04-tide", "mino-260929-fresh-05-team-loop", "gaia-x"];
  assert.equal(nextThreadName({ kind: "fork", topic: "Kafka review!", names, date: day }), "mino-260929-fork-06-kafka-review");
  assert.equal(nextThreadName({ kind: "fresh", topic: "t", names: [], date: day }), "mino-260929-fresh-01-t");
  assert.throws(() => nextThreadName({ kind: "clone", topic: "t", names, date: day }), /fork" or "fresh/);
  assert.throws(() => nextThreadName({ kind: "fresh", topic: "!!", names, date: day }), /topic/);
});

test("open sets the team before the launch, forks by session id, and types into no pane", () => {
  const model = { threads: { p: { session_id: "p-id", names: ["mino-260929-fork-04-tide"], tmux: { session: "mino-260929-fork-04-tide" } } } };
  const plan = planOpen({ kind: "fork", topic: "check", parent: "mino-260929-fork-04-tide", model, seat: { folder: "/seat", team: "T3" } });
  // live tmux sessions on the host count too, so the number is at least 05
  assert.match(plan.name, /^mino-\d{6}-fork-\d{2}-check$/);
  assert.ok(Number(plan.name.split("-")[3]) >= 5);
  assert.deepEqual(plan.commands.map((c) => c[1]), ["new-session", "set-option", "respawn-pane"]);
  assert.deepEqual(plan.commands[1].slice(2), ["-t", plan.name, "@miadi-team", "T3"]);
  assert.match(plan.launch, /^claudeyolochroniclehoncho --resume p-id --fork-session -n mino-/);
  assert.ok(plan.commands.every((c) => c[1] !== "send-keys"));
  assert.throws(() => planOpen({ kind: "fork", topic: "x", parent: "nobody", model, seat: { folder: "/seat", team: "T3" } }), /no thread/);
});

test("a send goes only to a live idle thread with a pane", () => {
  const base = { session_id: "s", name: "n", live: true, status: "idle", tmux: { pane_id: "%1" } };
  assert.equal(sendRefusal(base), null);
  assert.match(sendRefusal({ ...base, status: "busy" }), /busy; a message goes only to an idle thread/);
  assert.match(sendRefusal({ ...base, live: false, status: "ended (other)" }), /not running/);
  assert.match(sendRefusal({ ...base, tmux: null }), /no tmux pane/);
  assert.equal(send({ thread: { ...base, status: "busy" }, message: "x" }).status, 409);
});

test("the dry run shows tide's command for a person, and run passes tide's refusal on word for word", () => {
  const dir = mkdtempSync(join(tmpdir(), "witness-tide-"));
  const fake = join(dir, "tide");
  writeFileSync(fake, `#!/bin/sh
case "$*" in
  *--run*) echo "Send/apply execution requires an interactive local terminal." >&2; exit 2 ;;
  *) echo '{"resolution_status":"resolved","command_plan":{"shell_commands":["tmux send-keys -l -t %1 x"]}}' ;;
esac
`, { mode: 0o755 });
  process.env.WITNESS_TIDE_BIN = fake;
  const thread = { session_id: "s", name: "n", live: true, status: "idle", tmux: { pane_id: "%1" } };
  const dry = send({ thread, message: "it's here" });
  assert.equal(dry.dry_run, true);
  assert.equal(dry.run_this_in_your_terminal, "tide operator send %1 --message 'it'\\''s here' --run");
  assert.equal(dry.tide_plan.resolution_status, "resolved");
  const applied = send({ thread, message: "x", run: true });
  assert.equal(applied.sent, false);
  assert.equal(applied.tide_exit, 2);
  assert.equal(applied.tide, "Send/apply execution requires an interactive local terminal.");
  delete process.env.WITNESS_TIDE_BIN;
});

test("the writer token comes from the environment or ~/.env, and a write needs it", () => {
  const dir = mkdtempSync(join(tmpdir(), "witness-env-"));
  writeFileSync(join(dir, ".env"), "OTHER=1\nexport MIADI_API_TOKEN_WRITER=\"abc123\"\n");
  assert.equal(writerToken({ WITNESS_ENV_FILE: join(dir, ".env") }), "abc123");
  assert.equal(writerToken({ MIADI_API_TOKEN_WRITER: "fromenv" }), "fromenv");
  assert.equal(authorised("Bearer abc123", "abc123").ok, true);
  assert.equal(authorised("Bearer nope", "abc123").status, 401);
  assert.equal(authorised("Bearer x", null).status, 503);
  assert.equal(shellQuote("a'b"), "'a'\\''b'");
});
