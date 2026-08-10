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
