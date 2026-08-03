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
  if (typeof guidance !== 'object' || guidance === null) {
    throw new Error('renderReportGuidance: guidance must be a ReportGuidance object')
  }
  if (typeof guidance.facts !== 'object' || guidance.facts === null) {
    throw new Error('renderReportGuidance: facts must be an object')
  }
  if (typeof guidance.report_body !== 'object' || guidance.report_body === null) {
    throw new Error('renderReportGuidance: report_body must be an object')
  }
  const { facts, report_body } = guidance
  if (typeof facts.max_items !== 'number' || typeof facts.policy !== 'string') {
    throw new Error('renderReportGuidance: facts.max_items/policy missing')
  }
  if (
    typeof report_body.format !== 'string' ||
    typeof report_body.policy !== 'string' ||
    typeof report_body.length !== 'object' ||
    report_body.length === null ||
    typeof report_body.length.min_chars !== 'number' ||
    typeof report_body.length.max_chars !== 'number'
  ) {
    throw new Error('renderReportGuidance: report_body fields missing')
  }

  const lines: string[] = [
    `사실 목록: 최대 ${facts.max_items}개. ${facts.policy}`,
    '',
    `보고서 본문: ${report_body.format} 형식, ${report_body.length.min_chars}~${report_body.length.max_chars}자.`,
    report_body.policy,
  ]

  return lines.join('\n')
}
