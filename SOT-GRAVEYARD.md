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
- WSL reported `/mnt/f` with fstype `9p` and source `F:\`.
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
