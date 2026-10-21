# Current release disposition: BLOCKED — incomplete source periods

The owner identified daily sources through October 19 inside an October 20 package. Prior arithmetic/hash/browser PASS records did not enforce synchronized source periods. They are historical evidence, not current release acceptance. Full seven-horizon visual audit remains open.

Strict upstream completeness and consumer withholding are implemented in 305483d60cc8fb47407c97a6e511134f5f5ac9ba. Verification: https://github.com/acmeproducts/stuff/actions/runs/39584145637. Live publication requires all enabled daily/trading-day/daily-NAV sources through the completed market date, with no gaps in the last five market sessions; other cadences must meet publication calendars. A successful fetch cannot override missing periods. No synthesized observations, proxy substitution or line extension.

# Chart contract audit — current disposition

The October 20 owner decision permits dollar-based series to share the dollar axis. Each legend information card explains its native quote unit; USD, USD/barrel and USD/pound retain actual native values. C21 remains resolved.

The October 21 screenshot correction passes all 25 mapped requirements through 12 mandatory suites for application 7b4526e0aaf650ab682d9e30cd804cf55fe36bc5 and data package c64d72b61356519a32b883fc784663780e0ce0ce8a04d8ae89dff09aef898baf. The cumulative gate retains 192 contract cases, 168 index-reconciliation cases and source/model qualification: 39 Level 0 sources, 273 Level 1 source/horizon combinations and 21 Level 3 index/horizon combinations.

Corrected presentation includes distinct Y ticks, nonnegative dollar padding, actual market-date tick positioning, date-label collision suppression, legend navigation, comparison contrast, contained footer and an explanation control clear of axis labels. Automatic index ranges are retained with an explicit span disclosure.

The popup reports linked observation date | current Indexed100 value | actual native dollar value. Independent parity checks pass 108 combinations across NOW/Analyze, three viewports, three horizons, both reference choices and QQQ/WTI/copper. The submitted QQQ example was numerically correct: 100 × 718.3599853515625 / 116.73999786376953 = 615.3503499202194. No baseline value substitution or index-model rewrite was necessary.

Workflow https://github.com/acmeproducts/stuff/actions/runs/39551694099 passed synchronization, cumulative tests, deployment and public verification of the exact application/package and all 217 resources. Final phone, tablet and desktop screenshots were reviewed. Evidence: MARKET-NAVIGATOR-SCREENSHOT-CORRECTION-QUALIFICATION.json and MARKET-NAVIGATOR-CHART-CONTRACT-QUALIFICATION.json.

Status: AUTOMATED_SCOPE_PASS; shipment remains PENDING_EXTERNAL_ACCEPTANCE for physical Windows 11/Android and AI prose/full Analysis Library content review. No new owner retry request. Baseline and default product route unchanged.

Authority: MARKET-NAVIGATOR-CHART-OWNER-CLARIFICATIONS.md; executable matrix: market-navigator-acceptance/contract.json.
