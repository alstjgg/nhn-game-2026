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
