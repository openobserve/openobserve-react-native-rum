# Functional patch series

Each `*.patch` here is one focused, re-appliable change that expresses **behavior**
the rebrand codemod cannot (native-bridge endpoint injection, HTTPS guard, auth
URL-build order). `sync-upstream.sh` re-applies them in filename order onto a
freshly rebranded upstream tree, so keep them:

- **single-concern** — one file/concern per patch, so a conflict points at exactly
  one change;
- **ordered** — numeric prefix (`01-`, `02-`, …) sets apply order;
- **minimal** — the smaller the diff, the less likely an upstream bump conflicts.

**Status (Phase 0):** empty. The Phase-0 intake-path change (below) is currently
applied as **direct edits** on the `openobserve` branch, not yet a patch — because
`customEndpoint` at upstream 3.5.3 is already JS-wired, so the only native change is a
tiny path suffix. Patches are generated here in **Phase 1**, *after* the rebrand (A2b),
against the rebranded tree — a patch made against the un-rebranded tree would not apply
once `DdSdkNativeInitialization.*` is renamed to `Oo*`.

Planned series (tracker A3):

| Patch | Concern | State |
|-------|---------|-------|
| `01-intake-path.patch` | iOS/Android bridge: intake path `/api/v2/{rum,logs}` → OpenObserve `/{rum,logs}` | **direct-edited** (Phase 0) |
| `02-js-endpoint-config.patch` | JS: single `endpoint` field → per-track `customEndpoint`; remove `site`/`proxyConfig` | todo |
| `03-https-guard.patch` | Reject `http://` unless `allowInsecure`; fail-closed on missing/invalid endpoint (never Datadog default) | todo |
| `04-session-replay-endpoint.patch` | Replay endpoint injection behind `enableSessionReplay` flag (default off) | todo |

To create a patch from staged work (Phase 1, post-rebrand):
`git diff -- <path> > scripts/openobserve/patches/NN-name.patch`.
