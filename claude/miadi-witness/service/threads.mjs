// threads — the witness team's view of every Claude Code thread on this host, read-only.
//
// A thread is one Claude Code session id. Four sources, each read as it is:
//   ~/.claude/sessions/<pid>.json          live sessions: name, formerNames, status, tmux, cwd
//   <sessiondata>/data/terminal_bindings.jsonl
//                                          one line per start, rename, end; a fork is a
//                                          session.start with source "fork" whose argv holds
//                                          --resume <parent> --fork-session
//   <kit>/teams/teams.json                 the team of a session whose binding line has none
//   <sessiondata>/<session_id>/_claude_user_inputs.jsonl
//                                          the last input William sent (records carry no time)
//
// The parent of a thread comes from its fork line and nothing else. A thread with no fork
// line is "recorded". For threads in a configured seat, lineage.mjs can infer a parent from
// records a fork copied out of its parent's transcript; that parent is "inferred from
// transcript" and carries its evidence. A thread whose binding line is a session.start with
// source "startup" has no parent: it is "fresh", recorded. Otherwise the parent is "unknown",
// even when the thread's name says "fork".

import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { inferParent, transcriptDirForCwd } from "./lineage.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function defaultPaths(env = process.env) {
  const sessiondata = env.MIADI_SESSIONDATA_ROOT || "/src/_sessiondata";
  return {
    sessionsDir: env.WITNESS_CLAUDE_SESSIONS_DIR || join(homedir(), ".claude", "sessions"),
    bindings: env.WITNESS_BINDINGS || join(sessiondata, "data", "terminal_bindings.jsonl"),
    sessiondata,
    teams: env.WITNESS_TEAMS_JSON || resolve(HERE, "..", "..", "..", "teams", "teams.json"),
    projects: env.WITNESS_CLAUDE_PROJECTS_DIR || join(homedir(), ".claude", "projects"),
    seats: env.WITNESS_SEATS_JSON || join(HERE, "seats.json"),
  };
}

// ---------- readers ----------

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export function readBindings(path) {
  if (!existsSync(path)) return { lines: [], errors: [`no binding file at ${path}`] };
  const lines = [];
  let bad = 0;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    if (!raw.trim()) continue;
    try {
      lines.push(JSON.parse(raw));
    } catch {
      bad += 1;
    }
  }
  return { lines, errors: bad ? [`${bad} unreadable binding lines skipped`] : [] };
}

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

export function readSessionFiles(dir, { alive = pidAlive } = {}) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^\d+\.json$/.test(name))
    .map((name) => readJson(join(dir, name), null))
    .filter((record) => record && record.sessionId)
    .map((record) => ({ ...record, alive: alive(record.pid) }));
}

// The last input William typed. Peer messages, idle notices and task notifications reach
// the same hook, so they are skipped. Only the tail of the file is read.
export const MACHINE_PROMPT = /^\s*(<cross-session-message\b|\[Cross-session idle notice\]|<task-notification>|<local-command-|<command-name>)/;

function readTail(path, bytes) {
  const size = statSync(path).size;
  const start = Math.max(0, size - bytes);
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(size - start);
    readSync(fd, buffer, 0, buffer.length, start);
    const text = buffer.toString("utf8");
    return start > 0 ? text.slice(text.indexOf("\n") + 1) : text;
  } finally {
    closeSync(fd);
  }
}

export function lastWilliamInput(sessiondata, sessionId, { maxChars = 600 } = {}) {
  const path = join(sessiondata, sessionId, "_claude_user_inputs.jsonl");
  if (!existsSync(path)) return null;
  let tail;
  try {
    tail = readTail(path, 512 * 1024);
  } catch {
    return null;
  }
  const records = tail.split("\n").filter(Boolean).reverse();
  for (const raw of records) {
    let record;
    try {
      record = JSON.parse(raw);
    } catch {
      continue;
    }
    const prompt = typeof record.prompt === "string" ? record.prompt : "";
    if (!prompt.trim() || MACHINE_PROMPT.test(prompt)) continue;
    const text = prompt.trim();
    return {
      text: text.length > maxChars ? `${text.slice(0, maxChars)} …` : text,
      chars: text.length,
      when: null, // the hook records no time; never infer one from the file
      source: path,
    };
  }
  return null;
}

// ---------- teams and seats ----------

