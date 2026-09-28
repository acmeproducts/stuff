# Devstream Donor Interaction Implementation Plan

Status: **IMPLEMENTED IN b43 — DEVICE VALIDATION PENDING**

Donor: `session-manager-v3.html` @ `6b7ac39bc688953b868f2f9317221f0f740b336a`  
Target reviewed: `devstream-test.html` b42

## Governing design

The donor defines the interaction shape and outcomes, not a literal selector/function transplant. Devstream has a different DOM, persistence model, and render lifecycle.

**Gesture arbitration is mandatory:** first touch is `TAP_PENDING`. A second tap cancels pending navigation and opens context. A hold cancels pending navigation and enters drag. Scroll movement cancels the candidate. Only an uncontested single tap may navigate.

`IDLE → TAP_PENDING → { SINGLE_NAVIGATE | DOUBLE_CONTEXT | HOLD_DRAG | SCROLL_CANCEL }`

Exactly one terminal outcome is allowed.

## Interaction map

| # | Interaction / trigger | Required outcome | Donor | Design | Physical build plan |
|---:|---|---|---|---|---|
| 1 | Single tap project | After double-tap window expires, open project once; no premature load. | DONOR ABSORBED | COMPLETED | YES |
| 2 | Double tap project | Cancel pending single tap; open project context anchored to project; no navigation between taps. | DONOR ABSORBED | COMPLETED | YES |
| 3 | Hold project | Cancel pending tap; arm drag; show floating project-name ghost; never open context. | DONOR ABSORBED | COMPLETED | YES |
| 4 | Drag project over project | Show before/after landing marker on target; source stays visibly dragging. | DONOR ABSORBED | COMPLETED | YES |
| 5 | Release project drag | Persist reorder at indicated position; clear ghost/highlights; render persisted order. | DONOR ABSORBED | COMPLETED | YES |
| 6 | Project drag cancel / scroll | Clear candidate/drag without navigation/context; preserve vertical scrolling before drag arms. | DONOR ABSORBED | COMPLETED | YES |
| 7 | Single tap tab | After double-tap window expires, open thread once; no premature load. | DONOR ABSORBED | COMPLETED | YES |
| 8 | Double tap tab | Cancel pending single tap; open tab context anchored to tab; first tap must not re-render/destroy gesture target. | DONOR ABSORBED | COMPLETED | YES |
| 9 | Hold tab | Cancel pending tap; arm drag; immediately show visible tab-name ghost; never open context. | DONOR ABSORBED | COMPLETED | YES |
| 10 | Drag tab within strip | Named ghost follows pointer; exact insertion zone highlights. | DONOR ABSORBED | COMPLETED | YES |
| 11 | Release tab within strip | Persist reorder at highlighted insertion point; clear drag UI; render persisted order. | DONOR ABSORBED | COMPLETED | YES |
| 12 | Drag tab onto project | Project highlights as destination; release moves thread using Devstream SOT/thread persistence. | DONOR ABSORBED | COMPLETED | YES |
| 13 | Drag tab toward closed sidebar | Left-edge activation opens sidebar so project destinations become available. | DONOR ABSORBED | COMPLETED | YES |
| 14 | Tab drag cancel / scroll | Clear candidate/drag without thread load/context; preserve scrolling before drag arms. | DONOR ABSORBED | COMPLETED | YES |
| 15 | Project context — Rename | Donor-shaped Rename leaf; Enter persists; Escape/outside cancels without navigation. | DONOR ABSORBED | COMPLETED | YES |
| 16 | Project context — Customize | Card color, font color, font size, immediate preview/persist, Reset. | DONOR ABSORBED | COMPLETED | YES |
| 17 | Project context — Download | Download selected project without first navigating to it. | DONOR ABSORBED | COMPLETED | YES |
| 18 | Project context — Share | Share/copy selected project without unintended load. | DONOR ABSORBED | COMPLETED | YES |
| 19 | Tab context — Rename | Donor-shaped Rename leaf; Enter persists; Escape/outside cancels. | DONOR ABSORBED | COMPLETED | YES |
| 20 | Tab context — Assign | Donor-shaped project search/results; destination selection moves via Devstream persistence. | DONOR ABSORBED | COMPLETED | YES |
| 21 | Tab context — Customize | Tab color, font color, font size, immediate preview/persist, Reset. | DONOR ABSORBED | COMPLETED | YES |
| 22 | Tab context — Download | Download selected transcript without first loading it into main pane. | DONOR ABSORBED | COMPLETED | YES |
| 23 | Tab context — Share | Share/copy selected transcript without unintended tab load. | DONOR ABSORBED | COMPLETED | YES |
| 24 | Context dismissal | Outside tap closes context; context interaction cannot leak through to project/tab navigation. | DONOR ABSORBED | COMPLETED | YES |
| 25 | Tab close × | Dedicated soft-delete control; excluded from tap/double/hold recognition. | DONOR ABSORBED | COMPLETED | YES |
| 26 | Project delete × | Dedicated delete control; excluded from tap/double/hold recognition. | DONOR ABSORBED | COMPLETED | YES |
| 27 | Desktop project behavior | Preserve single click, double-click/right-click context and HTML drag/drop; touch arbiter ignores mouse. | DONOR ABSORBED | COMPLETED | YES |
| 28 | Desktop tab behavior | Preserve single click, right-click context, close × and HTML drag/drop; touch arbiter ignores mouse. | DONOR ABSORBED | COMPLETED | YES |
| 29 | Persistence after drop | Project order, tab order and cross-project moves survive reload using Devstream persistence/conflict reconciliation. | DONOR ABSORBED | COMPLETED | YES |
| 30 | Gesture exclusivity | One gesture produces exactly one of navigate, context, drag/drop, or scroll/cancel. | DONOR ABSORBED | COMPLETED | YES |

