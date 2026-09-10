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
| 8 | R1 build | 2026-09-10: R1 shipped — MyMemory harness in duck.html | OFF-TARGET (owner rejected 2026-09-10: wanted chat.html upgraded, not a new harness) |
| 9 | R2 plan | 2026-09-10: Owner says "build" — plan updated before code | DONE |
| 10 | Plan redirect | 2026-09-10: Owner rejects mis-build. TRUE TARGET: baseline chat.html improved with per-side on-screen keyboards — nothing else. Spec locked: (a) baseline must not be crippled/deleted/changed — additive only; (b) tap nub slides out your keyboard; (c) Enter collapses your keyboard and slides out the other side's; (d) nub sends a request rendered in the keyboard-owner's localized language; owner relinquishes via nub or by typing+Enter; (e) NO OS keyboard involvement, NO keyboard-selection UI. Plan rewritten with exact implementation approach; code next run once baseline source is pasted | DONE |
| 11 | Spec correction | 2026-09-10: Owner refines request UX — nub is a keyboard icon at each side's physical bottom edge; request appears as an OVERLAY on the keyboard-owner's side with explicit Confirm / Decline buttons (not just a passive bubble). Plan spec updated accordingly (nub = keyboard icon bottom-anchored; request overlay = confirm/decline chooser; decline path added to state machine). Build still blocked on chat.html source | DONE |

## 1. DEFINE — CLOSED (exit criteria met 2026-09-10)

**What duck is (and why)**
- duck is a mobile‑first, single‑file HTML app for two people sitting face‑to‑face across ONE phone ("head‑to‑head"): a North side and a South side, each half of the screen oriented toward its user.
- **The artifact is the baseline chat.html (owner-supplied reference: https://acmeproducts.github.io/stuff/chat.html), UPGRADED with per-side on-screen keyboards. It is not a new app or harness.**
- Baseline capabilities that must remain untouched: existing chat UI, voice typing / STT, TTS, and any existing translation behavior.
- Hard requirement: super snappy and performant.

**Baseline preservation — IMMUTABLE (owner, 2026‑09‑10)**
- Do not cripple, delete, or change anything in the baseline.
- Integration is strictly additive: new code lives in appended `<style>`/`<script>` blocks and runtime-injected DOM (nubs, keyboard docks). No edits to existing markup, styles, or scripts.
- Where integration must touch baseline behavior (e.g., Enter commit), use call-through wraps / addEventListener — never remove or rewrite existing handlers.

**Interaction spec — LOCKED (owner, 2026‑09‑10; request UX corrected same day)**
- Each side has a small persistent **nub**: a **keyboard icon** (⌨) pinned to that side's **physical bottom edge** (South nub at screen bottom; North nub at screen bottom from North's perspective = screen top in absolute terms, rendered inside the rotated North frame).
- **Tap nub (IDLE)** → that side's on-screen keyboard slides out from its bottom edge.
- **Tap nub (own side active)** → collapse own keyboard to IDLE.
- **Tap nub (OTHER side active)** → an **overlay request** appears on the keyboard-owner's side, in the owner's selected language: "The other person would like the keyboard." with two buttons: **Confirm** (relinquish: close owner's keyboard, open requester's) and **Decline** (dismiss overlay, requester keeps waiting; logged to diagnostics). Owner can also implicitly confirm by typing + Enter (normal handoff).
- **Enter** → message commits (via baseline send path), sender's keyboard collapses, and the other side's keyboard slides out automatically.
- At most one keyboard is ever open. No OS keyboard is ever invoked. No keyboard-selection UI exists.

**Keyboard – DECIDED (2026‑09‑02, locked 2026‑09‑10)**
- Custom on‑screen keyboards, pure HTML/CSS/JS; we control position and orientation completely:
  * South’s keyboard renders at South’s edge in normal orientation.
  * North’s keyboard renders at North’s edge rotated 180° so it faces North.
- **Library: Simple Keyboard (hodgef/simple-keyboard)** — vanilla JS, zero dependencies, custom per-language layouts, themable, two independent instances, minified build inlines into the single file, whole instance rotates 180° via CSS for North.
- OS keyboard: REJECTED entirely (owner 2026‑09‑10). No fallback, no selection screen.

