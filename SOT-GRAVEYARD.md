# SOT Graveyard

**Status:** AUTHORITATIVE REJECTED-APPROACH RECORD  
**Updated:** 2026-08-31
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

---

## GY-007 — Split Source versus Target/Backup storage authority

**Status:** REJECTED  
**Evidence:** Turn 01 Base-20 owner test  
**Decision date:** 2026-08-30

### Rejected approach

Use the corrected Windows-discovered `/turn01/volumes` + Windows-native `/turn01/fs` path for Target/Backup while leaving Source selection and Source preflight on the older WSL-only `/fs`, `roots()`, `mountInfo()`, `fs.statSync()` and `fs.accessSync()` path.

Also rejected: re-running dynamic drive discovery on every destination-folder navigation and using WSL filesystem statistics as the authoritative capacity source for Windows drives.

### Why it is rejected

Base-20 mechanically proved all Windows drives `C,D,F,I,Q` were readable and Windows-native browsing worked before and after cutover, including F: and I:. Owner testing then exposed three contradictions:

- Target/Backup could see F: and I: but showed zero free space and visibly rescanned on repeated navigation.
- Existing Sources already assigned to F: failed preflight.
- Source selection omitted F: and I: entirely.

Source and destination therefore still had separate definitions of storage availability. This directly violates the one-inventory architecture required by GY-001/GY-003 and the Base plan.

### Do not repeat

Do not:

- keep Source on legacy `/fs` while Target/Backup use `/turn01/volumes` and `/turn01/fs`;
- preflight Windows Sources through WSL mount equality or Node-only stat/access checks when the canonical Windows-native helper can validate them;
- call Windows drive discovery again for every folder navigation inside one picker session;
- report Windows drive free space as zero merely because WSL `statfs` cannot interrogate the volume.

### Required replacement

The next Base rebuild must use one shared storage authority for Source, Target, Backup, and Source preflight:

1. a single Windows-discovered inventory snapshot reused throughout a picker session;
2. Windows-native folder existence/enumeration for all Windows-backed Source/Target/Backup paths;
3. Windows-native free/total capacity data for Windows volumes;
4. Source picker driven by the same `/turn01/volumes` + `/turn01/fs` contract as destinations;
5. Source preflight validating Windows Sources through the same Windows-native existence/readability authority;
6. qualification proving Source and destination inventories are identical and that a Source on F:/I: preflights successfully.

Base-20 remains rejected owner-gate evidence only. Failure archive: `SOT/archive/2026-08-30-0248-turn01-base20-owner-failure/ARCHIVE-MANIFEST.md`.

---

## GY-008 — Fragmented picker UX, repeated storage probing, deferred project validity and manual preflight

**Status:** REJECTED  
**Evidence:** Turn 01 Base-21 owner test  
**Decision date:** 2026-08-30

### Rejected approach

Treat Source, Target and Backup as separate interaction implementations even when they share a backend storage authority; re-query live storage during ordinary selection/save flows; allow project creation before Source and Target are fully defined; and expose a separate operator-driven Preflight step to discover invalid path assignments after configuration.

Also rejected: a folder selector where choosing an item merely copies it into a selected list while leaving the same item simultaneously present in the available list, plus analysis surfaces that force the operator through generic status/analysis views before seeing the immediately useful duplicate-group outcomes of fingerprinting.

### Why it is rejected

Base-21 proved the underlying Windows inventory/access corrections mechanically, but owner testing showed the interaction architecture still creates unnecessary latency and friction:

- saving Source changes is slow because metadata selection is coupled to repeated live-storage work;
- the Available and Selected panes do not behave as a true move-between-lists selector;
- Source and destination selectors can still drift because they are separate implementations;
- a newly created project can exist before its required Source/Target configuration is complete;
- global Target/Backup defaults are not part of project setup;
- a manual Preflight button asks the operator to validate data that should never have been accepted invalid in the first place;
- plan generation can be coupled to transient live Source availability even when it is reasoning over already-persisted fingerprint evidence;
- duplicate cardinality results are not promoted as the primary post-fingerprint outcome.

### Do not repeat

Do not:

- implement Source/Target/Backup folder selection as separate UX components;
- rescan/re-enumerate storage merely because a user selected, deselected or saved a folder assignment;
- keep a selected folder simultaneously in the Available list for the same role/context;
- create half-configured projects and send the operator back later to complete required storage setup;
- rely on an operator-facing Preflight ceremony to compensate for permissive invalid assignment;
- require an offline Source volume during plan generation when the plan only needs persisted fingerprint/evidence data;
- bury duplicate-group cardinality behind generic analysis/navigation surfaces.

### Required replacement

