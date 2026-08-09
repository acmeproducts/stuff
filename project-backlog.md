# SOT Project Portal Backlog

## Purpose

Use `acmeproducts/stuff` as the development source for the SOT project portal and deploy from this repository into the WSL/OpenClaw environment.

The portal should be sleek, streamlined, and organized around one project lifecycle rather than exposing project creation in multiple places.

---

## Core Product Rules

### 1. One project, one identity

A project **must not be independently created from multiple places in the UI**.

There is one canonical project creation flow:

> **Intake → Enter Project**

Every other view may open, manage, operate on, or report on an existing project, but may not create a second independent project record.

### 2. Immutable project token; mutable project name

Each project receives a unique immutable project token/hash at creation.

Conceptual identity input:

```text
creation date + normalized source identities + initial project name + random/unique entropy
        ↓
project token/hash
```

The **project token is the durable primary key**.

The **project name is a user-facing label and may be renamed at any time** without changing the project token, project history, checkpoints, sources, targets, reports, or OpenClaw session association.

Example:

```text
project_token: PRJ-7E3C9F1A...
project_name: Phone + SSD Consolidation
created_at: 2026-08-09T11:06:00-07:00
```

If the user renames the project to `2026 Master Photo Consolidation`, the token remains unchanged.

### 3. Source folders are assignable

The Intake workflow must allow one or more source volumes or folders to be assigned to the project.

The current dynamic filesystem service already exposes WSL-visible locations through `/api/fs`, including Windows volumes and WSL paths. The portal should use that live filesystem browser instead of hard-coded paths.

Sources are read-only inputs to the SOT workflow.

### 4. Project creation must be deduplicated

Before creating a project, Intake must check for an existing matching project identity.

At minimum, duplicate detection should consider:

- existing project token
- canonicalized source paths / source fingerprints
- target configuration when known
- creation transaction / idempotency key

A repeated submit, browser refresh, API retry, or double-click must not create a second project.

The backend must enforce this rule; it cannot rely only on disabling the UI button.

---

# Portal Information Architecture

The primary navigation should be reduced to three functional areas:

```text
INTAKE
OPERATIONS
REPORTING
```

System/configuration functions may live behind a compact Settings/Configuration control rather than occupying the primary workflow.

---

# 1. Intake

## Primary action

### Enter Project

This is the **only project creation entry point**.

The Intake screen should be a focused wizard or compact workspace, not a dashboard full of alternate creation buttons.

### Required Intake data

```text
Project Name
Source(s)
Optional initial Target
Notes / label metadata if needed
```

System-generated fields:

```text
project_token
created_at
updated_at
project_status
source identities / fingerprints
```

### Source selection

Use the dynamic filesystem browser:

```text
GET /api/fs?path=/
```

Allow:

- whole Windows/WSL-visible volumes
- one or more folders within a volume
- network paths visible to WSL
- WSL folders
- removable sources that may later reconnect under a different path

The selected path is the current locator; the source fingerprint becomes the durable source identity.

### Intake completion

On successful creation:

1. Backend creates exactly one project record.
2. Backend creates immutable `project_token`.
3. Sources are registered to the project.
4. Project enters `REGISTERED` or equivalent ready state.
5. User is taken directly to the project's Operations view.
6. OpenClaw session/project association may be created using the project token as the stable linkage.

### Intake acceptance criteria

- [ ] Only one visible project creation flow exists.
- [ ] Submit is idempotent.
- [ ] Refresh/retry cannot duplicate a project.
- [ ] One or more source folders can be assigned.
- [ ] Source selection comes from live `/api/fs` discovery.
- [ ] Project receives an immutable token/hash.
- [ ] Project name can later change independently of the token.
- [ ] Newly created project immediately opens in Operations.

---

# 2. Operations

Operations is the active work surface for a selected project.

The layout should focus on two transformations:

## A. Source(s) → Target

```text
Source A ─┐
Source B ─┼─→ Target
Source C ─┘
```

This represents the current reconciliation turn:

- register / verify sources
- scan
- manifest
- fingerprint
- hash
- crunch / duplicate analysis
- build copy plan
- execute copy plan
- verify target

## B. Target(s) → SOT

```text
Verified Target / Candidate SOT
        ↓
validation / promotion
        ↓
Current SOT
```

This represents promotion of a verified target into the rolling Source of Truth.

### Operations project header

Always show:

```text
Project Name          [editable]
Project Token         [immutable / copyable]
Status
Current Stage
Last Checkpoint
Last Activity
```

Renaming changes only `project_name`.

It must never regenerate or replace `project_token`.

