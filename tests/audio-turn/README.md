# chat-test audio turn control

`chat-test.html` is built from the accepted `chatlink-turn01-pre-base.html` by patching named boundaries only. It replaces the earlier audio-overlap experiment. Design: CHATLINK-TURN01-PRE-BASE-PLAN.md §13, "Design amendment".

- Read-aloud pauses STT for both sides (one mic, one speaker). While it plays, silence goes to Deepgram and captured audio is dropped, never kept.
- Soft two-note tones: descending means wait, ascending means speak. Listening resumes only after the speak tone, after a 300 ms pause. A single low "bong" means the text was put in a compose box because the speaker was unclear.
- Microphone mode (Settings): `open` (default) keeps both sides listening, and each mic button is that side's mute. `ask` is the previous tap/ask/allow behaviour. A room with the same language on both sides uses `ask`.
- Before normalization, the checks run in this order: echo filter, then script, then language + confidence, then ownership lock and turn order, then compose + bong.
- Every step writes `ok` / `blocked` / `error` records to the debug log (Copy/Download in the diagnostics panel).

## Build and test

```sh
node tests/audio-turn/build.cjs                 # writes chat-test.html
node tests/audio-turn/test.cjs                  # controller gates (no browser)
NODE_PATH=$(npm root -g) CHAT_BROWSER_CHANNEL=chromium node tests/audio-turn/regression.cjs                  # 13 Chatlink scenarios, ask mode
NODE_PATH=$(npm root -g) CHAT_BROWSER_CHANNEL=chromium AUDIO_MODE=open node tests/audio-turn/regression.cjs  # 11 unchanged + 3 open-mode scenarios
NODE_PATH=$(npm root -g) CHAT_BROWSER_CHANNEL=chromium node tests/audio-turn/keyboard.cjs                    # 32 keyboard scenarios
```

Real speaker/microphone behaviour, and Deepgram confidence values on real speech, still need a device trial.
