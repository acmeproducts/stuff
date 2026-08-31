# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-27  
**Date:** 2026-08-31

## Recovery anchor

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Clean Base-22 UI integration source: `integrate-SOT-turn01-base22-ui.py` at commit `603e8a331b13b72a097e9ebb9640e33707279777`.
- Clean Base-24 behavior integration source: `integrate-SOT-turn01-base24-ui.py` at commit `083aa1334208b1e6995fa18852e82722a815f331`.
- Operational AI donor: `devstream-test.html`.
- Canonical target remains `SOT-turn01-base.html`.
- Base-23 through Base-26 are failed evidence. No generated HTML from those candidates may be used as implementation input.

## Failure history governing Base-27

- **Base-23 / GY-010:** full `renderIndex` replacement deleted protected duplicate findings.
- **Base-24 / GY-011:** passive AI key fields did not reproduce operational donor behavior or supervisor priming.
- **Base-25 / GY-012:** installer declared qualification although the owner-facing browser hit a JavaScript syntax/boot failure. This established the permanent exact-generated and exact-public parse + browser-boot floor.
- **Base-26 / GY-013:** qualification correctly stopped before cutover, but for the wrong reason. A broad whole-document token lint rejected inherited optional-chaining text (`?.`) before the real parser/browser gates could evaluate the exact artifact. This is a qualifier-design defect, not an application/storage failure.

Base-26 failure evidence:

- `SOT/archive/2026-08-31-0017-turn01-base26-qualification-failure/ARCHIVE-MANIFEST.md`
- `SOT/archive/2026-08-31-0017-turn01-base26-qualification-failure/GY-013.md`

## Base-27 contract

Base-27 is regenerated from accepted pre-base -> clean Base-22 -> clean Base-24 behavior, then a newly authored Base-27 AI/boot delta. It does **not** consume Base-25 or Base-26 generated HTML.

### Retained product behavior

1. **Index** — active `Queued/WIP/Paused` refresh is silent; completed Index does not poll-rerender; 2-copy, 3-copy, 4+ duplicate summaries and drilldown remain; Re-index remains available.
2. **Plan** — Current Plan vs Previous/Stale Plan remains explicit; successful generation immediately shows current plan; missing evidence remains persistent with `Re-index now`; persisted valid evidence remains usable despite transient Source unavailability.
3. **Canonical storage selector** — one role-driven selector for Source/Target/Backup/defaults; move semantics; local Available search only; Available and Selected independently scroll; Save/Use in outer modal footer; no implicit storage rescan on selection/save.
4. **Operational AI** — Venice/OpenRouter browser-local credentials, model discovery, explicit model selection, real Validate call before activation, persisted provider/model/validation state, visible active/error state, and no key persistence to SOT backend/GitHub/logs/project metadata/plan data.
5. **Supervisor priming** — every inference request order remains: `supervisor/system prompt -> exact SOT/project/evidence context -> conversation/history -> operator request`.
6. **Inference activation** — Insights refuses inference when no validated provider is active and directs the operator to Configuration.

## Base-27 qualification correction

The whole-document compatibility-token rejection used by Base-26 is prohibited. Complete-artifact compatibility is determined by executable parser/browser gates, not grep-like token presence.

If a compatibility-style lint is used for newly authored Base-27 code, it may inspect only the new Base-27 injected delta. It must not reject preserved ancestor code.

## Permanent release-quality floor

No SOT candidate is mechanically qualified until the following are proven against the exact artifact under test:

1. declared clean source and integrator identities recorded;
2. exact generated HTML hashed;
3. every executable inline script from exact generated HTML parsed independently;
4. combined generated script payload parsed;
5. exact generated candidate served pre-cutover and loaded in real Chrome/Edge headless browser;
6. browser boot must show application sentinel/root and zero syntax errors, uncaught initialization errors or rejected initialization promises;
7. cutover occurs only after generated-artifact gates pass;
8. canonical public URL fetched after cutover and SHA-256 must equal candidate SHA-256;
9. every public-readback executable script parsed independently;
10. combined public-readback scripts parsed;
11. canonical public URL browser-booted with the same zero-error/root-render requirements;
12. if browser harness is unavailable, qualification is BLOCKED — owner testing is not a parser harness;
13. `MECHANICALLY QUALIFIED` and test URL print only after all public gates pass;
14. any failure is archived before correction and the next candidate is rebuilt from governed clean lineage.

## Protected architecture

Base-27 must retain:

- one shared storage authority/catalog/cache;
- Source/Target/Backup/default selector normalization;
- configured project creation with Source + Target and inherited default Target/Backup;
- no manual Preflight UI;
- assignment-time validity and operation-boundary revalidation;
- Windows-native dynamic inventory/capacity/browse behavior;
- schema 4 and existing project data;
- duplicate cardinality endpoint/drilldown;
- evidence-only planning independence;
- rollback-before-cutover discipline;
- current backend build `2026.08.30.sot-turn01-base-22` unchanged during this UI candidate.

## Mandatory Base-27 named gates

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
- `GENERATED_APP_ROOT_RENDERED`
- `PUBLIC_ARTIFACT_IDENTITY`
- `JS_PUBLIC_PER_SCRIPT_PARSE`
- `JS_PUBLIC_COMBINED_PARSE`
- `JS_PUBLIC_BROWSER_BOOT`
- `PUBLIC_APP_ROOT_RENDERED`
- `PUBLIC_ZERO_SYNTAX_ERRORS`
- `PUBLIC_ZERO_UNCAUGHT_BOOT_ERRORS`

No named gate may collapse to a generic unchecked marker.

## Owner gate

Only after Base-27 mechanical qualification, owner verifies:

1. completed Index remains stable and duplicate findings/drilldown are intact;
2. Plan current/stale/re-index behavior is correct;
3. Available/Selected scroll, local search and footer Save are correct;
4. Venice key -> model load -> select -> Validate -> visible active state;
5. OpenRouter key -> model load -> select -> Validate -> visible active state;
6. invalid credentials/model remain inactive with explicit error;
7. Insights refuses inference without active provider and directs to Configuration;
8. active-provider inference is useful, grounded in current SOT evidence, and constrained by supervisor guardrails.

Base remains the current stage until all eight owner checks pass.
