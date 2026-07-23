# Releasing `@openobserve/mobile-*` to npm

There is **no release script yet** — every step below is manual. Follow it in order.

npm **cannot unpublish after 72 hours**, and every step here has produced a real bug at
least once. The "Why this bites" column is not padding; each row is something that shipped.

> Publishing order across the program is bottom-up: **Android and iOS first, RN last.**
> RN pins both natives, so publishing it against a pin that does not resolve breaks every
> consumer's install permanently. See `RELEASING.md` in `openobserve-sdk-android` for the
> native steps.

---

## 0. Prerequisites

```bash
node -v      # must be >= 18. npm 10 does NOT support node 16 and fails with a bare warning
nvm use 20   # the repo's default shell node may be older — check, don't assume
yarn -v      # 3.4.1 (pinned via packageManager in package.json)
npm whoami   # must print your npm user; auth lives in ~/.npmrc
```

Confirm the native versions you are pinning are **actually live** before touching anything:

```bash
# Android — pom AND aar must both return 200
V=0.1.0-alpha4
for m in core internal rum logs trace webview ndk flags session-replay; do
  for ext in pom aar; do
    curl -s -o /dev/null -w "%{http_code} o2-sdk-android-$m.$ext\n" \
      "https://repo1.maven.org/maven2/ai/openobserve/o2-sdk-android-$m/$V/o2-sdk-android-$m-$V.$ext"
  done
done

# iOS — all 10 pods
for p in OpenObserveInternal OpenObserveCore OpenObserveLogs OpenObserveTrace OpenObserveRUM \
         OpenObserveCrashReporting OpenObserveSessionReplay OpenObserveWebViewTracking \
         OpenObserveFlags OpenObserveProfiling; do
  curl -s "https://trunk.cocoapods.org/api/v1/pods/$p" | grep -q '"name":"0.1.0-alpha.4"' \
    && echo "OK   $p" || echo "MISSING $p"
  sleep 0.4
done
```

`pod trunk push` prints `🎉 Congrats` **once per pod, not once per run**, and its exit code
has been observed as success on a partial publish. Trust the API query above, never the
publish log.

---

## 1. Stamp the version — 5 places, not 1

The package version appears in five distinct places. Missing any one of them has shipped a
bug; four of the five are silent failures.

### 1a. `packages/*/package.json` → `"version"` (10 files)

```
core                      react-native-navigation
codepush                  react-native-openfeature
internal-testing-tools    react-native-session-replay
react-native-apollo-client  react-native-webview
react-native-babel-plugin   react-navigation
```

Nine publish; `internal-testing-tools` is private but bumps with the rest.

### 1b. Inter-package dependencies on core — 4 refs, **not uniform**

| Package | Spec form | Must bump? |
|---|---|---|
| `codepush` | `"workspace:0.1.0-alpha.N"` | **YES — exact pin** |
| `react-native-navigation` | `"^0.1.0-alpha.N"` | yes (tolerates, but keep in step) |
| `react-native-openfeature` | `"^0.1.0-alpha.N"` | yes |
| `react-navigation` | `"^0.1.0-alpha.N"` | yes |

The `workspace:` protocol is an **exact** pin: it fails workspace resolution the moment
core moves. The three `^` ranges *do* admit a newer prerelease, so a partial edit leaves
three packages passing and one broken — the failure is asymmetric and easy to miss.

### 1c. `packages/core/src/version.ts` — generated, but **checked in**

```ts
export const version = '0.1.0-alpha.N';
```

This is the version the SDK reports at runtime in **every RUM event**. Do not hand-edit —
`genversion` writes it from `packages/core/package.json` and runs automatically as part of
`yarn test` and `yarn lint`. Skip it and you ship a package named `alpha.N` that tags all
telemetry `alpha.N-1`: invisible in the tarball, permanent in the data.

### 1d. `yarn.lock` — never hand-edit

```bash
yarn install --mode=update-lockfile
```

### 1e. `scripts/openobserve/patches/0001-openobserve-intake-paths.patch`

The patch carries the package versions, so **an upstream sync regenerates whatever version
is written there.** Left stale, the next sync silently reverts the release. Regenerate it —
see §5. Do not hand-edit patches (§5 explains why that fails).

### NOT the package version — leave alone

- **`peerDependencies`: `">=0.1.0-alpha.3"`** (6 packages). A compatibility *floor*, not the
  current version. Raising it needlessly breaks consumers. It reads oddly but is correct.
- **Native pins** — `packages/*/android/build.gradle` (`ai.openobserve:o2-sdk-android-*`)
  and `packages/*/*.podspec` (`OpenObserve*`). These track the native SDK releases on their
  own cadence; bump them only when pinning a new native release (§4).

---

## 2. Verify before publishing

```bash
yarn install --mode=update-lockfile
yarn test          # also regenerates packages/core/src/version.ts
bash scripts/openobserve/check-internal-deps.sh   # every @openobserve/* range admits the new version
bash scripts/openobserve/check-no-datadog.sh      # paths + published metadata + content
node scripts/openobserve/check-attribution.mjs    # Apache-2.0 §4 attribution retained
git diff --stat    # sanity: only the files you intended
```

`check-internal-deps.sh` is the gate that would have caught the alpha.3 ERESOLVE bug. Run it.

