#!/usr/bin/env bash
# Publish the RN mobile SDK packages at <version> as a STABLE release.
#
#   ./publish-stable.sh 0.1.0                  publish, then point `latest` at it
#   ./publish-stable.sh 0.1.0 --otp=123456     supply a 2FA code
#   ./publish-stable.sh 0.1.0 --dry-run        run every check, publish nothing
#
# This is NOT publish-alpha.sh with a different dist-tag. A stable version is
# permanent -- npm never lets you reuse or truly remove one -- so this script is
# defined by what it REFUSES to do:
#
#   1. rejects a prerelease version: stable means clean X.Y.Z, not 0.1.0-alpha.8
#   2. requires a clean git tree, so the published tarball matches a real commit
#   3. runs the zero-Datadog and attribution gates BEFORE anything is published
#   4. rejects prerelease NATIVE pins -- a stable RN release pinning alpha natives
#      is incoherent, and this is the check that would have caught it
#   5. requires every package to already be at <version> (no partial sets)
#
# Only after all five pass does it publish, under `latest` rather than `alpha`.
#
# On 2FA: with auth-and-writes every publish and every dist-tag add is OTP-gated,
# and a TOTP code lasts ~30s -- one code will not cover the whole run. The script
# skips anything already published, so re-run with a fresh code to resume.
set -euo pipefail

VERSION=""
OTP=""
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --otp=*)   OTP="${arg#--otp=}" ;;
    -*)        echo "unknown option: $arg" >&2; exit 1 ;;
    *)         VERSION="$arg" ;;
  esac
done

if [ -z "$VERSION" ]; then
  echo "usage: $0 <version> [--otp=123456] [--dry-run]" >&2
  echo "  e.g. $0 0.1.0 --otp=123456" >&2
  exit 1
fi

# Kept as a plain string, not an array: macOS ships bash 3.2, where expanding an
# empty array under `set -u` aborts with "unbound variable". The OTP is six
# digits, so unquoted word-splitting is safe here.
OTP_ARG=""
[ -n "$OTP" ] && OTP_ARG="--otp $OTP"

TAG="latest"
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# core first, then satellites. Mirrors publish-alpha.sh; keep the two in sync.
DIRS=(
  packages/core
  packages/react-native-babel-plugin
  packages/react-native-session-replay
  packages/react-native-webview
  packages/react-native-navigation
  packages/react-navigation
  packages/react-native-openfeature
  packages/react-native-apollo-client
  packages/codepush
)

pkg_name() { node -e "console.log(require('./$1/package.json').name)"; }
pkg_ver()  { node -e "console.log(require('./$1/package.json').version)"; }

fail() { echo ""; echo "ABORTING -- $1"; exit 1; }

echo "=== stable release preflight: $VERSION ==="

# --- 1. the version must not be a prerelease ----------------------------------
# `0.1.0-alpha.8` would publish happily and then sit on `latest` forever.
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  fail "'$VERSION' is not a stable version. Expected X.Y.Z with no prerelease suffix."
fi
echo "  [1/5] version is clean semver"

# --- 2. the working tree must be clean ----------------------------------------
# npm packs the working directory, not the commit. A dirty tree means the
# published artifact corresponds to nothing reviewable.
if [ -n "$(git status --porcelain)" ]; then
  git status --short | head -20
  fail "working tree is dirty. Commit or stash before publishing a stable version."
fi
echo "  [2/5] git tree is clean ($(git rev-parse --short HEAD))"

# --- 3. the identity gates ----------------------------------------------------
# These run in CI too, but a stable publish is irreversible, so re-run them here
# against the exact tree being packed rather than trusting an earlier green run.
if [ -x scripts/openobserve/check-no-datadog.sh ] || [ -f scripts/openobserve/check-no-datadog.sh ]; then
  bash scripts/openobserve/check-no-datadog.sh >/dev/null || fail "zero-Datadog gate failed. Run it directly to see the hits."
fi
if [ -f scripts/openobserve/check-attribution.mjs ]; then
  node scripts/openobserve/check-attribution.mjs >/dev/null || fail "attribution gate failed (Apache-2.0 4). Run it directly to see the hits."
