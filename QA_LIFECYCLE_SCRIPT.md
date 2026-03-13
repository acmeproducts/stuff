# Talk Session End-to-End QA Script (Reference)

## Scope
Validate full lifecycle from new session creation through chat, translation, back-translate, clarify, save to phrasebook, and tag management.

## Standard Terms
- **L1**: Sender's local language for a given message.
- **L2/L3**: Alternate target language(s).
- **Source**: Original text sent by sender.
- **Target**: Translated text for receiver.
- **Back Translate**: Translate Target back into Source language for verification.

## Personas
- **Bob**: L1 = English.
- **Sue**: L1 = Thai.

## Preconditions
1. Two devices/browsers connected to same environment.
2. Bob and Sue can join the same session.
3. Phrasebook panel is available.
4. Chat bubbles and phrasebook cards show Source + Target sections, each with TTS and USE.

## Acceptance Invariants (must hold for every message/card)
1. Bubble/card contains both **Source** and **Target** phrase areas.
2. Both areas expose **TTS** and **USE** controls.
3. Footer exposes **Save**, **Tag (#)**, **Clarify**, and **Back Translate**.
4. Back Translate is deterministic: **right-side phrase -> left-side language**.
5. Saving preserves sender identity + timestamp + source/target text/lang.

---

## Scenario A - Session inception + 3 chats + language switching

### A1. Create session
1. Bob launches app with empty session list.
2. Bob clicks **+** in left pane and creates session with Sue.
3. Sue joins same session.

**Expected**
- Session appears for both users.
- Connection indicator shows connected state without verbose debug clutter.

### A2. Chat #1 (Target=L2)
1. Bob sends Source (English): "Hi Sue, are you free for lunch?"
2. Sue sees Target in Thai.
3. Bob runs **Back Translate** on this bubble.
4. Bob adds **Clarify** note: "By lunch I mean 12:30."
5. Bob tags in chat: `#lunch #availability`.
6. Bob taps **Save**.

**Expected**
- Back Translate returns coherent English meaning.
- Clarify is attached to this bubble.
- Tags persist after save.
- Saved phrasebook entry inherits sender/timestamp/content.

### A3. Chat #2 (switch Target L2 -> L1)
1. Switch session target behavior to L1 (English) for confirmation pass.
2. Sue sends Source (Thai): "ได้ค่ะ เจอกันที่ร้านเดิม"
3. Bob sees Target in English.
4. Bob runs **Back Translate**.
5. Bob adds **Clarify**: "Do you mean the cafe on 3rd Street?"
6. Bob tags in chat: `#meeting-point #confirmed`.
7. Bob taps **Save**.

**Expected**
- Translation orientation is correct (no doubled English/Thai).
- Back Translate maps from shown Target back to Thai meaning.
- Second saved entry appears in phrasebook with inherited metadata.

### A4. Chat #3 (switch Target L1 -> L2 -> L3)
1. Switch target back to L2 (Thai).
2. Bob sends Source (English): "Please bring the project notes."
3. Run **Back Translate** on chat #3.
4. Switch target to L3 (example: Japanese).
5. Bob sends another message to verify L3 targeting.

**Expected**
- Switches are honored in sequence: L2 -> L1 -> L2 -> L3.
- Chat #3 back-translate works.
- No verticalized text (`y<br>o<br>u`) in back-translate output.

---

## Scenario B - Phrasebook lifecycle

### B1. Validate two chat-saved entries
1. Open phrasebook.
2. Confirm two entries from Chat #1 and Chat #2 exist.
3. Open each card and verify Source/Target, TTS/USE, footer actions.

**Expected**
- Phrasebook card body matches chat bubble body behavior.
- Only allowed structural difference is phrasebook header delete `X`.

### B2. Update tags inside phrasebook (1 item)
1. Open saved entry #1 in phrasebook.
2. Use tag UI to remove one tag and add one new tag.
3. Verify recently used tags appear under input.

**Expected**
- Tag edits persist and reflect in card metadata.

### B3. Create brand-new phrasebook entry from scratch (no modal break)
1. Start "new phrase" flow from phrasebook.
2. Entry UI should look/behave like chat bubble composition flow (not disconnected modal).
3. Enter Source phrase, pick target language, generate onboard translation.
4. Use Back Translate.
5. Add tags and save.

**Expected**
- New entry flow is visually/behaviorally consistent with chat bubble interaction.
- Saved card includes full bilingual contract + tags + metadata.

---

## Regression checks
1. No doubled-language rendering (English+English or Thai+Thai unless explicitly intended).
2. No source/target transposition between Bob and Sue.
3. TTS language matches the visible phrase language.
4. Back Translate always runs against the same side contract.
5. No verticalized back-translate text.

## Exit criteria
Pass only if all scenarios and invariants succeed without manual data correction, message rewrites, or UI workarounds.
