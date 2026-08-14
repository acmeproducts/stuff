# Handover — TalkBridge

## Onboarding — read in this order

1. `talkbridge/THE-METHOD.md` — the process. Not optional, not a suggestion.
2. `talkbridge/TALKBRIDGE-GRAVEYARD.md` — every failed approach and why. Scan it
   against whatever you're about to build before you build it.
3. `talkbridge/TALKBRIDGE-PLAN-v9.md` — current scope, current baseline, what's
   passed, what's next. This is the single source of truth for state.

4. When removing or replacing existing behavior: `grep`/read the exact current
   implementation being replaced **before** writing the replacement — never
   reconstruct it from the plan's English description. This is the specific gap
   both 2.2 regressions shared. (Rule 1 below.)

If anything below conflicts with those three, they win.

## History

Plan is at v10.11.0. Release 7 has now failed and been rolled back **twice**:

- **Graveyard 2.1** — passed its gate once, was then patched forward directly on
  the already-passed file three times. Forbidden regardless of fix size. Rolled
  back to baseline `bridge-turn24-pre-base.html`.
- **Graveyard 2.2** — rebuilt fresh per the corrected process, gated with 54
  behavioural assertions and nine mutation tests, reported as fully verified —
  and shipped two regressions the owner caught immediately on real hardware: the
  clock tap went to the wrong screen (should reuse the exact handler the removed
  nav card used — one line in the base — instead it was reimplemented from the
  plan's English description and got it wrong), and the ribbon's call controls
  crowded to the left on iPhone (the fix was reinvented from scratch instead of
  reading the geometry that had already passed a gate earlier the same day).

**Both regressions share one root cause: replacement UI was written from the
plan's prose description instead of from reading the exact code being
replaced.** All the automated gates — contract, syntax, wire, mutation tests —
passed anyway, because none of them check "does this match what a human
actually sees." Only the owner's eyes caught it, on the second rollback in a
row.

**Also learned the hard way this round: "root-caused, not assumed" was stated
in a report without the evidence attached.** Do not do this. See the new rule
below.

## Two rules added because of the above — treat as mandatory, not advisory

**1. When removing or replacing existing UI, read the exact current
implementation first — the actual markup, the actual handler, the actual CSS —
before writing anything.** Do not reconstruct it from the plan's prose
description, and do not reconstruct it from memory of what it "should" do.
`grep`/`view` the real file. If a control is being relocated or its behavior
preserved, diff your replacement against the original's actual code, not
against your mental model of it. Both regressions this round happened because
this step was skipped in favor of building from the spec directly.

**2. Never write "verified," "root-caused," "proven," or similar in a report
without the evidence in the same message.** A log line, a diff, harness output,
a screenshot — something pasteable. If you can't paste it, you haven't done it
yet, and the correct thing to write is "not yet verified" or "assumed, needs
confirmation" — not a confident claim dressed as fact. The owner has now caught
overconfident wrong claims enough times that a claim without evidence should be
read as a red flag, not reassurance.

## Execution — what happens next

Release 7 needs a **third** clean build from `bridge-turn24-pre-base.html`.
Same scope as before — PWA shell, push, away-record, call surface, missed-
activity counting fix, the two 404 fixes, iOS/Safari testing — plus, this time,
rule 1 and rule 2 above applied without exception to every piece of UI that
touches something already live: the clock/nav-card interaction and the ribbon
layout specifically, since those are the two that broke.

Do the two-instance harness proof for anything crossing the relay before you
believe it works. Confirm scope against the plan before you start. Roll back,
never patch, on any failure — including your own. Report only what you can
show, not what you believe you did.


## Session 2026-08-13 — R8 rebuilt as `bridge-turn24-base.html`

Owner rescope (plan v13.5.0): source is the approved `bridge-turn24-pre-ship.html`
(8.0 ribbon + 8.1 home-card fix, device-passed); output `bridge-turn24-base.html`;
8.6 = Ear "Hear their voice" / Headset "Hear translation" / Bell "Ringer";
8.13 = iPhone typography; 8.14 = password-manager silence; `&debug=1` backlogged.

Build is PURELY ADDITIVE over the approved base (byte-checked by the harness).
Sourced from the rolled-back attempt at `c77e221` by reading its exact code, with
these deliberate changes: debug toggle excised; flag motif scoped to the home
body (flags-tall.png, contain, below ribbon) and the two name-ask cards (S0, S10)
only; all `.gif` layers removed and the base's own dead `flags.gif` layer
overridden by a later cascade rule (base bytes untouched); menu labels set to the
owner's exact wording; dead duplicated CSS block deleted.

Harness: `talkbridge/build/harness.mjs` — boots the artifact in jsdom and asserts
downstream effects (nodes attached, styles set, text written, state flipped),
never returns. 22/22 green. `talkbridge/build/mutate.mjs` — fourteen FRESH
defects; 14/14 caught. Run:
  node talkbridge/build/harness.mjs bridge-turn24-pre-ship.html bridge-turn24-base.html
  node talkbridge/build/mutate.mjs  bridge-turn24-pre-ship.html bridge-turn24-base.html

NOT yet proven: the device gate (plan §2d) and anything crossing the relay
(typing indicator and timer parity are harness-proven locally, not two-instance
proven). The build awaits the owner's device pass.


## Session 2026-08-13 (later) — device gate FAILED, R8 split, R8a shipped

The all-in-one build failed on device: room-menu toggles broken by the icon
swap (see graveyard). Rolled back at `889090e`. Owner split R8: **R8a**
chrome/text now in `bridge-turn24-base.html` (menu wording only — the toggle
graphics are never touched); **R8b** call surface re-applies the already-
harness-proven six items onto the R8a base once it passes. Harness rescoped:
17/17 effects green, 12/12 fresh mutations caught, including a runtime glyph
swap and a tooltip-clobbering label rewrite.

## Session 2026-08-13 (third pass) — mic wrap failed on device; 8.4 buried; R8a rebuilt

The ribbon toggleMic/toggleCam wrap left the owner's microphone completely
disabled. Rolled back and rebuilt R8a from the approved pre-ship with ZERO
media-control code — appended parts may not even name rb-mic/rb-cam/toggleMic/
toggleCam/CHATMIC (harness guard C6c scans for it; C6d asserts CALL.toggleMic
is the base original). Plan v14.1.0; graveyard entry written; 8.4 dead.
R8a now: clock home · flag motif · bubble-header icons · menu wording only ·
typography · password silence. Harness 19/19; mutations 14/14.
