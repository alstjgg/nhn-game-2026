// The operator terminal's own identity — the left third of the chrome row
// (spec-client §4). This is the portal the operator is signed into, not run
// data: it does not come from the scenario pack and it does not change with
// the case. Ported from docs/design/phase2-ui/data.js `PORTAL` (lines 8..19);
// only the case name is pack-fed, and that arrives at boot.

export interface PortalIdentity {
  portal: string
  portalCode: string
  operator: string
  operatorId: string
  clearance: string
}

export const PORTAL: PortalIdentity = {
  portal: '국가재난모의포털',
  portalCode: 'NDSP-2',
  operator: '박민서',
  operatorId: 'OP-2291',
  clearance: 'C-2',
}

/** The taskbar's standing hint — the reference's `.tb-hint`. */
export const TASKBAR_HINT = '창을 끌어 배치 · 제목 표시줄에서 방향키로 이동'

/**
 * The card the terminal comes pre-filled with at the door (`shell/sign-in.ts`).
 *
 * There is nothing to authenticate: the sign-in screen is a scene, and the two
 * fields are rendered as static text, never as a form (spec-client §3
 * invariant 1 — the membrane admits no free-text surface anywhere, and
 * `tests/shell/no-free-text.test.ts` holds that line at source level). The
 * account is the terminal's, which is why it lives beside the portal's own
 * identity rather than in the scenario pack.
 */
export interface SignInCard {
  /** The account the terminal is provisioned to. */
  userId: string
  /** What the masked field shows — a mask, not a secret. */
  secret: string
  /** The desk this session is assigned. */
  terminal: string
  /** The issuing body, printed at the door and on the manual. */
  agency: string
}

export const SIGN_IN: SignInCard = {
  userId: 'test_user123',
  secret: '*********',
  terminal: 'T-14',
  agency: '행정안전부 · 재난안전본부',
}
