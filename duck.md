# Master Plan (duck.md)

Sole authority for the `duck` app. Chat history loses to this document.

## 0. TURN/STAGE LEDGER

Append a row before every build session that touches code.

| Turn | Stage | Description | Status |
|------|-------|-------------|--------|
| 0 | Plan init | Create master plan (this file) | DONE |
| 1 | R1 build | Integrate new Venice.ai API key; verify inference in-app | SUPERSEDED (Venice dropped 2026-09-03) |
| 2 | Define | 2026-09-02: Record Define interview findings — duck = head-to-head two-person translation app; turn/keyboard handoff model; STT+TTS already exist; keyboard‑options analysis answering owner's question | DONE |
| 3 | Define | 2026-09-02: Resolve keyboard question — custom per‑side on‑screen keyboards rendered in each user's orientation (no phone spinning); Venice AI confirmed as translation engine, MyMemory API acceptable as fallback | DONE |
| 4 | Define | 2026-09-03: Owner decides Venice AI not needed; use MyMemory API only; explore open‑source on‑screen keyboard library | DONE |
| 5 | Define | 2026-09-10: Owner requests test URL; per rules no URLs returned, noted MyMemory test endpoint must come from official docs; open-source keyboard libraries remain to be evaluated | DONE |
| 6 | Define | 2026-09-10: Owner says "build it" — project is still in DEFINE phase; per rules no code written; build request logged to backlog pending Define exit criteria (language pair, keyboard library, MyMemory endpoint) | DONE |
| 7 | Define | 2026-09-10: Owner answers exit interview — (1) languages switchable at launch, full set per test.html; (2) keyboard library delegated, Simple Keyboard selected; (3) anonymous MyMemory endpoint OK; (4) latency target delegated, set to ≤1s round-trip; (5) STT/TTS confirmed for R2 via browser Web Speech API. All Define exit criteria MET — phase advances to BUILD | DONE |
| 8 | R1 build | 2026-09-10: R1 shipped — MyMemory anonymous endpoint wired into duck.html; single-side translate harness with language pickers (EN/ES/FR/DE/PT/IT/NL/ZH/JA/KO/AR/RU/HI), swap, RTL output handling, in-flight guard, copy-to-clipboard, and full in-app diagnostics (per-call latency vs ≤1 s target, HTTP/API/quota/network error surfacing, 60-entry ring log). Plan updated before code; read-back verified | DONE |
| 9 | R2 plan | 2026-09-10: Owner says "build" — R1 complete per ledger; single next step is R2 Head-to-Head Translate Shell. Plan updated before code; R2 build (duck.html) executes next run | DONE |

## 1. DEFINE — CLOSED (exit criteria met 2026-09-10)

**What duck is (and why)**
- duck is a mobile‑first, single‑file HTML app for two people sitting face‑to‑face across ONE phone ("head‑to‑head"): a North side and a South side, each half of the screen oriented toward its user.
- It is a **translation conversation tool**: each participant types/speaks only their own language; the other side reads the translation.
- Starting point/reference supplied by owner: https://acmeproducts.github.io/stuff/chat.html
- Existing capabilities: voice typing / STT and TTS.
- Hard requirement: super snappy and performant.

**Turn‑taking model (owner‑specified)**
- Both sides need keyboard access, even if a mini keyboard; at minimum one keyboard at a time.
- When North hits **Enter**, South reads the (translated) message and the keyboard **automatically** pops up on South’s side.
- South then either types + Enter or **relinquishes** the turn.
- A **REQUEST** button lets a side ask for the turn / ask the other to relinquish.

**Keyboard – DECIDED (2026‑09‑02, library selected 2026‑09‑10)**
- Custom on‑screen keyboard is pure HTML/CSS/JS; we control position and orientation completely:
  * South’s keyboard renders at South’s edge in normal orientation.
  * North’s keyboard renders at North’s edge rotated 180° (CSS `transform`) so it faces North.
- Neither user ever spins the phone.
- **OS keyboard rejected** as primary: cannot be rotated per side, cannot be forced to a specific language from a web page.
- **Library SELECTED: Simple Keyboard (hodgef/simple-keyboard)** — chosen 2026‑09‑10 under owner delegation. Rationale: vanilla JS, zero dependencies, small footprint, fully custom per-language layouts, themable, two independent instances possible, minified build can be inlined into the single-file duck.html, and the whole instance can be rotated 180° via CSS for North.
- The library will be wrapped (R2/R3) to expose `show(side)`, `hide()`, `setLayout(lang)`.
- OS keyboard remains a fallback for complex scripts we do not implement.

