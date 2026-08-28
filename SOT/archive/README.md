# SOT Patch Archive

Standing SOT governance rule effective 2026-08-28:

Before patching any canonical SOT artifact, archive the current affected artifact(s) under `SOT/archive/` before modifying them. Each archive must record the patch reason and the exact prior Git blob/commit lineage. Runtime installers must also preserve the live pre-patch SOT API/Base artifact under the served `SOT/archive/` tree before cutover.

The archive is recovery evidence. It is not a build source unless an explicit rollback selects it.
