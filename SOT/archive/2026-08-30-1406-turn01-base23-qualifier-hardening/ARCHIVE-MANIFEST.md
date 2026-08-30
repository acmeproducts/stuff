# Turn 01 Base-23 qualifier hardening archive

**Stage:** `base`
**Date:** 2026-08-30
**Status:** PRE-PATCH ARCHIVE

## Archived state

The current Base-23 qualifier before hardening is `install-SOT-turn01-base23.sh` with blob SHA `02212e67f16542cebf14922c591c82e6427115f7`.

Base-23 product inputs remain unchanged:

- frozen UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`
- clean Base-22 UI integrator: `603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py`
- Base-23 owner-gate integrator: `dac83146154592793e11653de46378a392ab803e/integrate-SOT-turn01-base23-ui.py`
- backend remains live Base-22 build `2026.08.30.sot-turn01-base-22`

## Reason for hardening

A prior Base-22 qualification harness demonstrated defective interrupt behavior: repeated health timeouts continued until the operator interrupted the shell, and the harness reported an incorrect `rc=0`. Before running Base-23 qualification, the launcher is being hardened so Ctrl-C/TERM terminates the qualification process group deterministically and returns exit status 130 instead of allowing a misleading successful return code.

This is qualification-harness hardening only. It does not modify Base-23 product code, the SOT backend, database, service configuration, or the currently running fingerprint worker.