export function teamFor({ tmuxSession, name, cwd }, teams) {
  const list = teams?.teams ?? [];
  const names = [tmuxSession, name].filter(Boolean);
  for (const team of list) {
    if ((team.sessions ?? []).some((session) => names.includes(session))) return { id: team.id, source: "teams.json sessions" };
  }
  let best = null;
  for (const team of list) {
    for (const folder of team.folders ?? []) {
      if (cwd && (cwd === folder || cwd.startsWith(`${folder}/`)) && (!best || folder.length > best.length)) {
        best = { id: team.id, length: folder.length };
      }
    }
  }
  if (best) return { id: best.id, source: "teams.json folders" };
  for (const team of list) {
    if ((team.name_patterns ?? []).some((pattern) => names.some((value) => new RegExp(pattern).test(value)))) {
      return { id: team.id, source: "teams.json name_patterns" };
    }
  }
  return { id: "unassigned", source: "teams.json" };
}

export function seatFor({ cwd, names }, seats) {
  for (const seat of seats?.seats ?? []) {
    if (seat.folder && cwd && (cwd === seat.folder || cwd.startsWith(`${seat.folder}/`))) return seat.id;
    if ((seat.name_patterns ?? []).some((pattern) => names.some((value) => new RegExp(pattern).test(value)))) return seat.id;
  }
  return cwd ? `folder:${cwd}` : "folder:unknown";
}

// ---------- the model ----------

export function tmuxFromRegistry(value) {
  // "session:@window.%pane"
  const match = typeof value === "string" ? value.match(/^(.*):@(\d+)\.(%\d+)$/) : null;
  return match ? { session: match[1], window: Number(match[2]), pane_id: match[3] } : null;
}

function pushName(list, name) {
  if (name && list.at(-1) !== name && !list.includes(name)) list.push(name);
}

export function forkParentRef(argv) {
  if (!Array.isArray(argv) || !argv.includes("--fork-session")) return { ref: null, reason: "argv has no --fork-session" };
  const at = argv.indexOf("--resume");
  if (at < 0) return { ref: null, reason: "argv has --fork-session but no --resume" };
  const next = argv[at + 1];
  if (!next || next.startsWith("-")) return { ref: null, reason: "resumed from the picker; argv names no parent" };
  return { ref: next, reason: "" };
}

const UNKNOWN = "no fork line in the binding file";

