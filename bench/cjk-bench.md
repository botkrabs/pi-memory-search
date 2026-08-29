# Benchmark — pure-CJK

22 grounded queries (fragments, entity-attribute, semantic paraphrase, recipe disambiguation,
multi-hop, negative control) against a 2,147-chunk Chinese corpus: 130 zh-Wikipedia articles
(sampled from a 2026-07 full-ZIM snapshot) + 10 recipe/note files + the agent memory lane.
Two models, identical chunker and pipeline. 2026-08-29.

Doc names are basenames only — directory paths removed to keep the corpus private.
Scores > 1 are BM25 (FTS lane); 0–1 are cosine (vector lane).

**Result: Qwen3 17/18 correct rank-1 · Gemma 12/18.** Qwen3 wins every hard query
(fragments with same-language distractors, paraphrase, same-domain recipe disambiguation,
dual-entity multi-hop); the two tie on exact terms and FTS-anchored queries.

| | Qwen3-0.6B | EmbeddingGemma-300M |
|---|---|---|
| Correct rank-1 | **17 / 18** | 12 / 18 |
| Query latency | 40 ms | 15 ms |
| CJK index speed | 1.76 s/ch | 0.41 s/ch (4.3× faster) |

Note: EmbeddingGemma's 2048-token native context overflows long CJK chunks (a 3,200-char chunk
crashed it; CJK tokenizes denser than English). The bench applied a 1,800-char embed truncation to
both models for parity. Qwen3's 32K native context never overflows.

## 1. 勒热纳  —  *F fragment*

- **Qwen3-0.6B**: **1.** `狄利克雷.md` (8.50, fts)  ·  **2.** `狄利克雷.md` (7.59, fts)  ·  **3.** `狄利克雷.md` (7.34, fts)
- **EmbeddingGemma-300M**: **1.** `狄利克雷.md` (0.25, vec,fts)  ·  **2.** `狄利克雷.md` (8.50, fts)  ·  **3.** `狄利克雷.md` (7.34, fts)

## 2. 宗矩  —  *F fragment*

- **Qwen3-0.6B**: **1.** `尊经.md` (0.62, vec)  ·  **2.** `柳生宗章.md` (0.59, vec)  ·  **3.** `周道治.md` (0.59, vec)
- **EmbeddingGemma-300M**: **1.** `尊经.md` (0.65, vec)  ·  **2.** `柳生宗章.md` (0.64, vec)  ·  **3.** `广义正交定理.md` (0.58, vec)

## 3. 豪达  —  *F fragment*

- **Qwen3-0.6B**: **1.** `荷式鬆餅.md` (6.47, fts)  ·  **2.** `焦亚德尔科莱.md` (0.64, vec)  ·  **3.** `焦亚德尔科莱.md` (0.62, vec)
- **EmbeddingGemma-300M**: **1.** `荷式鬆餅.md` (6.47, fts)  ·  **2.** `南刚武.md` (0.54, vec)  ·  **3.** `周甫敬.md` (0.54, vec)

## 4. 火山口湖  —  *F fragment*

- **Qwen3-0.6B**: **1.** `查拉湖.md` (0.61, vec,fts)  ·  **2.** `查拉湖.md` (9.18, fts)  ·  **3.** `查拉湖.md` (0.74, vec)
- **EmbeddingGemma-300M**: **1.** `查拉湖.md` (0.28, vec,fts)  ·  **2.** `查拉湖.md` (0.27, vec,fts)  ·  **3.** `查拉湖.md` (0.57, vec)

## 5. 化工厂  —  *F fragment*

- **Qwen3-0.6B**: **1.** `2010南京化工厂爆炸事件.md` (0.60, vec)  ·  **2.** `溴化砈.md` (0.53, vec)  ·  **3.** `路環市政街市.md` (0.52, vec)
- **EmbeddingGemma-300M**: **1.** `丙酸乙酯.md` (0.56, vec)  ·  **2.** `溴化砈.md` (0.56, vec)  ·  **3.** `跨產業.md` (0.52, vec)

## 6. 狄利克雷出生在哪里  —  *Q entity-attr*

