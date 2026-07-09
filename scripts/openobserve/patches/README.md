# Functional patch series

Each `*.patch` here is one focused, re-appliable change that expresses **behavior**
the rebrand codemod cannot (native-bridge endpoint injection, HTTPS guard, auth
URL-build order). `sync-upstream.sh` re-applies them in filename order onto a
freshly rebranded upstream tree, so keep them:

- **single-concern** — one file/concern per patch, so a conflict points at exactly
  one change;
- **ordered** — numeric prefix (`01-`, `02-`, …) sets apply order;
- **minimal** — the smaller the diff, the less likely an upstream bump conflicts.

Planned series (tracker A3):

| Patch | Concern |
|-------|---------|
| `01-ios-custom-endpoint.patch` | iOS bridge sets `rumConfig.customEndpoint` / `logsConfig.customEndpoint` from JS `endpoint` |
| `02-android-custom-endpoint.patch` | Android bridge calls `useCustomEndpoint(...)` on RUM/Logs config builders |
| `03-js-endpoint-config.patch` | JS config type: add required `endpoint`, remove upstream `site`/`proxyConfig` |
| `04-https-guard.patch` | Reject `http://` unless `allowInsecure` dev flag; fail-closed on missing/invalid endpoint |
| `05-session-replay-endpoint.patch` | Replay endpoint injection behind `enableSessionReplay` flag (default off) |

To create a patch from staged work: `git diff -- <path> > patches/NN-name.patch`.
