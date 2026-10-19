# Owner-authorized chart correction

Execution plan: canonical Master Plan, October 19 section; requirements: `MARKET-NAVIGATOR-CHART-OWNER-CLARIFICATIONS.md`.

`approved-throwaway.html` is an immutable construction fixture, Git blob `ee38d9c9da9af4b2795695a39519c76e6c5e5239`, from `market-navigator-rebuild-candidate.html` at commit `2114b608977d8a1399e02a345f253ac83317e4b8`. It is not a replacement product baseline or a new test URL.

Run `python market-navigator-chart-correction-build.py` to create `.evidence/chart-correction-candidate/throwaway.html` directly from that fixture. Run `node market-navigator-chart-correction-tests.cjs` for NOW/Analyze browser checks using the unchanged local validation ETL directory. Runtime dependencies use the existing project Playwright loader.

This work does not update `market-navigator-sync/approved-chart.html`, the synchronization pipeline's pinned app hash, or the public validation tree while incomplete. In particular, native-dollar Fixed/Horizon semantics await the owner's answer to the explicit product question. No dollar transformation is invented meanwhile, and partial test success must not be labelled complete acceptance.

Implemented independent changes: source-observation inspection, authoritative horizon bounds, date marker, Escape/outside dismissal and listener destruction, measurement-aware chart formatting, 100 reference line, native-dollar family ownership independent of focus, and no plot information-card path. Native prices retain original raw values while their Horizon semantics are unresolved.

Required before publication: finalize that mode definition; qualify every series in both modes; run the full specification and retained regression matrix; confirm unchanged ETL hashes; update synchronization source/hash/tests atomically; then qualify the isolated validation route. Default product URLs and the historical approved fixture remain unchanged. Physical device acceptance is distinct from browser emulation.

## Independent execution checkpoint

Candidate blob `49e12f025fcad1ae2bd8c623aad8acf814714096`, rebuilt directly from the fixture. Chrome/Edge at 1440×900 and 412×915 passed 112 combined NOW/Analyze horizon/display states, three-index/three-dollar family checks, focus and insertion-order stability, a non-sampled real observation crosshair, Escape/×, plot-versus-legend context information, and NOW isolation on Analyze close. `qualification-independent.json` records those checks; its native-Horizon field remains pending rather than PASS.

`node market-navigator-chart-correction-retained.cjs` additionally passed Library parking/restoration, X destruction, post-close NOW controls, bounded chart geometry, unobstructed horizon/More controls and zero runtime errors in all four profiles. The qualification data package `3ae38952b2dd50a0f098ce216d73a936e71d5fdc9845abd66151c3cecccf44bc` retains every manifest resource hash before and after these tests. This is a frozen local verified package, not a claim that its publication metadata is the latest hourly public metadata.

These are local browser results, not hosted CI, physical-device acceptance, or complete zero-regression certification. Data/export arithmetic, every sparse/collision case, complete native mode semantics and final public delivery remain gates, not implied successes.

