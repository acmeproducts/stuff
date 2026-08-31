# Turn 01 Base-26 qualification failure

**Stage:** `base`  
**Candidate:** Base-26  
**Disposition:** FAILED BEFORE CUTOVER  
**Observed:** 2026-08-31 00:17 PDT

## Evidence

Owner ran the immutable Base-26 installer commit `52d4c502a0d4b885ff28fee9f975ddefef00977b`.

Qualification advanced through clean source fetch, Python compilation, accepted pre-base -> Base-22 regeneration, and Base-24 behavior regeneration. It then stopped at Base-26 generation with:

```text
Base26 compatibility syntax prohibited: ?.
FAIL GENERATE_BASE26_UI failed
FAIL FINAL qualification failed rc=1
```

Persistent runtime log:

`/home/support/.openclaw/workspace/https/report/SOT/archive/20260831-001702-turn01-base26-qualification/qualification.log`

No Base-26 cutover occurred. The live Base HTML was not replaced by this run. Backend remained `2026.08.30.sot-turn01-base-22`, schema 4.

## Root cause

The Base-26 integrator applied a global compatibility-token prohibition to the **entire regenerated application HTML**:

```python
for bad in ['?.','...cfg','...history']:
    if bad in src: raise SystemExit('Base26 compatibility syntax prohibited: '+bad)
```

The clean governed ancestor already contains optional-chaining syntax elsewhere in preserved application code. The new AI delta had been intentionally authored without optional chaining, but the gate did not scope itself to the new delta. Therefore the qualifier rejected inherited syntax that was not introduced by Base-26.

This is a qualification-design defect. A compatibility policy must either be proven by the exact parser/browser gates already required by governance or, if a narrower coding-style restriction is desired for a new delta, it must inspect only that new delta. It must not reject a clean ancestor merely because a text token appears somewhere in preserved code.

## Corrective contract for Base-27

Base-27 is rebuilt from the governed clean lineage, not from Base-26 generated HTML.

1. Preserve the exact generated/public per-script parse, combined parse, and real browser boot gates introduced after GY-012.
2. Remove the broad whole-document `?.` / spread-token prohibition.
3. If compatibility lint is retained, scope it only to the newly authored Base-27 AI/boot delta.
4. Let actual parser and browser boot execution decide syntax compatibility for the complete final artifact.
5. Do not emit `MECHANICALLY QUALIFIED` or a test URL until the exact public read-back passes those gates.

## Protected state

- accepted pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`
- clean Base-22 UI integrator: `603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py`
- clean Base-24 behavior integrator: `083aa1334208b1e6995fa18852e82722a815f331/integrate-SOT-turn01-base24-ui.py`
- operational donor: `devstream-test.html`
- Base-25/Base-26 generated HTML remains failed evidence and is prohibited as implementation input.
