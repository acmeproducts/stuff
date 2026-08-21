<!-- SESSION-MANAGER-GOVERNANCE v1.19.0 -->
# Session Manager — Release Plan, Backlog, Graveyard, Decisions, and Lessons

**Governance version:** 1.19.0  
**Updated:** 2026-08-12  
**Application artifact:** `session-manager-v3.html`  
**Turnover artifact:** `session-manager-turnover.md`  
**Repository:** `acmeproducts/stuff`  
**Owner:** Confi — sole device gate and final scope authority.

This file is the Session Manager / ProjectChat source of truth. Owner/device evidence outranks builder inference, successful commits, green GitHub Pages deployments, and static source inspection.

---

# 0. HARD RULES

- Read this file and `session-manager-turnover.md` before changing Session Manager.
- Owner/device FAIL means FAIL. Owner/device PASS is the only promotion to a proven functional baseline.
- Failed candidate → restore the declared clean input → rebuild the scoped delta. Do not patch-forward through failed candidates.
- Rollback is recovery step 1, not a completed release. Continue through rebuild, validation, publish, read-back, and owner test handoff unless an actual external blocker prevents it.
- Prove cause before fixing. Unknown cause means instrument first.
- Preserve working wiring and extend minimally.
- The deployable app remains one readable self-contained HTML file with inline CSS/JS.
- No encoded/self-decompressing wrapper, extra daemon, service, worker, proxy, port, or duplicate deployment architecture.
- No GitHub Actions workflow may be created or repurposed to manufacture or patch `session-manager-v3.html`. Use the approved direct existing-file update route with a fresh SHA. The existing normal Pages deployment workflow may react to commits.
- No direct `sessions.json` mutation or physical transcript deletion where a Gateway lifecycle RPC exists.
- Diagnostics are read-only unless a separately governed repair release explicitly permits mutation.
- Before publication, extract every executable inline script from the final assembled HTML and syntax/lint-check it. Patch-fragment checking is insufficient.
- Every GitHub publish is read back before owner handoff.
- The owner is the tester. Handoff identifies one filename/version/blob and the directly runnable GitHub Pages URL; never hand off a source branch as the test surface.
- Accessibility is functional scope, not cosmetic polish.
- A deferred feature must not remain in the active release gate. Release gates test the release that was actually scoped.

---

# 1. BASELINES, FAILURES, AND CURRENT STATE

## 1.1 Historical authoritative connection baseline

The only recorded owner-proven functional baseline remains the v2.1.0 line.

- visible version: **v2.1.0**
- exact baseline blob: **`27ee8fabe42a185d194b4af4d668e81b54a8b8c8`**
- owner-baseline restore commit: **`0d5ed4c19ce66c45e5ad6722e84f9ecf13c19875`**

Owner-proven behavior included Gateway connection, sessions loading, chat, inline rename persistence through OpenClaw/official Control UI, and activity-state tracking. The identity/signature/connect subsystem derived from this line remains protected.

## 1.2 ProjectChat clean input used for the v2.9 rebuild

The v2.9 line was rebuilt from the v2.7.1 ProjectChat artifact:

- historical commit: **`9b3bdb362c47b9ffede5b6a5271e27a1f95f988f`**
- exact restored copy on `main`: commit **`2b022ba5353627049a835257db072b7579a454cd`**
- blob: **`c63d8b925af35b533d3edcce3969db57b304b611`**

Important: v2.7.1 was used as the clean ProjectChat build input, but it is **not recorded as owner-proven**. Do not silently upgrade it to an authoritative baseline.

## 1.3 Failed candidates

- **v2.8.0 — owner FAIL.**
- **v2.8.1 — owner FAIL.** Page rendered, but top ribbon and session taps were inert. The later investigation identified a full-screen context-root interaction regression in that failed line; regardless of cause, v2.8.1 remains failed evidence only.
- **v2.9.0 — owner FAIL.** Owner test on 2026-08-12: long-press still opened the tab menu and touch drag did not work.

None of these failed versions is a baseline or a valid patch-forward input.

## 1.4 Current `main` candidate — v2.9.1

Current application state as reconciled on 2026-08-12:

