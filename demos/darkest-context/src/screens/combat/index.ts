// u10 — the 전투 screen barrel. One import path for the render surface, the
// sequential player that feeds it, and the sheet builder that keeps attribution
// resolvable on both sides (INV-3).

export { buildHeroSheet, statItemId } from './sheet.ts';
export type { HeroSheet } from './sheet.ts';

export { createCombatScreen, SPRITE_ACTIONS } from './screen.ts';
export type {
  CombatBeat,
  CombatScreen,
  CombatScreenOptions,
  SpriteAction,
} from './screen.ts';

export {
  COMBAT_DEFEAT_EVENT,
  COMBAT_VICTORY_EVENT,
  createCombatPlayer,
  createOverloadFallback,
  createRecordingAdapter,
  SUPPRESSED_BUCKET,
} from './player.ts';
export type {
  CombatDamageRecord,
  CombatDecisionRecord,
  CombatDefeatDetail,
  CombatFixture,
  CombatHandoff,
  CombatPlayer,
  CombatPlayerOptions,
  CombatTurnRecord,
  CombatVictoryDetail,
  GaugeReader,
  OverloadFallbackOptions,
  OverloadRow,
  RecordedAsk,
  RecordingAdapter,
} from './player.ts';
