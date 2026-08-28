# Turn 01 Base-8 offline-volume gate failure

Archived before the next SOT patch per standing archive policy.

## Canonical installer before patch
- commit: `36606aa8cdeae5a7db4ee70182e434aba39608f7`
- blob: `2b671ed4134b75b5b5ad6c1ddadbcae65bfff6c8`

## Owner/device evidence
The Base-8 candidate successfully generated, passed temp DB/API preflight, archived/captured rollback state, installed the candidate, and passed live health with build `2026.08.28.sot-turn01-base-8`.

Windows discovery returned `C,D,E,F,G,I,Q`.

The volume API correctly represented currently unmounted Windows drives, including E/F/G/I/Q, with `mounted=false`. The installer then attempted real-folder browse on every discovered drive and treated any unavailable/offline drive as a fatal release failure. E: returned HTTP 409 `no medium found on E:` and the installer rolled back before reaching F: and I:.

## Diagnosis
An offline/removable Windows drive is valid discovery evidence but is not necessarily currently browseable. Release qualification must not fail merely because one discovered drive has no medium. The runtime must still expose discovered volumes and dynamically attempt mount/browse when selected.

## Correction policy
- Preserve Base-8 runtime behavior and accepted lineage.
- Change only the release browse gate: a per-volume 409/unavailable result is reported and skipped rather than aborting the entire Base qualification.
- Continue through the remaining discovered drives so F: and I: are actually exercised.
- Keep rollback-first behavior for genuine build/health/schema failures.
