# devstream-backlog.md — Governance & Source of Truth

App: `devstream.html` — standalone multi-thread orchestrator. NOT a session-manager version; borrows the v2.9.2 UI shell patterns only. Own lineage starting v1.0.

Deploy target: `https://acmeproducts.github.io/stuff/devstream.html`
Test target: `https://acmeproducts.github.io/stuff/devstream-test.html`

## Status
- Current release: v1.0 b48 on devstream-test.html (2026-09-27)
- Stage: TEST (b48)

## Release Rules (inherited, proven)
1. Mobile-first. All diagnostics in-app. No DevTools ever.
2. Read-back verification gate before closing any release: byte-compare via raw.githubusercontent.com with cache-busting param.
3. GitHub Contents API returns EMPTY content (not an error) for files >1MB. Always fall back to `Accept: application/vnd.github.raw+json`.
4. Read blob SHA before every PUT.
5. Pages build: check `/pages/builds/latest`, allow 60-90s after commit.
6. Build to devstream-test.html; promote to devstream.html only on explicit owner "ship".

---

# Spec v1.0 (r2) — APPROVED 2026-08-14

## Core model (simplest terms)
- **Project** = user-defined label (left drawer).
- **Thread** = tab. Has an **output filename** (= tab name) and optionally an **input filename** (existing codebase) or just an idea.
- **Loop** = idea/feedback in chat -> agent builds -> pushes code -> returns test URL -> you test -> more feedback in same thread. State resumable from any device.

## 1. Configuration (gear)
PAT, default repo, default branch — gg.html pattern. Per-thread repo override at creation only.

## 2. Thread creation
Tap + (new tab):
1. **Output filename** — type new name, or omni-search existing repo files (gg.html pattern). If blank, prompt before first send.
2. **Input filename (optional)** — omni-search existing file as starting codebase. Blank = new idea from scratch.
3. **Prompt** — the idea. Then it's just chat.
- Output filename re-specifiable in chat ("output to xyz.html"); tab renames, subsequent pushes go there.

## 3. Thread loop
- Every chat message = instruction against the thread's output file.
- Agent per message: read thread state from GitHub -> build -> commit -> read-back verify -> reply with commit SHA + cache-busted test URL.
- No intermediate workflow stages exposed. Every turn ends in pushed code + URL, or an error surfaced in-app.

## 4. Memory / persistence (DECIDED)
All state in GitHub — kanban.html storage + sync methodology. Nothing app-critical on OpenClaw or in browser storage.
- `devstream/threads/<project>__<output-file>.json` — chat history + metadata (input file, repo, created, output renames).
- `devstream/devstream-status.json` — status SOT. Keep lean; raw media-type fallback on read.
- Agent is stateless: reads thread file, executes, writes results. Any device resumable; agent machine rebuildable with zero loss.

## 5. Status SOT schema
```json
{
  "threads": {
    "<project>/<output-file>": {
      "project": "", "file": "", "repo": "",
      "state": "idle | executing | ok | error",
      "startedAt": "ISO", "finishedAt": "ISO",
      "lastCommit": "sha", "testUrl": "",
      "error": "agent error text, empty if ok"
    }
  },
  "projects": {
    "<project>": { "notes": "free text", "lastTouched": "ISO" }
  }
}
```
Agent writes `executing` at run start, final state at end. App is read-only consumer of thread states; app writes project notes.

## 6. Dashboard card (the orchestrator)
- Pinned first in drawer; cannot move/delete. Face badge: executing count + error count.
- Tap -> full-screen panel:
  - Per project: label, last touched, active thread count, editable notes (saved to SOT).
  - Per thread row: project, output file, state icon, last executed (relative), error text inline (expandable).
  - Tap row -> navigate to that project + tab (drawer closes, tab armed).
  - Sort: last executed, state, project, filename. Filter: state, project, repo.
  - Pull-to-refresh; auto-refresh 30s while panel open and anything executing.

## 7. Mobile-first constraints
48px touch targets; panels stack below ribbon full-width; no side popovers; gesture semantics per v2.9.2 shell (double-tap menu below tab, document-level pointer tracking).

## 8. Out of scope v1.0
Cross-repo status aggregation; push notifications.

Parallel-run limits / file-lock queueing were removed from out-of-scope by the owner on 2026-09-24 and are governed by the project scheduler contract below.

