# SOT patch archive

Archived before correcting Windows PowerShell discovery to use an absolute executable path.

Pre-patch canonical artifacts:
- `integrate-SOT-turn01-base.py` blob `b121034005ed06b0f3316b3ff641a5e5a76d41a0`
- `install-SOT-turn01-base.sh` blob `3758eec242fcb0950898f33a360e622f4979dbbe`
- `SOT-turn01-base.html` blob `0957f8d1d3170aaf51e03e6c4b51e6d77fec1417`

Observed failure: installer successfully cut over candidate build `2026.08.28.sot-turn01-base-3`, health passed, then the Windows drive discovery gate failed because the non-login installer environment could not resolve `powershell.exe` by PATH. Automatic rollback restored build `2026.08.27.sot-turn01-base-2`.

Correction scope: preserve dynamic Windows drive discovery and lazy drvfs mounting; resolve PowerShell by absolute Windows System32 path and gate that executable before cutover.
