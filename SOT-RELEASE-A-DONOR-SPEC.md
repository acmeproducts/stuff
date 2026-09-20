# SOT Release A — Grid Donor Extraction

**Status:** BINDING IMPLEMENTATION EVIDENCE  
**Date:** 2026-09-20  
**SOT UI baseline:** `SOT/sot-turn02-pre-base-v8.html` blob `3828d457d486bd62f015454ab0044bf23e585342`  
**Grid donor:** `acmeproducts/perf/ui-v2.html` blob `8ef7ac104883b25f9cd51929718343498e9c3de9`

Release A is rebuilt from the accepted SOT v8 UI and the clean pre-v9 backend lineage. Rejected SOT v9 is evidence only and is not an implementation ancestor.

## Extracted donor behavior

- Grid workspace owns its vertical scroll.
- Header geometry is compact and divided into title/result count, selection/density, search, and bulk-action rows.
- Selected-count pill is explicit and bulk actions are disabled at zero selection.
- Thumbnail-size slider is `min=1`, `max=10`, implicit/explicit step `1`, default `4`.
- Slider value maps directly to CSS columns: `grid-template-columns: repeat(value, 1fr)`.
- Density changes presentation only; it does not alter result membership, ordering, or explicit selection.
- Cards are square.
- Image media uses `object-fit: contain`.
- Selected cards use a four-pixel blue outline/shadow.
- Media is lazy-loaded; the donor uses bounded/batched rendering with an IntersectionObserver.
- Select All acts on the current result population. In SOT, this remains an explicit owner action; search itself never auto-selects results.
- Tag modal is titled **Edit Tags**, contains **Assigned Tags**, comma-separated entry, removable chips, and **Recently Used Tags**.
- Notes modal is titled **Edit Notes & Ratings** and contains Notes, five-star **Quality Rating**, five-star **Content Rating**, Cancel, and Save.
- Folder uses the donor **Move to Different Folder / Choose Destination Folder** interaction shape, while SOT backend Estate rules remain authoritative.
- Delete begins with an explicit **Confirm Delete** scope. SOT adds the governed Trash/Recycle Bin-first rule and a separate second permanent-delete confirmation for the failed-trash subset.
- Donor open/focus affordance is retained as a compact per-tile viewer control.
- UI-V2 stack Move and Export are not imported. Release A actions are exactly **Tag | Notes | Delete | Folder**.

## SOT-specific safety overrides

- Existing SOT Omnisearch semantics override the donor's live-per-keystroke search: execution is explicit Go/Enter and supports field qualifiers, negatives, wildcarding, and OR.
- Search never implicitly selects its returned set.
- Hidden/non-returned placements cannot remain silently in a bulk-mutation scope after a query changes.
- UNIQUE / KEEP / EXCESS are immutable system classifications, not editable owner tags.
- Folder and Delete are placement-ID scoped and backend-authoritative.
- Filesystem success alone is not completion; Database/current status, classification, Plan, persistent cache revision, and Activity must reconcile before success is returned.
