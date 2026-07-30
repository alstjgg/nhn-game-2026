# Reachability audit — J2 (배경음 gate), Phase 7 E-PATH probes

B1 paper audit (plan §5.2), zero calls. Authored unattended for `P7a`/`P7b`;
owner: 윤석 · pending review.

## Graph position

J2 sits one gate downstream of J1 and is **conditional**: the slice guards it
with `line_alive == true`, falling back to `J2-dead`. `line_alive` flips false
when rapport drops below 10; from `rapport = 30` at init, J1's stances map to
a −30 (J1a) and c −40 (J1c) → **line dead**, b +20 / d +5 → line alive. So J2
is reachable only through J1 b/d — two of four stances, both measured
reachable at the S1 configuration (baseline mode 경청/d-shaped behaviour).
The probes' frozen timeline presupposes the call continuing, i.e. the b/d
branch; declared rather than hidden.

## Write/read status (§3.1 evidence form)

- The stance the E-PATH probes predict (대조 — consult the machine evidence)
  corresponds to slice J2b, which **writes** `flags.t1_clue: true` — a
  whitelisted (gate, stance) delta. **Read**: `found_T1`/`t1_clue` feed J8's
  option-b visibility (`j8b_enabled && found_T1`), so the flag is read
  downstream. Write and read tests both pass at graph level.
- The caller-directed stance (질문, slice J2c) is rapport-gated
  (`@if rapport >= 50`) — at the probe's implied state (rapport 30–50) its
  in-game effect branch is the *penalty* branch. The probe measures judgment,
  not effects, so this does not bias the probe; it does mean an in-situ (B2)
  run of this gate must control rapport before transferring anything.

## What this audit does not cover

No upstream flag closes J2 itself beyond `line_alive`; no stance at J2 is
visibility-gated. The isolation-passes/full-run-fails class is therefore
carried entirely by the `line_alive` condition, which the timeline declares.
