# Modeled batch store (smart data, dumb front end)
Purpose: model what a batch-stamped collector would store, so the front end only draws it. One pre-aggregated package per index x horizon (store/<index>-<horizon>.json): one common slot calendar, every series aligned to it, Horizon / Fixed / native values already computed, axis group (Y1/Y2) already assigned, availability already decided. Front end does no date math, no rebasing, no filtering.
Built by build_model.py from the Sep 27 floor pair (read-only). 
Model assumptions (owner to override): batch id = date part of the stored stamp (real collector must assign it); weekend stamps dropped for daily sources; last reading in a batch wins; slower sources (weekly/monthly/quarterly) carry their latest published state to each batch with the source date kept; a series needs 2+ real readings in the horizon or it is greyed;  Horizon-mode index = 100 + (value - value at T0); additive transform families use 100 + (value - base) and are never ratio-rebased.
Validation (all 18 packages): every series array matches the slot count; every available series has a value at the NOW batch; greyed lists are correct (5D: NFCI, payrolls, unemployment, manufacturing production, CPI, core PCE).
Known data defect shown by the model: the floor's MAC index curve is missing 2 / 6 / 11 batch days in 1YR / 3YR / 5YR (bond-market holidays), so the floor never had one common calendar.

## Horizon rules (owner, Oct 25): a day is a business day
- 1D = the current batch only (one slot; drawn as points, no line).
- 5D = current business day + 4 previous (5 slots).
- MTD = first business day of the month through the current batch. (Open: a rolling 1-month horizon is not defined; MTD kept as the floor has it.)
- YTD = first business day of the year through the current batch.
- 1YR / 3YR / 5YR = first business day on or after the same date 1/3/5 years back, through the current batch.
- Calendar = business days with a batch (SPY batches); Horizon values rebase to 100 at the first slot of the window.
Result (Sep 22 NOW): 5D = Sep 16,17,18,21,22; MTD 15 slots; YTD 181; 1YR 252; 3YR 752; 5YR 1255. No validation problems in 21 packages.
