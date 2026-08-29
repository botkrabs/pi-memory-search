# Benchmark — English gate

39 queries against a ~935-chunk real agent-memory corpus (memory lane + two note vaults),
three embedding models, identical chunker and hybrid FTS5+sqlite-vec pipeline. 2026-08-29.

Doc names are basenames only — directory paths removed to keep the corpus private.
Scores > 1 are BM25 (exact token match on the FTS lane); 0–1 are cosine (vector lane).

## 1. hv_utils  —  *A exact identifiers*

- **Qwen3-0.6B**: **1.** `2026-08-28.md` (2.70, fts)  ·  **2.** `memory.md` (2.00, fts)  ·  **3.** `yazi-summary.md` (0.64, vec)
- **EmbeddingGemma-300M**: **1.** `2026-08-28.md` (2.70, fts)  ·  **2.** `memory.md` (2.00, fts)  ·  **3.** `00_Dashboard.md` (0.58, vec)
- **bge-small-en**: **1.** `memory.md` (0.64, vec,fts)  ·  **2.** `2026-08-28.md` (0.62, vec,fts)  ·  **3.** `2026-08-28.md` (4.54, fts)

## 2. memory_embedding_cache  —  *A exact identifiers*

- **Qwen3-0.6B**: **1.** `2026-08-29.md` (3.75, fts)  ·  **2.** `llms.md` (0.73, vec)  ·  **3.** `memory.md` (0.73, vec)
- **EmbeddingGemma-300M**: **1.** `2026-08-29.md` (3.75, fts)  ·  **2.** `openclaw-memory-management.md` (0.59, vec)  ·  **3.** `turboquant-installation.md` (0.54, vec)
- **bge-small-en**: **1.** `2026-08-29.md` (0.66, vec,fts)  ·  **2.** `openclaw-memory-management.md` (0.76, vec)  ·  **3.** `2026-08-28.md` (0.75, vec)

## 3. a Windows firewall rule name  —  *A exact identifiers*

- **Qwen3-0.6B**: **1.** `2026-08-24.md` (0.70, vec,fts)  ·  **2.** `ssh-wsl2-pi-box.md` (0.72, vec,fts)  ·  **3.** `ssh.md` (0.68, vec,fts)
- **EmbeddingGemma-300M**: **1.** `ssh-wsl2-pi-box.md` (0.67, vec,fts)  ·  **2.** `ssh.md` (0.65, vec,fts)  ·  **3.** `2026-08-24.md` (0.55, vec,fts)
- **bge-small-en**: **1.** `ssh-wsl2-pi-box.md` (0.84, vec,fts)  ·  **2.** `ssh-wsl2-pi-box.md` (0.83, vec,fts)  ·  **3.** `2026-08-24.md` (0.77, vec,fts)

## 4. how do I get onto this machine from my Mac  —  *B semantic paraphrase*

- **Qwen3-0.6B**: **1.** `llms.md` (0.56, vec,fts)  ·  **2.** `ssh.md` (0.55, vec,fts)  ·  **3.** `2026-08-24.md` (0.51, vec,fts)
- **EmbeddingGemma-300M**: **1.** `ssh.md` (0.40, vec,fts)  ·  **2.** `ssh-wsl2-pi-box.md` (0.37, vec,fts)  ·  **3.** `ssh.md` (0.37, vec,fts)
- **bge-small-en**: **1.** `ssh.md` (0.71, vec,fts)  ·  **2.** `ssh-wsl2-pi-box.md` (0.69, vec,fts)  ·  **3.** `ssh.md` (0.64, vec,fts)

## 5. why was github.com unreachable for a day  —  *B semantic paraphrase*

