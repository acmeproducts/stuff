> Owner rejected this candidate on October 10 after testing reusable-chart line focus, step inspection and custom surface geometry. The PASS evidence below is retained as historical automated evidence, not owner acceptance. See MARKET-NAVIGATOR-OWNER-TEST-GATES-SURFACE.md for the retry.

# Refresh recovery delivery — October 10

Qualified candidate: 86e3aff9202049319d3fc19f065bc9f8715ccb93. Owner explicitly approved the publisher and recurring recovery scope after automatic approval initially rejected it. Activation 7774f008714eaa3ad14e9d3233d251058617352a changed only the main review-publisher workflow. Publication b750333e4aa12e5cb2b184f8212798d547354525 is deployed.

Test page: https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-candidate.html?refresh=86e3aff
Small multiples: https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-custom.html?refresh=86e3aff
Baseline: https://acmeproducts.github.io/stuff/market-navigator-turn28-post-ship.html

Rebuild qualification https://github.com/acmeproducts/stuff/actions/runs/38055751195 and assurance qualification https://github.com/acmeproducts/stuff/actions/runs/38055751319 passed. Public deployment https://github.com/acmeproducts/stuff/actions/runs/38057318928 passed. Source recollection/repair and independent served-source replay completed in https://github.com/acmeproducts/stuff/actions/runs/38057262154; the job holds its concurrency slot until the planned successor window. Successor 38057368038 is accepted and pending behind it. This proves dispatch acceptance, not an already-completed second recovery cycle.

Independent source replay verified 290 files, 39 datasets and frozen index mathematics. Three upstream omissions and 16 retained-history limitations remain explicit; zero datasets need attention within the qualified corpus. The activation's injected missing/corrupt QQQ observations and wrong SPY unit were repaired before publication; damaged input and previous generations are retained in the repair artifact.

Public installed Chrome 412x915 and Edge 800x1280 touch/viewport emulation passed the full application/custom/broker/Health source comparison, visible NOW → Add QQQ → Analyze, sole anchor, X, Library parking/restoration and Health disclosure persistence, with zero unexpected errors. Real-device acceptance and actual AI prose acceptance remain pending.

The first live test's direct raw-chart setup omitted clock context; the final test follows visible NOW navigation and Add controls. It is a test correction, with no product change after the qualified candidate. The deployment check was repeated after the new Pages snapshot completed.

Evidence: market-navigator-rebuild-evidence/refresh-public-delivery.json, refresh-published-source-replay.json and refresh-delivery-status.json. Owner gates: MARKET-NAVIGATOR-OWNER-TEST-GATES-REFRESH.md. Turn 28 remains immutable at blob 9ce7f67451f9e1b7804927ce5c56adb667614724. Both Git histories and earlier rejected candidates are preserved.
