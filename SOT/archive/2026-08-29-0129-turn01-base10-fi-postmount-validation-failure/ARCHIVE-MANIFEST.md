# Turn 01 Base-10 F:/I: post-mount validation failure

Owner run of canonical installer commit `c9fd9a0fca5acf5c14f945e7db71be89d4de3644` reached live Base-10 cutover and health successfully, then failed the online-drive qualification on `F:`.

Observed evidence:

- Base-10 generation and UI contract passed.
- Temporary database/API preflight passed with schema 4 and 3 projects.
- Live health passed: `2026.08.28.sot-turn01-base-10`.
- Windows inventory: `C,D,F,I,Q`.
- C and D browsed successfully.
- `F:` was Windows-readable but SOT browse returned HTTP 409: `F: is visible in Windows but is not mounted in WSL`.
- Automatic rollback succeeded to accepted live Base-9.

Interpretation: the privileged mount helper returned success, but the Node-side `driveMounted()` postcondition rejected the resulting F: mount. This is a runtime mount-state validation mismatch, not a discovery, database, UI, or installer-transport failure.

Governance: Base-10 remains rejected evidence and is not a baseline. The live accepted state after rollback is Base-9. The next correction must rebuild from frozen accepted pre-base/Base-3 lineage and must not patch the rejected live candidate forward.