### Operations controls

Controls should be contextual rather than all visible at once.

Expected actions:

```text
Start
Pause
Resume
Restart
Stop/Cancel where safe
Rename
Open source
Open target
Promote Target to SOT
```

Only actions valid for the current project state should be presented.

### Pause / resume

Pause and resume are real backend operations, not cosmetic UI state changes.

Long-running work must checkpoint so that interruption from any of the following is recoverable:

- source disconnect
- WSL restart
- OpenClaw restart
- browser closure
- system reboot
- worker failure
- intentional pause

### Restart semantics

`Restart` must not silently create a duplicate project.

Restart means a new run/attempt under the **same project token**, with explicit server-side rules for retaining prior runs, checkpoints, and reports.

### Operations acceptance criteria

- [ ] Operations always acts on an existing project token.
- [ ] Project name is editable without changing token.
- [ ] Source(s) → Target is clearly represented.
- [ ] Target(s) → SOT is clearly represented.
- [ ] Start/Pause/Resume/Restart operate against real backend state.
- [ ] Restart cannot create another project record.
- [ ] Current stage and checkpoint are visible.
- [ ] Offline/reconnected sources can be fingerprint-matched back to the project.
- [ ] Target promotion is explicit and auditable.

---

# 3. Reporting

Reporting should not duplicate operational controls. It is primarily read/inspect/export.

Provide three reporting modes.

## A. Aggregate

Cross-project rollup.

Suggested metrics:

```text
Projects total
Projects active
Projects paused
Projects complete
Sources processed
Raw bytes scanned
Unique bytes
Exact duplicate bytes
Current SOT size
Copy jobs completed
Verification failures
Collisions / review-required items
```

Allow filtering by date, status, source, target, and project.

## B. Timeline

Chronological event stream across projects.

Examples:

```text
Project created
Source registered
Source disconnected
Source reconnected
Scan started/completed
Hash started/completed
Project paused
Project resumed
Copy plan created
Copy completed
Verification completed
Target promoted to SOT
Project renamed
Error / warning
```

Every event should be tied to:

```text
project_token
run_id where applicable
timestamp
event_type
actor / worker
message / details
```

## C. Project Detail

Full audit/history page for one project.

Include:

- current project name
- immutable token
- creation date
- source registry
- source fingerprints
- targets
- run history
- checkpoints
- file/byte counts
- duplicate statistics
- collision statistics
- copy plans
- verification results
- errors
- provenance
- SOT promotion history
- OpenClaw session linkage

### Reporting acceptance criteria

- [ ] Aggregate view spans multiple projects.
- [ ] Timeline is event-based and chronological.
- [ ] Project Detail resolves by immutable project token.
- [ ] Historical reports survive project rename.
- [ ] Reports distinguish project identity from run identity.
- [ ] Reporting contains no alternate project-creation path.

---

# Data Model Backlog

## Project

Minimum conceptual record:

```text
project_token        immutable primary key
project_name         mutable display label
created_at
updated_at
status
current_stage
current_run_id
current_target_id
openclaw_session_key
notes
```

## Project source association

```text
project_token
source_id
source_fingerprint
current_path
operator_label
status
added_at
last_seen_at
```

## Project run

A project may have multiple runs without becoming multiple projects.

```text
run_id
project_token
started_at
ended_at
status
restart_of_run_id
checkpoint_state
```

This separates:

```text
PROJECT = durable user intent / identity
RUN     = one execution attempt
```

## Project event

```text
event_id
project_token
run_id
timestamp
event_type
message
details_json
```

---

# Backend/API Backlog

The UI should consume a single project-control service rather than storing authoritative project state in browser `localStorage`.

## Intake / project identity

```text
POST   /api/projects
GET    /api/projects
GET    /api/projects/:project_token
PATCH  /api/projects/:project_token
DELETE /api/projects/:project_token
```

`POST /api/projects` must support an idempotency key and enforce non-duplication.

## Operations

```text
GET    /api/projects/:project_token/status
POST   /api/projects/:project_token/start
POST   /api/projects/:project_token/pause
POST   /api/projects/:project_token/resume
POST   /api/projects/:project_token/restart
POST   /api/projects/:project_token/promote
```

## Sources / targets

```text
GET    /api/fs?path=/
POST   /api/projects/:project_token/sources
DELETE /api/projects/:project_token/sources/:source_id
POST   /api/projects/:project_token/targets
```

## Reporting

```text
GET /api/reports/aggregate
GET /api/reports/timeline
GET /api/projects/:project_token/report
```

---

# OpenClaw Integration Backlog

