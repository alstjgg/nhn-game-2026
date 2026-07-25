// u1 RED — contract additions must be additive only (spec AC11, AC18, AC19).
//
// src/ai/contract.ts is shared with the FROZEN server/ai-proxy.mjs. This unit may
// only add `PortraitSheet.url?` and `portraitSrc()`; every existing export must keep
// its name, signature and meaning, and the proxy's payload must still validate.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isDialogueBeat, portraitSrc } from '../../src/ai/contract';
import type { DialogueBeat, PortraitSheet } from '../../src/ai/contract';
import { proxyDialoguePayload, proxyPortraitPayload } from './fixtures';

// ── AC19 — the frozen proxy payload still validates ────────────────────────
describe('AC19 proxy payloads keep passing isDialogueBeat', () => {
  it('accepts the 4-card beat server/ai-proxy.mjs emits', () => {
    expect(isDialogueBeat(proxyDialoguePayload())).toBe(true);
  });

  it('accepts a 3-card beat (proxy filters unknown verbs out)', () => {
    const payload = proxyDialoguePayload() as DialogueBeat;
    payload.choices.splice(3, 1);
    expect(isDialogueBeat(payload)).toBe(true);
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

  it('still rejects malformed beats (unchanged validator semantics)', () => {
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

  it('falls back to a base64 data URI for the live proxy payload (no url)', () => {
    const sheet: PortraitSheet = proxyPortraitPayload();
    expect(portraitSrc(sheet)).toBe(`data:image/png;base64,${sheet.b64}`);
  });
});

// ── AC18 — additive only ───────────────────────────────────────────────────
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

  it('exports the new portraitSrc helper', () => {
    expect(src).toMatch(/export function portraitSrc\(/);
  });
});
