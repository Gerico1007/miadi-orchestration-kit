// Shared by the hook, the diary writer and the tests. No dependencies beyond node.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Her label opens a line: "💕 :" since 0.1.1, "💕 Ava:" in sessions before it.
export const AVA_LABEL = "💕 :";
const AVA_LABEL_LINE = /(^|\n)\s*💕\s*(Ava\s*)?:/;
export const carriesAvaLabel = (text) => AVA_LABEL_LINE.test(text);
export const PLUGIN_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

export function readTranscript(file) {
  if (!file || !fs.existsSync(file)) return [];
  const entries = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { entries.push(JSON.parse(line)); } catch { /* a torn last line while the session writes */ }
  }
  return entries;
}

function textBlocks(content) {
  if (typeof content === "string") return [content];
  if (!Array.isArray(content)) return [];
  return content.filter((b) => b && b.type === "text" && typeof b.text === "string").map((b) => b.text);
}

// Ava is present in a session once she has spoken in it under her label.
export function avaSpoke(entries) {
  return entries.some((e) => e.type === "assistant" && !e.isSidechain &&
    textBlocks(e.message?.content).some(carriesAvaLabel));
}

export function sessionTitle(entries) {
  let title = "";
  for (const e of entries) {
    if (e.type === "custom-title" && e.customTitle) title = e.customTitle;
    else if (e.type === "ai-title" && e.aiTitle && !title) title = e.aiTitle;
  }
  return title;
}

function cleanUserText(text) {
  if (/^\s*<local-command-(caveat|stdout)>/.test(text)) return "";
  let t = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "");
  const cmd = t.match(/<command-name>([^<]*)<\/command-name>/);
  if (cmd) {
    const args = t.match(/<command-args>([\s\S]*?)<\/command-args>/);
    t = `${cmd[1].trim()} ${args ? args[1].trim() : ""}`;
  }
  return t.replace(/\x1b\[[0-9;]*m/g, "").trim();
}

function clip(text, max) {
  return text.length > max ? `${text.slice(0, max)} […${text.length - max} more characters]` : text;
}

function stamp(ts) {
  if (!ts) return "--:--";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "--:--" : d.toISOString().slice(5, 16).replace("T", " ");
}

function toolLine(block) {
  const i = block.input || {};
  const what = i.description || i.file_path || i.query || i.prompt?.slice?.(0, 80) || i.command?.slice?.(0, 80) || "";
  return `tool ${block.name}${what ? `: ${String(what).replace(/\s+/g, " ").slice(0, 120)}` : ""}`;
}

// The session as Ava will reread it: Guillaume's words, the replies, one line per tool call.
export function condense(entries, { maxChars = 160000 } = {}) {
  const lines = [];
  let firstTs = null;
  let lastTs = null;
  for (const e of entries) {
    if (e.isSidechain || e.isMeta) continue;
    const ts = e.timestamp;
    const content = e.message?.content;
    let produced = false;
    if (e.type === "user") {
      for (const raw of textBlocks(content)) {
        const t = cleanUserText(raw);
        if (t) { lines.push(`[${stamp(ts)}] GUILLAUME: ${clip(t, 6000)}`); produced = true; }
      }
    } else if (e.type === "assistant" && Array.isArray(content)) {
      for (const b of content) {
        if (b.type === "text" && b.text?.trim()) {
          const who = carriesAvaLabel(b.text) ? "AVA" : "ASSISTANT";
          lines.push(`[${stamp(ts)}] ${who}: ${clip(b.text.trim(), 8000)}`);
          produced = true;
        } else if (b.type === "tool_use") {
          lines.push(`[${stamp(ts)}] ${toolLine(b)}`);
          produced = true;
        }
      }
    }
    if (produced && ts) { firstTs ??= ts; lastTs = ts; }
  }
  let text = lines.join("\n");
  if (text.length > maxChars) {
    const head = Math.floor(maxChars * 0.25);
    const tail = maxChars - head;
    text = `${text.slice(0, head)}\n[… ${text.length - maxChars} characters from the middle of the session omitted …]\n${text.slice(-tail)}`;
  }
  return { text, firstTs, lastTs, title: sessionTitle(entries), lines: lines.length };
}

export function extractDiary(output) {
  const matches = [...String(output).matchAll(/<diary>([\s\S]*?)<\/diary>/g)];
  if (!matches.length) return null;
  const body = matches[matches.length - 1][1].trim();
  return body || null;
}

const SECRET_PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]{10,}/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /xox[abpr]-[A-Za-z0-9-]{10,}/g,
];

export function redact(text) {
  let t = String(text);
  for (const p of SECRET_PATTERNS) t = t.replace(p, "[redacted]");
  t = t.replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]{16,}/g, "$1[redacted]");
  t = t.replace(/\b(token|secret|password|passwd|api[_-]?key)(["']?\s*[:=]\s*["']?)[^\s"']{8,}/gi, "$1$2[redacted]");
  return t;
}

export function slugify(text) {
  return String(text).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "session";
}

export function stateDir(env = process.env) {
  return path.join(env.XDG_STATE_HOME || path.join(os.homedir(), ".local", "state"), "ava-companion");
}

// Where her diary lives: her own diaries in sacredava when the host has them.
// (Not AVA_HOME: on gaia that is already the ava account's home directory.)
export function diaryDir(env = process.env) {
  if (env.AVA_DIARY_DIR) return env.AVA_DIARY_DIR;
  const own = path.join(env.AVA_SACREDAVA_DIR || "/src/sacredava", "diaries");
  if (fs.existsSync(own)) return own;
  return path.join(stateDir(env), "diaries");
}

export function previousEntryFor(dir, sessionId) {
  if (!sessionId || !fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"))
    .map((f) => path.join(dir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const f of files.slice(0, 200)) {
    const head = fs.readFileSync(f, "utf8").slice(0, 600);
    if (head.includes(`session: ${sessionId}`)) return f;
  }
  return null;
}

export function transcriptFor(cwd, env = process.env) {
  if (env.AVA_COMPANION_TRANSCRIPT && fs.existsSync(env.AVA_COMPANION_TRANSCRIPT)) return env.AVA_COMPANION_TRANSCRIPT;
  const dir = path.join(os.homedir(), ".claude", "projects", String(cwd).replace(/[^a-zA-Z0-9]/g, "-"));
  if (!fs.existsSync(dir)) return null;
  const newest = fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"))
    .map((f) => path.join(dir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  return newest || null;
}

export function skillBody() {
  const raw = fs.readFileSync(path.join(PLUGIN_ROOT, "skills", "ava-companion", "SKILL.md"), "utf8");
  return raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

export function pluginVersion() {
  try { return JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, ".claude-plugin", "plugin.json"), "utf8")).version; }
  catch { return "unknown"; }
}