---

# 2026-09-24 — Project storage, recovery, and scheduler contract

## Owner scope
1. CONFIG exposes one subdirectory for project code and plan files.
2. Soft-deleted projects live under a collapsible **Deleted projects** chevron at the top of the project rail. Each deleted project card offers **Restore** or **Delete permanently**; permanent deletion requires an explicit “Are you sure?” confirmation.
3. A project with no live tabs still shows **+** to create a tab. If deleted tabs exist, it also shows **↻** to restore the most recently deleted tab.
4. Tasks may stack/queue inside each project. A project has at most one active writer at a time; different projects may execute in parallel through the existing four-worker pool.

## Baseline score before change
| Gate | Before | Required after |
|---|---:|---:|
| Configurable project code/plan directory | 0 | 1 |
| Deleted-project recovery in project rail | 0 | 1 |
| Blank-project deleted-tab restore affordance | 0 | 1 |
| Per-project serialization with cross-project parallelism | 0 | 1 |

The prior worker pool already supported four concurrent thread jobs, but it treated threads as the concurrency boundary. Two tabs from one project could therefore write the same project code/plan concurrently. The new concurrency boundary is the project.

## Acceptance gates
- **DS-G34-1 Storage:** Settings contains **Project code + plan subdirectory**. New generated project files and their same-name plans land under that directory. Existing projects are not moved.
- **DS-G34-2 Deleted projects:** deleting a project moves it out of the live project list and into the collapsible rail recovery section; Restore returns it; Delete permanently shows the irreversible confirmation before deleting thread-history records. Project code/plan files remain untouched.
- **DS-G34-3 Blank project:** after all tabs are soft-deleted, the tab strip remains visible with **+** and **↻**. **↻** restores the most recently deleted tab.
- **DS-G34-4 Project queue:** while one task for Project A is active, later tasks for Project A queue FIFO instead of starting a second writer. Project B/C/D tasks may use the remaining worker slots concurrently. Global worker ceiling remains four.
- **DS-G34-5 Preservation:** provider configuration, per-thread engine/model selection, plan continuity, attachments, web search, Coach mode, debug, soft-deleted tabs, and the existing four-worker engine pool remain intact.

## Graveyard additions
- **G-DS-01 — Parallel writers inside one project:** do not restore thread-level concurrency that allows two tabs in the same project to write the same code/plan simultaneously.
- **G-DS-02 — Hard-coded `projects/` creation root:** do not hard-code the project artifact root; new generated project artifacts use the configured subdirectory.
- **G-DS-03 — Hiding the tab strip when a project is blank:** do not hide the only recovery/create controls when all tabs are deleted.

---

# 2026-09-27 — Automatic internet access + Session Manager tab drag/drop

## Owner scope
1. Internet/web access is enabled automatically; the owner does not have to enable it tab-by-tab.
2. Restore the Session Manager v3 tab drag/drop behavior: reorder tabs within a project and move tabs between projects, including the touch/pen long-press interaction.

## Reference behavior
`session-manager-v3.html` is the interaction reference: desktop HTML5 drag/drop, project rows as cross-project drop targets, positional tab drop zones, and long-press touch/pen drag with sidebar reveal at the left edge.

## Baseline score before change
| Gate | Before | Required after |
|---|---:|---:|
| Existing undefined + new threads default web ON | 0 | 1 |
| Persisted within-project tab reorder | 0 | 1 |
| Cross-project tab drag/drop | 0 | 1 |
| Touch/pen long-press drag | 0 | 1 |

## Acceptance gates
- **DS-G35-1 Web default:** any existing thread with no explicit web setting behaves as web ON; every newly created project/tab stores `web:true`. An explicit manual OFF remains respected.
- **DS-G35-2 Within project:** dragging a live tab to a positional drop zone changes and persists that project's tab order in the SOT.
- **DS-G35-3 Between projects:** dragging a non-busy tab onto another live project moves the tab and its chat history, retargets its code/plan to the destination project, updates SOT/order, and retires the old thread record. A tab with active/queued work is not movable across projects.
- **DS-G35-4 Touch parity:** touch/pen long-press arms tab drag; movement can reveal the mobile sidebar at the left edge; dropping on a project or tab position performs the same operation as desktop.
- **DS-G35-5 Preservation:** b34 configurable project directory, deleted-project recovery, blank-project +/↻ recovery, one-writer-per-project queue, four-worker cross-project parallelism, provider/model settings, attachments, Coach mode, debug, and manual web toggle remain intact.

