# Turn 01 checkpoint before clean Base rebuild

Timestamp: 2026-08-29 04:09 PT

This archive checkpoint precedes the governed Turn 01 Base rebuild after rejection of Base-10/Base-11.

Authoritative state at checkpoint:
- accepted recovery anchor: `SOT-turn01-pre-base.html` from commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`, blob `f28d864cdc1ef659f7d47b22958c684aae90e2f7`;
- clean backend source: `sot-api.js` from commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, build `2026.08.24.sot-live-progress-5`, schema 4;
- Base-10 and Base-11 are rejected evidence and are not build inputs;
- accepted live runtime after automatic rollback is Base-9;
- `SOT-GRAVEYARD.md` rejects the strict WSL mount/readability gate as volume authority;
- `SOT-ARCHITECTURE-PLAN.md` requires one dynamically discovered available-volume inventory for Source, Target, and Backup.

The rebuild must start from the clean accepted lineage and must not patch a failed Base candidate forward.