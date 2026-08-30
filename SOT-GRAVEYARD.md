# SOT Graveyard

**Status:** AUTHORITATIVE REJECTED-APPROACH RECORD  
**Updated:** 2026-08-29  
**Repository:** `acmeproducts/stuff`

This document records architectural and implementation approaches that have been rejected so they are not silently reintroduced in later SOT work.

## GY-001 — Strict WSL mount/readability gate as volume authority

**Status:** REJECTED  
**Evidence:** Turn 01 Base-10 and Base-11  
**Decision date:** 2026-08-29

### Rejected approach

Treat a Windows volume as available to SOT only when a new WSL-side validator independently approves all of the following:

- exact `/mnt/<letter>` mount target;
- accepted `9p`/`drvfs` filesystem shape;
- normalized mount source matching the drive letter;
- successful Node-side root directory enumeration.

The Base-10/Base-11 path made that validator authoritative for whether a dynamically discovered Windows volume could be surfaced and browsed.

### Why it is rejected

Dynamic Windows volume discovery had already worked in earlier SOT lineage and was not the original problem. Base-10 and Base-11 regressed that behavior by adding a stricter second definition of volume availability.

Base-11 demonstrated the contradiction directly:

- Windows discovered `F:`.
- Windows `Test-Path` reported `F:` readable.
- WSL reported `/mnt/f` with fstype `9p` and source `F:\\`.
- normalization correctly produced `F:`.
- the mount helper completed.
- SOT nevertheless rejected the volume because the new post-mount validator returned false.

The automatic gate then rolled the candidate back to Base-9.

The defect is therefore architectural: a newly introduced WSL/Node validator was allowed to override the proven dynamic-volume inventory and hide/reject a Windows-readable volume.

### Do not repeat

Do not:

- patch Base-10 or Base-11 forward;
- use either generated candidate as a source for the next Base build;
- make root-directory enumeration an independent prerequisite for a drive to exist in the SOT volume inventory;
- create separate definitions of "available volume" for Source versus Target/Backup;
- attempt to repair the user's Windows drive merely because the stricter SOT validator rejects it.

### Required replacement

Recover the previously proven dynamic Windows volume discovery behavior from clean accepted lineage and make that shared inventory authoritative for Source, Target, and Backup selection.

Actual filesystem access remains subject to deterministic validation at the operation boundary. If access fails when SOT needs to browse, write, index, plan, or execute, surface an explicit availability/error condition for that operation. Do not silently remove a discovered Windows volume because a secondary WSL mount-shape/readability heuristic disagrees with the discovery authority.

### Governance consequence

Base-10 and Base-11 are failed evidence only. The next Turn 01 Base candidate must be rebuilt from the accepted pre-base/clean integration lineage with the rejected mount-authority architecture absent.

---

## GY-002 — Patch-forward recovery from a failed Base candidate

**Status:** REJECTED / GOVERNANCE PROHIBITION

A failed Base candidate is not a new baseline. Fixing the next symptom by modifying the failed candidate creates accumulated hidden dependencies and defeats the governed `pre-base -> base -> pre-ship -> ship -> post-ship` chain.

Required recovery is always:

1. return to the declared accepted source stage;
2. preserve failure evidence;
3. update this graveyard when an architectural approach is rejected;
4. update the authoritative plan when the contract changes;
5. rebuild only the governed delta;
6. mechanically qualify before owner/device testing.

---

## GY-003 — Inventory-only repair with WSL-dependent folder browsing

**Status:** REJECTED  
**Evidence:** Turn 01 Base-12 owner test  
**Decision date:** 2026-08-29

### Rejected approach

Correct the volume inventory so Windows-discovered drives such as `F:` and `I:` remain visible, but continue to enumerate their folders exclusively through Node/WSL filesystem access to `/mnt/<letter>`.

Also rejected: treating the picker’s current volume/folder as temporary UI state that may reset when the picker is reopened or the Scope surface rerenders.

### Why it is rejected

Base-12 mechanically matched the Windows drive inventory (`C,D,F,I,Q`) exactly, proving the discovery correction. Owner testing then showed that `F:` and `I:` still did not expose their data/folders. The drive existed in the inventory, but the next layer still depended on the same WSL access path already known to fail on those volumes.

The owner test also showed that the available drive/current folder context was not retained. A storage management surface must capture that navigation position so reopening the picker does not discard the operator’s location.

### Do not repeat

Do not:

- treat successful drive-letter discovery as sufficient Base completion;
- present a discovered Windows drive but make its folder browser depend only on broken `/mnt/<letter>` enumeration;
- store destination picker position only in ephemeral JavaScript state;
- patch the Base-12 generated candidate forward.

