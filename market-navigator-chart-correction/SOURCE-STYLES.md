# Source-bound Chart Config

The owner requested persistent presets and per-source color, width and pattern, index/component tabs plus Other, a retained Custom preset, red reserved for RSK, and one readable axis color.

The existing ee38-based builder replaces the original palette functions at asserted source seams. `source-styles.js` is build input, not a runtime wrapper. The new `market-navigator-source-styles-v3` configuration stores `activePreset` and a separate `custom` map keyed by stable source ID. Built-in source defaults are deterministic; rendering never allocates or reassigns numbered slots. Editing a source selects Custom and saves immediately. Switching presets preserves Custom; closing Config no longer restores an obsolete draft. A source appearing in multiple index tabs has one shared style. Other contains catalog sources outside the three governed component groups. Legacy settings migrate only their known source assignments; red conflicts are corrected on migration. Import validates the entire configuration before persistence; invalid imports leave the saved configuration intact. Export includes the active preset and retained Custom map.

RSK uses red. Non-RSK red assignments are rejected, including imports. Widths span 1–12; five existing line patterns remain available with an actual SVG sample. X/Y1/Y2 boundaries, tick values and unit labels use `#D9E6F2`, independent of highlighted series. Only Config receives layout CSS. Saved Library snapshots retain their captured trace styles. Reference, representation, source data, model arithmetic and chart gestures are unchanged.

Candidate blob: `8d89e5a2fc87fb0f056b0d37bba1cbd4a3126c92`.

The config browser suite covers both installed Chrome/Edge and desktop/phone viewports: complete catalog/tab membership, auto-save and reload, Custom preservation, shared NOW/Analyze rendering, source-order invariance, unchanged chart values, canvas tick/unit colors, reserved-red rejection, export/import round trip and legacy assignment migration. The existing chart, reference, selector, geometry and lifecycle suites remain required. Hosted source/model qualification and public verification precede delivery to the existing isolated validation route. This document records implementation; hosted/public results are recorded separately after completion.