- **Qwen3-0.6B**: **1.** `2026-08-28.md` (0.61, vec,fts)  ·  **2.** `2026-08-28.md` (0.59, vec,fts)  ·  **3.** `memory.md` (0.52, vec,fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-28.md` (0.44, vec,fts)  ·  **2.** `2026-08-29.md` (0.33, vec,fts)  ·  **3.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.32, vec,fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.73, vec,fts)  ·  **2.** `memory.md` (0.69, vec,fts)  ·  **3.** `box.md` (0.65, vec,fts)

## 6. why do time deltas in logs right after waking the box not make sense  —  *B semantic paraphrase*

- **Qwen3-0.6B**: **1.** `box.md` (0.58, vec,fts)  ·  **2.** `openclaw-memory-management.md` (0.51, vec,fts)  ·  **3.** `2026-08-28.md` (0.46, vec,fts)
- **EmbeddingGemma-300M**: **1.** `pi-ops.md` (0.39, vec,fts)  ·  **2.** `box.md` (0.40, vec,fts)  ·  **3.** `2026-08-28.md` (0.40, vec,fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.75, vec,fts)  ·  **2.** `openclaw-memory-management.md` (0.71, vec,fts)  ·  **3.** `memory.md` (0.75, vec,fts)

## 7. 椒麻雞 recipe  —  *C cross-project / CJK*

- **Qwen3-0.6B**: **1.** `椒麻雞 Sichuan Style Chicken and spicy sweet and sour sauce.md` (0.78, vec,fts)  ·  **2.** `照燒雞 Teriyaki Chicken.md` (0.59, vec,fts)  ·  **3.** `椒麻雞 Sichuan Style Chicken and spicy sweet and sour sauce.md` (0.58, vec,fts)
- **EmbeddingGemma-300M**: **1.** `椒麻雞 Sichuan Style Chicken and spicy sweet and sour sauce.md` (0.65, vec,fts)  ·  **2.** `orange-chicken.md` (0.59, vec,fts)  ·  **3.** `椒麻雞 Sichuan Style Chicken and spicy sweet and sour sauce.md` (0.64, vec,fts)
- **bge-small-en**: **1.** `照燒雞 Teriyaki Chicken.md` (0.84, vec,fts)  ·  **2.** `椒麻雞 Sichuan Style Chicken and spicy sweet and sour sauce.md` (0.82, vec,fts)  ·  **3.** `椒麻雞 Sichuan Style Chicken and spicy sweet and sour sauce.md` (0.81, vec,fts)

## 8. catan strategy  —  *C cross-project / CJK*

- **Qwen3-0.6B**: **1.** `2026-08-29.md` (6.37, fts)  ·  **2.** `yazi-summary.md` (0.61, vec)  ·  **3.** `lossless-claw plugin.md` (5.78, fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-29.md` (6.37, fts)  ·  **2.** `2026-04-02.md` (0.40, vec)  ·  **3.** `lossless-claw plugin.md` (5.78, fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.71, vec,fts)  ·  **2.** `2026-08-28.md` (0.62, vec,fts)  ·  **3.** `2026-08-28.md` (7.43, fts)

## 9. epub spine idref  —  *C cross-project / CJK*

- **Qwen3-0.6B**: **1.** `epub.md` (0.64, vec,fts)  ·  **2.** `llms.md` (0.52, vec,fts)  ·  **3.** `memory.md` (0.49, vec,fts)
- **EmbeddingGemma-300M**: **1.** `epub.md` (0.47, vec,fts)  ·  **2.** `epub.md` (0.44, vec,fts)  ·  **3.** `thinking-mode.md` (0.44, vec,fts)
- **bge-small-en**: **1.** `epub.md` (0.76, vec,fts)  ·  **2.** `epub.md` (0.78, vec,fts)  ·  **3.** `2026-08-28.md` (0.68, vec,fts)

## 10. what port does the wikipedia MCP run on  —  *D fact extraction*

- **Qwen3-0.6B**: **1.** `box.md` (0.68, vec,fts)  ·  **2.** `mcp.md` (0.69, vec,fts)  ·  **3.** `mcp.md` (0.54, vec,fts)
- **EmbeddingGemma-300M**: **1.** `box.md` (0.60, vec,fts)  ·  **2.** `mcp.md` (0.44, vec,fts)  ·  **3.** `mcp.md` (0.54, vec,fts)
- **bge-small-en**: **1.** `box.md` (0.73, vec,fts)  ·  **2.** `2026-08-28.md` (0.70, vec,fts)  ·  **3.** `mcp.md` (0.71, vec,fts)

## 11. how many chunks are in the memory index  —  *D fact extraction*

- **Qwen3-0.6B**: **1.** `box.md` (0.57, vec,fts)  ·  **2.** `2026-08-28.md` (0.55, vec,fts)  ·  **3.** `box.md` (0.54, vec,fts)
- **EmbeddingGemma-300M**: **1.** `box.md` (0.45, vec,fts)  ·  **2.** `2026-08-28.md` (0.43, vec,fts)  ·  **3.** `2026-08-29.md` (0.45, vec,fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.74, vec,fts)  ·  **2.** `box.md` (0.78, vec,fts)  ·  **3.** `openclaw-memory-management.md` (0.71, vec,fts)

## 12. how fast does pi embed chunks per minute  —  *D fact extraction*

- **Qwen3-0.6B**: **1.** `2026-08-29.md` (0.67, vec,fts)  ·  **2.** `box.md` (0.62, vec,fts)  ·  **3.** `box.md` (0.55, vec,fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-29.md` (0.63, vec,fts)  ·  **2.** `box.md` (0.57, vec,fts)  ·  **3.** `2026-08-28.md` (0.45, vec,fts)
- **bge-small-en**: **1.** `2026-08-29.md` (0.80, vec,fts)  ·  **2.** `box.md` (0.78, vec,fts)  ·  **3.** `2026-08-28.md` (0.72, vec,fts)

## 13. what process must never be killed  —  *E pitfall / must-not-do*

- **Qwen3-0.6B**: **1.** `Areas.md` (0.48, vec,fts)  ·  **2.** `openclaw-memory-management.md` (0.42, vec,fts)  ·  **3.** `2026-08-29.md` (9.53, fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-28.md` (0.43, vec,fts)  ·  **2.** `box.md` (0.32, vec,fts)  ·  **3.** `00_Dashboard.md` (0.34, vec,fts)
- **bge-small-en**: **1.** `memory.md` (0.69, vec,fts)  ·  **2.** `2026-08-28.md` (0.64, vec,fts)  ·  **3.** `lossless-claw plugin.md` (0.64, vec,fts)

## 14. why does Query with a text argument silently fail  —  *E pitfall / must-not-do*

- **Qwen3-0.6B**: **1.** `2026-08-28.md` (0.56, vec,fts)  ·  **2.** `lossless-claw plugin.md` (0.54, vec,fts)  ·  **3.** `Areas.md` (0.44, vec,fts)
- **EmbeddingGemma-300M**: **1.** `lossless-claw plugin.md` (0.38, vec,fts)  ·  **2.** `llama.cpp Grammar Fix.md` (0.38, vec,fts)  ·  **3.** `Mastering llama.cpp A Comprehensive Guide to Local LLM Integration.md` (0.35, vec,fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.67, vec,fts)  ·  **2.** `memory.md` (0.66, vec,fts)  ·  **3.** `llama.cpp Grammar Fix.md` (0.64, vec,fts)

## 15. why must the wiki server not use bare python3  —  *E pitfall / must-not-do*

- **Qwen3-0.6B**: **1.** `memory.md` (0.59, vec,fts)  ·  **2.** `2026-08-28.md` (0.64, vec,fts)  ·  **3.** `yazi-summary.md` (0.52, vec,fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-28.md` (0.51, vec,fts)  ·  **2.** `llm-wiki.md` (0.37, vec,fts)  ·  **3.** `box.md` (0.37, vec,fts)
- **bge-small-en**: **1.** `llm-wiki.md` (0.68, vec,fts)  ·  **2.** `2026-08-28.md` (0.76, vec,fts)  ·  **3.** `Thread by @karpathy.md` (0.69, vec,fts)

## 16. what is my favorite coffee drink  —  *F negative control (absent)*

- **Qwen3-0.6B**: **1.** `Areas.md` (0.44, vec,fts)  ·  **2.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (8.49, fts)  ·  **3.** `yazi-summary.md` (0.52, vec)
- **EmbeddingGemma-300M**: **1.** `Blue Mountain.md` (0.26, vec,fts)  ·  **2.** `lossless-claw plugin.md` (0.27, vec,fts)  ·  **3.** `openclaw-memory-management.md` (0.24, vec,fts)
- **bge-small-en**: **1.** `Blue Mountain.md` (0.57, vec,fts)  ·  **2.** `Blue Mountain.md` (0.58, vec,fts)  ·  **3.** `Blue Mountain.md` (0.58, vec,fts)

## 17. how do I change a flat bike tire  —  *F negative control (absent)*

- **Qwen3-0.6B**: **1.** `Thread by @karpathy.md` (10.08, fts)  ·  **2.** `2026-06-26.md` (0.40, vec)  ·  **3.** `Thread by @karpathy.md` (7.47, fts)
- **EmbeddingGemma-300M**: **1.** `How to Get Started with darktable, 2026 Edition.md` (0.22, vec,fts)  ·  **2.** `How to Get Started with darktable, 2026 Edition.md` (0.25, vec,fts)  ·  **3.** `How to Get Started with darktable, 2026 Edition.md` (0.23, vec,fts)
- **bge-small-en**: **1.** `Thread by @karpathy.md` (0.54, vec,fts)  ·  **2.** `Thread by @karpathy.md` (0.54, vec,fts)  ·  **3.** `Thread by @karpathy.md` (0.54, vec,fts)

## 18. what is the password for the office printer  —  *F negative control (absent)*

- **Qwen3-0.6B**: **1.** `openclaw session timeline.md` (0.47, vec,fts)  ·  **2.** `Areas.md` (0.40, vec,fts)  ·  **3.** `llm-wiki.md` (9.14, fts)
- **EmbeddingGemma-300M**: **1.** `openclaw session timeline.md` (0.32, vec,fts)  ·  **2.** `openclaw-memory-management.md` (0.24, vec,fts)  ·  **3.** `How to Get Started with darktable, 2026 Edition.md` (0.27, vec,fts)
- **bge-small-en**: **1.** `llm-wiki.md` (8.57, fts)  ·  **2.** `ssh-wsl2-pi-box.md` (0.67, vec)  ·  **3.** `llm-wiki.md` (8.52, fts)

## 19. kill  —  *G short ambiguous*

- **Qwen3-0.6B**: **1.** `tmux-split-screen.md` (8.49, fts)  ·  **2.** `Kanban Bathroom Reno.md` (0.61, vec)  ·  **3.** `tmux-split-screen.md` (8.30, fts)
- **EmbeddingGemma-300M**: **1.** `tmux-split-screen.md` (0.64, vec,fts)  ·  **2.** `tmux-split-screen.md` (0.62, vec,fts)  ·  **3.** `tmux-split-screen.md` (0.61, vec,fts)
- **bge-small-en**: **1.** `tmux-split-screen.md` (0.70, vec,fts)  ·  **2.** `tmux-split-screen.md` (0.69, vec,fts)  ·  **3.** `memory.md` (0.65, vec,fts)

## 20. port  —  *G short ambiguous*

- **Qwen3-0.6B**: **1.** `2026-08-28.md` (6.16, fts)  ·  **2.** `Kanban Bathroom Reno.md` (0.60, vec)  ·  **3.** `box.md` (5.53, fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-28.md` (6.16, fts)  ·  **2.** `yazi-keyboard-cheatsheet.md` (0.50, vec)  ·  **3.** `box.md` (5.53, fts)
- **bge-small-en**: **1.** `box.md` (0.67, vec,fts)  ·  **2.** `Mastering llama.cpp A Comprehensive Guide to Local LLM Integration.md` (0.63, vec,fts)  ·  **3.** `Mastering llama.cpp A Comprehensive Guide to Local LLM Integration.md` (0.62, vec,fts)

## 21. dns  —  *G short ambiguous*

- **Qwen3-0.6B**: **1.** `2026-08-28.md` (6.73, fts)  ·  **2.** `2026-08-29.md` (0.55, vec)  ·  **3.** `2026-08-28.md` (4.38, fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-28.md` (6.73, fts)  ·  **2.** `wsl_sandbox_security.md` (0.54, vec)  ·  **3.** `2026-08-28.md` (4.38, fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.70, vec,fts)  ·  **2.** `2026-08-28.md` (0.66, vec,fts)  ·  **3.** `2026-08-28.md` (0.65, vec,fts)

## 22. the chat router port  —  *H reverse lookup (value→fact)*

- **Qwen3-0.6B**: **1.** `memory.md` (0.57, vec,fts)  ·  **2.** `2026-08-28.md` (4.84, fts)  ·  **3.** `mcp.md` (4.45, fts)
- **EmbeddingGemma-300M**: **1.** `mcp.md` (0.32, vec,fts)  ·  **2.** `mcp.md` (0.29, vec,fts)  ·  **3.** `2026-08-28.md` (0.25, vec,fts)
- **bge-small-en**: **1.** `2026-08-28.md` (6.78, fts)  ·  **2.** `memory.md` (6.29, fts)  ·  **3.** `2026-08-28.md` (5.33, fts)

## 23. 100.x.y.z (a Tailscale IP)  —  *H reverse lookup (value→fact)*

- **Qwen3-0.6B**: **1.** `ssh-wsl2-pi-box.md` (19.87, fts)  ·  **2.** `ssh.md` (17.25, fts)  ·  **3.** `ssh-wsl2-pi-box.md` (16.89, fts)
- **EmbeddingGemma-300M**: **1.** `ssh-wsl2-pi-box.md` (0.25, vec,fts)  ·  **2.** `ssh.md` (0.22, vec,fts)  ·  **3.** `ssh.md` (0.17, vec,fts)
- **bge-small-en**: **1.** `ssh-wsl2-pi-box.md` (17.46, fts)  ·  **2.** `ssh.md` (16.95, fts)  ·  **3.** `ssh-wsl2-pi-box.md` (16.66, fts)

## 24. the chunk count from the logs  —  *H reverse lookup (value→fact)*

- **Qwen3-0.6B**: **1.** `2026-08-29.md` (10.82, fts)  ·  **2.** `2026-08-29.md` (5.64, fts)  ·  **3.** `box.md` (3.38, fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-29.md` (0.16, vec,fts)  ·  **2.** `2026-08-29.md` (10.82, fts)  ·  **3.** `box.md` (3.38, fts)
- **bge-small-en**: **1.** `2026-08-29.md` (10.91, fts)  ·  **2.** `box.md` (7.47, fts)  ·  **3.** `2026-08-29.md` (5.62, fts)

## 25. how do I acces the pi box from the mac  —  *I typo / misspelling*

- **Qwen3-0.6B**: **1.** `llms.md` (0.66, vec,fts)  ·  **2.** `2026-08-24.md` (0.63, vec,fts)  ·  **3.** `ssh-wsl2-pi-box.md` (0.64, vec,fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-24.md` (0.56, vec,fts)  ·  **2.** `ssh-wsl2-pi-box.md` (0.59, vec,fts)  ·  **3.** `ssh-wsl2-pi-box.md` (0.55, vec,fts)
- **bge-small-en**: **1.** `ssh.md` (0.72, vec,fts)  ·  **2.** `ssh.md` (0.73, vec,fts)  ·  **3.** `ssh-wsl2-pi-box.md` (0.71, vec,fts)

## 26. whats the port for the wikpedia mcp  —  *I typo / misspelling*

- **Qwen3-0.6B**: **1.** `mcp.md` (0.66, vec,fts)  ·  **2.** `box.md` (0.60, vec,fts)  ·  **3.** `mcp.md` (0.60, vec,fts)
- **EmbeddingGemma-300M**: **1.** `box.md` (0.59, vec,fts)  ·  **2.** `mcp.md` (0.53, vec,fts)  ·  **3.** `llms.md` (0.47, vec,fts)
- **bge-small-en**: **1.** `box.md` (0.74, vec,fts)  ·  **2.** `llms.md` (0.71, vec,fts)  ·  **3.** `mcp.md` (0.71, vec,fts)

## 27. Qwen3-Embeddng  —  *I typo / misspelling*

- **Qwen3-0.6B**: **1.** `Qwen3.8-27B Thinking Control.md` (0.73, vec,fts)  ·  **2.** `memory.md` (0.75, vec,fts)  ·  **3.** `llama-cpp - LLM models configurations.md` (0.68, vec,fts)
- **EmbeddingGemma-300M**: **1.** `llama-cpp - LLM models configurations.md` (0.52, vec,fts)  ·  **2.** `llama-cpp - LLM models configurations.md` (0.51, vec,fts)  ·  **3.** `turboquant-installation.md` (0.60, vec,fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.81, vec,fts)  ·  **2.** `llama-cpp - LLM models configurations.md` (0.68, vec,fts)  ·  **3.** `llama-cpp - LLM models configurations.md` (0.69, vec,fts)

## 28. what was the sinkhole IP that poisoned the github DNS  —  *J multi-hop / compositional*

- **Qwen3-0.6B**: **1.** `2026-08-28.md` (0.62, vec,fts)  ·  **2.** `2026-08-28.md` (0.58, vec,fts)  ·  **3.** `memory.md` (0.53, vec,fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-28.md` (0.50, vec,fts)  ·  **2.** `2026-08-28.md` (0.47, vec,fts)  ·  **3.** `2026-08-29.md` (0.45, vec,fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.79, vec,fts)  ·  **2.** `2026-08-28.md` (0.76, vec,fts)  ·  **3.** `2026-08-28.md` (0.70, vec,fts)

## 29. how long did the cold OpenClaw index take  —  *J multi-hop / compositional*

- **Qwen3-0.6B**: **1.** `2026-08-29.md` (0.64, vec,fts)  ·  **2.** `box.md` (0.55, vec,fts)  ·  **3.** `openclaw-memory-management.md` (0.49, vec,fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-29.md` (0.60, vec,fts)  ·  **2.** `box.md` (0.38, vec,fts)  ·  **3.** `openclaw-memory-management.md` (0.38, vec,fts)
- **bge-small-en**: **1.** `2026-08-29.md` (0.81, vec,fts)  ·  **2.** `box.md` (0.69, vec,fts)  ·  **3.** `openclaw journey.md` (0.72, vec,fts)

## 30. which model quant does the local chat router run  —  *J multi-hop / compositional*

- **Qwen3-0.6B**: **1.** `2026-08-21.md` (0.54, vec,fts)  ·  **2.** `mcp.md` (0.55, vec,fts)  ·  **3.** `2026-04-02.md` (0.60, vec,fts)
- **EmbeddingGemma-300M**: **1.** `llama.cpp Model Management.md` (0.52, vec,fts)  ·  **2.** `llama.cpp Model Management.md` (0.49, vec,fts)  ·  **3.** `2026-08-28.md` (0.45, vec,fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.76, vec,fts)  ·  **2.** `llama.cpp Model Management.md` (0.73, vec,fts)  ·  **3.** `2026-08-21.md` (0.70, vec,fts)

## 31. im on the mac and github push hangs — remind me what broke DNS and how i log in anyway  —  *K long multi-intent prose*

- **Qwen3-0.6B**: **1.** `box.md` (0.58, vec,fts)  ·  **2.** `2026-08-28.md` (0.58, vec,fts)  ·  **3.** `Links.md` (0.55, vec,fts)
- **EmbeddingGemma-300M**: **1.** `box.md` (0.52, vec,fts)  ·  **2.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.48, vec,fts)  ·  **3.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.46, vec,fts)
- **bge-small-en**: **1.** `box.md` (0.72, vec,fts)  ·  **2.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.66, vec,fts)  ·  **3.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.67, vec,fts)

## 32. the wiki mcp port is taken again — what do i check before killing anything  —  *K long multi-intent prose*

- **Qwen3-0.6B**: **1.** `memory.md` (0.62, vec,fts)  ·  **2.** `box.md` (0.58, vec,fts)  ·  **3.** `2026-08-28.md` (0.58, vec,fts)
- **EmbeddingGemma-300M**: **1.** `box.md` (0.57, vec,fts)  ·  **2.** `2026-08-28.md` (0.50, vec,fts)  ·  **3.** `2026-08-28.md` (0.47, vec,fts)
- **bge-small-en**: **1.** `box.md` (0.77, vec,fts)  ·  **2.** `2026-08-28.md` (0.75, vec,fts)  ·  **3.** `2026-08-28.md` (0.72, vec,fts)

## 33. reindex is slow, was it fast before and why  —  *K long multi-intent prose*

- **Qwen3-0.6B**: **1.** `2026-08-29.md` (0.62, vec,fts)  ·  **2.** `openclaw-memory-management.md` (0.49, vec,fts)  ·  **3.** `How to Get Started with darktable, 2026 Edition.md` (0.47, vec,fts)
- **EmbeddingGemma-300M**: **1.** `2026-08-29.md` (0.57, vec,fts)  ·  **2.** `turboquant-installation.md` (0.42, vec,fts)  ·  **3.** `yazi-summary.md` (0.38, vec,fts)
- **bge-small-en**: **1.** `2026-08-29.md` (0.74, vec,fts)  ·  **2.** `memory.md` (0.64, vec,fts)  ·  **3.** `yazi-summary.md` (16.69, fts)

## 34. Q4_K_M  —  *L substring / token fragment*

- **Qwen3-0.6B**: **1.** `memory.md` (0.58, vec,fts)  ·  **2.** `2026-08-21.md` (0.51, vec,fts)  ·  **3.** `llama-cpp - LLM models configurations.md` (4.87, fts)
- **EmbeddingGemma-300M**: **1.** `llama-cpp - LLM models configurations.md` (0.42, vec,fts)  ·  **2.** `memory.md` (0.37, vec,fts)  ·  **3.** `turboquant-installation.md` (0.41, vec,fts)
- **bge-small-en**: **1.** `memory.md` (0.72, vec,fts)  ·  **2.** `2026-08-21.md` (0.70, vec,fts)  ·  **3.** `Mastering llama.cpp A Comprehensive Guide to Local LLM Integration.md` (0.70, vec,fts)

## 35. 100.64.0.0/10  —  *L substring / token fragment*

- **Qwen3-0.6B**: **1.** `ssh-wsl2-pi-box.md` (15.35, fts)  ·  **2.** `box.md` (12.18, fts)  ·  **3.** `ssh.md` (11.99, fts)
- **EmbeddingGemma-300M**: **1.** `ssh-wsl2-pi-box.md` (0.34, vec,fts)  ·  **2.** `ssh.md` (0.30, vec,fts)  ·  **3.** `box.md` (0.28, vec,fts)
- **bge-small-en**: **1.** `ssh-wsl2-pi-box.md` (17.36, fts)  ·  **2.** `ssh-wsl2-pi-box.md` (12.01, fts)  ·  **3.** `box.md` (11.96, fts)

## 36. 椒麻  —  *L substring / token fragment*

- **Qwen3-0.6B**: **1.** `椒麻雞 Sichuan Style Chicken and spicy sweet and sour sauce.md` (0.69, vec)  ·  **2.** `Mulberry Jam Recipe.md` (0.55, vec)  ·  **3.** `Instant Pot 爌肉.md` (0.50, vec)
- **EmbeddingGemma-300M**: **1.** `Instant Pot 滷腿庫.md` (0.56, vec)  ·  **2.** `高壓鍋燉牛肉.md` (0.56, vec)  ·  **3.** `Instant Pot 爌肉.md` (0.56, vec)
- **bge-small-en**: **1.** `Instant Pot 滷腿庫.md` (0.88, vec)  ·  **2.** `高壓鍋燉牛肉.md` (0.88, vec)  ·  **3.** `Instant Pot 爌肉.md` (0.88, vec)

## 37. which firewall rule name admits tailnet ssh  —  *M question-form entity attr*

- **Qwen3-0.6B**: **1.** `llms.md` (0.61, vec,fts)  ·  **2.** `ssh-wsl2-pi-box.md` (0.59, vec,fts)  ·  **3.** `2026-08-24.md` (0.56, vec,fts)
- **EmbeddingGemma-300M**: **1.** `ssh.md` (0.55, vec,fts)  ·  **2.** `ssh-wsl2-pi-box.md` (0.53, vec,fts)  ·  **3.** `2026-08-24.md` (0.50, vec,fts)
- **bge-small-en**: **1.** `ssh-wsl2-pi-box.md` (0.84, vec,fts)  ·  **2.** `llms.md` (0.78, vec,fts)  ·  **3.** `ssh-wsl2-pi-box.md` (0.75, vec,fts)

## 38. which model quant is the local chat model  —  *M question-form entity attr*

- **Qwen3-0.6B**: **1.** `llama.cpp Model Management.md` (0.75, vec,fts)  ·  **2.** `Mastering llama.cpp A Comprehensive Guide to Local LLM Integration.md` (0.65, vec,fts)  ·  **3.** `Qwen3.8-27B Thinking Control.md` (0.62, vec,fts)
- **EmbeddingGemma-300M**: **1.** `llama.cpp Model Management.md` (0.56, vec,fts)  ·  **2.** `2026-04-02.md` (0.50, vec,fts)  ·  **3.** `Qwen3.8-27B Thinking Control.md` (0.42, vec,fts)
- **bge-small-en**: **1.** `2026-08-28.md` (0.76, vec,fts)  ·  **2.** `llama.cpp Model Management.md` (0.73, vec,fts)  ·  **3.** `Mastering llama.cpp A Comprehensive Guide to Local LLM Integration.md` (0.75, vec,fts)

## 39. what is the git email identity  —  *M question-form entity attr*

- **Qwen3-0.6B**: **1.** `Areas.md` (0.44, vec,fts)  ·  **2.** `yazi-summary.md` (0.47, vec,fts)  ·  **3.** `openclaw-memory-management.md` (0.45, vec,fts)
- **EmbeddingGemma-300M**: **1.** `box.md` (0.44, vec,fts)  ·  **2.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.43, vec,fts)  ·  **3.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.43, vec,fts)
- **bge-small-en**: **1.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.73, vec,fts)  ·  **2.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.75, vec,fts)  ·  **3.** `GitHub + Obsidian in WSL2 — Step-by-Step Guide.md` (0.72, vec,fts)

## Summary

| | Qwen3-0.6B | EmbeddingGemma-300M | bge-small-en-v1.5 |
|---|---|---|---|
| Top-2 correct | ~31/34 | ~31/34 | ~27/34 |
| CJK queries (2) | 2/2 | 1/2 | 0/2 |
| Index (935 chunks) | 282 s | 80 s | 41 s |
| Query latency (avg) | 37 ms | 12 ms | 5 ms |

Near-tie on English — the FTS lane carries exact/identifier matches regardless of model.
The differentiators are CJK recall (Qwen3 only), one pitfall-note case (Gemma), and index speed (bge 10×).
