// u15 — the composition's step queue (INV-6).
//
// The run FSM emits synchronously, so calling `walkComplete()` straight out of a
// `walk-start` handler would re-enter the FSM mid-emit and unwind the run in the wrong
// order. A listener may therefore only ENQUEUE, and the queue runs the chain one hop
// past every microtask the emit could have left behind.
//
// A `MessageChannel` gives exactly that hop. It is not a clock: nothing here schedules
// against elapsed time, nothing polls, and `src/ai/stub.ts` remains the only module in
// `src/**` that arms a timer.

export interface TaskQueue {
  /** Runs `task` on the next turn of the task queue, after everything queued before it. */
  push(task: () => void): void;
  /** Resolves once the queue has run itself empty. */
  settled(): Promise<void>;
}

export function createTaskQueue(): TaskQueue {
  const tasks: Array<() => void> = [];
  const waiters: Array<() => void> = [];
  const channel = new MessageChannel();
  let scheduled = false;

  const flush = (): void => {
    scheduled = false;
    // A task may enqueue the next step of the run; the shift loop keeps draining until
    // the whole chain has settled, so `settled()` never resolves mid-run.
    for (let task = tasks.shift(); task !== undefined; task = tasks.shift()) task();
    for (const waiter of waiters.splice(0)) waiter();
  };

  channel.port1.onmessage = flush;

  const schedule = (): void => {
    if (scheduled) return;
    scheduled = true;
    channel.port2.postMessage(null);
  };

  return {
    push: (task) => {
      tasks.push(task);
      schedule();
    },
    settled: () =>
      new Promise<void>((resolve) => {
        waiters.push(resolve);
        schedule();
      }),
  };
}
