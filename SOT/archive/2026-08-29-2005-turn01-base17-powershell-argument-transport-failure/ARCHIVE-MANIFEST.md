# Turn 01 Base-17 Qualification Failure Archive

**Stage:** `base`
**Status:** FAILED / REJECTED EVIDENCE ONLY
**Date:** 2026-08-29

## Runtime evidence

Base-17 passed clean-source generation, UI/backend syntax, schema-4 copied-database preflight, Windows inventory sanity, exact Windows/SOT inventory equality, cutover, and live health.

The first Windows-readable drive browse gate failed on `C:`:

- Windows inventory: `C,D,F,I,Q`
- SOT inventory: `C,D,F,I,Q`
- `C:` Windows-readable: `1`
- SOT browse HTTP: `409`
- Error: `Test-Path : Cannot bind argument to parameter 'LiteralPath' because it is null.`

The generated Windows-native helper invoked `powershell.exe -Command <script> <path>` and expected the trailing process argument to appear as PowerShell `$args[0]`. In this invocation shape it did not; `$args[0]` was null. The same transport pattern is present in Windows existence, enumeration, and folder-creation helpers, so this is a shared helper defect, not a C:-specific filesystem defect.

## Rollback evidence

The Base-17 automatic rollback gate passed:

- prior `sot-api.js` restored;
- prior `SOT-turn01-base.html` restored;
- service recovered on retry 2;
- recovered build: `2026.08.28.sot-turn01-base-9`.

Accepted Base-9 therefore remains live.

## Governance

Base-17 is failed evidence only and may not become a build input. The next Base candidate must be regenerated from the frozen accepted Turn 01 sources.

Before the next cutover, qualification must mechanically exercise the exact PowerShell value-transport mechanism used by the generated backend and must directly prove Windows-native enumeration on every Windows-readable discovered drive. This proof must happen pre-cutover, not first against the live candidate.
