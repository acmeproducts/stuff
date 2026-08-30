# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-20  
**Date:** 2026-08-29

## Source and target

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`, blob `f28d864cdc1ef659f7d47b22958c684aae90e2f7`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Accepted backend integration source: `integrate-SOT-turn01-base.py` at commit `1aebf2624621b08880a595ef9d1f58f2c8cde1b`.
- Target UI: `SOT-turn01-base.html`.
- Base-10 through Base-19 are rejected/static-audit evidence only and prohibited as generated runtime inputs.

## Known evidence

Base-12 proved Windows and SOT discovered the same drive letters (`C,D,F,I,Q`) but failed owner testing because `F:` and `I:` did not expose their folder contents and picker browse position was not durable.

Base-13 failed during generation because brittle function-boundary surgery did not support `async function`. Base-14 corrected function parsing but failed on an unrelated stale UI-copy marker. Base-15/Base-16 were withheld while qualification instrumentation was strengthened. Base-17 proved that PowerShell `-Command` trailing arguments did not reliably populate `$args[]` and rolled back to Base-9. Base-18 was withheld on static audit because it still patched a generated intermediate. Base-19 generated directly from clean Base-3 and moved dynamic values into child-process environment variables, but pre-cutover qualification proved that arbitrary Linux environment keys were not propagated into launched Windows PowerShell: `$env:SOT_PATH` was null on the first exact helper call against Windows-readable `C:`. No cutover occurred and Base-9 remained live.

Base-19 failure evidence is archived at `SOT/archive/2026-08-29-2235-turn01-base19-wsl-env-transport-failure/ARCHIVE-MANIFEST.md`. The rejected implicit environment transport is recorded as GY-006.

## Scoped Base-20 delta

1. **One dynamic inventory.** Source, Target and Backup use the same Windows-discovered volume inventory.
2. **Windows-native folder enumeration.** Windows drives are browsed through Windows-native filesystem access, independent of broken WSL `/mnt/<drive>` enumeration.
3. **Deterministic stdin transport.** Dynamic Windows filesystem values cross WSL -> Windows only through standard input. Node uses `execFileSync(...,{input:...})`; fixed PowerShell code reads `[Console]::In.ReadToEnd()`. Folder creation sends a JSON payload and PowerShell parses it with `ConvertFrom-Json`. No helper uses `$args[n]` or implicit `$env:SOT_*` propagation.
4. **Direct clean generation.** Base-20 generates the corrected backend directly from clean Base-3. No failed generated candidate or generated intermediate is an input.
5. **Canonical logical paths.** The backend owns translation between canonical `/mnt/<drive>/...` paths and Windows-native paths.
6. **Durable picker position.** Each project/destination role persists current browsed volume/folder in SOT database settings and restores it when reopened.
7. **Operation-boundary validation.** Actual read/write/index/execute work validates access when required without suppressing discovered volumes.
8. Stable fully-indexed projects retain idle-refresh suppression.
9. **Qualification observability and state safety.** Every planned gate emits persistent PASS/FAIL/INFO evidence; qualification-only DB mutation is confined to a copied database.

## Protected behavior

- Schema remains migration version 4.
- Existing project/index/plan/execute behavior remains unchanged outside the scoped storage/picker delta.
- Accepted pre-base remains the recovery anchor; accepted live runtime remains Base-9 until a new candidate qualifies.
- Canonical Base filename remains `SOT-turn01-base.html`.
- No typed arbitrary Target/Backup path.
- Automatic runtime rollback remains mandatory after any fatal post-cutover failure.
- Base-20 is generated from frozen accepted sources only; no failed generated Base candidate is a source artifact.
- No machine-level WSLENV/environment configuration is required or modified.

## Mandatory qualification instrumentation

Every Base qualification run creates a persistent run directory under `SOT/archive/` and retains a timestamped full log, a machine-readable gate summary and key response bodies whether the run passes or fails.

The run records at minimum:

- run ID, exact installer identity, expected build, current live build and schema before mutation;
- immutable source URLs/commits, byte sizes and SHA-256 hashes of every downloaded build input;
- Python compile results for every build script;
- clean Base-3 generation result and output hash;
- direct Base-20 backend generation result and build marker;
- UI integration, picker-state integration and idle-refresh integration results;
- backend and extracted UI JavaScript syntax checks;
- named required-marker and rejected-marker results, including absence of `$args[0]`, `$args[1]`, `$env:SOT_PATH` and `$env:SOT_NAME` from Windows helper transport;
- copied-database API preflight explicitly asserting build and schema/migration 4;
- Windows drive inventory sanity before cutover;
- pre-cutover direct exercise of the exact candidate Windows existence/enumeration helper against every Windows-readable discovered drive, recording folder count/error;
- explicit pre-cutover F:/I: results when Windows-readable;
- pre-cutover creation, existence verification, and cleanup of a temporary Windows folder through the exact candidate creation helper;
- copied-database picker browse-state persistence/equality/restore result;
- pre-cutover runtime API/HTML archive paths and checksums;
- service stop/start and each live-health retry attempt, HTTP outcome, schema and build;
- exact Windows/SOT drive inventory equality;
- post-cutover API browse result for every Windows-readable discovered drive, with explicit F:/I: results;
- explicit Target/Backup common-inventory result;
- storage endpoint availability;
- final canonical Base page HTTP/marker result;
- rollback trigger, restored files, rollback health and resulting build after any fatal post-cutover failure;
- final named-gate PASS/FAIL summary and artifact paths.

No planned gate may fail only as generic `UNHANDLED`. Every Python, Node, curl, PowerShell, filesystem and service qualification operation must produce a named result before termination. `UNHANDLED` remains diagnostic backup only.

## Mechanical gates before owner testing

- Build directly from frozen accepted UI/backend sources.
- Verify intended source functions exactly once and use balanced-brace function parsing.
- Reject `$args[0]` / `$args[1]` and `$env:SOT_PATH` / `$env:SOT_NAME` as dynamic Windows helper transport.
- Require stdin markers `[Console]::In.ReadToEnd()` and Node `input:` transport in existence, enumeration and folder-creation helpers.
- Syntax-check final backend and executable UI JavaScript.
- Temporary copied database/API preflight at schema 4.
- Before cutover, directly call the exact candidate Windows directory helpers for every Windows-readable discovered drive and require successful enumeration.
- Before cutover, create and remove a temporary Windows folder through the exact candidate creation helper.
- Verify every Windows-discovered drive is represented in `/turn01/volumes` after cutover.
- For every Windows-readable drive, require folder API HTTP 200 and record folder count.
- If `F:` or `I:` is present and Windows-readable, each individually passes both pre-cutover helper and post-cutover API browse gates.
- Verify picker browse-state round-trip using copied DB only.
- Verify Target and Backup use the common `/turn01/volumes` inventory.
- Verify canonical Base page after cutover.
- Archive current live state before cutover.
- On fatal post-cutover failure, restore exact prior API/HTML and prove rollback health.

## Owner gate

Only after Base-20 reaches its mechanical-qualified marker does the owner test the canonical Base URL on the actual device. Owner verifies F:/I: data/folders are visible when Windows can read them and reopening the picker restores the last browsed volume/folder. Base remains the current stage until that passes.
