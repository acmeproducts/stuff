# mkt — Market Navigator recovery candidates

Each folder is self-contained: front end + its own data. Nothing outside mkt/ is touched.

| Folder | Front end (blob) | Data vintage | Source |
|---|---|---|---|
| candidate1-t28-sep23 | Turn 28 post-ship (9ce7f674) | Sep 22 cutoff (persistent file dated Sep 23) | market-navigator-chart-only-review |
| candidate2-t28-oct23 | Turn 28 post-ship (9ce7f674) | Oct 21 complete batch | market-navigator-throwaway-review data |
| candidate3-approved-oct23 | Owner-approved throwaway (ee38d9c9) | Oct 21 complete batch | market-navigator-chart-correction + same data |

Data copied: persistent index file, health envelope, sync proof, series, data/market-backend. Heavy capture/vintage folders omitted.
