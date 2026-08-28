# SOT archive — Turn 01 Base-8 post-build gate failure

Archived before correcting the next SOT patch, per standing archive rule.

## Failed candidate

- Installer commit: `531d4697b39c03ec4e17740092ff21b99645b283`
- Installer blob: `087902f20f1964040d1469562c9a3fb5330ee398`
- Owner output reached successful generation of Base-8 backend and idle-refresh UI, then exited before live cutover.
- Live API remained on the previously accepted/runtime build before this candidate.

## Diagnosis

The generated-artifact mechanical gate used a brittle BRE `grep` pattern for the JavaScript mount-source normalization expression. The actual patch had already succeeded (`Windows mount source normalization applied; Base build 8 generated`), but the post-build grep did not match the emitted JavaScript and `set -e` terminated the installer silently before the archive/cutover/health section.

## Correction scope

- Do not change runtime behavior.
- Replace the brittle regex grep with a stable fixed build-marker gate for the already mechanically validated Base-8 mount-source patch.
- Preserve rebuild from accepted pre-base lineage and all existing rollback/cutover gates.
