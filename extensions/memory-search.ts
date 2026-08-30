/**
 * memory-search — hybrid search over pi's own memory index.
 * No dependency on any other agent framework; the only external artifact is
 * an embedding-model GGUF (memory-search.json: modelPath, default
 * ~/models/Qwen3-Embedding-0.6B-Q8_0.gguf). The DB lives at
 * ~/.pi/agent/memory-store/memory.sqlite; code + deps ship with this package.
 *
 * Scope: ~/.pi/agent/memory-search.json — sources: ["pi-memory"] = every pi
 * project's memory.md/memory-wiki/memory-daily (auto-discovered from pi
 * session dirs) + extraPaths, minus excludePaths.
 *
 * Indexing is LAZY: nothing runs at session start; the incremental pass
 * fires on the session's first memory_search call, and queries await it
 * (later calls await the already-resolved promise — a no-op). Rationale:
 * sessions that never search pay zero, and startup is quiet. Explicit
 * syncs exist outside the tool (reindex scripts / manual commands).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
// @ts-ignore
import { indexNow, searchDetailed, loadConfig } from "../store/store.mjs";

let pendingIndex: Promise<unknown> | null = null;
let indexStarted = false;

export default function (pi: ExtensionAPI) {
  // Factory re-runs per session (start/reload): reset so the new session's
  // first query triggers a fresh incremental pass.
  pendingIndex = null;
  indexStarted = false;

  const startIndex = (): Promise<unknown> | null => {
    if (indexStarted) return pendingIndex;
    indexStarted = true;
    pendingIndex = (async () => {
      const cfg = loadConfig();
      if (!cfg || cfg.enabled === false) return;
      const t0 = Date.now();
      const r = await indexNow(cfg);
      if (r?.indexed) console.log(`[memory-search] indexed ${r.indexed} chunk(s) in ${Date.now() - t0}ms`);
    })().catch((e) => console.warn("[memory-search] index failed:", e?.message ?? e));
    return pendingIndex;
  };

  pi.registerTool({
    name: "memory_search",
    label: "Memory Search",
    description:
      "Semantic search over pi's own memory index: every pi project's memory files " +
      "(memory.md, memory-wiki/, memory-daily/) plus any extraPaths in " +
      "~/.pi/agent/memory-search.json. Use for personal facts, past decisions, project " +
      "notes, 'what did we do/decide about X'. Returns ranked hits as path:line with " +
      "snippet and lane tags (vec/fts), plus a coverage note listing query terms absent from the " +
      "top hits — if the query's key terms are missing, the topic may not be covered: say so " +
      "instead of answering from the hit alone. For exact identifiers or code, grep may be faster.",
    parameters: Type.Object({
      query: Type.String({ description: "Natural-language query" }),
      k: Type.Optional(Type.Number({ description: "Max results (default 8)" })),
      sources: Type.Optional(Type.Array(Type.String(), {
        description: "Restrict to source labels (e.g. 'my_second_brain', 'llm-wiki', 'memory'). Omit for all. Use when the question targets one tier: personal facts → my_second_brain; what the agent noted → memory; co-owned research → llm-wiki.",
      })),
    }),
    async execute(_id, params) {
      const k = Math.min(Math.max(1, Math.round(params.k ?? 8)), 25);
      try {
        // Lazy index: first call of the session runs (and awaits) the
        // incremental pass; later calls await the resolved promise (no-op).
        const p = startIndex();
        if (p) await p;
        const t0 = Date.now();
        const { hits, coverage } = await searchDetailed(params.query, k, loadConfig(), Array.isArray(params.sources) ? params.sources : undefined);
        if (!hits.length) return { content: [{ type: "text", text: "no results" }], details: {} };
        const out = hits
          .map((h, i) => `${i + 1}. ${h.path}:${h.line} [${h.source}] (${h.lanes}, s=${h.score.toFixed(3)})\n   ${String(h.snippet).replace(/\n/g, " | ").trim()}`)
          .join("\n");
        const cov = coverage.missing.length
          ? `\ncoverage: NOT in top hits: ${coverage.missing.join(", ")} — topic may not be covered; verify before asserting`
          : "";
        return {
          content: [{ type: "text", text: `memory_search: ${params.query}\n${out}${cov}\n(${Date.now() - t0}ms, k=${k})` }],
          details: { hits: hits.length, missing: coverage.missing },
        };
      } catch (e) {
        const m = String(e?.message ?? e);
        return { content: [{ type: "text", text: `memory_search failed: ${m}` }], isError: true };
      }
    },
  });
}