// lineage: { projectsRoot, infer(thread) → boolean, birth(path) → ms } turns on transcript
// inference; without it, only fork lines give parents.
export function buildThreads({ bindings = [], sessions = [], teams = null, seats = null, sessiondata = null, agent = "claude", lineage = null } = {}) {
  const byId = new Map();
  const get = (id) => {
    if (!byId.has(id)) {
      byId.set(id, {
        session_id: id,
        names: [],
        name: null,
        status: "unknown",
        live: false,
        pid: null,
        tmux: null,
        cwd: null,
        team: null,
        first_seen: null,
        last_seen: null,
        last_event: null,
        events: 0,
        fork: null,
        transcript_path: null,
        parent: { session_id: null, known: false, basis: "unknown", reason: UNKNOWN },
        children: [],
        sources: [],
      });
    }
    return byId.get(id);
  };

  for (const line of bindings) {
    if (!line?.session_id || (agent && line.agent && line.agent !== agent)) continue;
    const thread = get(line.session_id);
    if (!thread.sources.includes("binding")) thread.sources.push("binding");
    thread.events += 1;
    thread.first_seen ??= line.at ?? null;
    thread.last_seen = line.at ?? thread.last_seen;
    thread.last_event = { event: line.event, source: line.source ?? "", at: line.at ?? null };
    for (const former of line.name?.former ?? []) pushName(thread.names, typeof former === "string" ? former : former?.name);
    pushName(thread.names, line.name?.name);
    if (line.name?.name) thread.name = line.name.name;
    if (line.tmux?.session) thread.tmux = { session: line.tmux.session, window: line.tmux.window ?? null, pane_id: line.tmux.pane_id ?? null };
    if (line.cwd && !thread.cwd) thread.cwd = line.cwd;
    if (line.transcript_path) thread.transcript_path = line.transcript_path;
    if (line.launch_alias) thread.launch_alias = line.launch_alias;
    if (line.team?.id) thread.team = { id: line.team.id, source: `binding (${line.team.source || "?"})` };
    if (line.event === "session.start" && line.source === "startup" && !thread.startup) thread.startup = { at: line.at ?? null };
    if (line.event === "session.start" && line.source === "fork" && !thread.fork) {
      thread.fork = { at: line.at ?? null, ...forkParentRef(line.argv), argv: line.argv ?? [] };
    }
  }

  for (const record of sessions) {
    const thread = get(record.sessionId);
    thread.sources.push("registry");
    for (const former of record.formerNames ?? []) pushName(thread.names, former?.name);
    pushName(thread.names, record.name);
    if (record.name) thread.name = record.name;
    thread.pid = record.pid ?? null;
    thread.live = Boolean(record.alive);
    thread.cwd = record.cwd || thread.cwd;
    const tmux = tmuxFromRegistry(record.tmux);
    if (tmux) thread.tmux = { ...thread.tmux, ...tmux };
    thread.status = record.alive ? record.status || "live" : "registry file of a dead process";
    thread.status_since = record.statusUpdatedAt ? new Date(record.statusUpdatedAt).toISOString() : null;
    thread.socket = record.messagingSocketPath ?? null;
    const updated = record.updatedAt ? new Date(record.updatedAt).toISOString() : null;
    if (updated && (!thread.last_seen || updated > thread.last_seen)) thread.last_seen = updated;
  }

  const finish = (thread) => {
    if (!thread.live && thread.status === "unknown") {
      thread.status = thread.last_event?.event === "session.end"
        ? `ended (${thread.last_event.source || "no reason"})`
        : "not running";
    }
    thread.name ??= thread.names.at(-1) ?? null;
    thread.team ??= teamFor({ tmuxSession: thread.tmux?.session, name: thread.name, cwd: thread.cwd }, teams);
    thread.seat = seatFor({ cwd: thread.cwd, names: [...thread.names, thread.tmux?.session].filter(Boolean) }, seats);
    thread.last_input = sessiondata ? lastWilliamInput(sessiondata, thread.session_id) : null;
  };
  for (const thread of byId.values()) finish(thread);

  // Parents, recorded: a fork line. A name resolves when exactly one other thread carried it.
  // A startup line with no fork line records a fresh thread, which has no parent.
  for (const thread of byId.values()) {
    if (!thread.fork && thread.startup) {
      thread.parent = { session_id: null, known: false, basis: "fresh", via: `session.start with source "startup" at ${thread.startup.at ?? "an unknown time"}` };
    }
    if (!thread.fork) continue;
    const { ref, reason } = thread.fork;
    if (!ref) {
      thread.parent = { session_id: null, known: false, basis: "unknown", reason };
      continue;
    }
    if (UUID.test(ref)) {
      thread.parent = byId.has(ref)
        ? { session_id: ref, known: true, basis: "recorded", via: "fork line, --resume <session id>" }
        : { session_id: ref, known: true, basis: "recorded", via: "fork line, --resume <session id>", note: "parent seen in no source" };
      continue;
    }
    const carriers = [...byId.values()].filter((other) => other !== thread && other.names.includes(ref));
    thread.parent = carriers.length === 1
      ? { session_id: carriers[0].session_id, known: true, basis: "recorded", via: `fork line, --resume <name> "${ref}"` }
      : {
        session_id: null,
        known: false,
        basis: "unknown",
        reason: carriers.length
          ? `name "${ref}" was carried by ${carriers.length} threads`
          : `name "${ref}" is carried by no other thread in the sources`,
      };
  }

  // Parents, inferred: records a fork copied from its parent's transcript. A parent known only
  // by its transcript joins the model as a thread of its own, and is inferred in turn.
  if (lineage) {
    const pending = [...byId.values()].filter((thread) => !thread.parent.known && thread.parent.basis !== "fresh" && lineage.infer(thread));
    const tried = new Set();
    while (pending.length) {
      const thread = pending.shift();
      if (tried.has(thread.session_id)) continue;
      tried.add(thread.session_id);
      const path = thread.transcript_path
        ?? (thread.cwd ? join(transcriptDirForCwd(lineage.projectsRoot, thread.cwd), `${thread.session_id}.jsonl`) : null);
      const inferred = inferParent(path, { birth: lineage.birth });
      if (!inferred.known) {
        thread.parent = { ...thread.parent, reason: `${thread.parent.reason}; ${inferred.reason}` };
        continue;
      }
      thread.parent = {
        session_id: inferred.session_id,
        known: true,
        basis: "inferred from transcript",
        via: `${inferred.evidence.shared_records} records copied from its transcript`,
        evidence: inferred.evidence,
      };
      if (!byId.has(inferred.session_id)) {
        const parent = get(inferred.session_id);
        parent.sources.push("transcript");
        parent.cwd = thread.cwd;
        parent.transcript_path = path.replace(/[^/]+\.jsonl$/, `${inferred.session_id}.jsonl`);
        if (inferred.title) pushName(parent.names, inferred.title);
        parent.status = "known only by its transcript";
        finish(parent);
        pending.push(parent);
      }
    }
  }

  for (const thread of byId.values()) {
    const parentId = thread.parent.session_id;
    if (thread.parent.known && parentId && byId.has(parentId)) byId.get(parentId).children.push(thread.session_id);
  }

  return byId;
}

