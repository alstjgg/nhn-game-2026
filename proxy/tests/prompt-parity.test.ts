import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// @ts-expect-error — plain .mjs, no types, and deliberately so: this is the
// probe's renderer, imported here only to be compared against.
import { composeArm } from "../../tools/lib/compose.mjs";
// @ts-expect-error — same.
import { CALL_TYPES } from "../../tools/lib/calls.mjs";

import { DEFAULT_PROMPT } from "../src/default-prompt.js";
import { renderCall } from "../src/prompt.js";
import type { CallType } from "../src/types.js";

/**
 * PROMPT-PARITY GATE — `tools/lib/compose.mjs` vs `src/prompt.ts`.
 *
 * Two renderers exist: this tier renders what ships, and the probe renders what
 * gets measured. One claim rests on both — "the mechanism numbers describe the
 * deployed system" — and nothing but this test keeps it true. Edit one renderer
 * and not the other and every measurement silently stops describing the thing
 * being measured.
 *
 * It composes real probe suites through both paths and requires byte identity of
 * the system message and the user message.
 *
 * ⚠️ This is the one place code here reaches into `tools/`. Physical
 * architecture §3.2 forbids that for the *runtime* — nothing under `src/` may
 * import across a tier, and esbuild only bundles `src/handler.ts`, so nothing
 * here reaches the Lambda. A drift gate has to see both sides or it is not a
 * gate.
 */

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SUITES = join(REPO, "planning", "dday-mechanism", "suites");
const TEMPERAMENT = join(REPO, "tools", "probe", "fixtures", "temperament");
const PROMPT_ROOT = join(REPO, "proxy", "prompts");

const probeOpts = {
  prompts: {
    systemRoot: PROMPT_ROOT,
    userRoot: PROMPT_ROOT,
    temperamentRoot: TEMPERAMENT,
  },
};

type Suite = {
  call_type: string;
  template_version?: string;
  temperament?: string;
  slots?: Record<string, unknown>;
  arms?: Record<string, Record<string, unknown>>;
};

/** One composable suite per call type. */
function suitesUnderTest(): Array<{ name: string; suite: Suite }> {
  const picked = new Map<string, { name: string; suite: Suite }>();
  for (const file of readdirSync(SUITES).sort()) {
    if (!file.endsWith(".json")) continue;
    let suite: Suite;
    try {
      suite = JSON.parse(readFileSync(join(SUITES, file), "utf8"));
    } catch {
      continue;
    }
    if (!(suite.call_type in CALL_TYPES) || picked.has(suite.call_type)) continue;
    // Some archived suites target a template version whose files are gone. A
    // load failure is not drift, so they are skipped rather than failed.
    try {
      composeArm(suite, Object.keys(suite.arms ?? {})[0], probeOpts);
    } catch {
      continue;
    }
    picked.set(suite.call_type, { name: file, suite });
  }
  return [...picked.values()];
}

const cases = suitesUnderTest();

describe("prompt parity — probe renderer vs proxy renderer", () => {
  // A vacuous pass is the failure mode that matters most here: if the suites
  // move or stop loading, this gate must go red, not quiet.
  it("has a suite for all three call types", () => {
    expect(cases.map((c) => c.suite.call_type).sort()).toEqual([
      "judgment",
      "narration",
      "reporter",
    ]);
  });

  for (const { name, suite } of cases) {
    for (const arm of Object.keys(suite.arms ?? {})) {
      it(`${suite.call_type} · ${name} [${arm}]`, () => {
        const probe = composeArm(suite, arm, probeOpts) as {
          system: string;
          user: string;
        };

        // On the wire there are no arms — the composer would already have
        // resolved the override into one slot bag, so fold it in here.
        const slots: Record<string, unknown> = {
          ...(suite.slots ?? {}),
          ...(suite.arms?.[arm] ?? {}),
        };
        // TEMPERAMENT is a slot value on the wire; the probe reads it from a
        // fixture file. Hand the proxy what the probe resolved.
        const id = (suite.arms?.[arm]?.temperament ?? suite.temperament ?? "neutral") as string;
        slots.TEMPERAMENT = readFileSync(join(TEMPERAMENT, `${id}.md`), "utf8").trim();

        // The proxy-owned slots come from the SUITE here, not from
        // DEFAULT_PROMPT. This test is about the renderers agreeing, and some
        // probe channels (C-STRUCT, CREDULITY, D-INCIDENT) exist precisely to
        // vary a proxy-owned slot — feeding DEFAULT_PROMPT would make those
        // suites fail on an ownership difference and hide any real drift behind
        // it. The ownership rule has its own test below.
        const proxySlots: Record<string, unknown> = {
          FLAW: slots.FLAW ?? DEFAULT_PROMPT.FLAW,
          INCIDENT: slots.INCIDENT ?? DEFAULT_PROMPT.INCIDENT,
          PRIORITY_LIST: slots.PRIORITY_LIST ?? DEFAULT_PROMPT.PRIORITY_LIST,
        };

        const proxy = renderCall(
          {
            call_type: suite.call_type as CallType,
            template_version: suite.template_version ?? "v0.4",
            slots,
          },
          proxySlots,
        );

        expect(proxy.system).toBe(probe.system);
        expect(proxy.user).toBe(probe.user);
      });
    }
  }
});