### Required replacement

The next Base rebuild must start from the frozen accepted Turn 01 sources and:

1. retain Windows discovery as the shared Source/Target/Backup inventory authority;
2. use Windows-native filesystem enumeration for Windows drives when Node/WSL enumeration cannot expose the drive contents;
3. keep path translation inside the deterministic backend;
4. persist each project/destination picker’s current volume/folder in the SOT database/settings and restore it when reopened;
5. mechanically browse every Windows-readable discovered drive before owner handoff.

Base-12 remains failed evidence only.

---

## GY-004 — Brittle exact-text function-boundary surgery

**Status:** REJECTED  
**Evidence:** Turn 01 Base-13 generator failure  
**Decision date:** 2026-08-29

### Rejected approach

Use a source-rewrite helper that finds a function body by assuming the next declaration always begins with the exact text `function <name>`.

### Why it is rejected

The clean accepted Base-3 source declares `async function createStorageFolder(...)`. Base-13's generator searched for `\nfunction createStorageFolder` while replacing `saveStorage`, so generation failed with `ValueError: substring not found` before a candidate could be emitted.

### Do not repeat

Do not use declaration-boundary surgery that distinguishes `function` and `async function` accidentally. Do not treat this failed generator as a source artifact.

### Required replacement

A replacement generator must start again from the frozen accepted sources and locate declaration boundaries deterministically with support for both `function` and `async function`, verify each intended source function exactly once before rewriting, and fail before cutover if any boundary is ambiguous.

Base-13 remains failed build evidence only; accepted live runtime remained Base-9.

---

## GY-005 — PowerShell `-Command` trailing-argument transport

**Status:** REJECTED  
**Evidence:** Turn 01 Base-17 mechanical qualification  
**Decision date:** 2026-08-29

### Rejected approach

Invoke Windows PowerShell from Node as `powershell.exe -Command <script> <path>` and assume the trailing process argument will reliably appear inside the script as `$args[0]` (and `$args[1]`).

### Why it is rejected

Base-17 proved inventory and runtime health, then failed the first Windows-native browse on Windows-readable `C:`. PowerShell reported `Test-Path -LiteralPath $p` received null because `$args[0]` was not populated by that invocation shape. The same transport pattern was used by directory existence, directory enumeration, and folder creation, so it is a shared backend transport defect rather than a drive-specific failure.

### Required replacement

Do not use trailing positional values for WSL-to-Windows PowerShell helper transport. Qualification must exercise the exact candidate helper mechanism before cutover.

Base-17 remains failed evidence only. Its automatic rollback restored accepted Base-9.

---

## GY-006 — Implicit Linux environment propagation into Windows PowerShell

**Status:** REJECTED  
**Evidence:** Turn 01 Base-19 pre-cutover qualification  
**Decision date:** 2026-08-29

### Rejected approach

Launch Windows `powershell.exe` from a WSL Node process with `execFileSync(..., {env:{...process.env,SOT_PATH:...}})` and assume arbitrary Linux environment variables will automatically appear inside the Windows process as `$env:SOT_PATH` / `$env:SOT_NAME`.

### Why it is rejected

Base-19 passed clean generation, syntax, schema-4 copied-DB preflight, Windows inventory `C,D,F,I,Q`, and Windows `Test-Path` readability for all five drives. The exact generated helper then failed before cutover on `C:` because PowerShell saw `$env:SOT_PATH` as null. No candidate runtime was installed and Base-9 remained live.

This is a WSL process-boundary transport defect, not a drive discovery, drive readability, or F:/I: defect. WSL does not guarantee arbitrary Linux environment variables are exported into launched Windows processes without an explicit interoperability mechanism.

### Do not repeat

Do not rely on implicit environment propagation across WSL -> Windows process launch. Do not solve this by adding hidden machine-level WSLENV configuration or by changing the user's Windows/WSL environment merely to satisfy SOT.

### Required replacement

Use standard input as the explicit cross-boundary data channel. Node supplies the path or a JSON payload through `execFileSync(..., {input: ...})`; a fixed PowerShell command reads `[Console]::In.ReadToEnd()` and, where multiple values are required, parses JSON with `ConvertFrom-Json`.

The next candidate must directly generate this transport from clean Base-3 and mechanically prove existence, enumeration, and folder creation through the exact generated helpers before cutover.

Base-19 remains failed evidence only. The failure archive is `SOT/archive/2026-08-29-2235-turn01-base19-wsl-env-transport-failure/ARCHIVE-MANIFEST.md`.
