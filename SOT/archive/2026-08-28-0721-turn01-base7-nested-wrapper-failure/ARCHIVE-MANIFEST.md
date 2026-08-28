# Turn 01 Base-7 nested-wrapper generation failure

Owner run of canonical installer commit `bcf5a07dcf818698fa5efecb908e765967ed0c24` failed before live cutover with:

`expected build changed unexpectedly: found 2`

No live SOT mutation occurred.

Root cause: the Base-7 installer still depended on the Base-6 nested wrapper generator. That Base-6 generator itself invokes `patch-SOT-turn01-base-installer-wsl9p.py` against Base-5, and that patcher assumes the Base-5 `EXPECTED_BUILD` marker occurs once although the Base-5 generated wrapper contains it twice. The failure therefore occurs before the Base-7 patcher is reached.

Correction policy: retire the nested Base-5 -> Base-6 -> Base-7 wrapper chain for this turn. Rebuild the Base-7 installer directly from the frozen Base-3 installer source, applying the already-governed backend deltas in sequence (PowerShell -> strict Windows mount -> WSL2 9p -> volume union) and the completed-project idle-refresh UI delta before cutover. Accepted pre-base remains the release baseline.
