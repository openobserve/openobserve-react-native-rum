#!/usr/bin/env bash
#
# OpenObserve openobserve-react-native-rum upstream sync.
#
# Rebuilds the OpenObserve `openobserve` branch from a pristine upstream
# (DataDog/dd-sdk-reactnative) commit:
#
#   1. checks out the upstream commit on a new sync branch
#   2. restores fork-owned files from the openobserve branch (keep-ours.txt)
#   3. runs the rebrand codemod (rename-map.json): @datadog->@openobserve,
#      Dd*->O2*, _dd->_o2, repo identity
#   4. re-applies the functional patch series in patches/ (native endpoint
#      injection, HTTPS guard, auth) onto the rebranded tree
#   5. records the new upstream base
#
# Unlike the rum-events-format schema fork, this repo HAS a functional patch
# series (native-bridge behavior cannot be expressed as a codemod), so step 4
# re-applies patches/*.patch in order.
#
# Usage:
#   scripts/openobserve/sync-upstream.sh [<commit-ish>]
#
#   <commit-ish>   Upstream commit/ref to sync to (full SHA or upstream/develop).
#                  When omitted, the tip of the upstream default branch is used.
#   UPSTREAM_REMOTE (default: upstream), BASE_BRANCH (default: openobserve)
#   SKIP_INSTALL=1   Skip `yarn install` (rebrand + patch only; faster dry run).
#
# Exit codes: 0 success (or already up to date), 1 usage/precondition error,
#             2 patch series failed to apply (manual rebase of patches needed).
set -euo pipefail

UPSTREAM_REMOTE=${UPSTREAM_REMOTE:-upstream}
BASE_BRANCH=${BASE_BRANCH:-openobserve}
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [ -n "$(git status --porcelain -uno)" ]; then
  echo "error: working tree has uncommitted changes to tracked files" >&2
  exit 1
fi

git fetch "$UPSTREAM_REMOTE" --prune --tags --quiet
git fetch origin "$BASE_BRANCH" --quiet 2>/dev/null || true

# The tooling lives on the openobserve branch, but the working tree is about to
# become the upstream commit. Work from a temp copy so the script and its data
# files (and the patch series) survive the checkout.
TOOLING=$(mktemp -d)
trap 'rm -rf "$TOOLING"' EXIT
git show "$BASE_BRANCH:scripts/openobserve/rebrand.mjs" > "$TOOLING/rebrand.mjs"
git show "$BASE_BRANCH:scripts/openobserve/rename-map.json" > "$TOOLING/rename-map.json"
git show "$BASE_BRANCH:scripts/openobserve/keep-ours.txt" > "$TOOLING/keep-ours.txt"
CURRENT_BASE=$(git show "$BASE_BRANCH:scripts/openobserve/UPSTREAM_BASE" 2>/dev/null | tr -d '[:space:]' || echo 'none')

# ---- Resolve the target commit ----------------------------------------------
TARGET_REF=${1:-"$UPSTREAM_REMOTE/HEAD"}
if ! TARGET=$(git rev-parse --verify "${TARGET_REF}^{commit}" 2>/dev/null); then
  TARGET=$(git rev-parse --verify "${UPSTREAM_REMOTE}/develop^{commit}")
fi
SHORT=$(git rev-parse --short "$TARGET")

if [ "$TARGET" = "$CURRENT_BASE" ]; then
  echo "Already up to date with upstream $SHORT."
  exit 0
fi

echo "Syncing upstream ${CURRENT_BASE:0:12} -> $TARGET"
SYNC_BRANCH="sync/upstream-$SHORT"
git checkout -B "$SYNC_BRANCH" "$BASE_BRANCH"
git rm -rfq . >/dev/null
git checkout "$TARGET" -- .
git clean -fd --quiet

# ---- Keep-ours overlay -------------------------------------------------------
# Fork-owned paths are taken from the openobserve branch. Directories are
# replaced wholesale so files deleted on the openobserve branch do not resurrect.
grep -vE '^\s*(#|$)' "$TOOLING/keep-ours.txt" | while read -r p; do
  if git cat-file -e "$BASE_BRANCH:$p" 2>/dev/null; then
    rm -rf "$p"
    git checkout "$BASE_BRANCH" -- "$p"
  else
    echo "keep-ours: '$p' not found on $BASE_BRANCH, skipping"
  fi
done

# ---- Rebrand codemod ----------------------------------------------------------
node "$TOOLING/rebrand.mjs"

# Stage the rebrand before patching. rebrand.mjs stages its RENAMES (it uses `git mv`)
# but writes CONTENT edits straight to disk, leaving the index behind the working tree.
# `git apply --3way` resolves conflicts against index blobs, so every patched file then
# fails with "does not match index" and the whole series is skipped. Staging here makes
# index == working tree so the 3-way merge has a base to work from.
git add -A

# ---- Re-apply functional patch series ----------------------------------------
# Patches live under scripts/openobserve/patches (restored by the keep-ours overlay
# before this step, so they survive the upstream checkout).
if compgen -G "scripts/openobserve/patches/*.patch" > /dev/null; then
  echo "Re-applying patch series:"
  for p in scripts/openobserve/patches/*.patch; do
    echo "  - $p"
    if ! git apply --3way "$p"; then
      echo "error: patch '$p' did not apply cleanly onto upstream $SHORT." >&2
      echo "       Rebase the patch series manually, then re-run." >&2
      exit 2
    fi
  done
else
  echo "No scripts/openobserve/patches/*.patch to apply yet."
fi

# ---- Install (optional) ------------------------------------------------------
if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  corepack enable >/dev/null 2>&1 || true
  yarn install --no-immutable || yarn install || true
fi

echo "$TARGET" > scripts/openobserve/UPSTREAM_BASE

# Apache-2.0 §4 attribution gate: fail the sync if Datadog attribution was erased.
node scripts/openobserve/check-attribution.mjs

git add -A
git commit --quiet -m "chore(sync): rebrand upstream dd-sdk-reactnative @$SHORT as OpenObserve

Generated by scripts/openobserve/sync-upstream.sh:
- upstream commit: $TARGET
- keep-ours overlay from $BASE_BRANCH
- rebrand codemod (scripts/openobserve/rename-map.json): @datadog->@openobserve, Dd*->O2*, _dd->_o2
- functional patch series re-applied from patches/"

echo
echo "Sync branch $SYNC_BRANCH is ready (upstream $SHORT)."
echo "Review, run the build + tests, push, and open a PR against $BASE_BRANCH."
