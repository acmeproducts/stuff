# SOT Turn 02 Pre-Base Plan

**Stage:** `pre-base`  
**Status:** RESET BASELINE — EMPTY DATABASE — SIMPLE MOBILE-FIRST SURFACE  
**Date:** 2026-09-07

## Reset decision

Turn 01 is closed as rejected owner-facing product lineage. Its database, UI, and release artifacts remain archive evidence only. Turn 02 starts from a fresh empty managed database and a new standalone UI source. No Turn 01 generated HTML is an implementation ancestor.

The reset installer must archive the current database/backend/UI before clearing live state. The fresh database is rebuilt only from the published managed migrations required by the qualified backend. No user/project/source/tag/content rows are carried forward.

## Product rule

Keep the product deliberately small until the surface is stable on mobile.

There is no background polling in pre-base. Data changes only after an explicit owner action or a manual Refresh. No periodic redraw is allowed.

## Surface

Three simple owner-facing views only:

1. **Discover** — add or remove source folders.
2. **Profile** — read the current SSOT profile and browse it as a simple folder/file hierarchy with breadcrumb navigation.
3. **Action** — initially only selected-item tag assignment/removal. Physical copy/delete/reconcile actions are deferred.

No Projects UI. No dashboard. No activity feed. No split-pane desktop layout. No hidden automatic refresh. No bulk actions in pre-base.

## Mobile-first interaction

- Single-column layout by default.
- Inputs are never reconstructed while focused.
- Software keyboard state is never manipulated by background work because there is no background redraw.
- Minimum touch target is 44px.
- Folder navigation is tap-to-drill with breadcrumb/back rather than a dense desktop tree.
- Tag entry is one persistent input; Enter or a suggestion assigns; assigned tags are chips with `×` removal.

## Data model

The backend remains the qualified schema-6 SSOT backend for now. Turn 02 pre-base clears all mutable owner data and recreates an empty schema-6 database from migrations 001-006.

The reset baseline is successful only when these owner data sets are empty after recreation:

- projects / sources;
- file observations / fingerprints / holdings;
- tags / tag assignments;
- operations / events except migration metadata and required bootstrap Profile revision.

## Pre-base acceptance gates

### Developer

- Fresh database builds from migrations 001-006 with integrity `ok` and schema version 6.
- Current backend starts against the fresh DB and health returns HTTP 200.
- Discover/Profile/tag endpoints return valid empty contracts.
- Standalone Turn 02 UI JavaScript parses.
- UI contains no timer/polling loop (`setInterval` or periodic redraw).

### Manager

- Surface is visibly mobile-first and single-column.
- Only Discover / Profile / Action exist.
- No Projects, Dashboard, Database, Activity, scheduler, or bulk-action UI leaks through.
- Profile is hierarchical/breadcrumb-based, not a flat SSOT dump.

### Red team

- Existing database is archived before reset.
- Reset cannot proceed if archive fails.
- Fresh DB contains no carried-forward owner data.
- Tag input is not subject to timer-driven DOM replacement.
- No physical delete action exists.
- Public byte identity and rollback archive are verified before owner test.

## Build progression

Do not add complexity until the prior slice is owner accepted:

`pre-base empty shell → source admission → scan/reconcile → profile browse → tags → protection actions`

One capability per accepted slice. No patch chains from rejected Turn 01 UI artifacts.
