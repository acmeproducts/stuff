# SOT patch archive

Archived before the dynamic Windows-drive discovery patch on 2026-08-28 02:21 PT.

This archive freezes the exact canonical artifacts that were current immediately before the patch:
- `SOT-turn01-base.html` blob `0957f8d1d3170aaf51e03e6c4b51e6d77fec1417`
- `integrate-SOT-turn01-base.py` blob `463f6a995aaf4f53ba7359ee7f36f9cc381d89a8`
- `install-SOT-turn01-base.sh` blob `1f1e80edf7e7d3a5d0f1cd8d657b5400ab2b61b3`

Patch reason: prior builds dynamically exposed Windows file-system drives; the current Base only exposed already-mounted WSL paths, so Windows-visible D:, F:, and Q: were absent even though PowerShell reported them.

Standing archive rule: before future SOT patching, archive the current affected canonical artifacts under `SOT/archive/` before modifying them.
