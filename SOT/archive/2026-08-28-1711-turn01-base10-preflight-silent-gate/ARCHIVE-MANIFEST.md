# Turn 01 Base-10 preflight silent-gate failure

Owner run of canonical installer at `bf6aa5d99e258eb256568005a3f5b8168e691a25` stopped immediately after generated-source messages:

- direct integration complete
- Base-10 mount-state correction generated
- Base UI rebuilt
- completed-project idle refresh suppression applied

No `TEMP DATABASE / API PREFLIGHT`, archive/cutover, service restart, or live health gate was reached. Therefore no Base-10 candidate was installed and live runtime was not mutated by this run.

Diagnosis: a silent `set -e` source-marker gate between generation and the explicit UI/preflight output exited without identifying which assertion failed. Correction policy: replace these silent grep gates with deterministic named assertions that report the exact missing marker, while keeping the clean accepted pre-base/Base-3 lineage and all runtime behavior unchanged.
