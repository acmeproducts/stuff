# SOT Turn 01 Base lightweight installer nounset failure

- Archived: 2026-09-02 04:23 PDT
- Stage: `base`
- Main before patch: `b4a22559aef18ef04d82e4b73caecd2aabd4a884`
- Affected path: `install-SOT-turn01-base.sh`
- Affected blob SHA: `f8dce5d7bd414ec69a8c3b4f443c94d714a06163`
- Host failure: `/tmp/tmp.uU5jZBRsLd: line 127: tag: unbound variable`
- Root cause: `parse_html_js()` declared `html`, `tag`, and variables derived from `$tag` in one `local` declaration under `set -u`; Bash expands the declaration before `tag` is assigned.
- Candidate generation before failure remained deterministic at SHA-256 `48c3f1ccb8af820331816cdfb94fbfcfd546ba078c9c4e28642eda54513d645c`.
- Failure occurred before cutover. No generated failed HTML becomes an implementation ancestor.
- Repair scope: installer shell declaration only; no product HTML, integrator, backend, or candidate-lineage change.
