<!-- SESSION-MANAGER-GOVERNANCE v1.16.0 -->
# Session Manager — Release Plan, Backlog, Graveyard, Decisions, and Lessons

**Governance version:** 1.16.0  
**Updated:** 2026-08-12  
**Application artifact:** `session-manager-v3.html`  
**Turnover artifact:** `session-manager-turnover.md`  
**Owner:** Confi — sole device gate and final scope authority.

This file is the Session Manager source of truth. Owner/device evidence outranks builder inference.

---

# 0. HARD RULES

- Read this file and `session-manager-turnover.md` before changing Session Manager.
- Owner/device FAIL means FAIL.
- Failed candidate → restore exact owner-proven input → rebuild; never patch-forward.
- **Rollback is recovery step 1, not a completed release.** Continue through rebuild, validation, publish, read-back, and test handoff without waiting for another owner prompt.
- Prove cause before fix; unknown cause means instrument first.
- Preserve working wiring and extend minimally.
- Deployable app remains one readable self-contained HTML file with inline CSS/JS.
- No encoded/self-decompressing app wrapper, extra daemon, service, worker, proxy, port, or duplicate deployment architecture.
- No GitHub Actions workflow may be created or repurposed to manufacture/patch `session-manager-v3.html`. Use the approved direct existing-file update route with a fresh SHA.
- No direct `sessions.json` mutation or physical transcript deletion where a Gateway lifecycle RPC exists.
- Diagnostics are read-only unless a separately governed repair release explicitly permits mutation.
- **Before publication, extract every executable inline script from the final assembled HTML and syntax/lint-check it.** Patch-fragment checking is insufficient.
- Every GitHub publish is read back before owner handoff.
- The owner is the tester. Handoff identifies one filename/version/blob and provides the directly runnable GitHub Pages URL; never hand off a source branch as the test surface.
- Accessibility is functional scope, not cosmetic polish: presets, contrast, typography, path/code readability, chrome geometry, and configuration usability are owner-gated behavior.

---

# 1. BASELINES AND CURRENT STATE

## 1.1 Historical authoritative connection baseline

The owner supplied and explicitly proved working the v2.1.0 Session Manager artifact.

- visible version: **v2.1.0**
- exact baseline blob: **`27ee8fabe42a185d194b4af4d668e81b54a8b8c8`**
- owner-baseline restore commit: `0d5ed4c19ce66c45e5ad6722e84f9ecf13c19875`

Owner-proven baseline behavior included Gateway connection, sessions loading, chat, inline rename persistence through OpenClaw/official Control UI, and activity-state tracking. The identity/signature/connect subsystem derived from this line remains protected.

## 1.2 ProjectChat working line before v2.8.x failure

The recovery commit used during the v2.8 effort was:

- **`9b3bdb362c47b9ffede5b6a5271e27a1f95f988f`** — v2.7.1 line. **Owner ruling 2026-08-12: NOT device-proven.** No ProjectChat build (v2.4–v2.7.1) has a recorded owner PASS; the only recorded proven baseline remains v2.1.0. v2.7.1 is the current baseline-verification candidate, restored byte-exact to `main` (commit `2b022ba`, blob `c63d8b925af35b533d3edcce3969db57b304b611`) awaiting owner Gate 1 regression. If it fails, step back to the v2.6.0 backup and repeat.

Incoming work must fetch and inspect this commit/file and repository lineage before declaring the exact clean input. Version labels alone are not proof.

## 1.3 Current `main` is FAILED

- Current published candidate identifies as **v2.8.1**.
- Owner test on **2026-08-12**: page loads, but the top ribbon is inert and tapping a session is inert.
- Therefore v2.8.1 is **not a baseline** even if GitHub commit/Pages deployment succeeded.
- v2.8.0 also failed owner testing and is not a baseline.
- Both failed candidates may be inspected as evidence/donors only; do not patch them forward.

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
- Recycle bin is at the **TOP** where applicable.
- Restore removes the tombstone and returns the session according to ProjectChat disposition rules.
- Tombstones persist across reload and are portable SOT state.
- Delete Permanently exists only in Recycle Bin and uses Gateway/OpenClaw lifecycle semantics.
- OpenClaw owns transcript archive/rename lifecycle.
- Gateway rejection preserves local state and displays the actual error.
- No direct `sessions.json` or transcript-file mutation.

## 2.3 Accessibility / Appearance

