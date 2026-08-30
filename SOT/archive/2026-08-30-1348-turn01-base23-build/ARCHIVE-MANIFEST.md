# Turn 01 Base-23 Build Record

**Stage:** `base`
**Status:** BUILT — AWAITING MECHANICAL QUALIFICATION
**Date:** 2026-08-30

## Recovery anchor

- frozen pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`
- Base-22 installed runtime is not an input.
- backend remains the mechanically qualified Base-22 backend build `2026.08.30.sot-turn01-base-22`; Base-23 changes only the owner-rejected UI/state presentation layer.

## Build chain

1. Generate the canonical storage/project/duplicate UI architecture from frozen pre-base with `603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py` as a clean build-stage transform.
2. Apply the Base-23 owner-gate correction with `dac83146154592793e11653de46378a392ab803e/integrate-SOT-turn01-base23-ui.py` to that same-run clean intermediate.
3. Qualify and cut over only the resulting HTML through `ce901c5ef0164a65fefa83b99b8b97fd8bbfcd36/install-SOT-turn01-base23.sh`.

## Base-23 correction

- completed Index is no longer periodically rerendered;
- active Index refresh uses silent status updates rather than a Loading flash;
- Plan separates Current Plan from Previous/Stale Plan;
- no-current-evidence becomes persistent recovery UI with Re-index action;
- successful Generate Plan renders Current Plan immediately;
- Available Folders and Selected are independently scrollable;
- Available Folders has local-only search over cached listing;
- selector commit button moves to outer modal footer beside Cancel.

## Required qualification marker

`=== TURN 01 BASE-23 MECHANICALLY QUALIFIED ===`
