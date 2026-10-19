# Chart owner clarifications — 2026-10-19

These direct owner requirements override conflicting historical chart specifications and audit findings. Apply identically inside the shared chart component for NOW and Analyze. Preserve the owner-approved throwaway baseline and all unrelated functionality.

## Axis assignment

- Assign by actual measurement family, never by insertion order or selected series.
- All index series share the index axis. All compatible dollar series share the dollar axis, including the second, third, and subsequent additions.
- A dollar-based series must never be silently assigned to the index axis. Selecting, inspecting, adding or removing another series must not cause that reassignment.
- The historical requirement that only the active non-index comparison occupies Y2 is superseded. Multiple compatible series on native Y2 are correct.
- Preserve units and unit compatibility; do not silently equate USD, USD/barrel and USD/pound. The owner has not specified a new policy for more incompatible measurement families than available axes. Do not implement an automatic indexed fallback to resolve that case.

## Fixed / Horizon

- The owner's “horizontal” refers to the existing Horizon selector.
- Fixed/Horizon applies to every displayed series, not only the governed RSK/GRW/MAC indices or the active series.
- Qualify each series' reference/calculation and resulting presentation in each mode. A changed label, changed composite alone, or unchanged native-dollar path while every index rebases is not sufficient proof.
- Preserve original source observations, source dates and governed index mathematics. Any display transformation must be explicit and consistent with the axis-family rule; do not silently turn native dollar values into indexed values to make a mode appear responsive.
- Autoscaling can conceal a valid reference change; verify values and reference metadata as well as pixels. Do not manufacture a change for coincident reference values or flat data.

## Information versus inspection

- Series information cards may originate only from a legend chip's information gesture.
- Series lines, plotted points and plot background must never open a series information card, including click, touch, long press or context menu.
- Preserve crosshair inspection and its dismissal separately. Do not remove unrelated chart actions or chart explanation controls under this rule.

## Regression acceptance

Use a traceable requirement matrix for both consumers before requesting owner testing. Cover at least three indices, three compatible dollar series, mixed index/dollar series, successive additions in different orders, selection/inspection/removal, Fixed/Horizon for every series, every supported horizon, legend information versus all plot gestures, full-observation crosshairs, and NOW/Analyze state isolation. Retain the existing baseline geometry, navigation, Library parking/restoration, close lifecycle, data identity, exports and other previously working functions. A passing test for a changed feature does not qualify the retained functions.

Zero regressions is an acceptance requirement, not a claim established by updating this document. No deployment or application change is made by this clarification.

