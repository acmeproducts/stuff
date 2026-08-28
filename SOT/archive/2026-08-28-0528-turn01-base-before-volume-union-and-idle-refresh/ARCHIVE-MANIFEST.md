# Turn 01 Base archive — before volume union and idle-refresh correction

Archived before patching per SOT archive governance.

## Rejected/current candidate evidence

- Canonical installer commit before correction: `e182835393f1ab7b9c2508684275b06d476e37f7`
- Canonical installer path: `install-SOT-turn01-base.sh`
- Base UI integrator blob before correction: `d7dc31b41b7aa9e3680005c2f699d10e3313c608`
- Base backend integrator: `integrate-SOT-turn01-base.py` as present on `main` at archive time.
- Accepted pre-base UI remains pinned at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`, blob `f28d864cdc1ef659f7d47b22958c684aae90e2f7`.

## Defects driving this correction

1. Volume inventory must be the union of real Windows filesystem drives reported by PowerShell and real Windows-backed WSL mounts (`/mnt/<letter>` with exact drive-letter source and filesystem type `9p` or `drvfs`). A mere directory is never a volume. This permits a real WSL-mounted P: even when PowerShell does not report it, while retaining C,D,E,F,G,I,Q from Windows discovery.
2. Completed stable projects must stop participating in the 3-second project/index refresh loop. Project-list polling is required only while an index job is active; selected Index polling stops at 100% when no active job exists. UI actions that change sources or start/re-index a project explicitly call `load()` and restart active polling.

## Governance

This archive is evidence only and is not a new baseline. Rebuild from the accepted pre-base lineage; do not patch a failed live candidate forward.
