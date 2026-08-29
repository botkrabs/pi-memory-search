# pi-memory-search

Hybrid **semantic + keyword** search over pi's own memory — as a pi extension, one tool: `memory_search`.

It indexes every pi project's memory files (`memory.md`, `memory-wiki/`, `memory-daily/`, auto-discovered — zero config), plus any extra paths you add. Queries run a three-lane search (sqlite-vec KNN with cosine re-rank ∥ FTS5/BM25 ∥ FTS5-trigram substring for CJK runs) merged with reciprocal-rank fusion, with exact-identifier promotion so bare values (a port number, an IP address, an internal rule name) rank correctly.

**Everything is local.** Embeddings run on CPU via node-llama-cpp (GPU optional, opt-in — see below); the index is one SQLite file. No cloud, no API keys, no network, no extra services. The only thing you need is an embedding model GGUF (below).

## Install

```bash
pi install git:github.com/botkrabs/pi-memory-search@0.0.2
```

pi clones the package and runs `npm install` (pulls `node-llama-cpp` + `sqlite-vec`, ~1 GB with platform binaries — once). Remove with `pi remove pi-memory-search` (your index and config are untouched — see below).

## Bring your own embedding model

The tool needs a sentence-embedding GGUF. Default (no config): `~/models/Qwen3-Embedding-0.6B-Q8_0.gguf`.

```bash
# e.g. Qwen3-Embedding-0.6B (1024-dim), any quant works:
huggingface-cli download ggml-org/Qwen3-Embedding-0.6B-Q8_0 --local-dir ~/models
```

Any embedding model works — put its path (and its dimension if not 1024) in the config:

```json
{
  "enabled": true,
  "sources": ["pi-memory"],
  "extraPaths": [],
  "excludePaths": [],
  "modelPath": "~/models/Qwen3-Embedding-0.6B-Q8_0.gguf",
  "dim": 1024,
  "gpu": false,
  "contextSize": 4096,
  "threads": 8,
  "triLane": true
}
```

Config lives at `~/.pi/agent/memory-search.json` (user-owned; the tool runs on defaults if the file is absent). **If you switch models or dims, start from a fresh index** (delete `~/.pi/agent/memory-store/memory.sqlite*`) — mixed vector spaces rank garbage.

The last four keys are performance knobs, all optional:

| key | default | meaning |
|---|---|---|
| `gpu` | `false` | `"gpu": -1` puts all embedding layers on the GPU (~30× faster cold index on an RTX 4090, retrieval-identical results). **Requires a local CUDA build** of `node-llama-cpp` (below) — the shipped prebuilt binary is CPU-only, so don't set it unless you built. |
| `contextSize` | `4096` | max tokens per embedding. 2048 crashes on CJK chunks that tokenize past 2048 tokens (CJK tokenizes denser than English); 4096 covers the chunker's 3,200-char cap for +0.22 GB of KV with no other cost. |
| `threads` | `min(CPUs, 16)` | embedding threads; node-llama-cpp's own default (6) is too low for modern parts. |
| `triLane` | `true` | disable the trigram substring lane (it only fires on CJK runs ≥2 chars; English queries are unaffected either way). |

### GPU indexing (optional)

Cold full-index speed is the one thing the CPU path can't scale — a 10k-chunk index is hours on CPU vs ~10 minutes on a 4090. To enable:

```bash
cd <package dir>/node_modules/node-llama-cpp   # where pi installed the deps
node dist/cli/cli.js source download           # fetches the llama.cpp source bundle
node dist/cli/cli.js source build --gpu auto --noUsageExample   # ~10 min on a 4090, one-time
```

