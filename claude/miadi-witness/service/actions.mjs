// actions — what the witness service does besides reading: open a mino thread, prepare a
// send to an idle thread, and read a pane back.
//
// Open starts a new tmux session named by William's pattern, mino-<yymmdd>-<fork|fresh>-NN-<topic>,
// in the seat folder. It sets @miadi-team before anything starts, then replaces the pane's shell
// with the seat's launch alias. Nothing is typed into any pane.
//
// Send goes through `tide operator send` only, and only to an idle thread. It is a dry run that
// returns tide's plan and the exact command a person runs. With run, it calls
// `tide operator send --run`. tide refuses that without an interactive terminal: this is
// William's consent guard, and the refusal is passed on word for word.

import { execFileSync, spawnSync } from "node:child_process";
import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const LAUNCH_ALIAS = process.env.WITNESS_LAUNCH_ALIAS || "claudeyolochroniclehoncho";

// ---------- the writer token ----------

export function writerToken(env = process.env) {
  if (env.MIADI_API_TOKEN_WRITER) return env.MIADI_API_TOKEN_WRITER;
  const file = env.WITNESS_ENV_FILE || join(homedir(), ".env");
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*(?:export\s+)?MIADI_API_TOKEN_WRITER\s*=\s*(.*)\s*$/);
      if (match) return match[1].replace(/^(['"])(.*)\1$/, "$2");
    }
  } catch { /* no env file: writes stay disabled */ }
  return null;
}

export function authorised(header, token) {
  if (!token) return { ok: false, status: 503, error: "no writer token is configured (MIADI_API_TOKEN_WRITER); writes are disabled" };
  const given = String(header ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, status: 401, error: "a write needs Authorization: Bearer <MIADI_API_TOKEN_WRITER>" };
  return { ok: true };
}

// ---------- names ----------

export function slug(text) {
  return String(text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
}

export function yymmdd(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${String(date.getFullYear()).slice(2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

// NN is one more than the highest number any mino thread or tmux session has carried, so a
// name is never reused.
export function nextThreadName({ kind, topic, names, date = new Date() }) {
  if (!["fork", "fresh"].includes(kind)) throw new Error('kind must be "fork" or "fresh"');
  const topicSlug = slug(topic);
  if (!topicSlug) throw new Error("a thread needs a topic");
  const numbers = names.map((name) => String(name).match(/^mino-\d{6}-(?:fork|fresh)-(\d+)/)?.[1]).filter(Boolean).map(Number);
  const nn = String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(2, "0");
  return `mino-${yymmdd(date)}-${kind}-${nn}-${topicSlug}`;
}

export function shellQuote(text) {
  return `'${String(text).replace(/'/g, `'\\''`)}'`;
}

function tmuxSessions() {
  try {
    return execFileSync("tmux", ["list-sessions", "-F", "#{session_name}"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// ---------- open ----------

export function planOpen({ kind, topic, parent = null, model, seat }) {
  const known = Object.values(model.threads).flatMap((thread) => [...thread.names, thread.tmux?.session].filter(Boolean));
  const name = nextThreadName({ kind, topic, names: [...known, ...tmuxSessions()] });
  let parentId = null;
  if (kind === "fork") {
    const hit = Object.values(model.threads).find((thread) => thread.session_id === parent || thread.names.includes(parent) || thread.tmux?.session === parent);
    if (!hit) throw new Error(`no thread "${parent ?? ""}" to fork from`);
    parentId = hit.session_id;
  }
  const launch = [LAUNCH_ALIAS, ...(parentId ? ["--resume", parentId, "--fork-session"] : []), "-n", name].join(" ");
  // the pane keeps a shell after claude exits, so its last screen (and resume line) stays readable
  const paneCommand = `${launch}; exec bash -i`;
  const commands = [
    ["tmux", "new-session", "-d", "-s", name, "-c", seat.folder],
    ["tmux", "set-option", "-t", name, "@miadi-team", seat.team],
    ["tmux", "respawn-pane", "-k", "-t", `${name}:0.0`, "-c", seat.folder, `bash -ic ${shellQuote(paneCommand)}`],
  ];
  return { name, kind, parent: parentId, folder: seat.folder, team: seat.team, launch, commands };
}

export function runOpen(plan) {
  if (tmuxSessions().includes(plan.name)) throw new Error(`tmux session ${plan.name} already exists`);
  for (const command of plan.commands) execFileSync(command[0], command.slice(1), { stdio: ["ignore", "pipe", "pipe"] });
  return { ...plan, opened: true };
}

// ---------- send and peek, through tide ----------

function tide(args) {
  const bin = process.env.WITNESS_TIDE_BIN || "tide";
  const result = spawnSync(bin, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000 });
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error?.message ?? null };
}

export function findThread(model, target) {
  return Object.values(model.threads).find((thread) => thread.session_id === target || thread.session_id.startsWith(target) || thread.names.includes(target) || thread.tmux?.session === target) ?? null;
}

export function sendRefusal(thread) {
  if (!thread) return "no such thread";
  if (!thread.live) return `${thread.name ?? thread.session_id} is not running (${thread.status})`;
  if (thread.status !== "idle") return `${thread.name ?? thread.session_id} is ${thread.status}; a message goes only to an idle thread`;
  if (!thread.tmux?.pane_id) return `${thread.name ?? thread.session_id} has no tmux pane`;
  return null;
}

export function send({ thread, message, run = false }) {
  const refusal = sendRefusal(thread);
  if (refusal) return { ok: false, status: 409, error: refusal };
  if (!String(message ?? "").trim()) return { ok: false, status: 400, error: "a send needs a message" };
  const target = thread.tmux.pane_id;
  const person = `tide operator send ${target} --message ${shellQuote(message)} --run`;
  const plan = tide(["operator", "send", target, "--message", message, "--format", "json"]);
  let parsed = null;
  try {
    parsed = JSON.parse(plan.stdout);
  } catch { /* tide printed no plan: its own words are passed on below */ }
  if (!parsed) {
    return { ok: false, status: 502, error: `tide gave no plan: ${plan.error ?? (`${plan.stdout}${plan.stderr}`.trim() || `exit ${plan.code}`)}`, run_this_in_your_terminal: person };
  }
  const base = { thread: thread.session_id, name: thread.name, target, run_this_in_your_terminal: person, tide_plan: parsed };
  if (!run) return { ok: true, status: 200, dry_run: true, ...base };
  const applied = tide(["operator", "send", target, "--message", message, "--run"]);
  const said = `${applied.stdout}${applied.stderr}`.trim();
  return applied.code === 0
    ? { ok: true, status: 200, dry_run: false, sent: true, tide: said, ...base }
    : { ok: false, status: 409, dry_run: false, sent: false, tide_exit: applied.code, tide: said || applied.error, ...base };
}

export function peek({ thread, lines = 40 }) {
  if (!thread?.tmux?.pane_id) return { ok: false, status: 409, error: "no tmux pane for that thread" };
  const out = tide(["operator", "peek", thread.tmux.pane_id, "--lines", String(Math.min(400, Math.max(1, Number(lines) || 40))), "--format", "json"]);
  try {
    return { ok: true, status: 200, thread: thread.session_id, ...JSON.parse(out.stdout) };
  } catch {
    return { ok: out.code === 0, status: out.code === 0 ? 200 : 502, thread: thread.session_id, tide: `${out.stdout}${out.stderr}`.trim() };
  }
}

