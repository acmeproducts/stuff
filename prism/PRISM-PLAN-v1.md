<!-- PRISM-PLAN v2.2.0 -->
# PRISM MASTER PLAN v2.2.0

## Governing correction
The prior Turn 02 rebuilds are **not** the rollback baseline. They were synthesized replacements and therefore violated the rollback process.

The active recovery baseline is the **existing repository artifact exactly as previously published**:

- **Artifact:** `prism/prism-turn01-pre-ship-r3.html`
- **Original application commit:** `807656e7e14c4b8503b3b7c88b83271967f64692`
- **Status:** **EXACT ROLLBACK BASELINE — DO NOT RECONSTRUCT OR SUBSTITUTE**

No new HTML is created to represent this rollback. Future work starts from that exact repository version.

## Why R3 is the recovery baseline
R3 is the version that preserves the integrated product functionality that had already been established together:
- one global analytical ribbon;
- Group / Color / Size dimensions;
- dimension-derived filters;
- Source as an analytical dimension;
- Map;
- Explore, even though its sphere/card-cloud visualization is known to be unacceptable;
- Feed;
- collapsible left rail;
- collapsible right context panel;
- source inventory/configuration and custom-source management;
- multi-select AI evidence and deselection;
- AI POV;
- Venice / OpenRouter / Anthropic configuration and exact-model validation;
- Markdown AI rendering with safe external links;
- durable Analysis Library with save, reopen, continue, delete, export and import.

The known Explore defect does **not** invalidate those integrated subsystems. It is the subsystem to replace from this baseline, not a reason to replace the application.

## Rollback law
A rollback means selecting an **existing, identified repository artifact/commit** and restoring that as the working baseline. It does not mean synthesizing a new approximation of that version.

Therefore:
1. `prism-turn02-pre-base.html` is not a product baseline and must not be used as the source for forward development.
2. R4 and R5 remain rejected descendants.
3. R3 remains intact and is the sole recovery baseline.
4. Any future Explore replacement must fork conceptually and technically from the exact R3 application while preserving all non-Explore functionality unless the owner explicitly rejects a specific subsystem.
5. No established feature may be removed merely to simplify visualization development.

## Next governed step
The next release is a new descendant of the exact R3 baseline. Its scope is **Explore replacement only**, plus any explicitly requested filter/visual-encoding corrections. It must preserve R3 Sources, dimensions, filters, AI POV, provider/model configuration, Analysis Library, Map, Feed, selection state, and shell behavior.

Before implementation, the replacement Explore contract must be written against the R3 application and must not reuse the rejected R3/R4/R5 visualization architectures.

## Standing product laws
1. One information state, multiple views.
2. One global analytical control system.
3. Event → Coverage → Source Article is canonical.
4. Cache first; no normal-startup publisher fan-out.
5. Reader never underlaps desktop analytical surfaces.
6. Every selected dimension has a corresponding filter; the filter tray is derived only from active dimensions.
7. Color filter chips serve as the visual legend; no redundant inert legend.
8. Source analytical filtering is distinct from Source acquisition/configuration.
9. AI POV is contextual research using selected evidence; provider/model must be verified.
10. Library is a durable continuable research workspace.
11. Rollbacks use exact repository artifacts, never synthesized substitutes.

## Ledger
- 01·pre-base: passed foundation.
- 01·base: rejected UI architecture.
- 01·pre-ship R1: superseded.
- 01·pre-ship R2: historical recovery reference.
- **01·pre-ship R3 @ `807656e7e14c4b8503b3b7c88b83271967f64692`: ACTIVE EXACT ROLLBACK BASELINE.**
- 01·pre-ship R4: rejected Explore descendant.
- 01·pre-ship R5: rejected Explore descendant.
- Turn 02 synthesized pre-base attempts: rejected as rollback-process violations; not forward baselines.
