# patches/

Re-applied by `sync-upstream.sh` AFTER the rebrand codemod, in filename order.

The codemod (`rename-map.json`) reproduces every *string* rename. These patches carry the
FUNCTIONAL fork — behaviour the codemod cannot express — so a fresh upstream sync
reproduces the fork exactly.

Verified: sync from `UPSTREAM_BASE` + rebrand + these patches == the `openobserve`
branch, with **zero drift**.

## 0001-openobserve-intake-paths.patch (2 files)
Rewrites the native intake path the RN bridge appends to `customEndpoint`:

| | upstream (Datadog) | fork (OpenObserve) |
|---|---|---|
| iOS RUM   | `{base}/api/v2/rum`  | `{base}/rum`  |
| iOS Logs  | `{base}/api/v2/logs` | `{base}/logs` |
| Android RUM  | `{base}` (verbatim) | `{base}/rum`  |
| Android Logs | `{base}` (verbatim) | `{base}/logs` |

Targets `POST {org endpoint}/rum/v1/{org}/rum`. Note the platforms differ on purpose:
Android's `useCustomEndpoint` takes the URL verbatim (the SDK appends nothing), so the
suffix is added in the bridge; iOS upstream already appended `/api/v2/...`, so the patch
replaces that path rather than adding one.

**Why this must be a patch, not a rule:** it is a behavioural change to a URL that is
*constructed at runtime*, not a token rename. No entry in `rename-map.json` can express
it. Losing it on a sync would silently restore Datadog's `/api/v2/*` intake paths —
exactly the class of regression `sync-upstream.sh`'s header promises `patches/` prevents,
while `patches/` in fact contained only this README.

## Not patched
- `deferredRules` in `rename-map.json` (native artifact coordinates) are activated by
  moving them into `rules` at STEP 4, once the iOS/Android forks are on the registries.
  They are codemod rules, not patches.

## Regenerating
1. `git worktree add --detach /tmp/sim $(cat scripts/openobserve/UPSTREAM_BASE)`
2. overlay `scripts/openobserve`, restore keep-ours, then copy tooling in **AFTER** the
   keep-ours loop (`keep-ours.txt` lists `scripts/openobserve`, so the restore clobbers
   newer tooling staged first — this is why sync-upstream.sh copies from `$TOOLING`);
3. `node scripts/openobserve/rebrand.mjs`;
4. `git diff -R openobserve -- . ':!scripts/openobserve'` (`-R` matters: the patch must
   transform synced -> desired), then verify `git apply --check` + zero drift.