- **Qwen3-0.6B**: **1.** `狄利克雷.md` (0.79, vec)  ·  **2.** `狄利克雷.md` (0.70, vec)  ·  **3.** `狄利克雷.md` (0.69, vec)
- **EmbeddingGemma-300M**: **1.** `狄利克雷.md` (0.70, vec)  ·  **2.** `狄利克雷.md` (0.58, vec)  ·  **3.** `焦亚德尔科莱.md` (0.47, vec)

## 7. 柳生宗章是谁的弟弟  —  *Q entity-attr*

- **Qwen3-0.6B**: **1.** `柳生宗章.md` (0.80, vec)  ·  **2.** `柳生宗章.md` (0.72, vec)  ·  **3.** `张济 (司空).md` (0.49, vec)
- **EmbeddingGemma-300M**: **1.** `柳生宗章.md` (0.71, vec)  ·  **2.** `Category:清朝龍游縣知縣.md` (0.49, vec)  ·  **3.** `张济 (司空).md` (0.48, vec)

## 8. 荷式松饼最早出现在哪里  —  *Q entity-attr*

- **Qwen3-0.6B**: **1.** `荷式鬆餅.md` (0.77, vec)  ·  **2.** `荷式鬆餅.md` (0.74, vec)  ·  **3.** `荷式鬆餅.md` (0.73, vec)
- **EmbeddingGemma-300M**: **1.** `荷式鬆餅.md` (0.51, vec)  ·  **2.** `荷式鬆餅.md` (0.37, vec)  ·  **3.** `荷式鬆餅.md` (0.37, vec)

## 9. 查拉湖跨哪两个国家  —  *Q entity-attr*

- **Qwen3-0.6B**: **1.** `查拉湖.md` (0.83, vec)  ·  **2.** `查拉湖.md` (0.73, vec)  ·  **3.** `查拉湖.md` (0.71, vec)
- **EmbeddingGemma-300M**: **1.** `查拉湖.md` (0.69, vec)  ·  **2.** `斯托蒙特邓达斯和格伦加里联合县.md` (0.32, vec)  ·  **3.** `維克多·辛特斯.md` (0.30, vec)

## 10. 2010年南京化工厂爆炸是几月几日  —  *Q entity-attr*

- **Qwen3-0.6B**: **1.** `2010南京化工厂爆炸事件.md` (0.72, vec,fts)  ·  **2.** `2010南京化工厂爆炸事件.md` (0.64, vec,fts)  ·  **3.** `2010南京化工厂爆炸事件.md` (0.73, vec,fts)
- **EmbeddingGemma-300M**: **1.** `2010南京化工厂爆炸事件.md` (0.53, vec,fts)  ·  **2.** `2010南京化工厂爆炸事件.md` (0.44, vec,fts)  ·  **3.** `2010南京化工厂爆炸事件.md` (0.39, vec,fts)

## 11. 两片薄脆饼夹麦芽糖浆的荷兰点心  —  *S semantic*

- **Qwen3-0.6B**: **1.** `荷式鬆餅.md` (0.70, vec)  ·  **2.** `荷式鬆餅.md` (0.68, vec)  ·  **3.** `荷式鬆餅.md` (0.58, vec)
- **EmbeddingGemma-300M**: **1.** `荷式鬆餅.md` (0.56, vec)  ·  **2.** `荷式鬆餅.md` (0.53, vec)  ·  **3.** `荷式鬆餅.md` (0.47, vec)

## 12. 安土桃山时代在关原之战护卫小早川秀秋的剑豪  —  *S semantic*

- **Qwen3-0.6B**: **1.** `柳生宗章.md` (0.56, vec)  ·  **2.** `柳生宗章.md` (0.54, vec)  ·  **3.** `大蔵政務次官.md` (0.48, vec)
- **EmbeddingGemma-300M**: **1.** `蒲剑臣.md` (0.26, vec)  ·  **2.** `徐光 (1960年).md` (0.24, vec)  ·  **3.** `沒有神的星期天.md` (0.24, vec)

## 13. 坦桑尼亚与肯尼亚交界的湖泊  —  *S semantic*

