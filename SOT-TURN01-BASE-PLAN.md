# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — AUDITED BASE-17  
**Date:** 2026-08-29

## Source and target

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`, blob `f28d864cdc1ef659f7d47b22958c684aae90e2f7`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Accepted backend integration source: `integrate-SOT-turn01-base.py` at commit `1aebf2624621b08880a595ef9d1f58f2c8cde1b`.
- Target UI: `SOT-turn01-base.html`.
- Base-10 through Base-14 are rejected evidence only and prohibited as generated build inputs.
- Base-15 and Base-16 were deliberately withheld from owner execution. Base-16 static-audit evidence is archived at `SOT/archive/2026-08-29-1439-turn01-base16-static-audit/ARCHIVE-MANIFEST.md`.

## Known evidence

Base-12 proved Windows and SOT discovered the same drive letters (`C,D,F,I,Q`) but failed owner testing because `F:` and `I:` did not expose their folder contents and picker browse position was not durable.

Base-13 failed during candidate generation because a brittle source-boundary helper assumed the next declaration used `function` rather than `async function`. Base-14 corrected that with balanced function parsing but then failed before cutover because unrelated storage copy was incorrectly treated as an idle-refresh gate. Base-15 corrected that gate but was withheld pending stronger qualification. Base-16 added persistent instrumentation but static audit found that some failures were still only generic `UNHANDLED` errors, live picker-state mutation was not rollback-safe, F:/I: special handling could falsely fail an unreadable drive, copied-DB schema was not explicitly asserted, and common Target/Backup inventory did not have a named result.

Base-17 corrects the qualification harness only. It must still generate the product candidate from the same frozen accepted sources and must not consume any Base-15/Base-16 generated runtime artifact.

## Scoped Base delta

1. **One dynamic inventory.** Source, Target and Backup use the same Windows-discovered volume inventory.
2. **Windows-native folder enumeration.** For a discovered Windows drive, folder browsing uses Windows-native filesystem access when Node/WSL cannot enumerate `/mnt/<drive>`.
3. **Canonical logical paths.** The backend owns translation between canonical `/mnt/<drive>/...` paths and Windows-native paths.
4. **Durable picker position.** Each project/destination role persists the current browsed volume/folder in SOT database settings and restores it when reopened.
5. **Operation-boundary validation.** Actual read/write/index/execute work validates access when required and returns explicit errors without suppressing discovered volumes.
6. Stable fully-indexed projects retain idle-refresh suppression.
7. **Qualification observability.** Every mechanical gate emits and persists explicit PASS/FAIL/INFO evidence, including successful cases.
8. **Qualification state safety.** Any qualification-only database mutation must be restored on both success and failure; API/HTML rollback alone is insufficient.

## Protected behavior

- Schema remains migration version 4.
- Existing project/index/plan/execute behavior remains unchanged outside the scoped storage/picker delta.
- Accepted pre-base remains the recovery anchor.
- Canonical Base filename remains `SOT-turn01-base.html`.
- No typed arbitrary Target/Backup path.
- Automatic runtime rollback remains mandatory after any fatal post-cutover failure.
- Base-17 generates from frozen accepted sources only; no failed generated Base candidate is a build input.

## Mandatory qualification instrumentation

Every Base qualification run creates a persistent run directory under `SOT/archive/` and retains a timestamped full log, a machine-readable gate summary and key response bodies whether the run passes or fails.

The run records at minimum:

- run ID, exact installer identity, expected build, current live build and schema before mutation;
- immutable source URLs/commits, byte sizes and SHA-256 hashes of every downloaded build input;
- Python compile results for every build script;
- clean Base-3 generation result and output hash;
- backend generation result and build marker;
- UI integration, picker-state integration and idle-refresh integration results;
- backend `node --check` and extracted UI JavaScript `node --check`;
- named required-marker checks and rejected-marker absence checks;
- temporary copied-database API preflight explicitly asserting candidate build and migration/schema version 4;
- pre-cutover runtime API/HTML archive paths and checksums;
- service stop/start and each live-health retry attempt, HTTP outcome, schema and build;
- Windows drive inventory and SOT drive inventory with explicit comparison;
- for every discovered drive: Windows-readable result, SOT volume presence, SOT browse HTTP status, returned folder count when successful, and returned error body when unsuccessful;
- explicit F: and I: status distinguishing absent, present-but-Windows-unreadable, and present+Windows-readable with browse PASS/FAIL;
- explicit common-inventory result proving the Target and Backup picker contract uses `/turn01/volumes` rather than a separate/stricter inventory;
- Target/Backup storage endpoint availability;
- picker browse-state PUT, GET and equality verification plus guaranteed restoration to the prior database value on success or failure;
- final canonical Base page HTTP result and marker check;
- rollback trigger, files restored, rollback service health and resulting build after any fatal post-cutover gate failure;
- final PASS/FAIL summary listing every named gate and persistent artifact paths.

No bare assertion, grep, curl, PowerShell command, source-generation command or service operation may terminate qualification without a named gate result. A generic `UNHANDLED` record is diagnostic backup only, never the sole failure record for a planned gate.

## Mechanical gates before owner testing

- Build directly from frozen accepted UI/backend sources.
- Verify every intended source function occurs exactly once before rewriting.
- Function replacement uses balanced-brace parsing supporting both `function` and `async function`.
- Syntax-check final backend and executable UI JavaScript.
- Temporary copied database/API preflight explicitly asserts schema/migration 4.
- Verify every Windows-discovered drive is represented in `/turn01/volumes`.
- For every Windows-readable discovered drive, require folder API HTTP 200 and record folder count.
- If `F:` or `I:` is present and Windows-readable, each individually passes the folder API gate; if Windows reports one unreadable, record that condition without falsely claiming a SOT browse failure.
- Verify picker browse-state PUT/GET round-trip and restore the original value even if a subsequent gate fails.
- Verify Target and Backup use the same `/turn01/volumes` inventory.
- Verify the canonical Base page is served after cutover.
- Archive current live state before cutover.
- On any fatal post-cutover failure, restore exact prior API/HTML state automatically and prove rollback health.
- Persist complete good/bad qualification evidence in the run archive.

## Owner gate

Only after Base-17 reaches its mechanical-qualified marker does the owner test the canonical Base URL on the actual device. Owner verifies F:/I: data/folders are visible when Windows can read them and reopening the picker restores the last browsed volume/folder. Base remains the current stage until that passes.