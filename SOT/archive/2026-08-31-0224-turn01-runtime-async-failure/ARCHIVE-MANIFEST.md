# SOT Turn 01 runtime failure archive — 2026-08-31 02:24 PT

**Stage:** `base`

**Disposition:** OWNER-OBSERVED RUNTIME FAILURE; DO NOT ACCEPT CURRENT CANONICAL SURFACE.

## Evidence

The owner reported the canonical SOT surface failing in-browser with:

`SOT-turn01-base.html:72 Uncaught ReferenceError: async is not defined`

Browser-extension `contentscript.js` warnings were also present, but they are not accepted as the cause of the SOT application failure. The SOT-owned `ReferenceError` is independently fatal and must be corrected.

## Diagnosis

JavaScript permits a bare identifier statement named `async`, so a source shape such as:

```js
async
function name() {}
```

can pass syntax-only parsing while failing at runtime with `ReferenceError: async is not defined`. Therefore `node --check` alone does not prove runtime-safe async declaration semantics. The real-browser boot gate is the authority, but prior installer defects prevented that gate from completing before owner exposure.

## Recovery rule

1. Do not use the owner-observed broken canonical artifact as an implementation ancestor.
2. Regenerate from the governed clean lineage.
3. Normalize/reject line-terminator-separated `async` + `function` declaration hazards before candidate hashing.
4. Parse exact generated scripts.
5. Execute the exact generated candidate in real Chrome/Edge and require boot sentinel + zero uncaught errors before cutover.
6. Repeat parsing and real-browser boot against the exact public read-back after cutover.
7. Do not hand off a test URL unless all gates complete.
