// u14 — the words a fork card wears (PRD §2.4's branch card pair).
//
// A destination tile is an id in the FSM and a PLACE to the player, so the copy
// lives with the screen that shows it, keyed by the authored tile kind. Ids stay
// ascii; every display string here is Korean, exactly as PRD §3 requires.

import type { Tile, TileKind } from '../../data/schema.ts';

export const TILE_KIND_LABELS: Record<TileKind, string> = {
  combat: '전투',
  combat_final: '최종 전투',
  training: '훈련장',
  puzzle: '퍼즐',
  choice: '선택 이벤트',
  rest: '휴식',
};

/**
 * Builds the `branchLabel` a stage screen takes: tile id → what that path is.
 * An id the map does not carry falls back to the id itself, so an unknown fork
 * still renders a pressable card instead of a blank one (INV-7).
 */
export function branchLabelFor(tiles: readonly Tile[]): (tileId: string) => string {
  const byId = new Map(tiles.map((tile) => [tile.id, tile]));
  return (tileId: string): string => {
    const tile = byId.get(tileId);
    return tile === undefined ? tileId : TILE_KIND_LABELS[tile.kind];
  };
}