Appearance is a large low-vision-oriented workspace, not a cramped generic settings box.

Required readable presets include High Contrast Dark, High Contrast Light, Warm Paper, Soft Dark, Large Print, plus product-style presets such as Claude, ChatGPT and ProjectChat where implemented. Presets are starting points and must remain legible out of the box.

Independent semantic surfaces include page, panels/sidebar, raised cards/header, inputs, borders, main/secondary text, accent, user/agent/system messages, code blocks, inline code, filenames/paths, links, metadata, and application chrome. Critical foregrounds require contrast protection.

Typography/layout includes application/base text size, button font size, message sizes, metadata size, sidebar width, session density, line spacing, and readable font choices. The ProjectChat preset must leave chrome controls such as the Configuration gear comfortably visible and tappable.

Custom themes save the complete appearance state, can be applied/renamed/duplicated/deleted, and support validated JSON export/import without silent overwrite.

## 2.4 Automatic transcript rendering

- Markdown renders automatically.
- Recognized safe HTML formatting renders automatically after sanitization.
- No manual Markdown-vs-HTML mode is required.
- executable/embed content, event handlers, unsafe attributes, `src`/`srcdoc`, and unsafe links are removed.
- filenames/paths use dedicated styling and remain readable independently of message text colors.
- message blocks expose Copy; session header exposes Download and Share; active agent run exposes Stop.

## 2.5 Diagnostics

Configuration remains organized around Connection, Appearance, and Diagnostics. Debug remains behind Configuration.

Session Files rules:

- `.jsonl.jsonl` → **ANOMALY**;
- normal `.jsonl` → normal transcript;
- `.jsonl.deleted.*` → deleted archive;
- `.jsonl.reset.*` → reset archive;
- constructed `<sessionId>.jsonl` → **derived / not disk-verified**;
- browser does not claim a WSL disk scan it cannot perform;
- automatic repair remains out of scope until separately governed.

---

# 3. PROJECTCHAT OPERATING MODEL

The visible product/client name is **ProjectChat**. Internal `clientType: "botschat"` may remain temporarily for backward compatibility.

Hierarchy:

`Client → Projects → OpenClaw session tabs`

- Projects are locally/portably managed containers for references to real OpenClaw sessions.
- Each session has at most one normal Project home.
- Cross-Project assignment/drop is a move, never a copy.
- Project deletion moves its sessions to Unassigned; it does not delete them.
- Selecting a Project shows that Project's tab set.
- Background sessions remain independent while another Project/session is viewed.

## 3.1 Session disposition invariant

Every known session is exactly one of:

- **Assigned** — one normal Project owns the live session.
- **Unassigned** — OpenClaw reports it live and no Project owns it.
- **Missing** — previously known but absent from current `sessions.list`; shown behind a Missing chevron.
- **Soft Deleted** — explicit Recycle Bin tombstone; hidden from Assigned/Unassigned/Missing.

Recovered Missing sessions return to **Unassigned** with prior-Project provenance; they never silently return to the old Project.

## 3.2 Cross-device SOT

Default intended SOT: `acmeproducts/stuff/session-manager-sot.json` on `main`.

- GitHub state is an append-only/SHA-guarded event journal, not blind snapshot overwrite.
- PAT is browser-local only.
- Portable state includes Client Type, Appearance, custom themes, Projects, ordered Project membership, tab customization, known-session/disposition metadata, and Recycle Bin tombstones.
- Gateway tokens, device private keys, provider credentials, and transcripts are never written to SOT.
- 409/422 races require re-read/merge/retry.

---

# 4. ACTIVE RELEASE — v2.9.0 TAB INTERACTION (owner-corrected scope, 2026-08-12)

**Status:** v2.9.0 owner-FAILED (2026-08-12): long-press still opened the tab menu and touch drag did not work. v2.9.1 rebuilt from the proven v2.7.1 baseline and published to `main`, awaiting owner device gate. Prior v2.8.x scope text contained misinterpretations and is superseded by this section.

**This application is mobile-first. Every behavior below is specified for portrait phone first; desktop is the secondary adaptation.**

## 4.1 Locked scope

