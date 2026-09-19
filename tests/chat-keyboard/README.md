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
- Identify the candidate build as `keyboard-r1-20260919` in diagnostics and
  `document.documentElement.dataset.chatBuild`.

Production `chat.html`, admin, recognition scoring, and speech implementation are
unchanged. This release does not claim next-word prediction, Thai swipe support,
or a completed multilingual keyboard. Those remain subsequent plan stages.

## Device acceptance before promotion

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
