#!/usr/bin/env bash
# Release gate: every @openobserve/* dependency and PEER dependency declared by a publishable
# package must be satisfiable by the version this monorepo actually publishes.
#
# This exists because alpha3 shipped with six packages declaring
#   peerDependencies: { "@openobserve/mobile-react-native": "^3.0.0" }
# a leftover upstream range that no 0.1.0-alpha.x can satisfy. Every consumer hit
#   npm error ETARGET  No matching version found for @openobserve/mobile-react-native@^3.0.0
# and needed --legacy-peer-deps to install at all. The zero-Datadog gate did not catch it:
# "^3.0.0" carries no upstream identity, it is simply WRONG. Correctness needs its own check.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

VER=$(node -p "require('./packages/core/package.json').version")
FAIL=0

for f in packages/*/package.json; do
  node -e '
const fs=require("fs"), path=process.argv[1], ver=process.argv[2];
const d=JSON.parse(fs.readFileSync(path,"utf8"));
if (d.private) process.exit(0);
const semver=(()=>{try{return require("semver")}catch{return null}})();
let bad=[];
for (const sec of ["dependencies","peerDependencies"]) {
  for (const [k,range] of Object.entries(d[sec]||{})) {
    if (!k.startsWith("@openobserve/")) continue;
    // The range must admit the version this repo publishes. Without semver available we
    // fall back to a conservative check: reject any range pinned to a different major.
    const ok = semver ? semver.satisfies(ver, range, {includePrerelease:true})
                      : !/\^?[1-9]\d*\./.test(range) || range.includes(ver.split(".")[0]+".");
    if (!ok) bad.push(`${sec}.${k} = "${range}" (repo publishes ${ver})`);
  }
}
if (bad.length) { console.log(`  ${d.name}:`); bad.forEach(b=>console.log(`    ${b}`)); process.exit(1); }
' "$f" "$VER" || FAIL=1
done

[ "$FAIL" = "0" ] || {
  echo "INTERNAL DEPENDENCY GATE FAILED — a range above cannot be satisfied by $VER."
  echo "  Consumers will hit npm ERESOLVE/ETARGET and need --legacy-peer-deps."
  exit 1
}
echo "internal dependency gate: PASS (every @openobserve/* range admits $VER)"