### Drag and drop
1. **Drag ghost is the tab itself.** Tap-hold + drag on a tab must never invoke the right-panel file/attachment drop overlay, and the ghost must never be the whole right panel. The file drop zone is for document upload only and is suppressed for the entire duration of a tab drag.
2. **Intra-Project reorder:** drop zones are the positions beside each tab. The target tab shows an orange outline; release inserts the dragged tab immediately to the target's **left**. Tab ghost follows the finger/cursor throughout.
3. **Cross-Project drag:** dragging toward a closed left drawer auto-opens it; the tab ghost persists. Hovering a Project row highlights it orange; release **moves** (never copies) the session into that Project at position 1.
4. **After any cross-Project move (drag or Assign):** focus stays on the **source** Project. The tab to the right of the vacated slot slides into that position and becomes the **armed/active** tab whose content is shown. Never focus the target Project.
5. Tab order persists locally and to GitHub SOT when configured.

### Context menu
6. **Double-tap** (mobile) / right-click (desktop) opens the tab context menu **directly below the invoking tab**, clamped to viewport. Never to the tab's right — portrait phones have no horizontal real estate there.
7. **Every context-menu leaf UI (Rename input, Assign search, Customize controls) also renders below the tab**, attached to the menu — never at the bottom of the right panel.
8. Outside tap/click dismisses. Rename: Enter commits via governed OpenClaw rename, menu closes, source focus retained.
9. **Assign leaf:** typing filters a live Project list. Tap an existing Project → move the tab, close menu, source Project stays focused, next tab armed per rule 4. Enter on a non-existing name → create Project, move tab, same post-move behavior.
10. **Download and Share move into the tab context menu** (removed from the top ribbon).

### Ribbon declutter
11. Remove the per-tab blue dot. Activity is shown only when it carries signal: a tab indicator appears only for Working or Error states, nothing when Ready.
12. Merge the ribbon "Ready" dot and the "Connected" chip into **one combined readiness/connectivity indicator**.
13. Left ribbon: remove the ProjectChat wordmark and visible version; version moves into the Configuration panel. The new-session control is the **+** icon alone, with no "session" label.

Everything from the former v2.8.x scope not restated above (hover full-text, chevrons, single-session left-pane focus, Customize live styling, preset/gear fit) is **deferred backlog** — deliberately out of this release to keep scope tight.

## 4.2 Mandatory release gates

### Gate A — exact clean input
- locate/fetch exact last owner-proven ProjectChat build around rollback commit `9b3bdb362c47b9ffede5b6a5271e27a1f95f988f`;
- verify expected behavior/markers and protected connection subsystem;
- do not use current failed v2.8.1 as input.

### Gate B — scoped build
- application behavior changes only in existing `session-manager-v3.html`;
- preserve readable self-contained HTML;
- no workflow-generated patch, encoded wrapper, helper runtime, daemon, proxy, or broad auth/bootstrap rewrite.

### Gate C — final-artifact JavaScript syntax/lint
- extract every executable inline `<script>` from the **complete final HTML**;
- run `node --check` or stricter equivalent on every extracted script;
- malformed template literals/quotes are hard failures;
- no publish on any syntax/lint failure.

### Gate D — structural assertions
Mechanically verify at least:
- required startup/navigation element IDs exist;
- bootstrap remains present;
- hamburger/sidebar and session selection handlers are installed;
- context menu supports outside dismissal and has no Customize Save button;
- tab drag cannot enter the attachment overlay;
- orange tab/Project targets exist;
- Project chevron/session-child structures exist;
- visible/build version is consistent.

### Gate E — regression smoke
Before owner handoff, exercise or instrument at least:
- bootstrap reaches ready state without uncaught exception;
- hamburger/sidebar expands/collapses;
- top-ribbon controls respond;
- sessions render;
- tapping a session changes active session;
- Project and nested-session navigation respond;
- context menu opens/dismisses.

Static checks are permission to publish, not owner PASS, but a syntax/startup failure must never be handed to the owner again.

### Gate F — publish
- fetch fresh `main/session-manager-v3.html` SHA immediately before write;
- use approved direct existing-file update only;
- no source-patching GitHub Actions workflow;
- no branch/source page as owner test surface;
- publish candidate to governed `main`/GitHub Pages test surface.

### Gate G — read-back / handoff
- fetch `main/session-manager-v3.html` after write;
- verify blob/version/required markers;
- verify Pages deployment/status when available;
- hand owner the directly runnable Pages URL, cache-busted when useful.

**Do not stop after rollback. Continue A→G unless an actual external blocker prevents execution.**

---

# 5. OWNER GATE FOR NEXT v2.8.x CANDIDATE

