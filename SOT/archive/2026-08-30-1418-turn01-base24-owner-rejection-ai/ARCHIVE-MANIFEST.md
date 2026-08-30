# Turn 01 Base-24 Owner Rejection — AI configuration / supervisor context

**Status:** REJECTED OWNER-GATE EVIDENCE  
**Date:** 2026-08-30  
**Stage:** `base`  
**Rejected candidate:** Base-24

## Owner finding

Base-24 is improved overall but the AI configuration did not inherit the established donor behavior. The gear surface only stores Venice/OpenRouter keys locally and does not operationally activate/prime inference with a validated provider/model plus an SOT supervisor prompt providing context and guardrails.

## Diagnosis

The accepted SOT architecture requires reuse of the existing repository inference credential pattern. The current Base lineage reduced that requirement to passive key fields. By contrast the canonical donor `devstream-test.html` provides model discovery, explicit provider/model validation calls, persisted provider/model choice, provider switching, and sends a system/supervisor message on inference calls.

Therefore Base-24 is incomplete critical functionality, not a cosmetic configuration defect.

## Recovery rule

Base-24 remains failed evidence only and must not become the implementation baseline. The next candidate must regenerate from the accepted Turn-01 clean source chain, preserve the accepted Base storage/index/plan behavior, and integrate the donor inference contract deliberately.

## Required next-candidate behavior

1. Browser-local credentials only; no provider keys written to SOT DB or GitHub.
2. Venice and OpenRouter model discovery where supported.
3. Real provider/model validation call before configuration is considered active.
4. Persist selected provider + model alongside the browser-local key state.
5. Visible active/inactive provider state in Configuration.
6. Every SOT inference call is primed with a fixed SOT supervisor/system prompt before user/project context.
7. Supervisor prompt enforces: database/evidence is truth; inference interprets and proposes; AI never becomes filesystem authority; deterministic validation and approval precede execution; do not invent files, paths, hashes, capacities, duplicate groups, plan state, or execution results.
8. Project evidence/context is supplied after the supervisor prompt and before the operator request.
9. Qualification must prove the supervisor prompt is actually injected into the request path, not merely present as dead text.

## Donor evidence

`devstream-test.html` is the operational donor for provider setup/validation behavior. Its established pattern includes Venice/OpenRouter model loading, Validate actions, provider/model persistence and `role:'system'` injection in provider chat-completion requests.
