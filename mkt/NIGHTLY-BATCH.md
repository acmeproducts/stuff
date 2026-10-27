# Nightly batch (2026-10-26)

Owner report: little confidence in the data method; the old all-or-nothing run was more accurate.

Facts found:
- History cut was rolling (today minus 10.25 years). It had reached 2016-07-27; the index anchor 2016-09-01 would have fallen off about 2026-12-01.
- A failed FRED night (Oct 22, "zero observations") still published, stale, with no block.
- Persistent index files were last written 2026-09-23 and never refreshed.

Change:
- History floor fixed at 2016-07-01 (no rolling cut). Each pull retries 3 times.
- `market-navigator-nightly-batch.py gate` rejects the whole night (nothing committed, last good stays live) if any enabled series errored, was not refreshed that run, lost early history, shrank, moved back, or an index component starts after the anchor.
- Batch date = the latest date every daily series has reached; written to `market-evidence/batch.json`.
- `... index` appends persistent indices up to the batch date. Published history is never rewritten (checked); all three end on the batch date.

Open assumption (override me if wrong): new index days use stored canonical values, not ALFRED vintages (no API key stored in the repo). Rebuilding the whole history this way differs from the Sep 23 file by 0.06-0.22 points on average (max 1.4), which is why history is append-only.

Not done: GDP q/q and y/y unit labels; 0.28 RSK offset; front end pairing.

## GDP labels (2026-10-26)
Fact: gdpQoq and gdpYoy held raw GDP dollar levels (24,408) labeled percent; the catalog named the derivation but the pipeline ignored it.
Fix: pipeline now derives both from realGdp (q/q 0.55%, y/y 2.19% latest). Gate no longer treats a shorter derived history as lost history.