## Gate 1 — regression first
- [ ] expected version visible;
- [ ] Gateway connects;
- [ ] sessions load;
- [ ] hamburger/sidebar works;
- [ ] top ribbon works;
- [ ] open session loads history;
- [ ] session taps/clicks work;
- [ ] send/chat round-trip works;
- [ ] Stop works while agent is active;
- [ ] rename persists to official Control UI;
- [ ] no auth/signature regression.

If Gate 1 fails: FAIL → restore exact proven input → record evidence → rebuild. Do not patch-forward.

## Gate 2 — ProjectChat interaction
- [ ] full tab text appears on hover;
- [ ] dedicated drag handle works;
- [ ] file-drop overlay does not cover tab drag;
- [ ] orange left-insertion target is visible;
- [ ] cross-Project orange target works and inserts at position 1;
- [ ] Project chevrons expand sessions;
- [ ] nested session focuses only that session on right;
- [ ] Project click restores all Project tabs;
- [ ] right-click and mobile double-tap open menu below tab;
- [ ] outside click/tap closes menu;
- [ ] Rename Enter works without Save;
- [ ] Assign existing/new Project works and preserves origin focus;
- [ ] Customize changes apply live/persist with no Save button;
- [ ] tab order persists;
- [ ] phone/tablet gestures do not conflict.

## Gate 3 — lifecycle/accessibility/regression
- [ ] soft delete/Recycle Bin semantics unchanged;
- [ ] Missing/Unassigned disposition unchanged;
- [ ] Copy/Download/Share/attachments unchanged;
- [ ] ProjectChat preset leaves gear/chrome comfortably usable;
- [ ] appearance/custom themes/automatic Markdown+safe HTML rendering unchanged;
- [ ] SOT sync does not overwrite secrets or prior remote events.

Only owner PASS promotes the candidate to baseline.

---

# 6. PLANNED EXPANSION AFTER STABLE PROJECTCHAT

The strategic direction remains: get this chat client stable first, then expand it to manage multiple OpenClaw instances and eventually multiple platforms so the owner is no longer window-hopping.

Planned expansion includes:

- named Gateway/instance profiles with isolated auth/device state;
- simultaneous multi-instance desk;
- global search and operations across instances;
- health/version summaries and per-instance diagnostics;
- safe profile/theme/project import/export and portable SOT;
- platform abstraction only after the single-instance ProjectChat interaction model is owner-proven.

No expansion work is allowed to destabilize the current single-instance baseline.

---

# 7. BACKLOG

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
- harden touch drag/drop across mobile browsers;
- keyboard-accessible equivalents for tab/project movement and context actions;
- richer Project ordering/management after current interaction release passes;
- SOT conflict/audit viewer;
- recovery UI for Missing → Unassigned provenance.

### Test infrastructure
- protected auth/connect source-diff guard;
- final-HTML script extractor + `node --check` gate;
- startup/control reachability harness;
- smoke harness for hamburger/top ribbon/session selection;
- mock list/patch/delete/chat/abort/auth cases;
- two-client harness;
- multi-instance harness;
- mutation tests proving each critical gate can actually fail.

---

# 8. GRAVEYARD

### G-001 — Patch-forward after failed candidate
Buried. Restore declared input and rebuild.

### G-002 — Encoded/self-decompressing application wrapper
Buried. Literal readable HTML only.

### G-003 — Divergent standalone proof client
Buried when it does not exercise the real app bootstrap/auth path.

### G-004 — Infer Gateway from page origin
Buried. Hosting origin and Gateway endpoint are separate.

### G-005 — Blind device approval
Buried. Approve only a real Gateway request.

### G-006 — Generic `INVALID_REQUEST` as root cause
Buried. Read structured error details.

### G-007 — Invented auth/token replacement
Buried. Preserve proven Gateway contract.

### G-008 — Static parse as runtime proof
Buried. Static checks qualify a candidate; owner hardware gate proves it.

### G-009 — Broad refactor for narrow feature work
Buried. Preserve working wiring.

### G-010 — Custom encoding/chunk/install publishing
Buried. Plain literal HTML and exact source read-back.

### G-011 — Direct physical transcript deletion
Buried. Use OpenClaw lifecycle semantics.

### G-012 — Automatic `.jsonl.jsonl` repair before evidence
Buried until separately governed. Detection first.

### G-013 — Claim derived path list is a disk scan
Buried. Derived means not disk-verified.

### G-014 — Handoff without exact source read-back
Buried. Read back the published source before handoff.

