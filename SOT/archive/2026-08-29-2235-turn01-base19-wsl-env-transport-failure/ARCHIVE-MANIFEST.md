# Turn 01 Base-19 qualification failure archive

**Stage:** `base`
**Candidate:** `2026.08.29.sot-turn01-base-19`
**Qualification run:** `20260829-222902-turn01-base19-qualification`
**Disposition:** REJECTED BEFORE CUTOVER

Base-19 generated cleanly and passed syntax, UI contract, schema-4 copied-DB preflight, Windows inventory discovery (`C,D,F,I,Q`), and Windows-readable checks for all five drives. It then failed the first exact-candidate pre-cutover Windows helper call on `C:`.

The backend attempted to transport `SOT_PATH` through the Linux process environment when launching `powershell.exe` from WSL. The Windows PowerShell process did not receive that variable, so `$env:SOT_PATH` was null and `Test-Path -LiteralPath $p` failed. This proves that merely setting a Linux child-process environment key is not a deterministic Linux-to-Windows process transport channel under WSL.

No cutover occurred (`rollback_attempted=0`). Accepted Base-9 remained live throughout.

## Frozen evidence

- Base-19 installer commit: `094e0261abab80ce2be8e293b448eeb29614bc3a`
- Base-19 generator commit: `b0850879880eb921d3c72219e83674ae49f5ec87`
- Base-19 generator blob: `7f8373f4eddca02ea76a3fdb47789bb7d3cda2e2`
- Persistent runtime qualification log: `/home/support/.openclaw/workspace/https/report/SOT/archive/20260829-222902-turn01-base19-qualification/qualification.log`
- Persistent summary: `/home/support/.openclaw/workspace/https/report/SOT/archive/20260829-222902-turn01-base19-qualification/summary.tsv`

## Root cause

WSL does not automatically guarantee arbitrary Linux environment variables are materialized in a launched Windows process. Base-19 therefore replaced one unreliable cross-boundary transport (`$args[]`) with another (`$env:SOT_PATH`/`$env:SOT_NAME` without explicit WSLENV handling).

## Required replacement

The next clean Base generator must use a transport that crosses the WSL/Windows process boundary without relying on positional parsing or environment propagation. The selected contract is standard input: Node supplies the path or JSON payload through `execFileSync(..., {input: ...})`; fixed PowerShell code reads `[Console]::In.ReadToEnd()` and parses it deterministically.

Qualification must exercise existence, directory enumeration, and folder creation through the exact generated candidate before any cutover.
