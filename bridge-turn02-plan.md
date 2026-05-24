# bridge-turn02-plan.md
**Project:** bridge · **Turn:** 02 · **Date:** 2026-05-24
**Source baseline:** `bridge-turn01-post-ship.html` (v5.2.4)

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
| `bridge-turn01-post-ship.html` | Source baseline — **never modified** | v5.2.4 | ✅ exists |
| `bridge-turn02-pre-base.html` | Verbatim copy of source + version stamp only | v5.3.0 | — |
| `bridge-turn02-base.html` | Base delta applied | v5.3.1 | — |
| `bridge-turn02-pre-ship.html` | Pre-ship delta applied | v5.3.2 | — |
| `bridge-turn02-ship.html` | Ship delta applied | v5.3.3 | — |
| `bridge-turn02-post-ship.html` | Validated — becomes Turn 03 pre-base | v5.3.4 | — |

---

## Execution Steps

1. **pre-base** Copy `bridge-turn01-post-ship.html` → `bridge-turn02-pre-base.html` · version stamp v5.3.0 only (comment line 2 + footer span) · lint · stop
2. **base** Copy `bridge-turn02-pre-base.html` → `bridge-turn02-base.html` · apply base delta (items below) · v5.3.1 · lint · stop
3. **pre-ship** Copy `bridge-turn02-base.html` → `bridge-turn02-pre-ship.html` · apply pre-ship delta · v5.3.2 · lint · stop
4. **ship** Copy `bridge-turn02-pre-ship.html` → `bridge-turn02-ship.html` · apply ship delta · v5.3.3 · lint · stop
5. **post-ship** Copy `bridge-turn02-ship.html` → `bridge-turn02-post-ship.html` · version stamp v5.3.4 only · lint · done

---

## At-a-Glance Matrix

`✓` = applied at this stage · `—` = not this stage · `⚠` = blocked (see notes)

| # | Item | pre-base | base | pre-ship | ship | post-ship |
|---|---|:---:|:---:|:---:|:---:|:---:|
| | **Version →** | v5.3.0 | v5.3.1 | v5.3.2 | v5.3.3 | v5.3.4 |
| A | **TM Tier 2 fuzzy match** — add `_tmFuzzy(text, srcLang, tgtLang)`: normalize text, compute character-level token-overlap ratio against every entry in `_tmIndex[pair]`; return best match if `confidence≥0.80` AND `usage≥3`, else `null`; gate in `translateWithRetry` after `_tmCheck` returns `null`; log `tm_fuzzy_hit` | — | ✓ | — | — | — |
| B | **TM rebuild on save** — `pbSaveCard` and `pbUpsert` currently never call `_tmBuild`; TM stays stale after edits, new cards, and imports; add `setTimeout(function(){_tmBuild(card.sourceLang,card.targetLang);},0)` at the end of `pbSaveCard`; `pbUpsert` already calls `pbSaveCards` directly — also add deferred `_tmBuild` there | — | ✓ | — | — | — |
| C | **`pbISend` usage emit** — `pbISend(idx,side)` sends a PB phrase to chat but never calls `_pbEmitUsage`; card.usage never increments; TM doesn't rebuild; add `_pbEmitUsage(card,'pb_send')` after `sendChat()` in `pbISend` | — | — | ✓ | — | — |
| D | **Quick Ring no-data toast** — `_qrOpen` silently returns when `card.relatedIntents.length===0`; user gets no feedback on long-press; replace silent return with `toast('No related phrases')` | — | — | ✓ | — | — |
| E | **Add Phrase modal lang-swap** — add `ICO.swap` (two-arrow SVG) to ICO object; add swap button next to `pbnc-pair-label` in modal header; `pbNcSwap()`: swap `_pbNcSrcLang`↔`_pbNcTgtLang`, swap `#pbnc-src`↔`#pbnc-tgt` text content, update pair label, clear BT result, re-run `pbNcRunBt()` if src non-empty | — | — | ✓ | — | — |
| F | **Telemetry E2E** ⚠ BLOCKED — verify `_telPost()` fires correctly on hang-up; confirm `usage_hit` and `clarify` events are buffered and POSTed; blocked on `tb_pb_tel_ep` staging URL from PB team — **do not begin this item until staging URL is confirmed** | — | — | — | ✓ | — |
| | **post-ship stamp only** — no new work; copy of ship; becomes `bridge-turn03-pre-base.html` | — | — | — | — | ✓ |

---

## Blocked Items

| Item | Blocked on | Owner |
|---|---|---|
| F — Telemetry E2E | Staging endpoint URL + Bearer token from PB team | PB team |
| Quick Ring data depth | CDN cards populated with `relatedIntents` | PB team |

> **If F is still blocked when Turn 02 reaches ship:** replace with a placeholder item or carry F forward to Turn 03 ship. Do not begin ship stage with a blocked item — user must decide at that point.

---

## Progress Tracker

Updated after each stage completes.

| Stage | File | Version | Lint | Committed | User go-ahead |
|---|---|---|---|---|---|
| pre-base | `bridge-turn02-pre-base.html` | v5.3.0 | — | — | — |
| base | `bridge-turn02-base.html` | v5.3.1 | — | — | — |
| pre-ship | `bridge-turn02-pre-ship.html` | v5.3.2 | — | — | — |
| ship | `bridge-turn02-ship.html` | v5.3.3 | — | — | — |
| post-ship | `bridge-turn02-post-ship.html` | v5.3.4 | — | — | — |

---

## Post-Development Update

*(Filled in after each stage completes — actual vs planned)*

| Stage | Implemented as planned | Additions beyond scope | Removals / deferrals | Bugs found |
|---|---|---|---|---|
| pre-base | — | — | — | — |
| base | — | — | — | — |
| pre-ship | — | — | — | — |
| ship | — | — | — | — |
| post-ship | — | — | — | — |

---

## Known Gaps → Turn 3

| Gap | Notes |
|---|---|
| Telemetry E2E (item F) | Carries forward if still blocked on staging URL |
| Quick Ring CDN data depth | `relatedIntents` must be populated in CDN cards by PB team |
| TM Tier 3 / persistence | `_tmIndex` rebuilt from scratch on each session; persist to localStorage for faster startup |
