# Turn 01 Base-22 Build Record

**Stage:** base  
**Candidate:** Base-22  
**Date:** 2026-08-30

Base-22 was built after the owner rejection of Base-21 and from the frozen accepted pre-base/backend lineage, not from the Base-21 generated runtime.

## Build inputs

- frozen backend: `9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js`
- accepted backend integrator: `1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py`
- Base-22 direct backend generator: `1abfeef83cc1f4da25de09e297361beb5320d516/generate-SOT-turn01-base22.py`
- frozen accepted pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`
- Base-22 UI generator: `603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py`
- governed qualification installer: `39f3b0d27a06c7ad75ac084284ca8917a8a83e0d/install-SOT-turn01-base22.sh`

## Candidate contract

- one role-driven folder selector for Source, Target, Backup and defaults;
- Available-to-Selected move semantics with reverse restoration;
- central runtime volume/folder catalog with explicit refresh and create invalidation only;
- Source/Target/Backup save against catalog metadata rather than rescanning storage;
- project creation requires name + Source + Target and inherits global Target/Backup defaults;
- no operator-facing preflight control;
- plan generation from stored evidence does not block on Source preflight/live availability;
- completed fingerprint view immediately exposes 2-copy / 3-copy / 4+-copy duplicate groups with drilldown;
- Windows-native storage authority and stdin transport retained;
- schema remains 4.

Base-22 is not accepted until the user-machine qualification produces `=== TURN 01 BASE-22 MECHANICALLY QUALIFIED ===` and the owner subsequently passes the Base owner gate.