- **Qwen3-0.6B**: **1.** `查拉湖.md` (0.71, vec)  ·  **2.** `查拉湖.md` (0.63, vec)  ·  **3.** `查拉湖.md` (0.63, vec)
- **EmbeddingGemma-300M**: **1.** `查拉湖.md` (0.58, vec)  ·  **2.** `查拉湖.md` (0.49, vec)  ·  **3.** `查拉湖.md` (0.35, vec)

## 14. 利用剩下面团和糖浆发明的点心  —  *S semantic*

- **Qwen3-0.6B**: **1.** `荷式鬆餅.md` (0.53, vec)  ·  **2.** `Instant Pot 爌肉.md` (0.48, vec)  ·  **3.** `荷式鬆餅.md` (0.47, vec)
- **EmbeddingGemma-300M**: **1.** `荷式鬆餅.md` (0.41, vec)  ·  **2.** `荷式鬆餅.md` (0.33, vec)  ·  **3.** `荷式鬆餅.md` (0.32, vec)

## 15. 咸酥鸡第二次高温快炸用什么温度  —  *R recipe*

- **Qwen3-0.6B**: **1.** `orange-chicken.md` (0.62, vec)  ·  **2.** `鹹酥雞.md` (0.60, vec)  ·  **3.** `orange-chicken.md` (0.54, vec)
- **EmbeddingGemma-300M**: **1.** `orange-chicken.md` (0.49, vec)  ·  **2.** `鹹酥雞.md` (0.43, vec)  ·  **3.** `orange-chicken.md` (0.39, vec)

## 16. 高压锅炖牛肉高压煮多久  —  *R recipe*

- **Qwen3-0.6B**: **1.** `高壓鍋燉牛肉.md` (0.72, vec)  ·  **2.** `高壓鍋燉牛肉.md` (0.67, vec)  ·  **3.** `高壓鍋燉牛肉.md` (0.66, vec)
- **EmbeddingGemma-300M**: **1.** `Instant Pot 爌肉.md` (0.65, vec)  ·  **2.** `Instant Pot 滷腿庫.md` (0.64, vec)  ·  **3.** `高壓鍋燉牛肉.md` (0.64, vec)

## 17. 地瓜粉裹好后要静置反潮是为什么  —  *R recipe*

- **Qwen3-0.6B**: **1.** `orange-chicken.md` (0.54, vec)  ·  **2.** `orange-chicken.md` (0.50, vec)  ·  **3.** `Instant Pot 滷腿庫.md` (0.45, vec)
- **EmbeddingGemma-300M**: **1.** `orange-chicken.md` (0.44, vec)  ·  **2.** `Instant Pot 滷腿庫.md` (0.36, vec)  ·  **3.** `orange-chicken.md` (0.35, vec)

## 18. 炖牛肉用哪种牛肉比较好  —  *R recipe*

- **Qwen3-0.6B**: **1.** `高壓鍋燉牛肉.md` (0.68, vec)  ·  **2.** `高壓鍋燉牛肉.md` (0.58, vec)  ·  **3.** `高壓鍋燉牛肉.md` (0.58, vec)
- **EmbeddingGemma-300M**: **1.** `高壓鍋燉牛肉.md` (0.68, vec)  ·  **2.** `高壓鍋燉牛肉.md` (0.54, vec)  ·  **3.** `Instant Pot 滷腿庫.md` (0.53, vec)

## 19. 椒麻  —  *M memory anchor*

- **Qwen3-0.6B**: **1.** `2026-08-29.md` (9.68, fts)  ·  **2.** `Chenières.md` (0.55, vec)  ·  **3.** `Charnizay.md` (0.54, vec)
- **EmbeddingGemma-300M**: **1.** `2026-08-29.md` (9.68, fts)  ·  **2.** `庚齐啶.md` (0.56, vec)  ·  **3.** `orange-chicken.md` (0.56, vec)

## 20. 椒麻鸡  —  *M memory anchor*

