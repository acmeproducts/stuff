# mkt ETL

`etl.py` keeps `mkt/work-batch-stamped` current. Runs in GitHub Actions (`.github/workflows/mkt-etl.yml`) at 06:15 and 14:15 Pacific, Mon-Sat, and on demand.

Rules
- Batch id = the last completed market day (today after 16:30 ET, else the previous business day). Readings are stamped 00:00 UTC of that day. Time of day is never used.
- Incremental: each series is fetched only from its last stored day (minus 3 readings for cross-check) to the batch day. Slow series look back 100 days to catch late releases and revisions.
- Cross-check: overlapping readings are compared with the source. FRED revisions are applied and logged. A price reading that differs more than 0.2% from the source fails that series and leaves it unchanged.
- Restart: all writes go to a staging copy; the index is extended and horizon viewports rebuilt there; checks run (anchor agrees, every 5D curve is exactly five business days); only then are files moved into place. Any failure leaves the data tree untouched. A lock file blocks overlapping runs.
- Complete batches only: the chart's anchor (`commonMarketAnchor`) is the last day every live component has a reading. Late readings are stored and appear once the batch is complete.

Reports: `mkt/etl/runs/<batch>.json` and `last-run.json` (per-series status, fetched/added/revised counts, mismatches, source digests, index rows added).

Offline test: `python3 mkt/etl/etl.py --root <copy> --reports <dir> --mock-from <tree with market-evidence/series> --now 2026-10-24T13:00:00+00:00`
