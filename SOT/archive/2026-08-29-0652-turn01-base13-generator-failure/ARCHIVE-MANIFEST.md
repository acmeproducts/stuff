# Turn 01 Base-13 generator failure

Owner run of `install-SOT-turn01-base13.sh` at commit `bb0860be2a47eb930a9b776b33a83905983440f1` restored accepted Base-9 successfully, then failed before candidate generation/cutover.

Observed result:
- accepted Base-9 runtime restored successfully;
- clean Base-3 backend integration completed;
- `patch-SOT-turn01-base-windows-browse.py` failed in `replace_function()` while replacing `saveStorage`;
- exact exception: `ValueError: substring not found` while searching for `\nfunction createStorageFolder`;
- the clean Base-3 source declares `async function createStorageFolder`, so the source-surgery helper assumed the wrong declaration shape;
- no Base-13 candidate was installed and no live mutation occurred after the accepted rollback.

Governance consequence: Base-13 is failed build evidence only. Rebuild again from the frozen accepted pre-base/Base-3 lineage. Do not use generated Base-13 output as input. The replacement generator must handle both `function` and `async function` boundaries deterministically and must validate those boundaries before emitting the candidate.