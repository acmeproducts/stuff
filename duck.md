# Master Plan (duck.md)

Sole authority for the `duck` app. Chat history loses to this document.

## 0. TURN/STAGE LEDGER

Append a row before every build session that touches code.

| Turn | Stage | Description | Status |
|------|-------|-------------|--------|
| 0 | Plan init | Create master plan (this file) | DONE |
| 1 | R1 build | Integrate new Venice.ai API key; verify inference in-app | PENDING |
| 2 | Define | 2026-09-02: Record Define interview findings — duck = head-to-head two-person translation app; turn/keyboard handoff model; STT+TTS already exist; keyboard‑options analysis answering owner's question | DONE |
| 3 | Define | 2026-09-02: Resolve keyboard question — custom per‑side on‑screen keyboards rendered in each user's orientation (no phone spinning); Venice AI confirmed as translation engine, MyMemory API acceptable as fallback | DONE |
| 4 | Define | 2026-09-03: Owner decides Venice AI not needed; use MyMemory API only; explore open‑source on‑screen keyboard library | DONE |

## 1. DEFINE

**What duck is (and why)**
- duck is a mobile‑first, single‑file HTML app for two people sitting face‑to‑face across ONE phone ("head‑to‑head"): a North side and a South side, each half of the screen oriented toward its user.
- It is a **translation conversation tool**: each participant types/speaks only their own language; the other side reads the translation.
- Starting point/reference supplied by owner: https://acmeproducts.github.io/stuff/chat.html
- Existing capabilities: voice typing / STT and TTS.
- Hard requirement: super snappy and performant.

**Turn‑taking model (owner‑specified)**
- Both sides need keyboard access, even if a mini keyboard; at minimum one keyboard at a time.
- When North hits **Enter**, South reads the (translated) message and the keyboard **automatically** pops up on South’s side.
- South then either types + Enter or **relinquishes** the turn.
- A **REQUEST** button lets a side ask for the turn / ask the other to relinquish.

**Keyboard – DECIDED (2026‑09‑02)**
- Owner’s question: can an on‑screen keyboard pop up for North, and can South use the keyboard without spinning the phone? **YES** – with a custom in‑app keyboard.
- Custom on‑screen keyboard is pure HTML/CSS/JS, so we control position and orientation completely:
  * South’s keyboard renders at South’s edge in normal orientation.
  * North’s keyboard renders at North’s edge rotated 180° (CSS `transform`) so it faces North.
- Neither user ever spins the phone.
- **OS keyboard rejected** as primary: cannot be rotated per side, cannot be forced to a specific language from a web page.
- **Open‑source on‑screen keyboard libraries** will be evaluated to avoid building a keyboard from scratch (e.g., **Simple Keyboard**, **Virtual Keyboard**, **KeyboardJS**, **Mottie/Keyboard**). The chosen library will be wrapped to support per‑side orientation and language‑specific layouts.
- OS keyboard remains a fallback for complex scripts we do not implement.

**Translation engine – UPDATED (2026‑09‑03)**
- **Venice AI is no longer required** per owner decision.
- The app will use the **MyMemory API** as the sole translation service (fallback to a second provider can be added later if needed).
- API key handling and error diagnostics will be built around MyMemory’s HTTP interface.

**Users & outcomes**
- Users: two people in the same physical space who do not share a language (travel, service counters, family, fieldwork).
- Outcome: a fluid back‑and‑forth translated conversation on one device with no passing‑the‑phone awkwardness and no keyboard friction.

**Success criteria (draft)**
- Turn handoff (Enter → translation → opposite keyboard pop) feels instant on a mid‑range phone.
- Translation round‑trip latency ≤ 1 s (target to be validated).
- No console‑only errors; all diagnostics appear in‑app.
- Works error‑free on real phone viewport with the chosen open‑source keyboard.

## 2. RELEASES

