Same front end as ../floor-sep27-t28-postship (byte-identical index.html) and the same index files.
Only the series data changed (smart data, dumb report):
- every reading is stored by batch date (time of day dropped);
- readings after the common batch (2026-09-22) are not stored here;
- series whose latest reading is older than the batch carry that value forward to the batch date (as-of), marked in each file under batchAlignment.
Result (headless, 412px, RSK/GRW/MAC x 1D..5YR): every line ends at one x per view.
