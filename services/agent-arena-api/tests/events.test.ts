import { describe, expect, it, vi } from "vitest";

import { EventHub } from "../src/events.js";
import type { TraceEvent } from "../src/types.js";

describe("EventHub", () => {
  it("isolates subscriber failures from persisted event publication", () => {
    const hub = new EventHub();
    const observed = vi.fn();
    const event: TraceEvent = {
      turnId: "turn-test",
      sequence: 1,
      type: "turn.queued",
      safeData: { runId: "run-test" },
      createdAt: "2026-07-23T00:00:00.000Z",
    };
    hub.subscribe(event.turnId, () => {
      throw new Error("disconnected subscriber");
    });
    hub.subscribe(event.turnId, observed);

    expect(() => hub.publish(event)).not.toThrow();
    expect(observed).toHaveBeenCalledOnce();
    expect(observed).toHaveBeenCalledWith(event);
  });
});