> **On a failing test:** check the machine's load first. A 5s Jest timeout under load average
> ~56 (concurrent native builds) is not a regression. Re-run the single suite in isolation
> before concluding anything: `npx jest path/to/suite.test.tsx`.

---

## 3. Publish — core first

The other eight depend on core, so it must exist on npm before they resolve.

```bash
cd packages/core
npm publish --dry-run --tag alpha     # inspect name/version/file count
npm publish --tag alpha
```

Then the satellites. **Do not pipe `npm publish` into anything** — a pipeline's exit status
is the *last* command's, so `npm publish | tail` reports success on failure:

```bash
cd ../..
for d in packages/*/; do
  name=$(node -e "const p=require('./$d/package.json');
    if(!p.private && p.name!=='@openobserve/mobile-react-native') console.log(p.name)")
  [ -n "$name" ] || continue
  if (cd "$d" && npm publish --tag alpha); then echo "OK   $name"; else echo "FAIL $name"; fi
done
```

### Verify against the registry, not the publish output

```bash
for p in mobile-react-native mobile-react-native-code-push mobile-react-native-apollo-client \
         mobile-react-native-babel-plugin mobile-react-native-navigation \
         mobile-react-native-openfeature mobile-react-native-session-replay \
         mobile-react-native-webview mobile-react-navigation; do
  curl -sf "https://registry.npmjs.org/@openobserve/$p" \
    | python3 -c "import sys,json;print('$p', '0.1.0-alpha.N' in json.load(sys.stdin).get('versions',{}))"
  sleep 0.3
done
```

Then commit and **push the branch** — published artifacts should have a matching commit on
origin.

---

## 4. Pinning new native SDK versions

Separate from the package version. When new native releases land:

- `packages/*/android/build.gradle` — 11 refs to `ai.openobserve:o2-sdk-android-*:<ver>`
  (includes `benchmarks/android/app/build.gradle`)
- `packages/*/*.podspec` — 10 refs to `OpenObserve*`, `'<ver>'`
- `update-native-sdk-versions.sh` — greps `ai.openobserve:o2-sdk-android` to build
  `NATIVE_SDK_VERSIONS.md`; if the coordinate itself ever changes, update this too
- `scripts/openobserve/rename-map.json` rules **13** (Android pin) and **14** (pod pin) —
  their `to:` values carry the target version, so a sync re-pins to whatever is written there

Confirm every new pin resolves (§0) **before** publishing.

---

## 5. After changing anything the codemod or patches produce

The fork must reproduce from a clean upstream sync. Verify it:

```bash
BASE=$(cat scripts/openobserve/UPSTREAM_BASE)
git worktree add --detach /tmp/sim "$BASE"
cd /tmp/sim
# keep-ours FIRST, then copy tooling in AFTER (keep-ours.txt lists scripts/openobserve,
# so restoring it would clobber newer tooling staged first)
grep -vE '^\s*(#|$)' <repo>/scripts/openobserve/keep-ours.txt | while read -r p; do
  [ -e "<repo>/$p" ] && { rm -rf "$p"; mkdir -p "$(dirname "$p")"; cp -R "<repo>/$p" "$p"; }
done
mkdir -p scripts/openobserve
cp <repo>/scripts/openobserve/{rebrand.mjs,rename-map.json,keep-ours.txt} scripts/openobserve/
git add -A && node scripts/openobserve/rebrand.mjs && git add -A
git apply --3way <repo>/scripts/openobserve/patches/0001-*.patch
# then diff every file against the repo — expect ZERO differences
```

**Regenerate the patch, never hand-edit it.** `git apply --3way` matches the `index` blob
hashes in each hunk header; editing a hunk body invalidates them, so it falls back to strict
context matching and fails on *every* file:

```bash
cd /tmp/sim
git diff -R openobserve -- . ':!scripts/openobserve' > <repo>/scripts/openobserve/patches/0001-openobserve-intake-paths.patch
```

`-R` matters: the patch must transform **synced → desired**, not the reverse.

---

## Traps this process exists to prevent

| Trap | What happened | Guard |
|---|---|---|
| `workspace:` exact pin | `codepush` pinned `workspace:0.1.0-alpha.4` while core moved to alpha.5 — workspace resolution fails | §1b, `check-internal-deps.sh` |
| `version.ts` not regenerated | packages named alpha.5 would report alpha.4 in every RUM event | §1c — `yarn test` runs `genversion` |
| Peer range `^3.0.0` | Leftover upstream range no `0.1.0-alpha.x` satisfies. Plain `npm install` fails with ERESOLVE; consumers need `--legacy-peer-deps` | `check-internal-deps.sh` |
| Rename rule silently dead | The rule fixing that peer range was written `\\^3\\.` in JSON — decodes to a regex needing a *literal backslash*, so it never fired. The tree looked right only because it had been hand-edited | §5 sync-diff — reading the rule will not reveal this |
| Patch re-introduces a fixed bug | Patches apply **after** the codemod; patch 0001 re-added `^3.0.0` in 6 places | §5 sync-diff |
| Stale patch version | Patch pinned alpha.2 for three releases; a sync would revert the release | §1e |
| Publishing against a 404 pin | RN pins natives; npm cannot unpublish after 72h | §0 |
| Trusting publish output | `pod trunk push` prints `Congrats` per pod; a partial publish looked complete | §0, §3 verify against the registry |
| Piping the command under test | `npm publish \| tail` / `pod push \| tail` reports the *pipe's* exit status — failure reads as success | §3 |
