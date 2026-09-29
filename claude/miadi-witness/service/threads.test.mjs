import assert from "node:assert/strict";
import { test } from "node:test";

import { buildThreads, forkParentRef, groupTree, teamFor, tmuxFromRegistry } from "./threads.mjs";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const C = "cccccccc-0000-4000-8000-000000000003";
const D = "dddddddd-0000-4000-8000-000000000004";

const line = (session_id, extra) => ({ agent: "claude", session_id, at: "2026-09-29T11:00:00.000Z", event: "session.start", source: "startup", ...extra });

test("the fork parent comes from argv, by session id or by a name exactly one other thread carried", () => {
  const byId = buildThreads({
    bindings: [
      line(A, { name: { name: "mino-original", former: [] } }),
      line(B, { source: "fork", argv: ["claude", "--resume", "mino-original", "--fork-session"], name: { name: "mino-original", former: [] } }),
      line(C, { source: "fork", argv: ["claude", "--resume", A, "--fork-session"], name: { name: "x", former: [] } }),
      line(D, { source: "fork", argv: ["claude", "--resume", "--fork-session"], name: { name: "y", former: [] } }),
    ],
  });
  assert.deepEqual([byId.get(B).parent.known, byId.get(B).parent.session_id], [true, A]);
  assert.deepEqual([byId.get(C).parent.known, byId.get(C).parent.session_id], [true, A]);
  assert.equal(byId.get(D).parent.known, false);
  assert.match(byId.get(D).parent.reason, /picker/);
  assert.deepEqual(byId.get(A).children.sort(), [B, C].sort());
});

test("a thread with no fork line has an unknown parent, even when its name says fork", () => {
  const byId = buildThreads({ bindings: [line(A, { source: "resume", name: { name: "mino-260926-fork-02", former: [] } })] });
  assert.equal(byId.get(A).parent.known, false);
  assert.equal(byId.get(A).parent.reason, "no fork line in the binding file");
});

test("a name carried by two other threads is not resolved", () => {
  const byId = buildThreads({
    bindings: [
      line(A, { name: { name: "twin", former: [] } }),
      line(B, { name: { name: "twin", former: [] } }),
      line(C, { source: "fork", argv: ["claude", "--resume", "twin", "--fork-session"] }),
    ],
  });
  assert.equal(byId.get(C).parent.known, false);
  assert.match(byId.get(C).parent.reason, /carried by 2 threads/);
});

test("registry status wins for a live process; an end line marks an ended thread", () => {
  const byId = buildThreads({
    bindings: [line(A), { ...line(A), event: "session.end", source: "prompt_input_exit" }, line(B)],
    sessions: [{ sessionId: B, pid: 1, alive: true, status: "idle", name: "b-now", formerNames: [{ name: "b-before" }], tmux: "mino-b:@3.%9" }],
  });
  assert.equal(byId.get(A).status, "ended (prompt_input_exit)");
  assert.equal(byId.get(B).status, "idle");
  assert.deepEqual(byId.get(B).names, ["b-before", "b-now"]);
  assert.deepEqual(byId.get(B).tmux, { session: "mino-b", window: 3, pane_id: "%9" });
});

test("teams: binding team first, then teams.json sessions, folders (longest), name patterns", () => {
  const teams = { teams: [
    { id: "T1", sessions: ["gaia-x"], folders: ["/a"], name_patterns: [] },
    { id: "T3", sessions: [], folders: ["/a/seat"], name_patterns: ["^mino-"] },
  ] };
  assert.equal(teamFor({ tmuxSession: "gaia-x", cwd: "/a/seat" }, teams).id, "T1");
  assert.equal(teamFor({ cwd: "/a/seat/deeper" }, teams).id, "T3");
  assert.equal(teamFor({ name: "mino-1", cwd: "/elsewhere" }, teams).id, "T3");
  assert.equal(teamFor({ name: "z", cwd: "/elsewhere" }, teams).id, "unassigned");
  const byId = buildThreads({ bindings: [line(A, { team: { id: "T2", source: "declared" }, cwd: "/a/seat" })], teams });
  assert.equal(byId.get(A).team.id, "T2");
});

test("the tree nests forks under their parent and groups roots by team and seat", () => {
  const seats = { seats: [{ id: "mino", folder: "/seat" }] };
  const byId = buildThreads({
    bindings: [
      line(A, { cwd: "/seat", name: { name: "orig", former: [] }, team: { id: "T3" } }),
      line(B, { cwd: "/seat", source: "fork", argv: ["claude", "--resume", A, "--fork-session"], team: { id: "T3" } }),
    ],
    seats,
  });
  const tree = groupTree(byId, { teams: [{ id: "T3", name: "Witness" }] });
  assert.equal(tree.length, 1);
  assert.equal(tree[0].seats[0].id, "mino");
  assert.equal(tree[0].seats[0].roots.length, 1);
  assert.equal(tree[0].seats[0].roots[0].children[0].session_id, B);
});

test("helpers", () => {
  assert.equal(tmuxFromRegistry("nope"), null);
  assert.deepEqual(forkParentRef(["claude", "--resume", "x"]), { ref: null, reason: "argv has no --fork-session" });
});
