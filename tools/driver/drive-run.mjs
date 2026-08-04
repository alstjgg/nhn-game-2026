#!/usr/bin/env node
// Run driver — one full run of a scenario pack, headless, on the same `src/**`
// modules the browser bundle runs, writing a run-record to `artifacts/runs/`.
//
//   node tools/driver/drive-run.mjs --pack 우는다리 --provider fixture --validate
//   node tools/driver/drive-run.mjs --pack 우는다리 --provider fixture --determinism-check
//
// WHAT THIS IS. A recorder. It binds e7's live driver, e8's run loop and e6's
// fixture provider, watches two seams — the `ViewEvent` stream and the transport
// — reads the engine's delta journal, and writes down what it saw. Anything it
// computes that the engine already computes is a defect, which is why the beat
// chain, the symptom renderer, the id allocator and the feed builder are all
// imported rather than restated.
//
// WHAT THIS IS NOT. It is not a second engine, not a second fixture provider,
// and not a second schema walker. There is no clock and no randomness anywhere
// on this path: the same pack and the same provider must produce byte-identical
// output, and `--determinism-check` is the gate that proves it.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { createFixtureProvider } from '../../src/transport/fixture.ts'
import { createMemoryMetaStore } from '../../src/runloop/store.ts'
import { createRunLoop } from '../../src/runloop/run-loop.ts'

import { bindRun } from './run/bind.mjs'
import { loadGuidance, loadPack, REPO } from './run/pack.mjs'
import {
  assembleRecord,
  firstDiff,
  recordingTransport,
  reduceEvents,
  serializeRecord,
} from './run/record.mjs'
import { formatValidation, validateMetaState, validateRunRecord } from './run/validate.mjs'

export { bindRun } from './run/bind.mjs'
export { loadGuidance, loadPack } from './run/pack.mjs'
export { firstDiff, recordingTransport, reduceEvents, serializeRecord } from './run/record.mjs'
export { validateMetaState, validateRunRecord } from './run/validate.mjs'

/** Every provider a headless run may be pointed at. No network here. */
const PROVIDERS = {
  fixture: (overrides) => createFixtureProvider(overrides),
}

/**
 * One full run, pure of `fs` — the pack and the policy arrive already parsed so
 * a test can call this directly. Returns the record, the run loop's meta-state,
 * the raw event stream the record was reduced from, and the run's block store
 * (the carry-over's landing place, so a caller can check what the run held
 * rather than only what the record says it held).
 */
export async function runHeadless({
  pack,
  guidance,
  provider,
  store,
  runId,
  providerName,
  policy,
}) {
  const runLoop = createRunLoop({ store, packSlug: pack.slug })
  const begun = runLoop.startRun()
  // decision 2 — derived from (pack, provider, run index). No timestamp, no uuid.
  const id = runId ?? `${pack.slug}-${providerName ?? 'fixture'}-r${begun.run}`

  // `begun.carried` is not decoration on the record: it is this run's starting
  // block store. Recording a carry-over the run itself does not hold would make
  // `injected_blocks` a claim about a run that never had those blocks.
  const rig = bindRun({ pack, guidance, provider, run: begun.run, carried: begun.carried })
  while (await rig.driver.step()) {
    // The driver owns the loop's termination; this is the only place it turns.
  }

  const reduced = reduceEvents(rig.events)
  if (reduced.reachedClock === null) {
    // D-4: `reached_clock` is not nullable. A run that reached no clock is a
    // broken run, not a run with a null depth — fail loudly, synthesize nothing.
    throw new Error(`run ${id} reached no clock — refusing to synthesize one`)
  }

  const record = assembleRecord({
    runId: id,
    packSlug: pack.slug,
    policy,
    reduced,
    journals: rig.journals,
    calls: rig.calls,
    carried: begun.carried,
  })

  const meta = runLoop.endRun({
    runId: id,
    reachedClock: reduced.reachedClock,
    carried: begun.carried,
  })

  return { record, meta, events: rig.events, blocks: rig.driver.blocks() }
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const VALUED = new Set(['pack', 'provider', 'out', 'run-id', 'policy'])
const BARE = new Set(['help', 'validate', 'determinism-check', 'emit-meta'])

const USAGE = `usage: node tools/driver/drive-run.mjs --pack <slug> --provider <name> [options]

  --pack=<slug>          scenario datapack under data/scenario/ (required)
  --provider=<name>      ${Object.keys(PROVIDERS).join(' | ')} (required)
  --validate             validate the record against run-record.schema.json
  --determinism-check    run the pipeline twice in-process and compare the
                         serialized records; prints the first differing JSON
                         path — a path, never a whole-record dump
  --emit-meta            also write the run loop's meta-state beside the record
  --out=<dir>            output directory (default: artifacts/runs/)
  --run-id=<id>          override the derived run id and the file name
  --policy=<name>        stamp the record's policy field
  --help                 this text
`

class CliError extends Error {}

const die = (message) => {
  throw new CliError(message)
}

function parseArgs(argv) {
  const flags = new Set()
  const opts = {}

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) die(`unexpected argument "${arg}"`)
    const body = arg.slice(2)
    const eq = body.indexOf('=')
    const name = eq === -1 ? body : body.slice(0, eq)

    if (VALUED.has(name)) {
      if (eq !== -1) {
        opts[name] = body.slice(eq + 1)
        continue
      }
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) die(`--${name} needs a value`)
      opts[name] = next
      i += 1
      continue
    }

    if (!BARE.has(name)) die(`unknown flag "--${name}"`)
    if (eq !== -1) die(`--${name} takes no value`)
    flags.add(name)
  }

  return { flags, opts }
}

