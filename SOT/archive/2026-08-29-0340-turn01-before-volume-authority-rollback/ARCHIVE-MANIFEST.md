# SOT archive — before volume-authority rollback

Timestamp: 2026-08-29 03:40 PDT

Reason: Turn 01 Base-10 and Base-11 mechanically reached live runtime but rejected Windows-readable F: because the new strict WSL mount/readability validator was made authoritative for volume usability. Earlier SOT lineage had already demonstrated dynamic Windows volume discovery on the fly. Owner directed rollback, no patch-forward, graveyard update, and plan correction.

Pre-change canonical plan:
- Path: `SOT-ARCHITECTURE-PLAN.md`
- Blob: `d4dd1993f686a8e4948b6ed849b309126b25d76e`

Pre-change SOT graveyard:
- `SOT-GRAVEYARD.md` did not exist on `main` before this correction.

Runtime evidence:
- Base-11 health passed on schema 4 and build `2026.08.29.sot-turn01-base-11`.
- Windows discovery returned C,D,F,I,Q.
- C and D were usable.
- F was Windows-readable but rejected by SOT after the mount helper completed, with target `/mnt/f`, fstype `9p`, source `F:\\`, normalized source `F:`.
- Automatic rollback restored live build `2026.08.28.sot-turn01-base-9`.

Governance decision:
- Base-10 and Base-11 are rejected evidence, not baselines.
- Do not patch either candidate forward.
- Restore the proven dynamic-volume authority model from the accepted lineage and rebuild the Target/Backup delta from clean source.