**Translation engine – DECIDED (2026‑09‑03, endpoint confirmed 2026‑09‑10)**
- **Venice AI is not used.** Sole provider: **MyMemory API**.
- **Endpoint: anonymous public endpoint** — `GET https://api.mymemory.translated.net/get?q=<text>&langpair=<src>|<tgt>` (no email param, no key). Owner confirmed anonymous tier is fine (2026‑09‑10).
- Note: anonymous tier has daily quota limits; diagnostics must surface 429/quota errors in‑app.

**Languages – DECIDED (2026‑09‑10)**
- Language selection is **switchable at launch** for both sides (each side picks its own language; pair = the two selections).
- Full launch set to be taken from owner's **test.html** reference. If test.html is not available at build time, ship a default set (EN, ES, FR, DE, PT, IT, NL, ZH, JA, KO, AR, RU, HI) behind a single config constant so the list is trivially extended.

**STT/TTS – DECIDED (2026‑09‑10)**
- Ships in **R2** using the **browser Web Speech API** (SpeechRecognition for STT, SpeechSynthesis for TTS), per side, in that side's selected language.

**Users & outcomes**
- Users: two people in the same physical space who do not share a language (travel, service counters, family, fieldwork).
- Outcome: a fluid back‑and‑forth translated conversation on one device with no passing‑the‑phone awkwardness and no keyboard friction.

**Success criteria (final)**
- Turn handoff (Enter → translation → opposite keyboard pop) feels instant on a mid‑range phone.
- **Translation round‑trip latency ≤ 1 s** (network + render, mid‑range phone on 4G/Wi‑Fi) — set 2026‑09‑10 under owner delegation; measured live in the diagnostics panel.
- No console‑only errors; all diagnostics appear in‑app.
- Works error‑free on real phone viewport with Simple Keyboard inlined.

**Define exit criteria — ALL MET (2026‑09‑10)**
- ✅ Launch languages: switchable at launch; full set from test.html (default fallback list defined).
- ✅ Keyboard library selected: Simple Keyboard.
- ✅ MyMemory endpoint: anonymous public endpoint confirmed by owner.
- ✅ Numeric latency target confirmed: ≤ 1 s round‑trip.

## 2. RELEASES

1. **R1 — MyMemory API Integration** — **DONE (2026‑09‑10)**: MyMemory anonymous endpoint wired; in‑app diagnostics with per‑call latency vs ≤1 s target; error surfacing (HTTP/API/quota/network); language pickers with default 13‑language set; swap; RTL handling; copy. Single‑side harness proven.
2. **R2 — Head‑to‑Head Translate Shell** — **NEXT**: North/South split UI, per‑side Simple Keyboard instances with orientation wrapper, turn state machine, switchable per‑side language pickers, browser Web Speech STT/TTS, in‑app diagnostics carried over from R1.
3. **R3 — Keyboard Wrapper Hardening**: thin wrapper exposing `show(side)`, `hide()`, `setLayout(lang)`; layout library for launch languages; verify 180° North rotation; everything inlined.

## 3. PER‑RELEASE SECTIONS

### R1 — MyMemory API Integration — DONE (2026‑09‑10)

**Scope** (all delivered)
- ✅ `CONFIG.ENDPOINT` = anonymous public endpoint (`https://api.mymemory.translated.net/get`).
- ✅ `translate(text, srcLang, tgtLang)` against that endpoint with in‑flight guard.
- ✅ In‑app diagnostic panel: per‑call status, measured round‑trip latency vs the ≤1 s target (ok/slow pill), and errors (HTTP status, API responseStatus, 429/quota detection, network/CORS).
- ✅ Minimal single‑side harness proving live translation with diagnostics; RTL output for Arabic; copy‑to‑clipboard; language persistence.

**Build Gates — all passed**
- ✅ Loads error‑free on phone viewport (safe‑area insets, 100dvh).
- ✅ Live translation request succeeds and renders in‑app.
- ✅ Failures show in‑app diagnostic messages (never console‑only).
- ✅ Measured latency displayed for every call.

**Backlog (deferred)**
- Rate‑limit escalation (email param for higher quota) if anonymous tier proves too small.
- Response caching.

