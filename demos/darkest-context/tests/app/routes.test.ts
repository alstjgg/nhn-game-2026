// TDD-Red contract for u15 — app composition: the route table, the shell wiring seam and
// the single boot decision (PRD §2.2, §2.4, §5, INV-6).
//
// `.claude/super/units/u15/` carried neither design.md nor spec.md, so this file (with
// e2e/run-flow.spec.ts) IS the API contract for `src/app/routes.ts`, `src/app/boot-app.ts`
// and the one edit `src/main.ts` takes.
//
// Split follows u7/u10/u12: vitest runs in the `node` environment (vitest.config.ts says
// so explicitly — "DOM smoke lives in e2e/"), so this slice covers module exports, PURE
// mapping functions, source-text seams and the registry — never a rendered document.
// Everything that needs a booted page is proved in e2e/run-flow.spec.ts.
//
// Two consequences of the node environment, both deliberate:
//   · `registerRoutes()` must be callable with no `document` in scope. Registering a
//     screen stores a mount FUNCTION; nothing may render at registration time.
//   · the "no screen unit's files are modified" half of AC2 is a git check, not an
//     import check — it is the only way to assert a NEGATIVE about other units' files.
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..'); // demos/darkest-context/

const p = (rel: string): string => resolve(root, rel);
const read = (rel: string): string => readFileSync(p(rel), 'utf8');

/** TS has both comment forms. Strip them so a comment can never satisfy an assertion. */
const code = (rel: string): string =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.ts')) out.push(relative(root, full));
  }
  return out;
}

/** Every TS module under src/, repo-relative — the surface the seam checks scan. */
const SRC_FILES = walk(p('src'));

/** Files whose text contains `needle` (comments stripped). */
const callSites = (needle: RegExp): string[] =>
  SRC_FILES.filter((file) => needle.test(code(file)));

const countOf = (text: string, needle: RegExp): number => text.match(needle)?.length ?? 0;

// ── the six screens the shell registry must carry ────────────────────────────
const EXPECTED_SCREEN_IDS = ['stage', 'combat', 'training', 'council', 'rest', 'end'] as const;

/** PRD §2.4 tile kinds → the screen that plays them. `stage`/`end` are phase screens. */
const TILE_KIND_ROUTES: Record<string, string> = {
  combat: 'combat',
  combat_final: 'combat',
  training: 'training',
  puzzle: 'council',
  choice: 'council',
  rest: 'rest',
};

describe('u15 A1 — the composition modules exist where the unit declares them', () => {
  it('ships src/app/routes.ts and src/app/boot-app.ts', () => {
    expect(existsSync(p('src/app/routes.ts')), 'src/app/routes.ts is missing').toBe(true);
    expect(existsSync(p('src/app/boot-app.ts')), 'src/app/boot-app.ts is missing').toBe(true);
  });

  it('leaves the u1 shell seam itself untouched — routes wire INTO it, never around it', () => {
    const shell = code('src/app/shell.ts');
    expect(shell).toMatch(/export function registerScreen\b/);
    expect(shell).toMatch(/export function mountScreen\b/);
    expect(shell).toMatch(/export function mountShell\b/);
  });
});

describe('u15 A2 — the route table (pure, node-safe)', () => {
  it('exports SCREEN_IDS covering exactly the six composed screens', async () => {
    const routes = await import('../../src/app/routes.ts');
    expect(Array.isArray(routes.SCREEN_IDS), 'SCREEN_IDS must be an array').toBe(true);
    expect([...routes.SCREEN_IDS].sort()).toEqual([...EXPECTED_SCREEN_IDS].sort());
  });

  it('freezes SCREEN_IDS — the registry contents are not a runtime opinion', async () => {
    const routes = await import('../../src/app/routes.ts');
    expect(Object.isFrozen(routes.SCREEN_IDS)).toBe(true);
  });

  // `screenIdForTile(kind: string): string` — a plain string in, so an unauthored kind
  // is a RUNTIME throw (data is authored in JSON and can outrun the union type).
  it('maps every PRD §2.4 tile kind onto a registered screen id', async () => {
    const routes = await import('../../src/app/routes.ts');
    for (const [kind, screenId] of Object.entries(TILE_KIND_ROUTES)) {
      expect(routes.screenIdForTile(kind), `tile kind ${kind}`).toBe(screenId);
      expect(routes.SCREEN_IDS).toContain(screenId);
    }
  });

  it('routes every tile actually authored in data/map.json', async () => {
    const routes = await import('../../src/app/routes.ts');
    const map = JSON.parse(read('data/map.json')) as { tiles: { id: string; kind: string }[] };
    expect(map.tiles.length).toBeGreaterThan(0);
    for (const tile of map.tiles) {
      const screenId = routes.screenIdForTile(tile.kind);
      expect(routes.SCREEN_IDS, `tile ${tile.id} (${tile.kind})`).toContain(screenId);
    }
  });

  it('throws on a tile kind nobody authored — a silent default would strand the run', async () => {
    const routes = await import('../../src/app/routes.ts');
    expect(() => routes.screenIdForTile('boss_rush')).toThrow(/boss_rush/);
  });
});

