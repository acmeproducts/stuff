# devstream — Master Plan

**Artifacts**
- CODE: `devstream-test.html` — single-file mobile-first HTML app (the orchestrator)
- PLAN: `devstream-test.md` — this file; sole authority and the ONLY memory that persists between runs
- Repo/branch: per app Settings (authoritative in the app, not duplicated here)

## 0. TURN/STAGE LEDGER
| Date | Stage | Status | Notes |
|---|---|---|---|
| 2026-09-20 | Define → Build | superseded | Owner clarified workflow: selecting a project auto-opens its first tab; new tabs skip filename prompt and default to the project file; project .md is sole authority |
| 2026-09-20 | Design → Build | in-progress | Build starts: implementing R1 — right-panel dashboard, collapsible soft-delete bin above dashboard card, project-select opens first tab, new tabs default to project file |
| 2026-09-20 | Build | done | Plan file found corrupted (literal patch blocks from a prior run). Reconstructed full plan from ledger fragments + owner directives; added guard rule #7. R1 code build is next |
| 2026-09-22 | R2 hardening | done | Plan gate and read-back, per-thread queue, stale-write rejection, fallback model record, and objective display implemented; static syntax checks and GitHub read-back passed |
| 2026-09-22 | R3 Coach mode | done | Per-project switch, beginner chat wording, automatic new-project file path, and plain-language build replies added; JavaScript parse and GitHub read-back passed |
| 2026-09-22 | R4 suggested tasks | in-progress | Add context-aware task buttons to Coach and detailed conversations |

## 1. RELEASES
- **R1 — Dashboard & workflow restore (current)** — right-panel dashboard; collapsible soft-delete bin; simplified per-project tabs
- **R2 — Run continuity and conflict safety** — guard plan context, serialize thread runs, avoid stale writes, expose model changes and next step
- **R3 — Coach mode** — optional project-level conversational experience
- **R4 — Suggested task buttons (current)** — visible next choices in both modes
- History prior to 2026-09-20 was lost in the plan-corruption event; the running app (v1.0 b31) is the de-facto baseline

## 2. R1 — Dashboard & workflow restore
**Scope (in)**
1. Dashboard displays on the right panel again (as before the latest update), not only as a modal
2. Collapsible soft-delete section with a chevron, placed above the Dashboard card in the left rail; holds soft-deleted projects; each row has **Restore** and **Delete permanently**; permanent delete shows an "Are you sure?" modal before executing
3. Selecting a project in the left rail defaults the view to its first tab
4. "+" tab on a project no longer prompts for a filename; it binds to the project's main file (filename is specified only at project creation — the one and only authority for the filename)
5. User may instruct the agent in chat to land the latest build in a different filename
6. Project .md remains the sole authority for plan, open tasks/backlog, and bug tracking

**Scope (out)**
- Renaming the main file from the UI; per-tab filenames; multi-file projects

**Build gates (verify on a real phone)**
- Dashboard opens as a right panel
- Soft-delete a project → appears in the bin above the Dashboard card; chevron collapses/expands; Restore brings it back; Delete permanently opens the confirm modal; cancel keeps it, confirm removes it
- Tapping a project card opens its first tab automatically
- "+" creates a tab on the project main file with no prompt
- Existing behaviors (chat, build loop, engines, thread recycle bin) unchanged

**Backlog** — TBD

## R2 — Run continuity and conflict safety
**Scope (in)**
1. Require a readable master plan before inference; show a recoverable error when it is missing
2. Serialize runs per thread while keeping newly sent messages visible and queued
3. Reject stale GitHub writes instead of retrying replacement content against a new SHA
4. Show provider/model fallback during a run and record the provider/model that actually answered
5. Show the current objective and next step near the conversation
6. Verify plan updates before code writes when a request changes the plan

**Build gates**
- Send two messages during one run: second stays queued and runs only after the first finishes or is stopped
- Missing plan: no code write; clear error and retry after restoring the plan
- Concurrent plan/thread edit: no silent overwrite
- Provider fallback: visible in progress and final reply, with actual model recorded
- New objective: saved plan can be read back before code changes

## R3 — Coach mode
**Scope (in)**
- Per-project Coach mode switch on the project card, persisted in project state
- Existing projects remain in their current detailed mode; new projects offer Coach mode at creation
- Coach mode uses plain language in chat, gives one useful next suggestion, and keeps technical controls out of the main conversation
- Project plan, objective, run queue, conflict guards, and model fallback continue to work in both modes

**Build gates**
- Toggle Coach mode, refresh, and confirm the choice persists
- Switch between projects and confirm each keeps its own choice
- Coach conversation shows a playable link after a build and a gentle next step without requiring a stage approval
- Detailed mode retains engine, web, plan, and diagnostic access
- Switching modes leaves thread messages and master plan unchanged

## R4 — Suggested task buttons
**Scope (in)**
- Show a small set of suggested next actions above the composer in both Coach and detailed modes
- Change suggestions for errors, queued work, early projects, and established projects
- Use plain student-friendly labels in Coach mode and plan/testing labels in detailed mode
- A tap sends the selected request through the normal chat queue so it appears immediately and remains interruptible

**Build gates**
- Coach and detailed modes each show useful, distinct suggestions
- Error and queued states show recovery-oriented choices
- Tapping a suggestion creates a normal visible user message and starts or queues it once
- Suggestions remain usable on narrow mobile layouts and do not hide the composer
- Existing typed drafts are not overwritten without confirmation

## 3. FUTURE IDEAS
- In-chat retargeting of build output filename ("land this in X.html")
- TBD

## 4. IMMUTABLE WORKING RULES
1. Mobile-first
2. All diagnostics in-app, never console-only
3. Update-plan-before-code; append a ledger row every run
4. Read-back verification after every push
5. No stubs or fake data
6. One file write per response
7. NEVER emit SEARCH/REPLACE patch blocks for this plan file — plan writes are always full-file markdown (learned from the 2026-09-20 corruption)
8. Chat history loses to this plan

## 5. DECISION LOG
- **2026-09-20** — Dashboard must live on the right panel again (regression in the latest update)
- **2026-09-20** — Soft-delete UX: chevron-collapsible bin above the Dashboard card holding soft-deleted projects, each with Restore / Delete permanently; permanent delete requires an "Are you sure?" modal
- **2026-09-20** — Workflow: selecting a project auto-opens its first tab; new tabs are created without a filename prompt and default to the project's main file; filename is set only at project creation (single authority); user can instruct the system to land a build in a different filename
- **2026-09-20** — The project .md is the sole authority for plan, open tasks/backlog, and bug tracking
- **2026-09-20** — Build starts on R1
- **2026-09-20** — Plan file found corrupted; reconstructed; working rule #7 added

## 6. BUG TRACKER
- Open: none logged
- Resolved: 2026-09-20 — plan file overwritten with literal patch blocks by a malfunctioning run → process guard added (rule #7)

## 7. APPENDIX
- Authority order: this plan > all else; chat history loses to the plan
- This plan is the only memory that persists between runs