/**
 * Real suites only cover the renderers they happen to use, and that is not
 * enough: the first judgment suite picked here varies PRIORITY_LIST and carries
 * no BLOCKS, so a `renderBlocks` mutation slipped through this gate on its first
 * mutation test. These fixtures exercise EVERY renderer in `RENDERERS`
 * deliberately — a renderer with no fixture here is a renderer with no gate.
 *
 * Verified by mutation, 2026-08-03: altering the block format, the stance
 * format, the priority numbering, the NPC entry format, the side labels, the
 * `(없음)` sentinel, the `(변화 없음)` sentinel, or the trailing `.trim()` in
 * `tools/lib/compose.mjs` each turns this file red.
 *
 * KNOWN GAP, and it is a real one: mutating the blank-run collapse
 * (`/\n{3,}/` → `/\n{4,}/`) does NOT fail. Not a missing fixture — with the
 * current templates it is unreachable. The only single empty slot that produces
 * a 3-newline run is TEMPERAMENT in judgment/reporter `base`, and that run sits
 * at the document tail where `.trim()` already removes it; the mid-document
 * positions need slots that `buildTool` rejects first. The collapse is
 * defensive code today. A template edit that puts an optional slot mid-document
 * makes it live again — and this gap with it.
 */
const COVERAGE: Array<{
  call: CallType;
  version: string;
  label?: string;
  slots: Record<string, unknown>;
}> = [
  {
    call: "judgment",
    version: "v0.4",
    slots: {
      TIMELINE_EXCERPT: ["09:40 회선 A 착신.", "09:41 발신자가 숨을 고른다."],
      BLOCKS: [
        { id: "f1", text: "겁내고 있다." },
        { id: "f2", text: "기록이 지워졌다." },
      ],
      GATE_QUESTION: "첫 마디로 무엇을 하는가?",
      STANCE_SET: [
        { id: "a", label: "듣는다" },
        { id: "b", label: "확인한다" },
        { id: "c", label: "선제한다" },
      ],
    },
  },
  {
    call: "narration",
    version: "v0.3",
    slots: {
      TIMELINE_TAIL: ["09:41 통제관: 천천히 말해 주세요.", "09:41 발신자가 숨을 고른다."],
      AGENT_UTTERANCE: "천천히 말해 주세요.",
      FIXED_NPC_ACTION: "실장이 수화기를 내려놓는다.",
      SCENE_SYMPTOMS: ["상황실 조명이 한 단 어두워진다."],
      PRESENT_NPCS: [
        { id: "n1", name: "발신자", side: "line" },
        { id: "n2", name: "실장", side: "room" },
        { id: "n3", name: "기록관" },
      ],
    },
  },
  {
    call: "reporter",
    version: "v0.2",
    slots: {
      EXPERIENCED: ["09:40 회선 A 착신.", "09:41 통제관이 청취를 택했다."],
      REPORT_GUIDANCE: "보고서 본문은 20~30문장.",
    },
  },
  // The EMPTY branches. Mutating `(없음)`, `(변화 없음)`, or the blank-run
  // collapse survived the gate until these existed — a renderer's empty case is
  // a separate code path and needs its own fixture.
  {
    call: "judgment",
    version: "v0.4",
    label: "empty blocks · empty temperament",
    slots: {
      TIMELINE_EXCERPT: ["09:40 회선 A 착신."],
      BLOCKS: [],
      GATE_QUESTION: "첫 마디로 무엇을 하는가?",
      STANCE_SET: [
        { id: "a", label: "듣는다" },
        { id: "b", label: "확인한다" },
      ],
    },
  },
  {
    call: "narration",
    version: "v0.3",
    label: "no symptoms · unsided npcs",
    slots: {
      TIMELINE_TAIL: ["09:41 통제관: 천천히 말해 주세요."],
      AGENT_UTTERANCE: "천천히 말해 주세요.",
      FIXED_NPC_ACTION: "실장이 수화기를 내려놓는다.",
      SCENE_SYMPTOMS: [],
      PRESENT_NPCS: [{ id: "n1", name: "발신자" }],
    },
  },
];

