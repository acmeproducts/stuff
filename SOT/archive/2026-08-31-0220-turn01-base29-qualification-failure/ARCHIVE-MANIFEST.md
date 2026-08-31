# Turn 01 Base-29 Qualification Failure Archive

**Stage:** base  
**Candidate:** Base-29  
**Disposition:** FAILED BEFORE CUTOVER

## Evidence

The Base-29 run reached and passed generated artifact identity, all protected static contracts, per-script JavaScript parse, combined JavaScript parse, browser harness discovery, and exact probe identity. It then stopped before browser execution with Bash nounset failure:

`line 177: tag: unbound variable`

The generated candidate SHA was:

`95b14ab050f4e6b988a4598e50656a7878221416760ff170208028555667e18b`

The failure occurred in the qualifier function `run_browser()` because a single `local` declaration both assigned `tag="$2"` and expanded `$tag` in later assignments on the same declaration while `set -u` was active. Base-29 corrected this exact defect in `parse_scripts()` but failed to audit the same Bash pattern in `run_browser()`.

No cutover occurred. Current canonical live SOT remains unchanged.

## Governing correction

Base-30 must be regenerated from the same clean accepted UI lineage and may reuse the deterministic Base-28 UI integrator because the generated candidate itself passed all gates reached. The qualifier must independently initialize positional locals before any dependent expansion in both `parse_scripts()` and `run_browser()`.

Before handoff, the Base-30 installer source must itself be syntax checked and statically audited for any remaining same-line dependent local expansion involving `tag`.

The existing exact generated/public parse + real browser boot floor remains mandatory. No test URL may be declared qualified until those gates pass.
