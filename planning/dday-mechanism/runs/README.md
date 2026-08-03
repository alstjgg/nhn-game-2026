# runs/ — measured artifacts only

One directory per experiment, written by `tools/probe`:

```
<EXP>-calls/
  calls-<arm>.md       PRIMARY — verbatim responses, arm table, pairing verdict
  metrics-<arm>.json   derived — must be recomputable from the .md by hand
```

Rules (deep-test plan §3 rule 5, §7.4):

- **Never edit an artifact after the fact.** The runner refuses to overwrite;
  if a run aborted, use a new experiment id rather than `--force`.
- **Discarded and failed calls stay in place**, flagged, in sequence.
  Quarantine, not removal — a discard is data about the harness.
- **`--dry-run` output does not belong here.** Dry records are stamped
  `dry_run: true`, but this directory is for measured data; keep dry output in a
  scratch path via `--out=`.
- If `calls-*.md` and `metrics-*.json` disagree, the JSON is wrong.