### G-015 — Modify proven auth/connect code for unrelated UI features
Buried. Build UI/lifecycle changes around the proven connection subsystem.

### G-016 — Explain away repeated owner failure as deployment mismatch
Buried. Repeated owner failure after redeployment is a release FAIL.

### G-017 — Publish compressed/binary bytes as the HTML artifact
Buried. Literal UTF-8 HTML read-back is mandatory.

### G-018 — Let message text color leak into code/path surfaces
Buried. Code, inline code, filenames/paths, and links have dedicated palette roles and contrast protection.

### G-019 — Cram Appearance controls into a small generic settings box
Buried. Appearance is a large coherent workspace with live preview.

### G-020 — Presets without low-vision legibility guarantees
Buried. Presets require readable contrast, scale, spacing, and usable chrome.

### G-021 — Require the user to choose Markdown versus HTML rendering mode
Buried. Rendering is automatic and safe HTML is sanitized.

### G-022 — BotsChat as only a palette
Buried. ProjectChat is a client/workspace type with Projects and session tabs.

### G-023 — One fixed General thread
Buried. Multiple Projects are critical; each Project may own multiple sessions.

### G-024 — Custom themes as hard-coded source edits
Buried. Themes are validated portable data.

### G-025 — Device-local-only project/theme state
Buried. Portable workspace organization uses GitHub SOT.

### G-026 — Blind whole-state GitHub overwrite
Buried. SOT writes are SHA-guarded merges/events.

### G-027 — Syncing secrets
Buried. Credentials/private keys/transcripts never enter portable SOT.

### G-028 — Invisible orphan sessions
Buried. Every known session has one of four dispositions.

### G-029 — Tab X as local close/remove membership
Buried. Tab X is governed soft delete to Recycle Bin.

### G-030 — Automatically restore recovered Missing session to old Project
Buried. Recovery goes to Unassigned with provenance.

### G-031 — BotsChat visible product name
Retired in favor of ProjectChat.

### G-032 — Assignment that navigates away from current Project
Buried. Origin Project retains focus.

### G-033 — Non-persistent tab customization
Buried. Tab customization persists.

### G-034 — Publish without syntax-checking complete assembled JavaScript
**Buried 2026-08-12.** Extract every executable script from final HTML and syntax/lint-check it before publication.

### G-035 — Treat rollback as completed response to failed release
**Buried 2026-08-12.** Rollback → rebuild → validate → publish → read-back → test URL is one recovery operation.

### G-036 — Branch/source page as owner test handoff
**Buried 2026-08-12.** Owner receives a runnable Pages URL.

### G-037 — GitHub Actions workflow as source patch mechanism
**Buried 2026-08-12.** It created workflow noise/alerts and another failure surface. Direct existing-file update only; normal Pages deployment remains separate.

### G-038 — Narrate intended work instead of completing mechanical release stages
**Buried 2026-08-12.** Continue autonomously through the governed pipeline once scope is known.

### G-039 — Patch-forward from owner-failed v2.8.0/v2.8.1
**Buried 2026-08-12.** Failed candidates are evidence/donors only.

### G-040 — Let ProjectChat tab drag invoke attachment overlay
**Buried 2026-08-12.** File drag and session-tab drag are distinct modes; tab/project targets must remain visible.

### G-041 — Long-press for tab context menu
**Buried.** It conflicts with touch drag/drop. Mobile uses double-tap; desktop keeps right-click.

### G-042 — Context menu to the right of invoking tab
**Buried.** It opens below the tab.

### G-043 — Save button in tab Customize
**Buried.** Changes are live/persistent; outside tap/click dismisses.

### G-044 — Assuming removing the long-press timer removes long-press behavior
**Buried 2026-08-12.** Android fires a `contextmenu` DOM event on long-press. Any `oncontextmenu` handler on a tab IS a long-press handler on mobile unless guarded against active touch input.

### G-045 — Custom touch drag over a scrollable strip without blocking native scroll
**Buried 2026-08-12.** A scrollable container claims the touch gesture and fires `pointercancel`, killing the drag. Once a drag is armed, `touchmove` must be preventDefault-ed (non-passive) and native `draggable` must be disabled for the touched tab.

---

# 9. LESSONS

