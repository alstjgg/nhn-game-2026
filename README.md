# nhn-game-2026

Competition entry for the **NHN AI Game Competition (2026)** — built by a 2-person team.
The game is still unnamed and the engine/genre is not yet chosen; this repo currently holds an
engine-agnostic Vite + TypeScript skeleton that renders a placeholder so the deploy pipeline can
be verified end-to-end.

**Status:** DDAY concept confirmed (2026-07-28) — see [docs/status.md](./docs/status.md)
for current state.

**Live (placeholder):** https://alstjgg.github.io/nhn-game-2026/

## Stack

- Vite + TypeScript (vanilla, strict mode) — no game engine installed yet.
- Deployed to GitHub Pages via GitHub Actions on every push to `main`.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build locally
```

## Layout

```
src/            the browser bundle + isomorphic core (engine · composer · client)
authoring/      authoring-time preprocessing: datapack compile · lint · type generation
tools/          Node-only executables — probe runner, beat driver, shared call libs
proxy/          the LLM tier — Lambda + Bedrock, deployed separately from Pages
demos/          playable demos, own stacks — each deployed at /<slug>/ by the Pages workflow
planning/       planning-phase archive — concepts, scenarios, paper tests, meetings, legacy-services
public/assets/  static assets served as-is
data/           balance-as-data — datapacks, policy, the user prompt layer
docs/           living docs — project status, competition requirements, deliverable drafts
.github/        CI/CD (GitHub Pages deploy)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). **Important:** verify your git identity before your
first commit (this repo must be attributed to personal accounts, not corporate ones).

## License

MIT for our own code — see [LICENSE](./LICENSE). Third-party asset licenses are tracked
separately in [`assets-manifest.json`](./assets-manifest.json).
