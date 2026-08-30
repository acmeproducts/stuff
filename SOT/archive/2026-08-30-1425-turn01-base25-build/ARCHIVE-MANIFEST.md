# Turn 01 Base-25 Build Archive

**Status:** BUILD STARTED — AWAITING MECHANICAL QUALIFICATION  
**Date:** 2026-08-30  
**Stage:** `base`  
**Candidate:** Base-25

## Recovery state

- Repository main observed before this build: `4704e0f4108ea1d33a6bed5433cdc4f9650f0299`.
- Frozen UI recovery anchor remains `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`.
- Clean Base-22 UI integrator remains `603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py`.
- Base-24 generated/installed HTML is rejected owner-gate evidence and is not a release baseline.
- Base-24 behavior may be reproduced only through the governed clean integration chain from the frozen recovery anchor.

## Base-25 scope

Base-25 retains the accepted Base-24 storage/index/plan/selector corrections and restores critical inference functionality from the `devstream-test.html` donor pattern:

- browser-local Venice/OpenRouter credentials;
- model discovery;
- real provider/model validation before activation;
- persisted active provider/model state;
- operational Insights inference;
- mandatory first system message containing the SOT supervisor guardrails;
- exact project/evidence context after the supervisor and before conversation/operator input;
- explicit no-active-provider state.

## Protection

This archive exists before Base-25 implementation files are written. Any failed Base-25 candidate is evidence only and must not become a patch-forward baseline.
