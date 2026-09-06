# R9 THREE-PASS REVIEW

Date: 2026-09-06
Status: NOT CLEARED FOR HOST EXECUTION

The owner requires every next host candidate to pass three distinct reviews before another WSL run is requested.

## Pass 1 — Developer

Scope: implementation correctness and deterministic qualification behavior.

Findings:

1. The active-work fixture correction is conceptually correct: schema initialization must occur before inserting a synthetic WIP row because startup recovery is lazy and intentionally interrupts pre-existing work.
2. The current qualifier still uses a fixed 1.5 second delay after the ready handshake. That is a timing assumption rather than a deterministic condition. Replace it with bounded polling for the expected governed WIP row.
3. Track and terminate the temporary Node fixture process during cleanup so an earlier SQL or shell failure cannot leave it alive against a removed temporary database.

Result: FAIL pending direct qualifier correction.

## Pass 2 — Manager

Scope: release discipline, lineage, rollback safety, and minimizing owner retest burden.

Findings:

1. The owner has already been asked to run multiple successive qualifier corrections. Another host run must not be requested until the entire candidate is reviewed as one release unit.
2. The cutover sequence currently stops the service before setting `CUTOVER=1`. If either `install` command fails after the service is stopped but before `CUTOVER=1`, the EXIT rollback branch will not run and the service can remain stopped or partially replaced. Set the rollback-armed flag immediately after a successful service stop, before the first live-file write.
3. R9 product source must remain unchanged unless a product defect is found. Current failures remain qualification defects.

Result: FAIL pending rollback-window correction and completed re-review.

## Pass 3 — Red team

Scope: deliberately seek ways the installer can pass falsely, fail spuriously, damage the current installation, or conceal an R9 defect.

Findings:

1. Fixed-delay active-work verification can fail spuriously on a slow host and can also miss race ordering. Replace with a condition-based bounded poll.
2. Temporary child-process lifetime is not currently tied to installer cleanup.
3. The cutover rollback window can leave the service stopped if live-file installation fails between stop and rollback arming.
4. Pre-cutover gates correctly operate on SQLite backups and do not mutate the live database; preserve this property.
5. Public byte identity and post-cutover DB integrity gates remain required and must not be weakened.

Result: FAIL. Do not ask the owner to run the current installer.

## Clearance rule

A new immutable installer commit may be presented only after all three passes are repeated against that exact commit and each records PASS. No host command is to be issued from a candidate that has not received all three PASS results.
