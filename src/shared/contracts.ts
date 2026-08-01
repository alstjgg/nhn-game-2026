/**
 * LLM call contracts — the wire shape of the three calls.
 *
 * Owner: 윤석 (architecture track), per physical architecture §3.1.
 * Source of truth: `docs/dday-call-contracts.md` v1. This file is a
 * transcription of that document, not a place to make new decisions — a change
 * here without a change there is a bug in one of the two.
 *
 * There is no scenario content in this file. Slot *names* live here; what fills
 * them is the datapack (`datapack.ts`, 민서) or the engine at runtime. See the
 * supplier map in call contracts §6.
 *
 * Nesting: the ban on nested objects (contracts §1 rule 2) applies to the
 * model's *output* schema. Input slots may carry the small shapes below — the
 * composer renders them to text before they reach a prompt.
 */

// ─── shared slot shapes ──────────────────────────────────────────────────────

/** A stance the agent may pick at a gate. Per-gate content, never global. */
export type Stance = { id: string; label: string }

/** A sentence block the player mined and injected. Rendered as `id: text`. */
export type Block = { id: string; text: string }

/**
 * A character who may speak this beat.
 *
 * `side` is not decoration: splitting the roster into `line` (across the phone
 * line) and `room` (in the situation room) is the only measure that drove
 * speaker misattribution to 0/5. Contracts §3.
 */
export type PresentNpc = { id: string; name: string; side: 'line' | 'room' }

// ─── Call 1 — Judgment ───────────────────────────────────────────────────────

export type JudgmentPayload = {
  /** Proxy-owned system layer. The player never reaches these. */
  FLAW: string
  INCIDENT: string
  PRIORITY_LIST: string[]
  /** Scenario-authored temperament. Invisible and immutable to the player (I13). */
  TEMPERAMENT: string
  /** Engine: an excerpt of the timeline so far. */
  TIMELINE_EXCERPT: string[]
  /** The player's only channel. Empty array is legal. */
  BLOCKS: Block[]
  /** Scenario, per gate. */
  GATE_QUESTION: string
  STANCE_SET: Stance[]
}

/**
 * Field order is the contract: it is the order the model generates in.
 * `inner_note` sits before the stance so the note is deliberation; `because_*`
 * and `rejected_*` sit after so they are post-hoc readout. Reordering is a
 * shape change and requires a revalidation run (contracts §1 rule 3).
 */
export type JudgmentResponse = {
  inner_note: string
  /** The only state actuator input. Must be a member of the gate's stance set. */
  stance: string
  because_referent: string
  because_block_ids: string[]
  rejected_stance: string
  rejected_reason: string
  utterance: string
}

// ─── Call 2 — Narration / NPC ────────────────────────────────────────────────

export type NarrationPayload = {
  /** Must already contain the engine-rendered fixed action and the agent's utterance. */
  TIMELINE_TAIL: string[]
  AGENT_UTTERANCE: string
  /**
   * A non-contradiction constraint, not something to narrate — the engine has
   * already rendered it. Must not demand a reply from the agent (spec §4).
   */
  FIXED_NPC_ACTION: string
  /** Engine delta journal rendered as symptoms. The only channel for state change. */
  SCENE_SYMPTOMS: string[]
  PRESENT_NPCS: PresentNpc[]
}

export type NarrationResponse = {
  /** Reactions and scene texture, one sentence per entry. */
  timeline_entries: string[]
  /** `"<npc_id>: <line>"`. Prefixed strings because nested objects are banned. */
  npc_lines: string[]
}

// ─── Call 3 — Reporter ───────────────────────────────────────────────────────

export type ReporterPayload = {
  /** One round of events, assembled by the engine — includes `inner_note` (W1). */
  EXPERIENCED: string[]
  /** The same value Call 1 received. One temperament per scenario. */
  TEMPERAMENT: string
  REPORT_GUIDANCE: string
}

export type ReporterResponse = {
  facts: string[]
  /** Generated last, so a streaming upgrade stays schema-compatible. */
  report_body: string
}

// ─── call registry ───────────────────────────────────────────────────────────

/** Three call types exist; no others (spec §4). */
export type CallType = 'judgment' | 'narration' | 'reporter'

export type CallPayload = {
  judgment: JudgmentPayload
  narration: NarrationPayload
  reporter: ReporterPayload
}

export type CallResponse = {
  judgment: JudgmentResponse
  narration: NarrationResponse
  reporter: ReporterResponse
}
