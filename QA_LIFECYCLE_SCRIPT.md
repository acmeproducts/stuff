# Talk Session End-to-End QA Script (Reference)

## Scope
Validate first-session lifecycle in two browsers from session creation through chat, translation, back-translate, clarify, save to phrasebook, tags, and phrasebook-first authoring continuity.

## Standard Terms
- **L1**: Sender local language.
- **L2/L3**: Alternate target language(s).
- **Source**: Left phrase area.
- **Target**: Right phrase area.
- **Back Translate**: Right-side text translated back to left-side language.

## Personas
- **Bob**: L1 = English.
- **Sue**: L1 = Thai.

## Preconditions (first-session runnable)
1. Open Browser A and Browser B to `test.html`.
2. In each browser, set local name (`yournamehere`) to Bob (A) and Sue (B).
3. Bob creates a new session and shares invite; Sue opens invite and joins.
4. Phrasebook tab is reachable from chat and from the Say tab.
5. Run in default mode (`SESSION_DEBUG=false`).

## Acceptance Invariants (binary)
1. Every chat bubble and phrasebook card body shows **Source** and **Target** sections.
2. Each section always has **TTS** and **USE** controls.
3. Footer actions are exactly ordered: **Save**, **Tag (#)**, **Clarify**, **Back Translate**.
4. Back translate is always **Right → Left** (input anchor right phrase/language, output anchor left language).
5. Saved data preserves canonical fields: `sourceText`, `sourceLang`, `targetText`, `targetLang`, `sender`, `sentAt`, `tags[]`, `clarify[]`, `backtranslate{inputText,inputLang,outputText,outputLang,updatedAt}`.
6. Header shows sender + time only (no delivery/diagnostic chip text).
7. Connection indicator is one dot only: relay fill (gray/yellow/green) + peer border (white/black).
8. Default UI shows no queue/metric/debug chip text.

---

## Updated QA Lifecycle Test Plan

### A1. Create session
1. Bob creates a new chat.
2. Bob shares invite to Sue; Sue joins from invite link.
3. Observe connection indicator on both browsers.

**Pass observation**
- Dot fill reflects relay state and border reflects peer presence (single dot, no extra chips).

### A2. Chat #1 (Target=L2)
1. Bob sends: `Hi Sue, are you free for lunch?`
2. Sue verifies bubble body contains Source+Target; each side has TTS+USE.
3. Bob opens footer actions and verifies order Save/#/Clarify/Back Translate.
4. Bob runs Back Translate and confirms label shows `Right → Left`.
5. Bob adds Clarify: `By lunch I mean 12:30.`
6. Bob tags `#lunch #availability`.
7. Bob presses Save.

**Pass observation**
- Saved phrase appears in phrasebook with same tags/clarify/backtranslate context.

### A3. Chat #2 (switch Target L2 -> L1)
1. Set receive/target behavior to English for Bob.
2. Sue sends Thai: `ได้ค่ะ เจอกันที่ร้านเดิม`.
3. Bob verifies Target is English and Source remains Thai.
4. Bob runs Back Translate and adds Clarify + tags; Save.

**Pass observation**
- Direction remains right->left and no source/target transposition.

### A4. Chat #3 (switch Target L1 -> L2 -> L3)
1. Switch target to Thai, send one Bob message, run Back Translate.
2. Switch target to Japanese, send one Bob message.

**Pass observation**
- Language switching sequence is honored and backtranslate output is normal horizontal text (no `y<br>o<br>u` style verticalization).

### B1. Validate two chat-saved entries
1. Open phrasebook.
2. Open two entries saved from A2/A3.

**Pass observation**
- Card body parity with chat body: Source+Target, each with TTS+USE, same footer order Save/#/Clarify/Back Translate.

### B2. Tag update in phrasebook
1. Open saved entry #1.
2. Remove one tag and add one new tag using shared tag UI.
3. Reopen card.

**Pass observation**
- Tag changes persist and are visible in metadata/chips.

### B3. New phrase flow continuity (no disconnected modal break)
1. Start new phrase from phrasebook.
2. Use chat-like bilingual composition: source input, target generation, back translate, tags, save.

**Pass observation**
- Flow remains continuous in same interaction model and saves a complete bilingual entry.

---

## Strict Visual Verification Checklist (binary)
Mark each item Pass/Fail.
1. Bubble shows Source+Target sections, each with TTS+USE.
2. Footer order exactly Save / Tag / Clarify / Back Translate.
3. No header diagnostic status clutter (`sent`, `queued`, `delivered`, `translated`, etc.).
4. Back-translate label and direction are Right → Left.
5. Back-translate output is not verticalized per-character.
6. Phrasebook card body parity with chat bubble body.
7. New phrase flow continuity (not a disconnected modal-only break).
8. Connection dot uses required color+border semantics.
9. No debug/queue chip text in normal mode.

## Pass/Fail Rubric
- **PASS**: All scenarios complete and every checklist item is Pass.
- **FAIL**: Any checklist item fails, any invariant breaks, or workflow needs manual data correction/workaround.
