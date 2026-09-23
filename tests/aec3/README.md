# AEC3 evaluation: not ready for application integration

2026-09-22. This evaluates Sonora 0.2.0, a Rust port of WebRTC AEC3, compiled to single-threaded WASM. It does not establish the behavior of every AEC3 implementation or browser-native echo cancellation. No application changes or deployment accompany this evaluation.

## Reproduce

Requires Rust (tested 1.98.1), Node (tested 24.14.0), and Windows System.Speech for fixture generation. Run from repository root:

```powershell
./tests/aec3/build.ps1
./tests/reference-aec/generate-voices.ps1 -FixtureDirectory ./tests/aec3/fixtures
node ./tests/aec3/dsp-test.cjs ./tests/aec3/fixtures/reference-voice.wav ./tests/aec3/fixtures/near-voice.wav
```

Expected result: nonzero exit because speech preservation fails. Do not lower the gate to make this pass. The Rust wrapper exposes static buffers for sequential calls in an isolated WASM instance; it is an evaluation interface, not a thread-safe production library.

## Measured baseline

Generated English speech, 16 kHz mono, 20-second input, overlapping near speech from seconds 10–18, simulated direct echo plus a reflection. Steady echo measured at seconds 7–10; overlapping speech at seconds 11–17. Compare overlap output to the same processor receiving only near speech. Gates require both echo reduction and overlap-versus-voice-only SNR above 20 dB. These are engineering screening gates, not a validated perceptual standard.

| Simulated delay | Echo reduction | Overlap versus voice-only SNR |
| --- | --- | --- |
| 20 ms | 65.78 dB | 5.50 dB |
| 80 ms | 65.86 dB | 5.92 dB |
| 160 ms | 66.15 dB | 6.93 dB |

The numerical speech gate fails at every delay. Raw waveform correlation and raw SNR are diagnostic only; their latency/phase assumptions are not calibrated for this processor.

An earlier offline Windows recognition check also lost near-speaker words. For example the baseline began “I would like to order a cup of coffee and a glass of water”; the 20 ms processed output began “But one squat”. This is supporting evidence, not a cloud STT benchmark. The existing reference-aec recognition script checks only a particular echo prefix; its exit status alone cannot certify speech preservation.

Exploratory settings did not resolve the failure: explicit delay hints and HMM transparent mode produced the same baseline metrics. Changing dominant-nearend defaults (enr_threshold 0.25→1.0, snr_threshold 30→10, trigger_threshold 12→4) gave overlap SNR 5.58/6.31/7.27 dB. Reducing reference/playback gain to 0.25 with those changes gave 7.83/10.40/10.14 dB. Those exploratory source changes are not enabled in the checked-in baseline. Baseline build uses the unmodified pinned dependency.

Limitations: synthetic room path, one generated English voice, no physical-device acoustic test, no Thai fixture, no live provider STT accuracy measurement. Failure here blocks this candidate; it does not prove browser full duplex impossible.

## Product decision and next experiment

The requirement remains hands-free overlapping conversation with continuous capture, no PTT and no microphone hold. A debug log must show capture, playback/reference, processing and transcript decisions beneath configuration. It is diagnostic, not the fix.

1. **Browser-only:** retain the HTML deployment model and investigate whether the target browser can route playback through its native voice-processing path. Establish platform behavior before writing another UI variant. Returned TTS audio is needed for any explicit reference path; Azure Speech documents both English and Thai voices and PCM responses. This requires a provider integration and credentials. Browser-only remains unproven on target hardware.
2. **Native audio wrapper:** preserve the HTML portal and implement capture/playback through platform voice-processing facilities. This expands packaging, installation and platform maintenance. Android AEC availability varies by device; native processing is not a guarantee. First prove echo rejection and overlapping word retention on the intended device before integrating the full portal.

Recommendation: permit a small native-audio feasibility prototype if reliable simultaneous speech is essential and an installed app is acceptable. The next scope decision is whether installation is acceptable and which device/OS must be supported first. If browser-only is mandatory, focus the next experiment on that specific browser/device instead.

Both routes must pass startup echo, sustained overlap, interruptions, volume changes and room-switch cancellation, then physical-device speech-retention checks. Keep the accepted portal unchanged until the audio path passes. Developer-operated fixtures and logs precede user acceptance testing.

Sources: [Sonora](https://github.com/dignifiedquire/sonora), [Azure returned TTS audio](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech), [Azure language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support), [Android AcousticEchoCanceler](https://developer.android.com/reference/android/media/audiofx/AcousticEchoCanceler).
