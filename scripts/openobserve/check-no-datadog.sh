#!/usr/bin/env bash
# Zero-Datadog gate (doc 08 §5) for the RN fork. Fails if anything that SHIPS in a published
# npm package carries an upstream identity — in its PATH, its CONTENT, or its package METADATA.
#
# RN had no gate at all while Android and iOS both did, which is how these reached the tree:
#   - `datadog-generate-sr-assets`, the `bin` of a PUBLISHED package: consumers got a
#     datadog-* executable on their PATH.
#   - `datadog-{configuration,sourcemaps}.gradle`: PUBLIC integration points consumers paste
#     into their own build.gradle.
#   - 184 files under com/datadog/reactnative/**: the bridge's Java package, shipped in the
#     tarball, while every file's CONTENT was already clean.
# Content-only checks miss all three. Paths and metadata are checked here too.
#
# Apache-2.0 §4 attribution is NOT touched: the per-file "developed at Datadog" headers, the
# copyright lines, NOTICE and LICENSE are retained deliberately and verified by
# check-attribution.mjs.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

FAIL=0

# What actually ships: every non-private workspace package. Derived from package.json rather
# than a hardcoded glob — a gate that misses a published package is worse than no gate,
# because it reports PASS. (The iOS gate globbed 'OpenObserve*/Sources/*' and silently skipped
# the published TestUtilities pod for exactly this reason.)
PKG_DIRS=$(for f in packages/*/package.json; do
  node -e "const d=require('./$f'); if(!d.private) console.log('$(dirname "$f")')" 2>/dev/null || true
done)
[ -n "$PKG_DIRS" ] || { echo "no publishable packages found?"; exit 1; }

PATHS=$(for d in $PKG_DIRS; do
  git ls-files "$d" | grep -vE '(^|/)(node_modules|lib|dist|build|Pods|__snapshots__)/' || true
done)

# --- 1. PATHS -----------------------------------------------------------------
# npm packs the directory tree, so an upstream-named dir/file ships even when every
# file's content is clean.
PATH_HITS=$(echo "$PATHS" | grep -iE '(^|/|\.)datadog' || true)
if [ -n "$PATH_HITS" ]; then
  echo "ZERO-DATADOG GATE FAILED — upstream-named PATH inside a published package:"
  echo "$PATH_HITS" | head -30; echo "total: $(echo "$PATH_HITS" | wc -l | tr -d ' ')"
  FAIL=1
fi

# --- 2. PUBLISHED METADATA ----------------------------------------------------
# `bin` names land on the consumer's PATH; `name`/`main`/`files` are what npm resolves.
META_HITS=""
for d in $PKG_DIRS; do
  h=$(node -e "
const d=require('./$d/package.json');
const probe=JSON.stringify({name:d.name,bin:d.bin,main:d.main,module:d.module,types:d.types,files:d.files});
const m=probe.match(/[^\"]*[Dd]atadog[^\"]*/g);
if(m) console.log('$d/package.json: '+[...new Set(m)].join(' '));
" 2>/dev/null || true)
  [ -n "$h" ] && META_HITS="$META_HITS$h\n"
done
if [ -n "$META_HITS" ]; then
  echo "ZERO-DATADOG GATE FAILED — upstream identity in PUBLISHED package metadata:"
  printf "%b" "$META_HITS" | head -20
  FAIL=1
fi

# --- 3. CONTENT ---------------------------------------------------------------
# `\bdd=s:|\bdd=p:|datadog\.pool` / `datadog\.<label>\.<tld>` catch HOSTNAMES: every other pattern needs an
# uppercase letter or the `hq` suffix, so a bare lowercase hostname label matches none of
# them — which is how the upstream NTP pool shipped in the native alpha1s.
# `@datadog/datadog-ci` is EXTERNAL and legitimately referenced (dev workspaces only).
HITS=$(echo "$PATHS" | xargs grep -nE \
  'com\.datadog|com/datadog|com\.datadoghq|\bDatadog[A-Za-z]|\bDATADOG|datad0g|ddog-gov|\bddtags\b|\bddsource\b|DD-API-KEY|\bdd=s:|\bdd=p:|datadog\.pool|datadog\.[a-z]+\.(org|com|net)|datadog-(configuration|sourcemaps|generate)' \
  2>/dev/null \
  | grep -viE 'developed at Datadog|Copyright .*Datadog|licensed under|@datadog/datadog-ci' || true)
if [ -n "$HITS" ]; then
  echo "ZERO-DATADOG GATE FAILED — upstream token in shipped package CONTENT:"
  echo "$HITS" | head -30; echo "total: $(echo "$HITS" | wc -l | tr -d ' ')"
  FAIL=1
fi

[ "$FAIL" = "0" ] || exit 1
echo "zero-Datadog gate: PASS (shipped npm packages clean — paths + metadata + content)"