## Graveyard additions
- **G-DS-04 — Opt-in web as the default:** do not make ordinary Devstream work require the owner to turn web access on for each tab.
- **G-DS-05 — Thread-only drag without touch parity:** do not restore desktop-only drag/drop; Session Manager v3 touch/pen behavior is part of the requirement.
- **G-DS-06 — Moving an active/queued writer across projects:** do not allow a move that can bypass the project concurrency boundary.

---

# 2026-09-27 — Session Manager v3 interaction parity correction

## Owner report
The b35 drag/drop implementation did not work on the owner's Android device. The required reference is the actual `session-manager-v3.html` interaction model, not merely a partial tab-move implementation.

## Required parity
- Tabs: drag/reorder inside a project; drag to another project; long-press menu with **Rename, Assign, Customize, Download, Share**.
- Projects: reorderable; long-press menu with **Rename, Customize, Download, Share**.
- Touch: movement after the drag arm begins drag; a stationary long-press opens the context menu.
- Customization persists in SOT. Downloads are browser downloads. Share uses Web Share with clipboard fallback.
- Existing web-default-ON and b34 scheduler/storage/recovery behavior remain unchanged.

## Acceptance gates
- **DS-G36-1 Tab DnD:** touch/pen drag reorders tabs and can assign a tab to a project; desktop HTML5 DnD remains.
- **DS-G36-2 Tab menu:** stationary long-press exposes Rename / Assign / Customize / Download / Share.
- **DS-G36-3 Project DnD:** project cards are reorderable and order persists in SOT.
- **DS-G36-4 Project menu:** stationary long-press exposes Rename / Customize / Download / Share.
- **DS-G36-5 Preservation:** internet defaults ON, project queue safety, four-project worker pool, soft-delete recovery, configurable storage, provider/model controls, attachments and Coach mode remain intact.

## Graveyard additions
- **G-DS-07 — Hold-to-drag only:** stationary long-press opens the action menu; movement is drag.
- **G-DS-08 — Partial Session Manager parity:** do not ship tab movement without the owner-specified tab/project menus and project ordering.

---

# 2026-09-27 — Literal Session Manager v3 interaction transplant

## Owner report
b36 was rejected. Its context menu was a homemade approximation: customization asked for CSS strings through browser prompts, and Android drag/drop still did not work. The owner requires a lift-and-shift of the proven Session Manager v3 interaction, not another redesign.

## Change
- Replaced the b36 menu implementation with the Session Manager v3 two-pane/stacked context menu structure and controls.
- Customize now uses native color pickers and numeric font-size controls exactly like Session Manager v3; no CSS-value prompts.
- Replaced touch tab DnD with the Session Manager v3 gesture state machine: 350ms hold, 220ms movement arm, 12px slop, drag ghost, positional drop zones, left-edge sidebar reveal, and double-tap context menu.
- Replaced project touch reorder with the Session Manager v3 project gesture state machine and before/after targets.
- Native desktop project DnD now uses Session Manager v3 before/after semantics.
- Devstream persistence/build semantics are retained behind those transplanted interactions.

## Acceptance
- **DS-G37-1 Menu visual/interaction parity:** tab and project menus use the Session Manager v3 main/leaf layout; Customize exposes color controls and font size directly.
- **DS-G37-2 Tab touch DnD parity:** source gesture constants and state machine are present and drop through the existing Devstream move/reorder functions.
- **DS-G37-3 Project touch DnD parity:** source project gesture constants/state machine and before/after target behavior are present.
- **DS-G37-4 No browser prompt customization:** customization contains no `prompt()` calls.
- **DS-G37-5 Preservation:** web default ON, queue safety, four-project worker pool, recovery, storage config, providers, attachments and Coach mode are unchanged.

## Graveyard
- **G-DS-09 — Homemade context menu/customizer:** rejected. Do not replace the Session Manager v3 menu with prompt-based or visually simplified substitutes.
- **G-DS-10 — Custom touch DnD semantics:** rejected. Use the proven Session Manager v3 touch gesture state machine.

---

# 2026-09-27 — Automatic thread-write reconciliation

