// memory-store — pi-owned memory index. No dependencies on any other agent
// framework; the only external artifact is an embedding-model GGUF you supply
// (see memory-search.json: modelPath/dim).
//
// Layout: code + node_modules live with the pi package (installed via
// `pi install`); the SQLite DB lives at ~/.pi/agent/memory-store/ so that
// `pi remove` never touches your data.
//
// Scope comes from ~/.pi/agent/memory-search.json (user-owned):
//   { enabled, sources: ["pi-memory"], extraPaths: [], excludePaths: [],
//     modelPath: "~/…f (default), dim: 1024 }
//   "pi-memory" = every pi project's memory trio (memory.md / memory-wiki /
//   memory-daily), discovered from pi's session dirs (auto, zero config).
import {
  readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { getLoadablePath as vecLoadablePath } from "sqlite-vec";
import os from "node:os";
import { ftsQueryFromText, cjkRuns, cosine, rrfMerge, isExcluded, coverageOf } from "./memory-search-query.mjs";

const HOME = os.homedir();
export const STORE_DIR = join(HOME, ".pi", "agent", "memory-store");
export const DB_PATH = join(STORE_DIR, "memory.sqlite");
export const CONFIG_PATH = join(HOME, ".pi", "agent", "memory-search.json");
const SESSIONS_DIR = join(HOME, ".pi", "agent", "sessions");
const DEFAULT_MODEL = "~/models/Qwen3-Embedding-0.6B-Q8_0.gguf";
// Model + dims are user-configurable (memory-search.json: modelPath, dim).
// Defaults match the shipped Qwen3-Embedding-0.6B setup (1024-d).
export const modelPathFor = (cfg) => {
  const p = cfg?.modelPath ?? DEFAULT_MODEL;
  return p.startsWith("~/") ? join(HOME, p.slice(2)) : p;
};
export const dimFor = (cfg) => Number(cfg?.dim) || 1024;
const CHUNK_CHARS = 1600;      // ~400 tokens
const OVERLAP = 320;           // ~20%

// ---------- scope ----------
export function loadConfig() {
  try { return JSON.parse(readFileSync(CONFIG_PATH, "utf8")); } catch { return null; }
}

// pi names session dirs with "-" for "/" (ambiguous) — decode by exploring
// hyphen splits, keeping only paths that exist.
function decodeSessionDirName(token, base, out) {
  const full = base + token;
  if (existsSync(full)) out.push(full);
  for (let i = 1; i < token.length; i++) {
    if (token[i] === "-" && token[i - 1] !== "-") {
      const head = base + token.slice(0, i);
      if (existsSync(head)) decodeSessionDirName(token.slice(i + 1), head + "/", out);
    }
  }
}

export function discoverProjectRoots() {
  const roots = new Set();
  try {
    for (const name of readdirSync(SESSIONS_DIR)) {
      if (!name.startsWith("--")) continue;
      const token = name.replace(/^--/, "").replace(/--$/, "");
      if (!token) continue;
      const found = [];
      decodeSessionDirName(token, "/", found);
      for (const p of found) roots.add(p);
    }
  } catch {}
  return [...roots].sort();
}

function under(pRaw, eRaw) {
  const p = String(pRaw).replace(/\/+$/, "");
  const e = String(eRaw).replace(/\/+$/, "");
  return !!e && (p === e || p.startsWith(e + "/"));
}

export function scopePaths(cfg) {
  const excludes = cfg?.excludePaths ?? [];
  const candidates = [];
  if ((cfg?.sources ?? []).includes("pi-memory")) {
    for (const r of discoverProjectRoots())
      for (const cand of ["memory.md", "memory-wiki", "memory-daily"]) candidates.push(join(r, cand));
  }
  for (const p of cfg?.extraPaths ?? []) candidates.push(p);
  return candidates.filter((p) =>
    existsSync(p) && !excludes.some((e) => under(p, e)));
}

// ---------- chunking ----------
// markdown-aware: split on headings, then on paragraphs to ~CHUNK_CHARS with overlap
export function chunkMarkdown(text, path) {
  const lines = text.split("\n");
  const sections = [];
  let cur = [];
  lines.forEach((line, i) => {
    if (/^#{1,3} /.test(line) && cur.length) { sections.push(cur); cur = []; }
    cur.push({ line, n: i + 1 });
  });
  if (cur.length) sections.push(cur);

  const chunks = [];
  for (const sec of sections) {
    // group section lines into paragraphs (blank-line separated)
    const paras = [];
    let p = [];
    for (const l of sec) {
      if (l.line.trim() === "") { if (p.length) { paras.push(p); p = []; } }
      else p.push(l);
    }
    if (p.length) paras.push(p);
    let buf = [];
    let bufStart = null;
    const flush = () => {
      const body = buf.map((l) => l.line).join("\n").trim();
      if (body) chunks.push({ text: body, start_line: bufStart, end_line: buf[buf.length - 1].n });
    };
    for (const para of paras) {
      const paraText = para.map((l) => l.line).join("\n");
      if (buf.length && buf.map((l) => l.line).join("\n").length + paraText.length > CHUNK_CHARS) {
        flush();
        // ~20% overlap: carry the tail of the flushed chunk
        let tail = [], tailLen = 0;
        for (let i = buf.length - 1; i >= 0 && tailLen < OVERLAP; i--) { tailLen += buf[i].line.length; tail.unshift(buf[i]); }
        buf = tail;
        bufStart = buf.length ? buf[0].n : null;
      }
      if (!bufStart) bufStart = para[0].n;
      for (const l of para) buf.push(l);
    }
    flush();
  }
  // any chunk over 2x target: hard-split (long prose blocks)
  const out = [];
  for (const c of chunks) {
    if (c.text.length <= CHUNK_CHARS * 2) { out.push(c); continue; }
    for (let i = 0; i < c.text.length; i += CHUNK_CHARS)
      out.push({ text: c.text.slice(i, i + CHUNK_CHARS), start_line: c.start_line + Math.floor(i / 80), end_line: c.end_line });
  }
  return out;
}

// ---------- walking ----------
// recursive .md walk; skips dot-dirs (.obsidian/.git), caps file size at 1 MB
function walkFiles(dir, out) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const fp = join(dir, name);
    let st;
    try { st = statSync(fp); } catch { continue; }
    if (st.isDirectory()) walkFiles(fp, out);
    else if (name.endsWith(".md") && st.size < 1_000_000) out.push(fp);
  }
  return out;
}

