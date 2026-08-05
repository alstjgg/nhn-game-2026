// The live adapter's RUN TRANSITION — the one seam the suite could not see.
//
// `e2e/` drives the DEV fixture loop (`demoRunLoop`), and `preview-smoke` proves
// the live desk boots and carries feed lines. Neither reaches
// `send({op:'new_run'})` on the live adapter, and both defects this file pins
// lived exactly there: a spent allotment acked as `ok`, and a store snapshot
// that outlived the run it described.
//
// A stubbed `LiveDriver` rather than an e2e: the adapter's contract is with the
// driver interface, and the transition is a state machine that needs no browser
// and no model. That is also why this stayed cheap enough to be worth writing.
import { describe, it, expect } from 'vitest'
import { createLiveAdapter } from '../../src/client/driver/live/adapter.ts'
import type { BoundRun, RunClose } from '../../src/client/driver/live/adapter.ts'
import type { Block } from '../../src/shared/contracts.ts'

/**
 * A `LiveDriver` that produces no beats and accepts every op, holding `blocks`
 * as its store. `bindLiveRun` seeds a real run's store with exactly the carried
 * blocks, so a stub whose store is the carried set is the honest shape.
 */
function stubRun(run: number, blocks: readonly Block[]): BoundRun {
  const store = new Map(blocks.map((b) => [b.id, b]))
  return {
    start: '08:50',
    end: '21:04',
    meta: { type: 'meta', run, runs_left: 2 - run, carried: blocks.map((b) => b.id), archive: [] } as never,
    driver: {
      step: async () => false,
      subscribe: () => () => {},
      submit: () => ({ ok: true }),
      blocks: () => ({ get: (id: string) => store.get(id) }),
    } as never,
  }
}

const B1: Block = { id: 'b-r1-b01', text: 'one' }
const B2: Block = { id: 'b-r1-b02', text: 'two' }

/** Lets the `void rebuild()` inside `send()` settle. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

describe('the live adapter refuses `new_run` the way the fixture loop does', () => {
  it('(a) a spent allotment is refused IN THE ACK, not after the promise settles', async () => {
    const adapter = createLiveAdapter({
      first: stubRun(1, []),
      canOpenNext: () => false,
      closeRun: () => {},
      next: async () => null,
    })
    adapter.start()

    // `windows/tally.ts` disables NEW RUN before sending and prints SPENT only
    // on `ok:false`, so an `ok` here is a dead button under a sheet that never
    // closes — and no announcement for an operator driving the desk by ear.
    expect(adapter.send({ op: 'new_run' } as never)).toEqual({ ok: false })
  })

  it('(b) a day that CAN open is acked, and the run actually turns', async () => {
    const adapter = createLiveAdapter({
      first: stubRun(1, []),
      canOpenNext: () => true,
      closeRun: () => {},
      next: async () => stubRun(2, []),
    })
    adapter.start()

    expect(adapter.send({ op: 'new_run' } as never)).toEqual({ ok: true })
    await settle()
  })

  it('(c) a second `new_run` mid-rebuild is refused rather than opening two days', async () => {
    let opened = 0
    const adapter = createLiveAdapter({
      first: stubRun(1, []),
      canOpenNext: () => true,
      closeRun: () => {},
      next: async () => {
        opened += 1
        await settle()
        return stubRun(2, [])
      },
    })
    adapter.start()

    expect(adapter.send({ op: 'new_run' } as never)).toEqual({ ok: true })
    expect(adapter.send({ op: 'new_run' } as never)).toEqual({ ok: false })
    await settle()
    await settle()
    expect(opened).toBe(1)
  })

  it('(f) the refused day still CLOSES — the last run of a sitting is recorded', async () => {
    const closes: RunClose[] = []
    const adapter = createLiveAdapter({
      first: stubRun(1, [B1]),
      canOpenNext: () => false,
      next: async () => null,
      closeRun: (close) => closes.push(close),
    })
    adapter.start()
    adapter.send({ op: 'mine', sentence_id: B1.id } as never)
    adapter.send({ op: 'deploy', blocks: [B1.id] } as never)

    // `next()` is the only other route to the run loop's `endRun`, and (a)'s
    // refusal returns before `rebuild()` can reach it — so the final run of a
    // sitting left no archive entry, no carry-over and no deepened exposure
    // clock. The refusal is the DESK's answer; the day ended either way.
    expect(adapter.send({ op: 'new_run' } as never)).toEqual({ ok: false })
    expect(closes).toHaveLength(1)
    expect(closes[0].carried).toEqual([B1])

    // Once. The sheet stays open and the desk keeps answering the op under it.
    expect(adapter.send({ op: 'new_run' } as never)).toEqual({ ok: false })
    expect(closes).toHaveLength(1)
  })
})

describe('the store the desk shows is the store the new run has', () => {
  it('(d) a new run clears the board and deals exactly the carried deck', async () => {
    const adapter = createLiveAdapter({
      first: stubRun(1, [B1, B2]),
      canOpenNext: () => true,
      closeRun: () => {},
      // Only B1 was deployed, so only B1 is seeded into the next run.
      next: async () => stubRun(2, [B1]),
    })
    adapter.start()

    adapter.send({ op: 'mine', sentence_id: B1.id } as never)
    adapter.send({ op: 'mine', sentence_id: B2.id } as never)
    adapter.send({ op: 'slot', block_id: B1.id, slot: 2 } as never)
    adapter.send({ op: 'deploy', blocks: [B1.id] } as never)
    expect(adapter.store()).toEqual({
      mined: [B1.id, B2.id],
      slots: { 2: B1.id },
      deployed: [B1.id],
    })

    adapter.send({ op: 'new_run' } as never)
    await settle()

    // The deck is the carry-over and nothing else; the board is empty because a
    // new day has not been built yet (`SlotBoard.unlock()` assumes exactly this).
    // A slot surviving here drew a card the deck no longer listed.
    expect(adapter.store()).toEqual({ mined: [B1.id], slots: {}, deployed: [] })
  })

  it('(e) the carry-over handed to `next()` is what was DEPLOYED, resolved to text', async () => {
    let seen: RunClose | null = null
    const adapter = createLiveAdapter({
      first: stubRun(1, [B1, B2]),
      canOpenNext: () => true,
      closeRun: () => {},
      next: async (close) => {
        seen = close
        return stubRun(2, [B2])
      },
    })
    adapter.start()

    adapter.send({ op: 'mine', sentence_id: B1.id } as never)
    adapter.send({ op: 'mine', sentence_id: B2.id } as never)
    // B1 was mined and looked at; only B2 was deployed.
    adapter.send({ op: 'deploy', blocks: [B2.id] } as never)
    adapter.send({ op: 'new_run' } as never)
    await settle()

    expect(seen).not.toBeNull()
    expect(seen!.carried).toEqual([B2])
    expect(seen!.reachedClock).toMatch(/^\d{2}:\d{2}$/)
    expect(adapter.store().mined).toEqual([B2.id])
  })
})
