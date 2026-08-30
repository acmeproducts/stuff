# Turn 01 Base-20 Owner Failure Archive

**Stage:** `base`  
**Candidate:** `2026.08.29.sot-turn01-base-20`  
**Owner test date:** 2026-08-30  
**Disposition:** REJECTED OWNER-GATE EVIDENCE — DO NOT PATCH FORWARD

## Mechanical qualification evidence

Base-20 mechanically qualified before owner testing. Windows and SOT inventory matched exactly at `C,D,F,I,Q`; every drive was Windows-readable; pre-cutover and post-cutover Windows-native browsing passed for all five drives; F: returned 9 folders and I: returned 11 folders; Windows folder create/delete passed; copied-DB Target browse persistence passed; live schema remained 4.

Qualification run: `/home/support/.openclaw/workspace/https/report/SOT/archive/20260830-001936-turn01-base20-qualification`.

## Owner-gate failures

1. Target/Backup can see F: and I:, but available space is displayed as zero.
2. Opening/using Target or Backup repeatedly appears to rescan/re-probe volumes rather than treating already discovered volumes as a stable session inventory.
3. Existing Source assignments on F: fail preflight.
4. Reopening Source selection does not expose F: or I: at all.
5. Source selection therefore does not share the same inventory/browse authority that mechanically qualified for Target/Backup.

## Root cause from governed source inspection

The Base-20 destination path and the legacy Source path are still split:

- Target/Backup use `/turn01/volumes` + `/turn01/fs`, backed by Windows dynamic discovery and Windows-native folder enumeration.
- Source picker still uses legacy `/fs?path=...`; its `roots()` scans `/mnt/<letter>` through WSL `fs.statSync()` + `mountInfo()` and therefore can omit F:/I: even when Windows discovery reports them.
- Source preflight still uses legacy WSL mount equality + Node `fs.statSync/fs.accessSync`, so an existing `/mnt/f/...` Source can be falsely marked missing/not-mounted despite Windows-native browse succeeding.
- Destination volume free-space data still comes through the older volume-record path and can report zero when WSL statfs cannot interrogate the Windows volume.
- Destination picker reloads `/turn01/volumes` during each browse call, causing unnecessary repeated discovery work and the visible rescanning behavior.

## Governance consequence

Base-20 is rejected evidence only. The next candidate must be regenerated from the frozen accepted lineage, not patched from Base-20 runtime output. The Base contract must be corrected so Source, Target, Backup, and Source preflight all consume one shared Windows-discovered inventory and one Windows-native access authority. Volume capacity must come from Windows-native volume data for Windows drives, and picker browsing must reuse a stable inventory snapshot rather than rediscovering volumes on every folder navigation.