- build: **v2.9.1**
- commit: **`a120817732b92492fdb54d2115aac20b24995aa4`**
- current file blob observed: **`a936cf56949a6590bd562f3ce24116400efd6b5e`**
- Pages deployment run for the same commit: **`31626970093` — completed successfully**
- status: **PUBLISHED CANDIDATE — OWNER DEVICE GATE PENDING**

v2.9.1 was rebuilt from the v2.7.1 clean input rather than patching v2.9.0/v2.8.x forward. Its explicit v2.9.1 corrections are:

- guard Android-generated `contextmenu` so long-press does not invoke the ProjectChat tab menu during touch use;
- once a touch drag is armed, prevent the tab strip from claiming the gesture as native scrolling;
- disable native HTML drag for the touched tab while the custom touch gesture owns it;
- narrow the ProjectChat portrait sidebar to `min(64vw, 280px)`.

A successful Pages deployment is not owner PASS. The next release decision depends on physical-device testing of v2.9.1.

---

# 2. PROTECTED / GOVERNED BEHAVIOR

## 2.1 Connection subsystem

Do not redesign for UI work:

- identity persistence/import/generation;
- Ed25519 key handling;
- device-token handling;
- signed connect-payload construction;
- challenge timestamp/nonce handling;
- platform/device-family fields used by the signature;
- `connectParams()`;
- `rpc()` handshake behavior;
- `connect()` sequencing;
- connect error handling;
- reconnect logic.

## 2.2 Session lifecycle

- Soft delete is governed client state and sends the session to Recycle Bin without deleting the OpenClaw source.
- Restore removes the tombstone and returns the session according to ProjectChat disposition rules.
- Tombstones persist across reload and are portable SOT state.
- Delete Permanently exists only in Recycle Bin and uses Gateway/OpenClaw lifecycle semantics.
- OpenClaw owns transcript archive/rename lifecycle.
- Gateway rejection preserves local state and displays the actual error.
- No direct `sessions.json` or transcript-file mutation.

## 2.3 Appearance / accessibility

Appearance remains a low-vision-oriented workspace. Presets, contrast, typography, chrome geometry, code/path readability, button sizing, sidebar width, and configuration usability are functional behavior.

Required semantic surfaces remain independently controllable where implemented: page, panels/sidebar, raised cards/header, inputs, borders, main/secondary text, accent, user/agent/system messages, code blocks, inline code, filenames/paths, links, metadata, and application chrome.

## 2.4 Transcript rendering and controls

- Markdown renders automatically.
- Recognized safe HTML renders after sanitization.
- Executable/embed content, event handlers, unsafe attributes, `src`/`srcdoc`, and unsafe links are removed.
- Filenames/paths have dedicated styling.
- Message blocks expose Copy.
- Download and Share remain governed transcript actions; in the current ProjectChat release they are invoked from the tab context menu rather than the top ribbon.
- Active agent run exposes Stop.

## 2.5 Diagnostics

Configuration remains organized around Connection, Appearance, and Diagnostics. Debug stays behind Configuration.

Session Files classifications remain:

- `.jsonl.jsonl` → **ANOMALY**;
- normal `.jsonl` → normal transcript;
- `.jsonl.deleted.*` → deleted archive;
- `.jsonl.reset.*` → reset archive;
- constructed `<sessionId>.jsonl` → **derived / not disk-verified**.

The browser must not claim a WSL disk scan it did not perform. Automatic repair remains out of scope until separately governed.

---

# 3. PROJECTCHAT OPERATING MODEL

Visible product/client name: **ProjectChat**. Internal `clientType: "botschat"` may remain temporarily for backward compatibility.

Hierarchy:

`Client → Projects → OpenClaw session tabs`

- Projects are locally/portably managed containers referencing real OpenClaw sessions.
- Each session has at most one normal Project home.
- Cross-Project assignment/drop is a move, never a copy.
- Project deletion moves its sessions to Unassigned; it does not delete them.
- Selecting a Project shows that Project's tab set.
- Background sessions remain independent while another Project/session is viewed.

## 3.1 Session disposition invariant

Every known session is exactly one of:

