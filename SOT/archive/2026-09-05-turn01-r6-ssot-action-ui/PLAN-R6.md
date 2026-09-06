# SOT Turn 01 Base — R6 SSOT Action Surface Plan

**Status:** ACTIVE — OWNER TEST REQUIRED  
**Stage:** Turn 01 Base  
**Date:** 2026-09-05

This R6 plan is the governed additive plan record for the current Turn 01 Base. It does not erase or rewrite the existing master-plan history.

## Product model

### Installation SSOT

The installation owns one SSOT management view across every project SOT. It answers, without opening projects individually:

- how many projects and how much source storage exist;
- which projects are protected;
- which projects need attention;
- which projects are ready/in progress;
- the specific next corrective action for every project that is incomplete or blocked.

### Project SOT

Each project presents one transparent lifecycle:

`Setup → Index → Review → Plan → Protect → Verify`

Completed, current and pending stages are visually distinct. Durable project state and transient operation state are separate. A replacement index or failed copy operation cannot erase already-committed evidence/plan truth.

### Action model

Primary status is operator-facing, never a generic machine `Error` when the system knows the correction. Every correctable condition must pair the explanation with its direct action, including:

- Needs Sources → Choose Sources
- Ready to Index → Index Now
- Index paused/incomplete → Continue Index
- Needs Target → Choose Target
- Target unusable → Fix Target
- Needs Backup → Choose Backup
- Plan missing → Create Plan
- Plan stale → Update Plan
- Ready to Protect → Protect Files
- Protection incomplete → Continue/repair the blocking destination
- Copies complete → Verify Result

Raw exceptions remain in Activity / diagnostics.

## UI invariants

1. An operator-opened project section stays open until the operator closes it or selects another project.
2. Polling may reconcile server facts/progress but may not reset disclosure, selection, search, scroll, picker, modal or focused input.
3. Project cards are informational plus one direct next-action control; detailed work happens in the project surface.
4. Source, Target and Backup use the shared live-volume folder picker.
5. The project header always states current durable truth and next step.
6. SSOT overview is a first-class management surface, not a collection of unrelated project cards.
7. Diagnostics are secondary to actionable status.

## Implementation lineage

- Preserve the qualified coordination backend foundation and schema 5.
- Reject R5 UI as an implementation ancestor per `GY-023`.
- R6 UI is a clean source file: `SOT-turn01-base-r6.html`.
- Canonical delivery remains `install-SOT-turn01-base.sh`, which archives the current UI, verifies the existing qualified backend/schema/database, validates the R6 UI contract and JavaScript syntax, installs the R6 UI, verifies public byte identity, and rolls the UI back if post-cutover qualification fails.
- No wrapper, iframe, overlay, runtime fetch patch, compatibility shim, or generated patch chain.

## Release gates

Mechanical gates before owner testing:

1. database integrity and schema 5;
2. qualified backend build/capabilities live;
3. R6 source contract markers;
4. extracted JavaScript parses with Node;
5. public HTTP 200 and exact byte identity after cutover;
6. database integrity unchanged after UI cutover.

Owner behavior gates:

1. Open Sources/Index/Plan/Activity; leave it open for at least 15 seconds while polling runs. It must remain open.
2. Project with missing/invalid Target says `Needs Target` or `Target needs attention` and exposes `Choose/Fix Target` immediately.
3. Selecting that action opens the live-volume folder picker and saving updates the project without visiting diagnostics.
4. Project card and project header show durable progress plus the next step, not generic `Error`.
5. SSOT Overview clearly identifies projects needing attention and gives their direct actions.
6. Indexing/re-indexing shows operation progress without hiding previously committed evidence.
7. Project selection and expanded sections remain stable during background activity.
8. Lifecycle makes completed/current/next stage obvious without interpreting raw events.

Promotion to the next stage is blocked until these owner gates pass.
