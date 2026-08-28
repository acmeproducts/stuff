# Turn 01 Base-7 wrapper generation failure archive

Owner gate evidence: canonical Base-7 installer failed before live cutover with:

`expected build changed unexpectedly: found 2`

The failure occurred while transforming the generated Base-6 wrapper. No candidate runtime was installed by this attempt.

Archived failed definition:
- `patch-SOT-turn01-base-wrapper7.py` at blob `20365c33f777b528055c532e3be35cd6911857da`
- canonical installer at commit `c81eeb502b31e65d56cad3b4b3c5b5eafd74432e`

Diagnosis: the Base-6 generated installer intentionally contains two `EXPECTED_BUILD='2026.08.28.sot-turn01-base-6'` markers, while the wrapper7 transformer incorrectly required exactly one. The backend patch-chain insertion also used escaped `\\n` text where real newlines are required and is corrected in the rebuilt transformer.

Governance: this failed Base-7 candidate is evidence only and is not a baseline. Rebuild remains rooted in the accepted pre-base/Base lineage.