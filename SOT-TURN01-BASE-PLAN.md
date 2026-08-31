# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-28  
**Date:** 2026-08-31

## Recovery anchor

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Clean Base-22 UI integration source: `integrate-SOT-turn01-base22-ui.py` at commit `603e8a331b13b72a097e9ebb9640e33707279777`.
- Clean Base-24 behavior integration source: `integrate-SOT-turn01-base24-ui.py` at commit `083aa1334208b1e6995fa18852e82722a815f331`.
- Operational AI donor: `devstream-test.html`.
- Canonical target remains `SOT-turn01-base.html`.
- Base-23 through Base-27 are failed evidence. No generated HTML from those candidates may be used as implementation input.

## Failure history governing Base-28

- **Base-23 / GY-010:** full `renderIndex` replacement deleted protected duplicate findings.
- **Base-24 / GY-011:** passive AI key fields did not reproduce operational donor behavior or supervisor priming.
- **Base-25 / GY-012:** installer declared qualification although the owner-facing browser hit a JavaScript syntax/boot failure. This established the permanent exact-generated and exact-public parse + browser-boot floor.
- **Base-26 / GY-013:** whole-document compatibility-token lint rejected inherited code before the real parser/browser gates.
- **Base-27 / GY-014:** the AI integrator replaced `openConfig()` wholesale and deleted protected `Default Target` / `Default Backup` controls. Qualification stopped before cutover at `DEFAULT_TARGET missing`.

Base-27 failure evidence:

- `SOT/archive/2026-08-31-0038-turn01-base27-qualification-failure/ARCHIVE-MANIFEST.md`
- `SOT/archive/2026-08-31-0038-turn01-base27-qualification-failure/GY-014.md`

## Base-28 contract

Base-28 is regenerated from accepted pre-base -> clean Base-22 -> clean Base-24 behavior, then a newly authored Base-28 AI/boot integration. It does **not** consume any failed generated HTML.

### Retained product behavior

1. **Index** — active `Queued/WIP/Paused` refresh is silent; completed Index does not poll-rerender; 2-copy, 3-copy, 4+ duplicate summaries and drilldown remain; Re-index remains available.
2. **Plan** — Current Plan vs Previous/Stale Plan remains explicit; successful generation immediately shows current plan; missing evidence remains persistent with `Re-index now`; persisted valid evidence remains usable despite transient Source unavailability.
3. **Canonical storage selector** — one role-driven selector for Source/Target/Backup/defaults; move semantics; local Available search only; Available and Selected independently scroll; Save/Use in outer modal footer; no implicit storage rescan on selection/save.
4. **Configuration composition** — `Default Target` and `Default Backup` remain first-class protected controls in the same Configuration surface as operational AI. AI integration may not replace or bypass storage-default controls.
5. **Operational AI** — Venice/OpenRouter browser-local credentials, model discovery, explicit model selection, real Validate call before activation, persisted provider/model/validation state, visible active/error state, and no key persistence to SOT backend/GitHub/logs/project metadata/plan data.
6. **Supervisor priming** — every inference request order remains: `supervisor/system prompt -> exact SOT/project/evidence context -> conversation/history -> operator request`.
7. **Inference activation** — Insights refuses inference when no validated provider is active and directs the operator to Configuration.

## Permanent release-quality floor

No SOT candidate is mechanically qualified until the exact generated artifact and exact canonical public read-back each pass independent executable-script parsing, combined-script parsing, and a real Chrome/Edge browser boot with application-root sentinel and zero syntax/uncaught initialization errors. Cutover occurs only after generated-artifact gates pass. If the browser harness is unavailable, qualification is blocked. `MECHANICALLY QUALIFIED` and the test URL print only after all public gates pass. Any failure is archived and the next candidate is rebuilt from governed clean lineage.

## Protected architecture

Base-28 must retain:

- one shared storage authority/catalog/cache;
- Source/Target/Backup/default selector normalization;
- `Default Target` and `Default Backup` Configuration controls;
- configured project creation with Source + Target and inherited default Target/Backup;
- no manual Preflight UI;
- assignment-time validity and operation-boundary revalidation;
- Windows-native dynamic inventory/capacity/browse behavior;
- schema 4 and existing project data;
- duplicate cardinality endpoint/drilldown;
- evidence-only planning independence;
- rollback-before-cutover discipline;
- current backend build `2026.08.30.sot-turn01-base-22` unchanged during this UI candidate.

## Mandatory Base-28 named gates

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
- `DEFAULT_TARGET`
- `DEFAULT_BACKUP`
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

## Owner gate

Only after Base-28 mechanical qualification, owner verifies protected Index/Plan/selector behavior, Default Target/Backup configuration, Venice/OpenRouter model load + validation + activation, invalid-provider handling, no-provider Insights refusal, and useful evidence-grounded supervised inference.

Base remains the current stage until owner checks pass.
