<!-- PRISM-PLAN v3.0.0 -->
# PRISM MASTER PLAN v3.0.0

## Current state
PRISM is rolled back to the last known working application. Do not build from R15 or R16 and do not introduce repository-side release machinery for ordinary PRISM UI work.

**ACTIVE APPLICATION**
- Artifact: `prism/prism-turn01-pre-ship.html`
- Test URL: https://acmeproducts.github.io/stuff/prism/prism-turn01-pre-ship.html?v=7988e0f397152afc06f3ae57009682c31fb2fd86
- File identity: `PRISM · Turn 01 pre-ship.3`
- Blob on current `main`: `f313268d418ee86c8f27054d7c10f714077d91fb`
- Status: **WORKING ROLLBACK BASELINE / ACTIVE TEST SURFACE**

The baseline file itself is frozen. Rejected descendants remain inert evidence only.

## Delivery process
1. Start only from the exact active application above.
2. Make application changes directly; do not create temporary PRISM GitHub Actions, publisher workflows, recovery branches, generated release machinery, or WSL-based application architecture.
3. Before writing, verify the current blob of every PRISM file being changed. Ignore unrelated commits elsewhere in this shared repository.
4. Update this plan and the Graveyard in the same forward-development cycle.
5. Run only lightweight mechanical gates appropriate to the changed surface: HTML/JS syntax plus specific required DOM/function assertions.
6. Publish the candidate directly to `main`, let the existing repository Pages deployment do its normal job, and return the exact test URL.
7. The owner is the UX/functional acceptance tester. Mechanical qualification is not product acceptance.

## Product contract to restore incrementally
The working rollback is the application foundation. The following changes are still required, but they must be added narrowly and tested without reconstructing the application around them.

### Library
- Library-local Omnisearch must always be reachable.
- Selecting an Analysis opens its complete saved transcript and continuing conversation.
- On mobile, an open Analysis must retain immediate Library/Omnisearch access.
- A persistent bottom compose strip continues the same Analysis.
- The action is explicitly **Research web**, uses the Config-selected verified provider, performs current-web research over the saved PRISM package and prior turns, and persists each turn on-device.
- AI/current-web output renders as Markdown with working direct hyperlinks. No unlinked research leads; no paywalled references except WSJ.

### Explore
- Group is the sole overview cluster dimension.
- Cluster count equals the unique cardinality of the active Group dimension after window/search/source/filter constraints.
- Example: seven active Source values means exactly seven Source clusters.
- Overview renders one lightweight cluster per value, not one transformed DOM object per event.
- Cluster drill-in is bounded and uses ordinary vertical scrolling/touch behavior.
- Hidden analytical surfaces are not rerendered during ordinary Explore interaction.

### Preserve unless explicitly rejected
- Existing Map, Feed, search, reader, selection, source/provider behavior and cache behavior of the active rollback.
- Config remains top-right.
- AI POV remains global rather than becoming a separate generic chat surface.

## Next release
The next candidate is a **small direct descendant of the active rollback**, not another reconstructed full-app release. First gate: restore only the Library continuation contract and cardinality-driven Explore while preserving every other active-baseline behavior. Do not proceed by copying R15/R16 wholesale.
