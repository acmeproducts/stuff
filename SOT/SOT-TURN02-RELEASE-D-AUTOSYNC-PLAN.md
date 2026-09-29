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
3. A service interruption automatically recovers unfinished registered-source work after runtime startup. No owner Restart is required.
4. Existing persisted fingerprints/evidence remain authoritative; recovery uses the existing deduplicated analysis path, so already valid hashes are reused rather than deliberately rehashed.
5. Queue and Sources are no longer separate owner workflows. Analyze presents one **SSOT** surface:
   - **Current** — synchronized;
   - **Syncing** — SOT is maintaining it automatically;
   - **Problem** — SOT cannot continue automatically and owner attention is genuinely required;
   - **Soft Deleted** — registration removed but recoverable.
6. Job records remain durable implementation history beneath SSOT. They are available under collapsed **System history** with source contents/logs, but routine job controls are not the primary workflow.
7. Live work takes precedence over historical failure/interruption when determining a source's owner-facing status.
8. Pause/Resume remains available as an explicit global owner control.
9. AI task history/download behavior and all non-Analyze surfaces remain unchanged.

## Scope

Changed:
- `SOT/sot-turn02-release-d-autosync.py`
- `SOT/sot-turn02-release-d-source-actions.html`
- `SOT/qualify-release-d-autosync.py`
- this plan
- autosync graveyard addendum

Protected:
- schema 14;
- Release D engine/server;
- hashing and classification rules;
- source identity and filesystem semantics;
- AI task parallel/history/download behavior;
- Estate, Database, Grid, Plan and Activity behavior.

## Mechanical acceptance

Before fix:
- interrupted work required owner Restart — FAIL;
- Queue and Sources remained separate owner workflows — FAIL;
- stale registered sources auto-queued — PASS.

Candidate must prove:
- interrupted analysis is automatically recovered on runtime startup;
- duplicate recovery remains safe through existing source-level live-work dedupe;
- Analyze contains no Queue/Sources subnav;
- no “Source action needed / Kick off” manual-currentness banner remains;
- source state is Current / Syncing / Problem;
- jobs/logs remain available as collapsed System history;
- JavaScript parses under Node 22;
- Python runtime/qualifier compile;
- live WSL runtime recovery remains unverified until installed on the owner host.