- **Assigned** — one normal Project owns the live session.
- **Unassigned** — OpenClaw reports it live and no Project owns it.
- **Missing** — previously known but absent from current `sessions.list`.
- **Soft Deleted** — explicit Recycle Bin tombstone; hidden from Assigned/Unassigned/Missing.

Recovered Missing sessions return to **Unassigned** with prior-Project provenance; they never silently return to the old Project.

## 3.2 Cross-device SOT

Default intended SOT: `acmeproducts/stuff/session-manager-sot.json` on `main`.

- GitHub state is SHA-guarded/merge-aware portable state, not blind snapshot overwrite.
- PAT is browser-local only.
- Portable state may include Client Type, Appearance, custom themes, Projects, ordered Project membership, tab customization, known-session/disposition metadata, and Recycle Bin tombstones.
- Gateway tokens, device private keys, provider credentials, and transcripts never enter SOT.
- 409/422 races require re-read/merge/retry.

---

# 4. ACTIVE RELEASE — v2.9.1 MOBILE TAB INTERACTION

**Status:** published to `main`; Pages deployment succeeded; **owner device gate pending**.

**Design priority:** portrait phone first, tablet second, desktop adaptation third.

## 4.1 Locked v2.9.x scope actually under test

### Drag and drop
1. Touch drag uses the tab itself as the visible moving object/ghost; generic document attachment drop UI must not take over a tab drag.
2. Intra-Project reorder inserts the dragged tab immediately to the **left** of the target tab and provides orange target feedback.
3. Cross-Project drag may open the left drawer; target Project highlights orange; release **moves** the session into position 1 of the target Project.
4. After a cross-Project drag or Assign action, focus remains on the **source Project**. The next surviving tab at the vacated position becomes active where available; never jump to the target Project.
5. Tab order persists through existing Project state/SOT behavior.
6. On touch, once drag is armed the scrollable tab strip must not cancel the gesture; native draggable behavior is disabled for the touched tab while the custom gesture owns it.

### Context menu
7. **Mobile double-tap** opens the tab context menu. Android long-press-generated `contextmenu` must not open it.
8. **Desktop right-click** opens the same menu.
9. Menu opens directly **below the invoking tab**, clamped to the viewport.
10. Rename/Assign/Customize leaf content remains stacked with the menu below the tab rather than flying to the right or bottom of the app.
11. Outside tap/click dismisses the menu.
12. Rename commits through governed OpenClaw rename semantics.
13. Assign can choose an existing Project or create one from typed input and must preserve source-Project focus.
14. Download and Share live in the tab context menu, not the top ribbon.

### Ribbon / mobile geometry
15. Normal Ready tabs do not show a redundant per-tab state dot; Working/Error retain signal.
16. Readiness/connectivity is represented by the single main status pill rather than a separate work pill plus connection chip.
17. ProjectChat hides the redundant brand/version in the left ribbon; build version remains available in Configuration.
18. Portrait ProjectChat sidebar is constrained to `min(64vw, 280px)` so the chat surface remains usable.

## 4.2 Explicitly deferred from v2.9.1

These are **not** v2.9.1 pass/fail criteria and must not appear in the active gate:

- full tab text-on-hover enhancement;
- Project-row chevrons that expose nested session rows;
- nested left-side session selection that switches the right pane into single-session-only mode;
- clicking a Project row to restore all tabs after such nested focus;
- converting Customize to live/no-Save behavior;
- ProjectChat preset/Configuration-gear fit refinements beyond the v2.9.1 portrait sidebar correction;
- richer Project ordering/management.

Current source still uses the existing Customize **Save** control. That is not a v2.9.1 failure because live/no-Save customization is deferred.

---

# 5. v2.9.1 RELEASE / OWNER GATE

## 5.1 Mechanical qualification before any future republish

### Gate A — exact input
- fetch current intended baseline/candidate and fresh blob SHA;
- never start from v2.8.0, v2.8.1, or v2.9.0 as patch-forward inputs;
- preserve protected connection markers.

### Gate B — scoped source change
- application behavior changes only in `session-manager-v3.html`;
- remain one readable self-contained HTML file;
- no helper runtime, daemon, proxy, encoded wrapper, or source-patching workflow.

