# ProjectChat / Session Manager — Turnover Brief

**Date:** 2026-08-12  
**Primary application:** `session-manager-v3.html`  
**Governance:** `session-manager-backlog.md`  
**Repository:** `acmeproducts/stuff`  
**Owner/device gate:** Confi

## 1. Read this before touching code

The current `main/session-manager-v3.html` is a **FAILED candidate**. It visibly identifies as v2.8.1 and the page loads, but owner testing on 2026-08-12 proved the application is functionally inert: top-ribbon controls do nothing and tapping a session does nothing. Treat that as a startup/runtime JavaScript failure until instrumentation proves otherwise. Do not patch this failed candidate forward.

The recovery instruction is explicit:

1. restore the exact last owner-proven working ProjectChat build;
2. verify that restored build is the actual input;
3. reapply only the scoped v2.8.x interaction changes;
4. lint/syntax-check **all JavaScript extracted from the complete self-contained HTML**;
5. run structural/source assertions and regression checks;
6. publish only after every static gate passes;
7. read the published source back;
8. give the owner the GitHub Pages URL for the physical-device gate.

Rollback is the beginning of the rebuild, not the deliverable.

## 2. Known lineage and artifacts

### Live / governance
- `session-manager-v3.html` — single-file deployable application. Must remain readable literal HTML with inline CSS/JS.
- `session-manager-backlog.md` — release plan, backlog, graveyard, decisions, lessons; source of truth for this project.
- `session-manager-sot.json` — intended cross-device ProjectChat portable-state journal when present/configured. Never contains PATs, Gateway credentials/private keys, provider credentials, or transcripts.

### Historical / diagnostic
- `session-manager-v2.2.1-rename-test.html` — historical rename/auth test artifact; not a production baseline.
- `.release-backups/session-manager-v250/session-manager-v3.v240.html`
- `.release-backups/session-manager-v260/session-manager-v3.v250.html`
- `.release-backups/session-manager-v270/session-manager-v3.v260.html`
- `.release-backups/session-manager-v250/session-manager-backlog.pre-v190.md`
- `.release-backups/session-manager-v260/session-manager-backlog.pre-v110.md`
- `.release-backups/session-manager-v270/session-manager-backlog.pre-v111.md`

### Related governance exemplars
- `talkbridge/TALKBRIDGE-PLAN-v9.md` — important process precedent: exact baselines, graveyard vetoes, rebuild rather than patch-forward after failure, mechanical gates, verify rather than infer, owner hardware gate.
- `talkbridge/THE-METHOD.md` if present — companion method/process reference.
- `talkbridge/HANDOVER.md` — prior handover pattern/reference.

### Known ProjectChat baseline immediately before the failed v2.8.x attempt
- rollback commit used in this effort: `9b3bdb362c47b9ffede5b6a5271e27a1f95f988f`.
- this was treated as the restored v2.7.1 working line before v2.8.x was reapplied.
- Do not trust the version label alone. Fetch the commit/file, inspect it, and use owner evidence plus repository history to confirm the exact baseline before rebuilding.

### Failed candidate evidence
- v2.8.0 was owner-tested and failed: page loaded/version visible but core behavior regressed.
- v2.8.1 was then published and owner-tested on 2026-08-12: page loads, but top ribbon and session taps are inert. **FAIL.**
- The v2.8.1 failure means the candidate is not a baseline regardless of successful GitHub/Pages deployment.

## 3. Current requested release scope

Rebuild these changes from the last known-good ProjectChat input, not from failed v2.8.1:

1. **Tab hover:** mouse/hover over a tab shows the complete tab/session text.
2. **Tab dragging vs attachment overlay:** dragging a ProjectChat tab must never invoke the generic right-pane file/attachment drop overlay. Tabs and their orange drop targets must remain visible throughout a tab drag.
3. **Horizontal tab reorder:** use the dedicated tab drag handle. Target tab gets an orange outline/indicator and the dragged tab inserts immediately to the **left** of that target. This deliberately prioritizes moving tabs toward the far left.
4. **Cross-project drag:** if the left pane is closed, dragging toward it opens it. A target Project highlights with an orange outline. Dropping moves, never copies, the session into position 1 of the target Project. Origin Project remains the active/focused Project.
5. **Project chevrons:** every Project has a chevron that expands/collapses its sessions in the left pane.
6. **Left-side session focus:** tapping/clicking a session under an expanded Project displays **only that session** in the right pane. Clicking the Project row returns to the normal Project tab set.
7. **ProjectChat preset/layout:** adjust the preset/layout so the Configuration gear fits comfortably and remains legible/tappable. Accessibility is functional scope.
8. **Context-menu gesture:** desktop right-click and mobile **double-tap** open the same tab context menu. Long-press was abandoned because it conflicts with drag/drop.
9. **Context-menu placement:** menu MUST open directly **below the tab**, never to its right.
10. **Context-menu dismissal:** tapping/clicking anywhere outside the menu closes it.
11. **Rename leaf:** Enter commits the rename through the governed OpenClaw session rename path. No Save button. Menu closes after success; origin Project remains focused.
12. **Assign leaf:** omnisearch supports partial match, `*` wildcard, and `-negative` selection. Tap an existing Project to move the session and close the menu while retaining origin Project focus. Enter on a non-existing name creates that Project, moves the session, closes the menu, and retains origin Project focus.
13. **Customize leaf:** tab background, font color, and font size update **live** and persist. There is **no Save button**. Tap/click outside closes the menu. Reset may remain.
14. **Tab sequencing:** drag/drop rearrangement within a Project persists locally and through the GitHub SOT when configured.
15. **Mobile-first:** drag handle, double-tap menu, outside-tap dismissal, Project drop targets, and tab reordering must be designed for phone and tablet touch interaction, not merely desktop mouse behavior.

## 4. Existing governed behavior that must not regress

- OpenClaw Gateway connection/auth/device identity.
- session listing and history loading.
- chat send/round trip and active-run Stop via Gateway.
- session rename persistence through OpenClaw / official Control UI.
- transcript rendering automatically handles Markdown and sanitized safe HTML.
- transcript/message Copy; session Download and Share.
- attachments.
- activity state Ready / Working / Error.
- soft delete and Recycle Bin semantics.
- permanent delete uses OpenClaw lifecycle semantics; never manually delete transcript files.
- `.jsonl.jsonl` is surfaced as a diagnostics anomaly, not automatically repaired.
- Debug stays behind Configuration.
- appearance/accessibility controls, including independent code/path surfaces and contrast protection.
- custom themes save/export/import.
- ProjectChat hierarchy: Client → Projects → OpenClaw session tabs.
- session disposition invariant: Assigned, Unassigned, Missing, or Soft Deleted — never invisible.
- recovered Missing sessions return to Unassigned with provenance, not silently to their old Project.
- Project deletion moves sessions to Unassigned rather than deleting them.
- cross-device portable state uses a GitHub append-only/SHA-guarded event journal; never blind overwrite.

## 5. Release gates — mandatory, in order

### Gate A — exact input
- identify exact known-good commit and blob;
- fetch it immediately before work;
- confirm expected visible/build version and protected connection markers;
- do not start from current failed v2.8.1.

### Gate B — scoped source change
- modify only `session-manager-v3.html` for application behavior;
- no new runtime component, worker, daemon, proxy, deployment architecture, encoded wrapper, or generated patch workflow;
- preserve self-contained single-file HTML;
- no broad rewrite of working connection/bootstrap code.

### Gate C — JavaScript syntax/lint
Before any publication:
- extract **every executable inline `<script>` block** from the final complete HTML;
- run `node --check` (or stricter equivalent) on every extracted block;
- any syntax failure is a hard stop;
- additionally scan for malformed template literals/quotes introduced by source replacement;
- lint/check the **final assembled artifact**, not merely a patch fragment.

### Gate D — structural assertions
Mechanically assert that:
- required element IDs referenced by startup/navigation exist;
- the main bootstrap path still executes/is registered;
- menu/sidebar/session click handlers are installed;
- context menu has no Customize Save control;
- context root allows outside-click/tap handling;
- tab drag cannot trigger the attachment overlay;
- orange tab and Project drop-target styles exist;
- Project chevron/session-child structures exist;
- visible/build version is internally consistent.

### Gate E — regression smoke before owner handoff
At minimum exercise or instrument:
- app bootstrap reaches ready state;
- hamburger/sidebar expands/collapses;
- top ribbon buttons respond;
- sessions render;
- tapping a session changes the active session;
- Project selection and nested-session focus work;
- context menu opens and dismisses;
- no uncaught startup exception.

Static checks do not replace owner testing, but an inert UI must never reach the owner again because a syntax/startup failure should be caught here.

### Gate F — publish
- use the approved direct existing-file update route only;
- fetch fresh SHA immediately before the write;
- update `session-manager-v3.html` on `main`;
- do **not** create a GitHub Actions workflow to patch application source;
- do not create a throwaway release branch as the owner's test surface;
- GitHub Pages `main` is the test surface.

