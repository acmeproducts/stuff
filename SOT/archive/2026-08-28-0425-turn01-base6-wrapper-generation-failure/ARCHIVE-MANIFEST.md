# SOT patch archive

Archived before correcting the Base-6 wrapper-generation failure observed 2026-08-28 04:25 PT.

Failure occurred before live cutover: `Base-5 generated backend patch chain changed unexpectedly`.

Frozen canonical artifacts before this correction:
- `install-SOT-turn01-base.sh` blob `e6b4f4e1ab62abb69ac623285e71701e1cef3335`
- `patch-SOT-turn01-base-installer-wsl9p.py` blob `d2fba36ea9c41ab016f25fa000101175fd92804b`

Cause: the Base-6 wrapper patcher searched for a literal `{drvfs_patch_url}` block inside the Base-5 wrapper, but the Base-5 wrapper contains Python source that constructs that block with an f-string. The matcher therefore failed before any runtime mutation.

Standing rule: archive affected SOT canonical artifacts under `SOT/archive/` before patching.
