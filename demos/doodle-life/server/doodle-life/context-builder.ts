import type { ModelInputContent } from '../ai/provider.ts'
import type {
  DoodleReadingRequest,
  DoodleResident,
  PublicDoodleReading,
  QuestPublicView,
  QuestResolutionView,
} from '../../src/doodle-life/contracts.ts'

export function worldAuthorInput(sessionId: string): readonly ModelInputContent[] {
  return [{
    type: 'input_text',
    text: JSON.stringify({
      locale: 'ko-KR',
      deterministicSeed: sessionId,
      gardenCount: 1,
      residentCount: 3,
      questCount: 3,
      desiredTone: '종이 위에서 자라는 작고 따뜻한 관찰 퍼즐',
    }),
  }]
}

/**
 * Deliberately accepts no quest argument. This makes leaking quest truth into
 * the VLM prompt structurally difficult rather than relying on prompt wording.
 */
export function questBlindDoodleInput(
  request: Pick<DoodleReadingRequest, 'image' | 'drawingMetrics'>,
): readonly ModelInputContent[] {
  return [
    {
      type: 'input_text',
      text: JSON.stringify({
        image: {
          mimeType: request.image.mimeType,
          width: request.image.width,
          height: request.image.height,
          sha256: request.image.sha256,
        },
        drawingMetrics: request.drawingMetrics,
        coordinateConvention: 'normalized bounding rectangles relative to the attached cropped image',
      }),
    },
    { type: 'input_image', image_url: request.image.dataUrl, detail: 'high' },
  ]
}

export interface ReactionContext {
  readonly actor: DoodleResident
  readonly owner: DoodleResident
  readonly observer: DoodleResident
  readonly quest: QuestPublicView
  readonly reading: PublicDoodleReading
  readonly result: QuestResolutionView
  readonly creatureId: string
  readonly allowedPropIds: readonly string[]
}

export function reactionInput(context: ReactionContext): readonly ModelInputContent[] {
  return [{
    type: 'input_text',
    text: JSON.stringify({
      actor: {
        id: context.actor.id,
        name: context.actor.name,
        epithet: context.actor.epithet,
        essence: context.actor.essence,
        voiceStyle: context.actor.voiceStyle,
        repeatedBehavior: context.actor.repeatedBehavior,
      },
      participants: [
        { id: context.owner.id, name: context.owner.name, role: 'request-owner' },
        { id: context.observer.id, name: context.observer.name, role: 'observer' },
        { id: context.creatureId, name: context.reading.name, role: 'new-doodle-creature' },
      ],
      publicProblem: {
        title: context.quest.title,
        problemState: context.quest.problemState,
        observationFocus: context.quest.clues.observationFocus,
      },
      doodle: context.reading,
      fixedResult: {
        verdict: context.result.verdict,
        summary: context.result.summary,
        questResolved: context.result.questResolved,
        appliedEffectDescriptions: context.result.appliedEffects.map((effect) => (
          effect.kind === 'relationship-record' ? effect.summary : effect.description
        )),
      },
      allowedPropIds: context.allowedPropIds,
      allowedParticipantIds: [context.owner.id, context.observer.id, context.creatureId],
    }),
  }]
}