// ---------- db ----------
let db = null;
function getDb() {
  if (db) return db;
  mkdirSync(STORE_DIR, { recursive: true });
  const d = new DatabaseSync(DB_PATH, { allowExtension: true });
  d.loadExtension(vecLoadablePath());
  d.exec("PRAGMA journal_mode = WAL;");   // readers don't block the indexer
  d.exec("PRAGMA busy_timeout = 10000;");
  d.exec(`
    CREATE TABLE IF NOT EXISTS files(path TEXT PRIMARY KEY, hash TEXT, indexed_at INTEGER);
    CREATE TABLE IF NOT EXISTS chunks(id TEXT PRIMARY KEY, path TEXT, source TEXT,
      start_line INTEGER, end_line INTEGER, model TEXT, text TEXT, updated_at INTEGER);
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      text, id UNINDEXED, path UNINDEXED, source UNINDEXED, start_line UNINDEXED);
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts_tri USING fts5(
      text, id UNINDEXED, path UNINDEXED, source UNINDEXED, start_line UNINDEXED,
      tokenize = "trigram");
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(id TEXT PRIMARY KEY, embedding FLOAT[${dimFor(loadConfig())}]);
  `);
  // trigram table was added after the store already had data (2026-08-29) —
  // one-time backfill, guarded by counts, cheap to re-check at open.
  if (d.prepare("SELECT COUNT(*) c FROM chunks_fts_tri").get().c === 0
      && d.prepare("SELECT COUNT(*) c FROM chunks").get().c > 0) {
    const ins = d.prepare("INSERT INTO chunks_fts_tri(text, id, path, source, start_line) VALUES (?,?,?,?,?)");
    d.exec("BEGIN");
    for (const r of d.prepare("SELECT id, text, path, source, start_line FROM chunks").all())
      ins.run(r.text, r.id, r.path, r.source, r.start_line);
    d.exec("COMMIT");
  }
  db = d;
  return d;
}

