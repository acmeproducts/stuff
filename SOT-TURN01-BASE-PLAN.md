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

### Developer pass
1. R10 backend integrator and resulting backend parse.
2. R10 UI integrator and extracted UI JavaScript parse.
3. Existing R8 reconciliation and R9 catalog remain present.
4. Intelligence fixture proves duplicate group count, redundant-byte math, physical locations, shared-project distinction and missing-copy reporting.
5. UI contract proves Dashboard intelligence, project Sources/Target/Backup, volume/folder picker, folder creation, duplicate detail, recommendations and AI settings.
6. Existing governed active-operation fixture still reads WIP 40/100 after startup recovery has completed.

### Manager pass
7. R10 is one clean advance from the qualified R9 source, not a rejected generated artifact.
8. No unrelated architecture/workflows are changed.
9. Cutover rollback is armed before first live file replacement.
10. Installer remains canonical and immutable by commit for owner execution.

### Red-team pass
11. Zero-content cannot be Protected.
12. Shared content is not counted as redundant merely because multiple projects reference it.
13. Protection holdings are not counted as redundant source locations.
14. Active operation cannot expose `Scan now`.
15. Temp qualification uses SQLite backup and exact migration set; no raw WAL copy.
16. Post-cutover health, intelligence/catalog/activity/project endpoints, database integrity and public byte identity pass.
17. Any failure before release-ready rolls back live backend/UI and does not publish a test URL.

## Governance

- Fetch current main and every target blob SHA immediately before writes; preserve unrelated work.
- Failed/rejected generated artifacts are evidence only and never implementation ancestors.
- `install-SOT-turn01-base.sh` is the only active Base installer.
- Owner is the browser/product tester; mechanically reproducible failures must be caught before handoff.
- Release handoff requires Developer PASS → Manager PASS → Red-team PASS and one exact WSL installer command.
