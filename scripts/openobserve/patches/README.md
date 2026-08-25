# patches/

Re-applied by `sync-upstream.sh` AFTER the rebrand codemod, in filename order.

The codemod (`rename-map.json`) reproduces every *string* rename. These patches carry the
FUNCTIONAL fork — behaviour and fork-authored files the codemod cannot express — so a
fresh upstream sync reproduces the fork exactly.

**Anything that is not a string rename and is not listed in `keep-ours.txt` must be in a
patch here, or the next sync silently deletes it.** That is the whole contract.

## 0001-openobserve-intake-paths.patch (82 files)

The filename is historical: this patch started as the intake-path change and has since
grown to carry the fork's entire functional delta. Treat it as "everything the codemod
and keep-ours cannot reproduce", not just URLs.

### Intake paths
Rewrites the native intake path the RN bridge appends to `customEndpoint`:

| | upstream (Datadog) | fork (OpenObserve) |
|---|---|---|
| iOS RUM            | `{base}/api/v2/rum`    | `{base}/rum`    |
| iOS Logs           | `{base}/api/v2/logs`   | `{base}/logs`   |
| iOS Session Replay | `{base}/api/v2/replay` | `{base}/replay` |
| Android RUM            | `{base}` (verbatim) | `{base}/rum`    |
| Android Logs           | `{base}` (verbatim) | `{base}/logs`   |
| Android Session Replay | `{base}` (verbatim) | `{base}/replay` |

Targets `POST {org endpoint}/rum/v1/{org}/rum`. Note the platforms differ on purpose:
Android's `useCustomEndpoint` takes the URL verbatim (the SDK appends nothing), so the
suffix is added in the bridge; iOS upstream already appended `/api/v2/...`, so the patch
replaces that path rather than adding one.

The session-replay row was added for 0.1.2 (issue #13942). It was fixed directly on the
`openobserve` branch first and was NOT in this patch — a sync would have restored
Datadog's `/api/v2/replay` on iOS and dropped the suffix entirely on Android, silently
recording nothing against a self-hosted instance. That is the exact failure mode this
directory exists to prevent, and it is why the regeneration step below is part of
releasing, not an afterthought.

### Also carried
- **Release toolchain** (fork-authored, absent upstream): `publish-stable.sh`,
  `publish-alpha.sh`, `update-version.sh`, `update-native-sdk-versions.sh`, `RELEASING.md`.
- **Native artifact pins**: `packages/*/android/build.gradle` (`ai.openobserve:o2-sdk-android-*`)
  and the `OpenObserve*.podspec` dependency versions.
- **Version state**: `lerna.json`, every `package.json` version + peer range,
  `packages/core/src/version.ts`, `SdkVersion.kt`, `SdkVersion.swift`.
- **Docs**: `MIGRATION.md`, `NATIVE_SDK_VERSIONS.md`.
- **`release-content.txt`** for all 8 packages that ship one.
- Distributed-tracing headers, first-party hosts, WebView injected JS, config schema.

**Why these must be a patch, not a rule:** they are behavioural changes, fork-authored
files, or values constructed at runtime — none expressible as a token rename in
`rename-map.json`.

## Keeping this patch current

**A version bump or any behavioural fix invalidates this patch.** It encodes
`version.ts`, `lerna.json`, `yarn.lock` and every `package.json`, so it goes stale on
every release. Regenerate it as part of cutting a release, after the version bump commit.

## Not patched
- `deferredRules` in `rename-map.json` (native artifact coordinates) are activated by
  moving them into `rules` at STEP 4, once the iOS/Android forks are on the registries.
  They are codemod rules, not patches.

## Regenerating
1. `git worktree add --detach /tmp/sim $(cat scripts/openobserve/UPSTREAM_BASE)`
2. In the worktree, apply the keep-ours overlay exactly as `sync-upstream.sh` does:
   for each path in `keep-ours.txt`, `rm -rf "$p"` then `git checkout openobserve -- "$p"`.
   (`keep-ours.txt` lists `scripts/openobserve`, so this restores current tooling; do not
   stage tooling first or the restore clobbers it — this is why sync-upstream.sh copies
   from `$TOOLING`.)
3. `node scripts/openobserve/rebrand.mjs`
4. `git add -A && git diff -R --binary openobserve -- . ':!scripts/openobserve' > \
   scripts/openobserve/patches/0001-openobserve-intake-paths.patch`
   (`-R` matters: the patch must transform synced -> desired.)
5. Verify: `git apply --check`, then `git apply --3way`, then confirm
   `git diff --name-only openobserve -- . ':!scripts/openobserve'` prints **nothing**.

Last regenerated: 0.1.2 (upstream base 7abbd15c), verified zero drift.
