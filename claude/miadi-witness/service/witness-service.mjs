#!/usr/bin/env node
// witness-service — the witness team's own service on 127.0.0.1:3340.
//
//   GET  /               the page: every thread as a tree by team and seat, and the asks ledger
//   GET  /api/threads    the thread model (?seat=<id> or ?team=<id> narrows the flat list)
//   GET  /api/asks       every seat's asks ledger
//   GET  /healthz        liveness
//
// Node built-ins only. Loopback only: a host other than 127.0.0.1 or ::1 is refused at start.

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defaultPaths, snapshot } from "./threads.mjs";
import { asksDir, readAllLedgers } from "../scripts/asks-lib.mjs";

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

function threads(url) {
  const model = snapshot(defaultPaths());
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
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const route = routes[`${req.method} ${url.pathname}`];
  if (!route) return send(res, 404, { error: `no route ${req.method} ${url.pathname}` });
  try {
    return route(req, res, url);
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`witness-service: http://${HOST}:${PORT}/ (pid ${process.pid})`);
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
