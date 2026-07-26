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
 * What that path will ASK of the party — one line per destination kind.
 *
 * The fork is the only decision the run puts in the player's hands, and both cards used
 * to print the same sentence under different titles, so the choice read as an unfinished
 * screen. A card now says what it costs or offers before it is pressed.
 */
export const TILE_KIND_SENTENCES: Record<TileKind, string> = {
  combat: '길목을 지키는 적과 정면으로 부딪힌다.',
  combat_final: '마지막 하나가 기다린다 — 여기서 끝낸다.',
  training: '훈련장에서 카드를 한 장 챙긴다.',
  puzzle: '골렘의 수수께끼에 답한다 — 틀리면 모두의 컨텍스트가 오른다.',
  choice: '길가에 쓰러진 사람이 있다 — 구할지 지나칠지 정한다.',
  rest: '잠시 숨을 고르고 컨텍스트를 덜어낸다.',
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

/**
 * Builds the `branchSentence` a stage screen takes: tile id → what that path asks.
 * An id the map does not carry falls back to the neutral sentence, so an unknown fork
 * still renders a readable card rather than an empty one (INV-7).
 */
export function branchSentenceFor(tiles: readonly Tile[]): (tileId: string) => string {
  const byId = new Map(tiles.map((tile) => [tile.id, tile]));
  return (tileId: string): string => {
    const tile = byId.get(tileId);
    return tile === undefined ? BRANCH_FALLBACK_SENTENCE : TILE_KIND_SENTENCES[tile.kind];
  };
}

/** What a fork card says when the map has nothing to say about its destination. */
export const BRANCH_FALLBACK_SENTENCE = '이 길로 간다.';
