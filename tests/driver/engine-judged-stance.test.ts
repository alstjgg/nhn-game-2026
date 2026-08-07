// [u52b] — the `report` event carries the judged stance in the author's words
// (`judged?: { stance_id, desc, cited_ids }`), desc sourced from the PACK's
// stances, never from model output. A fallback round carries the DEFAULT
// stance's desc and an empty citation. [u52b+] — `cited_ids` is the judgment's
// `because_block_ids` filtered to ids the player DEPLOYED: the model selects
// among the player's own blocks and cannot mint an id onto the seam.
import { describe, it, expect } from 'vitest'
import { drain, failingTransport, makeRig, sentinelJudgment } from './engine-fixtures/rig.ts'

describe('[u52b] the report event carries the judged stance', () => {
  it('(a) a judged round: the chosen stance, desc from the pack, nothing cited when nothing was deployed', async () => {
    const rig = makeRig({ responses: { judgment: { ...sentinelJudgment(), stance: 'escalate' } } })
    const events = await drain(rig)
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    expect(reports[0]?.judged).toEqual({ stance_id: 'escalate', desc: 'b-desc', cited_ids: [] })
  })

  it('(b) a fallback round: the default stance, desc from the pack, empty citation', async () => {
    const events = await drain(makeRig({ transport: failingTransport('judgment') }))
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    expect(reports[0]?.judged).toEqual({ stance_id: 'hold', desc: 'a-desc', cited_ids: [] })
  })

  it('(c) cited_ids keeps only deployed ids — a model-minted id never crosses the seam', async () => {
    const rig = makeRig({
      responses: {
        judgment: {
          ...sentinelJudgment(),
          stance: 'escalate',
          because_block_ids: ['b-r1-f01', 'SENTINEL-BECAUSE-BLOCK-ID'],
        },
      },
    })
    rig.blocks.absorbSentences({
      facts: [{ id: 'b-r1-f01', text: '창고 문이 열려 있었다.', species: 'fact' }],
      report_body: [],
    })
    expect(rig.blocks.mine('b-r1-f01')).toBe(true)
    expect(rig.driver.submit({ op: 'deploy', blocks: ['b-r1-f01'] })).toEqual({ ok: true })
    const events = await drain(rig)
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports[0]?.judged).toEqual({
      stance_id: 'escalate',
      desc: 'b-desc',
      cited_ids: ['b-r1-f01'],
    })
  })
})
