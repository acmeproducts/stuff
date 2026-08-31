# SOT Turn 01 canonical Base PowerShell resolution failure

- Host run: `2026-08-31 04:52 PT`
- Installer commit: `996bc5fd33178b3e79c6298eb5e094c3703de373`
- Installer blob: `e545f917a8c3ccfc605fe31ba88e5bb9262024a1`
- Runtime evidence: `/home/support/.openclaw/workspace/https/report/SOT/archive/20260831-045216-turn01-base-qualification/qualification.log`
- Failed gate: `REQUIRE_TOOL powershell.exe`
- Cutover: not reached

The qualifier required `powershell.exe` to be present on the WSL `PATH` instead of resolving the proven Windows-native executable under `/mnt/c/Windows/System32/WindowsPowerShell/v1.0/`. The host and volumes are not diagnosed as broken.

The same run exposed incorrect final-status capture: `cleanup()` executed a `local` declaration before reading `$?`, so the summary printed `rc=0` after a failing exit. Both qualifier defects are corrected at the canonical installer source; no generated HTML is used as an ancestor.
