# Turn 01 Base-19 Static Review Archive

Date: 2026-08-29
Stage: `base`
Live accepted runtime: `2026.08.28.sot-turn01-base-9`

Base-19 had not been owner-run. Final static review found one installer-only shell construction worth removing before execution: Windows TEMP cleanup path construction depended on Bash backslash trimming/concatenation. This is unnecessary platform-boundary ambiguity.

Correction: obtain the exact Windows test-folder path using Windows PowerShell `Join-Path` and pass it back as data. Product generator, candidate runtime behavior and qualification contract are otherwise unchanged.

This archive records the pre-correction installer state before modifying `install-SOT-turn01-base19.sh`.