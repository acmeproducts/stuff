Based on ../floor-sep27-t28-postship (Sep 27 Turn 28 post-ship) with the same index files.
Two changes, nothing else:
1. DATA (smart data): every series reading is stored by batch date (time of day dropped); nothing after the common batch (2026-09-22); series whose latest reading is older than the batch carry that value forward to it (as-of), marked per file under batchAlignment.
2. FRONT END (one token): the chart window ends at the batch stamp (anchor T00:00:00Z) instead of anchor T23:59:59Z, so the last batch sits on the right edge instead of a day short of it.
Result (headless, 412px, RSK/GRW/MAC x 1D..5YR): every line ends at the same right-edge x in every view; no console errors.
