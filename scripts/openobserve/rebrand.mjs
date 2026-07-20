#!/usr/bin/env node
/**
 * OpenObserve rebrand codemod for the openobserve-react-native-rum fork.
 *
 * Transforms a pristine DataDog/dd-sdk-reactnative tree into the OpenObserve
 * equivalent by applying the ordered rules in rename-map.json to every tracked
 * text file (JS/TS + native Kotlin/Swift/ObjC together, so the native-module
 * bridge names stay consistent).
 *
 * It applies ONLY the `rules` array. `deferredRules` (native artifact
 * coordinates) are intentionally ignored — see rename-map.json for why.
 *
 * Run from the repository root:
 *   node scripts/openobserve/rebrand.mjs [--check]
 *
 * --check: exit 1 if any file WOULD change (used to detect an already-branded
 *          tree, e.g. in CI after a sync).
 *
 * Deterministic and idempotent: running it twice produces the same tree.
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = process.cwd()
const HERE = path.dirname(fileURLToPath(import.meta.url))
const CHECK = process.argv.includes('--check')

const {
  rules,
  pathRenames = [],
  dirRenames = [],
  fileRenames = [],
} = JSON.parse(fs.readFileSync(path.join(HERE, 'rename-map.json'), 'utf8'))

// Fork-owned files (keep-ours overlay) are never rebranded: they are authored
// for the fork already, and may intentionally reference upstream.
const keepOursPaths = fs
  .readFileSync(path.join(HERE, 'keep-ours.txt'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))

// Files never touched by the codemod.
const SKIP = [
  /(^|\/)node_modules\//,
  /(^|\/)\.yarn\//,
  /^yarn\.lock$/,
  /(^|\/)Podfile\.lock$/,
  /(^|\/)CHANGELOG\.md$/,
  /(^|\/)lib\//, // compiled package output, rebuilt by the package build
  /(^|\/)dist\//,
  /(^|\/)build\//, // android build output
  /(^|\/)Pods\//, // ios installed pods
  /(^|\/)\.gradle\//,
  /^scripts\/openobserve\//, // this tooling
  /\.(png|jpg|jpeg|gif|ico|svg|webp|woff2?|ttf|eot|otf|mp4|webm|mov|zip|jar|aar|keystore|pdf|so|a|dylib|framework)$/i,
]

const git = (args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 }).toString('utf8')
const tracked = () =>
  git(['ls-files', '-z'])
    .split('\0')
    .filter(Boolean)
    .filter((f) => !SKIP.some((re) => re.test(f)))
    .filter((f) => !keepOursPaths.some((p) => f === p || f.startsWith(`${p}/`)))

// ---- Phase 1: path renames (git mv) -----------------------------------------
// The Android/iOS forks have had these from the start; RN did not, so its codemod
// renamed file CONTENT while leaving 191 upstream-named PATHS in place — including
// packages/core/android/src/main/kotlin/com/datadog/reactnative/** (the bridge's Java
// package, which ships inside the published npm tarball) and the bridge podspec
// itself. Content rules cannot express a rename; only `git mv` can.
//
// Each rule is applied against a FRESH scan so rules compose. Within one rule we drop
// a move nested under another move OF THE SAME RULE (git mv carries nested content).
function dirsNow() {
  return [...new Set(tracked().map((f) => path.dirname(f)))]
}
function movesForRule(rule, dirs) {
  const moves = []
  const from = rule.from
  const srcs = new Set()
  for (const d of dirs) {
    let idx = d.indexOf(from)
    while (idx !== -1) {
      const before = idx === 0 || d[idx - 1] === '/'
      const afterPos = idx + from.length
      const after = afterPos === d.length || d[afterPos] === '/'
      if (before && after) srcs.add(d.slice(0, afterPos))
      idx = d.indexOf(from, idx + 1)
    }
  }
  for (const src of srcs) moves.push([src, src.slice(0, src.length - from.length) + rule.to])
  const uniq = [...new Map(moves.map((m) => [m[0], m])).values()].sort(
    (a, b) => a[0].split('/').length - b[0].split('/').length
  )
  const done = []
  return uniq.filter(([f]) => {
    if (done.some((p) => f === p || f.startsWith(`${p}/`))) return false
    done.push(f)
    return true
  })
}

let dirMoves = 0
for (const rule of pathRenames) {
  const moves = movesForRule(rule, dirsNow())
  dirMoves += moves.length
  console.log(`pathRename [${rule.from}]: ${moves.length} dir(s) ${CHECK ? 'would be' : ''} moved`)
  if (process.argv.includes('--list')) moves.forEach(([a, b]) => console.log(`  ${a} -> ${b}`))
  if (!CHECK) for (const [f, t] of moves) { fs.mkdirSync(path.dirname(t), { recursive: true }); git(['mv', f, t]) }
}

// ---- Phase 1.2: nested directory renames (any depth) ------------------------
// pathRenames only matches a fixed slash-path (com/datadog). It cannot reach a DIRECTORY
// whose basename merely contains the token — e.g. src/sdk/DatadogProvider/,
// DatadogRumResource/, DatadogEventEmitter/, DatadogInternalBridge/. Those ship in the
// npm tarball, and the first pass renamed the FILES inside them while stranding the
// directory (DatadogEventEmitter/OpenObserveEventEmitter.tsx). Iterates to a fixpoint —
// a rename can expose a parent/child that still matches — and drops moves nested under
// another move in the same pass, since git mv carries their content.
let nestedDirMoves = 0
for (const rule of dirRenames) {
  for (let pass = 0; pass < 10; pass++) {
    const dirs = new Set()
    for (const f of tracked()) {
      const parts = f.split('/')
      for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'))
    }
    const moves = []
    for (const d of dirs) {
      const base = path.basename(d)
      if (!base.includes(rule.token)) continue
      if ((rule.skip || []).some((s) => d.includes(s))) continue
      moves.push([d, path.join(path.dirname(d), base.split(rule.token).join(rule.to))])
    }
    moves.sort((a, b) => a[0].split('/').length - b[0].split('/').length)
    const done = []
    const batch = moves.filter(([f]) => {
      if (done.some((p) => f === p || f.startsWith(`${p}/`))) return false
      done.push(f)
      return true
    })
    if (!batch.length) break
    nestedDirMoves += batch.length
    if (process.argv.includes('--list')) batch.forEach(([a, b]) => console.log(`  ${a} -> ${b}`))
    if (CHECK) break // no mutation: a second pass would report the same moves
    for (const [f, t] of batch) git(['mv', f, t])
  }
}
if (dirRenames.length) console.log(`dirRenames: ${nestedDirMoves} dir(s) ${CHECK ? 'would be' : ''} moved`)

// ---- Phase 1.5: file renames (basename token) -------------------------------
// Class-name FILES whose basename still carries the upstream token even though the
// class INSIDE was rebranded by the content rules (e.g. DatadogSDKWrapper.kt holding
// `class OpenObserveSDKWrapper`). Basename only — directories are Phase 1's job.
let fileMoves = 0
for (const rule of fileRenames) {
  for (const f of tracked()) {
    const base = path.basename(f)
    if ((rule.skip || []).some((s) => f.includes(s))) continue
    let next
    if (rule.regex) {
      // A regex rule must mirror the CONTENT rule's boundary semantics exactly. The content
      // rule is /\bDd([A-Z][A-Za-z0-9]*)/ -> Oo$1, which renames DdLogs but NOT NativeDdFlags
      // (no word boundary before Dd). A plain substring rename would move NativeDdFlags.ts
      // while its content still says NativeDdFlags — swapping one broken state for another.
      const re = new RegExp(rule.regex)
      if (!re.test(base)) continue
      next = base.replace(new RegExp(rule.regex, 'g'), rule.to)
    } else {
      if (!base.includes(rule.token)) continue
      next = base.split(rule.token).join(rule.to)
    }
    if (next === base) continue
    const to = path.join(path.dirname(f), next)
    fileMoves++
    if (process.argv.includes('--list')) console.log(`  ${f} -> ${to}`)
    if (!CHECK) git(['mv', f, to])
  }
}
if (fileRenames.length) console.log(`fileRenames: ${fileMoves} file(s) ${CHECK ? 'would be' : ''} moved`)

const trackedFiles = tracked()

const compiled = rules.map((rule) => ({
  ...rule,
  matcher: rule.regex ? new RegExp(rule.regex, 'g') : null,
}))

// Apache-2.0 §4(b)/(c): never rewrite upstream attribution lines — the per-file
// license header (in ANY comment style: /* */, #, <!-- ~ -->) and the third-party
// copyright manifest (LICENSE-3rdparty.csv). Matched by CONTENT, per line, so the
// Datadog->OpenObserve rules only touch code. Datadog's copyright/attribution stays
// verbatim; the OpenObserve modification statement lives in NOTICE + README (kept
// via keep-ours.txt).
const ATTRIBUTION_RE = /software developed at Datadog \(https:\/\/www\.datadoghq\.com\/\)|Copyright\b[^\n]*\bDatadog, Inc\./
function applyRules(content) {
  return content
    .split('\n')
    .map((line) => {
      if (ATTRIBUTION_RE.test(line)) return line
      let out = line
      for (const rule of compiled) {
        if (rule.matcher) out = out.replace(rule.matcher, rule.to)
        else out = out.split(rule.literal).join(rule.to)
      }
      return out
    })
    .join('\n')
}

let changed = 0
const changedFiles = []
for (const file of trackedFiles) {
  const abs = path.join(ROOT, file)
  let stat
  try {
    stat = fs.lstatSync(abs)
  } catch {
    continue // deleted in working tree
  }
  if (!stat.isFile()) continue
  const buf = fs.readFileSync(abs)
  if (buf.includes(0)) continue // binary safety net
  const content = buf.toString('utf8')
  const next = applyRules(content)
  if (next !== content) {
    changed++
    changedFiles.push(file)
    if (!CHECK) fs.writeFileSync(abs, next)
  }
}

console.log(`rebrand: ${changed} files ${CHECK ? 'would be' : ''} rebranded`)
if (process.argv.includes('--list')) {
  for (const f of changedFiles) console.log(`  ${f}`)
}
if (CHECK && (changed > 0 || dirMoves > 0 || fileMoves > 0)) {
  console.error('rebrand --check: tree is not fully branded')
  process.exit(1)
}
