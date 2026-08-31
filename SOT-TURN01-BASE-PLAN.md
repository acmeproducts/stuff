# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-26  
**Date:** 2026-08-30

## Recovery anchor

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Clean Base-22 UI integration source: `integrate-SOT-turn01-base22-ui.py` at commit `603e8a331b13b72a097e9ebb9640e33707279777`.
- Canonical target remains `SOT-turn01-base.html`.
- Base-23, Base-24 and Base-25 are failed evidence only. No generated HTML from those candidates may be used as an implementation input.

## Failure history relevant to Base-26

### Base-23

Base-23 failed qualification because its full `renderIndex` replacement deleted protected completed-state duplicate findings. Recorded in `GY-010`.

### Base-24

Base-24 restored the duplicate findings behavior but failed owner testing because AI configuration did not reproduce the operational donor pattern or mandatory supervisor priming. Recorded in `GY-011`.

### Base-25

Base-25 added operational Venice/OpenRouter configuration and supervisor/evidence request ordering. Its installer reported `NODE_UI ok` and full mechanical qualification, but the owner-facing browser then produced a JavaScript syntax error.

That is a mechanical qualification failure, not an owner-testing burden. It is recorded in:

- `SOT/archive/2026-08-30-2348-turn01-base25-owner-rejection-js-syntax/ARCHIVE-MANIFEST.md`
- `SOT/archive/2026-08-30-2348-turn01-base25-owner-rejection-js-syntax/GY-012.md`

The old syntax gate is formally declared insufficient because it validated an intermediate extraction rather than proving that the exact public artifact loaded and booted without parser/runtime initialization failure.

## Base-26 contract

Base-26 is a clean regeneration from the accepted pre-base -> clean Base-22 integration lineage. It must reintroduce the Base-24 accepted UX corrections and the Base-25 AI contract without using Base-24/Base-25 generated HTML as a source.

### 1. Index behavior retained

- `Queued` / `WIP` / `Paused`: refresh silently without replacing the surface with a Loading placeholder.
- `Closed`: periodic polling does not rerender the Index surface.
- `Closed`: retain 2-copy, 3-copy and 4+ duplicate summaries plus expandable drill-down.
- Re-index remains available after completion.

### 2. Plan behavior retained

- Clearly separate **Current Plan** from **Previous / Stale Plan**.
- Successful generation displays Current Plan immediately.
- Missing current fingerprint evidence is a persistent inline state with direct **Re-index now** recovery.
- Valid persisted evidence remains sufficient for planning even if Source storage is transiently offline.

### 3. Canonical selector behavior retained

One role-driven selector remains authoritative for Source, Target, Backup, Default Target and Default Backup.

- Available ↔ Selected move semantics.
- Available Folders client-side search over cached listing only.
- Available and Selected independently scroll.
- Save/Use action lives beside Cancel in the outer modal footer.
- Selection/save performs no implicit storage rescan.

### 4. Operational AI provider configuration

Configuration must reuse the proven `devstream-test.html` interaction/request pattern.

For Venice and OpenRouter:

- credentials remain browser-local only;
- model discovery/load is operational;
- user selects a model;
- **Validate** performs a real provider/model request before activation;
- validated provider/model/validation state persist browser-locally;
- UI distinguishes unconfigured / configured-not-validated / active / validation-error;
- active provider/model can be changed without SOT database mutation;
- no API key is sent to the SOT backend, GitHub, logs, project metadata or plan data.

### 5. Mandatory SOT supervisor priming

Every inference request must begin with a fixed SOT supervisor/system message before project evidence and before the operator request.

The supervisor must establish that:

1. SOT database and deterministic fingerprint/evidence records are factual authority.
2. AI is analyst/advisor only, never filesystem, approval or execution authority.
3. AI must not invent files, paths, hashes, capacities, volume state, duplicate groups, plan state, approvals or execution outcomes.
4. Proposed actions remain proposals pending deterministic validation, plan compilation, approval and execution.
5. Missing/stale/conflicting evidence must be stated explicitly.
6. Project boundaries and cross-project implications must be preserved and surfaced.
7. Recommendations must be explained from supplied evidence/provenance.

Required request order:

`supervisor/system prompt -> exact SOT/project/evidence context -> conversation/history -> operator request`

A prompt present only as UI text or dead code does not satisfy the contract.

### 6. Inference activation

A provider is active only after successful validation for the selected provider/model. Insights must consume only the active provider/model. With no active provider, Insights must explicitly direct the operator to Configuration.

## Mandatory release-quality floor — no preventable parser/boot defects may reach the owner

This section is a hard governance rule for **every subsequent SOT candidate and stage**, not merely Base-26.

The builder owns all preventable syntax/boot verification. Owner testing is reserved for actual owner/device judgment, not discovering parser errors that automation can detect.

A candidate is **not mechanically qualified** until all of the following are proven against the exact artifact under test:

