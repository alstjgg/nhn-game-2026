// Renderer-facing response gates shared by authored and Lambda-backed dialogue.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isDialogueBeat, isPortraitSheet, portraitSrc } from '../../src/ai/contract';
import type { DialogueBeat, PortraitSheet } from '../../src/ai/contract';
import { proxyDialoguePayload, proxyPortraitPayload } from './fixtures';

describe('isDialogueBeat enforces the Lambda dialogue contract', () => {
  it('accepts the four-card beat emitted by the Lambda', () => {
    expect(isDialogueBeat(proxyDialoguePayload())).toBe(true);
  });

  it('requires exactly four cards', () => {
    const payload = proxyDialoguePayload() as DialogueBeat;
    payload.choices.splice(3, 1);
    expect(isDialogueBeat(payload)).toBe(false);
  });

  it('still rejects the v1 customers.json dialogueNodes shape (2 cards, no verb)', () => {
    expect(
      isDialogueBeat({
        npcLine: '며칠째 통 잠을 이루지 못했어요.',
        choices: [
          { label: '무엇이 잠을 방해하나요?', patienceCost: 1 },
          { label: '[관찰] 손님의 얼굴빛을 살핀다', patienceCost: 0 },
        ],
      }),
    ).toBe(false);
  });

  it('requires each registered verb exactly once', () => {
    const duplicated = proxyDialoguePayload() as DialogueBeat;
    duplicated.choices[0] = {
      label: '또 바로 묻는다',
      verb: 'direct',
      patienceCost: 2,
    };
    expect(isDialogueBeat(duplicated)).toBe(false);
  });

  it('rejects malformed beats', () => {
    expect(isDialogueBeat(null)).toBe(false);
    expect(isDialogueBeat({ npcLine: '', choices: [] })).toBe(false);
    const badVerb = proxyDialoguePayload() as DialogueBeat;
    (badVerb.choices[0] as { verb: string }).verb = 'shout';
    expect(isDialogueBeat(badVerb)).toBe(false);
    const tooMany = proxyDialoguePayload() as DialogueBeat;
    tooMany.choices.push({ label: '다섯째', verb: 'direct', patienceCost: 2 });
    expect(isDialogueBeat(tooMany)).toBe(false);
  });
});

// ── AC11 — portraitSrc covers both modes ───────────────────────────────────
describe('AC11 portraitSrc is the one way to build an <img> src', () => {
  it('prefers the bundled url (stub mode)', () => {
    const sheet: PortraitSheet = { b64: '', prompt: 'p', url: '/assets/fallback-portrait-1.png' };
    expect(portraitSrc(sheet)).toBe('/assets/fallback-portrait-1.png');
    expect(portraitSrc(sheet)).toMatch(/fallback-portrait-[12]\.png/);
  });

  it('falls back to a base64 data URI for a compatible inline payload (no url)', () => {
    const sheet: PortraitSheet = proxyPortraitPayload();
    expect(portraitSrc(sheet)).toBe(`data:image/png;base64,${sheet.b64}`);
  });
});

// ── AC18 — additive only ───────────────────────────────────────────────────
// ── PR #33 review — the gate validates VALUES, not just types ──────────────
// R1 (conversation.ts:355): a non-finite / negative `patienceCost` passes a
// `typeof number` check, survives the reducer's clamp and then makes `tierFor()`
// throw inside a card's click handler — the hand stays enabled and the
// conversation dead-ends. R2 (portrait.ts:253): a `b64`/`url` carrying `"` and
// `)` breaks out of the portrait cell's CSS `url("…")` literal and Chromium
// fetches the fabricated layer. Both are rejected at this one shared gate.
describe('isDialogueBeat rejects arithmetic-poison patience costs', () => {
  const withCost = (cost: unknown): unknown => {
    const beat = proxyDialoguePayload() as DialogueBeat;
    (beat.choices[1] as { patienceCost: unknown }).patienceCost = cost;
    return beat;
  };

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
    ['negative', -3],
  ])('rejects a %s patienceCost', (_label, cost) => {
    expect(isDialogueBeat(withCost(cost))).toBe(false);
  });

  it('requires the server-owned cost for each verb', () => {
    expect(isDialogueBeat(withCost(2))).toBe(true);
    expect(isDialogueBeat(withCost(0))).toBe(false);
    expect(isDialogueBeat(withCost(1))).toBe(false);
  });
});

