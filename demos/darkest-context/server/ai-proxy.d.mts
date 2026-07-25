// Types for the dev-proxy so `vite.config.ts` type-checks under `strict`.
// The module itself is plain ESM JavaScript (`node --check`-able, no build
// step): it runs inside the dev server and inside tools/ai-smoke.

import type { Plugin } from 'vite';
import type { AgentDecision, SheetRef, Stance } from '../src/ai/contract.ts';

export interface PromptingCfg {
  /** Parsed data/prompting.json, data/heroes.json, data/cards.json. */
  prompting: unknown;
  heroes: unknown;
  cards: unknown;
}

export interface ComposedPrompt {
  system: string;
  user: string;
}

export interface ToolSpec {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ProxyResult {
  status: number;
  body: AgentDecision | Stance | { error: string };
}

export declare const MODELS: { decide: string; stance: string };

export declare function buildSheet(cfg: PromptingCfg, unitId: string, cardIds: string[]): SheetRef[];
export declare function composeDecidePrompt(cfg: PromptingCfg, req: unknown): ComposedPrompt;
export declare function composeStancePrompt(cfg: PromptingCfg, req: unknown): ComposedPrompt;
export declare function decideTool(cfg: PromptingCfg, req: unknown): ToolSpec;
export declare function stanceTool(cfg: PromptingCfg, req: unknown): ToolSpec;
export declare function handleDecide(req: unknown, cfg?: PromptingCfg): Promise<ProxyResult>;
export declare function handleStance(req: unknown, cfg?: PromptingCfg): Promise<ProxyResult>;
export declare function aiProxy(): Plugin;
