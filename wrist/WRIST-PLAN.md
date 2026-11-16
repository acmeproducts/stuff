# Wrist — plan (sole authority for `wrist/`)

Version 1.0.0 · 2026-11-16 · Owner/device gate: Confi · Device: Galaxy Watch 9, left wrist

## 0. Turn ledger
| Date | Turn | Status | Notes |
|---|---|---|---|
| 2026-11-16 | turn01 | built, device gate pending | Practice screen on the watch; nothing leaves the watch. 17/17 lab checks. Not yet run on the owner's arm. |

## 1. Why this exists (owner's words, 2026-11-16)
- "I really can't type using a keyboard or a mouse … or for that matter a touch screen for more than 15 minutes at a time."
- "The human talks and minimal taps or swipes [to] X, and X talks to everything else. X is multi threaded."
- "It is my right hand that has problems, my left hand is fine, just not very dexterous … also happens to be where I wear my SmartWatch."
- "You could almost simulate scrolling up and down by just moving the left hand … swipe left and right by holding your hand vertical, you could even tap by just literally tapping."
- Body signals are to be used "sparingly".

## 2. The wearable contract
Few motions, same meaning everywhere. All on the left arm; the right hand is never required.

| Motion | Meaning | How the watch reads it |
|---|---|---|
| Hand flat, raise or lower the hand end and **hold** | move through content; level out to stop | forearm tilt from gravity, 12° level band, full speed 25° past it |
| Hand vertical (thumb up), swing left or right | previous / next item or thread | turn rate about the up direction; about 26° swept inside 0.6 s |
| A knock (or a touch anywhere on the watch face) | yes / choose this | short jolt, over within 0.1 s, arm otherwise quiet |
| Buzz | X has something | not in turn01 |

Tilt is a held posture, not a repeated flick, so the left wrist does not inherit a repetitive load.

## 3. turn01 scope
In: a foreground practice screen (30 rows × 4 threads) that reacts to the three motions, with a distinct buzz for each and live numbers on screen (tilt, roll, knock strength / threshold, counts, build name).

Out (open assumptions, owner may override):
- Sending motions to the phone or to X. There is nothing to receive them yet.
- Working with the screen off or the app in the background.
- Any setting or calibration screen.

## 4. Build and delivery
- Source: `wrist/app/`. Detector logic is plain Java (`Detector.java`) so the same class runs in lab checks and on the watch.
- Build: `.github/workflows/wrist-build.yml` runs `wrist/build.sh` (Android SDK tools only, no Gradle), then commits `wrist/out/wrist.apk` and `wrist/out/BUILD-LOG.md` to the branch.
- Signing: `wrist/debug.keystore` (password `android`) is a throwaway debug key kept in the repo on purpose, so every build updates over the last one. It protects nothing.
- Install: wireless debugging on the watch, push the file from the phone with Bugjaeger.

## 5. Owner's definition of working (device gate, turn01)
1. App opens and the bottom line shows the build name, no "NO …" sensor warning.
2. Hand flat: raising the hand and holding moves the list one way and keeps moving; lowering moves it the other way; level stops it.
3. Hand vertical: one swing left changes thread once; one swing right changes it back once. The return swing does not count.
4. A knock ticks the centred row once. Ordinary arm movement does not tick rows.
5. Each motion gives its own buzz.

## 6. Unverified (lab only)
- Every threshold in `Detector.java` is a first guess. None has been measured on the owner's arm.
- Direction signs assume the watch on top of the left wrist with the buttons towards the hand. If the list or the threads move the wrong way, that is a one-line flip.
- Knock detection is the least certain.
- No log channel exists from the watch to the repo yet. The on-screen numbers are the only diagnostics in turn01.

## 7. Lab checks
`wrist/test/DetectorTest.java`, synthetic 100 Hz traces, run on every build. 2026-11-16: 17/17 pass.
