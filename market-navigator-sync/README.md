# Verified chart data synchronization

The destination is the existing `market-navigator-throwaway-review` validation route. The accepted shared chart is pinned to blob `bad364c59ec19ad84ff650ba0c6b99b1f778d3be` (approved shared chart with accepted reference/selector corrections and source-bound persistent Chart Config). The ETL rail exposes verified loaded-package receipts, per-source qualification and live synchronization job stages. Run ETL opens GitHub’s authenticated manual workflow control; no repository credential is delivered to the browser.

`run.py` copies the current hash-verified package into an isolated candidate, selectively checks approved sources when due, and checks each complete source history at least daily to catch old-period revisions. It retains and independently parses actual provider responses. Incomplete market candles are excluded using the existing publication calendars. The sole approved missing-provider-prefix exception is HY's exact pinned archival prefix.

Native observations are transformed, existing ALFRED availability history is incrementally extended when FRED inputs change, and all three governed indices are evaluated on every retained QQQ market date plus their actual component event dates. Unchanged component states remain valid inputs. Fixed registry, weights, scale and numeric anchor inputs cannot change silently. Each horizon is a viewport over that persistent series. All 39 native-series reports use the same explicit calendar windows, with actual observation statistics and carry states identified separately.

Publication requires 39 source/transform checks, 273 horizon summaries, all 21 index horizons, every historical component input/signal, complete market evaluation coverage, every horizon point and endpoint contribution reconciliation. Chrome/Edge local checks and hosted Chromium check the existing chart, both display modes, MAC selection, Analyze and Library. A failed gate leaves the current data tree intact; failure status and evidence are retained separately.

The GitHub workflow checks hourly. Sources not due and checked within 24 hours are skipped; if nothing is due the same verified package is reused, with no browser installation, browser rerun or publication. Implementation regressions run on code pushes/manual runs. Repository-configured FRED/ALFRED secrets are validated by the hosted run and used only for authenticated availability history; current native CSV collection remains unauthenticated. Credentials never enter a package or log. Short horizons use the last two market evaluations for 1D and last five market sessions for 5D, so a weekend cannot make 1D a singleton. Longer horizons start at the first market evaluation within their named calendar window.

Historical ALFRED baseline events remain the previously qualified retained history, not a newly acquired baseline. HY retains its explicit retrospective backcast exception. New availability responses are retained with hashes and credential-free request parameters. This is a validation-data pipeline; production aliases remain separate.

Run:

```text
python market-navigator-sync/run.py --base market-navigator-throwaway-review --output <new-candidate-directory> --force
python market-navigator-sync/test_sync.py
python market-navigator-sync/test_vintage.py
```

The output path must be new. Tests use the existing immutable qualification package for fixed-date regressions; moving live data is not the fixture. Publication updates the complete validation tree in one Git commit, after all gates, and checks that its source data version was not replaced concurrently.

If HY's provider history window rolls forward, its original 1,893 archived observations remain pinned to the approved hash. Additional rows leaving that window are retained unchanged from the preceding hash-verified package, with that package version and native revision recorded. This prevents daily synchronization from deleting known observations or stopping merely because a rolling provider window advanced.
