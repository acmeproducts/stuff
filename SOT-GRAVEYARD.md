# SOT Graveyard

**Status:** AUTHORITATIVE REJECTED-APPROACH RECORD  
**Updated:** 2026-09-02
**Repository:** `acmeproducts/stuff`

This document records architectural and implementation approaches that have been rejected so they are not silently reintroduced in later SOT work.

The detailed GY-001 through GY-018 records remain authoritative and unchanged from the prior revision. Their archived evidence and decisions are preserved in repository history.

## Current failure ledger

| ID | Rejected approach | Evidence |
|---|---|---|
| GY-009 | Poll-driven completed-state rerender, ambiguous stale Plan, and non-operable selector panes | `SOT/archive/2026-08-30-1337-turn01-base22-owner-rejection/GY-009.md` |
| GY-010 | Whole-function correction that erased protected completed-state behavior | `SOT/archive/2026-08-30-1405-turn01-base23-qualification-failure/GY-010.md` |
| GY-011 | Passive AI key fields without operational validation and supervisor priming | `SOT/archive/2026-08-30-1418-turn01-base24-owner-rejection-ai/GY-011.md` |
| GY-012 | Pre-cutover-only JavaScript qualification | `SOT/archive/2026-08-30-2348-turn01-base25-owner-rejection-js-syntax/GY-012.md` |
| GY-013 | Whole-document token lint overriding parser/browser gates | `SOT/archive/2026-08-31-0017-turn01-base26-qualification-failure/GY-013.md` |
| GY-014A | AI Configuration replacement deleted protected storage defaults | `SOT/archive/2026-08-31-0038-turn01-base27-qualification-failure/GY-014.md` |
| GY-014B | Same-command dependent Bash locals under `set -u` | `SOT/archive/2026-08-31-0212-turn01-base28-qualification-failure/GY-014.md` |
| GY-015 | Partial nounset correction without structural whole-installer audit | `SOT/archive/2026-08-31-0220-turn01-base29-qualification-failure/GY-015.md` |
| GY-016 | Syntax-only checking that missed a runtime `async` line-terminator failure | `SOT/archive/2026-08-31-0224-turn01-runtime-async-failure/GY-016.md` |
| GY-017 | Windows browser harness using a WSL-backed profile | `SOT/archive/2026-08-31-0248-turn01-base31-browser-harness-failure/GY-017.md` |
| GY-018 | Numbered meta-installer patch chains and token-specific post-generation repair | repository history and Base-28 through Base-32 audit |
| GY-019 | Unserialized project mutation and destructive polling refresh | `SOT/archive/2026-09-02-turn01-coordination-owner-rejection/GY-019.md` |

## GY-019 recovery rule

SOT remains multi-project and multi-worker, but lifecycle mutation is serialized per project. Index/re-index, plan and execute may run concurrently for different projects; bounded fingerprint workers may run concurrently inside one authoritative index operation. Competing lifecycle mutations for the same project are prohibited.

A background worker must own an explicit project operation before it can mutate durable project/evidence/plan state. Older or stale completion paths must be rejected rather than allowed to overwrite newer state. UI refresh is data reconciliation only and must not replace selection, tab, picker, search, focus, scroll, or in-progress operator edits.

The 2026-09-02 failed coordination release is evidence only and is not an implementation ancestor. Recovery is SOT-scoped; unrelated repository work must not be rewound.