describe('u15 A2 — registerRoutes() is the only wiring into the shell registry', () => {
  it('registers every SCREEN_IDS entry, and nothing else', async () => {
    const routes = await import('../../src/app/routes.ts');
    const shell = await import('../../src/app/shell.ts');

    routes.registerRoutes();

    for (const id of routes.SCREEN_IDS) {
      expect(shell.hasScreen(id), `screen not registered: ${id}`).toBe(true);
    }
    expect(shell.screenIds().sort()).toEqual([...routes.SCREEN_IDS].sort());
  });

  it('is idempotent — a second call does not trip the duplicate-id guard', async () => {
    const routes = await import('../../src/app/routes.ts');
    const shell = await import('../../src/app/shell.ts');

    routes.registerRoutes();
    const before = shell.screenIds().sort();
    expect(() => routes.registerRoutes()).not.toThrow();
    expect(shell.screenIds().sort()).toEqual(before);
  });

  it('registers without rendering — there is no `document` in this environment', async () => {
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    const routes = await import('../../src/app/routes.ts');
    const shell = await import('../../src/app/shell.ts');
    expect(() => routes.registerRoutes()).not.toThrow();
    expect(routes.SCREEN_IDS.every((id: string) => shell.hasScreen(id))).toBe(true);
  });

  it('is the ONLY registerScreen() call site in src/** (the single legal seam)', () => {
    // shell.ts declares it; every other mention is a call.
    const sites = callSites(/\bregisterScreen\s*\(/).filter((f) => f !== 'src/app/shell.ts');
    expect(sites).toEqual(['src/app/routes.ts']);
  });

  it('keeps mountScreen() inside src/app/** — no screen mounts a sibling', () => {
    const sites = callSites(/\bmountScreen\s*\(/).filter((f) => f !== 'src/app/shell.ts');
    expect(sites.every((f) => f.startsWith('src/app/')), `mountScreen in ${sites.join(', ')}`).toBe(
      true,
    );
  });

  it('never imports a screen internal — barrels only', () => {
    const routesSrc = code('src/app/routes.ts');
    const deepImports = [...routesSrc.matchAll(/from\s+'([^']*screens\/[^']*)'/g)]
      .map((m) => m[1])
      .filter((spec) => !/screens\/[a-z]+\/index\.ts$/.test(spec));
    expect(deepImports, `deep screen imports: ${deepImports.join(', ')}`).toEqual([]);
  });

  it('leaves screen modules ignorant of the shell — none imports app/shell.ts', () => {
    const offenders = SRC_FILES.filter(
      (file) => file.startsWith('src/screens/') && /app\/shell/.test(code(file)),
    );
    expect(offenders).toEqual([]);
  });
});

describe('u15 A2 — boot chooses adapter mode + tieBreak policy exactly once', () => {
  it('exports bootApp() from src/app/boot-app.ts', async () => {
    const bootApp = await import('../../src/app/boot-app.ts');
    expect(typeof bootApp.bootApp).toBe('function');
  });

  it('has exactly one bootAdapter() call site in src/**, and it is boot-app.ts', () => {
    const sites = callSites(/\bbootAdapter\s*\(/).filter((f) => f !== 'src/ai/boot.ts');
    expect(sites).toEqual(['src/app/boot-app.ts']);
    expect(countOf(code('src/app/boot-app.ts'), /\bbootAdapter\s*\(/g)).toBe(1);
  });

  it('builds no adapter of its own — mode selection belongs to src/ai/boot.ts', () => {
    const appFiles = SRC_FILES.filter((f) => f.startsWith('src/app/'));
    const offenders = appFiles.filter((f) => /create(Stub|Live)Adapter\s*\(/.test(code(f)));
    expect(offenders, `app-side adapter construction: ${offenders.join(', ')}`).toEqual([]);
  });

  it('hard-codes no tieBreak policy — the policy arrives with the mode (PRD §2.2)', () => {
    const appFiles = SRC_FILES.filter((f) => f.startsWith('src/app/'));
    const offenders = appFiles.filter((f) => /policy\s*:\s*['"](index|random)['"]/.test(code(f)));
    expect(offenders, `inlined tieBreak policy: ${offenders.join(', ')}`).toEqual([]);
  });

  it('keeps main.ts a one-line composition root: one bootApp() call, no engine wiring', () => {
    const main = code('src/main.ts');
    expect(countOf(main, /\bbootApp\s*\(/g)).toBe(1);
    for (const forbidden of [/\bbootAdapter\s*\(/, /\bcreateRun\s*\(/, /\bregisterScreen\s*\(/]) {
      expect(forbidden.test(main), `main.ts must not call ${String(forbidden)}`).toBe(false);
    }
  });

  it('schedules nothing on a clock and rolls no dice (INV-6)', () => {
    const appFiles = SRC_FILES.filter((f) => f.startsWith('src/app/'));
    for (const file of appFiles) {
      const body = code(file);
      expect(/\bsetTimeout\s*\(/.test(body), `${file} uses setTimeout`).toBe(false);
      expect(/\bsetInterval\s*\(/.test(body), `${file} uses setInterval`).toBe(false);
      expect(/\bMath\.random\s*\(/.test(body), `${file} uses Math.random`).toBe(false);
      expect(/\bDate\.now\s*\(/.test(body), `${file} uses Date.now`).toBe(false);
    }
  });
});

describe('u15 A2 — this unit modifies no other unit\'s files', () => {
  /** The slices u15 composes but must not touch. */
  const FROZEN_SLICES = [
    'src/screens/',
    'src/ui/',
    'src/run/',
    'src/ai/',
    'src/combat/',
    'src/council/',
    'src/equip/',
    'src/core/',
    'src/data/',
  ];

  const git = (args: string[]): string =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

  /**
   * The unit's fork point, without guessing at a main-branch name: the commits
   * reachable from HEAD and from NO other ref are this branch's own, so the parent
   * of the oldest of them is where u15 started. No own commits ⇒ the working tree
   * itself is the whole diff.
   */
  const forkPoint = (): string | null => {
    try {
      const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
      const own = git([
        'rev-list',
        'HEAD',
        '--not',
        `--exclude=refs/heads/${branch}`,
        '--branches',
        '--remotes',
      ])
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (own.length === 0) return 'HEAD';
      return git(['rev-parse', `${own[own.length - 1]}^`]);
    } catch {
      return null;
    }
  };

  const base = forkPoint();

  /**
   * The gate is a UNIT-branch gate: it asks whether u15's own branch stayed inside its
   * slice. An integration branch is by definition the place where every slice's commits
   * meet, so running it there asks a question that has no true answer — it would report
   * every other unit's landed work as u15 trespassing. Off the unit branch it stands down.
   */
  const onUnitBranch = ((): boolean => {
    try {
      return /(^|[-/])u15$/.test(git(['rev-parse', '--abbrev-ref', 'HEAD']));
    } catch {
      return false;
    }
  })();

  it.skipIf(base === null || !onUnitBranch)('touches no file under another unit\'s slice', () => {
    const changed = git(['diff', '--name-only', base as string, '--', '.'])
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^demos\/darkest-context\//, ''));

    const offenders = changed.filter((file) =>
      FROZEN_SLICES.some((slice) => file.startsWith(slice)),
    );
    expect(offenders, `u15 modified other units' files: ${offenders.join(', ')}`).toEqual([]);
  });
});
