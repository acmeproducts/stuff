```prompt
You are an expert front-end refactor engineer. Generate a minimal, surgical unified diff patch that fixes chat/session/phrasebook regression by implementing a strict, testable UX/data contract.

Target:
- `test.html`
- `QA_LIFECYCLE_SCRIPT.md` (reference only; do not rewrite unless a tiny clarification is absolutely required by the patch)
- (Only if already imported/used by `test.html`) tightly-coupled local helpers directly required for this fix

Actions:
1) Use `QA_LIFECYCLE_SCRIPT.md` as the implementation roadmap and acceptance source.
   - Map code changes to Scenario A (A1/A2/A3/A4), Scenario B (B1/B2/B3), invariants, and regression checks.
   - Add concise inline comments in code near changed logic indicating which QA step/invariant each change satisfies.

2) Implement one canonical bilingual contract for every chat bubble and phrasebook card.
   - Required fields: `sourceText`, `sourceLang`, `targetText`, `targetLang`, `sender`, `sentAt`, `tags[]`, `clarify[]`, `backtranslate{inputText,inputLang,outputText,outputLang,updatedAt}`.
   - Rendering and actions must read/write this contract only.
   - Remove or bypass legacy ambiguous routing fields from display decision paths.

3) Enforce deterministic language and side behavior (no transposition/no double-language drift).
   - Left side = local-language phrase for current viewer.
   - Right side = counterpart phrase.
   - On send: lock Source, compute exactly one Target.
   - On receive: respect payload + deterministic mapping; do not re-translate into same-language duplicates.
   - Explicitly support lifecycle target switching for the session flow: `L2 -> L1 -> L2 -> L3`.

4) Enumerate exact chat bubble UI structure and behavior.
   - Header:
     - Show sender identity and sent date/time.
     - Remove "sent/translated" header clutter.
   - Body:
     - Source phrase block and Target phrase block always present.
     - Each phrase block includes: phrase text, TTS button, USE button.
   - Footer actions (fixed order): Save icon, Tag (`#`) entry toggle, Clarify, Back Translate.
   - Back-translate display must render as normal horizontal text (never verticalized per-character line breaks).

5) Phrasebook card parity (same look/feel/function as chat bubble body).
   - Phrasebook card body must be identical to chat bubble body interaction model.
   - Only structural difference allowed: phrasebook header includes delete `X`.
   - Footer action parity required: Save, Tag, Clarify, Back Translate.

6) Replace phrasebook “add new entry” flow that breaks UX continuity.
   - Remove/disarm disconnected modal-only creation flow.
   - New entry creation must feel like chat composition + same bilingual card body.
   - Support creating entries from scratch using onboard translation (Source input -> Target output -> optional back translate -> save).

7) Tag process consistency (add/change/remove) across chat and phrasebook.
   - Same tag UI and interactions in both contexts:
     - Add new tag via `#` input.
     - Remove existing tag.
     - Edit/replace tag by delete+add workflow.
     - Show recently used tags directly under tag input.
   - Preserve tags when saving chat bubble to phrasebook.

8) Save inheritance behavior.
   - Saving from chat to phrasebook must inherit: sender, sentAt, source/target texts and languages, tags, clarify/backtranslate state where applicable.
   - Saved card should be immediately recognizable as the same object model in phrasebook.

9) Back Translate contract.
   - Input anchor is always right-side phrase/lang.
   - Output anchor is always left-side language.
   - Persist mapping fields in `backtranslate` object for reruns.
   - Ensure no ambiguity from previous `targetText/translated` fallback paths.

10) Connection + peer presence indicator (explicit UI rules).
   - Implement a single circular status indicator with combined state semantics:
     - Relay disconnected: circle fill `grey`.
     - Relay connecting/intermittent: circle fill `yellow`.
     - Relay connected/stable: circle fill `green`.
   - Peer presence is encoded by border color on the same circle:
     - Peer absent: `white` border.
     - Peer present: `black` border.
   - Remove/disable opaque debug chip text (e.g., queue/metric abbreviations) from default user-facing UI.
   - Keep internal diagnostics available only behind dev/debug flag if already present.

11) Regression hardening.
   - Eliminate causes of:
     - doubled English/Thai rendering,
     - source/target transposition between devices,
     - TTS language mismatch with shown phrase,
     - verticalized back-translate text.

12) Deliver with minimal patch discipline.
   - Change only code necessary to implement the above.
   - Do not perform unrelated refactors, renames, reformat sweeps, or framework changes.
   - Preserve existing project style and architecture where possible.

Constraints:
- Scope is strictly limited to the Target section.
- Produce only a minimal patch required to satisfy the Actions.
- If a legacy path conflicts, bypass/deprecate it minimally instead of broad deletion.

Output format:
- Return unified diff patch only.
- Include sufficient context lines for safe application.
```
