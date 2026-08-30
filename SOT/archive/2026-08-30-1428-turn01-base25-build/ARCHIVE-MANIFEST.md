# Turn 01 Base-25 build archive

**Stage:** `base`
**Candidate:** Base-25
**Status:** BUILD STARTED — NOT YET MECHANICALLY QUALIFIED
**Date:** 2026-08-30

## Recovery source

- Frozen accepted UI: `SOT-turn01-pre-base.html` @ `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`
- Clean Base-22 UI integrator: `integrate-SOT-turn01-base22-ui.py` @ `603e8a331b13b72a097e9ebb9640e33707279777`
- Base-24 generated HTML is prohibited as an implementation input.
- Base-24 integration logic may be cleanly regenerated from the accepted source chain before the Base-25 AI delta is applied.

## Base-25 scope

Preserve accepted Base-24 UX behavior and add the missing operational AI contract:

- Venice and OpenRouter browser-local keys;
- provider model discovery;
- real provider/model validation before activation;
- persisted active provider/model state;
- explicit inactive/error states;
- fixed SOT supervisor prompt injected as first system message;
- project/evidence context inserted after supervisor and before operator request;
- Insights uses only an active validated provider/model;
- no credential transmission to SOT backend/GitHub/project metadata/plan data.

## Governance

This archive was created before Base-25 implementation writes. Base-25 remains unqualified until the pinned installer emits the exact mechanical qualification success marker.
