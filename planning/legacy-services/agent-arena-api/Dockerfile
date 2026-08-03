FROM node:24-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    ARENA_HOST=0.0.0.0 \
    ARENA_PORT=8790
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY config ./config
RUN mkdir -p /app/data \
  && chown node:node /app/data \
  && chmod 0750 /app/data \
  && chmod -R a-w /app/dist /app/config /app/package.json /app/package-lock.json
USER node
EXPOSE 8790
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "const p=process.env.ARENA_PORT??'8790';fetch(`http://127.0.0.1:${p}/healthz`).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "dist/server.js"]
