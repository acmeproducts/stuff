# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** R9 ACTIVE — DATABASE-CENTERED MASTER / DETAIL  
**Date:** 2026-09-06

## Governing model

SOT is a global physical-content reconciliation system backed by one SSOT database.

`physical fingerprint → known locations → project membership → required copies → actual verified copies → missing work`

Content identity is permanent. Storage roles are not. A full former Target may become retained/source storage and its verified fingerprints remain known. Projects are membership/policy views over the database and do not own physical-content truth.

R7 presentation is rejected in GY-025. R8 pre-cutover syntax failure is GY-026. R8 dashboard presentation is emphatically owner-rejected in GY-027. The qualified R8 reconciliation backend/read model remains useful foundation; rejected UI artifacts are evidence only.

## Product information architecture

### 1. Dashboard — default home

Dashboard is the default landing surface. There is no `Overview` or `Storage estate` mode button.

It must show the whole storage estate visually:

- unique fingerprinted source content;
- verified Copy A coverage;
- verified Copy B coverage;
- fully protected content;
- unresolved / unknown content;
- shared cross-project content;
- current storage work.

Coverage is displayed primarily as horizontal bars whose lengths are comparable against the unique-content estate.

### 2. Active now — always visible

Any queued/running/paused index, plan, copy, or verification operation appears prominently on Dashboard and on its project master row.

For index work show, when available:

- operation name/state;
- files processed / expected;
- bytes processed / expected;
- percentage/progress bar;
- elapsed/current item when available;
- Pause + Stop while running;
- Resume + Stop while paused.

A project with an active operation may never simultaneously offer `Scan now` as though idle.

### 3. Master → detail

Dashboard contains the project master list. Selecting a project does not navigate away. Detail renders directly below the master/dashboard context.

Project master rows show:

- project name;
- logical content;
- unique vs shared bytes;
- verified coverage;
- unresolved bytes;
- live operation/progress if active;
- one next storage action if idle.

Project detail shows Source → Copy A → Copy B coverage as compact visual bars plus sources/membership and corrective action.

### 4. Deep-dive modal

`Details` opens a large modal rather than navigating away. It may contain exhaustive information without cluttering Dashboard:

- project sources and scope;
- content/copy summaries;
- fingerprints/locations;
- overlap/membership;
- plans/evidence revisions;
- operation history;
- diagnostics/errors/provenance.

Modal actions: Print, Download JSON, Download CSV where applicable, Share/send when platform capability exists. AI analysis is a future extension point, not an R9 blocker.

### 5. Database — first-class surface

Database is a top-level surface beside Dashboard, Activity, and Settings.

Database provides a searchable catalog over SSOT truth, not a diagnostics dump. Initial views:

- Content — fingerprint, size, project membership count, location/copy state;
- Locations — known paths/holdings and verification state;
- Projects — membership/overlap view;
- Operations — durable operation records.

Search accepts fingerprint, filename/path when available, project, and location. Results support JSON/CSV export.

### 6. Activity — first-class surface

Activity exposes durable current/recent work and event history. It is separate from database inspection and from the normal dashboard.

## Truth rules

1. Protected requires positive committed content plus required verified copies.
2. Zero files/bytes is Unknown/Not indexed, never Protected.
3. Global unique bytes count each fingerprint once regardless of project membership.
4. Shared bytes are fingerprints referenced by more than one active project.
5. SSOT, project rows, detail, database and exports use the same resolver/read model.
6. A failed/new scan cannot erase prior committed truth; any unscanned newer scope is explicitly Unknown.
7. Active-operation truth overrides idle CTA presentation without overwriting committed storage truth.
8. Storage-role changes do not change content identity.

## R9 backend/read-model scope

Preserve qualified schema-5 coordination and R8 global reconciliation. Extend the read model only where required for:

- active-operation progress fields on project rows;
- database catalog queries over current fingerprints, memberships and holdings;
- durable activity queries;
- exportable deep-dive payloads.

Do not create alternate content identity or project-specific storage truth.

## R9 UI scope

Create a clean standalone R9 source. Do not patch R8 UI forward.

Top navigation:

`SSOT | Dashboard | Database | Activity | Settings`

Dashboard order:

1. storage-estate coverage bars;
2. Active now;
3. project master list;
4. selected project detail below master;
5. ordered attention/corrective actions.

The surface must remain useful at tablet width. Background refresh patches data without resetting selected project, active tab, scroll, modal, database query/filter, focus, or disclosure state.

## R9 qualification gates

1. Backend JS parse.
2. Existing R8 cross-project fingerprint dedup fixture still passes.
3. Zero-content cannot classify Protected.
4. Running fixture appears in Active now and project row.
5. Running fixture cannot render idle `Scan now` CTA.
6. Progress counters/bar render from backend operation/run counters.
7. Dashboard is default and no Overview/Storage-estate mode button exists.
8. Comparable estate bars render unique, Copy A, Copy B, fully protected, unresolved.
9. Project selection renders detail without replacing master/dashboard context.
10. Deep-dive modal exists and provides Print + JSON export.
11. Database top-level surface supports Content/Locations/Projects/Operations views and search.
12. Activity top-level surface exposes current/recent durable operations.
13. Poll refresh preserves operator-owned state.
14. Database integrity, public-byte identity, rollback and canonical installer gates pass.
15. Installer emits exact cache-busted owner-test URL only after all gates pass.

## Governance

- Rejected UI builds are evidence only and never implementation ancestors.
- Preserve unrelated repository work; fetch current main and every target blob SHA immediately before writes.
- `install-SOT-turn01-base.sh` remains the only active Base installer.
- Owner is the product/browser tester; mechanically reproducible failures must be caught before handoff.
