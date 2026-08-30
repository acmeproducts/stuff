# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-19  
**Date:** 2026-08-29

## Source and target

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`, blob `f28d864cdc1ef659f7d47b22958c684aae90e2f7`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Accepted backend integration source: `integrate-SOT-turn01-base.py` at commit `1aebf2624621b08880a595ef9d1f58f2c8cde1b`.
- Target UI: `SOT-turn01-base.html`.
- Base-10 through Base-18 are rejected/static-audit evidence only and prohibited as generated runtime inputs.

## Known evidence

Base-12 proved Windows and SOT discovered the same drive letters (`C,D,F,I,Q`) but failed owner testing because `F:` and `I:` did not expose their folder contents and picker browse position was not durable.

Base-13 failed during generation because brittle function-boundary surgery did not support `async function`. Base-14 corrected function parsing but failed on an unrelated stale UI-copy marker. Base-15/Base-16 were withheld while qualification instrumentation was strengthened. Base-17 passed clean generation, syntax, schema-4 preflight, exact Windows/SOT inventory equality, cutover and live health, but failed the first Windows-native browse gate on Windows-readable `C:` because its PowerShell invocation expected a trailing value to appear as `$args[0]`; PowerShell instead produced `$null`. Base-17 automatically rolled back to accepted Base-9.

Base-18 corrected the PowerShell value transport to explicit environment variables and added pre-cutover helper execution, but static audit withheld it before owner execution because it still regenerated a Base-14 intermediate and patched that generated output, and some planned gates could still terminate only through generic ERR/`UNHANDLED` handling. Base-18 static-audit evidence is archived at `SOT/archive/2026-08-29-2010-turn01-base18-static-audit/ARCHIVE-MANIFEST.md`.

## Scoped Base-19 delta

1. **One dynamic inventory.** Source, Target and Backup use the same Windows-discovered volume inventory.
2. **Windows-native folder enumeration.** Windows drives are browsed through Windows-native filesystem access, independent of broken WSL `/mnt/<drive>` enumeration.
3. **Deterministic PowerShell value transport.** Dynamic Windows path/folder-name values are passed through explicit child-process environment variables and read as `$env:SOT_PATH` / `$env:SOT_NAME`; no backend helper depends on PowerShell `$args[n]` trailing-command semantics.
4. **Direct clean generation.** Base-19 generates the corrected backend directly from clean Base-3. There is no Base-14/Base-18 generated intermediate and no patch-on-generated-runtime step.
5. **Canonical logical paths.** The backend owns translation between canonical `/mnt/<drive>/...` paths and Windows-native paths.
6. **Durable picker position.** Each project/destination role persists current browsed volume/folder in SOT database settings and restores it when reopened.
7. **Operation-boundary validation.** Actual read/write/index/execute work validates access when required without suppressing discovered volumes.
8. Stable fully-indexed projects retain idle-refresh suppression.
9. **Qualification observability and state safety.** Every planned gate emits persistent PASS/FAIL/INFO evidence and qualification-only DB mutation is confined to a copied database.

## Protected behavior

- Schema remains migration version 4.
- Existing project/index/plan/execute behavior remains unchanged outside the scoped storage/picker delta.
- Accepted pre-base remains the recovery anchor; accepted live runtime remains Base-9 until a new candidate qualifies.
- Canonical Base filename remains `SOT-turn01-base.html`.
- No typed arbitrary Target/Backup path.
- Automatic runtime rollback remains mandatory after any fatal post-cutover failure.
- Base-19 is generated from frozen accepted sources only; no failed generated Base candidate is a source artifact.

## Mandatory qualification instrumentation

Every Base qualification run creates a persistent run directory under `SOT/archive/` and retains a timestamped full log, a machine-readable gate summary and key response bodies whether the run passes or fails.

The run records at minimum:

- run ID, exact installer identity, expected build, current live build and schema before mutation;
- immutable source URLs/commits, byte sizes and SHA-256 hashes of every downloaded build input;
- Python compile results for every build script;
- clean Base-3 generation result and output hash;
- direct Base-19 backend generation result and build marker;
- UI integration, picker-state integration and idle-refresh integration results;
- backend and extracted UI JavaScript syntax checks;
- named required-marker and rejected-marker results;
- copied-database API preflight explicitly asserting build and schema/migration 4;
- Windows drive inventory sanity before cutover;
- **pre-cutover direct exercise of the exact candidate Windows helper implementation against every Windows-readable discovered drive**, recording existence/enumeration result and folder count/error;
- explicit pre-cutover F:/I: results when Windows-readable;
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

No planned gate may fail only as generic `UNHANDLED`. Every Python, Node, curl, PowerShell, filesystem and service qualification operation must be wrapped so its named gate records success or failure before the script terminates. `UNHANDLED` remains diagnostic backup only.

## Mechanical gates before owner testing

- Build directly from frozen accepted UI/backend sources.
- Verify intended source functions exactly once and use balanced-brace function parsing.
- Reject any generated backend containing `$args[0]` / `$args[1]` in Windows filesystem helpers.
- Require `$env:SOT_PATH` and `$env:SOT_NAME` transport markers where applicable.
- Syntax-check final backend and executable UI JavaScript.
- Temporary copied database/API preflight at schema 4.
- Before cutover, directly call the exact candidate Windows directory helpers for every Windows-readable discovered drive and require successful enumeration.
- Verify every Windows-discovered drive is represented in `/turn01/volumes` after cutover.
- For every Windows-readable drive, require folder API HTTP 200 and record folder count.
- If `F:` or `I:` is present and Windows-readable, each individually passes both pre-cutover helper and post-cutover API browse gates.
- Verify picker browse-state round-trip using copied DB only.
- Verify Target and Backup use the common `/turn01/volumes` inventory.
- Verify canonical Base page after cutover.
- Archive current live state before cutover.
- On fatal post-cutover failure, restore exact prior API/HTML and prove rollback health.

## Owner gate

Only after Base-19 reaches its mechanical-qualified marker does the owner test the canonical Base URL on the actual device. Owner verifies F:/I: data/folders are visible when Windows can read them and reopening the picker restores the last browsed volume/folder. Base remains the current stage until that passes.