**Translation engine – DECIDED (2026‑09‑03)**
- **Venice AI is not used.** Sole provider: **MyMemory API**, anonymous public endpoint (`GET https://api.mymemory.translated.net/get?q=<text>&langpair=<src>|<tgt>`).
- Anonymous tier has daily quota limits; diagnostics must surface 429/quota errors in‑app.

**Languages**
- Each side picks its own language; the selection drives that side's keyboard layout, its STT/TTS language, and the translation pair.
- Launch set from owner's test.html if supplied; otherwise default 13 (EN, ES, FR, DE, PT, IT, NL, ZH, JA, KO, AR, RU, HI) behind one config constant.

**STT/TTS**
- Baseline chat.html already has voice typing/TTS — preserved untouched. Any additions use browser Web Speech API, feature-detected, with in-app notice where unsupported.

**Users & outcomes**
- Two people in the same physical space who do not share a language hold one phone between them and converse; the keyboard follows the turn without anyone spinning the phone.

**Success criteria (final)**
- Baseline features all still work exactly as before (manual checklist).
- Nub tap slide-out and Enter handoff feel instant on a mid-range phone (transform-only animation).
- Translation round‑trip ≤ 1 s, measured live in-app.
- Requests appear as confirm/decline overlays in the keyboard-owner's language.
- All diagnostics in-app; zero console-only errors.

## 2. RELEASES

1. **R1 — MyMemory harness** — OFF-TARGET (2026‑09‑10). Built a standalone harness instead of upgrading chat.html. Salvage: `translate()` function and diagnostics panel code may be reused inside R2; the harness UI is discarded.
2. **R2 — chat.html Keyboard Upgrade** — **NEXT**: baseline chat.html verbatim + additive keyboard layer exactly per the spec in §3.
3. **R3 — Keyboard Hardening**: layout library for all launch languages, rotation verification on real devices, animation polish (haptics, nub badge).

## 3. PER‑RELEASE SECTIONS

### R1 — MyMemory harness — OFF-TARGET (closed 2026‑09‑10)

- Mis-build: owner asked for chat.html + per-side keyboards; a standalone single-side harness was delivered instead. Redirect recorded in ledger row 10.
- Reusable salvage: `translate(text, src, tgt)` against the MyMemory anonymous endpoint, in-flight guard, in-app diagnostics (latency vs ≤1 s, HTTP/API/quota/network errors, ring log). This code moves into R2's appended script block.

### R2 — chat.html Keyboard Upgrade — NEXT (exact implementation approach)

**Step 0 — Baseline ingestion (BLOCKING PREREQUISITE)**
- Owner pastes the current chat.html source (build agent cannot fetch URLs). duck.html is rebuilt as: chat.html **verbatim** + appended keyboard layer. If any byte of baseline must change to integrate, the wrap/replace decision is logged in the ledger with justification — default is wrap, never edit.

**Step 1 — Appended layer structure (all new, nothing existing touched)**
- One `<style>` block and one `<script>` block appended before `</body>`.
- Script injects DOM at runtime so even baseline markup is untouched:
  * `#duckDockSouth` — keyboard dock fixed to the bottom (South) edge.
  * `#duckDockNorth` — keyboard dock fixed to the top edge, `transform: rotate(180deg)` (plus slide translate, see Step 2) so it faces North.
  * `.duckNub` × 2 — **keyboard-icon (⌨) tabs pinned to each side's physical bottom edge**: South nub at screen bottom (above its dock when closed), North nub at screen top in absolute terms inside the rotated North frame so it appears at North's bottom. Always visible, small, non-intrusive; labeled in that side's selected language where space allows (icon primary).
  * `#duckRequestOverlay` — a single overlay element, shown on the keyboard-owner's side (inside that side's orientation frame, so North's requests render rotated for North), containing the localized request text + **Confirm** and **Decline** buttons.
  * Diagnostics panel reuse from R1 salvage, hidden behind the existing debug affordance if the baseline has one, else a tiny toggle.

