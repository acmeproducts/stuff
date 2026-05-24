# bridge-turn01-plan.md
**Project:** bridge · **Turn:** 01 · **Date:** 2026-05-24
**Source baseline:** `bridge-post-ship-plus-1-cc.html` (v5.1.0)

---

## Build Rules

- Read `CLAUDE.md` (process) and `claude-bridge.md` (do-not-touch constants) before touching any file
- Versions bumped and stamped in **both** code comment (line 2) **and** app footer span at every stage
- No regressions — carry all working features forward unchanged
- Touch only what is listed in this plan — nothing else
- One file per response · Stop after lint passes · Wait for explicit user go-ahead before next stage
- A stage is never patched in place — if lint fails: stop, archive, report, new turn

---

## Do-Not-Touch Constants (from claude-bridge.md)

```
RELAY_BASE = 'talk-signal.myacctfortracking.workers.dev/signal'
RELAY_WS   = 'wss://'+RELAY_BASE
RELAY_APP  = 'talk-say-v1'
```
Storage keys: see canonical table in `claude-bridge.md` — never rename, never prefix.

---

## Stage Files & Versions

| File | Role | Version | Status |
|---|---|---|---|
| `bridge-post-ship-plus-1-cc.html` | Original source (read-only) | v5.1.0 | ✅ exists |
| `bridge-turn00-post-ship.html` | Cold storage — **never modified** | v5.1.0 | — |
| `bridge-turn01-pre-base.html` | Verbatim copy of turn00 + version stamp only | v5.2.0 | — |
| `bridge-turn01-base.html` | Base delta applied | v5.2.1 | — |
| `bridge-turn01-pre-ship.html` | Pre-ship delta applied | v5.2.2 | — |
| `bridge-turn01-ship.html` | Ship delta applied | v5.2.3 | — |
| `bridge-turn01-post-ship.html` | Validated — becomes Turn 02 pre-base | v5.2.4 | — |

---

## Execution Steps

1. **PRE-REQUISITE** Copy `bridge-post-ship-plus-1-cc.html` → `bridge-turn00-post-ship.html` · no changes whatsoever · cold storage, never touched again
2. **pre-base** Copy `bridge-turn00-post-ship.html` → `bridge-turn01-pre-base.html` · version stamp v5.2.0 only (comment line 2 + footer span) · lint · stop
3. **base** Copy `bridge-turn01-pre-base.html` → `bridge-turn01-base.html` · apply base delta (items below) · v5.2.1 · lint · stop
4. **pre-ship** Copy `bridge-turn01-base.html` → `bridge-turn01-pre-ship.html` · apply pre-ship delta · v5.2.2 · lint · stop
5. **ship** Copy `bridge-turn01-pre-ship.html` → `bridge-turn01-ship.html` · apply ship delta · v5.2.3 · lint · stop
6. **post-ship** Copy `bridge-turn01-ship.html` → `bridge-turn01-post-ship.html` · version stamp v5.2.4 only · lint · done

---

## At-a-Glance Matrix

`✓` = applied at this stage · `—` = not this stage