- **Qwen3-0.6B**: **1.** `orange-chicken.md` (0.58, vec)  ·  **2.** `orange-chicken.md` (0.57, vec)  ·  **3.** `orange-chicken.md` (0.55, vec)
- **EmbeddingGemma-300M**: **1.** `庚齐啶.md` (0.54, vec)  ·  **2.** `粘毛黄芩.md` (0.53, vec)  ·  **3.** `orange-chicken.md` (0.52, vec)

## 21. 狄利克雷和柳生宗章各是什么时代的人  —  *X multi-hop*

- **Qwen3-0.6B**: **1.** `柳生宗章.md` (0.74, vec)  ·  **2.** `狄利克雷.md` (0.69, vec)  ·  **3.** `狄利克雷.md` (0.64, vec)
- **EmbeddingGemma-300M**: **1.** `Category:明朝少傅.md` (0.45, vec)  ·  **2.** `Category:左云县人.md` (0.42, vec)  ·  **3.** `狄利克雷.md` (0.41, vec)

## 22. 台北捷运单程票价多少  —  *N negative control*

- **Qwen3-0.6B**: **1.** `文化中心站 (高雄市).md` (0.53, vec)  ·  **2.** `文化中心站 (高雄市).md` (0.47, vec)  ·  **3.** `文化中心站 (高雄市).md` (0.45, vec)
- **EmbeddingGemma-300M**: **1.** `文化中心站 (高雄市).md` (0.38, vec)  ·  **2.** `文化中心站 (高雄市).md` (0.36, vec)  ·  **3.** `文化中心站 (高雄市).md` (0.35, vec)

---

## Bench v2 (2026-08-29, after trigram lane + GPU index)

80 queries = the 22 above (re-run, unchanged) + 58 new gap categories grounded in zh-wiki
articles: temporal (12), fact/number (8), multi-hop (10), simplified↔traditional script (6),
mixed CN+EN (6), preference (4), world-knowledge (4), adversarial/unanswerable (8).
Queries: [cjk-v2-queries.json](cjk-v2-queries.json); 1× per-query results:
[cjk-v2-results-1x.json](cjk-v2-results-1x.json).

### Scale decay (rank-1 / top-2 file match over the 58 targeted queries)

| scale | chunks | rank-1 | top-2 |
|---|---|---|---|
| 1× | 3,759 | 52/58 (90%) | 54/58 (93%) |
| 3× | 7,247 | 52/58 (90%) | 54/58 (93%) |
| 5× | 11,263 | 50/58 (86%) | 53/58 (92%) |

Nearly flat to 3×; the 5× slips are short-phrase preference queries and all recover at
top-2. Temporal (12/12), fact (8/8), mixed-script (6/6), multi-hop (8/10) are
scale-invariant. Index speed (GPU): 3.7k chunks ≈ 5 min, 11.3k ≈ 11 min.

### 1× per-set detail

| set | n | rank-1 | top-2 | answer in top-3 |
|---|---|---|---|---|
| temporal | 12 | 12 | 12 | 10 |
| fact/number | 8 | 8 | 8 | 5 |
| multi-hop | 10 | 8 | 8 | 9 |
| mixed script | 6 | 6 | 6 | 5 |
| script variant | 6 | 5 | 6 | 4 |
| world-knowledge | 4 | 3 | 3 | 0 (answers not in corpus, by design) |
| preference | 4 | 2 | 3 | — |
| adversarial | 8 | 8 | 8 | — (see below) |

### Findings

1. **v1 consistency**: every v1 rank-1 survived the v2 corpus; one v1 top-2 promoted to
   rank-1. The trigram lane + GPU index changed no v1 ranking.
2. **Adversarial gap**: all 8 unanswerable queries (absent fact or false premise) return
   the correct entity's article at rank-1, scores 0.69–0.86. Entity grounding is perfect;
   rejection is zero — a known backlog item (absent-topic signal).
3. **Chunk granularity**: file-level retrieval ~90% vs answer-in-top-3 ~75%. Most
   answer misses are the right file at rank-1 with the value in a chunk beyond top-3
   (infoboxes, recipe steps).
4. **Script variants**: simplified queries resolve to traditional-titled articles and
   vice versa; one query ties both script variants at top-2 with equal scores.
