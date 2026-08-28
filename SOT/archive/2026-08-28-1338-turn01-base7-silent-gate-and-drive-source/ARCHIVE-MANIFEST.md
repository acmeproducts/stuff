# Turn 01 Base-7 failed evidence archive

Owner/device evidence on 2026-08-28 showed the Base-7 build chain completed but the installer exited silently before cutover. Live API remained `2026.08.27.sot-turn01-base-2`.

Observed host evidence:
- Windows Get-PSDrive: C,D,E,F,G,I,Q.
- WSL mounts included `/mnt/f 9p F:\\`, `/mnt/i 9p I:\\`, `/mnt/d 9p D:`.
- `/mnt/f` and `/mnt/i` stat/list returned `Invalid argument`.
- Live `/turn01/volumes` exposed only C,D,WSL Home because Base-7 never installed.

Diagnosed defects in rejected Base-7 candidate:
1. Generated installer grepped for `TURN01_BASE_IDLE_REFRESH`, but the idle-refresh patch never emitted that literal marker. Under `set -e`, this caused the silent exit immediately after `completed-project idle refresh suppression applied`.
2. Windows mount source validation required exact `F:` / `I:` and did not normalize the host's valid `F:\\` / `I:\\` findmnt source form.
3. A mounted-but-unusable Windows mount must not be accepted merely by target/fstype/source; helper should remount when the mount cannot be stat/listed.

This is rejected evidence only. Rebuild remains rooted in accepted pre-base / frozen Base-3 lineage; do not use the failed Base-7 runtime as a baseline.
