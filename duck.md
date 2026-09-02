# Master Plan (duck.md)

Sole authority for the `duck` app. Chat history loses to this document.

## 0. TURN/STAGE LEDGER

Append a row before every build session that touches code.

| Turn | Stage | Description | Status |
|------|-------|-------------|--------|
| 0 | Plan init | Create master plan (this file) | DONE |
| 1 | R1 build | Integrate new Venice.ai API key; verify inference in-app | PENDING |
| 2 | Define | 2026-09-02: Record Define interview findings — duck = head-to-head two-person translation app; turn/keyboard handoff model; STT+TTS already exist; keyboard-options analysis answering owner's question | DONE |
| 3 | Define | 2026-09-02: Resolve keyboard question — custom per-side on-screen keyboards rendered in each user's orientation (no phone spinning); Venice AI confirmed as translation engine, MyMemory API acceptable as fallback | DONE |

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

**Keyboard — DECIDED (2026-09-02)**
Owner's question: can an on-screen keyboard pop up for North, and can South use the keyboard without spinning the phone around? Answer: YES — with a custom in-app keyboard.
- A custom on-screen keyboard is pure HTML/CSS/JS, so WE control position and orientation completely: South's keyboard renders at South's edge in normal orientation; North's keyboard renders at North's edge rotated 180° (CSS transform) so it faces North. Neither user ever spins the phone.
- The OS keyboard CANNOT do this: it only appears at the physical bottom of the device, cannot be rotated per-side, and its language cannot be forced programmatically from a web page (`lang`/`inputmode` are hints at best). Rejected as the primary input for head-to-head.
- Core insight (unchanged): translation means each side only ever types ONE language — so we build TWO alternating monolingual keyboards, not one multilingual one.
- Decision: **custom in-app per-side on-screen keyboards are the primary input.** OS keyboard remains a fallback for complex scripts we don't build (CJK IME, complex-script shaping); STT remains a first-class alternative input.
- Feasibility note: Latin variants, Cyrillic, Greek etc. are straightforward (layouts + accent/diacritic popups); we give up OS autocorrect/prediction, which is acceptable for short translated utterances.

**Translation engine — DECIDED (2026-09-02)**
- Venice AI inference is plugged in as the translation engine (owner: "we need Venice AI plugged into this after all"); ties directly to R1 (API key integration).
- The standard MyMemory API is acceptable to the owner as a fallback/secondary translation option.

**Users & outcomes**
- Users: two people in the same physical space who do not share a language (travel, service counters, family, fieldwork).
- Outcome: a fluid back-and-forth translated conversation on one device with no passing-the-phone awkwardness and no keyboard friction.

**Success criteria (draft, to firm up)**
- Turn handoff (Enter → translation shown → opposite keyboard pops) feels instant on a mid-range phone.
- Translation round trip target: TBD (proposal ~1s or less).
- Works error-free on a real phone viewport; all diagnostics in-app.

## 2. RELEASES

1. **R1 — API Key Integration**: Wire the new Venice.ai key into `duck`; verify calls succeed with in-app diagnostics.
2. **R2 — Head-to-Head Translate Shell**: North/South split UI, custom per-side on-screen keyboards (each in its user's orientation), Enter/Request/Relinquish turn handoff with auto keyboard pop, Venice AI translation round trip, STT/TTS wired in. Scope to be finalized when Define closes (needs launch language pair[s]).

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

### R2 — Head-to-Head Translate Shell (scope draft, pending Define close)
- In (draft): North/South split-screen layout, each half rotated for its user; custom per-side on-screen keyboard component (per-language layouts, accent popups); turn state machine (Enter → translate → opposite keyboard auto-pops; Request; Relinquish); Venice AI translation calls; STT input and TTS playback per side; in-app diagnostics.
- Out (draft): complex-script IMEs (OS keyboard fallback instead), accounts, history persistence.
- Gates (draft): full turn round trip works on a real phone held between two people; no console-only errors; handoff feels instant.
- Open before build: launch language pair(s); which keyboard layouts to build first; numeric perf target.

## 4. FUTURE IDEAS (parking lot)
- User authentication.
- AI response caching.
- Custom prompt input UI.
- Offline fallback behavior (TBD).
- MyMemory API wired as an automatic fallback when Venice AI fails or is slow.
- Request/relinquish turn negotiation polish (animations, haptics).
- Expanded keyboard layout library beyond launch languages.

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
| 2026-09-02 | Keyboard framing: two alternating monolingual keyboards, not one multilingual one. |
| 2026-09-02 | Keyboard RESOLVED: custom in-app per-side on-screen keyboards, each rendered in its user's orientation (South 0°, North rotated 180°) — no phone spinning ever; OS keyboard rejected as primary (can't rotate per-side, can't be force-switched), kept only as fallback for complex scripts; STT remains first-class input. |
| 2026-09-02 | Translation engine: Venice AI inference plugged in after all; standard MyMemory API acceptable as fallback/secondary. |
| 2026-09-02 | STT (voice typing) and TTS already exist and are inputs/outputs to build on. |

## 7. APPENDIX
- **Authority order**: this plan (duck.md) > all else. Chat history loses to the plan.
- Artifacts: CODE file `duck`, PLAN file `duck.md`.
- Phase: DEFINE — no code this phase; build requests go to the backlog.
- Known: duck is a head-to-head two-person translation app (see Define); prior note that duck is a generic single-page mobile app with basic navigation is superseded. A new Venice.ai API key is ready for integration (R1). Keyboard strategy and translation engine are now decided (see Decision Log).
- Open Define questions: (a) launch language pair(s); (b) which keyboard layouts to build first; (c) numeric performance target for the turn handoff (proposal on table: ~1s translation round trip).