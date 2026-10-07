#!/usr/bin/env node
// give-back — the GiveBack loop (P1 and P7 of the witness proposals, 2026-10-05).
//
// A seat's account of a session is a retelling. It goes back to the person in their talking
// circle with one question, and only their answer grounds it. The answer becomes the record's
// judgment link.
//
//   give-back.mjs account --session <id> --ceremony <id> --asked <a> --done <d> --next <n>
//                         [--for <person>] [--from-turn <turn id>] [--seat mino] [--dry-run]
//       --for names the person the account is given to (default WITNESS_PERSON, else Guillaume);
//       only that person's turn can answer it.
//       speak the three-line account as the seat's turn and record it as given back.
//       --from-turn names the person's turn this new version was written from.
//   give-back.mjs answer  --session <id> --turn <turn id> --verdict confirm|correct [--retelling <turn id>]
//       record the person's answer: confirm grounds the retelling, correct marks it corrected.
//       Either way the answer becomes the judgment link.
//   give-back.mjs record  --session <id> --ceremony <id> --turn <turn id> [--from-turn <id>]
//       record a turn already spoken in the circle (the recovery when account posted but could not write).
//   give-back.mjs pending [--ceremony <id>] [--json]
//       retellings still waiting for an answer.
//
// The seat speaks with its own token (MIADI_<SEAT>_TOKEN), never the person's. Tokens and
// MIADI_API_URL come from the environment, else from ~/.env, and are never printed.

import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { inventoryDir, readInventory } from "./inventory.mjs";
import { addLink } from "./links-lib.mjs";

const SCRIPT = fileURLToPath(import.meta.url);
const QUESTION = "Is this what you meant? Answer here: yes, or say what to correct.";