async function onePass({ pack, guidance, providerName, runId, policy, overrides }) {
  return runHeadless({
    pack,
    guidance,
    provider: PROVIDERS[providerName](overrides),
    store: createMemoryMetaStore(),
    runId,
    providerName,
    policy,
  })
}

async function main(argv) {
  const { flags, opts } = parseArgs(argv)

  if (flags.has('help') || argv.length === 0) {
    process.stdout.write(USAGE)
    return
  }

  const slug = opts.pack
  if (slug === undefined) die('--pack <slug> is required')
  const providerName = opts.provider
  if (providerName === undefined) die('--provider <name> is required')
  if (!Object.prototype.hasOwnProperty.call(PROVIDERS, providerName)) {
    die(`unknown provider "${providerName}" — known: ${Object.keys(PROVIDERS).join(', ')}`)
  }

  let pack
  try {
    pack = loadPack(slug)
  } catch (cause) {
    die(cause.message)
  }
  const guidance = loadGuidance()

  const passArgs = {
    pack,
    guidance,
    providerName,
    runId: opts['run-id'],
    policy: opts.policy,
  }

  if (flags.has('determinism-check')) {
    // D4 — two in-process passes, each with fresh storage and a fresh provider.
    const first = await onePass(passArgs)
    const second = await onePass(passArgs)
    const diff = firstDiff(first.record, second.record)
    if (diff !== null) die(`determinism check failed at ${diff}`)
    if (serializeRecord(first.record) !== serializeRecord(second.record)) {
      die('determinism check failed: records serialize differently at equal shape')
    }
    process.stdout.write(
      `✓ determinism: two passes of ${first.record.run_id} are byte-identical ` +
        `(${first.record.beats.length} beats, ${first.record.timeline.length} timeline lines)\n`,
    )
    return
  }

  const { record, meta } = await onePass(passArgs)

  if (flags.has('validate')) {
    const result = validateRunRecord(record)
    if (result.errors.length > 0 || result.unimplemented.length > 0) {
      die(`record does not conform to run-record.schema.json:\n${formatValidation(result)}`)
    }
    const metaResult = validateMetaState(meta)
    if (metaResult.errors.length > 0 || metaResult.unimplemented.length > 0) {
      die(`meta-state does not conform:\n${formatValidation(metaResult)}`)
    }
  }

  const outDir = opts.out ?? join(REPO, 'artifacts', 'runs')
  mkdirSync(outDir, { recursive: true })
  const recordPath = join(outDir, `${record.run_id}.json`)
  writeFileSync(recordPath, serializeRecord(record))
  if (flags.has('emit-meta')) {
    writeFileSync(join(outDir, `${record.run_id}.meta.json`), serializeRecord(meta))
  }

  process.stdout.write(
    `→ ${recordPath}\n` +
      `  ${record.beats.length} beats · reached ${record.reached_clock} · ` +
      `${record.timeline.length} timeline lines${flags.has('validate') ? ' · schema ok' : ''}\n`,
  )
}

if (import.meta.main) {
  try {
    await main(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`\n✗ ${error instanceof CliError ? error.message : error.stack}\n\n`)
    process.exit(1)
  }
}