1. **Declared-source proof** — verify the exact clean source lineage and generator/integrator identities before generation.
2. **Per-script parse gate** — extract every executable inline `<script>` block from the complete generated HTML and syntax-parse each script independently. Any script parse failure blocks cutover.
3. **Combined-script parse gate** — syntax-parse the combined executable JavaScript bundle as an additional consistency check.
4. **Generated-artifact identity gate** — hash and record the exact candidate HTML before cutover.
5. **Pre-cutover boot gate** — execute a real browser/DOM boot smoke test against the exact generated candidate and fail on any `SyntaxError`, uncaught exception, rejected initialization promise, or missing application-root render.
6. **Cutover only after gates 1-5 pass.**
7. **Exact public read-back** — fetch the canonical public URL after cutover and verify release marker/hash/identity against the intended candidate.
8. **Public per-script parse gate** — re-extract every executable script from the publicly fetched HTML and syntax-parse those exact bytes independently.
9. **Public combined-script parse gate** — syntax-parse the combined script payload from the public read-back.
10. **Public browser boot gate** — load the exact canonical public URL in an automated browser/DOM harness and fail on any JavaScript syntax error, uncaught exception, initialization abort, missing application root, or critical console error.
11. **No silent waiver** — if the environment cannot execute the browser boot gate, qualification is BLOCKED. The builder must add/repair the harness; the owner is not used as the parser/boot harness.
12. **Success marker last** — `MECHANICALLY QUALIFIED` and a test URL may be emitted only after all public-artifact gates pass.
13. **Failure means archive/rebuild** — any failure is archived before correction and the next candidate is rebuilt from the governed clean lineage; the failed generated artifact is not patched forward.

A static marker check, a successful HTTP 200, or `node --check` against one intermediate extraction is explicitly insufficient evidence of a testable release.

## Protected architecture

Base-26 must retain:

- one shared storage authority and catalog/cache;
- Source/Target/Backup/default selector normalization;
- project creation with Source + Target and default Target/Backup inheritance;
- no manual Preflight UI;
- assignment-time validity;
- Windows-native inventory/capacity/browse with stdin PowerShell transport;
- schema 4 and all existing project data;
- duplicate cardinality endpoint and drill-down;
- evidence-only planning independence;
- rollback-before-cutover discipline.

## Mandatory Base-26 named gates

In addition to all protected Base-22/Base-24/Base-25 behavior gates, qualification must include at minimum:

- `INDEX_ACTIVE_REFRESH_NO_LOADING_FLASH`
- `INDEX_COMPLETED_NO_POLL_RERENDER`
- `INDEX_COMPLETED_DUPLICATE_2`
- `INDEX_COMPLETED_DUPLICATE_3`
- `INDEX_COMPLETED_DUPLICATE_4PLUS`
- `INDEX_COMPLETED_DUPLICATE_DRILLDOWN`
- `PLAN_CURRENT_STALE_SEPARATION`
- `PLAN_GENERATE_SUCCESS_VISIBLE_CURRENT`
- `PLAN_NO_EVIDENCE_PERSISTENT_RECOVERY`
- `PLAN_REINDEX_ACTION`
- `AVAILABLE_PANEL_SCROLL`
- `SELECTED_PANEL_SCROLL`
- `AVAILABLE_SEARCH_PRESENT`
- `AVAILABLE_SEARCH_LOCAL_ONLY`
- `SELECTOR_COMMIT_IN_MODAL_FOOTER`
- `SELECTOR_COMMIT_NOT_IN_PANEL3`
- `AI_VENICE_MODEL_DISCOVERY`
- `AI_OPENROUTER_MODEL_DISCOVERY`
- `AI_REAL_PROVIDER_VALIDATION`
- `AI_ACTIVE_PROVIDER_MODEL_STATE`
- `AI_KEYS_BROWSER_LOCAL_ONLY`
- `AI_SUPERVISOR_PROMPT_PRESENT`
- `AI_SUPERVISOR_FIRST_SYSTEM_MESSAGE`
- `AI_PROJECT_EVIDENCE_AFTER_SUPERVISOR`
- `AI_NO_ACTIVE_PROVIDER_EXPLICIT_STATE`
- `JS_GENERATED_PER_SCRIPT_PARSE`
- `JS_GENERATED_COMBINED_PARSE`
- `JS_GENERATED_BROWSER_BOOT`
- `PUBLIC_ARTIFACT_IDENTITY`
- `JS_PUBLIC_PER_SCRIPT_PARSE`
- `JS_PUBLIC_COMBINED_PARSE`
- `JS_PUBLIC_BROWSER_BOOT`
- `PUBLIC_APP_ROOT_RENDERED`
- `PUBLIC_ZERO_SYNTAX_ERRORS`
- `PUBLIC_ZERO_UNCAUGHT_BOOT_ERRORS`

No planned gate may collapse to generic `UNHANDLED` only.

## Owner gate

Only after all mechanical gates above pass, owner verifies:

1. completed Index remains stable and retains expandable duplicate findings;
2. Plan current/stale/re-index behavior remains correct;
3. Available/Selected scroll, local search and footer Save remain correct;
4. Venice key -> model load -> select -> Validate produces visible active provider/model state;
5. OpenRouter key -> model load -> select -> Validate produces visible active provider/model state;
6. invalid credentials/model remain inactive with explicit error;
7. Insights refuses inference without an active provider and directs to Configuration;
8. active-provider inference is visibly useful and grounded in current SOT evidence under supervisor guardrails.

Base remains the current stage until all eight owner checks pass.