# Turn 01 Base-23 Qualification Failure

**Stage:** `base`
**Candidate:** Base-23
**Result:** REJECTED BUILD EVIDENCE — PRE-CUTOVER
**Date:** 2026-08-30

## First failing gate

`BASE22_ARCHITECTURE_RETAINED — missing 2-copy groups`

## What passed before failure

The Base-23 UI generator passed syntax and all newly introduced owner-gate checks for stable Index polling, Plan current/stale separation, missing-evidence recovery, selector scrolling, local Available-folder search, and modal-footer commit placement.

## Root cause

The Base-23 integrator replaced the entire `renderIndex` implementation from clean Base-22. In doing so it removed the Base-22 `Closed`-state duplicate findings branch that rendered and drilled into `2-copy groups`, `3-copy groups`, and `4+ copy groups`. The qualification gate correctly detected this regression.

This is a generated-candidate regression, not a runtime/storage/backend failure.

## Cutover state

The failure occurred before `ARCHIVE_PRECUTOVER` / `INSTALL_UI`. Base-23 was not installed. Live HTML/backend therefore remained Base-22. No rollback was required.

## Recovery rule

Do not patch the failed Base-23 generated HTML forward. Rebuild the next Base candidate from the frozen accepted pre-base -> clean Base-22 integration lineage, merging the Base-23 owner-gate changes without replacing protected completed-Index duplicate behavior.

See `GY-010.md` in this directory.