fi
echo "  [3/5] zero-Datadog + attribution gates pass"

# --- 4. native pins must be stable too ----------------------------------------
# A stable RN release that pins `OpenObserveSessionReplay '0.1.0-alpha.5'` ships
# consumers a prerelease native under a stable label. Checked here because it is
# invisible in package.json and easy to forget during a version bump.
NATIVE_PRERELEASE=""
for f in packages/*/[A-Z]*.podspec; do
  [ -f "$f" ] || continue
  h=$(grep -nE "dependency +'OpenObserve[A-Za-z]*', *'[^']*-(alpha|beta|rc)" "$f" || true)
  [ -n "$h" ] && NATIVE_PRERELEASE="$NATIVE_PRERELEASE$f:\n$h\n"
done
for f in packages/*/android/build.gradle; do
  [ -f "$f" ] || continue
  h=$(grep -nE "ai\.openobserve:[a-z0-9-]+:[^\"']*-?(alpha|beta|rc)" "$f" || true)
  [ -n "$h" ] && NATIVE_PRERELEASE="$NATIVE_PRERELEASE$f:\n$h\n"
done
if [ -n "$NATIVE_PRERELEASE" ]; then
  printf "%b" "$NATIVE_PRERELEASE" | head -20
  fail "native pins are still prerelease. Publish the native SDKs stable and re-pin first."
fi
echo "  [4/5] native pins are stable"

# --- 5. every package must already be bumped ----------------------------------
# Publishing a partial set is what left `latest` stranded on alpha.3.
mismatch=0
for d in "${DIRS[@]}"; do
  ver="$(pkg_ver "$d")"
  if [ "$ver" != "$VERSION" ]; then
    echo "     !! $(pkg_name "$d") is at $ver"
    mismatch=1
  fi
done
[ "$mismatch" -eq 0 ] || fail "not all packages are at $VERSION. Run ./update-version.sh $VERSION first."
echo "  [5/5] all ${#DIRS[@]} packages at $VERSION"

if [ "$DRY_RUN" -eq 1 ]; then
  echo ""
  echo "DRY RUN -- every preflight check passed. Nothing was published."
  exit 0
fi

# --- publish ------------------------------------------------------------------
for d in "${DIRS[@]}"; do
  name="$(pkg_name "$d")"
  echo ""
  echo "=== $name ($d) ==="
  if npm view "$name@$VERSION" version >/dev/null 2>&1; then
    echo "  already published $VERSION -- skipping"; continue
  fi
  ( cd "$d" && npm publish --tag "$TAG" $OTP_ARG )
  echo "  published $name@$VERSION"
done

# `npm publish --tag latest` already points latest at this version, but a resumed
# run skips the packages it published earlier, so re-assert the tag for all of
# them rather than leaving a partially-moved `latest`.
echo ""
echo "=== asserting \`latest\` -> $VERSION ==="
for d in "${DIRS[@]}"; do
  name="$(pkg_name "$d")"
  npm dist-tag add "$name@$VERSION" latest $OTP_ARG
done

echo ""
echo "=== VERIFY (${#DIRS[@]} packages) ==="
fail_verify=0
for d in "${DIRS[@]}"; do
  name="$(pkg_name "$d")"
  tags="$(npm view "$name" dist-tags --json 2>/dev/null || echo '{}')"
  l="$(node -e "console.log(JSON.parse(process.argv[1]).latest || 'NONE')" "$tags")"
  printf "  %-50s latest=%s\n" "$name" "$l"
  [ "$l" != "$VERSION" ] && fail_verify=1
done

echo ""
if [ "$fail_verify" -ne 0 ]; then
  echo "!! some packages are not on latest=$VERSION -- see above"
  exit 1
fi
echo "OK -- all ${#DIRS[@]} packages published at $VERSION and latest points to it"
echo ""
echo "Follow-ups this script does NOT do:"
echo "  - tag the repo:            git tag $VERSION && git push origin $VERSION"
echo "  - bump the ingestion setup cards in the openobserve product repo:"
echo "      web/src/components/ingestion/setupCard/content/rumReactNative.ts (RUM_RN_SDK_VERSION)"