**Step 2 — Slide mechanics (snappiness rules)**
- Docks are pre-rendered once and never re-created; open/close is transform-only:
  * South dock: `transform: translateY(100%)` (hidden) ↔ `translateY(0)` (open).
  * North dock: same translate composed inside its `rotate(180°)` frame (single `transform` property combining both, order chosen so slide direction is correct on screen).
- `transition: transform 180ms ease-out`; no layout-thrashing properties; `will-change: transform` on docks only.
- Nub stays pinned at its side's bottom edge whether dock is open or closed (sits above dock content, independent layer).

**Step 3 — Turn state machine (single source of truth)**
- States: `IDLE` | `SOUTH_ACTIVE` | `NORTH_ACTIVE` (+ transient `REQUEST_PENDING` flag with ~10 s timeout, carrying `fromSide` and `toSide`).
- API: `openKb(side)`, `closeKb()`, `handoff(toSide)`, `requestKb(fromSide)`, `resolveRequest(accept)`.
- Transitions:
  * Tap nub in `IDLE` → open that side.
  * Tap own nub while own side active → collapse to `IDLE`.
  * Tap nub while OTHER side active → `requestKb(mine)` (Step 5); keyboard does NOT steal.
  * Enter (on-screen Enter key, or additive `keydown` listener on the active composed field) → commit via baseline send path → `closeKb()` → translate/render via baseline → `openKb(opposite)`.
  * Request Confirm → `closeKb(owner)` → `openKb(requester)` (handoff to requester).
  * Request Decline → overlay dismissed, owner keeps keyboard, requester notified subtly (nub flash) and event logged.
  * Request timeout (~10 s, unanswered) → treated as Decline (quiet), logged.
- Invariant: at most one dock open at any moment; enforced centrally, never by scattered toggles.

**Step 4 — Keyboards**
- Two Simple Keyboard instances (minified source inlined; zero external deps). South instance in South dock, North instance in North dock.
- Each instance: layout set from its side's selected language (`setLayout(lang)`); an Enter key wired to the state machine; input routed into that side's composed message buffer.
- If the minified library source is unavailable at build time, ship minimal hand-rolled QWERTY + target-script layouts as interim, flagged in ledger for R3 replacement — still no OS keyboard.

