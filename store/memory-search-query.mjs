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
  // tie-break: more lanes first (dual-lane beats single), then FTS presence —
  // exact rank ties are weak evidence, and a lexical match is more specific
  // than a centroid-adjacent vec hit (stable sort otherwise favors the vec lane,
  // which is inserted first).
  return [...byId.values()].sort((a, b) =>
    b.score - a.score || b.lanes.length - a.lanes.length || (b.lanes.includes(1) - a.lanes.includes(1))
  ).slice(0, limit);
}
