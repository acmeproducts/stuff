# SOT Turn 01 Base-8 wrapper source-match failure

Timestamp: 2026-08-28 17:10 PT

## Canonical state before correction

- Canonical installer commit: `06ebdccf925f52651bb967b8f48373283bd0f13e`
- Canonical installer blob: `42ebf182e1435c738576f51aef11708efc59cfc9`
- Direct governed Base-8 generator: `531d4697b39c03ec4e17740092ff21b99645b283`
- Accepted pre-base remains unchanged.

## Owner evidence

Running the canonical installer stopped before generation/cutover with:

`Base-8 browse failure gate changed unexpectedly: found 0`

No candidate was promoted and no runtime mutation occurred in this attempt.

## Root cause

The `06ebdcc...` qualification wrapper searched the *source text of the direct generator* for the fully expanded generated-shell browse-failure block. In the direct generator that block is encoded inside the Python `new_curl` string, so the wrapper's exact multiline search target does not occur. The qualification wrapper therefore fails its own source-rewrite gate before the governed generator executes.

## Correction policy

Retain the direct Base-8 generator and accepted lineage. Correct only the qualification-wrapper transformation so it edits the unique `new_curl` Python assignment in the direct generator, then mechanically verify the resulting generated installer markers before execution. Do not patch a failed runtime candidate forward.