**Step 5 — Localized request (overlay with confirm/decline)**
- `requestKb(fromSide)` shows `#duckRequestOverlay` on the keyboard-owner's side: text "The other person would like the keyboard." rendered in the OWNER'S selected language, with **Confirm** / **Decline** buttons also localized.
- Implementation: built-in `REQUEST_STRINGS` table covering the launch languages — strings for request text, confirm label, decline label (instant, no network); missing languages fall back to one MyMemory call, then cached for the session.
- Owner resolution paths: **Confirm** (handoff to requester), **Decline** (dismiss; requester's nub flashes once), or typing + Enter (implicit confirm — normal handoff satisfies the request).
- Unanswered requests time out quietly after ~10 s; all request events (sent/confirmed/declined/timeout) logged to diagnostics.

**Step 6 — Translation & diagnostics**
- Reuse salvaged `translate()` + diagnostics verbatim where possible: per-call latency vs ≤1 s target, HTTP/API/quota/network errors, ring log — all in-app.
- Add state-machine events (open/close/handoff/request-sent/request-confirmed/request-declined/request-timeout) to the ring log.
- Message flow on Enter: sender text → `translate(src, tgt)` → rendered by baseline chat rendering (both sides' halves stay oriented correctly — North half rendering is baseline's concern; we do not alter it).

**Build Gates (R2 done means ALL true)**
- Baseline checklist passes: every pre-existing chat.html feature works unchanged.
- Nub (keyboard icon, bottom edge) tap → that side's keyboard slides out, correctly oriented (North faces North), no phone spinning.
- Enter on South → South keyboard collapses, North keyboard slides out, message + translation rendered.
- Symmetric for North → South.
- Request from either side appears as an overlay on the other side **in that side's language** with Confirm/Decline; Confirm, Decline, and typing+Enter all resolve it correctly; never more than one keyboard open.
- OS keyboard never appears; no keyboard-selection UI exists anywhere.
- No console-only errors; translation latency measured in-app ≤ 1 s target.

**Open before build**
- BLOCKING: owner to paste current chat.html source (verbatim baseline).
- Simple Keyboard minified source to inline (fetch at build time or paste; interim hand-rolled fallback noted above).
- test.html language set (else default 13).

### R3 — Keyboard Hardening

**Scope**
- Full layout definitions for all launch languages; verify 180° North rotation on real devices.
- Request/nub polish: badge animation, haptics, localized nub labels for every launch language.
- Wrapper API cleanup: `show(side)`, `hide()`, `setLayout(lang)` if not already clean from R2.

**Build Gates**
- All launch-language layouts function; North instance fully usable rotated.
- No external dependencies; everything inlined in duck.html.

## 4. FUTURE IDEAS (parking lot)
- User authentication.
- Response caching.
- Offline fallback behavior.
- Additional translation providers as secondary fallback.
- Expanded keyboard layout library beyond launch languages.

## 5. IMMUTABLE WORKING RULES
1. Mobile‑first design, always.
2. All diagnostics in‑app — never DevTools/console‑only.
3. Update plan before code; one file write per response.
4. Read‑back verification after every push.
5. No stubs, no fake data.
6. Super snappy and performant — owner‑mandated.
7. **Baseline chat.html is never crippled, deleted, or changed — additive integration only (owner, 2026‑09‑10).**

## 6. DECISION LOG
| Date | Decision |
|------|----------|
| 2026‑08‑25 | Owner supplied a new Venice.ai API key; initial plan used it. |
| 2026‑09‑02 | duck defined as a head‑to‑head translation app; custom per‑side keyboards required. |
| 2026‑09‑02 | Keyboard framing: two alternating monolingual keyboards, not one multilingual. |
| 2026‑09‑02 | Translation engine: Venice AI primary, MyMemory fallback. |
| 2026‑09‑03 | Owner decides **no Venice AI**; use **MyMemory API only**. |
| 2026‑09‑10 | Languages: switchable per side; full set from owner's test.html, default 13-language fallback. |
| 2026‑09‑10 | Keyboard library: **Simple Keyboard** (owner delegated choice). |
| 2026‑09‑10 | MyMemory **anonymous public endpoint** confirmed; quota errors must surface in-app. |
| 2026‑09‑10 | Latency target: **≤ 1 s translation round‑trip**. |
| 2026‑09‑10 | STT/TTS: browser Web Speech API (baseline already has voice features — preserved). |
| 2026‑09‑10 | **MIS-BUILD**: R1 harness rejected. The artifact is **chat.html upgraded with per-side keyboards** — nothing else. |
| 2026‑09‑10 | **Baseline preservation rule**: never cripple/delete/change baseline; additive-only integration. |
| 2026‑09‑10 | **Interaction spec locked**: tap nub slides keyboard out; Enter collapses sender's keyboard and slides out the other's; request nub sends a request rendered in the keyboard-owner's language; relinquish via nub or by typing+Enter. |
| 2026‑09‑10 | **OS keyboard fully rejected** — no fallback, no keyboard-selection UI of any kind. |
| 2026‑09‑10 | **Request UX corrected**: nub = keyboard icon pinned at each side's physical bottom edge; request = overlay on keyboard-owner's side with explicit Confirm / Decline buttons (decline path added; typing+Enter = implicit confirm). |

## 7. APPENDIX
- **Authority order**: this plan (duck.md) > all else. Chat history loses to the plan.
- Artifacts: CODE file `duck.html` (= baseline chat.html + additive keyboard layer), PLAN file `duck.md`.
- Phase: **BUILD**.
- **Single next step**: owner pastes the current chat.html source; then build duck.html as chat.html verbatim + the R2 keyboard layer exactly as specified in §3 (bottom-edge keyboard-icon nubs, slide-out docks, Enter handoff, localized confirm/decline request overlay, one keyboard max, diagnostics in-app).
- Known: MyMemory anonymous endpoint is the translation backend. Simple Keyboard provides per-side on-screen input, rotated 180° for North. No OS keyboard, no selection UI. Baseline chat.html features (chat UI, STT, TTS) are preserved untouched.