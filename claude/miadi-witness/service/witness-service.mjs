#!/usr/bin/env node
// witness-service — the witness team's own service on 127.0.0.1:3340.
//
//   GET  /               the page: every thread as a tree by team and seat, and the asks ledger
//   GET  /api/threads    the thread model (?seat=<id> or ?team=<id> narrows the flat list)
//   GET  /api/asks       every seat's asks ledger
//   GET  /healthz        liveness
//   POST /api/open       {kind: "fresh"|"fork", topic, parent?, run?} open a mino thread in a new tmux session
//   POST /api/send       {target, message, run?} to an idle thread, through tide operator send
//   GET  /api/peek       ?target=<thread>&lines=<n> read a thread's pane back, through tide operator peek
//
// Node built-ins only. Loopback only: a host other than 127.0.0.1 or ::1 is refused at start.
// A dry run of open or send changes nothing and needs no token. Applying one (run: true), and
// peek, need Authorization: Bearer <MIADI_API_TOKEN_WRITER>.

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defaultPaths, snapshot } from "./threads.mjs";
import { authorised, findThread, peek, planOpen, runOpen, send as sendTo, writerToken } from "./actions.mjs";
import { asksDir, readAllLedgers } from "../scripts/asks-lib.mjs";
import { listenerOf } from "../scripts/witness-listen.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const HOST = process.env.WITNESS_HOST || "127.0.0.1";
const PORT = Number(process.env.WITNESS_PORT || 3340);
const LOOPBACK = new Set(["127.0.0.1", "::1", "localhost"]);

if (!LOOPBACK.has(HOST)) {
  console.error(`witness-service: refusing to bind ${HOST}; this service binds loopback only`);
  process.exit(2);
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  const payload = typeof body === "string" ? body : `${JSON.stringify(body, null, 2)}\n`;
  res.writeHead(status, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(payload);
}

const MAX_BODY = 64 * 1024;

function body(req) {
  return new Promise((done, fail) => {
    let text = "";
    req.on("data", (chunk) => {
      text += chunk;
      if (text.length > MAX_BODY) {
        fail(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        done(text ? JSON.parse(text) : {});
      } catch {
        fail(new Error("body is not JSON"));
      }
    });
  });
}

function seatConfig(id = "mino") {
  const seats = JSON.parse(readFileSync(defaultPaths().seats, "utf8"));
  const seat = (seats.seats ?? []).find((candidate) => candidate.id === id);
  if (!seat?.folder || !seat?.team) throw new Error(`seat ${id} has no folder or team in seats.json`);
  return seat;
}

// A dry run passes; applying needs the writer token.
function gate(req, res, run) {
  if (!run) return true;
  const check = authorised(req.headers.authorization, writerToken());
  if (check.ok) return true;
  send(res, check.status, { error: check.error });
  return false;
}

function threads(url) {
  const model = snapshot(defaultPaths());
  model.listening = Object.fromEntries(model.sources.seats.ids.map((id) => [id, listenerOf(id)]));
  const seat = url.searchParams.get("seat");
  const team = url.searchParams.get("team");
  if (seat || team) {
    model.threads = Object.fromEntries(Object.entries(model.threads)
      .filter(([, thread]) => (!seat || thread.seat === seat) && (!team || thread.team?.id === team)));
  }
  return model;
}

const routes = {
  "GET /": (_req, res) => send(res, 200, readFileSync(join(HERE, "public", "index.html"), "utf8"), "text/html; charset=utf-8"),
  "GET /api/threads": (_req, res, url) => send(res, 200, threads(url)),
  "GET /api/asks": (_req, res) => send(res, 200, { dir: asksDir(), seats: readAllLedgers() }),
  "GET /healthz": (_req, res) => send(res, 200, { ok: true, pid: process.pid, at: new Date().toISOString() }),
  "POST /api/open": async (req, res) => {
    const input = await body(req);
    const run = input.run === true;
    if (!gate(req, res, run)) return;
    const plan = planOpen({ kind: input.kind, topic: input.topic, parent: input.parent ?? null, model: snapshot(defaultPaths()), seat: seatConfig(input.seat) });
    send(res, 200, run ? runOpen(plan) : { dry_run: true, ...plan });
  },
  "POST /api/send": async (req, res) => {
    const input = await body(req);
    const run = input.run === true;
    if (!gate(req, res, run)) return;
    const thread = findThread(snapshot(defaultPaths()), String(input.target ?? ""));
    const result = sendTo({ thread, message: input.message, run });
    send(res, result.status, result);
  },
  "GET /api/peek": (req, res, url) => {
    if (!gate(req, res, true)) return;
    const thread = findThread(snapshot(defaultPaths()), url.searchParams.get("target") ?? "");
    const result = peek({ thread, lines: url.searchParams.get("lines") });
    send(res, result.status, result);
  },
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const route = routes[`${req.method} ${url.pathname}`];
  if (!route) return send(res, 404, { error: `no route ${req.method} ${url.pathname}` });
  Promise.resolve()
    .then(() => route(req, res, url))
    .catch((error) => {
      if (!res.headersSent) send(res, 400, { error: error instanceof Error ? error.message : String(error) });
    });
});

server.listen(PORT, HOST, () => {
  console.log(`witness-service: http://${HOST}:${PORT}/ (pid ${process.pid})`);
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
