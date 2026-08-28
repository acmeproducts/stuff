# SOT patch archive

Archived before correcting WSL2 Windows-drive mount classification for Turn 01 Base-5.

Observed failed evidence:
- Windows discovery correctly returned `C,D,E,F,G,I,Q`.
- Lazy mount of `D:` succeeded at the kernel level as `target=/mnt/d fstype=9p source=D:`.
- Base-5 incorrectly required `fstype=drvfs`, so it rejected the real WSL2 Windows mount and rolled back to the accepted Base-2 runtime.

Canonical pre-patch artifacts:
- `install-SOT-turn01-base.sh` blob `c70d697f1638e903660efcef07e8a32bb3eae0d0`
- `patch-SOT-turn01-base-powershell.py` blob `ebb04b183ef9e2e9de5f733bf85267084b71e878`
- Base-5 installer commit `a38287b25097289369ff92651e58654aec0dd69c`

Correction contract:
- WSL2 Windows-drive mounts are valid when the mount target is exact, source is the expected drive letter, and filesystem type is either `9p` (current WSL2 representation) or `drvfs` (compatible representation).
- Placeholder directories/root ext4 remain invalid.
- D/F/Q must still pass real-folder browse gates before Base qualifies.
