# Reference-audio AEC prototype — NOT READY TO DEPLOY

This replaces the rejected microphone-hold experiment with real reference-based processing. PR #724 was closed without merging. The live test page is unchanged.

## Implemented

`chat-test.html` is generated from the accepted Chatlink portal. Browser `speechSynthesis` playback is replaced by fetched Deepgram English TTS audio. The same AudioBufferSource feeds the speaker and reference input of a two-input AudioWorklet. Raw microphone audio passes through SpeexDSP 1.2.1 compiled to WebAssembly; the cleaned samples feed the original STT sockets continuously. There is no playback-time microphone gate, transcript filtering, or finish-speaking button.

SpeexDSP uses a 256 ms adaptive echo filter, 128-sample frames at 16 kHz, and its residual echo/noise suppression stage (echo suppression -45 dB, active speech -6 dB, AGC off). The preprocessor adds one 128-sample block of latency. Native capture AEC/AGC/noise suppression are requested off so the reference test measures this path. Applied capture settings appear in the log.

The Audio test button opens configuration. Directly beneath it is the expandable STT/TTS log with timestamps, microphone lifecycle, socket events, final transcripts, TTS requests/playback, transmitted PCM counts, reference/microphone/output RMS, clipping and errors. Copy/download are local exports. Logs include conversation text but never API keys; no audio is recorded by the app. RMS ratios during overlapping speech are NOT an echo-removal measurement.

## Test findings and deployment gate

- Browser integration passes for North and South: recognized text triggers reference TTS; microphone PCM continues during playback; both inputs reach the worklet; diagnostic controls and teardown work. Cloud services use fixtures in these tests.
- Deterministic synthetic-signal tests pass their echo/voice-only comparison gates at 20, 80 and 160 ms simulated delays. See `dsp-results.json`.
- Generated-speech tests FAIL the >20 dB overlap-vs-voice-only SNR gate (13.56–16.68 dB). Steady echo reduction is 46.91–67.56 dB, but that does not establish loop prevention. See `voice-results.json`.
- Windows offline dictation still recognizes a prefix of the speaker's words at startup. For example, the 20 ms case starts with “This is the translated” before the intended near-end coffee order. **This fails the key requirement: TTS alone must not create speech messages.** See `recognition-results.json`.
- Raw voice correlation is reported, not used as a pass gate, because Speex's high-pass response changes waveform phase; the overlap comparison uses a voice-only run through the same processor. Thresholds have not been relaxed to disguise the generated-speech failure.

Do not merge/deploy this candidate as a fix. It is a reproducible implementation and failure record, not a verified solution. No physical phone speaker/microphone, iOS, or live Deepgram account was tested. The offline recognizer is an additional failure detector, not a substitute for Deepgram acceptance.

## Remaining engineering work

Evaluate a canceller with stronger startup residual-echo handling and delay tracking (WebRTC AEC3 is the next candidate) against the same fixtures before replacing this module. Require zero speaker-only transcript words from cold start, preserved overlapping near-end words, continuous microphone frames, and cancellation on room changes. Then validate hardware timing/clipping on actual target devices. Do not solve startup leakage by muting recognition or requiring a turn-taking button.

English is the only TTS output wired in this prototype, using the existing Deepgram device key. Other languages retain text translation and show an explicit speech error; there is no browser-voice fallback. A multilingual audio-returning provider, including Thai, is required before this can cover the full product. Deepgram TTS can incur provider usage charges when used with a real key; automated tests use mock responses.

## Reproduce

- `node tests/reference-aec/build.cjs` embeds the compiled WASM, worklet and adapter in chat-test.html.
- `node tests/reference-aec/dsp-test.cjs` runs deterministic signal tests.
- `node tests/reference-aec/browser.cjs` runs two-direction headless Edge integration (requires Playwright).
- Run `generate-voices.ps1` on Windows to create local generated fixtures, then set `AEC_DUMP` to that directory and run `node tests/reference-aec/dsp-test.cjs <reference-voice.wav> <near-voice.wav>`. The current candidate intentionally fails its quality gate and still writes measurement results and WAV outputs.
- Run `recognize-fixtures.ps1 -FixtureDirectory <directory>` for the offline transcript comparison. Windows voice/recognizer revisions can vary; the checked-in result records this run.

## Build provenance

Official source: https://downloads.xiph.org/releases/speex/speexdsp-1.2.1.tar.gz

Source archive SHA256: `8c777343e4a6399569c72abc38a95b24db56882c83dbdb6c6424a5f4aeb54d3d`.

WASM SHA256: `c07929ae8dd74b6d6cf79bd109cd35ac450bd28304aa2c6797fd3d6121520fe7`.

Built with Emscripten 3.1.64; `build-wasm.ps1` contains exact compiler flags. The base64 file is the compiled artifact, avoiding runtime CDN dependencies. `SPEEX-LICENSE.txt` and `THIRD-PARTY-NOTICES.txt` accompany the binary. The C wrapper is local; no source from the evaluated third-party Rust/reflex projects is used.

TTS API: https://developers.deepgram.com/docs/text-to-speech
TTS languages: https://developers.deepgram.com/docs/tts-models
