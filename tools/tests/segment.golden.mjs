#!/usr/bin/env node
// Golden test for the report-body segmenter — required by the PR #108
// ratification (spec-client §5.2).
//
//   node tools/tests/segment.golden.mjs
//
// Zero dependencies, `node:test` only. The root project has no test runner yet
// and the client build is mid-flight installing vitest; adding a second runner
// now would collide for no gain. When vitest lands this can move verbatim.
//
// WHY A GOLDEN AND NOT ASSERTIONS ON BEHAVIOUR: the engine mints
// `b-r<run>-b<nn>` ids by position in this output. A change that re-splits one
// sentence renumbers every id after it, and archive highlighting — which is
// keyed on those ids — silently points at the wrong text in every stored run.
// The golden makes that a failing test instead of a mystery.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { segmentReportBody } from '../../src/shared/segment.ts'

/** A body in the shape report-guidance asks for: 1인칭, 판단 표지, markdown. */
const BODY = [
  '## 야간 근무 보고',
  '',
  '09:25에 두 번째 전화를 받았다. 발신자는 요구 조건을 묻는 질문에 답하지 않았다.',
  '나는 이것이 협박이 아니라고 판단한다. 목소리가 떨렸고, 끊기 전에 한 번 더 말하려 했다.',
  '',
  '- 통화 음성 판독은 위협 패턴이 아니라고 했다',
  '- "막을 수 있는 건 그 방에 앉은 사람들뿐이다." 이 문장이 계속 걸린다',
  '',
  '실장은 볼 것 없다고 했다… 나는 그 판단을 아직 따르지 못하겠다',
].join('\n')

test('golden — the split is frozen', () => {
  assert.deepEqual(segmentReportBody(BODY), [
    '야간 근무 보고',
    '09:25에 두 번째 전화를 받았다.',
    '발신자는 요구 조건을 묻는 질문에 답하지 않았다.',
    '나는 이것이 협박이 아니라고 판단한다.',
    '목소리가 떨렸고, 끊기 전에 한 번 더 말하려 했다.',
    '통화 음성 판독은 위협 패턴이 아니라고 했다',
    '"막을 수 있는 건 그 방에 앉은 사람들뿐이다."',
    '이 문장이 계속 걸린다',
    '실장은 볼 것 없다고 했다…',
    '나는 그 판단을 아직 따르지 못하겠다',
  ])
})

test('a block boundary is never crossed — two list items never merge', () => {
  const out = segmentReportBody('- 첫 항목\n- 둘째 항목')
  assert.deepEqual(out, ['첫 항목', '둘째 항목'])
})

test('a closing quote rides with its terminator, not the next sentence', () => {
  const out = segmentReportBody('그는 "끝났다." 라고 적었다. 나는 믿지 않는다.')
  assert.deepEqual(out, ['그는 "끝났다."', '라고 적었다.', '나는 믿지 않는다.'])
})

test('a tail with no terminator is kept, not dropped', () => {
  assert.deepEqual(segmentReportBody('끝맺지 않은 문장'), ['끝맺지 않은 문장'])
})

test('an empty body yields no blocks, not one empty block', () => {
  assert.deepEqual(segmentReportBody('\n\n   \n'), [])
})

test('deterministic — the same body twice is the same split', () => {
  assert.deepEqual(segmentReportBody(BODY), segmentReportBody(BODY))
})
