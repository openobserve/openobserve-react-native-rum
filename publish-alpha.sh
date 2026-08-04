#!/usr/bin/env bash
# Publish the RN mobile SDK packages at <version> under the `alpha` dist-tag.
#
#   ./publish-alpha.sh 0.1.0-alpha.7              publish + move `latest`
#   ./publish-alpha.sh 0.1.0-alpha.7 --no-latest  publish only, leave `latest` alone
#
# core first, then satellites. Skips any package already published at <version>.
# Auth/2FA comes from your ~/.npmrc / .env setup.
#
# On `latest`: alpha.3 was published without `--tag alpha`, so npm pinned
# `latest` to it and every release since went out under `alpha` only. A plain
# `npm install @openobserve/mobile-react-native-session-replay` therefore still
# resolves to alpha.3. Until there is a stable release, `latest` should track
# the newest alpha -- otherwise new users silently get the oldest one.
set -euo pipefail

VERSION=""
MOVE_LATEST=1
OTP=""

for arg in "$@"; do
  case "$arg" in
    --no-latest) MOVE_LATEST=0 ;;
    --otp=*)     OTP="${arg#--otp=}" ;;
    -*)          echo "unknown option: $arg" >&2; exit 1 ;;
    *)           VERSION="$arg" ;;
  esac
done

if [ -z "$VERSION" ]; then
  echo "usage: $0 <version> [--otp=123456] [--no-latest]" >&2
  echo "  e.g. $0 0.1.0-alpha.7 --otp=123456" >&2
  exit 1
fi

# With 2FA set to auth-and-writes, every publish and every dist-tag add needs an
# OTP. A TOTP code is only valid for ~30s, so one code will not cover all of
# them -- this script is idempotent (it skips anything already published), so
# re-run it with a fresh code to pick up where it stopped.
#
# Kept as a plain string, not an array: macOS ships bash 3.2, where expanding an
# empty array under `set -u` aborts with "unbound variable". The OTP is six
# digits, so unquoted word-splitting is safe here.
OTP_ARG=""
[ -n "$OTP" ] && OTP_ARG="--otp $OTP"

TAG="alpha"
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# core first, then satellites
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

# Refuse to publish a partial set: every package must already be bumped.
echo "=== preflight: all local versions must be $VERSION ==="
mismatch=0
for d in "${DIRS[@]}"; do
  ver="$(pkg_ver "$d")"
  if [ "$ver" != "$VERSION" ]; then
    echo "  !! $(pkg_name "$d") is at $ver"
    mismatch=1
  fi
done
if [ "$mismatch" -ne 0 ]; then
  echo ""
  echo "Aborting -- run ./update-version.sh $VERSION first."
  echo "(Publishing a partial set is what left \`latest\` stranded on alpha.3.)"
  exit 1
fi
echo "  all ${#DIRS[@]} packages at $VERSION"

for d in "${DIRS[@]}"; do
  name="$(pkg_name "$d")"
  echo ""
  echo "=== $name ($d) ==="
  if npm view "$name@$VERSION" version >/dev/null 2>&1; then
    echo "  already published $VERSION — skipping"; continue
  fi
  ( cd "$d" && npm publish --tag "$TAG" $OTP_ARG )
  echo "  published $name@$VERSION"
done

if [ "$MOVE_LATEST" -eq 1 ]; then
  echo ""
  echo "=== moving \`latest\` -> $VERSION ==="
  for d in "${DIRS[@]}"; do
    name="$(pkg_name "$d")"
    npm dist-tag add "$name@$VERSION" latest $OTP_ARG
  done
fi

echo ""
echo "=== VERIFY (${#DIRS[@]} packages) ==="
fail=0
for d in "${DIRS[@]}"; do
  name="$(pkg_name "$d")"
  tags="$(npm view "$name" dist-tags --json 2>/dev/null || echo '{}')"
  a="$(node -e "console.log(JSON.parse(process.argv[1]).alpha  || 'NONE')" "$tags")"
  l="$(node -e "console.log(JSON.parse(process.argv[1]).latest || 'NONE')" "$tags")"
  printf "  %-50s alpha=%-16s latest=%s\n" "$name" "$a" "$l"
  [ "$a" != "$VERSION" ] && fail=1
  [ "$MOVE_LATEST" -eq 1 ] && [ "$l" != "$VERSION" ] && fail=1
done

echo ""
if [ "$fail" -ne 0 ]; then
  echo "!! some tags are not at $VERSION — see above"
  exit 1
fi
echo "OK — all tags at $VERSION"
