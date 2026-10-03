from pathlib import Path

plan = Path("MARKET-NAVIGATOR-MASTER-PLAN.md")
grave = Path("MARKET-NAVIGATOR-GRAVEYARD.md")

section = r'''

## 34. Turn 34 — REJECTED / RESTORE ACCEPTED NOW — 2026-10-03

### Owner disposition
Turn 34 is rejected. The candidate changed the accepted NOW surface visually and functionally. The immediate recovery requirement is not another forward patch or redesign: restore the accepted Turn 28 application byte-for-byte.

### Recovery baseline
- Accepted source: `market-navigator-turn28-ship.html`
- Accepted commit: `019810f5524c16a0f6f7132eba60d1bab416d100`
- Accepted blob: `544661884a412c57aac08fada4f961012a4bc496`
- Recovery candidate: `market-navigator-turn34-pre-ship.html`
- Required identity: recovery candidate bytes must equal the accepted Turn 28 ship bytes exactly.

### Owner definition of working
- NOW must be a pixel-perfect rendition of the last-known-good accepted NOW.
- NOW behavior must be the same as the last-known-good accepted NOW.
- No Turn 33/34 chart-controller/component code may remain in the recovery artifact.
- No visual, chart, data, index, navigation, Library, Health, Analyze, or interaction delta is authorized in this rollback.

### Mechanical recovery gates
1. candidate bytes equal `market-navigator-turn28-ship.html` exactly;
2. JavaScript syntax passes;
3. candidate boots without runtime/page errors;
4. ordinary NOW horizon, legend activation, display selector, Add control, and chart render remain operable;
5. Pages candidate returns successfully.

Turn 34 component/reuse work is closed as rejected. Any future chart-architecture work must begin again from the accepted baseline under a separately approved scope; it may not alter the recovered NOW during this rollback.
'''

t = plan.read_text()
key = "## 34. Turn 34 —"
if key in t:
    t = t[:t.index(key)].rstrip() + section
else:
    t = t.rstrip() + section
plan.write_text(t)

entry = r'''

## Turn 34 visual/functional NOW regression — REJECTED 2026-10-03
Owner rejected the Turn 34 rollback/candidate because NOW no longer matched the last-known-good surface visually or functionally. The recovery artifact must be a byte-identical copy of accepted `market-navigator-turn28-ship.html` (commit `019810f5524c16a0f6f7132eba60d1bab416d100`, blob `544661884a412c57aac08fada4f961012a4bc496`).

Permanent recovery rule: when the owner requests rollback to last-known-good, do not reproduce the prior appearance through new chart code, adapters, controllers, responsive abstractions, or approximated CSS. Restore the accepted artifact itself byte-for-byte first. Rejected Turn 33/34 chart implementations are not donors for the rollback.
'''

g = grave.read_text()
marker = "## Turn 34 visual/functional NOW regression — REJECTED 2026-10-03"
if marker not in g:
    grave.write_text(g.rstrip() + entry)

print("PASS Turn34 rejection recorded; exact Turn28 recovery required")
