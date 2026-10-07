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

// ---------- the three parent bases ----------

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clearLineageCache } from "./lineage.mjs";

const rec = (uuid, at, type = "user") => JSON.stringify({ type, uuid, timestamp: at, sessionId: "x" });

function projects(files) {
  clearLineageCache();
  const root = mkdtempSync(join(tmpdir(), "witness-lineage-"));
  const dir = join(root, "-seat");
  mkdirSync(dir);
  const births = new Map();
  for (const [id, { born, records, title }] of Object.entries(files)) {
    const path = join(dir, `${id}.jsonl`);
    const lines = title ? [JSON.stringify({ type: "custom-title", customTitle: title, sessionId: id })] : [];
    writeFileSync(path, `${[...lines, ...records].join("\n")}\n`);
    births.set(path, Date.parse(born));
  }
  return { root, lineage: { projectsRoot: root, infer: () => true, birth: (path) => births.get(path) ?? null } };
}

const seatLine = (id, extra = {}) => line(id, { cwd: "/seat", name: { name: `n-${id.slice(0, 4)}`, former: [] }, ...extra });

test("recorded: a fork line names the parent, and the transcript is not consulted", () => {
  const { lineage } = projects({ [A]: { born: "2026-09-26T00:00:00Z", records: [] } });
  const byId = buildThreads({ bindings: [seatLine(A), seatLine(B, { source: "fork", argv: ["claude", "--resume", A, "--fork-session"] })], lineage });
  assert.equal(byId.get(B).parent.basis, "recorded");
  assert.equal(byId.get(B).parent.session_id, A);
});

test("inferred from transcript: records copied from an earlier transcript give the parent, with evidence", () => {
  const { lineage } = projects({
    [A]: { born: "2026-09-26T00:00:00Z", title: "the-original", records: [rec("u1", "2026-09-26T01:00:00Z"), rec("u2", "2026-09-26T02:00:00Z", "system"), rec("u3", "2026-09-26T03:00:00Z")] },
    [B]: { born: "2026-09-28T00:00:00Z", records: [rec("u2", "2026-09-26T02:00:00Z", "system"), rec("u3", "2026-09-26T03:00:00Z"), rec("b1", "2026-09-28T01:00:00Z")] },
  });
  const byId = buildThreads({ bindings: [seatLine(B, { source: "resume" })], lineage });
  const parent = byId.get(B).parent;
  assert.equal(parent.basis, "inferred from transcript");
  assert.equal(parent.session_id, A);
  assert.equal(parent.evidence.shared_records, 2);
  assert.deepEqual(parent.evidence.first_copied, { at: "2026-09-26T02:00:00Z", type: "system" });
  // the parent was known only by its transcript, so it joins the model under its title
  assert.equal(byId.get(A).name, "the-original");
  assert.deepEqual(byId.get(A).sources, ["transcript"]);
  assert.deepEqual(byId.get(A).children, [B]);
});

test("unknown: no fork line and no earlier transcript sharing a record", () => {
  const { lineage } = projects({
    [A]: { born: "2026-09-26T00:00:00Z", records: [rec("u1", "2026-09-26T01:00:00Z")] },
    [B]: { born: "2026-09-28T00:00:00Z", records: [rec("b1", "2026-09-28T01:00:00Z")] },
  });
  const byId = buildThreads({ bindings: [seatLine(B, { source: "resume" })], lineage });
  assert.equal(byId.get(B).parent.basis, "unknown");
  assert.equal(byId.get(B).parent.known, false);
  assert.match(byId.get(B).parent.reason, /no earlier transcript in its folder shares a record/);
});

test("a later-born transcript is never a parent, and a tie is broken only by the parent's last record", () => {
  const { lineage } = projects({
    // A is the original; C forked from A and then wrote its own record c1
    [A]: { born: "2026-09-26T00:00:00Z", records: [rec("u1", "2026-09-26T01:00:00Z"), rec("u2", "2026-09-26T02:00:00Z")] },
    [C]: { born: "2026-09-27T00:00:00Z", records: [rec("u1", "2026-09-26T01:00:00Z"), rec("u2", "2026-09-26T02:00:00Z"), rec("c1", "2026-09-27T01:00:00Z")] },
    // B forked from A after C existed: it shares u1 and u2 with both, but not C's c1
    [B]: { born: "2026-09-28T00:00:00Z", records: [rec("u1", "2026-09-26T01:00:00Z"), rec("u2", "2026-09-26T02:00:00Z"), rec("b1", "2026-09-28T01:00:00Z")] },
    // D is born later and copies B whole: it must not become B's parent
    [D]: { born: "2026-09-29T00:00:00Z", records: [rec("u1", "2026-09-26T01:00:00Z"), rec("u2", "2026-09-26T02:00:00Z"), rec("b1", "2026-09-28T01:00:00Z")] },
  });
  const byId = buildThreads({ bindings: [seatLine(B, { source: "resume" })], lineage });
  assert.equal(byId.get(B).parent.session_id, A);
  assert.match(byId.get(B).parent.evidence.tiebreak, /only aaaaaaaa/);
});

test("fresh (recorded): a startup line with no fork line has no parent, and is not inferred", () => {
  const { lineage } = projects({
    [A]: { born: "2026-09-26T00:00:00Z", records: [rec("u1", "2026-09-26T01:00:00Z")] },
    // even a shared record does not turn a recorded startup into a fork
    [B]: { born: "2026-09-28T00:00:00Z", records: [rec("u1", "2026-09-26T01:00:00Z")] },
  });
  const byId = buildThreads({ bindings: [seatLine(B, { source: "startup", at: "2026-09-28T00:00:01Z" }), seatLine(B, { event: "session.rename", source: "" })], lineage });
  assert.equal(byId.get(B).parent.basis, "fresh");
  assert.equal(byId.get(B).parent.known, false);
  assert.match(byId.get(B).parent.via, /startup.*2026-09-28T00:00:01Z/);
  assert.equal(byId.has(A), false);
});
