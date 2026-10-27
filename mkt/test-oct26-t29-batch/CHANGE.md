# test-oct26-t29-batch

Front end: Turn 29 NOW (#128, commit e4ce1d5c) plus five small edits: window ends at 00:00Z of the batch date; plot taps never open a card (card only by long-press on legend chip); picker "About" removed; unselected series dim to 0.6 instead of 0.22; Y2 takes every USD series, labeled USD; footer shows index first -> last so Fixed vs Horizon is visible.
Data: live nightly package (batch 2026-10-23, from the new gated run, commit 2bbf795), every series clipped to the batch date, slow series carried as-of to it (`batchAlignment` in each series file).
Checked in headless phone-size browser: no script errors; left rail present; all lines end at the right edge; plot tap = tooltip only; chip tap = no card; chip long-press = card; Y1+Y2 offered; Fixed 99.29 -> 99.17, Horizon 100 -> 99.88.
Not verified: live GitHub Pages URL and a real phone.
Open assumption (override me): T29's hard-coded current-state chip labels left as they are.
