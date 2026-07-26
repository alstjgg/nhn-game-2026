import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { aiProxy } from './server/ai-proxy.mjs';
import { resolveBuildInputs } from './vite.build-inputs.ts';

// base: './' — dist must work under a Pages subpath (…/demos/apothecary/) and
// for the nested e2e harness pages, so every emitted asset URL stays relative.
// Do NOT hardcode the repo-name base like the root config does; relative paths
// keep the demo self-contained.
//
// Multi-page build: the demo home (index.html) plus — ONLY under `E2E=1` — the
// standalone e2e harness pages that drive individual screens in a real browser.
// `playwright.config.ts` builds with that flag so `preview` serves each harness at
// the path its spec `goto`s (design D10); every other build (CI, the Pages deploy)
// emits the demo home alone, so no URL-parameter-driven build of the game with
// internal test hooks is ever published (PR #33, R2). The rule itself lives in
// ./vite.build-inputs.ts and is unit-tested there.
const input = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const DEPLOYED_LAMBDA_BASE_URL =
  'https://zcyeajmv11.execute-api.ap-northeast-2.amazonaws.com';
const PAGES_ORIGIN = 'https://alstjgg.github.io';

export function isLoopbackAddress(address: string | undefined): boolean {
  if (address === undefined) return false;

  const normalized = address.toLowerCase().split('%', 1)[0]!;
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }

  const ipv4 =
    normalized.startsWith('::ffff:')
      ? normalized.slice('::ffff:'.length)
      : normalized.startsWith('0:0:0:0:0:ffff:')
        ? normalized.slice('0:0:0:0:0:ffff:'.length)
        : normalized;
  return /^127(?:\.\d{1,3}){3}$/.test(ipv4);
}

function isAiProxyPath(rawUrl: string | undefined): boolean {
  if (rawUrl === undefined) return false;
  try {
    const pathname = new URL(rawUrl, 'http://localhost').pathname;
    return pathname === '/ai' || pathname.startsWith('/ai/');
  } catch {
    return false;
  }
}

export function shouldRejectAiProxyRequest(
  rawUrl: string | undefined,
  remoteAddress: string | undefined,
): boolean {
  return isAiProxyPath(rawUrl) && !isLoopbackAddress(remoteAddress);
}

function loopbackOnlyAiProxy(): Plugin {
  return {
    name: 'apothecary-loopback-only-ai-proxy',
    apply: 'serve',
    configureServer(server) {
      // This runs before Vite's proxy middleware. It remains effective even if
      // a caller overrides server.host with `--host 0.0.0.0`.
      server.middlewares.use((request, response, next) => {
        if (
          shouldRejectAiProxyRequest(
            request.url,
            request.socket.remoteAddress,
          )
        ) {
          response.statusCode = 403;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.setHeader('Cache-Control', 'no-store');
          response.end(
            JSON.stringify({
              error: 'The Lambda development proxy is loopback-only.',
            }),
          );
          return;
        }
        next();
      });
    },
  };
}

function upstreamFor(mode: string): string {
  const modeEnv = loadEnv(mode, process.cwd(), 'APOTHECARY_AI_UPSTREAM_URL');
  const configured =
    process.env.APOTHECARY_AI_UPSTREAM_URL ??
    modeEnv.APOTHECARY_AI_UPSTREAM_URL;
  const raw = configured || (mode === 'lambda' ? DEPLOYED_LAMBDA_BASE_URL : '');
  return raw.replace(/\/$/, '');
}

export default defineConfig(({ mode }) => {
  const lambdaUpstream = upstreamFor(mode);
  return {
    base: './',
    // Normal `npm run dev` preserves the legacy key-backed local proxy.
    // `npm run dev:lambda` uses a server-only reverse proxy to the deployed
    // API. The browser stays same-origin while the proxy supplies the exact
    // production Pages Origin required by Lambda.
    plugins: lambdaUpstream ? [loopbackOnlyAiProxy()] : [aiProxy()],
    ...(lambdaUpstream
      ? {
          server: {
            // Keep the safe default explicit. The middleware above is the
            // enforcement layer when a CLI flag overrides this binding.
            host: '127.0.0.1',
            proxy: {
              '/ai': {
                target: lambdaUpstream,
                changeOrigin: true,
                secure: true,
                headers: { Origin: PAGES_ORIGIN },
              },
            },
          },
        }
      : {}),
    build: {
      rollupOptions: {
        input: Object.fromEntries(
          Object.entries(resolveBuildInputs(process.env)).map(([name, path]) => [
            name,
            input(path),
          ]),
        ),
      },
    },
  };
});
