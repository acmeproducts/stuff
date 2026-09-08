<!-- PRISM-GRAVEYARD v6.0.0 -->
# PRISM GRAVEYARD v6.0.0

## Governance
Rejected work is evidence, not an implementation ancestor. R27 remains the authorized release; no R28. Owner-device behavior is the final acceptance gate.

## R27 recovery additions

- **Library-only product replacement:** `R27-LIBRARY-01` reduced the complete R26 application and rendered Map, Explore and Feed through the same placeholder card list. It is rejected and inert. Recovery starts from exact R26 and preserves the complete product.
- **Persist-first custom sources:** saving a custom source before proving fetch and parse creates permanent zero-item inventory. R27 validates HTTPS URL, uniqueness, payload, usable entries and a sample headline before persistence.
- **Sphere Explore:** a decorative sphere does not expose dimensional relationships. Explore now uses the same Group, Color and Size grammar as Map on a flat recency/value field.

## Permanent architecture veto
- no iframe release;
- no runtime baseline fetch;
- no wrapper/bootstrap release;
- no sidecar patch stack;
- no injected overlay or DOM monkey patch;
- no Web Worker for AI wait;
- no alternate Analysis persistence engine/state machine;
- no destructive migration that can erase or hide historical Library records.

## Explicitly rejected Map behavior
- fixed-row `.r21Group` lattices with repetitive `big/med/small` spans;
- article rectangles that become long 1:5-style strips when a squarer arrangement is available;
- label-sized headline type on large tiles;
- only three tile sizes.

The governing Map reference is NewsMap.JS: dense squarified variable-area rectangles with readable headline hierarchy. R27 requires X-Large/Large/Medium/Small/X-Small classes while geometry is driven by squarified weighted area.

## Explicitly rejected Library behavior
- blank Library with no explanation or diagnostic state;
- one-shot migration markers that prevent current rereads of historical Analysis stores;
- hiding/removing the Library rail when an Analysis is selected;
- a non-collapsible Library rail;
- compose strip positioned relative to card-list height instead of pinned to the bottom of the right Analysis workspace;
- missing paperclip attachment control or missing Send/current-web continuation;
- truncated/non-scrollable Analysis transcript;
- follow-up research creating a different Analysis ID.

## Rejected R27 attempts
- `5a8306b4105b23a253148aa19386e4ee887f9d23`: rejected Map leaf-depth implementation.
- `77328bce35284b66d4aac2f90712fda442ad7781`: rejected owner-device behavior.
- `d6acc0d4da9df53724230df05e34c7eee6b48968` / R27-CLEAN-02: rejected Map and Library behavior.
- `d11a3678208f2c37d9ed6b7c227ae57c261a42d2`: truncated/inert publish; never use as implementation evidence.
- `be79aeab10065b9b03201e763e4225685243aac1`: recovered complete artifact but still rejected by owner for insufficient Map geometry/type and Library acceptance failure.
- `72663b45a572238bbcc526781e156c16cc5ff07d` / R27-OBS-01: diagnostics and five size classes were useful evidence, but fixed-grid-like geometry and Library acceptance remained insufficient. Use only as evidence; correct R27 directly.

## Accepted R27 direction
- standalone R27 only;
- NewsMap-like squarified weighted article geometry;
- five visible tile size tiers and much larger headline typography;
- persistent collapsible left Library Analysis rail plus full-height right Analysis workspace;
- independently scrolling full transcript;
- pinned chat compose with paperclip, prompt, Send/current-web continuation;
- authoritative `prism/analyses` persistence plus compatible historical reread/merge;
- persistent browser-local step/error diagnostics.