The next clean Base must:

1. use one canonical role-configured folder selector for Source, Target, Backup and default Target/Backup;
2. implement deterministic Available ↔ Selected move semantics;
3. maintain a shared runtime storage catalog/cache reused across projects and picker sessions, invalidated only by explicit refresh, known create/delete, or proven access failure;
4. make assignment save a metadata transaction with no implicit rescan;
5. make project creation include valid Source + Target and inherit overridable default Target/Backup;
6. reject invalid assignments at assignment time and remove manual Preflight from the operator workflow;
7. validate storage at the actual operation boundary: Source when fingerprinting reads it, destination when execution needs it; do not block evidence-only plan generation on transient Source availability;
8. promote 2-copy, 3-copy and 4+-copy duplicate-group summaries with direct drill-down immediately after fingerprinting.

Base-21 remains rejected owner-gate evidence only. Failure archive: `SOT/archive/2026-08-30-0352-turn01-base21-owner-rejection/ARCHIVE-MANIFEST.md`.

---

## Later failure ledger

The detailed evidence remains in the immutable archive files below. This ledger is the authoritative index so later decisions do not require reconstructing governance from scattered folders.

| ID | Rejected approach | Evidence |
|---|---|---|
| GY-009 | Poll-driven completed-state rerender, ambiguous stale Plan, and non-operable selector panes | `SOT/archive/2026-08-30-1337-turn01-base22-owner-rejection/GY-009.md` |
| GY-010 | Whole-function correction that erased protected completed-state behavior | `SOT/archive/2026-08-30-1405-turn01-base23-qualification-failure/GY-010.md` |
| GY-011 | Passive AI key fields without operational validation and supervisor priming | `SOT/archive/2026-08-30-1418-turn01-base24-owner-rejection-ai/GY-011.md` |
| GY-012 | Pre-cutover-only JavaScript qualification | `SOT/archive/2026-08-30-2348-turn01-base25-owner-rejection-js-syntax/GY-012.md` |
| GY-013 | Whole-document token lint overriding parser/browser gates | `SOT/archive/2026-08-31-0017-turn01-base26-qualification-failure/GY-013.md` |
| GY-014A | AI Configuration replacement deleted protected storage defaults | `SOT/archive/2026-08-31-0038-turn01-base27-qualification-failure/GY-014.md` |
| GY-014B | Same-command dependent Bash locals under `set -u` | `SOT/archive/2026-08-31-0212-turn01-base28-qualification-failure/GY-014.md` |
| GY-015 | Partial nounset correction without structural whole-installer audit | `SOT/archive/2026-08-31-0220-turn01-base29-qualification-failure/GY-015.md` |
| GY-016 | Syntax-only checking that missed a runtime `async` line-terminator failure | `SOT/archive/2026-08-31-0224-turn01-runtime-async-failure/GY-016.md` |
| GY-017 | Windows browser harness using a WSL-backed profile | `SOT/archive/2026-08-31-0248-turn01-base31-browser-harness-failure/GY-017.md` |

The two historical `GY-014` files are preserved unchanged; the `A/B` suffixes above remove the numbering ambiguity without rewriting evidence.

---

## GY-018 — Numbered meta-installer patch chains and token-specific post-generation repair

**Status:** REJECTED
**Evidence:** Turn 01 Base-28 through Base-32 audit
**Decision date:** 2026-08-31

### Rejected approach

Create another numbered installer by downloading a prior failed qualifier and performing exact-text substitutions against its shell source. Repair a generated HTML symptom with a token-specific post-generation regex instead of correcting the clean integrator that produced it. Hand the resulting installer to the owner as the next qualification experiment.

### Why it is rejected

Base-32 still generated the owner-observed runtime defect. The actual artifact contained a standalone `async` statement followed by `const SOT_SUPERVISOR_PROMPT`; its repair only searched for `async` followed by `function`, so syntax gates passed while runtime still failed. Base-32 also attempted Windows profile cleanup through an implicitly propagated WSL environment variable, repeating the transport architecture rejected by GY-006.

The numbered wrapper chain made the qualifier itself the dominant source of defects and pushed host qualification onto the owner instead of producing a testable release.

### Required replacement

- Maintain one canonical `install-SOT-turn01-base.sh`; version it by Git commit, not filename.
- Generate directly from the frozen pre-base and clean governed integrators.
- Correct source integrators at their declaration boundaries; do not normalize failed generated HTML into a new ancestor.
- Audit structural defect classes across the whole source and qualifier.
- Use standard input for WSL-to-Windows cleanup transport and prove Windows-native profile removal.
- Mechanically qualify and cut over before the owner receives the canonical test URL.
