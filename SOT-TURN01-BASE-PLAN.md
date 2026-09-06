# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** R10 ACTIVE — OPERATING INTELLIGENCE  
**Date:** 2026-09-06

## Governing model

SOT is a global physical-content reconciliation system backed by one SSOT database.

`physical fingerprint → known physical locations → project membership → required verified copies → missing work → recommended action`

Content identity is permanent; storage roles are not. Projects are membership/policy lenses over the SSOT and do not own physical-content truth. A Target may later become retained/source storage without changing fingerprint identity.

## Accepted R9 foundation and R10 correction

R9's Dashboard / Database / Activity / Settings information architecture and master→detail interaction are retained because the owner explicitly found the dashboard materially better. R9 is nevertheless rejected as a complete product in GY-032 because it hid/removed essential operating capability and did not explain what fingerprint evidence means.

R10 is one clean source advance from the mechanically qualified R9 baseline. It restores the operating product behind the accepted shell; it does not redesign the shell again.

## Dashboard — understand and act

Dashboard remains the default home and must show:

- unique fingerprinted source content;
- verified Copy A and Copy B coverage;
- fully protected and unprotected bytes;
- cross-project shared content;
- duplicate source groups and redundant source bytes;
- current storage work with real durable counters when available;
- deterministic prioritized recommendations explaining what to do next.

A number without interpretation is insufficient. Duplicate groups must expose fingerprint, size, physical source locations, project membership, copy count, and potential redundant bytes. Shared-project content and verified protection copies must never be described as disposable duplicates.

## Project master → detail

Selecting a project keeps the master list visible and renders detail on the same Dashboard.

Project detail must provide:

1. Source content / Copy A / Copy B / fully protected coverage.
2. **Sources / Target / Backup** operating control.
3. Live-volume folder picker for Sources, Target and Backup.
4. Destination-folder creation.
5. Project-specific duplicate groups, physical locations, redundant bytes and missing protection.
6. Deterministic recommended next actions.
7. Active operation telemetry and Pause/Resume/Stop where valid.
8. Deep Dive for exhaustive evidence.

## Storage configuration

Sources define project membership. Target is Copy A and Backup is Copy B. The picker uses `/turn01/volumes`, `/turn01/fs`, and `/turn01/fs/folder`; source assignments use the canonical project sources API and destination assignments use the canonical project storage API. No parallel configuration state is introduced.

## Storage intelligence read model

R10 adds a read-only deterministic intelligence projection over existing SSOT tables. It may not create alternate truth.

For global and project scopes it reports:

- fingerprint count and logical bytes;
- duplicate source groups;
- redundant source bytes (`size × (source_locations - 1)` for fingerprints observed at multiple source paths);
- cross-project shared groups/bytes;
- largest duplicate groups with all known source locations and project names;
- fingerprints lacking verified Copy A or Copy B;
- prioritized deterministic recommendations.

Deletion is never automatic and recommendations must explicitly protect/verify before suggesting removal of redundant source copies.

## Database and Deep Dive

Database remains first-class with Content, Locations, Projects and Operations views. Deep Dive remains the exhaustive evidence surface. These surfaces support the Dashboard explanation; they are not substitutes for it.

## Activity / observability

Any queued/running/paused index, plan, copy or verification operation appears prominently. Running indexing shows, when backend evidence exists: files discovered/processed, bytes discovered/processed, phase/current item, percentage and controls. Queued state must be labeled as waiting rather than presented as completed progress. An active project may never simultaneously offer idle `Scan now`.

## AI configuration

Settings restores AI configuration:

- provider: OpenRouter or Venice;
- provider model ID;
- API key stored browser-local only;
- selected provider/model persisted browser-local.

AI is advisory. Fingerprints, locations, verified-copy state and deterministic protection decisions remain factual authority. AI configuration must not be required for core storage reconciliation.

## Truth rules

1. Protected requires positive committed content plus required verified independent copies.
2. Zero files/bytes is Unknown/Not indexed, never Protected.
3. Global unique bytes count each fingerprint once regardless of project membership.
4. Shared content is distinct from redundant source duplication.
5. Verified Target/Backup holdings are protection copies, not disposable duplicate-source waste.
6. A failed/new scan cannot erase prior committed evidence.
7. Active-operation truth overrides idle CTA presentation without overwriting committed storage truth.
8. Storage-role changes do not change content identity.
9. No delete/removal recommendation may precede protection/verification evidence.

## R10 qualification gates

R10 qualification is intentionally simple and deterministic. Synthetic copies of the production database are not used to prove intelligence behavior. Prior fixture-based qualification created false failures because startup recovery and production-data ordering affected the test harness rather than the product. The clean installer therefore validates candidate composition before cutover, arms rollback, then validates the actual installed R10 against the actual SSOT database. Any post-cutover failure automatically restores the archived R9 backend/UI.

### Developer pass

1. Compose the candidate backend from the live qualified backend plus the pinned R8 reconciliation, R9 catalog and corrected R10 intelligence integrators.
2. Python-compile each integrator that is applied and `node --check` the resulting backend.
3. Build the R10 UI from the governed R9 UI plus the pinned R10 UI integrator.
4. Extract and `node --check` the generated UI JavaScript.
5. Verify required R10 product contract strings and reject retired workflow-shell labels.

### Manager pass

6. Confirm R10 is one clean backend/UI advance from the qualified R9 source, not a failed generated artifact.
7. Confirm the intelligence function and endpoint are present and redundant-byte math is implemented as `size × (copies - 1)`.
8. Confirm Sources / Target / Backup and AI configuration remain in the UI contract.
9. Confirm no wrapper, iframe, alternate state machine, workflow, schema or deployment architecture is introduced.
10. Archive the current live backend/UI and arm rollback before first live replacement.

### Red-team pass

11. Before cutover, verify active-operation truth, shared/protection distinction and required operating controls are present in the candidate.
12. After cutover, require HTTP 200 for health, SSOT, intelligence, catalog, activity, projects and volumes endpoints.
13. Validate the real live intelligence payload structurally and mathematically: nonnegative summary counts, duplicate rows have `copies >= 2`, each row's `reclaimable_bytes == size × (copies - 1)`, duplicate rows expose fingerprint and locations, risky rows expose Copy A/Copy B state, and recommendations are nonempty.
14. If the real summary reports duplicate groups, the returned duplicate list must contain at least one row.
15. Require post-cutover database integrity and exact public byte identity with the locally installed R10 HTML.
16. Any failure after cutover automatically restores the archived R9 backend/UI; no test URL is emitted until every gate passes.

## Governance

- Fetch current main and every target blob SHA immediately before writes; preserve unrelated work.
- Failed/rejected generated artifacts are evidence only and never implementation ancestors.
- `install-SOT-turn01-base.sh` is the only active Base installer.
- Owner is the browser/product tester; mechanically reproducible failures must be caught before handoff.
- Release handoff requires Developer PASS → Manager PASS → Red-team PASS and one exact WSL installer command.