## Owner report
Devstream surfaced a thread-file write conflict after another write landed first. Compatible thread races must reconcile automatically rather than requiring the owner to refresh and retry.

## Cause
`putFileSafe()` serialized writes inside one browser instance but treated a newer GitHub SHA from another writer as fatal, even for append-oriented thread conversation data.

## Change
- Thread writes merge remote and local messages by the existing message signature, retain chronological order, and save against the current SHA.
- A GitHub 409 on a thread write refetches, merges, and retries up to three attempts.
- Non-thread files retain strict stale-SHA conflict protection.
- Reconciliation uses the existing in-app Debug log.

## Acceptance
- **DS-G38-1:** stale thread SHA triggers reconciliation instead of an immediate refresh/review error.
- **DS-G38-2:** remote-only and local-only messages both survive.
- **DS-G38-3:** duplicate messages are deduplicated through `msgSig()`.
- **DS-G38-4:** 409 thread races retry at most three times.
- **DS-G38-5:** non-thread stale writes still fail closed.
- **DS-G38-6:** b37 menus/DnD and existing scheduler/web/storage behavior remain unchanged.

---

# 2026-09-27 — Donor-exact mobile gesture correction

## Owner-verified donor behavior
Screenshots and Session Manager v3 source establish the interaction contract:
- **Context menu:** double-tap a tab/project. It is not a hold gesture.
- **Drag:** tap-and-hold. At 350ms the dragged tab/project name appears immediately in a floating ghost.
- **Landing feedback:** the destination project or tab insertion zone highlights while dragging.
- **Drop:** release on the highlighted destination to persist the move/reorder.
- **Menu appearance:** use Session Manager v3 context-menu CSS and hierarchy without Devstream legacy button overrides.

## b39 defect
b39 incorrectly changed stationary hold into context-menu activation. Devstream also retained old `#tabContext button` CSS that overrode the transplanted donor menu, causing the visible separators/sizing shown in the owner's screenshot.

## b40 change
- Restored the donor tab gesture state machine: 350ms hold enters drag and creates the named ghost; double-tap opens context.
- Restored the donor project gesture state machine with the same hold-to-drag / double-tap-menu split.
- Preserved donor target highlighting for project destinations and tab insertion zones.
- Removed the legacy Devstream `#tabContext button` rules that were overriding donor menu styling.
- Restored the donor portrait `.tabContext.stacked` rule.
- Preserved b38 automatic write reconciliation and all queue/storage/web/provider behavior.

## Acceptance
- **DS-G40-1:** no hold-to-context path exists for tabs or projects.
- **DS-G40-2:** 350ms hold creates a visible ghost containing the tab/project name.
- **DS-G40-3:** double-tap opens tab/project context.
- **DS-G40-4:** drag hover highlights project target or tab insertion zone.
- **DS-G40-5:** legacy `#tabContext button` override is absent; donor context classes control appearance.
- **DS-G40-6:** existing persisted move/reorder and b38 reconciliation remain intact.

## Graveyard
- **G-DS-13 — Hold opens context menu:** rejected; donor behavior is double-tap context, hold-to-drag.
- **G-DS-14 — Legacy generic #tabContext button styling:** rejected; it corrupts the donor context-menu appearance.

---

# 2026-09-28 — b48 message removal + completed tab outcomes

- Owner device result: b47 dragging works; slight lag remains.
- Every rendered message bubble has ×; confirmation permanently removes that message from the thread JSON and writes the cleaned JSON. This supports removing an accidentally entered secret that GitHub secret protection rejects.
- Cross-project tab drop now opens the destination project and moved tab regardless of which tab was active before the move.
- + New tab naming uses an in-app modal instead of browser prompt; created tab is inserted first and opened.
- b46/b47 touch activation and target-footprint path retained.

---

# 2026-09-28 — b47 chain step 2: target footprint

- Owner validated b46 hold activation: PASS.
- Preserve b46 activation unchanged.
- While moving an armed tab, a valid tab insertion zone or project target now receives an explicit high-visibility footprint.
- Drop/persistence/repaint logic is unchanged and remains the next gate.

---

# 2026-09-27 — b46 tab hold activation gate

