# Master Plan (duck.md)

Sole authority for the `duck` app. Chat history loses to this document.

## 0. TURN/STAGE LEDGER

Append a row before every build session that touches code.

| Turn | Stage | Description | Status |
|------|-------|-------------|--------|
| 0 | Plan init | Create master plan (this file) | DONE |
| 1 | R1 build | Integrate new Venice.ai API key; verify inference in-app | PENDING |
| 2 | Define | 2026-09-02: Record Define interview findings — duck = head-to-head two-person translation app; turn/keyboard handoff model; STT+TTS already exist; keyboard-options analysis answering owner's question | DONE |

## 1. DEFINE

**What duck is (and why)**
- duck is a mobile-first, single-file HTML app for two people sitting face-to-face across ONE phone ("head-to-head"): a North side and a South side, each half of the screen oriented toward its user.
- It is NOT just chat — it is a TRANSLATION conversation tool. Each participant types/speaks only their own language; the other side reads the translation.
- Starting point/reference supplied by owner: https://acmeproducts.github.io/stuff/chat.html
- Already existing capabilities to build on: voice typing / STT and TTS.
- Hard requirement from owner: super snappy and performant.

**Turn-taking model (owner-specified)**
- Both sides need keyboard access, even if a mini keyboard; at minimum one keyboard at a time.
- When North hits Enter, South reads the (translated) message and the keyboard AUTOMATICALLY pops up on South's side.
- South must then either type + Enter, or RELINQUISH the turn.
- A REQUEST button lets a side ask for the turn / ask the other to relinquish.

**Key challenge raised by owner: the keyboard**
An OS-level keyboard cannot practically be multilingual-per-side in head-to-head position. Core insight: translation means each side only ever types ONE language — so the problem is not one multilingual keyboard, it is TWO alternating monolingual keyboards. Options:
1. **Custom in-app per-side mini keyboards** (built ourselves): each side's keyboard fixed to that side's language. Full control, always available, auto-pops on turn handoff with zero OS dependency. Cost: real effort — layouts, accent/diacritic popups, no OS autocorrect/prediction. Feasible for Latin variants, Cyrillic, Greek, etc.; CJK IMEs and complex-script shaping are impractical to build ourselves.
2. **OS keyboard + manual language switching**: web pages cannot programmatically force the OS keyboard's language (the `lang`/`inputmode` attributes are hints at best). User switches via the globe key each turn flip — clunky, breaks the snappy requirement, but zero dev cost.
3. **Voice-first via existing STT**: each side speaks its own language; keyboard becomes secondary. Sidesteps the keyboard problem for many pairs, but not always usable (noise, privacy, speech-averse users).
4. **Hybrid (current lean)**: custom per-side mini keyboard for supported scripts + OS keyboard fallback for complex scripts + STT as first-class input.
- Decision needed from owner before Build: which option, and which language pair(s) at launch.

**Users & outcomes**
- Users: two people in the same physical space who do not share a language (travel, service counters, family, fieldwork).
- Outcome: a fluid back-and-forth translated conversation on one device with no passing-the-phone awkwardness and no keyboard friction.

**Success criteria (draft, to firm up)**
- Turn handoff (Enter → translation shown → opposite keyboard pops) feels instant on a mid-range phone.
- Translation round trip target: TBD (proposal ~1s or less).
- Works error-free on a real phone viewport; all diagnostics in-app.

## 2. RELEASES

1. **R1 — API Key Integration**: Wire the new Venice.ai key into `duck`; verify calls succeed with in-app diagnostics.
2. **R2 — TBD**: Scope TBD (likely head-to-head translate shell once Define closes).

## 3. PER-RELEASE SECTIONS

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
Scope, gates, and backlog TBD. Candidate: head-to-head North/South UI shell with turn handoff, pending Define decisions (keyboard strategy, launch language pair, translation engine — Venice.ai inference is the presumptive engine given R1).

## 4. FUTURE IDEAS (parking lot)
- User authentication.
- AI response caching.
- Custom prompt input UI.
- Offline fallback behavior (TBD).
- Custom in-app mini-keyboard component library (per-language layouts, accent popups).
- Request/relinquish turn negotiation polish (animations, haptics).

## 5. IMMUTABLE WORKING RULES
1. Mobile-first design, always.
2. All diagnostics in-app — never DevTools/console-only.
3. Update plan before code; one file write per response.
4. Read-back verification after every push.
5. No stubs, no fake data.
6. Super snappy and performant — owner-mandated.

## 6. DECISION LOG
| Date | Decision |
|------|----------|
| 2026-08-25 | Owner supplied a new Venice.ai API key with sufficient inference budget; R1 = integrate it. |
| 2026-08-25 | duck.md created as sole authority; prior chat superseded. |
| 2026-09-02 | duck defined as a head-to-head (North/South, one phone, face-to-face) TRANSLATION app — not generic chat; owner's chat.html is the starting reference. |
| 2026-09-02 | Turn model fixed: Enter hands the turn over; receiver's keyboard auto-pops; receiver must type+Enter or relinquish; Request button exists for turn negotiation. |
| 2026-09-02 | Keyboard framing: two alternating monolingual keyboards, not one multilingual one; hybrid approach (custom mini keyboard + OS fallback + STT) is the lean pending owner decision. |
| 2026-09-02 | STT (voice typing) and TTS already exist and are inputs/outputs to build on. |

## 7. APPENDIX
- **Authority order**: this plan (duck.md) > all else. Chat history loses to the plan.
- Artifacts: CODE file `duck`, PLAN file `duck.md`.
- Phase: DEFINE — no code this phase; build requests go to the backlog.
- Known: duck is a head-to-head two-person translation app (see Define); prior note that duck is a generic single-page mobile app with basic navigation is superseded. A new Venice.ai API key is ready for integration (R1). Everything else TBD.
- Open Define questions: (a) keyboard strategy — custom vs OS vs voice-first vs hybrid; (b) launch language pair(s); (c) translation engine confirmation (Venice.ai inference presumed); (d) numeric performance target for the turn handoff.