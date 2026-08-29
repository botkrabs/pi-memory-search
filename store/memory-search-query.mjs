// memory-search-query — pure query-side functions for the hybrid
// (FTS + vector + RRF + cosine) search. No I/O, no deps: unit-testable.
//
// Lane design (from the 2026-08-28 benchmark):
// - vector lane: KNN pool (raw L2) -> cosine re-rank (fixes
//   centroid-gravity: short/boilerplate chunks winning on L2)
// - FTS lane: OR of quoted terms, bm25-ranked (fixes bare proper nouns
//   and exact identifiers the vector lane drops; CJK = exact-match only
//   because the table uses the default unicode61 tokenizer)
// - RRF merge: rank-only, k=60 (classic constant)
export function ftsQueryFromText(text, maxTerms = 12) {
  const tokens = String(text)
    .toLowerCase()
    .match(/[a-z0-9_]+|[\u3400-\u4dbf\u4e00-\u9fff]+/g);
  if (!tokens || !tokens.length) return null;
  const terms = [...new Set(tokens)].slice(0, maxTerms)
    .map((t) => `"${t.replace(/"/g, '""')}"`)
    .join(" OR ");
  return terms;
}

// A path is excluded if it is, or lives under, an exclude entry.
// (Pi's store records absolute paths, so plain prefix matching suffices.)
export function isExcluded(pathRaw, excludes) {
  const p = String(pathRaw);
  for (const eRaw of excludes ?? []) {
    const e = String(eRaw).replace(/\/+$/, "");
    if (e && (p === e || p.startsWith(e + "/"))) return true;
  }
  return false;
}

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

// rrfMerge: lists = [[{id, meta}...], ...] each already ranked (rank = index+1)
// returns [{id, meta, score, lanes:[laneIdx,...]}] sorted desc, capped.
export function rrfMerge(lists, k = 60, limit = 25) {
  const byId = new Map();
  lists.forEach((lane, li) => {
    lane.forEach((row, idx) => {
      const s = 1 / (k + idx + 1);
      const ex = byId.get(row.id);
      if (ex) { ex.score += s; if (!ex.lanes.includes(li)) ex.lanes.push(li); }
      else byId.set(row.id, { id: row.id, meta: row.meta, score: s, lanes: [li] });
    });
  });
  // tie-break: more lanes first (multi-lane beats single), then lane
  // specificity — substring (lane 2) > token FTS (lane 1) > vec (lane 0):
  // exact rank ties are weak evidence, and the more specific the lexical
  // match, the better (stable sort otherwise favors the vec lane, which is
  // inserted first).
  const spec = (l) => (l.includes(2) ? 2 : l.includes(1) ? 1 : 0);
  return [...byId.values()].sort((a, b) =>
    b.score - a.score || b.lanes.length - a.lanes.length || spec(b.lanes) - spec(a.lanes)
  ).slice(0, limit);
}

// Longest CJK runs (>= min chars) in a query, de-duped — for the trigram
// substring lane. unicode61 treats a CJK run as ONE token, so fragments of
// longer runs (宗矩 of 柳生宗矩) are invisible to the FTS lane; trigram LIKE
// catches them. EN is deliberately excluded (word-boundary semantics of lane 1
// are better there; substring EN is noise-prone: kill ⊂ skill/killed).
export function cjkRuns(text, min = 2, maxRuns = 8) {
  const m = String(text).match(/[\u3400-\u4dbf\u4e00-\u9fff]{2,}/g);
  if (!m) return [];
  return [...new Set(m.filter((r) => r.length >= min))].slice(0, maxRuns);
}

// ---------- coverage (absent-topic signal, 2026-08-29) ----------
// Bench v2 showed unanswerable queries return the correct entity's article at
// HIGH confidence (0.69-0.86 — indistinguishable from good hits), so no score
// threshold can reject them. What IS separable: whether the query's terms
// beyond the entity exist in the top hits at all. This computes that, as an
// informational field — it never changes ranking.
// CJK: interrogatives are stripped from contiguous runs (是什么 fuses onto the
// entity), then each run "counts as found" if the full run OR any 2-char
// sub-run appears in the text (infoboxes say 出生|1582年, queries say 出生于).
// EN: non-stopword tokens, whole-token substring (identifiers stay intact).
const CJK_STRIP = /叫什么名字|叫什么|是什么|是啥|是谁|是哪|哪位|哪个|哪一|哪里|何时|几时|多少|怎么|怎样|如何|为什么|为啥|请问|一下|吗|呢|吧|啊|嘛|的|了|过|在|和|跟|与|或|被|把|从|到|有|一|个|是/g;
const EN_STOP = new Set(["what","whats","which","who","whos","when","where","why","how","many","much","does","do","did","didn","is","are","was","were","the","and","for","with","that","this","from","have","has","had","about","into","onto","using","used","uses","use","their","your","my","our","not","but","can","could","would","should","run","runs","cover","covers","covering","associated","employ","employs","drives","drive","driven","lives","live","driving","works","work","running","cover"]);
function cjkSlices(run) {
  if (run.length <= 2) return [run];
  const out = [run];
  for (let i = 0; i + 2 <= run.length; i++) out.push(run.slice(i, i + 2));
  return [...new Set(out)];
}
export function coverageOf(query, texts) {
  const hay = texts.join("\n").toLowerCase();
  const found = [];
  const missing = [];
  const seen = new Set();
  // Same-script guard: term absence is only evidence of absence when the hits
  // are in the same script as the query's terms. A CJK query over an English
  // page that is clearly about the right thing (vec lane translated it) must
  // not warn. Script-independent tokens (llama.cpp, ComfyUI) are always checked.
  const hasCJK = /[\u3400-\u4dbf\u4e00-\u9fff]/.test(hay);
  // CJK runs — the interrogative strip must INSERT a separator, not delete:
  // deleting fuses entity+question into one run (小早川秀秋+血型), and the
  // entity's 2-char slices then satisfy the whole run, killing the signal.
  for (const raw of hasCJK ? cjkRuns(query.replace(CJK_STRIP, "◇")) : []) {
    const run = raw.replace(/◇/g, "");
    if (run.length < 2 || seen.has(run)) continue;
    seen.add(run);
    (cjkSlices(run).some((s) => hay.includes(s)) ? found : missing).push(run);
  }
  // EN tokens (singular fallback: engines → engine)
  for (const tok of String(query).toLowerCase().match(/[a-z0-9_./:-]{3,}/g) ?? []) {
    if (EN_STOP.has(tok) || seen.has(tok)) continue;
    seen.add(tok);
    (hay.includes(tok) || hay.includes(tok.replace(/s$/, "")) ? found : missing).push(tok);
  }
  return { found, missing };
}
