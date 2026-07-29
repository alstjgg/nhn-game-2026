import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  APOTHECARY_AILMENTS,
  APOTHECARY_PERSONA_TRAITS,
  APOTHECARY_TIER_TONES,
  APOTHECARY_VERB_COSTS,
} from "../data/apothecary.js";

type Ailment = { problem: string; hiddenCause: string };
type Customer = Ailment;
type Generation = {
  verbCosts: Record<string, number>;
  tierTones: string[];
  traitTable: {
    archetypes: string[];
    quirks: string[];
    ailments: Array<Ailment & { id: string }>;
  };
};
type FallbackPack = { customer: Customer };

function json<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(new URL(relativePath, import.meta.url), "utf8"),
  ) as T;
}

const generation = json<Generation>(
  "../../../demos/apothecary/data/generation.json",
);
const customers = json<Customer[]>(
  "../../../demos/apothecary/data/customers.json",
);
const fallback = json<FallbackPack>(
  "../../../demos/apothecary/data/fallback-npcs.json",
);

describe("Lambda registry mirrors the actual Apothecary game data", () => {
  it("contains exactly the authored and procedural ailment pairs", () => {
    const registered = new Set(
      APOTHECARY_AILMENTS.map(({ problem, hiddenCause }) =>
        JSON.stringify([problem, hiddenCause]),
      ),
    );
    const expected = new Set(
      [...customers, fallback.customer, ...generation.traitTable.ailments].map(
        ({ problem, hiddenCause }) =>
          JSON.stringify([problem, hiddenCause]),
      ),
    );

    expect(registered).toEqual(expected);
  });

  it("contains exactly the procedural persona traits", () => {
    const registered = new Set<string>(APOTHECARY_PERSONA_TRAITS);
    const expected = new Set([
      ...generation.traitTable.archetypes,
      ...generation.traitTable.quirks,
    ]);

    expect(registered).toEqual(expected);
  });

  it("uses the same server-owned verb costs as generation data", () => {
    expect(APOTHECARY_VERB_COSTS).toEqual(generation.verbCosts);
  });

  it("uses the same tier tones as generation data, in the same order", () => {
    // Compared as an ordered list, unlike the sets above: the prompt indexes
    // this by patienceTier, so a reordering silently gives the wrong mood.
    expect([...APOTHECARY_TIER_TONES]).toEqual(generation.tierTones);
  });
});