### Gate G — read-back and handoff
- fetch `main/session-manager-v3.html` after write;
- verify expected blob/version/required markers;
- verify Pages deployment/status when available;
- hand owner the directly testable Pages URL, cache-busted by version/query if useful.

## 6. Graveyard additions from the v2.8.x failure

### G-034 — Release a candidate whose complete assembled JavaScript was not syntax-checked
**Buried 2026-08-12.** Patch-fragment confidence is irrelevant. The final self-contained HTML must have every executable script extracted and syntax/lint checked before publication.

### G-035 — Treat rollback as the completed response to a failed release
**Buried 2026-08-12.** Owner instruction is rollback → rebuild from clean input → validate → publish a new test candidate. Do not stop after restoring service unless an actual external blocker prevents further work.

### G-036 — Give the owner a source branch/blob page as a test handoff
**Buried 2026-08-12.** The owner is the tester, not the deployer. A release handoff must provide the directly runnable GitHub Pages URL after the candidate is on the governed test surface.

### G-037 — Use a GitHub Actions workflow as a source-code patch mechanism
**Buried 2026-08-12.** It caused workflow noise/alerts and violated the established deployment discipline. Application changes use the approved direct patch/update of the existing source file. Normal Pages deployment may react to a commit; it must not be repurposed to manufacture the application patch.

### G-038 — Narrate intended work instead of completing the release pipeline
**Buried 2026-08-12.** Once scope is complete, continue autonomously through rollback/rebuild/static gates/publish/read-back. Do not require the owner to say “go” between mechanical stages.

### G-039 — Patch-forward from an owner-failed v2.8.x candidate
**Buried 2026-08-12.** v2.8.0 and v2.8.1 are failed evidence/donors only. Rebuild the requested behavior from the exact last known-good ProjectChat input.

### G-040 — Let tab drag enter the generic attachment drop surface
**Buried 2026-08-12.** Session-tab drag and file/attachment drag are separate interaction modes. The file overlay must remain suppressed for a ProjectChat tab drag so tab/Project targets remain visible.

### G-041 — Long-press as the ProjectChat tab context gesture
**Buried.** It conflicts with touch drag/drop. Use double-tap on mobile; right-click remains available on desktop.

### G-042 — Context menu to the right of the tab
**Buried.** Anchor below the invoking tab and clamp to viewport without changing the below-tab intent.

### G-043 — Save button in tab Customize
**Buried.** Tab appearance changes are live/persistent; outside tap/click dismisses.

## 7. Lessons learned

- A page rendering is not evidence that application JavaScript initialized. “HTML visible” and “UI alive” are separate gates.
- An entirely inert ribbon/sidebar/session list is a startup-level failure signal. Inspect the first uncaught exception before theorizing about individual handlers.
- Linting the patch or a hand-copied function is insufficient. Validate the final assembled single-file artifact because quoting/template-literal damage often occurs during insertion.
- Owner/device evidence outranks successful commits, successful Pages deployment, version ribbons, and static inspection.
- The fastest recovery from a failed candidate is often to protect the known-good baseline and reapply a small, explicit delta—not to debug layers of emergency patches.
- Release tooling can itself become a defect source. Do not solve a file-editing problem by adding a workflow that creates alerts and another state machine.
- The test handoff is part of the deliverable. A branch/source URL is not equivalent to a runnable Pages URL.
- Do not make the owner operate Git, deploy components, or diagnose architecture. The owner tests the finished candidate.
- Never claim a build is testable until it is actually on the test surface and has been read back.
- Mobile gestures must be designed as a system: long-press and drag competed; double-tap separates context invocation from handle-based dragging.
- Drag interactions need visible affordances: dedicated handle, visible ghost/target, orange insertion/project target, and no unrelated overlay covering the destination.
- Project navigation has two useful scopes: Project = all its tabs; expanded child session = focused single-session view. Preserve both explicitly.
- Accessibility includes chrome geometry. A preset that makes the gear/hamburger/title cramped or illegible is functionally defective.
- Persistent customization should match interaction semantics: live changes should not pretend to require a Save button.

## 8. Immediate next action for the incoming builder

Do not begin by editing current `main`. First locate and fetch the exact last known-good ProjectChat artifact around rollback commit `9b3bdb362c47b9ffede5b6a5271e27a1f95f988f`, compare it with current failed `main`, and establish the clean input. Then rebuild the scope in §3 and execute Gates A–G without pausing for additional owner prompts. The first owner-facing deliverable should be a directly runnable Pages candidate, not a progress report.