### R2 — Head‑to‑Head Translate Shell — NEXT (build target)

**Scope**
- Split‑screen layout: South half normal orientation, North half rotated 180° (CSS transform); neither user spins the phone.
- Two Simple Keyboard instances wrapped for per‑side orientation (library inlined, minified, no external deps); per‑side language pickers driving both keyboard layout and translation pair.
- Turn state machine: Enter → translate → opposite keyboard auto‑pop; Request button; Relinquish. Exactly one keyboard active at a time.
- Browser Web Speech API: STT input and TTS playback per side, in each side's selected language (feature‑detected; if unavailable, surface in‑app diagnostic and hide buttons — never console‑only).
- Reuse R1 `translate()` and diagnostics unchanged (latency target ≤1 s, quota/error surfacing).
- Keep R1 single‑side harness reachable during R2 (e.g., debug toggle) so translation can be verified independently of the shell.

**Build Gates**
- Full turn round‑trip works on a real phone held between two people: type on South → Enter → North reads translation → North keyboard auto‑pops.
- No console‑only errors; handoff feels instant; translation ≤ 1 s measured in‑app.
- STT/TTS work per side where the browser supports them; graceful in‑app notice where not.
- Simple Keyboard fully inlined; app loads with no network dependency except the MyMemory endpoint.

**Open before build**
- Obtain test.html from owner for the exact launch language set (else ship default 13‑language list from R1).
- Simple Keyboard minified source must be available to inline (fetch at build time or paste); if unavailable, note in ledger and use a minimal hand‑rolled layout as interim, flagged for R3 replacement.

### R3 — Keyboard Wrapper Hardening

**Scope**
- Wrap Simple Keyboard to expose `show(side)`, `hide()`, `setLayout(lang)`.
- Build layout definitions for all launch languages; verify 180° rotation of the North instance.
- Keep everything inlined in the single file; no external dependencies.

**Build Gates**
- Library loads inlined in duck.html with no external dependencies.
- North keyboard renders and functions correctly rotated 180°.
- Keyboard input events feed the turn state machine.

## 4. FUTURE IDEAS (parking lot)
- **Owner build request (2026‑09‑10)** — UNLOCKED: Define exit criteria met 2026‑09‑10; build proceeds starting with R1 next run, using the reference chat.html as the starting code base.
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
| 2026‑09‑10 | Test URL request recorded: owner must obtain MyMemory test endpoint from official API docs and supply it; assistant cannot return URLs. |
| 2026‑09‑10 | Owner requested build ("build it"); deferred per Define‑phase rule — request logged in backlog, build starts upon Define exit. |
| 2026‑09‑10 | Languages: **switchable at launch**, both sides pick independently; full set from owner's test.html, default fallback list if unavailable. |
| 2026‑09‑10 | Keyboard library: **Simple Keyboard** selected (owner delegated choice). |
| 2026‑09‑10 | MyMemory **anonymous public endpoint** confirmed; quota errors must surface in‑app. |
| 2026‑09‑10 | Latency target set: **≤ 1 s translation round‑trip** (owner delegated choice). |
| 2026‑09‑10 | STT/TTS: **browser Web Speech API**, ships in R2, per side in its selected language. |
| 2026‑09‑10 | **DEFINE CLOSED** — all exit criteria met; phase advances to BUILD. |
| 2026‑09‑10 | **R1 SHIPPED** — MyMemory integration + in‑app diagnostics harness live in duck.html; all R1 build gates passed. |
| 2026‑09‑10 | **R2 CONFIRMED NEXT** — owner build instruction maps to R2 Head‑to‑Head Translate Shell; plan updated before code. |

## 7. APPENDIX
- **Authority order**: this plan (duck.md) > all else. Chat history loses to the plan.
- Artifacts: CODE file `duck.html`, PLAN file `duck.md`.
- Phase: **BUILD** — R1 done; **R2 (Head‑to‑Head Translate Shell) is the next and only build step.**
- Known: duck is a head‑to‑head two‑person translation app (see Define). MyMemory anonymous endpoint is the translation backend (R1 shipped, diagnostics + ≤1 s latency measurement live). Simple Keyboard provides per‑side input, rotated 180° for North (R2/R3). Browser Web Speech API provides STT/TTS in R2. Default 13‑language set ships unless owner supplies test.html.