- The owner’s most recent demonstrated working artifact is the functional baseline.
- A working baseline is an asset; protect unrelated subsystems.
- A page rendering is not evidence that JavaScript bootstrap completed. “HTML visible” and “UI alive” are separate release gates.
- An inert hamburger/ribbon/session list is a startup-level failure signal. Capture the first uncaught exception before guessing about individual controls.
- Lint the final assembled single-file application, not a patch fragment or copied function. Source insertion can break quotes/template literals even when the fragment itself looked valid.
- Owner/device evidence outranks a successful commit, green Pages deployment, version ribbon, or static inspection.
- Rollback is not the deliverable when the owner requested a corrected release; it is the clean starting point for the rebuild.
- Release tooling can itself become a defect. Do not introduce workflows/helper deployment mechanisms to solve ordinary source editing.
- Source publishing correctness is part of release correctness. Fresh SHA before write; exact source read-back afterward.
- A branch source URL is not a test deployment. The owner tests the live Pages artifact.
- Do not make the owner deploy components, operate Git, or diagnose architecture. The owner tests the finished candidate.
- Accessibility failures are functional defects, including cramped/hidden chrome and tiny controls.
- Color controls require semantic surface separation and contrast protection.
- Automatic rendering must be paired with sanitization.
- Mobile gestures must be designed together. Long-press conflicted with drag; double-tap plus a dedicated drag handle separates the actions.
- Drag/drop requires visible state: dedicated handle, ghost/target feedback, orange insertion/project target, and suppression of unrelated overlays.
- Project navigation deliberately supports two scopes: Project = all tabs; expanded child session = single-session focus.
- Live/persistent customization should not have a fake Save step.
- Once release scope is fully specified, do not repeatedly stop for permission between rollback, rebuild, checks, publish, and read-back.

---

# 10. DECISION LOG

- **D-001 · 2026-08-10:** this file governs Session Manager work.
- **D-002:** WSL owner gate precedes neutral-hosting work.
- **D-003:** expansion order begins with a stable single instance before multi-instance/platform expansion.
- **D-004:** session rename round-trip into official Control UI is a regression gate.
- **D-005:** Recycle Bin belongs at top where applicable.
- **D-006:** permanent delete uses OpenClaw lifecycle/archive semantics.
- **D-007:** `.jsonl.jsonl` is diagnostic-first; no speculative repair.
- **D-008:** Debug remains behind Configuration and tabbed.
- **D-009:** failed candidates are never promoted.
- **D-010:** owner-supplied v2.1 blob `27ee8f...` is the historical authoritative connection baseline.
- **D-011:** protected auth/connect guard remains required.
- **D-012:** Appearance is a low-vision-oriented workspace with semantic surfaces, presets, and live preview.
- **D-013:** Markdown and sanitized safe HTML rendering are automatic.
- **D-014 · 2026-08-11:** ProjectChat hierarchy is Client → Projects → OpenClaw session tabs.
- **D-015:** custom themes are portable validated data.
- **D-016:** GitHub SOT is append-only/SHA-guarded and excludes secrets/transcripts.
- **D-017:** session disposition invariant is Assigned / Unassigned / Missing / Soft Deleted.
- **D-018:** recovered Missing sessions return to Unassigned with provenance.
- **D-019:** visible product name is ProjectChat; legacy internal `botschat` may remain for compatibility.
- **D-020:** right-click/desktop and double-tap/mobile invoke tab context menu; long-press is retired.
- **D-021:** tab context menu opens below the tab and dismisses on outside click/tap.
- **D-022:** Customize is live/persistent and has no Save button.
- **D-023:** tab drag uses a dedicated handle; attachment overlay is suppressed during tab drag.
- **D-024:** horizontal drop inserts to the left of the orange-highlighted target.
- **D-025:** cross-Project drop inserts at position 1 and leaves origin Project focused.
- **D-026:** Project chevrons expose child sessions; child selection focuses one session, Project selection restores all tabs.
- **D-027 · 2026-08-12:** v2.8.0 and v2.8.1 owner tests failed; neither is a baseline.
- **D-028:** current recovery starts from the exact last known-good ProjectChat line, not current `main`.
- **D-029:** complete final HTML JavaScript lint/syntax gate is mandatory before every publish.
- **D-030:** source-patching GitHub Actions workflows are prohibited for this project.
- **D-031:** a release handoff is incomplete until the candidate is on GitHub Pages and the owner has a directly testable URL.
- **D-032:** `session-manager-turnover.md` is the current handoff companion to this governance file.
- **D-033 · 2026-08-12:** owner ruled v2.7.1 was never device-proven; no ProjectChat build has a recorded PASS. Baseline must be established empirically: publish restored candidate → owner Gate 1 → record PASS blob before any feature work.
- **D-034 · 2026-08-12:** owner tightened the next release scope to drag/drop only (inter- and intra-Project): dedicated handle, orange targets, insert-left, cross-Project move to position 1, attachment-overlay suppression during tab drag, order persistence, mobile touch. Remaining §4.1 items are deferred backlog, not dropped.
- **D-035 · 2026-08-12:** v2.7.1 restored byte-exact to `main` as baseline-verification candidate: commit `2b022ba53536`, blob `c63d8b925af35b533d3edcce3969db57b304b611`, read back byte-identical, all inline scripts pass `node --check`.
- **D-036 · 2026-08-12:** owner corrected the release scope in detail; §4 rewritten as v2.9.0. Drag ghost is the tab, never the file overlay/whole panel; context menu and all its leaf UIs render below the tab; after any cross-Project move the source Project keeps focus and the right-neighbor tab becomes armed.
- **D-037 · 2026-08-12:** ribbon declutter — Download/Share relocate to tab context menu; per-tab Ready dots removed (Working/Error only); Ready + Connected merge into one indicator; wordmark/version leave the ribbon for Configuration; new-session is a bare +.
- **D-038 · 2026-08-12:** owner interacted with restored v2.7.1 on device (menus, rename, drag) — recorded as the proven ProjectChat baseline: blob `c63d8b925af35b533d3edcce3969db57b304b611`, backed up at `.release-backups/session-manager-v290/session-manager-v3.v271.html`.
- **D-039a · 2026-08-12:** v2.9.0 owner test FAILED — long-press opened the tab menu (Android contextmenu event, not the removed timer) and touch drag was stolen by strip scrolling. Mobile sidebar overlay (88vw) also ruled too wide for portrait.
- **D-039b · 2026-08-12:** v2.9.1 rebuilt from proven v2.7.1 (not patched forward): contextmenu guarded by touch flag, touchmove blocked while drag armed, native draggable disabled during touch, portrait ProjectChat sidebar narrowed to min(64vw,280px).
- **D-039 · 2026-08-12:** v2.9.0 built and published from that baseline: commit `475e8ab4da68`. Gates passed pre-publish: full-artifact `node --check` on both inline scripts, structural assertions, jsdom bootstrap smoke (init without uncaught exception, hamburger toggles). Root-caused v2.7.1 defects: file overlay reacted to all drags; menu leaf CSS anchored right / pinned to viewport bottom on mobile; long-press still bound; moveSessionToProject focused the target project.

