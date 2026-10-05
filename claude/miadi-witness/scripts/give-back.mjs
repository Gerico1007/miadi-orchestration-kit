#!/usr/bin/env node
// give-back — the GiveBack loop (P1 and P7 of the witness proposals, 2026-10-05).
//
// A seat's account of a session is a retelling. It goes back to the person in their talking
// circle with one question, and only their answer grounds it. The answer becomes the record's
// judgment link.
//
//   give-back.mjs account --session <id> --ceremony <id> --asked <a> --done <d> --next <n>
//                         [--from-turn <turn id>] [--seat mino] [--dry-run]
//       speak the three-line account as the seat's turn and record it as given back.
//       --from-turn names the person's turn this new version was written from.
//   give-back.mjs answer  --session <id> --turn <turn id> --verdict confirm|correct [--retelling <turn id>]
//       record the person's answer: confirm grounds the retelling, correct marks it corrected.
//       Either way the answer becomes the judgment link.
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
  const target = retelling ? list.find((r) => r.turn_id === retelling) : [...list].reverse().find((r) => r.state === "given_back" && (!ceremony || r.ceremony === ceremony));
  if (!target) throw new Error("no retelling waiting for an answer in this record");
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
  const version = (record.retellings ?? []).filter((r) => r.kind === "session_account").length + 1;
  record.retellings = [...(record.retellings ?? []), {
    turn_id: body.turn.id, kind: "session_account", version, ceremony: args.ceremony, state: "given_back", at: now,
    written_by: args.fromTurn ? `${args.seat} from turn ${args.fromTurn}` : args.seat,
  }];
  record.observations = [...(record.observations ?? []), { at: now, by, what: `Account version ${version} given back in ceremony ${args.ceremony} as turn ${body.turn.id}.` }];
  writeRecord(dir, existing.file, record);
  console.log(`given back · turn ${body.turn.id} · session ${args.session} · version ${version}`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT) main().then((code) => { process.exitCode = code; }, (err) => { console.error(`give-back: ${err.message}`); process.exitCode = 2; });
