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

## Re-scoped (owner, Oct 24)
Floor = mkt/floor-sep22-t26-standalone-analyze: exact pair at commit 8e4b8864c (Turn 26 ship, daily-rebuild data, standalone Analyze opened from the series card). Known: its Analyze mimics NOW rather than reusing its code.
The Oct 5-6 folders are renamed reference-*: how to modularize Analyze, not ceilings. baseline-sep27-t28-postship was removed (wrong era; still in git history at 996e9a71b).
Open: no double-tap card code exists in any Market Navigator HTML from Sep 6 to Oct 5; the card opens by long-press/right-click on a legend chip.

## Re-scoped again (owner, Oct 24)
Floor = mkt/floor-sep27-t28-postship (commit 996e9a71b): NOW complete (Fixed/Horizon, dual axis, grouped USD on Y2); Analyze present via long-press card but malformed (oval chips, no Fixed/Horizon). floor-sep22-t26 removed: Turn 25/26 NOW lacks Fixed/Horizon and Y2 grouping; DXY ends short at 5D.
Known open: indices end Sep 22 vs raw Sep 25; 5D alignment of index components not yet verified on this pair.
Gesture: long-press legend chip opens the card (Analyze icon inside); tap never does.

## work-sep27-nodata-greyout (one change on the floor)
Rule (owner): if a series has no data for the horizon, do not draw it; grey the chip. Change: a series needs at least 2 real readings inside the horizon (one-line edit in the in-window indexing function). Floor folder untouched.
Lab result, RSK components: 5D greys NFCI (1 reading); MTD, 1YR, 5YR unchanged; no page errors. Not yet checked: GRW and MAC, Analyze, real phone. Remaining ragged cause (different clock times per series) not touched.
