import { PublicError } from "./errors.js";
import { PROMPT_BUNDLE } from "./prompt-bundle.generated.js";
import { CALL_SPECS } from "./calls.js";
import type { CallRequest, CallType } from "./types.js";

/**
 * Slot values → the two rendered messages.
 *
 * This is the production home of what `tools/lib/compose.mjs` prototypes. The
 * renderers below must stay byte-compatible with it: `tools/check-prompt-parity.mjs`
 * composes the same suite through both and fails on any difference. That gate
 * is what lets the probe's measurements stand for the payload this tier sends.
 *
 * Rendering happens HERE, not in the browser (physical architecture §3.10): the
 * client posts slot values, so prompt wording never enters the bundle and a
 * wording change is a proxy deploy rather than a Pages rebuild.
 */

const template = (call: CallType, layer: "base" | "user", version: string): string => {
  const text = PROMPT_BUNDLE[`${call}/${layer}-${version}`];
  if (text === undefined) {
    throw new PublicError(
      400,
      "unknown_template_version",
      `No ${layer} template for ${call} at ${version}.`,
    );
  }
  return text;
};

/** Fill {SLOT} markers. Any {UPPER_CASE} left over is a template/payload mismatch. */
function fillSlots(text: string, values: Record<string, string>): string {
  const out = text.replace(/\{([A-Z_]+)\}/g, (_match, name: string) => {
    if (!(name in values)) {
      throw new PublicError(
        500,
        "unfilled_slot",
        `Template slot {${name}} has no value.`,
      );
    }
    return values[name] ?? "";
  });
  const leftover = out.match(/\{[A-Z_]+\}/g);
  if (leftover) {
    throw new PublicError(
      500,
      "unfilled_slot",
      `Unfilled slots remain: ${leftover.join(", ")}.`,
    );
  }
  // Collapse blank runs left by intentionally-empty slots (e.g. the neutral
  // temperament, or the credulity arm's removed [결함] line).
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

type Block = { id?: unknown; text?: unknown };
type Npc = { id?: unknown; name?: unknown; side?: unknown };

const str = (v: unknown): string => String(v ?? "");

const renderBlocks = (v: unknown): string => {
  const blocks = Array.isArray(v) ? (v as Block[]) : [];
  return blocks.length
    ? blocks.map((b) => `${str(b.id)}: ${str(b.text)}`).join("\n")
    : "(없음)";
};

const renderPriority = (v: unknown): string =>
  Array.isArray(v) ? v.map((s, i) => `\n  ${i + 1}) ${str(s)}`).join("") : str(v);

const renderStanceSet = (v: unknown): string =>
  (Array.isArray(v) ? v : [])
    .map((s) => `${str((s as Block).id)}. ${str((s as { label?: unknown }).label)}`)
    .join("\n");

const renderLines = (v: unknown): string =>
  Array.isArray(v) ? v.map(str).join("\n") : str(v);

// NPCs render grouped by `side` when the payload marks it. The grouping is not
// cosmetic: room-side characters kept stepping into the controller's seat and
// addressing the person on the line, and a prose rule alone did not stop it —
// the model had to infer the two sides from names. Naming the sides in the
// payload makes the boundary structural. The labels carry the rule, not just the
// grouping; stating it in the distant constraint list left a residual leak.
const SIDE_LABELS: Record<string, string> = {
  line: "회선 너머 — 통제관에게만 말한다",
  room: "상황실 안 — 서로에게만 말한다. 회선 저쪽에는 말을 걸지 않는다",
};

const renderNpcs = (v: unknown): string => {
  const list = (Array.isArray(v) ? v : []) as Npc[];
  const entry = (p: Npc) => `${str(p.id)} — ${str(p.name)}`;
  if (!list.some((p) => p.side)) return list.map(entry).join("\n");
  const groups: string[] = [];
  for (const [side, label] of Object.entries(SIDE_LABELS)) {
    const members = list.filter((p) => p.side === side);
    if (members.length) groups.push(`[${label}]\n${members.map(entry).join("\n")}`);
  }
  const rest = list.filter((p) => !(str(p.side) in SIDE_LABELS));
  if (rest.length) groups.push(rest.map(entry).join("\n"));
  return groups.join("\n\n");
};

/**
 * Slots with structure get a renderer; everything else passes through as a
 * string. Keyed by slot name, not call type — a slot renders the same way
 * wherever it appears.
 */
const RENDERERS: Record<string, (v: unknown) => string> = {
  PRIORITY_LIST: renderPriority,
  BLOCKS: renderBlocks,
  STANCE_SET: renderStanceSet,
  TIMELINE_EXCERPT: renderLines,
  // narration (call contracts §2)
  TIMELINE_TAIL: renderLines,
  SCENE_SYMPTOMS: (v) =>
    Array.isArray(v) && v.length ? v.map(str).join("\n") : "(변화 없음)",
  PRESENT_NPCS: renderNpcs,
  // reporter (call contracts §3) — one round's events as lines
  EXPERIENCED: renderLines,
};

export type RenderedCall = { system: string; user: string };

/**
 * Slots the client is NOT allowed to supply: they are this tier's contribution
 * to the prompt (call contracts §6, "Supplier per slot"). A payload carrying
 * them is not an error — it is simply ignored, because trusting it would let a
 * client rewrite the default prompt.
 */
export const PROXY_OWNED_SLOTS = new Set(["FLAW", "INCIDENT", "PRIORITY_LIST"]);

export function renderCall(
  request: CallRequest,
  proxySlots: Record<string, unknown>,
): RenderedCall {
  const spec = CALL_SPECS[request.call_type];
  const values: Record<string, string> = {};

  for (const name of spec.slots) {
    const raw = PROXY_OWNED_SLOTS.has(name)
      ? proxySlots[name]
      : request.slots[name];
    const render = RENDERERS[name] ?? str;
    values[name] = render(raw);
  }

  const version = request.template_version;
  return {
    system: fillSlots(template(request.call_type, "base", version), values),
    user: fillSlots(template(request.call_type, "user", version), values),
  };
}
