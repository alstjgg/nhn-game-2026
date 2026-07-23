import { describe, expect, it } from 'vitest'

import { questBlindDoodleInput, reactionInput } from './context-builder.ts'
import { tutorialGarden, tutorialReading } from './tutorial-fixture.ts'
import { applyResolution, evaluateQuest } from './quest-engine.ts'
import { toPublicReading, toQuestPublicView } from '../../src/doodle-life/contracts.ts'

describe('bounded model contexts', () => {
  it('makes the VLM payload structurally quest-blind', () => {
    const payload = questBlindDoodleInput({
      image: {
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mimeType: 'image/png',
        width: 320,
        height: 240,
        sha256: 'sentinel-image-sha',
      },
      drawingMetrics: null,
    })
    const serialized = payload[0]?.type === 'input_text' ? payload[0].text : ''
    expect(serialized).toContain('sentinel-image-sha')
    for (const secret of [
      'quest_soso_last_note',
      'primarySolutions',
      'bonusSolutions',
      'partialAffordances',
      'acceptedAffordances',
      '높은 리본 풍경',
      'carry_signal',
    ]) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('gives reactions only public problem data and the fixed result', () => {
    const garden = tutorialGarden()
    const quest = garden.quests[0]
    const owner = garden.world.residents[0]
    const observer = garden.world.residents[1]
    if (!quest || !owner || !observer) throw new Error('tutorial fixture incomplete')
    const reading = tutorialReading('success')
    const resolution = evaluateQuest(quest, reading, 'doodle_context')
    const applied = applyResolution(garden.world, quest, reading, 'context-sha', resolution)
    const payload = reactionInput({
      actor: owner,
      owner,
      observer,
      quest: toQuestPublicView(quest, 'active'),
      reading: toPublicReading(reading),
      result: applied.view,
      creatureId: resolution.creatureId,
      allowedPropIds: ['far_bell'],
    })
    const serialized = payload[0]?.type === 'input_text' ? payload[0].text : ''
    expect(serialized).toContain('"verdict":"success"')
    expect(serialized).not.toContain('primarySolutions')
    expect(serialized).not.toContain('bonusSolutions')
    expect(serialized).not.toContain('partialAffordances')
  })
})
