// The primitive barrel — the one path every later screen unit imports.
//
// Importing this module also installs the whole style layer, in the order the
// cascade needs it:
//
//   base.css       u1's ground tone (untouched here — only consumed)
//   tokens.css     tints · gauge tiers · motion · the pixel-pipeline token
//   animations.css the named animation vocabulary (attach `.anim-*`, never redefine)
//   slots.css      the asset-slot seam (`--slot-*` custom properties, CSS-only fallbacks)
//   ui.css         the component classes — last, so a component wins the tie
//                  against the asset-slot class it sits on
//
// A screen unit therefore writes `import { createCard } from '../ui/index.ts'` and
// gets a styled, animated, asset-ready primitive with no second import to remember.

import '../styles/base.css';
import '../styles/tokens.css';
import '../styles/animations.css';
import '../styles/slots.css';
import '../styles/ui.css';

export { CARD_TYPES, VIAL_STATES, isCardType, isUnitSide, isVialState } from './types.ts';
export type {
  CardType,
  SheetItem,
  SheetItemKind,
  UnitSide,
  UnitView,
  VialState,
} from './types.ts';

export { createStage } from './stage.ts';
export type { StageOptions } from './stage.ts';

export { createUnitPanel, createUnitSheet } from './unit.ts';
export type { UnitPanelOptions, UnitSheetOptions } from './unit.ts';

export { createBubble } from './bubble.ts';
export type { BubbleOptions } from './bubble.ts';

export { createCard } from './card.ts';
export type { CardOptions } from './card.ts';

export { createVial, vialStateForGauge } from './vial.ts';
export type { GaugeThresholds, VialOptions } from './vial.ts';