describe('isDialogueBeat validates revealed clue identifiers', () => {
  function withClues(clueReveals: unknown): unknown {
    const beat = proxyDialoguePayload() as DialogueBeat;
    (beat.choices[2] as { clueReveals: unknown }).clueReveals = clueReveals;
    return beat;
  }

  it('accepts unique identifiers supplied by the dialogue request', () => {
    expect(
      isDialogueBeat(
        withClues(['clue_dark_circles', 'clue:racing-mind']),
        ['clue_dark_circles', 'clue:racing-mind'],
      ),
    ).toBe(true);
  });

  it.each([
    ['an invented request-scoped id', ['clue_invented'], ['clue_dark_circles']],
    ['a malformed id', ['not valid'], undefined],
    ['duplicate ids', ['clue_dark_circles', 'clue_dark_circles'], undefined],
    ['more than four ids', ['c1', 'c2', 'c3', 'c4', 'c5'], undefined],
  ])('rejects %s', (_label, clueReveals, availableClueIds) => {
    expect(isDialogueBeat(withClues(clueReveals), availableClueIds)).toBe(false);
  });
});

describe('isPortraitSheet rejects payloads that could escape a CSS url() literal', () => {
  it('rejects a b64 outside the base64 charset (the url("…") breakout)', () => {
    expect(isPortraitSheet({ b64: 'AAAA"), url("https://evil.example/beacon.png' })).toBe(false);
    expect(isPortraitSheet({ b64: 'AA AA' })).toBe(true); // wrapped payload: whitespace is fine
    expect(isPortraitSheet({ b64: 'aGVsbG8=' })).toBe(true);
  });

  it('rejects a url that is not an asset path this build owns', () => {
    for (const url of [
      'https://evil.example/beacon.png',
      '//evil.example/beacon.png',
      'javascript:alert(1)',
      './assets/x.png"), url("https://evil.example/b.png',
      'data:image/png;base64,AAA"), url("https://evil.example/b.png',
    ]) {
      expect(isPortraitSheet({ b64: '', url }), url).toBe(false);
    }
  });

  it('still accepts every url shape the demo actually paints', () => {
    for (const url of [
      './assets/fallback-portrait-1-mnw19BU3.png',
      '/assets/fallback-portrait-2.png',
      'assets/fallback-portrait-2.png',
      'data:image/png;base64,iVBORw0KGgo=',
    ]) {
      expect(isPortraitSheet({ b64: '', url }), url).toBe(true);
    }
  });
});

describe('AC18 contract.ts changes are additive', () => {
  const src = readFileSync(new URL('../../src/ai/contract.ts', import.meta.url), 'utf8');

  it('keeps every pre-existing export name', () => {
    for (const name of [
      'ChoiceVerb',
      'PatienceTier',
      'BeatChoice',
      'DialogueBeat',
      'DialogueRequest',
      'PortraitRequest',
      'PortraitSheet',
      'AIHealth',
      'isDialogueBeat',
    ]) {
      expect(src).toMatch(new RegExp(`export (type|interface|function) ${name}\\b`));
    }
  });

  it('keeps PortraitSheet.b64 required and adds url as optional', () => {
    expect(src).toMatch(/b64:\s*string/);
    expect(src).toMatch(/url\?:\s*string/);
  });

  // PR #33, R2 on contract.ts:67 — `prompt` was silently relaxed to optional this
  // run. It is the provenance field CLAUDE.md rule 5 exists for and every producer
  // on the branch sets it, so the guarantee is restored (and pinned here).
  it('keeps PortraitSheet.prompt REQUIRED (image provenance, rule 5)', () => {
    expect(src).toMatch(/prompt:\s*string/);
    expect(src).not.toMatch(/prompt\?:\s*string/);
  });

  it('exports the new portraitSrc helper', () => {
    expect(src).toMatch(/export function portraitSrc\(/);
  });
});
