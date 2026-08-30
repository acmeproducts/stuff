# Turn 01 Base-18 Static Audit Archive

Date: 2026-08-29
Stage: `base`
Live accepted runtime: `2026.08.28.sot-turn01-base-9`

Base-18 was not owner-run. Static audit before execution found two governance/qualification concerns that must be corrected before another WSL command is issued:

1. Base-18 regenerated a Base-14 intermediate and then applied a separate PowerShell transport patch. Although the intermediate was regenerated from frozen accepted sources, this creates an avoidable patch-on-generated-output chain. The next candidate will generate the corrected Windows-native helpers directly from clean Base-3.
2. Several planned qualification commands still relied on `set -e`/ERR trapping around bare Python/Node assertions. That can leave `UNHANDLED` as the only named evidence for a planned gate, contrary to the Base qualification instrumentation contract.

Base-18 remains static-audit evidence only. It is not a runtime baseline and no Base-18 generated runtime artifact is an input to the next candidate. Base-9 remains live.