const sha1 = (s) => createHash("sha1").update(s).digest("hex");

// ---------- indexing (incremental, hash-based) ----------
/**
 * indexNow(cfg, onlySource?, force?) — incremental index pass.
 * onlySource: restrict BOTH the walk and the prune to one source label
 * (e.g. "llm-wiki", "my_second_brain", "memory"). Other sources are left
 * completely untouched — including their prune (a bare scope-restricted
 * config would otherwise make the prune pass delete every out-of-scope file).
 * Unknown/typo source = safe no-op (nothing walked, nothing pruned).
 * force (ONLY meaningful with onlySource): first wipe that source's rows
 * (chunks + FTS + trigram + vec + files), so the walk re-embeds every file
 * of that source from scratch. Full-store force stays "delete the DB files";
 * force without a source is refused here on purpose.
 */
export async function indexNow(cfg, onlySource, force) {
  cfg = cfg ?? loadConfig();
  if (!cfg || cfg.enabled === false) return { indexed: 0, skipped: "disabled" };
  if (force && !onlySource)
    return { indexed: 0, skipped: "force requires a source (full force = delete DB files)" };
  const d = getDb();
  const paths = scopePaths(cfg);
  if (force && onlySource) {
    // source-scoped wipe: capture paths first (files table has no source col),
    // then clear all of this source's rows. vec has no source col → join by id.
    const paths2 = d.prepare("SELECT DISTINCT path FROM chunks WHERE source = ?").all(onlySource).map((r) => r.path);
    d.prepare("DELETE FROM chunks_vec WHERE id IN (SELECT id FROM chunks WHERE source = ?)").run(onlySource);
    d.prepare("DELETE FROM chunks WHERE source = ?").run(onlySource);
    d.prepare("DELETE FROM chunks_fts WHERE source = ?").run(onlySource);
    d.prepare("DELETE FROM chunks_fts_tri WHERE source = ?").run(onlySource);
    for (const p of paths2) d.prepare("DELETE FROM files WHERE path = ?").run(p);
  }

  // 1) walk scope, chunk changed/ new files (embeddings lazy: model loads only
  //    if there is actually something new to embed)
  const model = modelPathFor(cfg);
  const lazyEmbed = async (text) => (await getEmbedFn(model))(text);
  const lanePaths = new Set();
  if ((cfg?.sources ?? []).includes("pi-memory"))
    for (const r of discoverProjectRoots())
      for (const c of ["memory.md", "memory-wiki", "memory-daily"]) lanePaths.add(join(r, c));
  const keepFileHashes = new Set();
  const excludes = cfg?.excludePaths ?? [];
  let embedded = 0;
  for (const p of paths) {
    const isLane = lanePaths.has(p);
    const source = isLane ? "memory" : p.split("/").filter(Boolean).pop();
    if (onlySource && source !== onlySource) continue; // source-scoped run
    const files = statSync(p).isDirectory() ? walkFiles(p, []) : [p];
    for (const fp of files) {
      if (isExcluded(fp, excludes)) continue; // excluded: skip indexing; prune below removes stale chunks
      let text;
      try { text = readFileSync(fp, "utf8"); } catch { continue; }
      const h = sha1(text);
      keepFileHashes.add(fp);
      const old = d.prepare("SELECT hash FROM files WHERE path = ?").get(fp);
      if (old?.hash === h) continue; // unchanged
      const chunks = chunkMarkdown(text, fp).map((c) => ({ ...c, id: sha1(fp + "\0" + c.text) }));
      const nNew = await upsertFileChunks(d, fp, source, chunks, lazyEmbed, model);
      d.prepare("INSERT OR REPLACE INTO files(path, hash, indexed_at) VALUES (?,?,?)").run(fp, h, Date.now());
      embedded += nNew;
    }
  }
  // 2) prune: files that vanished (deleted or dropped out of scope)
  //    source-scoped run: prune only that source's own files (from the chunks
  //    table); files of other sources are invisible to this pass.
  const known = onlySource
    ? d.prepare("SELECT DISTINCT path FROM chunks WHERE source = ?").all(onlySource).map((r) => r.path)
    : d.prepare("SELECT path FROM files").all().map((r) => r.path);
  for (const fp of known) {
    if (!keepFileHashes.has(fp)) {
      const ids = d.prepare("SELECT id FROM chunks WHERE path = ?").all(fp).map((r) => r.id);
      if (ids.length) {
        const ph = ids.map(() => "?").join(",");
        d.prepare(`DELETE FROM chunks WHERE id IN (${ph})`).run(...ids);
        d.prepare(`DELETE FROM chunks_fts WHERE id IN (${ph})`).run(...ids);
        d.prepare(`DELETE FROM chunks_fts_tri WHERE id IN (${ph})`).run(...ids);
        d.prepare(`DELETE FROM chunks_vec WHERE id IN (${ph})`).run(...ids);
      }
      d.prepare("DELETE FROM files WHERE path = ?").run(fp);
    }
  }
  return { indexed: embedded, files: paths.length, source: onlySource ?? null };
}

