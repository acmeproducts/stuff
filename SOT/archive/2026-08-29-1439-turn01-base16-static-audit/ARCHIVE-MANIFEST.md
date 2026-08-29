# Turn 01 Base-16 Static Audit Archive

**Stage:** Turn 01 -> Base rebuild  
**Date:** 2026-08-29  
**Base-16 installer blob audited:** `802943921ed89f93cda2f8e61da75bf6d4a57029`

Base-16 was deliberately not owner-run. Static audit found qualification defects that must be corrected before another WSL execution.

## Findings

1. Several named gates still relied on bare Python/PowerShell commands under `set -e`; on failure they would only surface as a generic `UNHANDLED` record instead of an explicit named gate result. This violates the governing requirement that every gate log PASS or FAIL with relevant evidence.
2. The live picker-state qualification mutates `target_browse_root` in the real database. If a later step fails before the explicit restore, API/HTML rollback does not restore that database value. Qualification must guarantee database state restoration on both success and failure.
3. The F:/I: special gate incorrectly fails when a drive is present in Windows inventory but Windows itself reports it unreadable. The governed contract only requires browse success for Windows-readable drives. Special F:/I: logging must distinguish absent, present-unreadable, and present-readable+browse-pass/fail.
4. Temporary copied-database preflight did not explicitly assert migration/schema version 4 from the candidate module.
5. Target/Backup common-inventory behavior needs an explicit qualification result rather than only an implementation marker.
6. Source/inventory and public page/API outcomes must remain individually named in the persistent summary.

## Decision

Base-16 is superseded before execution. No generated Base-16 runtime artifact is accepted or used as a build source. The next candidate must still generate from the frozen accepted pre-base/Base-3 lineage and must correct only the qualification harness plus any statically proven contract issue.
