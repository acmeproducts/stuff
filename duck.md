# Master Plan (duck.md)

Sole authority for the `duck` app. Chat history loses to this document.

## 0. TURN/STAGE LEDGER

Append a row before every build session that touches code.

| Turn | Stage | Description | Status |
|------|-------|-------------|--------|
| 0 | Plan init | Create master plan (this file) | DONE |
| 1 | R1 build | Integrate new Venice.ai API key; verify inference in-app | PENDING |

## 1. RELEASES

1. **R1 — API Key Integration**: Wire the new Venice.ai key into `duck`; verify calls succeed with in-app diagnostics.
2. **R2 — TBD**: Scope TBD.

## 2. PER-RELEASE SECTIONS

### R1 — API Key Integration

**Scope**
- In: Add `VENICE_API_KEY` constant (owner's new key) to the app's script/config; route all AI inference calls through it; surface success/failure diagnostics in-app.
- Out: Authentication, caching, custom prompt UI (deferred).

**Build Gates**
- App loads error-free on a real phone viewport.
- A live inference call succeeds and its result renders in-app.
- Any failure shows an in-app diagnostic message (never console-only).
- Read-back verification completed after push.

**Backlog (deferred)**
- User authentication to protect API usage.
- Response caching to reduce inference calls.
- UI for custom user prompts.

### R2 — TBD
Scope, gates, and backlog TBD.

## 3. FUTURE IDEAS (parking lot)
- User authentication.
- AI response caching.
- Custom prompt input UI.
- Offline fallback behavior (TBD).

## 4. IMMUTABLE WORKING RULES
1. Mobile-first design, always.
2. All diagnostics in-app — never DevTools/console-only.
3. Update plan before code; one file write per response.
4. Read-back verification after every push.
5. No stubs, no fake data.

## 5. DECISION LOG
| Date | Decision |
|------|----------|
| 2026-08-25 | Owner supplied a new Venice.ai API key with sufficient inference budget; R1 = integrate it. |
| 2026-08-25 | duck.md created as sole authority; prior chat superseded. |

## 6. APPENDIX
- **Authority order**: this plan (duck.md) > all else. Chat history loses to the plan.
- Artifacts: CODE file `duck`, PLAN file `duck.md`.
- Known so far: `duck` is a single-page, mobile-first HTML app with basic navigation, content sections, and responsive design; a new Venice.ai API key is ready for integration. Everything else TBD.