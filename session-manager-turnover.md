# ProjectChat / Session Manager — Turnover Brief

**Date:** 2026-08-12  
**Primary application:** `session-manager-v3.html`  
**Governance:** `session-manager-backlog.md` v1.17.0  
**Repository:** `acmeproducts/stuff`  
**Owner/device gate:** Confi

## 1. Current state

The current `main/session-manager-v3.html` is **v2.9.1**, not v2.8.1.

- commit: `a120817732b92492fdb54d2115aac20b24995aa4`
- observed current blob: `a936cf56949a6590bd562f3ce24116400efd6b5e`
- GitHub Pages deployment run: `31626970093`
- deployment conclusion: success
- release state: **published candidate; owner physical-device gate pending**

Do not overwrite v2.9.1 with the older v2.8.2 repair artifact. The v2.8.2 startup-overlay fix is already superseded by the v2.9.1 line.

## 2. Lineage and evidence

### Authoritative historical functional baseline
The only recorded owner-proven functional baseline remains v2.1.0:

- blob `27ee8fabe42a185d194b4af4d668e81b54a8b8c8`
- restore commit `0d5ed4c19ce66c45e5ad6722e84f9ecf13c19875`

The connection/auth/device-identity subsystem derived from that line remains protected.

### Clean ProjectChat input used for v2.9
v2.9 was rebuilt from the v2.7.1 ProjectChat artifact:

- historical commit `9b3bdb362c47b9ffede5b6a5271e27a1f95f988f`
- byte-exact restore commit `2b022ba5353627049a835257db072b7579a454cd`
- blob `c63d8b925af35b533d3edcce3969db57b304b611`

This was the clean ProjectChat build input, but it is **not recorded as owner-proven**.

### Failed releases
- v2.8.0 — owner FAIL.
- v2.8.1 — owner FAIL; page rendered but core ribbon/session interaction was inert.
- v2.9.0 — owner FAIL; long-press still opened the tab menu and touch drag did not work.

Failed candidates are evidence/donors only. Do not patch-forward from them.

## 3. What v2.9.1 changed

v2.9.1 is a targeted mobile-interaction correction on top of the rebuilt v2.9 scope:

1. Android long-press-generated `contextmenu` is guarded during touch use, so long-press should no longer open the tab menu.
2. Once custom touch drag is armed, native scrolling on the tab strip is blocked so the browser does not cancel the gesture with `pointercancel`.
3. Native HTML drag is disabled for the touched tab while the custom touch gesture owns it.
4. Portrait ProjectChat sidebar is narrowed to `min(64vw, 280px)`.

The empty `#tabContextRoot` remains `pointer-events:none`; v2.9.1 uses document-level outside-click handling for menu dismissal, avoiding the v2.8.1 full-screen interaction blocker.

## 4. Active v2.9.1 scope under owner test

The owner test should judge only the current release scope:

### Regression
- Gateway connects.
- Sessions load.
- Hamburger/sidebar works.
- Top ribbon works.
- Session tap opens history.
- Send/chat round-trip works.
- Stop works during an active agent run.
- Rename persists to the official OpenClaw Control UI.
- No auth/signature regression.

### Mobile tab interaction
- Single tap selects normally.
- Long-press does **not** open the context menu.
- Double-tap opens the context menu below the invoking tab.
- Outside tap dismisses the menu.
- Touch drag starts and continues instead of being cancelled by horizontal strip scrolling.
- Tab drag does not invoke the file/attachment overlay.
- Orange insert-left target appears and intra-Project reorder works.
- Cross-Project target highlights and moves the session into position 1.
- After cross-Project move or Assign, source Project remains focused and the proper surviving tab becomes active.
- Download/Share work from the tab context menu.
- Portrait sidebar leaves enough chat width.

### Lifecycle/regression
- Soft delete / Recycle Bin semantics unchanged.
- Missing / Unassigned disposition unchanged.
- Attachments unchanged.
- Appearance/custom themes/rendering unchanged.
- SOT does not write secrets.

## 5. Scope that is intentionally deferred

These features were part of earlier v2.8 thinking but are **not** v2.9.1 pass/fail criteria:

- Project chevrons with nested session rows;
- nested session click = single-session-only right-pane view;
- Project click = restore all Project tabs after nested focus;
- full tab text/hover enhancement;
- Customize becomes live/persistent with no Save button;
- broader ProjectChat preset/gear geometry refinement beyond the v2.9.1 sidebar correction;
- richer Project ordering/management.

Current source still has a Customize **Save** button. Do not call that a v2.9.1 defect; the governance plan now explicitly defers live/no-Save customization to the next release.

## 6. Mandatory release discipline for any follow-up

1. Read `session-manager-backlog.md` and this turnover file first.
2. Re-read current `main` immediately before any write. Never overwrite a newer build with an older locally validated artifact.
3. Modify only `session-manager-v3.html` for application behavior.
4. Preserve the self-contained readable single-file architecture.
5. Do not use GitHub Actions to manufacture/patch source.
6. Extract every executable inline script from the final assembled HTML and syntax-check each complete script before publishing.
7. Assert startup/navigation handlers and active-scope interaction markers mechanically.
8. Publish by direct existing-file update using a fresh SHA.
9. Read back the exact published source and verify version/blob/markers.
10. Verify Pages deployment and hand the owner the runnable Pages URL.
11. Owner hardware evidence decides PASS/FAIL.

## 7. What happens next

### If v2.9.1 passes
Promote the exact owner-passed v2.9.1 blob to the working ProjectChat baseline and start **v2.10 — Project navigation + tab polish** from that exact artifact.

Recommended v2.10 sequence:

1. Project chevrons + nested session rows.
2. Nested session focus (one session on right) and Project-row restore (all Project tabs).
3. Full tab label visibility/hover treatment with touch-safe equivalent.
4. Customize live/persistent, remove Save, retain outside dismissal/reset.
5. ProjectChat preset/Configuration gear low-vision geometry refinement.
6. Then richer Project ordering/management and keyboard-accessible equivalents.

Do not combine multi-instance architecture with v2.10.

### If v2.9.1 fails
Record the exact failing gesture/control and observed behavior first. Do not stack emergency patches onto a failed candidate. Rebuild the required correction from the declared clean input while preserving the protected connection subsystem, then run the full validation/publish/read-back pipeline.

## 8. Strategic direction after stable ProjectChat

Only after the single-instance ProjectChat interaction model is owner-proven:

- named Gateway/instance profiles with isolated auth/device state;
- simultaneous multi-instance desk;
- global search and operations across instances;
- health/version summaries and per-instance diagnostics;
- safe profile/theme/project import/export and portable SOT;
- platform abstraction later.

The immediate decision point is therefore simple: **owner-test v2.9.1 before further application-code expansion.**
