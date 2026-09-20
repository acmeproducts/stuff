# Tabletop keyboard R1 regression tests

This suite loads the actual `chat-lab.html` in a real headless Chromium-family
browser at 412 × 915 with touch/mobile emulation. Dictionaries, Japanese
conversion, and external services are intercepted. No credentials are required
and no conversation or gesture data is sent to a remote service.

```sh
npm --prefix tests/chat-keyboard install
cd tests/chat-keyboard
npx playwright install chromium
npm test
```

Alternatively, set `CHAT_BROWSER_CHANNEL=msedge` to use installed Microsoft Edge.
On Windows PowerShell: `$env:CHAT_BROWSER_CHANNEL='msedge'` before `npm test`.
Optional `CHAT_SCREENSHOT_DIR` saves North/South correction-state screenshots.

The suite verifies that the speech/ownership source block is unchanged from
`chat.html` before running the tests. This is not a live STT/TTS test.

The original baseline failed the replacement, stale-candidate, Clear, composition
send, cursor movement, and asynchronous conversion regression cases. The suite
also covers surrounding text, selected text, Undo, duplicate spaces, detached
controls, handoffs, and out-of-order Japanese responses. Gesture fixtures exist
to exercise the correction flow, not to measure real-finger recognition accuracy.

## Scope of this release

- Correct a recognized swipe word with one tap rather than appending an alternative.
- Undo the most recent candidate replacement while its draft is still current.
- Discard obsolete suggestions after editing, clearing, sending, closing, or handoff.
- Commit visible composition before typed Send; prevent cleared text reappearing.
- Ignore obsolete asynchronous Japanese conversions.
- Identify the candidate build as `lab-keyboard-patch-20260919` in diagnostics and
  `document.documentElement.dataset.chatBuild`.

Production `chat.html`, admin, recognition scoring, and speech implementation are
unchanged. English next-word prediction uses the existing bigram model in a separate row.
Thai swipe support and the complete multilingual rollout remain subsequent stages.

## Maintainer device coverage

Run on the exact candidate build after it is made available for device testing:

1. On South, swipe a word, select an alternative, then Undo. Only that word changes.
2. Repeat from the North position. Move the cursor before choosing a stale suggestion;
   the old suggestion must not change text at the new cursor.
3. Clear a partial word with suggestions visible; type again. The old word stays gone.
4. Type Japanese/Korean composition, then use Send. It sends once and the field stays
   empty. Clear composition and begin again; no old syllable survives.
5. Switch sides with unsent drafts, both allowing and declining the handoff. Drafts
   remain separate and no previous side's suggestion can modify the active side.
6. Check STT starts, transcribes, and sends on each side. Check TTS on each side.
   Confirm silent keyboard use requires no microphone activation.

Record build ID, device/browser, side, and failures. Do not call speech/device
acceptance complete based on this automated suite.

## English gesture and prediction tests

Run `node tests/chat-keyboard/english.cjs` from the repository root after installing Playwright. Uses the real dict/en.json and dict/bigram-en.json assets. Drives actual pointer handlers on North and South through 20 words each, checks chained predictions and stale prediction rejection. Deterministic gestures are a regression sample, not a claim of real-world accuracy. Screenshot output is ignored by git.

## Standalone lab integration protection

The original lab fixture is pinned to 5fcd8cbc1cda41b2a36a499d019eef25b9a8bc02. integration.cjs asserts that the engine, speech/ownership, and config/bubbles/send sections exactly match this original. It runs the base and patched versions with no admin room data, verifies default English/Thai, typed translation, Northern Thai normalization, English-to-Thai code-switch normalization, PCM transport from a synthetic browser microphone, final speech callbacks, Thai dual sockets, and retained microphone ownership. Translation and STT responses are intercepted; this does not certify external service availability or real microphone recognition.

Open chat-lab.html without s/n overrides for the original English/Thai defaults. An en/en URL intentionally does not translate between sides. Use the browser in which the original lab was configured: the existing Deepgram key belongs to that browser's local storage. No credentials are copied into tests or source.
