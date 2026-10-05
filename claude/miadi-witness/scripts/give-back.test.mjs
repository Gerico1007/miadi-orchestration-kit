// node --test claude/miadi-witness/scripts/give-back.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import { accountText, applyAnswer, pendingRetellings } from "./give-back.mjs";

const SID = "00b0a513-406d-42a9-9016-34fec5433b98";
const CER = "acd9889c-d10a-4edb-b994-69b2f5a4af23";

test("an account is three lines and one question", () => {
  const text = accountText({ session: SID, name: "fork1", asked: "draw the proposals", done: "a page and a system", next: "build A1 to A3" });
  const lines = text.split("\n");
  assert.equal(lines.length, 5);
  assert.match(lines[0], /^Account of session 00b0a513 \(fork1\), given back\.$/);
  assert.deepEqual(lines.slice(1, 4).map((l) => l.slice(0, 3)), ["1. ", "2. ", "3. "]);
  assert.match(lines[4], /^Is this what you meant\?/);
  assert.match(accountText({ session: SID, asked: "a", done: "b", next: "c", fromTurn: "c47eafa9-0ac2" }), /written from turn c47eafa9/);
});

function recordWith(...retellings) {
  return { session_id: SID, links: { question: [], trace: [], evidence: [], criteria: [], judgment: [] }, retellings };
}

test("only retellings given back and not yet answered are pending, per ceremony", () => {
  const records = [{ file: "a.json", record: recordWith({ turn_id: "t1", kind: "session_account", ceremony: CER, state: "given_back", at: "x" }, { turn_id: "t0", kind: "session_account", ceremony: CER, state: "grounded", at: "w" }) }];
  assert.deepEqual(pendingRetellings(records, CER).map((r) => r.turn_id), ["t1"]);
  assert.deepEqual(pendingRetellings(records, "another"), []);
});

test("an answer grounds or corrects the retelling, and becomes the judgment link", () => {
  const confirmed = recordWith({ turn_id: "t1", kind: "session_account", ceremony: CER, state: "given_back", at: "x" });
  applyAnswer(confirmed, { turn: "h1", verdict: "confirm", by: "test" });
  assert.equal(confirmed.retellings[0].state, "grounded");
  assert.equal(confirmed.links.judgment[0].ref, `turn:h1@${CER}`);

  const corrected = recordWith({ turn_id: "t1", kind: "session_account", ceremony: CER, state: "given_back", at: "x" });
  applyAnswer(corrected, { turn: "h2", verdict: "correct", retelling: "t1", by: "test" });
  assert.equal(corrected.retellings[0].state, "corrected");
  assert.equal(corrected.retellings[0].answered_by, "h2");

  assert.throws(() => applyAnswer(recordWith(), { turn: "h3", verdict: "confirm" }), /no retelling waiting/);
  assert.throws(() => applyAnswer(recordWith({ turn_id: "t1", ceremony: CER, state: "given_back" }), { turn: "h4", verdict: "maybe" }), /confirm or correct/);
});
