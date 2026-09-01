# SOT Turn 01 Base failed qualification archive

- Run: `20260831-180030-turn01-base-qualification`
- Installer commit under test: `b60dae39c8e71f5743c21c2f42efed08a290a399`
- Installer blob under test: `b3d204c2e50fe3206af3884f83adc2a66fad6c98`
- Candidate SHA-256 generated before failure: `48c3f1ccb8af820331816cdfb94fbfcfd546ba078c9c4e28642eda54513d645c`
- Passed through generated per-script and combined JavaScript parsing.
- Windows-native browser selected: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- Failure gate: `JS_BROWSER_HARNESS_SELFTEST`
- Root cause evidence: Edge retained the Windows-native temporary browser profile beyond the installer's cleanup retry window; cleanup returned `rc=3`.
- Failure occurred during the trivial browser harness self-test, before probe staging and generated HTML browser qualification.
- No generated HTML was cut over.
- Failed generated HTML must not be used as an implementation ancestor.
- Supplied failed-run evidence path: `SOT/archive/20260831-180030-turn01-base-qualification/qualification.log`
- Repository evidence status at archive time: the supplied qualification log path was not present in GitHub; no log was fabricated.
