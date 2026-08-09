# SOT Project Portal v0.3.0

**Build:** `2026.08.09.1`  
**Repository:** `acmeproducts/stuff`  
**Deployment target:** WSL / OpenClaw environment

## Architecture correction before deployment

The release uses **one auxiliary SOT HTTP helper only**:

```text
127.0.0.1:8081
  /api/fs
  /api/projects
  /api/reports
```

The existing `file_browser.py` helper has been expanded to own project persistence and reporting metadata. There is **no 8082 service** and no standalone `sot-project-api.service` in the supported deployment.

Architecture rule:

> Do not add a new service, daemon, port, database, or proxy layer when the existing SOT helper can safely own the function. A new operational component requires a concrete technical boundary and explicit justification.

OpenClaw remains on its existing gateway port, and the existing report/static server remains unchanged.

## Version verification

This release uses the same version/build marker in:

- `project.html` — visible in the sidebar, top bar, and Settings/Diagnostics
- `file_browser.py` — returned by `/healthz` and project API health
- `deploy-sot-project.sh` — printed during deployment
- `SOT_PROJECT_VERSION` — repository-level release marker

The UI compares its version with the API version and visibly warns when they differ.

## Implemented in v0.3.0

### Intake

- One canonical project creation path: **Intake → Enter Project**
- Live multi-source selection through `/api/fs`
- Optional initial target
- Immutable server-generated `project_token`
- Server-side SQLite persistence
- Idempotency key protection for repeated submissions
- Semantic duplicate check based on source fingerprints, project name, and target
- Source fingerprint stored separately from current source path

### Operations

- Project selector for existing projects
- Mutable project name / immutable project token
- Copyable project token
- Source(s) → Target process view
- Target(s) → SOT promotion area
- Target reassignment
- Project rename
- Project metadata delete
- Execution controls are contextual
- Start/Pause/Resume/Restart/Promote are deliberately disabled until the deterministic `sotctl` execution engine exists
- Backend returns `ENGINE_NOT_READY` instead of simulating successful work

### Reporting

- Aggregate mode
- Timeline mode
- Project Detail mode
- Project events recorded server-side
- Source registry and fingerprints available in project detail
- Run schema exists separately from project identity

### Diagnostics

- Optional debug logging in Settings
- Copy-debug-log button
- UI version/build visible
- API version/build visible
- UI/API version mismatch warning
- Filesystem and project API health indicators

## Deployment

From the WSL clone of `acmeproducts/stuff`:

```bash
git pull
chmod +x deploy-sot-project.sh
./deploy-sot-project.sh
```

The deploy script:

1. backs up the currently deployed portal and helper,
2. deploys `project.html`,
3. deploys the unified `file_browser.py`,
4. restarts only the existing helper process on `127.0.0.1:8081`,
5. preserves the existing OpenClaw `/` and report `/report` routes,
6. routes `/api/fs`, `/api/projects`, and `/api/reports` to the same helper on `8081`,
7. removes the abandoned `sot-project-api.service` only if it somehow exists,
8. checks helper and project API health,
9. prints the deployed version/build and current Tailscale Serve configuration.

## Deliberately not implemented yet

The actual reconciliation execution engine remains the next development milestone. No `sotctl` exists in the current WSL environment, so v0.3.0 does not pretend that scan/hash/copy/pause/resume operations are running.

Next engine work:

- `sotctl` command surface
- worker/checkpoint execution
- scan + source registration engine
- hash/crunch engine
- copy plan + verified copy
- real Pause/Resume/Restart run semantics
- explicit Target → SOT promotion
- OpenClaw project/session orchestration
