# SOT Turn 02 Release D — Continuous SSOT

**Decision date:** 2026-09-29  
**Status:** OWNER APPROVED / TEST CANDIDATE

## Owner definition of working

> “I THINK IT SHOULD JUST GO!!! THERES NO APPROVAL NEEDED ... MAYBE THE SIMPLE THING IS TO COMBINE”

This continues the prior approved rule:

> “either SSOT is right or it isnt ... if theres a detection that the SSOT is stale then it should automatically synch ... when it was made part of ssot that is the only permission needed”

## Baseline

Owner-qualified automatic-SSOT runtime/application: commit `4232e42c805246349a1bffa8afcc7c8ef71c9b07`.

## Observed failure

A service/update interruption leaves an analysis job terminal `INTERRUPTED`, exposes **Restart**, and leaves Queue and Sources as separate owner-facing operational models. The screenshot showed three registered `00 Consolidate` sources with durable partial progress and zero errors, but the owner was still required to reconcile Queue state and press Restart.

This conflicts with the standing SSOT permission model and with the existing graveyard requirement that transport/service interruption must not imply lost evidence or blind rescan.

## Definition of working

1. A registered source is owned by SOT until removed.
2. Staleness automatically queues synchronization.
3. A service interruption automatically recovers unfinished registered-source work. Work interrupted by that runtime startup is recovered directly; any enabled source still marked stale/pending is also automatically queued. No owner Restart is required; older historical INTERRUPTED records whose sources are already current remain history.
4. Existing persisted fingerprints/evidence remain authoritative; recovery uses the existing deduplicated analysis path, so already valid hashes are reused rather than deliberately rehashed.
5. Queue and Sources are no longer separate owner workflows. Analyze presents one **SSOT** surface:
   - **Current** — synchronized;
   - **Syncing** — SOT is maintaining it automatically;
   - **Problem** — SOT cannot continue automatically and owner attention is genuinely required;
   - **Soft Deleted** — registration removed but recoverable.
6. Job records remain durable implementation/diagnostic evidence in the backend and diagnostics repository. They are not shown on the normal owner-facing Analyze screen.
7. Live work takes precedence over historical failure/interruption when determining a source's owner-facing status.
8. Pause/Resume remains available as an explicit global owner control.
9. AI task history/download behavior and all non-Analyze surfaces remain unchanged.

## 2026-09-29 — Owner UI cleanup

**Owner report:** “why do we even need it: It remains secondary/read-only history?” followed by approval to remove it.

**Cause:** the Continuous SSOT candidate still rendered the internal durable job ledger as a collapsed **System history** section on the primary Analyze surface. That exposed implementation machinery the owner does not need for normal SSOT operation, and its chevron also collapsed during refresh.

**Change:** remove **System history** from the normal Analyze UI entirely. Keep the underlying job/event records unchanged for diagnostics and engineering evidence.

**Before / after:** owner-facing internal-history sections on Analyze: **1 → 0**. Durable backend job/history storage: **unchanged**. SSOT status groups: **4 → 4** (`Problem / Syncing / Current / Soft Deleted`).

## Scope

Changed:
- `SOT/sot-turn02-release-d-source-actions.html`
- `SOT/qualify-release-d-autosync.py`
- this plan
- autosync graveyard addendum

Protected:
- `SOT/sot-turn02-release-d-autosync.py` runtime behavior;
- schema 14;
- Release D engine/server;
- hashing and classification rules;
- source identity and filesystem semantics;
- durable job/event history and diagnostics publishing;
- AI task parallel/history/download behavior;
- Estate, Database, Grid, Plan and Activity behavior.

## Mechanical acceptance

Before Continuous SSOT fix:
- interrupted work required owner Restart — FAIL;
- Queue and Sources remained separate owner workflows — FAIL;
- stale registered sources auto-queued — PASS.

Before System History cleanup:
- primary Analyze UI contained one **System history** section — FAIL against the owner-approved simplified SSOT surface;
- durable backend job/history evidence existed — PASS.

Candidate must prove:
- analysis interrupted by the current runtime startup is automatically recovered; stale/pending registered sources are automatically covered on startup; historical INTERRUPTED records whose sources are current are not replayed;
- duplicate recovery remains safe through existing source-level live-work dedupe;
- Analyze contains no Queue/Sources subnav;
- no “Source action needed / Kick off” manual-currentness banner remains;
- source state is Current / Syncing / Problem;
- **System history**, `systemHistoryHtml`, and `.system-history` are absent from the owner-facing Analyze wrapper;
- durable backend history/runtime behavior is not modified by this UI-only cleanup;
- JavaScript parses under Node 22;
- Python runtime/qualifier compile;
- live WSL runtime recovery remains governed by the already-qualified Continuous SSOT runtime.

## Delivery

`install-SOT-turn02-release-d-autosync.sh` remains the Continuous SSOT runtime installer. This cleanup changes only the owner-facing Analyze wrapper and its qualification/records; no WSL runtime patch or database migration is required.
