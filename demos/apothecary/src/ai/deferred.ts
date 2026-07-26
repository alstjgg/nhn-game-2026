import type { AIAdapter } from './adapter.ts';
import type {
  DialogueBeat,
  DialogueRequest,
  PortraitRequest,
  PortraitSheet,
} from './contract.ts';

/**
 * Mount-time adapter that lets the game render before the health probe settles.
 *
 * Calls made during a Lambda cold start wait on the one boot decision; after it
 * resolves, all calls delegate to that same live or stub instance. Until then
 * mode reports stub conservatively rather than claiming an unverified backend.
 */
export function createDeferredAdapter(selection: Promise<AIAdapter>): AIAdapter {
  let selected: AIAdapter | null = null;
  const ready = selection.then((adapter) => {
    selected = adapter;
    return adapter;
  });
  // createBootAdapter is total after its eager bundled-data validation. Keep an
  // injected/replacement selection rejection handled while still forwarding it
  // to any pending call.
  void ready.catch(() => undefined);

  return {
    get mode() {
      return selected?.mode ?? 'stub';
    },
    dialogue(request: DialogueRequest): Promise<DialogueBeat> {
      return ready.then((adapter) => adapter.dialogue(request));
    },
    portrait(request: PortraitRequest): Promise<PortraitSheet> {
      return ready.then((adapter) => adapter.portrait(request));
    },
  };
}
