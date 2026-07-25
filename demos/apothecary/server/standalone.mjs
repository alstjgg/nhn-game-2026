// Standalone AI server — the same three /ai/* endpoints the Vite dev-proxy
// serves, packaged as a node:http service (zero dependencies).
//
// LOCAL FALLBACK ONLY — this is NOT the deployment target. The deployed
// live-AI path is the common LLM layer (GitHub Pages → API Gateway → Lambda →
// Bedrock; see docs/handoffs/llm-layer.md). This server exists for local and
// container runs that need the live endpoints without a Vite dev server
// (e.g. serving a built dist/): build the client with VITE_AI_BASE_URL
// pointing here, and src/ai/adapter.ts does the rest.
//
// Prompt composition and vendor calls live in server/handlers.mjs (shared with
// the dev-proxy; llm-layer phase 1 ports them into the Lambda wrapper). This
// file adds only what network exposure requires:
//   - CORS allowlist (AI_ALLOWED_ORIGINS, comma-separated; e.g. the Pages origin)
//   - fixed-window per-IP rate limits so a stranger can't drain the keys
//   - request-body size cap (handlers.readJson)
//
// There is deliberately NO bearer token: any token shipped in the Pages bundle
// would be public anyway. Per-IP quotas + CORS are adequate for a local
// fallback, but they are NOT the public deployment's cost protection — that
// lives at the AWS edge (API Gateway throttling, reserved concurrency, budget
// alarms; llm-layer decision 8). Player sessions/quotas beyond that are the
// (future) BFF's job.
//
// Env:
//   ANTHROPIC_API_KEY / OPENAI_API_KEY   vendor keys (either enables its route)
//   AI_PORT                              listen port          (default 8791)
//   AI_HOST                              listen host          (default 0.0.0.0)
//   AI_ALLOWED_ORIGINS                   CORS origins         (default: none — browsers blocked)
//   AI_DIALOGUE_LIMIT_PER_MIN            per-IP dialogue rate (default 20)
//   AI_PORTRAIT_LIMIT_PER_MIN            per-IP portrait rate (default 3)
//   AI_TRUST_PROXY                       '1' to trust X-Forwarded-For (behind ALB/nginx)

import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { handleDialogue, handlePortrait, healthPayload, readJson, send } from './handlers.mjs';

/** Fixed-window per-key counter. Windows are 60s; stale entries are pruned on hit. */
function createRateLimiter(limit, windowMs = 60_000) {
  const hits = new Map(); // key → { windowStart, count }
  return {
    /** Returns retry-after seconds when over limit, or 0 when allowed. */
    hit(key, now = Date.now()) {
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (now - v.windowStart >= windowMs) hits.delete(k);
      }
      const entry = hits.get(key);
      if (!entry || now - entry.windowStart >= windowMs) {
        hits.set(key, { windowStart: now, count: 1 });
        return 0;
      }
      entry.count += 1;
      if (entry.count > limit) return Math.ceil((entry.windowStart + windowMs - now) / 1000);
      return 0;
    },
  };
}

export function createStandaloneServer(env = process.env) {
  const allowedOrigins = new Set(
    (env.AI_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );
  const limiters = {
    '/ai/dialogue': createRateLimiter(Number(env.AI_DIALOGUE_LIMIT_PER_MIN) || 20),
    '/ai/portrait': createRateLimiter(Number(env.AI_PORTRAIT_LIMIT_PER_MIN) || 3),
  };
  const trustProxy = env.AI_TRUST_PROXY === '1';

  function clientIp(nodeReq) {
    if (trustProxy) {
      const fwd = nodeReq.headers['x-forwarded-for'];
      if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
    }
    return nodeReq.socket.remoteAddress ?? 'unknown';
  }

  /** Applies CORS headers. Returns false when the request must not proceed. */
  function cors(nodeReq, res) {
    const origin = nodeReq.headers.origin;
    if (!origin) return true; // curl / same-origin — no CORS involved
    if (!allowedOrigins.has(origin.replace(/\/$/, ''))) {
      send(res, 403, { error: 'origin not allowed' });
      return false;
    }
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('vary', 'origin');
    if (nodeReq.method === 'OPTIONS') {
      res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
      res.setHeader('access-control-allow-headers', 'content-type');
      res.setHeader('access-control-max-age', '86400');
      res.statusCode = 204;
      res.end();
      return false;
    }
    return true;
  }

  const postRoutes = { '/ai/dialogue': handleDialogue, '/ai/portrait': handlePortrait };

  return createServer(async (nodeReq, res) => {
    const path = (nodeReq.url ?? '/').split('?')[0];
    if (!cors(nodeReq, res)) return;

    if (path === '/ai/health') {
      if (nodeReq.method !== 'GET') return send(res, 405, { error: 'GET only' });
      return send(res, 200, healthPayload());
    }

    const handler = postRoutes[path];
    if (!handler) return send(res, 404, { error: 'not found' });
    if (nodeReq.method !== 'POST') return send(res, 405, { error: 'POST only' });

    const retryAfter = limiters[path].hit(clientIp(nodeReq));
    if (retryAfter) {
      res.setHeader('retry-after', String(retryAfter));
      return send(res, 429, { error: 'rate limit exceeded' });
    }

    try {
      const { status, body } = await handler(await readJson(nodeReq));
      send(res, status, body);
    } catch (e) {
      send(res, e?.statusCode === 413 ? 413 : 502, { error: String(e?.message ?? e) });
    }
  });
}

// -------------------------------------------------------------------- main --

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.AI_PORT) || 8791;
  const host = process.env.AI_HOST ?? '0.0.0.0';
  const server = createStandaloneServer();
  server.listen(port, host, () => {
    const h = healthPayload();
    console.log(`apothecary-ai listening on ${host}:${port}`);
    console.log(`  dialogue (${h.models.dialogue}): ${h.dialogue ? 'configured' : 'NO KEY — 503'}`);
    console.log(`  portrait (${h.models.portrait}): ${h.portrait ? 'configured' : 'NO KEY — 503'}`);
    if (!process.env.AI_ALLOWED_ORIGINS) {
      console.log('  AI_ALLOWED_ORIGINS unset — browser (CORS) requests will be rejected');
    }
  });
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