| # | Item | pre-base | base | pre-ship | ship | post-ship |
|---|---|:---:|:---:|:---:|:---:|:---:|
| | **Version →** | v5.2.0 | v5.2.1 | v5.2.2 | v5.2.3 | v5.2.4 |
| F4 | **PWA dead code removal** — remove `<link rel="manifest">`, empty SW block, `beforeinstallprompt`, `pwaInstall()`, `pwa-install-btn` + CSS | — | ✓ | — | — | — |
| F1 | **`_telPost` host gate** — joiners must not post telemetry; wrap `_telPost()` call in `hangUp()` with `if(room.role==='creator')` | — | ✓ | — | — | — |
| A | **Compose strip revert** — remove `chat-pb-btn` and `chat-input-wrap` wrapper; flatten to `[attach][textarea][X][send]`; restore `.chat-compose-ta` styles; `align-items:center` on strip | — | ✓ | — | — | — |
| B | **ICO object: add save + bt** — add `ICO.save` (disk SVG) and `ICO.bt` (back-translate SVG); replace inline vars in `pbBubbleFootHtml` | — | ✓ | — | — | — |
| C | **Transcript ribbon redesign** — remove copy + download buttons (remain in goodbye screen only); center PB book icon with flex spacers; all buttons get `title` attributes | — | ✓ | — | — | — |
| D | **`trSaveToPb` update** — button uses `ICO.save` not `ICO.book`; capture `.tr-who` text as attribution; pass to `pbOpenNewCard({…attribution})` | — | ✓ | — | — | — |
| E | **Add Phrase modal redesign** — bubble-styled layout reusing `pb-bbl-*` CSS; header: attribution input + timestamp; body: src+TTS / tgt+TTS; footer: Save/Tags/Clarify/BT; all panels open by default; new state vars `_pbNcDirty`, `_pbNcAttr` etc.; `pbNcOnSrcBlur` auto-translates + auto-runs BT | — | — | ✓ | — | — |
| F | **`pbNcCancel` dirty check** — new `pbNcCancel()` confirms if source filled or `_pbNcDirty=true`; new `pbNcClose()` clears dirty flag | — | — | ✓ | — | — |
| G | **`pbISend` + send button + `[PB]` prefix** — new `pbISend(idx,side)` sends phrase to chat; send button in `pbIRowHtml` + `pbOvRowHtml`; chat render replaces `[PB]` text prefix with grey `ICO.book` SVG; `.pb-irow-send` CSS | — | — | ✓ | — | — |
| H | **✓Verified tag, remove green badge** — `pbSetVerdict`: good verdict adds `✓Verified` tag + logs clarify entry; `pbRemoveTag` intercepts `✓Verified` and clears BT verdict; `pbBubbleHtml`: remove `pb-vbadge good`; ⚑ flag badge preserved | — | — | ✓ | — | — |
| I | **`pbCommitSrcEdit` auto-BT** — after saving edited source: open BT panel if closed, call `pbRunBt(id)`; same UX as Add Phrase modal blur | — | — | ✓ | — | — |
| F3 | **CDN `semanticRelationships` fix** — `_pbNormCard()` drops `semanticRelationships`; add to return object: `semanticRelationships: c.semanticRelationships \|\| null` | — | — | ✓ | — | — |
| F2 | **TM Tier 1 wiring** — `_tmCheck()` has zero callers; gate at top of `translateWithRetry()`; log `tm_hit` on cache hit; thresholds unchanged (confidence ≥ 0.90, usage ≥ 5) | — | — | — | ✓ | — |
| | **post-ship stamp only** — no new work; copy of ship; becomes `bridge-turn02-pre-base.html` | — | — | — | — | ✓ |

---

## Progress Tracker

Updated after each stage completes.

| Stage | File | Version | Lint | Committed | User go-ahead |
|---|---|---|---|---|---|
| PRE-REQUISITE | `bridge-turn00-post-ship.html` | v5.1.0 | n/a | ✅ | n/a |
| pre-base | `bridge-turn01-pre-base.html` | v5.2.0 | ✅ | ✅ | ✅ |
| base | `bridge-turn01-base.html` | v5.2.1 | ✅ | ✅ | ✅ |
| pre-ship | `bridge-turn01-pre-ship.html` | v5.2.2 | ✅ | ✅ | ✅ |
| ship | `bridge-turn01-ship.html` | v5.2.3 | ✅ | ✅ | ✅ |
| post-ship | `bridge-turn01-post-ship.html` | v5.2.4 | ✅ | ✅ | ✅ |

---

## Post-Development Update

*(Filled in after each stage completes — actual vs planned)*

| Stage | Implemented as planned | Additions beyond scope | Removals / deferrals | Bugs found |
|---|---|---|---|---|
| pre-base | ✅ version stamp only (v5.2.0) | — | — | — |
| base | ✅ F4/F1/A/B/C/D as planned | — | C: room-tr-overlay Copy btn removed (interpretation); C: PB book icon added to call-transcript-header | — |
| pre-ship | ✅ E/F/G/H/I/F3 as planned | — | — | — |
| ship | ✅ F2 as planned | — | — | — |
| post-ship | ✅ version stamp only (v5.2.4) | — | — | — |

---

## Known Gaps → Turn 2

| Gap | Notes |
|---|---|
| TM Tier 2 fuzzy match | Not specced for Turn 1 |
| Quick Ring requires CDN cards with `relatedIntents` | Works only when PB team CDN data is loaded |
| Telemetry endpoint not live | PB team must provide staging URL before testing F1/F2 end-to-end |
