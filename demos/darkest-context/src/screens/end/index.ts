// u14 — the two terminal screens (PRD §2.5): run clear at T7, defeat when every
// hero is at 0 HP. One module, because they differ only in copy and in the
// `data-result` they publish — the shape, the 재시작 affordance and the membrane
// rule (INV-1: a click target, never a form control) are identical.
//
// The screen decides nothing about the run: WHICH result it shows is handed in,
// and 재시작 is reported upward rather than performed here.

export type EndResult = 'clear' | 'defeat';

interface EndCopy {
  readonly title: string;
  readonly sentence: string;
}

const END_COPY: Record<EndResult, EndCopy> = {
  clear: {
    title: '던전 답파',
    sentence: '마지막 방의 불이 꺼졌다. 셋 다, 걸어서 나왔다.',
  },
  defeat: {
    title: '전멸',
    sentence: '아무도 다음 방까지 가지 못했다.',
  },
};

const RESTART_LABEL = '재시작';

export interface EndScreenOptions {
  readonly result: EndResult;
  readonly onRestart?: () => void;
}

export function createEndScreen(options: EndScreenOptions): HTMLElement {
  const { result, onRestart } = options;
  const copy = END_COPY[result];
  if (copy === undefined) {
    throw new TypeError(`unknown end result: ${String(result)} (expected clear | defeat)`);
  }

  const screen = document.createElement('section');
  screen.className = `dc-end dc-end--${result} anim-phase-fade`;
  screen.dataset.testid = 'end-screen';
  screen.dataset.result = result;

  const title = document.createElement('h2');
  title.className = 'dc-end__title';
  title.textContent = copy.title;

  const sentence = document.createElement('p');
  sentence.className = 'dc-end__sentence';
  sentence.textContent = copy.sentence;

  const restart = document.createElement('button');
  restart.type = 'button';
  restart.className = 'dc-end__restart';
  restart.dataset.testid = 'restart';
  restart.textContent = RESTART_LABEL;
  restart.addEventListener('click', () => {
    onRestart?.();
  });

  screen.append(title, sentence, restart);
  return screen;
}
