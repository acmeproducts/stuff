# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-25  
**Date:** 2026-08-30

## Recovery anchor

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Clean Base-22 UI integration source: `integrate-SOT-turn01-base22-ui.py` at commit `603e8a331b13b72a097e9ebb9640e33707279777`.
- Canonical target remains `SOT-turn01-base.html`.
- Base-23 and Base-24 are failed evidence only; neither generated HTML may be used as an implementation input.

## Base-23 qualification failure

Base-23 passed its newly added owner-gate checks but failed `BASE22_ARCHITECTURE_RETAINED — missing 2-copy groups` before installation. Its full `renderIndex` replacement fixed flashing but deleted the protected completed duplicate findings branch. This is recorded in:

- `SOT/archive/2026-08-30-1405-turn01-base23-qualification-failure/ARCHIVE-MANIFEST.md`
- `SOT/archive/2026-08-30-1405-turn01-base23-qualification-failure/GY-010.md`

## Base-24 owner rejection

Base-24 restored the duplicate findings branch and materially improved the owner-tested surface, but failed the owner gate on critical AI functionality.

Observed failure:

- Configuration exposed passive browser-local Venice/OpenRouter key fields but did not implement the established donor setup: model discovery, real provider/model validation, active provider/model state, or mandatory SOT supervisor/system priming for inference requests.

This is recorded in:

- `SOT/archive/2026-08-30-1418-turn01-base24-owner-rejection-ai/ARCHIVE-MANIFEST.md`
- `SOT/archive/2026-08-30-1418-turn01-base24-owner-rejection-ai/GY-011.md`

The authoritative provider donor is `devstream-test.html`. Its operational pattern includes Venice/OpenRouter model discovery, explicit Validate calls, persisted provider/model choice, and `role:'system'` injection into inference requests.

## Base-25 contract

Base-25 is a clean regeneration from accepted pre-base -> clean Base-22 integration. It must incorporate the accepted Base-24 behavior without using Base-24 generated HTML as a source, and it must add the missing operational AI contract from the donor.

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

Configuration must reuse the proven `devstream-test.html` interaction and request pattern rather than inventing passive key fields.

For Venice and OpenRouter:

- credentials remain browser-local only;
- user can load/discover provider models where supported;
- user selects a model;
- **Validate** performs a real provider/model request before the provider is considered active;
- validated provider, selected model and validation state persist browser-locally;
- Configuration visibly distinguishes unconfigured / configured-not-validated / active / validation-error;
- active provider/model can be changed without modifying SOT database state;
- no API key is sent to SOT backend, GitHub, logs, project metadata or plan data.

### 5. SOT supervisor priming is mandatory

Every SOT inference request must place a fixed SOT supervisor/system message before project evidence and before the operator request.

The supervisor contract must establish at minimum:

1. SOT database and deterministic fingerprint/evidence records are factual authority.
2. AI is an analyst/advisor that interprets evidence and proposes actions; it is never filesystem or execution authority.
3. AI must not invent files, paths, hashes, capacities, volume state, duplicate groups, plan state, approvals or execution outcomes.
4. Any proposed action must be expressed as a proposal subject to deterministic validation, plan compilation and required approval before execution.
5. When evidence is missing or stale, say so explicitly rather than filling gaps with assumptions.
6. Preserve project boundaries and identify cross-project implications rather than silently resolving them.
7. Explain recommendations in terms of supplied evidence/provenance.

The request order is:

`supervisor/system prompt -> exact SOT/project/evidence context -> conversation/history where applicable -> operator request`

A supervisor prompt that merely exists in dead UI text does not satisfy this requirement.

### 6. Inference activation / priming

A provider is **active** only after a successful validation call for the selected provider/model. The Insights/inference surface must consume that active provider/model and supervisor contract. If no provider is active, the UI must show a direct configuration requirement rather than silently pretending AI is available.

### 7. Protected architecture

Base-25 must retain:

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

## Mandatory Base-25 qualification

Named gates must include:

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
- all Base-22 canonical selector/cache/default/project-create/storage gates;
- UI/backend syntax, schema 4, public page and rollback gates.

The qualifier must inspect the actual inference request construction and fail if the supervisor text is not injected as the first system message. No planned gate may collapse to generic `UNHANDLED` only.

## Owner gate

After mechanical qualification, owner verifies:

1. completed Index no longer flashes and retains expandable 2 / 3 / 4+ duplicate findings;
2. Plan current/stale/re-index behavior remains correct;
3. Available/Selected scroll, local search and footer Save remain correct;
4. Venice key -> model load -> select -> Validate visibly produces active provider/model state;
5. OpenRouter key -> model load -> select -> Validate visibly produces active provider/model state;
6. invalid credentials/model produce explicit validation failure and do not become active;
7. Insights/inference refuses operation when no provider is active and directs the operator to Configuration;
8. an active provider inference is demonstrably grounded in SOT project/evidence context and constrained by the SOT supervisor guardrails.

Base remains the current stage until all eight pass.
