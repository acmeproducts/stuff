# bridge1.html Test Matrix (Strict Gate)

Use this matrix as a **release gate after each implementation pass** on `bridge1.html`. A pass is accepted only if **all required rows pass** on the applicable platforms.

## Platforms

- **P1:** Safari on iOS (latest stable iOS + Safari)
- **P2:** Chrome desktop (latest stable)
- **P3:** Chrome Android (latest stable)

> If iOS device testing is unavailable for a given pass, mark P1 as `BLOCKED` and do not merge unless the pass is explicitly scoped to non-iOS behavior.

## Global timing and quality thresholds

- Timing precision: capture with visible timestamps in app debug logs and/or external screen recording timeline.
- Speech audibility threshold: spoken output is clearly audible at default device media volume (50%+).
- Restart SLA: any automatic speech recognizer restart required by criteria must complete in **<= 3.0s**.
- TTS reaction SLA: bubble TTS playback must begin in **<= 1.0s** from click.

## Scenario matrix

| Scenario | P1 Safari iOS | P2 Chrome desktop | P3 Chrome Android | Exact pass criteria |
|---|---|---|---|---|
| Continuous speech | Required | Required | Required | During a 2-minute monologue, recognizer remains active without manual intervention; no final transcript gap > 3.0s between spoken phrase end and visible transcript update; no unintended recognizer stop lasting > 3.0s. |
| Natural pauses | Required | Required | Required | With 10 scripted pauses (2-5s each), recognizer either stays active or auto-restarts; each post-pause utterance is captured with first recognized tokens appearing <= 3.0s from speech resume; zero missed post-pause utterances in the script. |
| Mute/unmute churn | Required | Required | Required | Execute 20 cycles: mute for 1s, unmute for 2s while speaking after each unmute. After every unmute, recognizer is active and captures speech <= 3.0s; no frozen state requiring reload; transcript contains >= 19/20 expected post-unmute utterances. |
| Background/foreground | Required | N/A (or minimize/restore) | Required | Run 10 cycles: app backgrounded/minimized for 5s then foregrounded. After each return, recognizer and audio pipeline recover <= 3.0s; first test phrase after return is transcribed <= 3.0s; no permanent media track loss or duplicated recognizer loops. |
| Bubble TTS source icon | Required | Required | Required | For 10 source-text bubbles, tapping source TTS icon starts audible playback <= 1.0s each time; correct source language voice is used; exactly one playback per tap (no double-fire); second tap during playback stops or restarts deterministically per current UX spec. |
| Bubble TTS translated icon | Required | Required | Required | For 10 translated-text bubbles, tapping translated TTS icon starts audible playback <= 1.0s each time; voice language matches translated language setting; no fallback to source-language voice unless translation text is empty; icon action does not alter recognizer running state for > 1.0s. |

## Per-pass gate checklist

For each implementation pass:

1. Run all required scenario rows on P1-P3.
2. Record result per row/platform: `PASS`, `FAIL`, or `BLOCKED` (with reason).
3. A pass is **Gate PASS** only when:
   - No `FAIL` on any required row/platform.
   - No `BLOCKED` on required platforms unless explicitly approved in pass scope.
4. Any `FAIL` triggers fix-and-rerun for that row plus adjacent risk rows:
   - Recognizer lifecycle changes -> rerun Continuous speech, Natural pauses, Mute/unmute churn, Background/foreground.
   - TTS/bubble UI changes -> rerun both bubble TTS rows plus one sanity run of Continuous speech.

## Evidence required per gate run

- Build or commit identifier under test.
- Device + OS + browser version for each platform.
- Timestamped logs or recording snippets showing SLA measurements (3.0s restart, 1.0s TTS start).
- Final gate decision: `PASS` or `FAIL`.
