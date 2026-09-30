# SOT Turn 02 Release D — Placement Refresh Spin Correction

**Decision date:** 2026-09-30  
**Status:** OWNER-REPORTED BLOCKER / CORRECTIVE RELEASE

## Owner definition of working

> “it just spins”

> “I dont even get the loading toast message just the black source screen which is not supposed to even be first”

> “THIS LITERALLY HAS NONE OF THE FEATURES WE TALKED ABOUT”

The application must visibly enter the governed refresh state, finish loading one complete authoritative estate snapshot, and then expose the approved owner UI with Report first.

## Root causes now proven

There are three separate qualification failures in the previous candidate:

1. **Live-revision paging race.** The browser rejected a multi-page load when `catalog_revision` changed between pages. Continuous SSOT can legitimately change the catalog during a 30,324-row fetch. The backend correction now serves one immutable placement snapshot for each traversal.
2. **MutationObserver feedback loop.** `__ssotDecorateTabs()` unconditionally rewrote `search.innerHTML` and `estate.innerHTML`. The same tab container was observed for child mutations, so each rewrite generated another mutation and another rewrite. This starved browser rendering before the blocker/Report-first UI could paint, leaving the previously painted Source/Picker screen visible.
3. **Unsafe placement apply.** `__ssotApplyPlacements()` referenced undeclared `snap?.job?.revision`. Optional chaining does not make an undeclared identifier safe. A successful page fetch therefore threw during apply and the loader converted that runtime exception into another retry.

The previous qualifier was insufficient: it proved Python behavior, required marker presence and JavaScript parseability, but it did not reject either browser runtime defect. A string-presence PASS is not a behavioral UI PASS.

## Corrective change

1. Retain the immutable backend placement snapshot already implemented.
2. Make tab decoration idempotent: only replace Search/Add-to-Estate icon markup when its explicit decoration marker is absent.
3. Remove the undeclared `snap` dependency from placement application; preserve a prior placement revision only when the variable actually exists, otherwise store `null`.
4. Keep Report first, unified Search Table/Grid, Add to Estate, report-row routing, bulk Table/Grid actions and Config Log/Activity exactly as approved.
5. Extend qualification with explicit regression gates that reject unconditional observed-tab `innerHTML` rewrites and unsafe `snap?.` references.
6. The installer must lint the final wrapper with Node and run the corrected qualification before replacing the host files.

## Mechanical acceptance

- 12,005-row traversal remains on one immutable revision while the live fixture advances to 12,006/new revision;
- a new traversal sees the new revision;
- wrapper JavaScript parses under Node 22;
- no unsafe `snap?.job` reference exists;
- tab decorators carry stable `data-ssot-icon` guards before changing `innerHTML`;
- Report is first and legacy Grid/Analyze/Activity top-level buttons are hidden;
- blocker exact text remains `Database refreshing / rebuilding`;
- all previously approved Report/Search/Add-to-Estate/bulk/log markers remain present;
- installer continues to verify local health and complete live placement delivery.

## Protected

No schema migration. No database rebuild. No rehash. No classification change. No report mathematics change. No source/job lifecycle change. No AI behavior change. No unrelated UI redesign.