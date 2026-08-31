# Turn 01 Base-28 qualification failure

## Result

Base-28 regenerated successfully from the governed clean lineage and passed all static protected-behavior gates, including Default Target, Default Backup, storage-default save, Index, Plan, selector, AI provider, and supervisor checks.

Qualification then failed **before JavaScript parse/browser boot and before cutover** because the installer used one Bash `local` declaration that referenced `tag` in another initializer on the same command while `set -u` was active:

```bash
local html="$1" tag="$2" dir="$TMP/scripts-$tag" combined="$TMP/combined-$tag.js" count f
```

Bash expands those right-hand sides before the `tag` local assignment is established, so the qualifier aborted with `tag: unbound variable`.

## Classification

This is a qualifier implementation defect, not evidence of an SOT application, storage, backend, or generated-HTML defect. Base-28 did not cut over and remains failed qualification evidence only.

## Correction rule

The next candidate must regenerate from the governed clean lineage. Qualifier locals that depend on earlier locals must be declared in separate commands under `set -u`. The corrected qualifier must then proceed through the already-mandated exact generated/public per-script parse, combined parse, real browser boot, public identity, and rollback gates.

## Evidence

Owner run: `20260831-021139-turn01-base28-qualification`

Generated candidate SHA-256 before qualifier failure: `95b14ab050f4e6b988a4598e50656a7878221416760ff170208028555667e18b`