(`npm run build` does NOT work here — that's node-llama-cpp's own TypeScript build and needs devDependencies that aren't installed in a consumer `node_modules`.) The CUDA compile is the long part: `ggml-cuda` builds one kernel template instance per quantization type, each slow under nvcc. Output lands in `llama/localBuilds/` (gitignored — it survives `pi update`, which resets the clone but leaves ignored files). Prereqs: `g++`/`make`, `cmake`, and the NVIDIA CUDA toolkit (`--gpu auto` detects `nvcc`); the GPU driver at runtime. Then set `"gpu": -1` in `memory-search.json`. VRAM is flat (~1 GB for the 0.6B model + 4096 ctx) regardless of corpus size — chunks are embedded one at a time. Skip it entirely and the CPU prebuilt stays the zero-effort path.

### Choosing the embedding model

Three GGUFs were benchmarked head-to-head (CPU, same chunker, 2026-08-29): a 39-query gate over a real agent-memory corpus (identifiers, value→fact lookups, paraphrase, typos, multi-hop, CJK) against a ~900-chunk scratch index.

| Model (Q8_0 GGUF) | Size / dims | Index speed | Query latency | Best for |
|---|---|---|---|---|
| **Qwen3-Embedding-0.6B** (default) | 610 MB / 1024-d | 301 ms/ch (~200/min) | ~37 ms | **Multilingual incl. CJK** — best identifier + CJK-fragment recall |
| **EmbeddingGemma-300M** | 334 MB / 768-d | 85 ms/ch (~700/min, 3.5×) | ~12 ms | Fast drop-in: 2048-token ctx (no config change), strong semantic/paraphrase; CJK *full terms* fine, CJK *fragments* weak; Gemma license (gated on HF) |
| **bge-small-en-v1.5** | 35 MB / 384-d | 28 ms/ch (~2100/min, 10×) | ~5 ms | **English-only corpora** — near-tie quality at a fraction of the cost; English-only, and its 512-token native context means lowering `CHUNK_CHARS` in `store/store.mjs` to ~480 |

Quality was a near-tie across all three for English queries (the hybrid FTS lane carries exact/identifier matches regardless of model); the differentiator is CJK, where only Qwen3 survived fragment-level probes (a two-character CJK fragment resolved to the right note; the other two returned unrelated same-language documents). So: **keep the default unless your corpus is English-only** — then bge-small or EmbeddingGemma buy a 3.5–10× faster cold index for free quality.

```bash
huggingface-cli download ggml-org/embeddinggemma-300M-GGUF embeddinggemma-300M-Q8_0.gguf --local-dir ~/models   # 768-d
huggingface-cli download ggml-org/bge-small-en-v1.5-Q8_0-GGUF bge-small-en-v1.5-q8_0.gguf --local-dir ~/models    # 384-d
```

Caveats: 39 queries / ~900 chunks is a directional gate, not a statistical benchmark; index speeds scale linearly with your corpus size (a 16k-chunk cold index ≈ 90 min on Qwen3, ~25 min on EmbeddingGemma).

### Benchmark results

Per-query top hits (scores + winning lane) for both benches are in [`bench/`](bench/): readable as [en-bench.md](bench/en-bench.md) (39 queries, ~935-chunk agent-memory corpus, three models) and [cjk-bench.md](bench/cjk-bench.md) (22 queries, two models), machine-readable as `results-*.json`. Doc names are basenames only and personal values in the queries are generalized; the query set includes exact identifiers, value→fact reverse lookups, paraphrase, typos, multi-hop, negative controls (absent topics), and CJK.

**English gate (39 queries):** quality was a near-tie — ~31/34 top-2 for Qwen3 and EmbeddingGemma, ~27/34 for bge-small — because the hybrid FTS lane carries exact/identifier matches regardless of model. The differentiators: CJK (Qwen3-only), one pitfall-note recall (Gemma-only), and index speed (bge 10×).

**Pure-CJK bench (22 grounded queries, 2,147-chunk zh corpus):** this is where the decision closed.

| | Qwen3-0.6B | EmbeddingGemma-300M |
|---|---|---|
| Correct rank-1 | **17 / 18** | 12 / 18 |
| Query latency | 40 ms | 15 ms |
| CJK index speed | 1.76 s/ch | 0.41 s/ch (4.3× faster) |

Qwen3 wins every *hard* query — fragments with same-language distractors, semantic paraphrase, disambiguation between neighboring same-domain notes (two pressure-cooker recipes), and a dual-entity multi-hop (both correct articles in the top-2, vs category pages for Gemma). The two tie on exact terms and FTS-anchored queries. Gemma's CJK is fine for full terms but its cosine separation between near-same-domain CJK chunks is too low to rank reliably.

One caveat found in the bench: EmbeddingGemma's 2048-token native context overflows long CJK chunks (a 3,200-char CJK chunk crashed it — CJK tokenizes denser than English); the bench applied a 1,800-char embed truncation to both models for parity. Qwen3's 32K native context never overflows — if you swap models, raise `contextSize` or lower `CHUNK_CHARS` in `store/store.mjs` accordingly.

**Bench v2 (2026-08-29, post-trigram/GPU):** 80 CJK queries (22 above re-run + 58 new: temporal, fact/number, multi-hop, simplified↔traditional variants, mixed CN+EN, preferences, world-knowledge, and unanswerable adversarial queries) over zh-wiki-grounded corpora at three scales.

| scale | chunks | correct rank-1 | top-2 |
|---|---|---|---|
| 1× | 3,759 | 90% | 93% |
| 3× | 7,247 | 90% | 93% |
| 5× | 11,263 | 86% | 92% |

Decay is nearly flat to 3× scale; the 5× slips are short-phrase queries and all recover at top-2. Every v1 rank-1 survived the v2 corpus unchanged. Two honest findings: (1) **unanswerable queries are not rejected** — all 8 adversarial queries returned the correct entity's article at high confidence (0.69–0.86), so the tool will surface a confident wrong-shaped hit for absent facts (backlog: absent-topic signal); (2) file-level retrieval (~90%) beats answer-in-top-3 (~75%) — the right file is usually rank-1, but the specific value can sit in a chunk beyond top-3. Queries: [`bench/cjk-v2-queries.json`](bench/cjk-v2-queries.json) (basenames only).

## What it indexes

- `sources: ["pi-memory"]` — every pi project's memory trio, discovered from pi's session dirs. This is the point: your agent working memory is searchable across all projects.
- `extraPaths` — anything else: Obsidian vaults, note trees, docs. Directories are walked recursively (dot-dirs skipped, 1 MB per-file cap).
- `excludePaths` — enforced at **both** index and query time. Put secrets files here; also consider the vault-side rule of storing *locations* of secrets, not the secrets.

## The memory system it indexes

The `pi-memory` source assumes the standard pi memory layout per project — three parts, owned by the agent, searched together across *all* your projects (cross-project recall is the point):

```
<pi-project>/
├── AGENTS.md                  # project instructions; usually carries the memory protocol
├── memory.md                  # essentials + pointers — small by design (< ~800 tokens)
├── memory-wiki/               # durable topic pages, one page per topic
│   ├── llms.md                #   the index: page list + "when to read it" lines
│   └── <topic>.md             #   dense, LLM-first facts (no secrets, no filler)
└── memory-daily/
    ├── YYYY-MM-DD.md          # chronological session log (append within a day)
    └── archive/               # distilled daily files move here
```

- **memory.md** — the first read on any non-trivial task. Essentials only; deeper material becomes a one-line FORWARD pointer, not a copy.
- **memory-wiki/** — topics that outlive daily churn. Page shape: title, one-line scope, `Read when:` line, then dense bullets.
- **memory-daily/** — scratch: what happened, decisions, open items. Distill the durable parts upward, then move the file to `archive/` (distilled = nothing unique lost).

**Write-for-rank** (from benchmarking this search against real query sets):

- State a fact with its topic words in the same chunk ("local chat model = llama-3-8b-instruct-q4_k_m"), not the value alone — bare values elsewhere rank against generic content.
- One source of truth per fact; duplicates dilute ranking. Other locations hold pointers.
- Never store secrets in indexed files. Keep the *location* of a secret in a note, and put secret files in `excludePaths`.
- Exact identifiers (names, ports, IPs, rule names) are safe to quote verbatim — the verbatim-promotion lane rewards it.

## Behavior

- **Session start**: the index rebuilds in the background (hash-incremental — a warm session touches only changed files, ~0 embeddings).
- **First query of the session**: awaits the pending index, then searches. Cold model load ≈ 2.5 s; cold full index of ~16k chunks ≈ 90 min on CPU, ≈ 15 min with `"gpu": -1` (one-time; a warm re-index is seconds either way — hash-keyed skip).
- **Results**: ranked hits with `path:line`, source tag, snippet, and lane tags `(vec|fts|vec,fts)` + lane-native score. A third tag `fts` (i.e. `vec,fts,fts`) means the trigram substring lane also matched — the strongest CJK-fragment signal.
- **Index location**: `~/.pi/agent/memory-store/memory.sqlite` (code and deps live with the package; the DB stays in your agent dir so `pi remove` never touches your data).

## Tools (for tinkerers)

In the installed package (`~/.pi/agent/git/github.com/botkrabs/pi-memory-search/`):

```bash
node store/tools/index-now.mjs                 # force an index run now
node store/tools/probe.mjs "your query" …      # raw search probe (multi-query)
store/tools/verify.sh "probe one" "probe two"  # integrity counts + probes
```

## Design notes

- **Independence invariant**: zero references to any other agent framework. Uninstalling anything else must not break this tool.
- **Pinned deps**: `node-llama-cpp` 3.19.0 (CPU prebuilt; local CUDA build optional for `gpu`) and `sqlite-vec` 0.1.9 in `package.json` — no floating versions.
- **Ranking**: RRF (k=60) over three lanes (vec ∥ token FTS ∥ trigram substring for CJK runs ≥2 chars); exact ties break toward multi-lane, then lane specificity (substring > token > vec); verbatim promotion for value-like single-token queries and all trigram hits. Query functions are pure and isolated in `store/memory-search-query.mjs`.
- **Coverage note (absent-topic signal)**: bench v2 showed unanswerable queries return the correct entity's article at high confidence (0.69–0.86 — no score threshold can reject them). Instead of rejecting, the tool reports which query terms (beyond the entity) are absent from the top hits and the top hit's file. Informational only — the agent decides abstention. Measured on 16 adversarial / 16 control queries across zh-wiki and an English agent-wiki corpus: 16/16 adversarial cues, 4/16 control false-cues (all on answerable queries whose answer is still visible in the snippet).
- **FTS5 trigram gotcha**: trigram `LIKE` only works **column-qualified** (`WHERE text LIKE ?`); a table-qualified `WHERE chunks_fts_tri LIKE ?` silently returns zero rows.
- **Known sharp edges** (learned the hard way, fixed): vec0 virtual tables don't honour `INSERT OR REPLACE` (use DELETE+INSERT); identical chunk ids within one file must be de-duped; the DB needs WAL + busy_timeout for concurrent reads; incremental embed keys on *vec-row presence* so crash orphans self-heal.

## License

MIT
