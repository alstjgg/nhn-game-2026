import { loadConfig } from "./config.js";
import { EventHub } from "./events.js";
import { ArenaHttpServer } from "./http-server.js";
import { AnthropicProvider } from "./providers/anthropic-provider.js";
import { MockProvider } from "./providers/mock-provider.js";
import { OpenAIProvider } from "./providers/openai-provider.js";
import { ArenaRegistry } from "./registry.js";
import { ContextCipher } from "./security.js";
import { ArenaService } from "./service.js";
import { ArenaStore } from "./store.js";

const config = loadConfig();
const store = new ArenaStore(
  config.databasePath,
  new ContextCipher(config.contextEncryptionKey),
);
store.recoverInterruptedTurns("server_restarted");
store.recoverInterruptedOperations();
store.recoverMissingTerminalEvents();
const service = new ArenaService({
  store,
  registry: new ArenaRegistry(config.registryDirectory),
  providers: [
    new MockProvider(),
    new OpenAIProvider(),
    new AnthropicProvider(),
  ],
  events: new EventHub(),
});
const server = new ArenaHttpServer(config, service);

await server.listen();

const shutdown = async (): Promise<void> => {
  await server.close();
  store.close();
};

process.once("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});
process.once("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});