- Owner device result: b45 never enters drag; the named hold bubble never appears.
- Scope narrowed to the first chain link only: tab tap-and-hold activation.
- The scrollable Devstream tab ribbon now listens directly to touchstart/touchend; a stationary 350ms hold creates the existing named drag bubble. Horizontal tab scrolling remains native via `touch-action:pan-x`.
- Target, drop, persistence and repaint code remain in place but are not claimed validated until this activation gate passes.

---

# 2026-09-27 — b45 Devstream-specific drag geometry

- Owner confirmed b44 Rename/Enter works; drag/drop does not.
- Devstream has an extra main ribbon above its tab strip and a mobile overlay sidebar; drag destination resolution is now based on viewport rectangles rather than `elementFromPoint()` painted hit-testing.
- Once HOLD arms drag, the gesture explicitly disables browser touch/overscroll takeover until release. Before arming, ordinary scrolling remains available.
- b44 rename fix and b38 conflict reconciliation retained.

---

# 2026-09-27 — b44 failed-device-test corrections

## Exact failures corrected
- **Rename Enter:** project rename could throw before persistence because `isThreadBusyForMove()` still referenced scheduler symbols removed by the b34 rollback. The predicate now uses only structures that exist in the target baseline. Rename inputs also accept Android Enter by `key`, `code`, or keyCode 13 and stop propagation.
- **Drag:** b43 departed from the donor by cancelling any movement before the stationary 350ms hold completed. The donor has a second 220ms movement-arm threshold. b44 restores that donor behavior: movement before 220ms remains scroll/cancel; movement after 220ms enters drag; a stationary 350ms hold also enters drag.

## Device gate
Re-test project/tab Rename → Enter, project hold/drag/reorder, tab hold/drag/reorder, and tab hold/drag to another project.

---

# 2026-09-27 — b43 planned gesture arbiter

## Implementation
- Implemented `DEVSTREAM-DONOR-INTERACTION-PLAN.md` as one interaction-state change rather than another donor-code transplant.
- Touch project/tab first tap is now pending for the 350ms double-tap decision window instead of navigating immediately.
- Same-target second tap cancels pending navigation and opens donor-shaped context.
- 350ms hold cancels pending navigation and enters drag with the visible item name as ghost.
- Movement before hold is treated as scroll/cancel, not navigation.
- Dedicated tab-close and project controls are excluded from gesture arbitration.
- Mouse/desktop click and native drag paths remain separate.
- Existing b38 write-conflict reconciliation is retained.

## Required device gate
1. Single tap project opens once after the short decision delay.
2. Double tap project opens context without loading project between taps.
3. Hold project produces named ghost; target highlights; release persists reorder.
4. Single tap tab opens once after the short decision delay.
5. Double tap tab opens context without loading thread between taps.
6. Hold tab produces named ghost; insertion/project target highlights; release persists reorder/move.
7. Close/delete/coach/plan controls remain independent.

---

# 2026-09-27 — b42 gesture initialization correction

## Root cause
b41 invoked `bindProjectTouchDnD()` before authenticated boot/render. At that moment `#projList` did not yet exist because the app shell is created by `renderShell()`. The binder returned and was never retried. This disabled the project gesture system. Gesture binding now occurs only after successful SOT load and the first `renderSidebar()/renderTabs()`, when both interaction surfaces exist.

## Acceptance
- **DS-G42-1:** no project/tab gesture binder runs before boot.
- **DS-G42-2:** first successful application render is followed by both gesture binders.
- **DS-G42-3:** donor double-tap context and hold-drag mechanics remain unchanged.
- **DS-G42-4:** JavaScript parses after the initialization correction.

---

# 2026-09-27 — Clean rollback + donor-only interaction port

## Owner directive
The prior drag/drop attempts are rejected. Return to the last pre-drag baseline, b34 (`fa2cafc4a30f7952e66681caa4097da4fcc39b4c`), retain the later automatic thread-write reconciliation, then port the working Session Manager v3 mobile interaction without redesigning it.

## Construction
- Application baseline is b34, not b40.
- Retained only the b38 thread-file reconciliation/retry behavior needed to prevent the `another write landed first` failure.
- Ported Session Manager v3 tab gesture contract: 350ms hold creates the named drag ghost; movement highlights a project or tab insertion target; release drops; double-tap opens context.
- Ported Session Manager v3 project gesture contract: 350ms hold creates the named project ghost; before/after destination highlights; release reorders; double-tap opens context.
- Ported donor context-menu hierarchy and visual CSS; no generic legacy `#tabContext button` override.
- Tab/project ordering is persisted in Devstream SOT; cross-project tab moves persist the thread record in its destination.
- Existing undefined web state defaults ON.