export function envValue(name, env = process.env) {
  if (env[name]) return env[name];
  const file = join(homedir(), ".env");
  if (!existsSync(file)) return "";
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(new RegExp(`^\\s*(?:export\\s+)?${name}=(.*)$`));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

export function accountText({ session, name, asked, done, next, fromTurn }) {
  const head = `Account of session ${session.slice(0, 8)}${name ? ` (${name})` : ""}, given back${fromTurn ? `, written from turn ${fromTurn.slice(0, 8)}` : ""}.`;
  return [head, `1. Asked: ${asked}`, `2. Done: ${done}`, `3. Next: ${next}`, QUESTION].join("\n");
}

export function pendingRetellings(records, ceremony) {
  const out = [];
  for (const { file, record } of records) {
    for (const r of record.retellings ?? []) {
      if (r.state !== "given_back") continue;
      if (ceremony && r.ceremony !== ceremony) continue;
      out.push({ file, session_id: record.session_id, ...r });
    }
  }
  return out;
}

// What the record looks like once the person has answered.
export function applyAnswer(record, { turn, ceremony, verdict, retelling, now = new Date().toISOString(), by }) {
  const list = record.retellings ?? [];
  const waiting = (r) => r.state === "given_back" && (!ceremony || r.ceremony === ceremony);
  const target = retelling ? list.find((r) => r.turn_id === retelling) : [...list].reverse().find(waiting);
  if (!target) throw new Error("no retelling waiting for an answer in this record");
  // An answered retelling is reopened by a new version, never by re-answering it.
  if (!waiting(target)) throw new Error(`retelling ${target.turn_id} is ${target.state}${ceremony && target.ceremony !== ceremony ? ` in ceremony ${target.ceremony}` : ""}, not waiting for an answer here`);
  if (!["confirm", "correct"].includes(verdict)) throw new Error("verdict is confirm or correct");
  target.state = verdict === "confirm" ? "grounded" : "corrected";
  target.answered_by = turn;
  target.answered_at = now;
  addLink(record, "judgment", `turn:${turn}@${target.ceremony}`, { note: `${verdict} of retelling ${target.turn_id}`, by, now });
  record.observations = [...(record.observations ?? []), { at: now, by, what: `Answer ${turn} ${verdict === "confirm" ? "grounded" : "corrected"} the retelling ${target.turn_id}.` }];
  return target;
}

function writeRecord(dir, file, record) {
  const path = join(dir, file);
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(record, null, 2)}\n`);
  renameSync(tmp, path);
}

function parseArgs(argv) {
  const a = { _: [], seat: "mino", json: false, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === "--session") a.session = v();
    else if (k === "--ceremony") a.ceremony = v();
    else if (k === "--asked") a.asked = v();
    else if (k === "--done") a.done = v();
    else if (k === "--next") a.next = v();
    else if (k === "--from-turn") a.fromTurn = v();
    else if (k === "--turn") a.turn = v();
    else if (k === "--verdict") a.verdict = v();
    else if (k === "--retelling") a.retelling = v();
    else if (k === "--for") a.for = v();
    else if (k === "--seat") a.seat = v();
    else if (k === "--json") a.json = true;
    else if (k === "--dry-run") a.dryRun = true;
    else a._.push(k);
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const dir = inventoryDir();
  const inventory = readInventory(dir);
  const by = `${args.seat} (give-back.mjs)`;

  if (command === "pending") {
    const list = pendingRetellings(inventory.records ?? [...inventory.byId.values()], args.ceremony);
    if (args.json) console.log(JSON.stringify(list, null, 2));
    else if (!list.length) console.log("give-back: nothing waiting for an answer");
    else for (const r of list) console.log(`${r.turn_id} · session ${r.session_id} · ${r.kind} · ceremony ${r.ceremony} · given back ${r.at}`);
    return 0;
  }

  if (command === "record") {
    if (!args.session || !args.ceremony || !args.turn) {
      console.error("give-back: record needs --session, --ceremony and --turn");
      return 2;
    }
    try {
      const version = recordRetelling(dir, args.session, { turnId: args.turn, ceremony: args.ceremony, seat: args.seat, fromTurn: args.fromTurn, forPerson: args.for, by, now: new Date().toISOString() });
      console.log(`recorded  · turn ${args.turn} · session ${args.session} · version ${version}`);
      return 0;
    } catch (err) {
      console.error(`give-back: ${err.message}`);
      return 2;
    }
  }

  if (!["account", "answer"].includes(command) || !args.session) {
    console.error("usage: give-back.mjs account|answer --session <id> … | pending [--ceremony <id>] (see the header of this file)");
    return 2;
  }
  const existing = inventory.byId.get(args.session);
  if (!existing) {
    console.error(`give-back: no record for ${args.session}; run inventory.mjs write --session ${args.session} first`);
    return 2;
  }
  const record = structuredClone(existing.record);
  const now = new Date().toISOString();

  if (command === "answer") {
    if (!args.turn || !args.verdict) {
      console.error("give-back: answer needs --turn and --verdict confirm|correct");
      return 2;
    }
    let target;
    try {
      target = applyAnswer(record, { turn: args.turn, ceremony: args.ceremony, verdict: args.verdict, retelling: args.retelling, now, by });
    } catch (err) {
      console.error(`give-back: ${err.message}`);
      return 2;
    }
    writeRecord(dir, existing.file, record);
    console.log(`answered  ${existing.file} · retelling ${target.turn_id} is ${target.state} · judgment turn:${args.turn}@${target.ceremony}`);
    return 0;
  }

  for (const k of ["ceremony", "asked", "done", "next"]) {
    if (!args[k]) {
      console.error(`give-back: account needs --${k}`);
      return 2;
    }
  }
  const said = accountText({ session: args.session, name: record.claude_session_name, asked: args.asked, done: args.done, next: args.next, fromTurn: args.fromTurn });
  if (args.dryRun) {
    console.log(said);
    return 0;
  }
  const api = envValue("MIADI_API_URL");
  const token = envValue(`MIADI_${args.seat.toUpperCase()}_TOKEN`);
  if (!api || !token) {
    console.error(`give-back: MIADI_API_URL and MIADI_${args.seat.toUpperCase()}_TOKEN are needed`);
    return 2;
  }
  const res = await fetch(`${api}/api/ceremony/${encodeURIComponent(args.ceremony)}/turns`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ said, title: `Account of session ${args.session.slice(0, 8)}, given back` }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.turn?.id) {
    console.error(`give-back: the circle refused the turn (${res.status} ${body.error ?? ""})`);
    return 2;
  }
  // The turn is in the circle now. Record it on the record as it is on disk at this moment,
  // so a write made by another tool since the start is kept.
  try {
    const version = recordRetelling(dir, args.session, { turnId: body.turn.id, ceremony: args.ceremony, seat: args.seat, fromTurn: args.fromTurn, forPerson: args.for, by, now });
    console.log(`given back · turn ${body.turn.id} · session ${args.session} · version ${version}`);
    return 0;
  } catch (err) {
    console.error(`give-back: turn ${body.turn.id} is in the circle but the record was not written (${err.message}). Record it with:`);
    console.error(`  node "${SCRIPT}" record --session ${args.session} --ceremony ${args.ceremony} --turn ${body.turn.id}${args.fromTurn ? ` --from-turn ${args.fromTurn}` : ""}`);
    return 2;
  }
}

// Record a turn already spoken in the circle as a retelling waiting for an answer.
export function recordRetelling(dir, sessionId, { turnId, ceremony, seat = "mino", fromTurn, forPerson = process.env.WITNESS_PERSON || "Guillaume", by, now = new Date().toISOString() }) {
  const existing = readInventory(dir).byId.get(sessionId);
  if (!existing) throw new Error(`no record for ${sessionId}`);
  const record = structuredClone(existing.record);
  if ((record.retellings ?? []).some((r) => r.turn_id === turnId)) throw new Error(`turn ${turnId} is already recorded`);
  const version = (record.retellings ?? []).filter((r) => r.kind === "session_account").length + 1;
  record.retellings = [...(record.retellings ?? []), {
    turn_id: turnId, kind: "session_account", version, ceremony, state: "given_back", at: now, for: forPerson,
    written_by: fromTurn ? `${seat} from turn ${fromTurn}` : seat,
  }];
  record.observations = [...(record.observations ?? []), { at: now, by, what: `Account version ${version} given back in ceremony ${ceremony} as turn ${turnId}.` }];
  writeRecord(dir, existing.file, record);
  return version;
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT) main().then((code) => { process.exitCode = code; }, (err) => { console.error(`give-back: ${err.message}`); process.exitCode = 2; });
