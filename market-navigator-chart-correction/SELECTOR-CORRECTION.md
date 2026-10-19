# Requested chart choices versus effective axes

Owner phone report reproduced on previous published blob `1c2425aa5c4c8edacdc5438719e168f6a01f4c6b`: entering GRW with GRW highlighted offered zero Y1+Y2 options. Highlighting QQQ made that option appear. The footer also overwrote requested representation using current eligibility; pure-dollar rendering changed Dual into Native, ENV/empty-family rendering changed it into Indexed, and Analyze launch explicitly changed Dual into Indexed.

The existing ee38-based builder now creates `3103a98d2aac9e5c054537660a6b2480d9752b9c`. Requested representation and reference remain instance state, and effective axes are derived separately. Y1+Y2 uses every visible eligible series regardless of highlight. An ineligible context retains the selected request without inventing an empty axis. Native additions that require another representation are unavailable until the user explicitly changes it. Analyze inherits the requested options unchanged and remains independent. NOW preferences are validated and stored under a key scoped to the current route, so reload does not reset them.

The new visible-interaction selector suite passed 32 mode/reference/consumer/profile cases across Chrome and Edge desktop and phone size. Each case exercises successive legend highlights and compares every point and axis, plus real selectors, ineligible 1D/back to 5D, Add/remove, ENV/back to GRW, Analyze inheritance, Library parking, close/restoration and reload. The existing full horizon/representation/reference matrix and reference/Data/sparse suites remain required; hosted qualification and public byte checks gate delivery.

GRW's five Fixed values in both representations are exactly:

`102.75317565351492, 102.74817355519153, 102.72144442915459, 102.73137006473803, 102.72698120164907`.

The screenshot's shared indexed Y1 range is `49.08747342927728–692.695125427805`; after the user selects Y1+Y2, GRW-only indexed Y1 is `102.71827130671855–102.75634877595095`. Thus the apparent shape difference is magnification, not different GRW calculations. Within either representation, changing highlights must preserve axis bounds and all point coordinates. No data/math or unrelated axis-range policy was changed for this correction.

