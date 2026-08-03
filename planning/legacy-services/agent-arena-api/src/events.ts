import type { TraceEvent } from "./types.js";

type EventListener = (event: TraceEvent) => void;

export class EventHub {
  readonly #listeners = new Map<string, Set<EventListener>>();

  publish(event: TraceEvent): void {
    for (const listener of this.#listeners.get(event.turnId) ?? []) {
      try {
        listener(event);
      } catch {
        // Persisted events are authoritative. A disconnected or faulty
        // subscriber must not affect turn execution or other subscribers.
      }
    }
  }

  subscribe(turnId: string, listener: EventListener): () => void {
    const listeners = this.#listeners.get(turnId) ?? new Set<EventListener>();
    listeners.add(listener);
    this.#listeners.set(turnId, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.#listeners.delete(turnId);
      }
    };
  }
}
