# Last known good (decided by Claude, from evidence)

Pair: mkt/floor-sep27-t28-postship (commit 996e9a71b, Sep 27 2026 08:07 PT). Page and data from the same commit, untouched.

Why this pair:
- Fixed/Horizon exists only from Sep 27 (checked every Market Navigator page in history, turn 2 to turn 37). Nothing earlier has it.
- It has every NOW feature asked for: left rail, Fixed/Horizon, dual axis, long-press card with Analyze icon, tap on chip or plot opens no card, Analyze chips oval while NOW chips oblong.
- It is the last build before NOW and Analyze were unified (turn 29 onward) and before the modular Analyze (turn 37) lost the oval chips.

Known defects (data side, not page side):
- Index file frozen at Sep 22 while raw series run to Sep 25.
- HY spread ends one day before the other series on every day measured (Sep 16-27).
- Series with no data for the horizon are not greyed in the 5D check.

Recovery points kept: recovery-sep23-synchronized-backend (last day index and series agree), baseline-turn29-pre-ship.
