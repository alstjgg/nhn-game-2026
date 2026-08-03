/**
 * LLM call contracts — the wire shape between the bundle and the proxy.
 *
 * Owner: 윤석 (architecture track), per physical architecture §3.1.
 * Source of truth: `docs/contract-calls.md` v1 — §11 for the transport, §2–§4
 * for the response schemas. This file is a transcription of that document, not
 * a place to make new decisions; a change here without a change there is a bug
 * in one of the two.
 *
 * ⚠️ **Scope narrowed 2026-08-03** (physical §3.10). The proxy renders both
 * message layers, so this file no longer describes prompt payloads — it
 * describes what the client *posts* and what it gets back. The executable form
 * of the output schemas lives in `proxy/src/calls.ts`; a second copy here would
 * have no drift guard.
 *
 * There is no scenario content in this file. Slot *names* live here; what fills
 * them arrives through an engine view
 * ([engine ⟷ composer](../../docs/contract-engine-composer.md) §2).
 */

// ─── slot value shapes ───────────────────────────────────────────────────────

/** A stance the agent may pick at a gate. Per-gate content, never global. */
export type Stance = { id: string; label: string }

/** A sentence block the player mined and injected. The proxy renders `id: text`. */
export type Block = { id: string; text: string }

/**
 * A character who may speak this beat.
 *
 * `side` is not decoration: splitting the roster into `line` (across the phone
 * line) and `room` (in the situation room) is the only measure that drove
 * speaker misattribution to 0/5. Contracts §3.
 */
export type PresentNpc = { id: string; name: string; side: 'line' | 'room' }

// ─── what the client sends ───────────────────────────────────────────────────

/** Three call types exist; no others (spec §4). */
export type CallType = 'judgment' | 'narration' | 'reporter'

/*
 * Slots the PROXY owns and ignores if a client sends them: FLAW, INCIDENT,
 * PRIORITY_LIST. They are the default prompt's, authored by the D task
 * (contracts §6). Absent from every type below, deliberately.
 */

export type JudgmentSlots = {
  /**
   * Scenario-authored temperament, **already rendered to prose**. The one slot
   * that does not cross as structured data: the proxy has no renderer for it
   * (engine ⟷ composer §4). Invisible and immutable to the player (I13).
   */
  TEMPERAMENT: string
  /** Engine: an excerpt of the timeline so far, most recent 6 lines. */
  TIMELINE_EXCERPT: string[]
  /** The player's only channel. Empty array is legal. */
  BLOCKS: Block[]
  /** Scenario, per gate. */
  GATE_QUESTION: string
  STANCE_SET: Stance[]
}

export type NarrationSlots = {
  /** Must already carry the engine-rendered fixed action and the utterance. */
  TIMELINE_TAIL: string[]
  /** This beat's Call 1 `utterance`; empty string on a script beat. */
  AGENT_UTTERANCE: string
  /**
   * A non-contradiction constraint, not something to narrate — the engine has
   * already rendered it. Must not demand a reply from the agent (spec §4).
   */
  FIXED_NPC_ACTION: string
  /** Engine delta journal → symptom renderer. Never empty (engine spec §2.3-5). */
  SCENE_SYMPTOMS: string[]
  PRESENT_NPCS: PresentNpc[]
}

export type ReporterSlots = {
  /** One round of events, assembled by the engine — includes `inner_note` (W1). */
  EXPERIENCED: string[]
  /** The same value Call 1 received, byte for byte. */
  TEMPERAMENT: string
  REPORT_GUIDANCE: string
}

export type CallSlots = {
  judgment: JudgmentSlots
  narration: NarrationSlots
  reporter: ReporterSlots
}

/** The POST body. `POST <base>/dday/call` — one route for all three (§11). */
export type CallRequest<T extends CallType = CallType> = {
  call_type: T
  template_version: string // /^v[0-9]+\.[0-9]+$/
  slots: CallSlots[T]
}

// ─── what the client gets back ───────────────────────────────────────────────

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

export type NarrationResponse = {
  /** Reactions and scene texture, one sentence per entry. */
  timeline_entries: string[]
  /** `"<npc_id>: <line>"`. Prefixed strings because nested objects are banned. */
  npc_lines: string[]
}

export type ReporterResponse = {
  facts: string[]
  /** Generated last, so a streaming upgrade stays schema-compatible. */
  report_body: string
}

export type CallResponse = {
  judgment: JudgmentResponse
  narration: NarrationResponse
  reporter: ReporterResponse
}

/* A 200 body is the response VERBATIM — there is no success envelope (§11). */

/** Every non-2xx body. Never a bare string. */
export type CallErrorBody = {
  error: { code: string; message: string; requestId: string }
}

/**
 * `x-llm-fallback: true` is the engine's signal to apply its own authored
 * fallback (engine spec §5) — the proxy builds none of them, because two of the
 * three need `gates.json` or the objective log. It is deliberately absent on a
 * 4xx: a client bug must not be absorbed by an authored default.
 */
export const FALLBACK_HEADER = 'x-llm-fallback'
export const FALLBACK_CODE_HEADER = 'x-fallback-code'
export const REQUEST_ID_HEADER = 'x-request-id'
