// The run loop across `new_run` — what survives the swap and what the ids say.
//
// Added 08-05 for the four correctness defects the final-PR review proved with
// repros (R3 on `driver/run-loop.ts:115`, `shell/boot.ts:109`,
// `windows/tally.ts:106`, `driver/fixtures/run-loop.ts:36`). None of them was
// covered: `e2e/run-loop.spec.ts` never mines and then opens the next day, and
// `tests/driver/*` only ever exercised a single run's store.
//
// vitest runs `environment: 'node'`, so everything below is driver-level — no
// document, no window. The desk-level half rides `e2e/run-loop.spec.ts`.
import { describe, expect, it } from 'vitest'
import { createRunLoopDriver, openingRun } from '../../src/client/driver/run-loop.ts'
import { woodariRunLoop } from '../../src/client/driver/fixtures/run-loop.ts'
import type { FixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import type { ViewEvent } from '../../src/shared/view-driver.ts'

/** A booted loop driver, opened at its head unless a run is named. */
function booted(openAt?: number): FixtureDriver {
  const driver = createRunLoopDriver(woodariRunLoop, openAt === undefined ? {} : { openAt })
  driver.start()
  driver.advance(0)
  driver.drain()
  return driver
}

/** The `meta` events the desk has seen, newest last. */
function metas(driver: FixtureDriver): Extract<ViewEvent, { type: 'meta' }>[] {
  return driver.frame().events.filter((e): e is Extract<ViewEvent, { type: 'meta' }> => e.type === 'meta')
}

const lastMeta = (driver: FixtureDriver): Extract<ViewEvent, { type: 'meta' }> => {
  const seen = metas(driver)
  const last = seen[seen.length - 1]
  expect(last, 'the loop emitted no meta at all').toBeTruthy()
  return last!
}

/** Every `sentence_id` the current day has handed out, in stream order. */
function mintedIds(driver: FixtureDriver, since: number): string[] {
  return driver
    .frame()
    .events.slice(since)
    .flatMap((e) => (e.type === 'feed' && e.line.sentence_id !== undefined ? [e.line.sentence_id] : []))
}

describe('run loop — the operator’s meta-state survives `new_run`', () => {
  it('(a) mined blocks and slotted seats carry into the next day', () => {
    const driver = booted()
    const id = mintedIds(driver, 0)[0]
    expect(id, 'the demo day minted no minable line').toBeTruthy()

    driver.send({ op: 'mine', sentence_id: id! })
    driver.send({ op: 'slot', block_id: id!, slot: 0 })
    expect(driver.store()).toEqual({ mined: [id], slots: { 0: id }, deployed: [] })

    expect(driver.send({ op: 'new_run' }).ok).toBe(true)
    expect(driver.store().mined, 'the block the operator mined was deleted by the next day').toEqual([id])
    expect(driver.store().slots, 'the slot board and the driver disagree after `new_run`').toEqual({ 0: id })
  })

  it('(b) a deploy does NOT carry — the new day has not been deployed yet', () => {
    const driver = booted()
    const id = mintedIds(driver, 0)[0]!
    driver.send({ op: 'mine', sentence_id: id })
    driver.send({ op: 'deploy', blocks: [id] })
    expect(driver.store().deployed).toEqual([id])
    driver.send({ op: 'new_run' })
    expect(driver.store().deployed).toEqual([])
  })
})

describe('run loop — a minted id names the run that handed it out', () => {
  it('(c) the day after RUN 03 mints on its own run prefix, and `t*` ids are untouched', () => {
    const driver = booted()
    const opening = lastMeta(driver).run
    const before = driver.frame().events.length
    driver.send({ op: 'new_run' })
    driver.drain()

    const ids = mintedIds(driver, before)
    expect(ids.length, 'the next day handed out no id at all').toBeGreaterThan(0)
    const run = lastMeta(driver).run
    expect(run).toBe(opening + 1)

    const foreign = ids.filter((id) => /^b-r\d+-/.test(id) && !id.startsWith(`b-r${run}-`))
    expect(foreign, 'a minted id names a run other than the one that handed it out').toEqual([])
    // Authored script ids are run-independent by contract — they must NOT move.
    const authored = ids.filter((id) => /^t\d+$/.test(id))
    expect(authored.length, 'the day carries no authored `t*` line — the check is vacuous').toBeGreaterThan(0)
  })

  it('(d) a carried block names the day it was harvested from', () => {
    const driver = booted()
    driver.send({ op: 'new_run' })
    driver.drain()
    driver.send({ op: 'new_run' })
    driver.drain()
    const meta = lastMeta(driver)
    const harvested = meta.carried.filter((id) => /^b-r([3-9]|\d\d)-/.test(id))
    expect(harvested.length, 'no block was carried out of the finished days').toBeGreaterThan(1)
    expect(new Set(harvested).size, 'two runs handed back the same block id').toBe(harvested.length)
  })
})

describe('run loop — the allotment the desk advertises is the allotment it can open', () => {
  it('(e) `runs_left` never out-counts the days the driver will still open', () => {
    const driver = booted()
    for (;;) {
      const meta = lastMeta(driver)
      const response = driver.send({ op: 'new_run' })
      if (!response.ok) {
        expect(meta.runs_left, 'the desk offered a day the driver refused to open').toBe(0)
        break
      }
      expect(meta.runs_left, 'the driver opened a day the desk said was spent').toBeGreaterThan(0)
      driver.drain()
    }
  })
})

describe('run loop — a refresh re-opens the day it left off at', () => {
  it('(f) `openAt` opens the loop on the run whose `meta` names it', () => {
    const target = openingRun(woodariRunLoop[2]!)
    expect(target, 'the loop’s third day carries no opening meta').toBeTruthy()
    const driver = booted(target!)
    expect(lastMeta(driver).run).toBe(target)
  })

  it('(g) an unknown run degrades to a cold boot at the head of the loop', () => {
    const head = openingRun(woodariRunLoop[0]!)
    expect(lastMeta(booted(9999)).run).toBe(head)
  })
})
