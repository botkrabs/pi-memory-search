#!/bin/bash
# Full verification pass: store integrity counts + probe queries (args, or built-in defaults).
# Waits for a running `tools/index-now.mjs` if any.
# Usage: [nohup] store/tools/verify.sh [probe-query ...]
set -u
cd "$(dirname "$0")"
PKG_ROOT=$(cd ../.. && pwd)   # package root (two up from store/tools/)
while pgrep -f "store/tools/index-now.mjs" >/dev/null 2>&1; do sleep 60; done
sleep 5
SO=$(ls "$PKG_ROOT/node_modules"/sqlite-vec-*/vec0.so 2>/dev/null | head -1)
QUERIES=("$@")
[ ${#QUERIES[@]} -eq 0 ] && QUERIES=("how do I ssh into the box" "git identity email" "port map")
{
  if [ -n "${SO:-}" ] && command -v sqlite3 >/dev/null 2>&1 && command -v python3 >/dev/null 2>&1; then
    SO="$SO" PKG_DIR="$PKG_ROOT" python3 <<'PYEOF'
import os, sqlite3, sys
dbpath = os.path.join(os.path.expanduser("~"), ".pi", "agent", "memory-store", "memory.sqlite")
if not os.path.exists(dbpath):
    print("db not created yet"); sys.exit(0)
db = sqlite3.connect(f"file:{dbpath}?mode=ro", uri=True)
db.enable_load_extension(True)
db.load_extension(os.environ["SO"])
print("chunks", db.execute("SELECT COUNT(*) FROM chunks").fetchone()[0],
      "| vec", db.execute("SELECT COUNT(*) FROM chunks_vec").fetchone()[0],
      "| files", db.execute("SELECT COUNT(*) FROM files").fetchone()[0])
print(db.execute("SELECT source, COUNT(*) FROM chunks GROUP BY source ORDER BY 2 DESC").fetchall())
print("db size: %.0f MB" % (os.path.getsize(dbpath) / 1e6))
PYEOF
  else
    echo "(sqlite3/python3 or vec .so not found — skipping integrity counts)"
  fi
  echo
  node "$PKG_ROOT/store/tools/probe.mjs" "${QUERIES[@]}"
  echo
  echo "VERIFY DONE"
} 2>&1
