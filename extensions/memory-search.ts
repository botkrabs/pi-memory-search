/**
 * memory-search — hybrid search over pi's own memory index.
 * No dependency on any other agent framework; the only external artifact is
 * an embedding-model GGUF (memory-search.json: modelPath, default
 * ~/models/Qwen3-Embedding-0.6B-Q8_0.gguf). The DB lives at
 * ~/.pi/agent/memory-store/memory.sqlite; code + deps ship with this package.
 *
 * Scope: ~/.pi/agent/memory-search.json — sources: ["pi-memory"] = every pi
 * project's memory.md/memory-wiki/memory-daily (auto-discovered from pi
 * session dirs) + extraPaths, minus excludePaths. Index runs in the
 * background at session start; queries await a pending index.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
// @ts-ignore
import { indexNow, search, loadConfig } from "../store/store.mjs";

let pendingIndex: Promise<unknown> | null = null;

export default function (pi: ExtensionAPI) {
  pendingIndex = (async () => {
    const cfg = loadConfig();
    if (!cfg || cfg.enabled === false) return;
    const t0 = Date.now();
    const r = await indexNow(cfg);
    if (r?.indexed) console.log(`[memory-search] indexed ${r.indexed} chunk(s) in ${Date.now() - t0}ms`);
  })().catch((e) => console.warn("[memory-search] index failed:", e?.message ?? e));

  pi.registerTool({
    name: "memory_search",
    label: "Memory Search",
    description:
      "Semantic search over pi's own memory index: every pi project's memory files " +
      "(memory.md, memory-wiki/, memory-daily/) plus any extraPaths in " +
      "~/.pi/agent/memory-search.json. Use for personal facts, past decisions, project " +
      "notes, 'what did we do/decide about X'. Returns ranked hits as path:line with " +
      "snippet and lane tags (vec/fts). For exact identifiers or code, grep may be faster.",
    parameters: Type.Object({
      query: Type.String({ description: "Natural-language query" }),
      k: Type.Optional(Type.Number({ description: "Max results (default 8)" })),
    }),
    async execute(_id, params) {
      const k = Math.min(Math.max(1, Math.round(params.k ?? 8)), 25);
      try {
        if (pendingIndex) { await pendingIndex; pendingIndex = null; }
        const t0 = Date.now();
        const hits = await search(params.query, k, loadConfig());
        if (!hits.length) return { content: [{ type: "text", text: "no results" }], details: {} };
        const out = hits
          .map((h, i) => `${i + 1}. ${h.path}:${h.line} [${h.source}] (${h.lanes}, s=${h.score.toFixed(3)})\n   ${String(h.snippet).replace(/\n/g, " | ").trim()}`)
          .join("\n");
        return {
          content: [{ type: "text", text: `memory_search: ${params.query}\n${out}\n(${Date.now() - t0}ms, k=${k})` }],
          details: { hits: hits.length },
        };
      } catch (e) {
        const m = String(e?.message ?? e);
        return { content: [{ type: "text", text: `memory_search failed: ${m}` }], isError: true };
      }
    },
  });
}