### Gate C — final-artifact JavaScript syntax/lint
- extract every executable inline `<script>` from the complete final HTML;
- run `node --check` or stricter equivalent on every extracted script;
- malformed template literals/quotes are hard failures.

### Gate D — structural assertions for the active v2.9 scope
Mechanically verify at least:
- required startup/navigation element IDs exist;
- bootstrap remains present;
- hamburger/sidebar/session selection handlers are installed;
- `#tabContextRoot` is inert when empty and cannot become a permanent full-screen click blocker;
- mobile touch path guards native `contextmenu`/long-press behavior;
- armed touch drag blocks native strip scrolling/cancellation and native HTML drag on the touched tab;
- tab drag suppresses the attachment overlay;
- orange tab/Project target feedback exists;
- menu anchors below the tab and supports outside dismissal;
- Download/Share are in the tab menu and absent from the ProjectChat top ribbon;
- source-Project focus/next-tab logic is present after moves;
- build/version markers are internally consistent.

Do **not** fail Gate D for deferred chevrons/nested focus or Customize Save behavior.

### Gate E — regression smoke
Before owner handoff, exercise or instrument at least:
- bootstrap reaches ready state without uncaught exception;
- hamburger/sidebar expands/collapses;
- top-ribbon controls respond;
- sessions render;
- tapping a session changes active session;
- Project switching responds;
- context menu opens/dismisses;
- file attachment drag remains separate from tab drag.

### Gate F — publish
- fetch fresh `main/session-manager-v3.html` SHA immediately before write;
- direct existing-file update only;
- normal Pages deployment may run after commit;
- no source-patching Actions workflow or throwaway branch as owner test surface.

### Gate G — read-back / handoff
- fetch the published source after write;
- verify blob/version/required markers;
- verify Pages deployment/status when available;
- hand the owner the runnable Pages URL, cache-busted when useful.

## 5.2 Owner physical-device Gate — v2.9.1

### Regression first
- [ ] Gateway connects.
- [ ] Sessions load.
- [ ] Hamburger/sidebar works.
- [ ] Top ribbon works.
- [ ] Session tap opens history.
- [ ] Send/chat round-trip works.
- [ ] Stop works during active run.
- [ ] Rename persists to official Control UI.
- [ ] No auth/signature regression.

### Mobile interaction
- [ ] Single tap selects a tab/session normally.
- [ ] Long-press does **not** open the tab context menu.
- [ ] Double-tap opens the context menu below the tab.
- [ ] Outside tap closes it.
- [ ] Touch drag begins and continues instead of being cancelled by horizontal tab scrolling.
- [ ] Dragging a tab does not invoke the attachment overlay.
- [ ] Orange insert-left target is visible and intra-Project reorder works.
- [ ] Cross-Project target highlights and move inserts at position 1.
- [ ] After cross-Project move/Assign, source Project stays focused and the appropriate surviving tab becomes active.
- [ ] Download/Share work from the tab context menu.
- [ ] Portrait sidebar leaves adequate chat width.

### Lifecycle/regression
- [ ] Soft delete/Recycle Bin semantics unchanged.
- [ ] Missing/Unassigned disposition unchanged.
- [ ] Attachments unchanged.
- [ ] Appearance/custom themes/rendering unchanged.
- [ ] SOT behavior does not write secrets.

**Only owner PASS promotes v2.9.1 to the next functional baseline.**

---

# 6. NEXT RELEASE AFTER v2.9.1 PASSES

Do not start this expansion until the owner completes the v2.9.1 device gate.

Recommended next release: **v2.10 — Project navigation + tab polish**, built from the owner-passed v2.9.1 artifact.

Candidate scope, in this order:

1. Project chevrons + nested session rows.
2. Nested session click = single-session right-pane focus; Project click = restore all Project tabs.
3. Full tab text/label visibility on hover where hover exists, with touch-safe equivalent if needed.
4. Customize becomes live/persistent with no Save button; outside dismissal remains consistent.
5. ProjectChat preset/Configuration gear fit and low-vision geometry refinement.
6. Only after those pass: richer Project ordering/management and keyboard-accessible movement/context actions.

Do not mix multi-instance architecture into this release.

---

# 7. PLANNED EXPANSION AFTER STABLE PROJECTCHAT

