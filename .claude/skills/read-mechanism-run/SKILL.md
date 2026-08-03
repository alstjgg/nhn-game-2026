---
name: read-mechanism-run
description: Read the results of a DDAY mechanism probe run and write them up in the project's fixed format — probe setup, every call in every arm with the stance it chose and how it read the situation, stance-vs-belief signal comparison, then next moves framed as the three levers (stance set / default prompt / injection sentence). Use whenever asked to read, summarize, review, or report a run under planning/dday-mechanism/runs, or after executing a probe with tools/probe.
---

# Reading a mechanism run

The mechanism program exists to find **the state in which a mechanism demonstrably
works at a gate** — not to pass or fail a mechanism. So a read is a diagnosis:
what did the block actually change, what stayed the same, and which of the three
levers should move next.

Before writing anything, read `planning/dday-mechanism/RUNLOG.md`. Its `A#`
amendments override the deep-test plan and several of them change how a result
must be read (A5 fabricated ids, A7 malformation, A8/A9/A10 saturation).

## 1. Gather

```bash
node .claude/skills/read-mechanism-run/extract.mjs <experiment-id>
```

Takes an experiment id (`RB2-flatschema-revalidation`) or a run directory. It
emits the probe definition, every call in every arm, per-arm compliance, and the
cross-arm stance comparison. It does no interpretation.

Then diff the composed prompts, so the write-up can state the manipulation
exactly rather than describing it:

```bash
diff <(node tools/probe/run.mjs <suite> --print-prompt=baseline 2>/dev/null) \
     <(node tools/probe/run.mjs <suite> --print-prompt=live 2>/dev/null)
```

## 2. Write it up — fixed section order

### The probe

Gate question, then **every** stance with its full label in a table, then what
each arm injected — block id and full text, `(없음)` for a no-block arm. State
the prompt diff in chars (e.g. 1,248 vs 1,299) so the size of the manipulation is
visible. This section is what makes the rest legible; never compress it.

### One table per arm — every call, no sampling

| # | chose | rejected | how it read the situation | utterance |

- One row per kept call. **All of them.** A 2-of-10 excerpt is what this format
  exists to replace.
- "how it read the situation" is a **verbatim quote** from `inner_note` or
  `because_referent`, trimmed to the decisive clause, with the operative words
  bolded. Never paraphrase — the whole value is in the model's own words.
- Below the table: tally, and the count for whatever belief the probe is about
  (e.g. "fear reading adopted: 0/10"). Note explicit refusals separately from
  merely-absent ones; a note that says 겁에 질린 것이 **아니라** is evidence, not
  a null.
- List discarded calls with their reason. Never omit them.

### Signals side by side

| measured on | baseline | live | p |

At minimum: the stance signal and the belief signal. The extractor computes the
stance p; compute the belief p with the same helper. **The gap between these two
rows is usually the finding** — a mechanism can move the agent's model of the
situation completely while moving the stance not at all.

Then, in one line: whether the pre-registered drop condition and each contingency
fired, as written.

### What I'd do

Two to four moves, each naming which lever it pulls:

1. **The stance set** — cheapest, try first. A stance reachable from both
   readings is an escape option and hides the mechanism (plan §5.1 axis 4). Check
   which stances were never chosen in any arm: a gate offering four options that
   really offers two is a gate-design defect. Propose concrete replacement
   stances that force the two readings apart.
2. **The injection sentence** — is it aligned to the axis the temperament
   actually watches (law #1)? Does the frozen timeline already imply it (A8)? Is
   it pushing the same direction the baseline already leans, where a
   counter-lean block would make any movement signal (A9)?
3. **The default prompt** — last. It is D-task/spec territory and it invalidates
   every prior finding, so propose it only when 1 and 2 cannot work.

Also check the player-visible surface. If `utterance` is near-identical across
arms while `inner_note` separates cleanly, the mechanism is invisible to the
player as designed — a B3b legibility problem, and an argument for lever 1.

## 3. Rules

- **No verdicts.** gate / texture / drop is a human call at spec compile with the
  card in front of them (§9.3); ambiguity defaults to texture. Present the case.
- **Never a rate without its N and its raw sequence** (§9.2). `a,a,a → d,b,b`
  tells a reader more than `flip_rate: 1.0`.
- **Small-N unanimity is not "verified"** — 3/3 is consistent with a true rate
  near 37% (§5.4).
- **Flag your own coding bias.** If you coded the belief column yourself, say so:
  the probe author is barred from blind coding (§3 rule 3), so that column needs
  B3a by someone else before it goes on a card.
- **Check arm-comparability first.** If discard rates diverge between arms, the
  arms are differently-filtered samples and the comparison is void (§8.5 step 4).
  The extractor warns above 15 points; say it in the write-up.
- **Fabricated `because_block_ids` in a no-block arm is a compliance number**,
  not a traceability failure (A5).
- Cite artifact paths so a reader can check any claim.

## 4. Where it goes

The write-up is for reading. If the run changes how future probes must be built,
that belongs in `RUNLOG.md` as a dated run entry plus any new `A#` amendment —
append, never rewrite, and never edit the plan or the spec instead.
