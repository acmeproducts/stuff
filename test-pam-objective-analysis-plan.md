# test-pam: Objective Analysis, Diagnosis, and Pre-Implementation Plan

## Executive diagnosis (cross-cutting)

The 12 issues are not isolated bugs; they are symptoms of a few architectural gaps:

1. **Identity model mismatch**: session identity appears coupled to mutable display metadata (name/language pairs) instead of a stable session/conversation ID.
2. **Weak state synchronization**: each client appears to treat itself as source-of-truth too often, causing divergence in chat list ordering, unread counts, and reconnection behavior.
3. **UI flow fragmentation**: onboarding/session management/navigation are split across screens, increasing click count and opportunities for state mismatch.
4. **Inconsistent capability wiring**: TTS/use/back-translate behaviors differ by component (bubble vs phrase modal, self vs peer bubble), indicating duplicate logic paths and missing shared action handlers.
5. **Design system inconsistency**: settings, color palette, and micro-interactions are under-specified, producing unpredictable visual/behavioral outcomes.

---

## Objective diagnosis mapped to your 12 items

### 1) Reconnection brittle; identity should be token-first, labels display-only

**Likely root cause**
- Conversation join/rejoin uses derived keys from mutable values (e.g., names/language pair strings), so reconnecting with changed labels creates a new logical room/session.

**What the industry does**
- **WhatsApp/Signal/Telegram pattern**: immutable conversation ID first; mutable profile fields are metadata only.
- Presence/reconnect keyed by stable user/session IDs + server-issued auth token.

**Diagnosis verdict**
- High confidence this is the primary failure driver for session mismatch and reconnect instability.

---

### 2) Language handling should be auto-detect; remove redundant language pair labels per bubble; add share action

**Likely root cause**
- Language metadata is rendered at multiple levels (session + bubble) with partial updates.
- UI currently optimized for explicit language-state visibility rather than low-friction communication.

**What works in the wild**
- Translation/messaging UIs increasingly use **auto-detect + subtle indicator at most once per message group/session**, not repeated verbose labels.
- Native share sheet invocation is standard mobile pattern for message objects.

**Diagnosis verdict**
- Redundancy contributes clutter and cognitive load; per-bubble labels are not essential if session header already communicates context.

---

### 3) TTS failure fallback links (iOS + Android setup guidance)

**Likely root cause**
- TTS failure handling likely ends at error toast/log without actionable remediation path.

**What works in the wild**
- Error state with platform-specific recovery links is common in voice features.

**Diagnosis verdict**
- Straightforward UX hardening with high support-value, low implementation risk.

---

### 4) Phrase modal TTS/use not wired; pull-handle cannot drag down

**Likely root cause**
- Separate modal code path bypasses shared bubble action dispatcher.
- Gesture handlers likely incomplete (tap-close wired; drag-close missing or threshold misconfigured).

**What works in the wild**
- Single action bus/controller reused across message cards, phrase cards, and modals.
- Bottom-sheet behavior with drag affordance and velocity/threshold-based close.

**Diagnosis verdict**
- Clear integration gap, not a conceptual feature gap.

---

### 5) Need robust reconnection strategy; current brute-force loop is poor

**Likely root cause**
- Retry loop likely unbounded/frequent without connection state machine, jittered backoff, or replayable outbound queue.
- UI updates may append transient status entries causing “scrolling up” effect.

**What works in the wild**
- WebSocket/RTC reconnect with **state machine** (`connected`, `degraded`, `reconnecting`, `resyncing`), exponential backoff + jitter, and idempotent message replay via sequence numbers.

**Diagnosis verdict**
- Systemic architecture issue; must be solved before UI polish to prevent recurring defects.

---

### 6) Onboarding clunky and mismatch-prone

**Likely root cause**
- Too many mandatory decisions before entering chat; setup state races between initiator/receiver.

**What works in the wild**
- Progressive profiling: default identity + immediate chat entry; optional personalization inline.
- Compact language selector (dropdown/search) if manual override needed.

**Diagnosis verdict**
- Should be redesigned as one-screen entry with optional edits, not multi-step gating.

---

### 7) Footer attribute settings not always applied; color picker quality poor

**Likely root cause**
- Theme/settings persistence and style application likely split across inline styles + class rules with precedence conflicts.
- Color picker lacking curated palettes and semantic theme tokens.

**What works in the wild**
- Tokenized theming (`--bubble-bg`, `--text-muted`, etc.) + validated palettes (pastel/professional sets) and live preview.

**Diagnosis verdict**
- Needs design token cleanup plus deterministic application order.

---

### 8) Collapse chevron too small; layout/timestamp/name behavior issues

**Likely root cause**
- Header overcrowding and missing touch-target/accessibility rules.

**What works in the wild**
- 44px min touch target on mobile actions.
- Long names truncated with ellipsis.
- Collapsed state preserving only header, hiding body/footer consistently.

**Diagnosis verdict**
- Primarily interaction design and layout constraints; low technical risk if componentized.

---

### 9) Back-translate should be universal per bubble, collapsible, with TTS

**Likely root cause**
- Business logic currently role-conditioned (self vs peer bubble) rather than message-centric capability model.

**What works in the wild**
- Uniform per-message action menus independent of sender role.

**Diagnosis verdict**
- Capability parity problem; fix by centralizing message action schema.

---

### 10) Clarification question should preserve original language + translated form

**Likely root cause**
- Clarification pipeline may normalize to single language before storage, dropping source text.

**What works in the wild**
- Store both `original_text` and `translated_text`, plus language tags and direction.

**Diagnosis verdict**
- Data model expansion needed; UX can then show original + translated toggle.

---

### 11) Session lists inconsistent, unread unsynced

