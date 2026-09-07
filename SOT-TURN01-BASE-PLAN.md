# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** R10 MECHANICALLY QUALIFIED — OWNER UX CORRECTION REQUIRED  
**Date:** 2026-09-06

## Governing model

SOT is a global physical-content reconciliation system backed by one SSOT database.

`physical fingerprint → known physical locations → project membership → required verified copies → missing work → recommended action`

Content identity is permanent; storage roles are not. Projects are membership/policy lenses over the SSOT and do not own physical-content truth. A Target may later become retained/source storage without changing fingerprint identity.

## Product outcome

The owner does not need a storage analytics billboard. The primary job is:

**safely clean up files → prove required copies exist → certify the cleaned estate → permit source media to be cold-stored or deliberately retired.**

Every primary Dashboard element must therefore answer one of four questions: **What do I do next? What will that accomplish? How much remains? Is it safe/certified yet?** Evidence and diagnostics remain available, but they must not dominate the operating surface.

## R10 owner review — required UX correction

R10 mechanically qualified, but owner browser review rejects its information density and non-actionable presentation. The intelligence itself is useful; the operating hierarchy is not.

### 1. Recommendations become actions

The current recommendation banners such as `Protect 100 high-value unprotected items shown` and `Review 3878 duplicate groups` are informational only. Each recommendation must have an explicit next action/control, for example `Protect / verify`, `Review duplicates`, or a chevron that expands to the explanation plus the concrete next step. A recommendation may not terminate at diagnosis.

### 2. Duplicate evidence becomes a bounded drill-down

The long `Largest duplicate groups` list may not consume the Dashboard. It becomes a collapsed chevron/summary by default. When expanded it uses a fixed-height scrollable region. Individual duplicate rows retain their own disclosure for fingerprint, locations, projects and disposition evidence. Exhaustive evidence remains in Database/Deep Dive.

### 3. Replace storage-estate accounting bars with a cleanup/protection progress picture

The current `Unique content / Verified copy A / Verified copy B / Fully protected / Needs protection` accounting bars do not provide enough operating context. The primary visualization must show the estate as one understandable quantified journey: total in scope, already safe/certified, work remaining, and the immediate next step. It must make the relationship visually obvious rather than require inference.

The preferred mental model is:

`IN SCOPE → SAFE / CERTIFIED → REMAINING → NEXT ACTION`

Quantities must be shown in bytes and/or fingerprints as appropriate. Copy A/Copy B remain factual evidence but are subordinate to the question `Can I safely clean/cold-store/retire the source?`.

### 4. Project rows stay compact and actionable

The project list is the operating surface. Each row must communicate project name, compact progress/safety state, and the one valid next action. Examples: `Start scan`, `Continue scan`, `Protect`, `Verify`, `Review cleanup`, `Certified`. Do not require the owner to infer the next action from a status label.

### 5. Project detail moves out of the Dashboard

The large selected-project detail block currently rendered beneath the project list is removed from the normal Dashboard flow. Detailed project breakdown belongs in a modal/drill-down opened deliberately from the project row. The modal may contain Sources/Target/Backup configuration, project-specific copy coverage, duplicate/unique evidence, recommendations, operation telemetry and Deep Dive access.

A project that has not been scanned must not render an empty duplicate/protection analytics panel. Its useful state is simply that it has not started, what is configured, and the `Start scan` action.

### 6. Progressive disclosure rule

Dashboard default density is deliberately low:

1. global cleanup/protection progress;
2. explicit next action(s);
3. compact project rows with progress + next action;
4. collapsed/bounded evidence summaries;
5. modal/Database/Deep Dive for detail.

No unbounded evidence list is allowed on the Dashboard.

## Storage configuration

Sources define project membership. Target is Copy A and Backup is Copy B. The picker uses `/turn01/volumes`, `/turn01/fs`, and `/turn01/fs/folder`; source assignments use the canonical project sources API and destination assignments use the canonical project storage API. No parallel configuration state is introduced.

## Storage intelligence read model

The R10 read-only deterministic intelligence projection remains authoritative and is not replaced. It reports fingerprint counts/logical bytes, duplicate source groups, redundant source bytes, cross-project sharing, physical locations, missing verified copies and deterministic recommendations. The UX correction changes presentation and action routing, not SSOT truth.

Deletion is never automatic. Shared-project content and verified protection copies are never classified as disposable duplicates. Cleanup/removal is enabled only after required protection/verification evidence exists.

## Database / Activity / Settings

Database remains the exhaustive content/location/project/operation evidence surface. Activity remains the durable operation/event surface. Settings retains storage policy and browser-local AI provider/model/key configuration. These are supporting surfaces, not substitutes for an action-oriented Dashboard.

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
10. A project with no committed scan evidence must not display zero-valued cleanup analytics as though they were meaningful findings.
11. Certification is the terminal owner-facing proof that required cleanup/protection/verification policy has been satisfied for the applicable scope.

## Next release acceptance gates

### Developer

- Clean source diff from the governed mechanically qualified R10 lineage; never patch generated live HTML.
- Dashboard contains no unbounded duplicate list.
- Recommendation cards expose explicit actions/disclosures.
- Project rows expose one state-valid next action.
- Project detail is modal/drill-down rather than permanently expanded below the table.
- Unscanned projects suppress meaningless zero-valued analytics.
- JavaScript syntax/boot validation passes.

### Manager

- The primary Dashboard reads as an operating sequence toward safe cleanup/certification, not an analytics report.
- Copy A/Copy B and duplicate evidence remain available without dominating the default surface.
- No unrelated architecture, schema, workflow, deployment, Database, Activity or Settings changes.
- Existing SSOT intelligence truth and coordination rules are preserved.

### Red team

- From the default Dashboard, a tester can identify the next valid action without opening Database/Deep Dive.
- Expanding duplicate evidence cannot grow the page without bound; the region is fixed-height and scrollable.
- An unscanned project offers Start scan and does not imply analyzed duplicate/protection truth.
- A scanned/unprotected project routes to protection/verification work.
- A protected project routes to verification/certification rather than deletion by inference.
- No cleanup/removal action is enabled without protection/verification evidence.
- Public byte identity, live endpoint health, database integrity and rollback gates remain mandatory before owner test URL.

## Governance

- Fetch current main and every target blob SHA immediately before writes; preserve unrelated work.
- Failed/rejected generated artifacts are evidence only and never implementation ancestors.
- `install-SOT-turn01-base.sh` is the only active Base installer.
- Owner is the browser/product tester; mechanically reproducible failures must be caught before handoff.
- Release handoff requires Developer PASS → Manager PASS → Red-team PASS and one exact WSL installer command.
