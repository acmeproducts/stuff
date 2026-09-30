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

---

## 2026-09-29 — Primary navigation, shared Search operations, and Log / Activity

**Owner report:** Table and Grid must expose the same bulk operations; Database becomes Search with a magnifying-glass icon; Report and Analyze become subtabs under Report; Estate becomes **Add to Estate** with a plus icon and no Catalog workflow; Activity leaves the primary navigation and moves into Configuration; the runtime log must be written durably and available for download, copy and clear.

**Cause:** the prior convergence wrapper unified Database/Grid only at navigation level. Table still had single-row selection while Grid owned Tag / Notes / Delete / Folder bulk actions. Analyze, Estate Catalog and Activity also remained separate primary navigation concepts. Runtime JSONL existed locally and diagnostic publication existed only as a manual snapshot/publish action.

**Change:**
- primary navigation is **Report / Search / Add to Estate / AI**;
- Report contains **Report / Analyze** subtabs while preserving the existing Report and SSOT Analyze implementations;
- Search contains **Table / Grid** views; both use the same Tag / Notes / Delete / Folder bulk-operation functions and selection semantics;
- Search uses a magnifying-glass icon;
- Add to Estate uses a plus icon, always opens Picker, and suppresses Catalog from that owner workflow;
- Activity is removed from primary navigation; Configuration gains **Log / Activity** with Download / Copy / Clear;
- the structured runtime JSONL remains local-first and is automatically mirrored every five minutes, when configured, to `live/sot-release-d-events.jsonl` in the existing separately cloned private diagnostics Git repository;
- clearing the Config log truncates only the structured runtime JSONL and immediately records the clear event; SQLite durable event history is not deleted.

**Before / after:** visible primary buttons **7 → 4**; Search bulk-operation parity **Grid only → Table + Grid**; Activity primary button **1 → 0**; Config log controls **0 → 3**; private Git log publication **manual bundle only → automatic live JSONL + existing manual bundle**.

### Acceptance

- Report is first and Analyze is reachable as a Report subtab without its own primary icon.
- Search is second and uses a magnifying-glass icon.
- Add to Estate is third and uses a plus icon; opening it cannot land on Catalog.
- AI remains a primary tab; Activity does not.
- Table and Grid both expose Tag / Notes / Delete / Folder for selected search results.
- Report rows still open the correct central Search scope.
- Config contains Log / Activity with Download / Copy / Clear.
- `/api/diagnostics/log` reads the structured runtime log; `/api/diagnostics/log/clear` clears that log without deleting SQLite events.
- automatic private-repo log publication never targets the public application repository and does nothing when the private diagnostics checkout is absent.
- complete-wrapper JavaScript parses under Node 22; autosync and qualifier compile and the Continuous SSOT qualification passes.