Strategic direction remains: stabilize this single-instance chat client first, then expand it to manage multiple OpenClaw instances and eventually multiple platforms.

Planned expansion includes:

- named Gateway/instance profiles with isolated auth/device state;
- simultaneous multi-instance desk;
- global search and operations across instances;
- health/version summaries and per-instance diagnostics;
- safe profile/theme/project import/export and portable SOT;
- platform abstraction only after the single-instance ProjectChat interaction model is owner-proven.

No expansion work may destabilize the current single-instance baseline.

---

# 8. BACKLOG

### Lifecycle
- bulk soft delete / restore;
- bulk archive/delete after single-session lifecycle is proven;
- archived-transcript browser;
- supported archive restoration/re-index.

### Session-file diagnostics
- determine root cause/population of `.jsonl.jsonl`;
- orphan detection using the best Gateway-native inventory available;
- missing referenced transcripts;
- duplicate sessionId/file references;
- archive retention visibility;
- anomaly report export;
- repair only in a later mutation-governed release.

### Operations
- transcript search;
- jump to latest/unread;
- improved code-block controls;
- message metadata on demand;
- global multi-instance search later.

### ProjectChat
- deferred v2.10 navigation/polish items from §6;
- harden touch drag/drop across mobile browsers after owner evidence;
- keyboard-accessible equivalents for tab/project movement and context actions;
- richer Project ordering/management;
- SOT conflict/audit viewer;
- recovery UI for Missing → Unassigned provenance.

### Test infrastructure
- protected auth/connect source-diff guard;
- final-HTML script extractor + `node --check` gate;
- startup/control reachability harness;
- smoke harness for hamburger/top ribbon/session selection;
- mobile gesture test harness for double-tap/long-press/drag cancellation;
- mock list/patch/delete/chat/abort/auth cases;
- two-client harness;
- multi-instance harness;
- mutation tests proving each critical gate can actually fail.

---

# 9. GRAVEYARD / NON-NEGOTIABLE LESSONS

The historical graveyard through G-033 remains part of project history and continues to govern its original areas. The highest-risk current prohibitions are restated here:

- **G-034 — Publish without syntax-checking complete assembled JavaScript: buried.**
- **G-035 — Treat rollback as the completed response to a failed release: buried.**
- **G-036 — Branch/source page as owner test handoff: buried.**
- **G-037 — GitHub Actions workflow as source patch mechanism: buried.**
- **G-038 — Narrate intended work instead of completing mechanical release stages: buried.**
- **G-039 — Patch-forward from owner-failed v2.8.0/v2.8.1/v2.9.0: buried.**
- **G-040 — Let ProjectChat tab drag invoke attachment overlay: buried.**
- **G-041 — Long-press for tab context menu: buried. Mobile uses double-tap; desktop uses right-click.**
- **G-042 — Context menu to the right of invoking tab: buried. It opens below the tab.**
- **G-043 — Treat deferred Customize-no-Save behavior as part of v2.9.1: buried. Scope and gates must agree.**
- **G-044 — Assume removing a long-press timer removes Android long-press behavior: buried. Android can fire a DOM `contextmenu` event.**
- **G-045 — Custom touch drag over a scrollable strip without blocking native scroll once drag is armed: buried. Native scroll can trigger `pointercancel` and kill the gesture.**
- **G-046 — Let deferred scope leak into an active release gate: buried 2026-08-12.** A release cannot be failed for a feature the same plan explicitly deferred.
- **G-047 — Overwrite a newer build with an older validated candidate because an earlier task asked for that update: buried 2026-08-12.** Re-read `main` immediately before any write and preserve forward progress.

---

# 10. CURRENT DECISION

**Do not change application code yet.** The repository is at v2.9.1 and the immediate next action is the owner physical-device Gate in §5.2. Record the observed pass/fail behavior against that checklist. If v2.9.1 passes, promote it and begin v2.10 from that exact passed blob. If it fails, capture the exact failing gesture/control and rebuild from the clean declared input rather than layering emergency patches.


# v2.9.2 TAB INTERACTION CORRECTION — 2026-08-13

