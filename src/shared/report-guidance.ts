/**
 * `{REPORT_GUIDANCE}` renderer — structured `data/policy/report-guidance.json`
 * → the prose Call 3's `[보고 지침]` slot expects
 * (`proxy/prompts/reporter/user-v0.2.md`).
 *
 * Unlike `{TEMPERAMENT}`, this slot is NOT bare: the template already supplies
 * the `[보고 지침]` header directly above it, so this renderer must not mint a
 * second one.
 *
 * Pure function of the policy — no fs, no DOM, no clock, no randomness — so
 * retuning the JSON (balance-as-data) retunes the prose deterministically.
 *
 * `ReportGuidance` is scenario-independent policy (contract-engine-composer §3:
 * `ComposerDeps.reportGuidance`), which is why it lives outside any
 * `data/scenario/**` pack and is host-loaded instead.
 *
 * D4 / spec S5: like `renderTemperament`, this renderer is **total** — no
 * validation, no throw. A missing/malformed field is guarded and rendered as
 * the field's zero value rather than raised as an error; validating the
 * authored policy is `authoring/lint-datapack.mjs`'s job, not the renderer's.
 */

export type ReportGuidance = {
  id: string
  version: string
  purpose: string
  facts: {
    max_items: number
    policy: string
  }
  report_body: {
    format: string
    length: {
      min_chars: number
      max_chars: number
    }
    policy: string
  }
}

export function renderReportGuidance(guidance: ReportGuidance): string {
  const facts = guidance?.facts
  const reportBody = guidance?.report_body
  const length = reportBody?.length

  const maxItems = typeof facts?.max_items === 'number' ? facts.max_items : 0
  const factsPolicy = typeof facts?.policy === 'string' ? facts.policy : ''
  const format = typeof reportBody?.format === 'string' ? reportBody.format : ''
  const minChars = typeof length?.min_chars === 'number' ? length.min_chars : 0
  const maxChars = typeof length?.max_chars === 'number' ? length.max_chars : 0
  const bodyPolicy = typeof reportBody?.policy === 'string' ? reportBody.policy : ''

  const lines: string[] = [
    `사실 목록: 최대 ${maxItems}개. ${factsPolicy}`,
    '',
    `보고서 본문: ${format} 형식, ${minChars}~${maxChars}자.`,
    bodyPolicy,
  ]

  return lines.join('\n')
}
