// TDD-Red gate for u10 AC3d / AC5a — the frozen surfaces around the conversation
// screen. Two invariants the multiverb refactor must not quietly break:
//
//   1. `ConversationCallbacks` still declares EXACTLY `onPhaseChange` +
//      `onComplete` (F7) — the craft card reuses `onComplete`, it does not earn
//      a new hook. App-shell wiring (handing in a real adapter) is u13's.
//   2. The mount signature grows only additively (S8) — `src/app/index.ts` keeps
//      compiling and behaving identically WITHOUT u10 editing it, so that file
//      must not appear in this unit's diff.
//
// `vitest.config.ts` is `environment: 'node'` (frozen, spec N1), so these are
// source-text/structural checks by necessity; the behavioural proof that the
// craft card fires `onComplete` exactly once lives in `e2e/conversation.spec.ts`.
//
// RED until `conversation.ts` grows the additive `options` parameter and the
// verb dispatch: the S8/S2b assertions below read the current file and fail.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CONVO_REL = 'src/screens/conversation/conversation.ts';
const APP_REL = 'src/app/index.ts';
const APP_REPO_REL = 'demos/apothecary/src/app/index.ts';

const read = (rel: string): string =>
  readFileSync(new URL(`../../../${rel}`, import.meta.url), 'utf8');

// (The git helper this file used for its branch-diff receipt went with the
// assertion u14 retired — the remaining checks are all source-text reads.)

/** Body of `export interface <name> { … }`, brace-matched. */
function interfaceBody(src: string, name: string): string {
  const start = src.indexOf(`export interface ${name}`);
  expect(start, `interface ${name} not found`).toBeGreaterThan(-1);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated interface ${name}`);
}

/** Member names of an interface body, comments stripped. */
function members(body: string): string[] {
  const code = body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  return [...code.matchAll(/^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*\??\s*[:(]/gm)].map(
    (m) => m[1],
  );
}

describe('AC3d — ConversationCallbacks is frozen (F7)', () => {
  it('declares exactly onPhaseChange and onComplete', () => {
    const found = members(interfaceBody(read(CONVO_REL), 'ConversationCallbacks'));
    expect(new Set(found)).toEqual(new Set(['onPhaseChange', 'onComplete']));
    expect(found, 'a callback was declared twice').toHaveLength(2);
  });

  it('keeps both callbacks optional (call sites may pass neither)', () => {
    const body = interfaceBody(read(CONVO_REL), 'ConversationCallbacks');
    expect(/onPhaseChange\s*\?\s*:/.test(body), 'onPhaseChange is no longer optional').toBe(true);
    expect(/onComplete\s*\?\s*:/.test(body), 'onComplete is no longer optional').toBe(true);
  });

  it('grows no craft-specific hook (the craft card reuses onComplete)', () => {
    const body = interfaceBody(read(CONVO_REL), 'ConversationCallbacks');
    expect(/onCraft|onGoCraft|onObserve|onBeat/.test(body)).toBe(false);
  });
});

describe('S8 — the mount signature is additive only', () => {
  it('declares an optional ConversationOptions parameter', () => {
    const src = read(CONVO_REL);
    expect(/export interface ConversationOptions/.test(src)).toBe(true);
    const optionMembers = members(interfaceBody(src, 'ConversationOptions'));
    expect(new Set(optionMembers)).toEqual(new Set(['beatSource', 'adapter']));
    // `options` is the 4th parameter and it is optional / defaulted.
    expect(
      /options\s*(\?\s*)?:\s*ConversationOptions\s*(=\s*\{\s*\})?\s*,?\s*\)/.test(src),
      'mountConversation has no optional ConversationOptions parameter',
    ).toBe(true);
  });

  it('keeps callbacks defaulted so 2-argument calls still compile', () => {
    expect(/callbacks\s*(\?\s*)?:\s*ConversationCallbacks\s*=\s*\{\s*\}/.test(read(CONVO_REL))).toBe(
      true,
    );
  });
});

describe('S2b — patienceCost is no longer an identity test', () => {
  const code = (): string =>
    read(CONVO_REL)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('never compares patienceCost to identify a verb', () => {
    expect(
      /patienceCost\s*(===|==|>|<|>=|<=|!==|!=)/.test(code()),
      'a patienceCost comparison still stands in for a verb check (S2b)',
    ).toBe(false);
  });

  it('dispatches on verb instead', () => {
    expect(/\.verb\b/.test(code()), 'conversation.ts never reads choice.verb').toBe(true);
  });

  it('keeps patienceCost only as the reducer’s arithmetic input', () => {
    const hits = [...code().matchAll(/patienceCost/g)].length;
    expect(hits, 'patienceCost is referenced more than once outside reduce()').toBeLessThanOrEqual(
      1,
    );
    expect(/cost:\s*[A-Za-z_$][\w$.]*\.patienceCost/.test(code())).toBe(true);
  });
});

describe('AC3d/AC5a — the conversation screen’s front door is the only way in', () => {
  // u14 (final integration): this was a git-diff receipt ("u10 did not touch the
  // file u13 owns"), and u13 has now rewired that file on purpose — a branch-diff
  // assertion cannot survive the merge it was waiting for. What it was really
  // protecting is that the shell may not reach PAST the screen's front door into
  // u10's internals, so that is asserted directly on the wiring file instead. The
  // mount-signature half below is untouched.
  it('lets the app shell import the conversation only through conversation.ts', () => {
    const src = read(APP_REL);
    const imports = [...src.matchAll(/from\s*'([^']*screens\/conversation\/[^']*)'/g)].map(
      (m) => m[1],
    );
    expect(imports.length, `${APP_REPO_REL} imports no conversation module at all`).toBeGreaterThan(
      0,
    );
    for (const specifier of imports) {
      expect(specifier, 'the shell reached past conversation.ts into u10’s internals').toMatch(
        /screens\/conversation\/conversation\.ts$/,
      );
    }
  });

  it('leaves the app-shell mount calls at 3 arguments (no options passed yet)', () => {
    const src = read(APP_REL);
    expect(/mountConversation\(/.test(src)).toBe(true);
    expect(/beatSource|createBeatSource|createStubAdapter|createBootAdapter/.test(src)).toBe(false);
  });
});