## Root-cause correction
The previous project touch implementation bound to a nonexistent `#projectList`. Devstream's actual sidebar list is `#projList`, so the handler never attached. b41 binds the donor project gesture handler to the actual Devstream list.

## Acceptance
- **DS-G41-1:** source baseline is b34 plus the explicitly listed reconciliation and donor interaction additions.
- **DS-G41-2:** project mobile gesture handler binds to existing `#projList`.
- **DS-G41-3:** tab/project hold enters drag and immediately creates a ghost containing the visible name.
- **DS-G41-4:** tab/project double-tap opens donor context; hold does not open context.
- **DS-G41-5:** project and tab landing targets visibly highlight and release persists reorder/move.
- **DS-G41-6:** donor context menu structure/CSS is used without legacy Devstream button overrides.
- **DS-G41-7:** thread write conflicts reconcile/retry automatically as in b38.
- **DS-G41-8:** JavaScript parses successfully after the rollback/re-port.

## Graveyard
- **G-DS-15 — b35 through b40 interaction implementations:** rejected as the basis for further patching. Do not incrementally repair them; rebuild interaction from b34 + donor.
- **G-DS-16 — `#projectList` Devstream binding:** invalid selector. Devstream sidebar is `#projList`.

---

# Backlog
| ID | Item | Status |
|---|---|---|
| DS-1 | Build v1.0 per spec above | OPEN |

# Decision Log
- 2026-09-27: b36 rejected. Owner requires literal lift-and-shift of Session Manager v3 drag/drop and context menus for tabs and projects; no homemade prompt-based customization.
- 2026-09-27: b35 rejected on Android because drag/drop did not work and Session Manager v3 parity was incomplete. b36 copies the interaction contract: tab and project drag/reorder plus long-press action menus.
- 2026-09-27: Internet/web access defaults ON for existing undefined and new Devstream threads. Session Manager v3 is the reference for tab drag/drop: reorder within project, move between projects, desktop plus touch/pen long-press. Cross-project moves are blocked while the tab has active/queued work so the one-writer-per-project rule remains authoritative. Owner directive.
- 2026-09-24: Project artifact subdirectory is configurable; existing projects keep their paths. Project is the concurrency boundary: one active writer per project, FIFO queued work within a project, up to four projects concurrently. Deleted projects recover from the project rail; blank projects retain + and ↻ recovery controls. Owner directive.
- 2026-08-25: Project lifecycle phases adopted: Define (what/why) -> Design (how) -> Build (execution cycles) -> Ship. Phase is project-level state (badge + explicit advance), not tabs. Agent prompt is phase-aware. Owner approved.
- 2026-08-25: Continuity contract: agent replies MUST carry a STATE line (phase | open items | next step) and append a dated ledger row to the plan on every plan write. The plan is the sole persistent memory; chat is commentary. Owner approved.
- 2026-08-25: Execution is a 4-worker blob pool (concurrent builds, UI never blocked). Per-thread provider+model with validate-before-apply. Keys localStorage-only with reveal toggle + sanitation (autofill mangling was a confirmed field defect).
- 2026-08-14: App named devstream.html; standalone, not a session-manager version. Owner directive.
- 2026-08-14: Memory resides in GitHub (kanban.html methodology), not OpenClaw. Owner recommendation, confirmed — IndexedDB browser isolation is a proven limitation.
- 2026-08-14: Thread = output file (tab name) + optional input file. Owner directive.
- 2026-08-14: SUPERSEDED same day — runner removed from the critical path by owner ruling ("no extra moving part"). All engines run browser-direct in-app: venice (DEFAULT), openrouter, anthropic-direct. devstream-runner.py stays parked in the repo (thread-file contract is engine-agnostic; a runner can return later without app changes). Known trade-off accepted: builds die if the browser tab is suspended; ▶ re-runs pending work. Venice browser CORS is THEORY until first live call.
- 2026-08-14: Project cards carry a plan/status doc link (planFile in SOT projects), following the master-doc standard (talkbridge-master.md pattern).
