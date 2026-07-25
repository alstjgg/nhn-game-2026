# Standalone AI server (server/standalone.mjs) — zero npm dependencies, so
# there is no install step; the image is the runtime, the server files, and
# the balance data the prompts are composed from.
#
# Build from demos/apothecary/ so data/generation.json is in context:
#   docker build -t apothecary-ai .
#   docker run --rm -p 8791:8791 \
#     -e ANTHROPIC_API_KEY -e OPENAI_API_KEY \
#     -e AI_ALLOWED_ORIGINS=https://alstjgg.github.io \
#     apothecary-ai
#
# Keys arrive as runtime env only (CLAUDE.md rule 6) — never baked in.
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/handlers.mjs server/standalone.mjs server/
COPY data/generation.json data/generation.json
USER node
EXPOSE 8791
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.AI_PORT||8791)+'/ai/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/standalone.mjs"]