---

# 11. ARTIFACT INDEX

### Primary
- `session-manager-v3.html` — deployable self-contained application.
- `session-manager-backlog.md` — governance source of truth.
- `session-manager-turnover.md` — current recovery/turnover brief.
- `session-manager-sot.json` — cross-device portable-state journal when present/configured.

### Historical / diagnostic
- `session-manager-v2.2.1-rename-test.html` — historical test artifact only.
- `.release-backups/session-manager-v250/session-manager-v3.v240.html`
- `.release-backups/session-manager-v260/session-manager-v3.v250.html`
- `.release-backups/session-manager-v270/session-manager-v3.v260.html`
- `.release-backups/session-manager-v250/session-manager-backlog.pre-v190.md`
- `.release-backups/session-manager-v260/session-manager-backlog.pre-v110.md`
- `.release-backups/session-manager-v270/session-manager-backlog.pre-v111.md`

### Process references
- `talkbridge/TALKBRIDGE-PLAN-v9.md` — process precedent for baseline discipline, graveyard, rebuild-after-failure, mechanical gates, verification, and owner hardware gate.
- `talkbridge/THE-METHOD.md` — companion method reference if present.
- `talkbridge/HANDOVER.md` — prior handover reference.

---

# 12. MAINTENANCE RULE

Before code: freeze scope here and read the turnover.  
After new evidence: update Lessons/Graveyard.  
After owner ruling: update Decision Log in the same session.  
After FAIL: restore exact proven baseline and rebuild; do not patch-forward.  
After PASS: record exact commit/blob as new baseline.  
Before publish: lint/syntax-check every executable script in final assembled HTML and run structural/smoke gates.  
After publish: read source back and provide the runnable Pages URL.  
Unscheduled ideas remain backlog until deliberately promoted.
