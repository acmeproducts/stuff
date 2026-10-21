# Chart owner clarifications — 2026-10-19

These direct owner requirements override conflicting historical chart specifications and audit findings. Apply identically inside the shared chart component for NOW and Analyze. Preserve the owner-approved throwaway baseline and all unrelated functionality.

## Axis assignment

Owner correction after phone testing: Y1+Y2 availability is calculated from the complete visible series set, never the highlighted chip. Requested representation and Fixed/Horizon are persistent choices: rendering, highlighting, inspection, resize, a temporarily ineligible horizon/family, navigation, Add/remove and background refresh cannot overwrite them. NOW restores these choices after reload; Analyze inherits them on launch and owns independent choices while open/parked. A context without a usable secondary family may omit its effective secondary axis and disable the option, while retaining the selected request for when the family is available again.

- Assign by actual measurement family, never by insertion order or selected series.
- All index series share the index axis. All compatible dollar series share the dollar axis, including the second, third, and subsequent additions.
- In Native/Y1+Y2, a dollar-based series must never be silently assigned to the index axis. Selecting, inspecting, adding or removing another series must not cause that reassignment. Explicit Indexed 100 deliberately normalizes every selected series and is available for comparisons.
- The historical requirement that only the active non-index comparison occupies Y2 is superseded. Multiple compatible series on native Y2 are correct.
- Preserve units and unit compatibility; do not silently equate USD, USD/barrel and USD/pound. The owner has not specified a new policy for more incompatible measurement families than available axes. Do not implement an automatic indexed fallback to resolve that case.

## Fixed / Horizon

Owner-approved resolution: explicit Indexed 100 normalizes all selected series. Native/Y1+Y2 retains actual dollar values on the native-dollar axis. Fixed/Horizon changes all normalized series, not actual native prices. Fixed uses September 1, 2016: last real observation on or before that date; a later-starting series uses its first observation and discloses that later date. Governed indices retain their existing model anchor. Horizon rebases each normalized series to 100 for its window. This overrides conflicting earlier statements below; no dollar-change-from-zero transformation is authorized. Explicit Indexed 100 is a requested normalization, not a silent native-axis fallback.

- The owner's “horizontal” refers to the existing Horizon selector.
- Fixed/Horizon applies to every normalized series, not only the governed RSK/GRW/MAC indices or the active series. Native dollar prices retain their actual values; pure Native charts disable the irrelevant reference selector.
- Qualify each normalized series' reference/calculation and resulting presentation in each mode. A changed label or changed composite alone is insufficient proof. Native-price invariance is separately required.
- Horizon uses each series' first real observation in the selected window, equal to 100. Fixed uses the last eligible observation on or before September 1, 2016; a later-starting series discloses its first eligible observation instead. Dates remain actual source observation dates.
- Preserve original source observations, source dates and governed index mathematics. Any display transformation must be explicit and consistent with the axis-family rule; do not silently turn native dollar values into indexed values to make a mode appear responsive.
- Autoscaling can conceal a valid reference change; verify values and reference metadata as well as pixels. Do not manufacture a change for coincident reference values or flat data.

## Information versus inspection

- Series information cards may originate only from a legend chip's information gesture.
- Series lines, plotted points and plot background must never open a series information card, including click, touch, long press or context menu.
- Preserve crosshair inspection and its dismissal separately. Do not remove unrelated chart actions or chart explanation controls under this rule.

## Regression acceptance

Use a traceable requirement matrix for both consumers before requesting owner testing. Cover at least three indices, three compatible dollar series, mixed index/dollar series, successive additions in different orders, selection/inspection/removal, Fixed/Horizon for every series, every supported horizon, legend information versus all plot gestures, full-observation crosshairs, and NOW/Analyze state isolation. Retain the existing baseline geometry, navigation, Library parking/restoration, close lifecycle, data identity, exports and other previously working functions. A passing test for a changed feature does not qualify the retained functions.

Zero regressions is an acceptance requirement, not a claim established by updating this document. No deployment or application change is made by this clarification.

The reported GRW shape comparison must be checked numerically: preserve timestamps/raw/indexed values across representations and preserve axis bounds and plotted coordinates across highlight changes within a representation. Moving normalized dollar comparators off Y1 can legitimately rescale Y1 when the user explicitly switches representation; it must not change GRW's canonical values or switch modes on selection.



## October 20 owner decision — dollar-axis grouping and per-series unit disclosure

The owner explicitly permits dollar-based series to share the dollar axis, including USD quotes, USD per barrel and USD per pound. This supersedes the earlier prohibition on grouping these native dollar quote bases and resolves audit finding C21. All dollar-based series retain their actual native values on that axis; all normalized/index series retain their index axis. Do not reject these combinations, invent a third axis or silently change representation/reference choices.

Use each series' existing legend information card to explain its exact native quote unit/basis. Keep the shared dollar-axis label readable and show the exact unit in the card. The disclosure does not convert barrels, pounds or share/unit quotes into a common physical quantity. Preserve legend-only information gestures, plot inspection, axes, colors and persistent choices. Add regression checks in both NOW and Analyze covering mixed dollar sources in different orders, true native values, exact per-series unit disclosure and unchanged geometry after information-card use.