**Likely root cause**
- Unread counters likely computed locally without server-ack/read markers or event ordering guarantees.

**What works in the wild**
- Server-authoritative conversation index with per-device last-read pointers and monotonic sequence IDs.

**Diagnosis verdict**
- Same root as #1/#5; requires authoritative sync protocol and deterministic ordering.

---

### 12) Header speaker toggle default off; auto-read incoming translated message when enabled

**Likely root cause**
- No explicit global “auto-play incoming TTS” preference state bound to session header.

**What works in the wild**
- Distinguish **manual TTS action** (per bubble) from **auto-play mode** (global/session setting), defaulting off for safety.

**Diagnosis verdict**
- Clear feature requirement with straightforward state + event hook.

---

## Consolidated solution strategy (use proven patterns first)

### A. Stabilize identity and sync first (foundational)

1. Introduce immutable IDs:
   - `conversation_id` (stable)
   - `participant_id` (stable)
   - `device_id` (stable per install)
2. Treat name/language as mutable profile metadata only.
3. Add server-authoritative event stream with sequence numbers.
4. Reconnect protocol:
   - authenticate token
   - resume by `last_seq`
   - fetch delta
   - replay unsent queued messages idempotently.

**Expected impact**
- Resolves majority of mismatch/rejoin/list/unread issues (#1, #5, #11).

### B. Move to single-screen chat shell with left panel (WhatsApp-like)

1. Left panel tabs: Chats, Phrasebook, Settings.
2. Keep user in one consistent screen; avoid hard screen switches.
3. Collapse panel on small screens with persistent access affordance.

**Expected impact**
- Reduces friction and context loss (#1, #6).

### C. Simplify language UX

1. Default auto-detect on.
2. Optional manual override in compact dropdown (with flags/search).
3. Remove repetitive per-bubble language labels.
4. Keep language state in session header/settings only.

**Expected impact**
- Cleaner UI, fewer user actions, fewer mismatch points (#2, #6).

### D. Unify message actions and modal wiring

1. Create shared action registry for `tts`, `share`, `use`, `back_translate`.
2. Route bubble cards and phrase modal through same handlers.
3. Add platform share invocation per message.
4. Ensure back-translate available on every message; collapsible with TTS.

**Expected impact**
- Eliminates inconsistent behavior paths (#2, #4, #9).

### E. TTS reliability + fallback UX

1. Keep per-bubble manual TTS.
2. Add header auto-play toggle default OFF (slashed speaker icon).
3. On TTS failure show actionable links:
   - iPhone/iOS language installation help
   - Android language installation help

**Expected impact**
- Better reliability perception and reduced dead ends (#3, #12).

### F. UI component and theming cleanup

1. Bubble header layout:
   - enlarge collapse action touch area
   - truncate long names (ellipsis)
   - move timestamp below footer/body region.
2. Collapsed state should show header only.
3. Replace ad-hoc color selection with curated palettes + improved custom picker UX.
4. Ensure settings apply through theme tokens, not conflicting inline/class rules.

**Expected impact**
- Better usability and consistency (#7, #8).

### G. Clarification data model upgrade

Store clarification as:
- `original_text`
- `original_lang`
- `translated_text`
- `translated_lang`
- `message_id` link

Render receiver-friendly translated text with expandable original.

**Expected impact**
- Preserves semantic intent and bilingual traceability (#10).

---

## Recommended phased rollout (low risk)

### Phase 0 — Instrumentation (1 sprint)
- Add telemetry for reconnect causes, retry counts, unsent queue depth, unread drift, TTS failures.

### Phase 1 — Identity + sync hardening (1–2 sprints)
- Implement immutable IDs, resume protocol, sequence-based delta sync.
- Make server authoritative for conversation list/unread.

### Phase 2 — UX simplification (1 sprint)
- Single chat shell with left panel.
- Auto-detect default + compact language override.
- Remove redundant language labels.

### Phase 3 — Action parity and TTS robustness (1 sprint)
- Shared action registry across bubbles/modals.
- Wire `use`, `tts`, `share`, `back-translate` universally.
- Add TTS fallback links and header auto-play toggle.

### Phase 4 — Visual system cleanup (1 sprint)
- Bubble layout fixes, collapse behavior, touch targets.
- Theme tokenization and curated palettes.

---

## Acceptance criteria (objective)

1. Reconnect after network drop resumes same conversation ID with no duplicate sessions.
2. Conversation list and unread counts converge across two devices within defined SLA (e.g., <2s after event).
3. Phrase modal and bubble actions call the same handlers; parity verified by tests.
4. Back-translate + TTS available on every message.
5. Clarification messages persist original + translated forms.
6. Header auto-play toggle defaults OFF and only affects incoming auto-read behavior.
7. On TTS failure, user sees platform-specific help links.
8. Onboarding-to-first-message click count reduced to target threshold.

---

## Risks and mitigations

- **Risk**: Refactor touches core state paths.
  - **Mitigation**: Feature flags + dual-write telemetry period.
- **Risk**: Sync protocol change causes migration issues.
  - **Mitigation**: Backward-compatible handshake versioning.
- **Risk**: Auto-detect mistakes reduce trust.
  - **Mitigation**: easy manual override in-session, persist preference.

---

## “Start here” implementation order

1. Finalize data contract (IDs, sequence events, read markers).
2. Implement reconnect/resume state machine + queue replay.
3. Switch session list/unread to server-authoritative sync.
4. Build single-screen shell with left panel tabs.
5. Unify message/phrase action handlers and wire all actions.
6. Apply UI/theming/accessibility updates.

This ordering maximizes stability gains first and avoids polishing flows that sit on top of unreliable state.
