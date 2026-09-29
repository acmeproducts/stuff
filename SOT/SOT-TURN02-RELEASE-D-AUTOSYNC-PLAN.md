# SOT Turn 02 Release D — Automatic SSOT Synchronization

**Decision date:** 2026-09-29  
**Status:** OWNER APPROVED / TEST CANDIDATE

## Owner definition of working

> “either SSOT is right or it isnt ... if theres a detection that the SSOT is stale then it should automatically synch ... when it was made part of ssot that is the only permission needed”

## Cause

Release D already detects source metadata drift and marks a registered source stale, but detection stops at `stale=1`. It does not enqueue the existing deduplicated analysis path. The UI then incorrectly turns ordinary SSOT maintenance into a second owner approval by showing **Action Needed / Analyze**.

## Change

1. Registration is standing permission to maintain that source in SSOT.
2. Registering a new source automatically queues its first synchronization.
3. Whenever the existing freshness detector reports a changed registered source, SOT automatically calls the existing `enqueue_info()` path.
4. Existing live-source dedupe remains authoritative, so repeated detection, double taps, startup checks, and overlapping triggers do not create duplicate work.
5. Queue scheduling, worker counts, hashing, classification, database schema, source identity, and filesystem semantics are unchanged.
6. Sources becomes owner-facing SSOT state only: **Current / Updating / Problem / Registered**. There is no routine manual Analyze or Analyze again control.
7. **Problem** is exceptional: synchronization failed or the source cannot be maintained. Queue remains the machinery/history surface.
8. Existing AI task-instance history and Markdown/JSON download controls remain intact.

## Mechanical checks

Before: registered/stale sources required another manual Analyze action.

After candidate checks:
- registration automatically queues SSOT synchronization — PASS;
- stale detection automatically queues SSOT synchronization — PASS;
- source UI contains Current / Updating / Problem / Registered — PASS;
- routine manual re-analysis controls are absent — PASS;
- candidate JavaScript parses under Node 22 — PASS.

Live WSL/runtime behavior remains unverified until the owner installs the qualified runtime and exercises it against the real sources.