async function upsertFileChunks(d, path, source, chunks, embedFn, model) {
  let nNew = 0;
  // de-dup identical chunks (same id) within one file — keep first occurrence
  const seen = new Set();
  chunks = chunks.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  const old = d.prepare("SELECT id FROM chunks WHERE path = ?").all(path).map((r) => r.id);
  const oldSet = new Set(old);
  const newSet = new Set(chunks.map((c) => c.id));
  for (const id of old) if (!newSet.has(id)) {
    d.prepare("DELETE FROM chunks WHERE id = ?").run(id);
    d.prepare("DELETE FROM chunks_fts WHERE id = ?").run(id);
    d.prepare("DELETE FROM chunks_fts_tri WHERE id = ?").run(id);
    d.prepare("DELETE FROM chunks_vec WHERE id = ?").run(id);
  }
  for (const c of chunks) {
    const isNew = !oldSet.has(c.id);
    d.prepare("INSERT OR REPLACE INTO chunks(id, path, source, start_line, end_line, model, text, updated_at) VALUES (?,?,?,?,?,?,?,?)")
      .run(c.id, path, source, c.start_line, c.end_line, model, c.text, Date.now());
    if (isNew) {
      d.prepare("INSERT INTO chunks_fts(text, id, path, source, start_line) VALUES (?,?,?,?,?)").run(c.text, c.id, path, source, c.start_line);
      d.prepare("INSERT INTO chunks_fts_tri(text, id, path, source, start_line) VALUES (?,?,?,?,?)").run(c.text, c.id, path, source, c.start_line);
    }
  }
  if (embedFn) {
    // Embed anything without a vec row: fresh ids PLUS crash orphans (the 08-28
    // vec0 crash left chunks/fts rows whose vec rows never got inserted —
    // keying on chunk-id alone would skip them forever).
    const idsAll = chunks.map((c) => c.id);
    const ph2 = idsAll.map(() => "?").join(",");
    const haveVec = new Set(
      d.prepare(`SELECT id FROM chunks_vec WHERE id IN (${ph2})`).all(...idsAll).map((r) => r.id)
    );
    const fresh = chunks.filter((c) => !haveVec.has(c.id));
    for (const c of fresh) {
      const v = await embedFn(c.text);
      // DELETE+INSERT: vec0 virtual tables don't honour INSERT OR REPLACE
      d.prepare("DELETE FROM chunks_vec WHERE id = ?").run(c.id);
      d.prepare("INSERT INTO chunks_vec(id, embedding) VALUES (?,?)").run(c.id, Buffer.from(v.buffer, v.byteOffset, v.byteLength));
      nNew++;
    }
  }
  return nNew;
}

