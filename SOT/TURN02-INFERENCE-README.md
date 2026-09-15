# SOT Turn 02 Pre-Base — Inference Fixture Gate

This directory is a clean-lineage executable proof of the Turn 02 inference contract.

Run:

```bash
node SOT/sot-turn02-inference.js
```

Pass target:

```text
PASS placements=24 content=12 duplicateGroups=7 KEEP=11 PROTECT=5 REMOVE=5 REVIEW=3 reclaimableBytes=36
```

The fixture is synthetic and performs no filesystem mutation. It proves exact-content grouping and deterministic KEEP / PROTECT / REMOVE / REVIEW classification before any real storage adapter is introduced.

`--json` prints the complete consolidation plan. `--write` writes `SOT-TURN02-PLAN.json` locally for inspection.
