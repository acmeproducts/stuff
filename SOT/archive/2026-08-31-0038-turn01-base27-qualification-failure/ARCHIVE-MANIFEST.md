# Turn 01 Base-27 qualification failure

**Stage:** base
**Candidate:** Base-27
**Disposition:** REJECTED BEFORE CUTOVER

Base-27 was generated from the governed clean lineage and passed artifact generation/identity, then failed the static contract gate because `Default Target` was missing from the generated Configuration surface.

Observed failure:

`DEFAULT_TARGET missing`

No Base-27 cutover occurred. The live backend remained `2026.08.30.sot-turn01-base-22` and the prior public Base remained in place.

## Root cause

The Base-27 AI integrator replaced the Base-24 `openConfig()` implementation wholesale with an AI-only Configuration surface. That replacement unintentionally removed the protected storage-default controls (`Default Target` and `Default Backup`). This is a source-integration regression, not a machine/storage failure.

## Correction rule

Base-28 must regenerate from accepted pre-base -> clean Base-22 -> clean Base-24 behavior and integrate operational AI without deleting protected storage defaults. The failed Base-27 generated HTML is evidence only and may not be used as an implementation ancestor.

Base-28 qualification must retain the exact generated/public JavaScript parse and browser boot gates established after GY-012.