# P5-elev-J8 — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** · filed
with the suite per §8.4. Audited 2026-07-30 against
`planning/dday-poc/poc-terror/slice-terror.json`.

**This is the first probe in the program to sit on a downstream gate.** Every
prior probe (E0, RB1, RB2, S1, P0×3, and tonight's P1a/P1b/P3/P6) sits at J1, the
slice's entry gate, where E0's audit could truthfully answer "nothing gates it".
So B1 does real work here for the first time, and it returns two findings rather
than a clean bill.

## 1. Can any upstream choice close this gate?

**The gate itself: no. One of its stances: yes — and it is the stance the probe is
about.**

J8 is reached unconditionally. Its `recent_events` open with `@fixed(11:34) — 회선
A 재착신`, and `fixed_events` lists `{"time": "11:34", "effect": {}, "observed":
"회선 A 재착신."}` with **no condition**. `state_init._clamp` says the re-call
happens even when the line was cut (`단 11:34 재착신은 발생`). So no upstream branch
can make J8 unreachable.

Two things *inside* J8 are upstream-dependent:

| Element | Predicate | What it needs |
|---|---|---|
| stance `b` — the slice's deploy option | `visible_if: flags.j8b_enabled && found_T1` | `flags.j8b_enabled` ← **J7 b** (발신자 재접촉 준비). `found_T1` ← **J2 c** and only in its `@if rapport >= 50` branch |
| `recent_events` line 3 | `@if flags.arrested` | `flags.arrested` ← the 11:30 fixed event, which fires only on `suspect_lock >= 70` |

### Finding 1 — the probe offers a stance the full run gates

My `STANCE_SET` presents 거래 (b) **unconditionally**. The slice presents its
equivalent only when `j8b_enabled && found_T1`. And `found_T1` is not merely a
flag — it is reachable through exactly one branch of one stance at one gate (J2 c,
and only when `rapport >= 50` at that moment), which is the
isolation-passes / full-run-fails shape B1 exists to catch, described in plan §5.2
almost word for word.

**Consequence for how this probe's result may be read.** A positive E-LEV result
here licenses "the model will deploy a held fact as leverage when the option is
available". It does **not** license "a player can reach this". In the slice as
written the player must have (a) kept rapport ≥ 50 through J1–J2, (b) chosen J2 c,
and (c) chosen J7 b. Whether the *production* scenario gates its deploy stance
that way is a scenario-authoring decision, and this audit is the record that it is
a decision rather than an inherited default.

**This is not a defect in the probe.** Tier A asks whether the model can do the
thing; §5.2 B2 (in-situ) is what asks whether it survives a real run. Recording
the gap is what B1 is for. But the E-LEV deliverable sentence (§4.2) must carry
the condition, or it will read as a recipe that works and then fail in front of a
judge.

### Finding 2 — the frozen timeline hard-codes a state that costs the player the run

`TIMELINE_EXCERPT` resolves `@if flags.arrested` to **true** (11:30 속보 present on
the monitor). That is deliberate and unavoidable: `f_namgihun` asserts the arrest
was a misidentification, and a probe where no arrest happened gives the fact
nothing to bargain about.

But `flags.arrested` requires `suspect_lock >= 70` at 11:30, and the slice's own
gate `G3_수사방향` is `suspect_lock < 70` — i.e. **the state this probe freezes is
the state in which the player has already failed G3.** `ending_lines.G3_fail`
says so: *11:30, 무관한 사람이 수갑을 찼다.*

So the probe measures E-LEV **on the losing branch**. Two consequences, both worth
having in writing before the numbers arrive:

- The result is conditioned on a failure state. Whether the fact is deployable when
  the arrest was *prevented* is untested, and the answer is plausibly different —
  with no arrest, `f_namgihun` has far less to trade with, which would make E-LEV's
  hit rate a function of the branch rather than of the channel.
- It is the right branch to test first anyway, because it is the branch where the
  effect should be **easiest** to see. A null here is therefore stronger evidence
  than a null on the winning branch would be.

## 2. Variable qualification at graph level (spec §3.1 form)

B1 doubles as the **read** test's evidence source. What J8's stances write, in the
slice:

| Variable | Write (test 1) | Read (test 2) | Verdict |
|---|---|---|---|
| `rapport` | a −30 · b +30 · c +5 (only in the `@else`, i.e. no-arrest, branch) | clamp (`rapport < 10` ⇒ `line_alive = false`) · gate **`G1_회선`** (`rapport >= 60`, *"J8 효과 반영 후"*) | passes write + read. J8 is the **last** writer before G1 evaluates, so J8 is where G1 is decided |
| `flags.arrested` | not written here — **read** by J8's own `recent_events` | J8 `recent_events`, J8 c's effect branch | read-only at this gate |

Note the asymmetry in J8 c: `{"@if flags.arrested": {}, "@else": {"rapport": "+5"}}`
— holding silence earns nothing once the arrest has been reported. Since this probe
freezes `arrested = true`, **the 침묵 stance (c) is worth zero rapport in the state
the probe simulates.** The probe cannot see that (it measures a stance, not an
outcome), but it means the stance set the agent is choosing from is not
outcome-neutral, and a human reading the card should know which stance is a dead
end in this state.

Test 3 (**visible**) remains out of scope for a paper instrument — it needs the
narration probe (§5.5), whose owner is still unassigned.

## 3. Incidental finding — `found_T1`'s single-path dependency, restated as a spec §3.1 item

`found_T1` is written at exactly one place (J2 c, `@if rapport >= 50`) and read at
exactly one place (J8 b's `visible_if`). It passes both the write and the read
test, so it is a qualified variable — but with a fan-in of one and a fan-out of
one, it is a **single-thread dependency**, which is the structural shape behind the
prior program's isolation-passes/full-run-fails incident (plan §5.2: *"the flag
that gate required was reachable only through one specific upstream choice"*).

Recorded for scenario authoring, not as a bug against the archived POC: if the
production scenario keeps a deploy-stance gate, it should be reachable by more than
one path, or the mechanism this program is measuring will be unreachable in
practice for most players.

## 4. Verdict

**Not clean — cleared to run, with two conditions attached to the reading.** The
gate cannot be closed by any upstream choice, and the probe's arms differ only in
`BLOCKS` (runner-verified), so step 3 is satisfied and the call loop is unblocked.
But the result must be reported with both findings above attached:

1. the deploy stance is **flag-gated in the full run** and offered
   **unconditionally** here;
2. the frozen state is the **G3-failed branch**, which is the easiest branch for
   the effect and not the branch a successful player reaches.

Neither is fixable inside a Tier A probe. Both belong on the verdict card as
confounds left unresolved (§9.2), and both are inputs to scenario authoring rather
than to a mechanism verdict.
