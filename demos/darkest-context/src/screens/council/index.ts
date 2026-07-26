// u11 — the 평의회 screen (PRD §2.6). Watching the party's values decide is the tile's
// whole point, so the screen is a READOUT, not a control surface:
//
//   · the authored agenda and its CLOSED option list are prose — no button, no role, no
//     tabindex, nothing a player can press to steer the debate;
//   · the hint 「번역 렌즈」 revealed is on screen BEFORE the round is asked to start;
//   · the only interactive element on the whole page is 계속.
//
// The screen renders what `runCouncil` returns and decides nothing itself. It pays out by
// ANNOUNCING: `council:grant` leaves as a bubbling event, and the draft/grant UI that
// consumes it belongs to another unit.

import { createBubble } from '../../ui/index.ts';
import '../../styles/council.css';

import { runCouncil } from '../../council/engine.ts';
import { revealHint } from '../../council/hint.ts';
import { createGrantEvent } from '../../council/outcome.ts';
import type { CouncilRoundInput } from '../../council/engine.ts';
import type { CouncilOutcome, CouncilStance, CouncilVote } from '../../council/types.ts';
import type { Agenda, Card } from '../../data/schema.ts';

export interface CouncilScreenOptions extends CouncilRoundInput {
  /** Fired when the party presses 계속. The tile never restarts the debate. */
  onDone?: () => void;
}

export interface CouncilScreen {
  element: HTMLElement;
  /**
   * Opens the ONE stance round. Idempotent: a second call is ignored, because a second
   * round does not exist.
   */
  start: () => void;
}

const TITLE = '평의회';
const DONE_LABEL = '계속';
/** Neutral copy for the branch that pays nothing — INV-7: never an apology, never a notice. */
const NOTHING_LINE = '일행은 그대로 길을 잇는다.';

function textOf(agenda: Agenda, optionId: string): string {
  return agenda.options.find((option) => option.id === optionId)?.text ?? optionId;
}

function nameOf(cards: readonly Card[], cardId: string): string {
  return cards.find((card) => card.id === cardId)?.name ?? cardId;
}

function renderOptions(agenda: Agenda): HTMLElement {
  const list = document.createElement('div');
  list.className = 'dc-council__options';

  for (const option of agenda.options) {
    // A plain div on purpose: the closed list is display, not a choice.
    const row = document.createElement('div');
    row.className = 'dc-council__option';
    row.dataset.testid = 'council-option';
    row.dataset.optionId = option.id;
    row.dataset.relatedStat = option.relatedStat;

    const text = document.createElement('span');
    text.className = 'dc-council__option-text';
    text.textContent = option.text;

    const stat = document.createElement('span');
    stat.className = 'dc-council__option-stat';
    stat.textContent = option.relatedStat;

    row.append(text, stat);
    list.append(row);
  }
  return list;
}

function renderStance(stance: CouncilStance): HTMLElement {
  const bubble = createBubble({
    unitId: stance.unitId,
    say: stance.say,
    because: stance.because,
  });
  bubble.dataset.testid = 'stance-bubble';
  // Absent, not empty: an abstention casts no ballot and claims no option.
  if (stance.optionId !== null) bubble.dataset.optionId = stance.optionId;
  return bubble;
}

function renderTally(agenda: Agenda, vote: CouncilVote, unitName: (id: string) => string): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'dc-council__tally';
  panel.dataset.testid = 'council-tally';
  panel.dataset.winningOptionId = vote.winningOptionId;
  panel.dataset.usedTiebreak = String(vote.usedTieBreak);
  if (vote.decidingUnitId !== null) panel.dataset.decidingUnitId = vote.decidingUnitId;

  for (const option of agenda.options) {
    const row = document.createElement('div');
    row.className = 'dc-council__count';
    row.dataset.optionId = option.id;
    row.dataset.votes = String(vote.tally[option.id] ?? 0);
    row.dataset.winner = String(option.id === vote.winningOptionId);

    const label = document.createElement('span');
    label.textContent = option.text;

    const count = document.createElement('span');
    count.textContent = String(vote.tally[option.id] ?? 0);

    row.append(label, count);
    panel.append(row);
  }

  if (vote.decidingUnitId !== null) {
    const note = document.createElement('p');
    note.className = 'dc-council__note';
    note.textContent = `${unitName(vote.decidingUnitId)}의 한 표가 결정을 갈랐다.`;
    panel.append(note);
  }
  return panel;
}

function renderOutcome(
  agenda: Agenda,
  cards: readonly Card[],
  outcome: CouncilOutcome,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'dc-council__outcome';
  panel.dataset.testid = 'council-outcome';
  panel.dataset.gaugeAll = String(outcome.gaugeAll);
  // Absent, not empty: this branch simply grants no card.
  if (outcome.cardId !== null) panel.dataset.cardId = outcome.cardId;

  const decision = document.createElement('p');
  decision.className = 'dc-council__note';
  decision.textContent = textOf(agenda, outcome.optionId);

  const reward = document.createElement('p');
  if (outcome.cardId !== null) {
    reward.textContent = `「${nameOf(cards, outcome.cardId)}」`;
  } else if (outcome.gaugeAll > 0) {
    reward.textContent = `일행 전원 +${outcome.gaugeAll}`;
  } else {
    reward.textContent = NOTHING_LINE;
  }

  panel.append(decision, reward);
  return panel;
}

export function createCouncilScreen(options: CouncilScreenOptions): CouncilScreen {
  const { agenda, units, cards, onDone } = options;

  const root = document.createElement('section');
  root.className = 'dc-council';
  root.dataset.testid = 'council-screen';
  root.dataset.agendaId = agenda.id;
  root.dataset.agendaKind = agenda.kind;

  const title = document.createElement('h2');
  title.className = 'dc-council__title';
  title.textContent = TITLE;

  const prompt = document.createElement('p');
  prompt.className = 'dc-council__prompt';
  prompt.dataset.testid = 'council-prompt';
  prompt.textContent = agenda.prompt;

  root.append(title, prompt);

  // Before anyone speaks: the clue the party already carries. Rendered only when a
  // council-hint card actually revealed one — never as an empty placeholder.
  const hint = revealHint(agenda, units, cards);
  if (hint !== null) {
    const line = document.createElement('p');
    line.className = 'dc-council__hint';
    line.dataset.testid = 'council-hint';
    line.dataset.cardId = hint.cardId;
    line.dataset.unitId = hint.unitId;
    line.textContent = hint.line;
    root.append(line);
  }

  root.append(renderOptions(agenda));

  const stanceList = document.createElement('div');
  stanceList.className = 'dc-council__stances';
  root.append(stanceList);

  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'dc-council__done';
  done.dataset.testid = 'council-done';
  done.textContent = DONE_LABEL;
  done.addEventListener('click', () => {
    onDone?.();
  });
  root.append(done);

  const nameOfUnit = (unitId: string): string =>
    units.find((unit) => unit.id === unitId)?.name ?? unitId;

  let opened = false;

  async function run(): Promise<void> {
    const round = await runCouncil(options);
    for (const stance of round.stances) {
      stanceList.append(renderStance(stance));
    }
    // The tally lands after every bubble, and the outcome after the tally: a reader
    // watching the page never sees a verdict before the stances that produced it.
    done.before(renderTally(agenda, round.vote, nameOfUnit));
    done.before(renderOutcome(agenda, cards, round.outcome));
    root.dispatchEvent(createGrantEvent(round.outcome));
  }

  return {
    element: root,
    start: (): void => {
      if (opened) return;
      opened = true;
      void run();
    },
  };
}
