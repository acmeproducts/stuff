# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** R8 ACTIVE — GLOBAL CONTENT RECONCILIATION  
**Date:** 2026-09-05

## Governing correction

R7 is emphatically owner-rejected and archived in `SOT/archive/2026-09-05-turn01-r7-owner-rejection/GY-025.md`.

The failure was not styling. The UI exposed workflow machinery instead of answering the storage-management question. It also made false health claims such as `0 files + 0 missing = Protected` and allowed SSOT to say no attention was required while constituent projects were unresolved.

R8 replaces that model.

## One authoritative model

SOT is a **global physical-content reconciliation system**.

The durable hierarchy is:

`physical content fingerprint → known physical locations → project membership → required copy policy → missing work`

Projects do not create duplicate physical-content truth. If the same fingerprint belongs to several projects, SSOT counts the bytes once and records all project memberships.

A disk's role may change without changing the identity of the content on it. A former active Target that is full or rotated out remains a known fingerprinted location. Content identity and copy truth survive role changes.

## Ownership

### SSOT owns

- the global deduplicated content catalog;
- every known physical content location;
- verified copy coverage;
- storage-volume availability;
- active write destinations / storage roles;
- protection policy and placement;
- cross-project overlap and shared bytes;
- the ordered list of missing work.

### Projects own

- which source locations/content belong to the project;
- project membership in the global catalog;
- optional exceptional policy constraints only.

Projects do **not** fundamentally own independent Target disks. Existing per-project destination plumbing may remain temporarily underneath R8 for compatibility, but the primary product model and UI must not present Target/Backup as project identity.

## Primary UX contract

The main screen is storage reconciliation, not a workflow dashboard.

The dominant visual is:

`SOURCE → SAFE COPY A → SAFE COPY B`

and must answer immediately:

1. **Unique source content** — deduplicated across all projects.
2. **Fully protected** — positive committed content with all required verified copies.
3. **Needs one or more copies** — content whose required verified copy coverage is incomplete.
4. **Unknown / needs scan** — content/projects for which current committed evidence is insufficient to make a protection claim.
5. **Shared between projects** — deduplicated bytes referenced by more than one project.
6. **Next actions** — a short ordered list with a direct action beside every problem.

No screen may infer healthy storage from zero counters when there is no positive committed evidence.

## Project UX contract

A project is a lens onto SSOT. Its primary view shows:

- logical project bytes/files;
- unique physical bytes attributable only to this project;
- bytes shared with other projects;
- verified copy coverage;
- missing/unknown bytes;
- one plain-language conclusion;
- one direct next action.

Example:

`625 GB project content · 207 GB unique here · 418 GB shared`  
`611 GB has both required copies · 14 GB needs another copy`  
`[ Protect 14 GB ]`

Implementation states such as evidence revision, `closed`, worker phase, stale plan, Pause/Stop/Continue belong under advanced diagnostics and may appear only when they directly explain or control a live operation.

## Truth rules

1. **Protected requires positive evidence.** `0 content`, empty evidence, or unknown evidence can never classify as Protected.
2. Protection is evaluated per content fingerprint against verified physical holdings.
3. SSOT and project views use the same resolver. They cannot disagree about health.
4. Global unique bytes are counted once even when content belongs to multiple projects.
5. Shared bytes are bytes whose fingerprint belongs to more than one active project.
6. A transient operation failure cannot erase committed content truth, but it can make newer/unscanned scope explicitly Unknown.
7. A full/retired disk holding verified content remains part of known storage truth while available; changing its storage role does not reclassify its files as new content.

## R8 backend scope

Preserve the qualified coordination foundation (`b58920f014960c9b18b705a0fdcf0406c621fd5f`, schema 5) and add one clean read model for SSOT reconciliation using existing `current_observations`, `observations`, `content`, `target_holdings`, `backup_holdings`, projects, and sources.

The SSOT read model must return:

- global unique content count/bytes;
- globally fully protected count/bytes;
- missing Target/copy-A count/bytes;
- missing Backup/copy-B count/bytes;
- missing both count/bytes;
- shared-across-projects count/bytes;
- project rows with logical unique content, project-only bytes, shared bytes, copy coverage, evidence availability, and current operation overlay.

This is a read-model addition; no schema migration is required for R8.

## R8 UI scope

Build a clean R8 surface rather than patching R7 presentation logic.

- No six-stage bar on the primary surface.
- No generic `Protected` from project flags.
- No `closed` as an operator status.
- No always-visible Pause/Stop/Continue controls.
- SSOT overview is the default home screen.
- Project cards show coverage, overlap, and the next storage action.
- Project detail is `Source → Copy A → Copy B` with bytes/files and missing/unknown coverage.
- Advanced diagnostics remain available but collapsed.
- Background polling patches numeric/status nodes only and never rebuilds operator-owned UI state.

## R8 qualification gates

Before owner handoff:

1. Backend JS parses and retains schema 5 coordination capabilities.
2. SSOT endpoint deduplicates the same content fingerprint across two projects and counts its bytes once globally.
3. The same fixture reports those bytes as shared across projects.
4. `0 files / 0 bytes` is Unknown/Not indexed, never Protected.
5. Positive content with both verified holdings is Fully protected.
6. Positive content missing one holding is Needs copy with exact missing bytes.
7. SSOT aggregate equals the sum of mutually exclusive global coverage classes.
8. Project rows reconcile to the same content fingerprints used globally.
9. UI contains no six-stage primary workflow and no `closed` primary status.
10. UI renders Source → Copy A → Copy B plus unique/shared/missing bytes.
11. Existing coordination, database-integrity, public-byte identity and rollback gates pass.
12. Host installer prints the exact cache-busted owner-test URL only after all gates pass.

## Governance

- Failed/rejected generated artifacts are evidence only.
- Do not patch R7 UI forward.
- Preserve unrelated repository work; fetch current main and target SHA before every write.
- `install-SOT-turn01-base.sh` remains the only active Base installer.
- The owner is the product/browser tester; mechanically reproducible truth failures must be caught before handoff.