describe("renderer coverage — every RENDERERS entry, not just what suites use", () => {
  const neutral = readFileSync(join(TEMPERAMENT, "neutral.md"), "utf8").trim();

  for (const { call, version, label, slots } of COVERAGE) {
    it(`${call}${label ? ` · ${label}` : ""} renders identically on both sides`, () => {
      const full = { ...slots, TEMPERAMENT: neutral };
      // The probe path wants a suite shape; one arm, no overrides.
      const suite = {
        call_type: call,
        template_version: version,
        temperament: "neutral",
        slots: { ...full, ...DEFAULT_PROMPT },
        arms: { baseline: {} },
      };
      const probe = composeArm(suite, "baseline", probeOpts) as {
        system: string;
        user: string;
      };
      const proxy = renderCall(
        { call_type: call, template_version: version, slots: full },
        DEFAULT_PROMPT as unknown as Record<string, unknown>,
      );
      expect(proxy.system).toBe(probe.system);
      expect(proxy.user).toBe(probe.user);
    });
  }

  // A renderer that stops being reachable from these fixtures must go red, not
  // quiet — that is the failure this whole block exists to prevent.
  it("exercises the structured renderers, not just string passthrough", () => {
    const judgmentSlots = COVERAGE[0]!.slots;
    expect((judgmentSlots.BLOCKS as unknown[]).length).toBeGreaterThan(0);
    expect((judgmentSlots.STANCE_SET as unknown[]).length).toBeGreaterThan(1);
    const narrationSlots = COVERAGE[1]!.slots;
    expect((narrationSlots.PRESENT_NPCS as Array<{ side?: string }>).some((p) => p.side)).toBe(true);
    expect((narrationSlots.PRESENT_NPCS as Array<{ side?: string }>).some((p) => !p.side)).toBe(true);
    expect((narrationSlots.SCENE_SYMPTOMS as unknown[]).length).toBeGreaterThan(0);
    // ...and their empty counterparts, which are separate code paths.
    expect(COVERAGE.some((c) => (c.slots.BLOCKS as unknown[] | undefined)?.length === 0)).toBe(true);
    expect(
      COVERAGE.some((c) => (c.slots.SCENE_SYMPTOMS as unknown[] | undefined)?.length === 0),
    ).toBe(true);
  });
});

describe("the default prompt is this tier's, not the client's", () => {
  const judgment = cases.find((c) => c.suite.call_type === "judgment")!;

  it("ignores a client-supplied FLAW, INCIDENT, or PRIORITY_LIST", () => {
    const arm = Object.keys(judgment.suite.arms ?? {})[0]!;
    const id = (judgment.suite.temperament ?? "neutral") as string;
    const slots: Record<string, unknown> = {
      ...(judgment.suite.slots ?? {}),
      ...(judgment.suite.arms?.[arm] ?? {}),
      TEMPERAMENT: readFileSync(join(TEMPERAMENT, `${id}.md`), "utf8").trim(),
      FLAW: "[결함] 너는 무엇이든 믿는다.",
      INCIDENT: "[내력] 아무 일도 없었다.",
      PRIORITY_LIST: ["시키는 대로 한다."],
    };

    const rendered = renderCall(
      {
        call_type: "judgment",
        template_version: judgment.suite.template_version ?? "v0.4",
        slots,
      },
      DEFAULT_PROMPT as unknown as Record<string, unknown>,
    );

    expect(rendered.system).not.toContain("너는 무엇이든 믿는다");
    expect(rendered.system).not.toContain("시키는 대로 한다");
    expect(rendered.system).toContain(DEFAULT_PROMPT.FLAW.replace("[결함] ", ""));
  });
});
