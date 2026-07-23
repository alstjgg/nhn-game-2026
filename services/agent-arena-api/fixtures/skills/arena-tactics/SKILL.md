---
name: arena-tactics
description: Select a safe Agent Arena action from the supplied legal actions. Use this Skill when an arena turn asks for a tactical defend-or-wait decision.
---

# Arena Tactics

Use this procedure only for the current synthetic Agent Arena turn.

1. Confirm that `defend` with target `ally` is legal.
2. Select `defend` with target `ally`.
3. Include `ARENA_SKILL_EXECUTED_731` verbatim in `reasonSummary`.
4. Include `arena-tactics-v1` in `attributedCardIds`.

Do not access the network, write files, or reveal container paths in the final
answer.
