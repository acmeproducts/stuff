# SOT Turn 01 Base-31 qualification failure archive

**Stage:** `base`  
**Candidate:** Base-31  
**Disposition:** FAILED BEFORE CUTOVER  
**Observed:** 2026-08-31 02:48 PT

## Evidence

Owner ran installer commit `b4040745cef5e1009e71b74a9e462791fcdbcd22`.

The candidate regenerated from the governed clean lineage and passed static contracts, per-script parsing, combined parsing, browser harness discovery, and exact probe SHA identity. The generated candidate SHA-256 was:

`95b14ab050f4e6b988a4598e50656a7878221416760ff170208028555667e18b`

Qualification then failed before cutover at:

`FAIL JS_GENERATED_BROWSER_BOOT failed`

The selected browser was Windows Edge from WSL:

`/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`

Browser stderr showed Crashpad/profile locking failures including `LockFileEx: Incorrect function`, `TransactNamedPipe: The pipe has been ended`, and the expected boot sentinel was never returned. Cleanup then could not remove Crashpad files under the WSL `/tmp` profile tree due permission errors.

Persistent qualification log supplied by owner:

`/home/support/.openclaw/workspace/https/report/SOT/archive/20260831-024821-turn01-base31-qualification/qualification.log`

## Root cause

The qualification harness launched a **Windows browser executable** with a user-data profile rooted in WSL `/tmp` and translated with `wslpath -w`. That produces a WSL/UNC-backed profile location that Windows Edge/Crashpad cannot reliably lock/use. The browser harness itself therefore failed before it could prove or disprove application boot.

This is a QA-harness defect, not evidence that the generated candidate application failed. It is also not acceptable to waive the browser gate.

## Required correction

The next candidate must:

1. rebuild the application from the accepted clean lineage, never from Base-31 generated HTML;
2. keep exact per-script and combined parsing gates;
3. for Windows Edge/Chrome launched from WSL, create the browser profile in **Windows-native `%TEMP%`**, never WSL `/tmp` or a WSL UNC path;
4. clean that profile using Windows-native deletion;
5. run a browser-harness self-test before using the harness as release evidence;
6. only then browser-boot the exact served candidate and exact canonical public read-back;
7. block release if the browser harness cannot prove its own liveness.

No Base-31 cutover occurred.