The project token should be the stable integration key between the SOT portal and OpenClaw.

Required behavior:

- [ ] A project may have an associated OpenClaw session.
- [ ] Store `openclaw_session_key` on the project record.
- [ ] The OpenClaw session label should track the current mutable project name.
- [ ] Renaming a project updates the OpenClaw session label through `sessions.patch` without changing project token or session key.
- [ ] OpenClaw may orchestrate project actions, but deterministic filesystem work remains in the harness/backend.
- [ ] Project events caused by OpenClaw are recorded in the same timeline as UI-triggered actions.

---

# UX Backlog — Sleek and Streamlined

## Remove

- [ ] Multiple `New Project` / `Create Project` entry points.
- [ ] Duplicate navigation actions that perform the same operation.
- [ ] A permanent System page in the primary workflow unless needed for troubleshooting.
- [ ] Technical API-contract information from ordinary operator screens.
- [ ] Controls that are invalid for the current state.
- [ ] Browser-local project state as the authoritative database.

## Replace with

Primary navigation:

```text
Intake
Operations
Reporting
```

Optional compact controls:

```text
Project selector
Settings
Diagnostics
OpenClaw chat
```

## Visual direction

- [ ] Reduce chrome and card count.
- [ ] Use more whitespace and stronger hierarchy.
- [ ] One dominant action per view.
- [ ] Operations should resemble a process console, not an admin form.
- [ ] Use progressive disclosure for advanced/status details.
- [ ] Make project token copyable but visually secondary to project name.
- [ ] Keep source/target relationships visually obvious.
- [ ] Keep debug and diagnostics behind Configuration/Settings.

---

# Development / Deployment Workflow

Use this repository as the development source of truth for now.

```text
acmeproducts/stuff
        ↓
development / review
        ↓
Git commit
        ↓
deploy/sync into WSL OpenClaw environment
        ↓
run locally behind existing Tailscale/OpenClaw routing
```

Current deployment assumptions:

- Repository: `acmeproducts/stuff`
- Development files live in this repository.
- WSL deployment is performed from the repository version.
- Do not maintain separate diverging hand-edited production copies when avoidable.
- Configuration/secrets remain environment-side and must not be committed into GitHub.

---

# Immediate Backlog

## P0 — Project identity / Intake

- [ ] Collapse all project creation into **Intake → Enter Project**.
- [ ] Implement immutable `project_token`.
- [ ] Implement idempotent project creation.
- [ ] Add live multi-source folder/volume selection from `/api/fs`.
- [ ] Persist projects server-side.
- [ ] Make project name mutable independently of token.

## P0 — Project control backend

- [ ] Implement `/api/projects` service.
- [ ] Create project database/schema.
- [ ] Implement project status model.
- [ ] Implement source associations.
- [ ] Implement run identity separate from project identity.
- [ ] Implement event/timeline records.

## P1 — Operations

- [ ] Build streamlined **Source(s) → Target** view.
- [ ] Build **Target(s) → SOT** promotion flow.
- [ ] Implement real Start/Pause/Resume/Restart.
- [ ] Add checkpoint/status monitoring.
- [ ] Add source reconnect/fingerprint handling.

## P1 — OpenClaw linkage

- [ ] Associate one OpenClaw session with a project where desired.
- [ ] Keep OpenClaw session label synchronized with mutable project name.
- [ ] Preserve stable project token and session key across renames.

## P2 — Reporting

- [ ] Aggregate report.
- [ ] Timeline report.
- [ ] Project Detail report.
- [ ] Export/report links.

## P2 — UI simplification

- [ ] Replace current Dashboard/Projects/New Project/System structure with Intake/Operations/Reporting.
- [ ] Move configuration/debug controls behind Settings.
- [ ] Remove operator-facing API implementation details.
- [ ] Reduce visual density and unnecessary cards/actions.

---

# Key Invariants

These rules should be treated as architectural constraints:

1. **Project creation happens in one place only.**
2. **A project is identified by immutable `project_token`, never by its mutable name.**
3. **Repeated create/retry actions cannot duplicate a project.**
4. **A project may have multiple runs; a restart is not a new project.**
5. **Source folders/volumes are assignable and source identity must survive path/drive-letter changes through fingerprinting.**
6. **Operations are real backend actions with checkpoints, not UI-only status changes.**
7. **Reporting resolves history by project token so rename does not break continuity.**
8. **OpenClaw session labels may follow project-name changes, while the project token and OpenClaw session key remain stable identities.**
9. **GitHub repository content is the development source for deployment into WSL; secrets/config remain outside Git.**