1. **R1 — MyMemory API Integration**: Wire MyMemory translation calls; surface success/failure diagnostics in‑app.
2. **R2 — Head‑to‑Head Translate Shell**: North/South split UI, custom per‑side on‑screen keyboards (using selected open‑source library), turn state machine, STT/TTS, in‑app diagnostics.
3. **R3 — Keyboard Library Evaluation**: Research and select an open‑source virtual keyboard that can be oriented and localized; integrate as a wrapper component.

## 3. PER‑RELEASE SECTIONS

### R1 — MyMemory API Integration

**Scope**
- Add `MYMEMORY_API_ENDPOINT` constant.
- Implement `translate(text, srcLang, tgtLang)` using MyMemory’s public endpoint.
- Show in‑app diagnostic panel for request status, latency, and errors.

**Build Gates**
- App loads error‑free on a real phone viewport.
- A live translation request succeeds and result renders in‑app.
- Any failure shows an in‑app diagnostic message (never console‑only).

**Backlog (deferred)**
- API key / rate‑limit handling (MyMemory may require a key for higher quota).
- Response caching.

### R2 — Head‑to‑Head Translate Shell (draft)

**Scope**
- Split‑screen layout with North rotated 180°.
- Integrate selected open‑source keyboard library for each side, wrapped to enforce orientation and language layout.
- Turn state machine (Enter → translate → opposite keyboard auto‑pop; Request; Relinquish).
- STT input and TTS playback per side.
- In‑app diagnostics panel.

**Build Gates**
- Full turn round‑trip works on a real phone held between two people.
- No console‑only errors; handoff feels instant.

**Open before build**
- Launch language pair(s).
- Which keyboard library to adopt.
- Numeric performance target for translation latency.

### R3 — Keyboard Library Evaluation

**Scope**
- Survey open‑source virtual keyboards (Simple Keyboard, Mottie/Keyboard, etc.).
- Test orientation support, language layout extensibility, size footprint.
- Choose one and create a thin wrapper to expose:
  * `show(side)`, `hide()`
  * `setLayout(lang)`

**Build Gates**
- Library can be loaded as a single JS file without external dependencies.
- Wrapper can rotate the keyboard 180° for North side.
- Keyboard input events feed into the turn state machine.

## 4. FUTURE IDEAS (parking lot)
- User authentication.
- Response caching.
- Offline fallback behavior.
- Additional translation providers as secondary fallback.
- Request/relinquish turn negotiation polish (animations, haptics).
- Expanded keyboard layout library beyond launch languages.

## 5. IMMUTABLE WORKING RULES
1. Mobile‑first design, always.
2. All diagnostics in‑app — never DevTools/console‑only.
3. Update plan before code; one file write per response.
4. Read‑back verification after every push.
5. No stubs, no fake data.
6. Super snappy and performant — owner‑mandated.

## 6. DECISION LOG
| Date | Decision |
|------|----------|
| 2026‑08‑25 | Owner supplied a new Venice.ai API key; initial plan used it. |
| 2026‑09‑02 | duck defined as a head‑to‑head translation app; custom per‑side keyboards required. |
| 2026‑09‑02 | Keyboard framing: two alternating monolingual keyboards, not one multilingual. |
| 2026‑09‑02 | Keyboard RESOLVED: custom in‑app per‑side on‑screen keyboards; OS keyboard fallback only. |
| 2026‑09‑02 | Translation engine: Venice AI primary, MyMemory fallback. |
| 2026‑09‑03 | Owner decides **no Venice AI**; use **MyMemory API only**. |
| 2026‑09‑03 | Explore open‑source virtual keyboard libraries to avoid building from scratch. |

## 7. APPENDIX
- **Authority order**: this plan (duck.md) > all else. Chat history loses to the plan.
- Artifacts: CODE file `duck`, PLAN file `duck.md`.
- Phase: DEFINE — no code this phase; build requests go to the backlog.
- Known: duck is a head‑to‑head two‑person translation app (see Define). MyMemory API will be the translation backend. An open‑source on‑screen keyboard will be adopted for per‑side input. STT/TTS already exist and are inputs/outputs to build on.  

---  

*Turn / Stage Ledger row added for this update (Turn 4, Define).*