## Physical build sequence

1. Freeze b42; do not incrementally patch its current touch handlers.
2. Build one project touch arbiter that owns single tap vs double tap vs hold-drag vs scroll/cancel.
3. Build one tab touch arbiter with the same state model.
4. Remove touch navigation races: project/tab navigation is an outcome called by the arbiter, not an independent click competing with it.
5. Adapt donor ghost, insertion marker, destination highlight, context shell/leaves and dismissal to Devstream DOM.
6. Connect donor outcomes to Devstream SOT/thread persistence; do not transplant donor storage functions.
7. Exclude close/delete controls at gesture start.
8. Bind to stable containers after shell creation; child re-renders must not destroy the arbiter.
9. Preserve the accepted refresh/write-conflict reconciliation and non-interaction baseline behavior.
10. Publish only after the complete interaction state machine is built as one coherent change.

## Implementation status

**BUILT — b43.** The planned gesture arbiter is implemented as a coherent change. Single-tap navigation is deferred until the double-tap window resolves; double tap cancels navigation and opens context; hold cancels navigation and enters drag; scroll movement cancels the gesture. Device validation remains the final interaction gate.

## b45 Devstream geometry correction

Owner report after b44: Rename now works; drag/drop remains broken. Devstream differs physically from the donor because its main ribbon sits above the 48px tab strip and its mobile sidebar overlays the main surface.

Cause addressed in b45: donor-style touch drag was still resolving destinations through the painted element under the pointer. The target implementation now resolves project cards, tabs, and insertion zones from their viewport `getBoundingClientRect()` geometry, in the same `clientX/clientY` coordinate system as the pointer. Once HOLD arms drag, Devstream explicitly owns the gesture until release; normal scrolling remains available before drag arms.

Acceptance remains: hold produces named ghost; movement highlights the actual destination; release persists reorder/move. Rename correction from b44 must remain intact.

## b46 activation gate

Owner device result on b45: drag does not activate at all; no hold bubble appears. Therefore downstream target/drop/repaint work is not the current gate. b46 changes only tab hold activation: the scrollable Devstream tab ribbon uses a direct touchstart/touchend gesture lane, with a 350ms stationary hold producing the named bubble. Target/drop/repaint logic is retained but is not considered validated until activation passes.

## b47 chain step 2 — target footprint

Owner device validation: b46 PASS for step 1 (stationary hold displays named tab bubble). b47 preserves that accepted activation path and changes only step 2 feedback: while an armed tab is moved over a valid insertion zone or project, that destination receives an explicit visible footprint/highlight. Drop/persistence/repaint are intentionally unchanged and remain unvalidated.

## b48 validated drag + message deletion / tab completion

Owner device result: b47 drag movement works, with slight lag. Preserve the validated touch activation and target footprint. Complete the cross-project outcome by opening the destination project and moved tab after a successful drop. Add permanent per-message deletion (× → confirmation → remove from in-memory thread JSON → write cleaned JSON), specifically allowing an accidentally entered secret to be removed before GitHub persistence. New + tabs use an in-app naming modal and are inserted first in the project tab order.

## b49 Android project drag + tab delete confirmation + 409 recovery

Owner report: tab dragging works; tab × needs confirmation; projects must support the same mobile hold/drag/drop interaction; active Earth thread writes repeatedly fail GitHub 409 with a stale/mismatched content SHA. b49 preserves accepted tab dragging. Tab × now confirms before soft-delete. Project mobile reordering now uses the direct touch-event hold path already validated for tabs (350ms named ghost, target marker, release reorder). Thread writes bypass the shared GET single-flight cache when establishing/recovering the current content SHA and retry a 409 against a freshly fetched SHA, preserving thread reconciliation.