// team → seat → root threads, each root carrying its descendants.
export function groupTree(byId, teams) {
  const teamNames = new Map((teams?.teams ?? []).map((team) => [team.id, team.name]));
  const isRoot = (thread) => !(thread.parent.known && thread.parent.session_id && byId.has(thread.parent.session_id));
  const recency = (thread) => thread.last_seen ?? "";
  const node = (thread, seen = new Set()) => {
    seen.add(thread.session_id);
    return {
      session_id: thread.session_id,
      children: thread.children
        .filter((id) => !seen.has(id))
        .map((id) => byId.get(id))
        .sort((a, b) => recency(b).localeCompare(recency(a)))
        .map((child) => node(child, seen)),
    };
  };
  const groups = new Map();
  for (const thread of byId.values()) {
    if (!isRoot(thread)) continue;
    const teamId = thread.team?.id ?? "unassigned";
    if (!groups.has(teamId)) groups.set(teamId, new Map());
    const seats = groups.get(teamId);
    if (!seats.has(thread.seat)) seats.set(thread.seat, []);
    seats.get(thread.seat).push(thread);
  }
  const order = (id) => (id === "unassigned" ? "\uffff" : id);
  return [...groups.entries()]
    .sort(([a], [b]) => (order(a) < order(b) ? -1 : order(a) > order(b) ? 1 : 0))
    .map(([teamId, seats]) => ({
      id: teamId,
      name: teamNames.get(teamId) ?? (teamId === "unassigned" ? "No team" : teamId),
      seats: [...seats.entries()]
        .map(([seatId, roots]) => ({
          id: seatId,
          last_seen: roots.map(recency).sort().at(-1) ?? "",
          roots: roots.sort((a, b) => recency(b).localeCompare(recency(a))).map((root) => node(root)),
        }))
        .sort((a, b) => b.last_seen.localeCompare(a.last_seen)),
    }));
}

export function snapshot(paths = defaultPaths()) {
  const { lines, errors } = readBindings(paths.bindings);
  const sessions = readSessionFiles(paths.sessionsDir);
  const teams = readJson(paths.teams, null);
  const seats = readJson(paths.seats, null);
  if (!teams) errors.push(`teams.json unreadable at ${paths.teams}`);
  const seatIds = new Set((seats?.seats ?? []).map((seat) => seat.id));
  const lineage = { projectsRoot: paths.projects, infer: (thread) => seatIds.has(thread.seat) };
  const byId = buildThreads({ bindings: lines, sessions, teams, seats, sessiondata: paths.sessiondata, lineage });
  const threads = Object.fromEntries(byId);
  return {
    generated_at: new Date().toISOString(),
    sources: {
      bindings: { path: paths.bindings, lines: lines.length },
      registry: { path: paths.sessionsDir, files: sessions.length, live: sessions.filter((s) => s.alive).length },
      teams: { path: paths.teams },
      user_inputs: { path: join(paths.sessiondata, "<session_id>", "_claude_user_inputs.jsonl"), note: "records carry no time" },
      seats: { path: paths.seats, ids: [...seatIds] },
      transcripts: { path: paths.projects, note: "read only to infer the parents of threads in a seat" },
      errors,
    },
    scope: "Claude Code sessions (agent \"claude\" in binding lines)",
    home_team: seats?.home_team ?? null,
    tree: groupTree(byId, teams),
    threads,
  };
}