// ---------- embedding (pi's own node-llama-cpp) ----------
let embReady = null;
let embModel = null;
async function getEmbedFn(modelPath) {
  if (embReady && embModel === modelPath) return embReady;
  embModel = modelPath;
  embReady = (async () => {
    const { getLlama } = await import("node-llama-cpp");
    const ecfg = (await loadConfig()) ?? {};
    // All three are opt-in via memory-search.json; defaults are the safe CPU path.
    // - gpu: false (default) → CPU. Set "gpu": -1 to put all layers on the GPU —
    //   ~30× faster cold index on an RTX 4090 (measured), retrieval-identical
    //   results. Needs a local CUDA build of node-llama-cpp (see README); the
    //   shipped prebuilt is CPU-only, so a GPU machine without the local build
    //   must keep gpu false.
    const gpuMode = ecfg.gpu ?? false;
    // - contextSize: 4096 (default). 2048 crashes on CJK chunks that tokenize
    //   past 2048 tokens; 4096 covers the chunker's 3200-char cap for +0.22 GB
    //   KV with zero other cost (cost scales with actual tokens, not the cap).
    const ctxSize = Number(ecfg.contextSize) || 4096;
    // - threads: min(CPU count, 16). node-llama-cpp's default of 6 is too low
    //   for modern parts; 16 measured +26% on an 8P+12E hybrid CPU, no gain
    //   beyond that.
    const threads = Number(ecfg.threads) || Math.min(os.cpus().length, 16);
    const llama = await getLlama({ gpu: gpuMode, logLevel: "silent" });
    const model = await llama.loadModel({ modelPath, contextSize: ctxSize });
    const ctx = await model.createEmbeddingContext({ threads });
    return (text) => {
      const e = ctx.getEmbeddingFor(text);
      return e.then ? e.then((r) => Float32Array.from(r.vector)) : Float32Array.from(e.vector);
    };
  })();
  try { return await embReady; } catch (e) { embReady = null; throw e; }
}

