# mkt — Market Navigator restore points (chosen by behavior, not approvals)

Each folder is one git commit: the front end and its data exactly as they sat together.

Test used: Analyze spawns as a pixel-identical clone of NOW; dual Y-axis works in both; Horizon vs Fixed works in both; changing Analyze leaves NOW untouched; no page errors.
Result: 15 of 49 builds with an Analyze clone pass all checks. Earliest: Oct 5 23:40. Latest before the data gate: Oct 21 05:54. From Oct 21 10:23 the throwaway build shows "Market data withheld" and no chart.

| Folder | Role | Commit |
|---|---|---|
| floor-oct05-first-working-modular | Floor | d5bcf9094 (Oct 5 23:40) |
| mid-oct06-modular-analyze | Between | 9bc57e080 (Oct 6 04:07) |
| approved-oct18-throwaway-etl | Between | 2dd7826ee (Oct 18 20:48) |
| ceiling-oct21-last-before-data-gate | Ceiling | 90ef0e63e (Oct 21 05:54) |

Removed (fail the test or no Analyze clone): Sep 22 and Sep 27 builds, Oct 22 build. All remain in git history.

## baseline-sep27-t28-postship (proposed baseline)
Exact pair at commit 996e9a71b (Sep 27, Turn 28 post-ship): front end as index.html, with market-evidence and data/market-backend from the same commit. NOW only; dual axis and Fixed/Horizon present; chart clicks never open the series card. Known gap: indices end Sep 22 while raw series end Sep 24-25 (end-alignment rule not yet built).
