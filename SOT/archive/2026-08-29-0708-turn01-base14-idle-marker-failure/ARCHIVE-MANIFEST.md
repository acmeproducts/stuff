# Turn 01 Base-14 idle-marker generation failure

Owner run at 2026-08-29 07:08 PT.

Observed:
- accepted live runtime remained Base-9 before generation;
- clean Base-3 backend integration succeeded;
- Base-14 backend generation succeeded;
- Base UI rebuild succeeded;
- durable picker-state UI patch succeeded;
- generation then failed before cutover in `patch-SOT-turn01-base-idle-refresh.py` because that patch still required the obsolete literal UI wording `Windows plus real Windows-backed WSL mounts`;
- no Base-14 candidate was installed; Base-9 remained live.

Interpretation: this is a brittle text-marker coupling in the idle-refresh patch, not a runtime storage failure. The idle-refresh behavior must be rebuilt against the clean UI without requiring unrelated storage-copy text.