// ---------- hybrid query (same engine as before, pi's store) ----------
export async function search(query, k = 8, cfg, sources) {
  const d = getDb();
  const embed = await getEmbedFn(modelPathFor(cfg));
  const qv = await embed(query);
  if (qv.length !== dimFor(cfg)) throw new Error(`unexpected embedding dims: ${qv.length}`);
  const CAND = 50;

  // lane 0: vector KNN pool → cosine re-rank (fetch doc vectors from vec table)
  const pool = d.prepare("SELECT id FROM chunks_vec WHERE embedding MATCH ? ORDER BY distance LIMIT ?")
    .all(Buffer.from(qv.buffer, qv.byteOffset, qv.byteLength), CAND);
  let laneA = [];
  if (pool.length) {
    const ids = pool.map((r) => r.id);
    const ph = ids.map(() => "?").join(",");
    const vecs = d.prepare(`SELECT id, embedding FROM chunks_vec WHERE id IN (${ph})`).all(...ids);
    const rows = d.prepare(`SELECT id, path, source, start_line, substr(text,1,240) AS snippet FROM chunks WHERE id IN (${ph})`).all(...ids);
    const vById = new Map(vecs.map((r) => [r.id, r.embedding]));
    laneA = rows.map((r) => {
      const blob = vById.get(r.id);
      if (!blob) return null;
      const dv = new Float32Array(blob.buffer ?? blob, blob.byteOffset ?? 0, (blob.byteLength ?? blob.length) / 4);
      return { id: r.id, meta: { ...r, score: cosine(qv, dv) } };
    }).filter(Boolean).sort((a, b) => b.meta.score - a.meta.score);
  }

  // lane 1: FTS
  let laneB = [];
  const ftsMatch = ftsQueryFromText(query);
  if (ftsMatch) {
    try {
      laneB = d.prepare("SELECT id, path, source, start_line, substr(text,1,240) AS snippet, bm25(chunks_fts) AS s FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY s LIMIT ?")
        .all(ftsMatch, CAND)
        .map((r) => ({ id: r.id, meta: { ...r, score: -r.s } }));
    } catch { /* malformed FTS query — vector lane still answers */ }
  }
  // lane 2: trigram substring for CJK runs (unicode61 can't see fragments of
  // longer CJK runs; trigram LIKE can). 2-char runs fall back to a table scan
  // (trigram index needs 3+ chars) — fine at this corpus size. Disable with
  // cfg.triLane = false. EN is deliberately out of scope (see cjkRuns).
  let laneC = [];
  const runs = cjkRuns(query);
  if (runs.length && cfg?.triLane !== false) {
    const clause = runs.map(() => "text LIKE ?").join(" AND "); // column-qualified: FTS5 trigram LIKE requires <column> LIKE <pattern> — table-qualified silently returns 0 rows
    try {
      laneC = d.prepare(
        `SELECT id, path, source, start_line, substr(text,1,240) AS snippet FROM chunks_fts_tri
         WHERE ${clause} ORDER BY length(text) LIMIT ?`
      ).all(...runs.map((r) => `%${r}%`), CAND)
        .map((r) => ({ id: r.id, meta: { ...r, score: runs.length } }));
    } catch { /* schema mismatch etc — lanes 0/1 still answer */ }
  }
  // Per-query source filter (ownership routing, 2026-08-29): the agent picks
  // a tier ("my_second_brain" for personal, "memory" for its own lanes,
  // "llm-wiki" for co-owned research) instead of hoping the tier survives the
  // merge against 15k deep-corpus chunks. Applied per-lane pre-merge.
  if (Array.isArray(sources) && sources.length) {
    const sset = new Set(sources);
    laneA = laneA.filter((x) => sset.has(x.meta.source));
    laneB = laneB.filter((x) => sset.has(x.meta.source));
    laneC = laneC.filter((x) => sset.has(x.meta.source));
  }
  if (!laneA.length && !laneB.length && !laneC.length) return [];

  const excludes = (cfg?.excludePaths ?? []);
  let merged = rrfMerge([laneA, laneB, laneC], 60, Math.min(k * 3, 75));
  // Verbatim promotion: bare value/identifier queries (single token containing
  // digits/underscore/dot/colon/hyphen/comma, or CJK) — an FTS hit whose FULL
  // text contains the query verbatim leads, relative RRF order preserved.
  // Pure-word tokens (kill, port) are exempt: they match everywhere.
  const isValueLike = !/\s/.test(query) && /[\d_.,:/-]|[\u3400-\u4DB5\u4E00-\u9FFF]/.test(query);
  if (isValueLike && laneB.length) {
    const ids = merged.map((m) => m.id);
    const ph = ids.map(() => "?").join(",");
    const texts = new Map(
      d.prepare(`SELECT id, text FROM chunks WHERE id IN (${ph})`).all(...ids)
        .map((r) => [r.id, r.text.toLowerCase()])
    );
    const needle = query.toLowerCase();
    const hit = (m) => m.lanes.includes(2)
      || (m.lanes.includes(1) && texts.get(m.id)?.includes(needle)); // lane-2: containment already guaranteed by the LIKE
    const promoted = merged.filter(hit);
    if (promoted.length) merged = [...promoted, ...merged.filter((m) => !hit(m))];
  }
  const out = [];
  for (const m of merged) {
    if (out.length >= k) break;
    if (isExcluded(m.meta.path, excludes)) continue;
    const lanes = m.lanes.map((li) => (li === 0 ? "vec" : "fts")).join(",");
    const s = (m.lanes.includes(0)
      ? laneA.find((x) => x.id === m.id)?.meta.score
      : m.lanes.includes(1)
        ? laneB.find((x) => x.id === m.id)?.meta.score
        : m.lanes.includes(2) ? 0.5 : 0); // lane-C-only: nominal substring-hit score
    out.push({ path: m.meta.path, line: m.meta.start_line, source: m.meta.source, snippet: m.meta.snippet, lanes, score: s });
  }
  return out;
}

// search + a coverage field: which of the query's terms (beyond the entity)
// actually appear in the top hits. Informational only — ranking is identical
// to search(). Motivated by bench v2: unanswerable queries return the entity's
// article at high confidence (0.69-0.86), so the only separable absent-topic
// signal is term presence in the hits. The agent decides abstention; this
// surfaces the evidence.
export async function searchDetailed(query, k = 8, cfg, sources) {
  const hits = await search(query, k, cfg, sources);
  let coverage = { found: [], missing: [] };
  if (hits.length) {
    const d = getDb();
    const texts = hits.map((h) =>
      d.prepare("SELECT text FROM chunks WHERE path = ? AND start_line = ?").get(h.path, h.line)?.text ?? ""
    );
    // + every chunk of the top hit's FILE: a value can sit in a sibling chunk
    // beyond top-k (the chunk-miss pattern from bench v2).
    const sameFile = d.prepare("SELECT text FROM chunks WHERE path = ?").all(hits[0].path).map((r) => r.text);
    coverage = coverageOf(query, [...texts, ...sameFile]);
  }
  return { hits, coverage };
}
