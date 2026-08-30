# Turn 01 Base-25 build archive

**Stage:** `base`
**Candidate:** Base-25
**Status:** BUILT — AWAITING MECHANICAL QUALIFICATION
**Date:** 2026-08-30

## Recovery source

- Frozen accepted UI: `SOT-turn01-pre-base.html` @ `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`
- Clean Base-22 UI integrator: `integrate-SOT-turn01-base22-ui.py` @ `603e8a331b13b72a097e9ebb9640e33707279777`
- Base-24 generated HTML is prohibited as an implementation input.
- Base-24 behavior is regenerated from the clean source chain before the Base-25 AI delta is applied.

## Base-25 implementation

- Base-25 AI integrator: `integrate-SOT-turn01-base25-ai.py` @ `ff90636129ec2fb51a274b7f3af1307d629a802d`
- Base-25 install/qualification packet: `install-SOT-turn01-base25.sh` @ `7dcf2ac4ed02b1a10d168d08118e5d223e414260`

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

## Qualification contract

The packet rebuilds from frozen pre-base -> clean Base-22 -> clean regenerated Base-24 behavior -> Base-25 AI delta, syntax-checks all integrators and final JavaScript, verifies protected Index/Plan/selector behavior, verifies the actual inference request ordering, checks unchanged schema/backend/storage authority, archives live HTML before cutover, and rolls back automatically on post-cutover failure.

Base-25 remains unqualified until the pinned installer emits:

`=== TURN 01 BASE-25 MECHANICALLY QUALIFIED ===`
