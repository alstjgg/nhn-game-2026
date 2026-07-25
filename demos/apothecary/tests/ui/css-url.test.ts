// cssUrl — the escaping half of the CSS url() sink defence (PR #33, R2 on
// src/ui/portrait.ts:253). `isPortraitSheet` rejects such payloads at the
// boundary; this pins that even a payload that never passed a gate cannot
// terminate the literal or stack a second `url()` layer.
import { describe, expect, it } from 'vitest';
import { cssUrl } from '../../src/ui/css-url';

describe('cssUrl escapes anything that could terminate the literal', () => {
  it('neutralises the reviewer\'s reproduction payload', () => {
    const value = cssUrl('data:image/png;base64,AAAA"), url("https://evil.example/beacon.png');
    // The literal opens once and closes once, at the very end: everything the
    // payload wanted to be syntax (`"`, `)`, `(`, the space) is now data.
    expect(value.startsWith('url("')).toBe(true);
    expect(value.endsWith('")')).toBe(true);
    expect(value.slice(5, -2)).not.toMatch(/["'()\s]/);
    expect(value).toContain('%22');
    // The fabricated second layer cannot parse as one — its `url(` lost its paren.
    expect(value).toContain('url%28');
    expect(value.match(/url\(/g), 'more than one url() token').toHaveLength(1);
  });

  // encodeURIComponent leaves `'`, `(` and `)` alone — precisely the breakout
  // characters — so the expectation spells the escapes out.
  it.each([
    ['"', '%22'],
    ["'", '%27'],
    ['(', '%28'],
    [')', '%29'],
    ['\\', '%5C'],
    [' ', '%20'],
    ['\n', '%0A'],
    ['<', '%3C'],
    ['>', '%3E'],
  ])('percent-encodes %j as %s', (char, encoded) => {
    expect(cssUrl(`a${char}b`)).toBe(`url("a${encoded}b")`);
  });

  it('leaves real asset paths and data URLs byte for byte', () => {
    for (const url of [
      './assets/fallback-portrait-1-mnw19BU3.png',
      '/assets/ui-bubble.png',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg+/=',
    ]) {
      expect(cssUrl(url)).toBe(`url("${url}")`);
    }
  });
});
