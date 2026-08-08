# Story-atom format (Phase 1)

Every mining agent writes one `atoms-S<n>.md` per corpus slice, in this shape.
Atoms are raw material, not selections: an atom that seems boring is captured
anyway. Selection begins at Phase 3, by a human.

## File structure

```
# Atoms — S<n> <slice name>
Snapshot: main @ 5a3c388, mined 2026-08-04.
Coverage: <what was read in full / sampled / skipped — no silent caps;
           anything not fully mined is stated here explicitly>

<atoms, numbered S<n>-001 …>
```

## Atom template

```
### S<n>-<nnn> — <short title>
- source: <path §heading | commit SHA | PR #n (body|review thread)>
- date: <date of the EVENT (not of the file), best effort; "?" allowed>
- lanes: <1 AI-in-the-game | 2 AI-building-the-game | 3 AI-in-planning |
          4 AI-as-creator | proposed:<new-lane-name> | unclear>
- event: <what happened — 1–3 sentences, past tense, self-contained: readable
          without opening the source>
- tension: <the decision, reversal, failure, or boundary at stake — what makes
            this a story seed, stated plainly, no embellishment>
- quote: <verbatim, in the source's language — optional but prized>
- links: <related atoms / sources / OH-1 hooks — optional>
- flags: <free vocabulary: failure | reversal | human-override | ai-limit |
          boundary | fabrication | pivot | measurement | cost | …>
```

## Extraction bias (revised 2026-08-05)

- **The full arc, weighted equally: successes and failures, impressive AI
  output and human-held boundaries, discoveries and shortcomings.** The reader
  of deliverable #4 is a game company evaluating AI for its own use — what
  worked and is worth adopting matters as much as what failed and had to be
  bounded. Do not privilege the confession over the win, or the win over the
  confession. (Supersedes the earlier "failures over successes" bias; atoms
  mined 2026-08-04 predate this and may under-sample wins — see README.)
- decisions over descriptions — capture the reasoned choice, not the surface
- the *reason* recorded with the choice beats the choice itself
- verbatim quotes beat paraphrase; Korean sources are quoted in Korean
- an atom must cite a real, checkable source — no synthesis across sources
  (that is Phase 2's job), no inference beyond the tension line

## Rules

- English structure/prose; source-language quotes verbatim.
- One event per atom. A document with five decisions yields five atoms.
- Contradictions between sources are captured as atoms themselves
  (flag: `contradiction`), not resolved.
- Slices with OH-1 corroboration hooks (S1, S4, S8, S9 — see
  `oral-history.md`) end their file with a `## OH-1 corroboration` section:
  hook → confirmed / contradicted / no trace, with sources.
