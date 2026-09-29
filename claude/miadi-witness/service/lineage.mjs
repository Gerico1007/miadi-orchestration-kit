// lineage — a thread's parent inferred from its transcript, when no fork line records it.
//
// A fork copies its parent's records into its own transcript with their original uuid and
// timestamp. So a transcript born earlier that shares records with this one is an ancestor,
// and the one sharing the most is the closest. A tie leaves the parent unknown.
// Measured on 2026-09-29: fork-04 shares 1224 records with fork-01 and 100 with 6aa97a0c.
// fork-01 shares 100 with 6aa97a0c, starting at its compact boundary of 2026-09-27T12:13:20Z.

import { closeSync, existsSync, openSync, readSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const cache = new Map(); // path → { size, offset, partial, records, uuids, title, birth }

function birthOf(path) {
  const ms = statSync(path).birthtimeMs;
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

// Transcripts are append-only JSONL, so only the bytes added since the last read are parsed.
export function readTranscript(path, { birth = birthOf } = {}) {
  const size = statSync(path).size;
  let entry = cache.get(path);
  if (!entry || size < entry.offset) {
    entry = { size: 0, offset: 0, partial: "", records: [], uuids: new Set(), title: null, birth: birth(path) };
    cache.set(path, entry);
  }
  if (size > entry.offset) {
    const fd = openSync(path, "r");
    try {
      const buffer = Buffer.alloc(size - entry.offset);
      readSync(fd, buffer, 0, buffer.length, entry.offset);
      const lines = (entry.partial + buffer.toString("utf8")).split("\n");
      entry.partial = lines.pop();
      for (const raw of lines) {
        if (!raw.includes('"uuid":"') && !raw.includes('"custom-title"')) continue;
        let record;
        try {
          record = JSON.parse(raw);
        } catch {
          continue;
        }
        if (record.type === "custom-title" && record.customTitle) entry.title = record.customTitle;
        if (typeof record.uuid === "string" && !entry.uuids.has(record.uuid)) {
          entry.uuids.add(record.uuid);
          entry.records.push({ uuid: record.uuid, at: record.timestamp ?? null, type: record.type ?? null });
        }
      }
    } finally {
      closeSync(fd);
    }
    entry.offset = size;
  }
  entry.size = size;
  return entry;
}

export function transcriptDirForCwd(projectsRoot, cwd) {
  return cwd ? join(projectsRoot, cwd.replace(/[^A-Za-z0-9]/g, "-")) : null;
}

export function inferParent(childPath, { dir = null, birth = birthOf } = {}) {
  if (!childPath || !existsSync(childPath)) return { known: false, reason: "no transcript for this thread" };
  const child = readTranscript(childPath, { birth });
  if (!child.birth) return { known: false, reason: "the transcript's birth time is not available" };
  const folder = dir ?? childPath.slice(0, childPath.lastIndexOf("/"));
  const candidates = [];
  for (const name of readdirSync(folder).filter((file) => file.endsWith(".jsonl"))) {
    const path = join(folder, name);
    if (path === childPath) continue;
    let other;
    try {
      other = readTranscript(path, { birth });
    } catch {
      continue;
    }
    if (!other.birth || other.birth >= child.birth) continue;
    let shared = 0;
    for (const uuid of other.uuids) if (child.uuids.has(uuid)) shared += 1;
    if (shared) candidates.push({ session_id: basename(name, ".jsonl"), path, shared, title: other.title });
  }
  if (!candidates.length) return { known: false, reason: "no earlier transcript in its folder shares a record with it" };
  candidates.sort((a, b) => b.shared - a.shared);
  let [best, next] = candidates;
  let tiebreak = null;
  if (next && next.shared === best.shared) {
    // A fork copies its parent as it stood, so the parent's last record written before the
    // child was born is in the child. Among tied transcripts, only that one can be the parent.
    const tied = candidates.filter((candidate) => candidate.shared === best.shared);
    const standing = tied.filter((candidate) => {
      const before = readTranscript(candidate.path, { birth }).records
        .filter((record) => record.at && Date.parse(record.at) < child.birth);
      return before.length > 0 && child.uuids.has(before.at(-1).uuid);
    });
    if (standing.length !== 1) {
      return { known: false, reason: `transcripts ${tied.map((c) => c.session_id).join(" and ")} each share ${best.shared} records with it` };
    }
    tiebreak = `${tied.length} transcripts share ${best.shared} records; only ${standing[0].session_id} has its last earlier record in this one`;
    best = standing[0];
  }
  const parentUuids = readTranscript(best.path, { birth }).uuids;
  const first = child.records.find((record) => parentUuids.has(record.uuid));
  return {
    known: true,
    session_id: best.session_id,
    title: best.title,
    evidence: {
      shared_records: best.shared,
      first_copied: first ? { at: first.at, type: first.type } : null,
      child_born: new Date(child.birth).toISOString(),
      others: candidates.filter((c) => c !== best).slice(0, 3).map(({ session_id, shared }) => ({ session_id, shared })),
      ...(tiebreak ? { tiebreak } : {}),
    },
  };
}

export function transcriptTitle(path) {
  try {
    return readTranscript(path).title;
  } catch {
    return null;
  }
}

export function clearLineageCache() {
  cache.clear();
}
