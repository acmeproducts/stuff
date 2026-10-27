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

### Reverted (owner, Oct 24): batch-date placement and day-end horizon
Wrong premise: the date is only a batch identifier. A reading for batch 10/22 can arrive on 10/23, so placing by timestamp date would put it in the wrong batch. Work copy is back to change 1 only (no-data greyout). Fix needs a batch id carried with each reading, assigned by the collector.

## Graveyard (owner rejected, Oct 24)
Removed: dumb-now (from-scratch modular NOW/Analyze), model-batch-store (modeled data), check_design.py, work-sep27-nodata-greyout. Reason: the agreed plan is to restore a working front-end/data pair from history (floor and ceiling), not to rebuild. All remain in git history at commit 2396c81.
Kept: DESIGN-IMPERATIVE.md (the principle, for the later rebuild of the data pipeline), the floor, the Oct reference folders.

## recovery-sep23-synchronized-backend
Exact pair at commit ed89bea39 (Sep 23 2026 02:45 Pacific). Page: market-navigator-turn28-pre-ship.html (dual axis, no Fixed/Horizon yet). Data: market-evidence/ and data/market-backend/ from the same commit.
Fact: last state where index file and daily series both end Sep 21-22. From Sep 23 the index stays frozen at Sep 22 while series continue.
Fact: HY spread ends one day before the other series on every day measured (Sep 16-27).
Role: recovery point / backend anchor. Floor with Fixed/Horizon remains floor-sep27-t28-postship.

## baseline-turn29-pre-ship
Exact pair at commit 0f3099342 (Oct 5 2026): page market-navigator-turn29-pre-ship.html (dashboard landing, CHART view with Fixed/Horizon and dual axis, long-press card, Analyze) with market-evidence/ and data/market-backend/ from the same commit.
Tested: tap on chip or plot opens no card; right-click/long-press opens card; Analyze button present.
Fact: index file frozen at Sep 22 while raw series run to Oct 2 (HY Oct 1, NFCI Sep 25), so 5D components end ragged. Backend was not synced to this front end.

## work-batch-stamped
Floor pair (996e9a71b). Data changes 1-3, then three small page changes 4-6:
1. Every trading-day series (Yahoo) restamped to one batch-day stamp (00:00 UTC of its market day); same-day duplicates keep the last; weekend readings dropped. FRED, weekly, monthly series untouched.
2. Index extended from Sep 22 to Sep 24 (last day every daily component exists; HY posts a day late). New rows use the stored model's own anchors and frozen scales; slow series (monthly, weekly, quarterly) held. Sep 23 risk row matches the stored value exactly. Weekend rows removed from index history (36).
3. 5D horizon start changed from 5 calendar days to 4 business days back (your rule: current day plus 4 previous business days), via market-navigator-build-persistent-compat.py copy logic.
4. Page: Y2 now holds every dollar series (SPY, QQQ, gold, WTI, copper...) together, labeled USD; before, only the last-added series was on Y2 in its own unit and USD per barrel / per pound counted as separate kinds. The card still shows the specific unit.
5. Page: a series needs two readings inside the horizon to draw; otherwise it is greyed and not drawn (fixes NFCI showing a lone dot at 5D).
6. Page: a tap on a series line only selects it (turn 24 behavior); every build from turn 25 to 37 opened the card from a plot tap, which is why no committed file had Fixed/Horizon without that defect. Dates (axis, tooltip, card) formatted in UTC so batch day Oct 20 never shows as Oct 19.
7. Page: long-press on a legend chip now takes 0.75 s (was 0.45 s) and cancels if the finger moves more than 8 px.
Audit (every index x every horizon, from the page's own series builder): 1D, 5D and MTD all start at the window start and end Sep 24 flush for every drawn series; slow series greyed. No page errors. Taps on chip, series and plot open no card; long-press does; Analyze opens with oval chips.
Result (rendered, all three indices at 5D): all series start Sep 18 and end Sep 24 flush. Monthly series greyed at 5D.
Open assumptions (override me): rules 4-6 above are my calls. NFCI weekly and monthly series end at their last release in MTD/YTD/1-3-5YR views (not held forward); NFCI held at its Sep 11 state (no release known); generatedAt field not updated; the index history before Sep 22 kept as stored.

## ETL (mkt/etl)
Scheduled incremental ETL keeps work-batch-stamped current: see mkt/etl/README.md. First live batch 2026-10-27 (run 40598776852): all 40 automated sources fetched; Yahoo through Oct 27 close, FRED dailies through Oct 26 (FRED posts next business day), anchor 2026-10-26. CPI/core CPI/PCE/core PCE are stored as year-over-year percent and computed from FRED levels. Source revisions found and applied on the first pass: PCE (annual revision, ~0.25pp), retail sales (benchmark), payrolls, NFCI, industrial production, GDP.
