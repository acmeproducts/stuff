# Turn 01 Base-22 qualification interrupt evidence

**Stage:** `base`  
**Status:** QUALIFICATION HARNESS FAILURE EVIDENCE  
**Date:** 2026-08-30

## Evidence

An earlier Base-22 r2 qualification attempt began at `20260830-125808` while the live health endpoint was not responding. The harness retried health repeatedly at roughly four-second intervals. The operator interrupted it with Ctrl-C after attempt 16.

The interrupted run then printed `FINAL qualification failed rc=0 rollback_attempted=0`. That `rc=0` is incorrect for an operator interrupt and is qualification-harness behavior, not product evidence.

A later independent Base-22 r2 qualification at `20260830-131334` completed successfully and installed Base-22. Base-22 was subsequently rejected by owner testing for UI/state defects and is not the current implementation target.

## Governance consequence

- Do not interpret the interrupted `125808` run as a Base-22 product failure.
- Do not reuse the Base-22 harness interrupt behavior.
- Qualification harnesses must have a short bounded pre-health window and explicit INT/TERM handling so Ctrl-C terminates promptly with a nonzero status and cannot report `rc=0`.
- No product/runtime change is authorized by this archive entry.