- Tab reordering uses explicit insertion drop zones between every session tab and after the final tab; tab order persists through Project state and GitHub SOT.
- Dropping a tab on a Project remains a Project move and is distinct from reordering within the active Project.
- Customize is a right-hand context submenu anchored beneath the selected tab on desktop; narrow screens stack it vertically.
- Tab appearance no longer uses a separate Save action. Controls preview immediately and persist on blur/change. Reset persists immediately.

# v2.9.20 SOT ASSIGNMENT-LOSS INCIDENT + FIX — 2026-08-21

**Incident.** At 02:28 PT a stale outbox event (deviceId `browser`, ts 2026-08-20 12:39Z, older than the live snapshot) was appended after the remote snapshot and won compaction, replacing 8 projects / 66 assigned sessions with 4 empty placeholder projects. Root cause: `compactSotEvents` kept the last event in array order and ignored `ts`.

**Fix (v2.9.20).**
- Compaction is now timestamp-wins per kind; an older event can never overwrite a newer one.
- Guard: an incoming project snapshot with zero assignments is skipped (logged + toast) when the current state has ≥3 assigned sessions.

**Recovery.** SOT `projects.snapshot` restored from commit `53c1168` (2026-08-21 01:40 PT, last good), re-stamped `recovery-v2920` with a current ts so every device adopts it.

**Owner ruling.** G-048 — Compaction without timestamp ordering: buried 2026-08-21.

# v2.10.0 UNIFIED SYNC LAYER — 2026-08-21

**Scope (step 1 of the OC/GH merge plan; GH is the base).** Sync only. No UI changes.
- GH now reads every event dialect in the SOT: OC fine-grained events (project.upsert/delete, session.assign, project.order, projects.order, project.style, recovery.marker) plus legacy snapshots.
- GH now *writes* fine-grained events: each save is diffed against the last synced state and emitted as the minimal set of changes. Whole-project snapshots are only written to seed an empty SOT.
- Compaction is timestamp-wins per entity (ported from OC); legacy snapshot acceptance guard retained.
- Project state gains `projectStyles` and `missingCandidates` so OC data is preserved through a GH save.
- All storage writes remain quota-safe.

**Next.** Step 2: port project card context menu/Customize/reorder, omni search, manifest export, message recovery. Step 3: replace OC long-press card drag with the pointer-based tab treatment on mobile. Owner device gate before each.

**Owner ruling.** G-049 — Two builds with different sync dialects writing one SOT: buried 2026-08-21. One build is the writer; OC receives GH deployments.

# v2.10.1 FULL MERGE OF THE TWO 2.9 LINES — 2026-08-21

**Finding.** The repo history is linear but forked in content: the Aug 17 line (v2.9.12–2.9.22: project cards, context menu, Customize, card reorder, dual omnisearch, full project export/share, message recovery, fine-grained SOT events, compact mobile composer) was overwritten on Aug 18 by a second 2.9.12 built from 2.9.11. Both lines then advanced under the same version numbers. The OC host was serving the Aug 17 line; GitHub Pages the Aug 18 line. This is the G-047 failure.

**Method.** True three-way merge: base = 2.9.11 (bf88a9e), ours = 2.10.0, theirs = 2.9.22 (65c820d). Five conflicts resolved: CSS keep both; SOT schema keep forward-tolerant reader; apply-events keep quota-safe variant; save keeps diff-based emitter. Outbox is compacted on every emit so the two emitter styles never double-write.

**Result — one build with everything:**
- Aug 17 line: project card context menu, Customize (color/size), card reorder, omnisearch, project export/share/download, message recovery, compact mobile composer.
- Aug 18 line: pinch/A± transcript scale, swipe-to-quote with reply chip, quota-safe storage, no-store reads, implausible-list guard, markdown completion, HTML preview.
- Today: timestamp-wins compaction, empty-snapshot guard, unified event model.
- Project-card mobile drag rebuilt on the tab gesture engine: hold-to-arm or slow-drag-to-arm, fast flick still scrolls, floating ghost, orange insert edge, click suppression, double-tap opens card menu.

**Owner ruling.** G-050 — Releasing a version number already used by a published build: buried 2026-08-21. Version numbers are allocated from the repo log, never from memory.
