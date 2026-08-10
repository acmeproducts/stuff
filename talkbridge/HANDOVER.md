# To the next instance working on TalkBridge

Read this before you do anything else. Read `TALKBRIDGE-PLAN-v9.md` second, and
the talkbridge/TALKBRIDGE-GRAVEYARD.md third. 
This letter is a distilled, urgent version of talkbridge/THE-METHOD.md — read that fourth for full context.
These are not suggestions. These are requirements to be successful in delivering the talkbridge application.

## What you're picking up

Plan v10.8.0. Baseline is `bridge-turn24-base.html`, device-passed. Release 7 is
done. There is one **unfinished, unshipped fix** waiting for you — read the plan's
"IN PROGRESS" section before touching code. Do not consider it done. Do not
re-derive it from scratch either — the root cause is already found and proven,
only the last edge case is unresolved.

## Why you will fail if you skip these, stated plainly

**1. Prove the cause before you design the fix.** Every root cause this project's
builder declared from reasoning alone was wrong. Every one taken from a log or a
two-instance harness was right. If you don't know why something is broken,
instrument it and read the log. Do not theorize. This is not caution, it's the
single highest-leverage habit available to you.

**2. Roll back, never patch forward.** A failed device gate returns to its input
and rebuilds to the same filename. If you patch a failure, you will produce a
lineage nobody can reason about — that is literally how this project lost fifty
releases before this method existed. There is no exception for "it's a small fix."

**3. Hook, never replace.** Wrap a function and call through to the original.
Replacing a function other behavior depends on is the single most expensive
mistake available to you — it will pass every test you write and still break
the app, because your test will check the return value, not the side effects
you silently dropped.

**4. Mutation-test every gate you write.** Reintroduce the defect on purpose and
confirm your test fails. If you don't do this, you don't know if your test
tests anything. This happened repeatedly — a first-draft test passed while the
thing it tested did nothing.

**5. A mechanism with no way to invoke it is not a feature.** It passes every
test and does nothing. If you add a behavior, one of your tests must exercise it
through the actual control a person uses, not the function directly.

**6. Confirm scope with the owner before you build.** Write it into the plan
first. One release drifted badly because it skipped this step.

**7. Verify claims about the current build before writing them into a plan.** A
feature was scheduled that already existed, based on a failed keyword search
reported as a finding. Grep is not verification. Read the actual code.

**8. New relay message types are fine — that was a false alarm we corrected.**
An earlier entry claimed new message types don't cross the relay. That was
wrong; the relay broadcasts everything. Don't trust a graveyard entry blindly —
check its date and whether it was proven or inferred. This document itself could
be wrong about something; verify, don't just obey.

**9. Two-instance harness by default for anything crossing a wire.** Boot two
app instances headless, wire them together exactly like the relay does. Prove
delivery before you believe it. Three separate failures this project would have
been caught in seconds this way instead of costing a device-testing round trip.

**10. The owner's memory beats your inference, every time.** "This worked fifty
attempts ago" is information you cannot derive. When the owner tells you
something used to work, that reframes the entire question from "what's missing"
to "what changed" — and the second question is almost always cheaper to answer.
Do not argue with lived history using architecture theory.

## Tone

Report results. Not process, not your own cleverness, not a narration of what
you did. The owner is technical, impatient with padding, and has been burned by
overconfident wrong diagnoses more times than either of us would like. Earn
trust by being right, not by sounding thorough.

## Concretely, right now

1. Read plan §"IN PROGRESS" — the missed-activity counting bug.
2. Find the double-count edge case. Instrument if you can't see it immediately.
3. Fix, mutation-test, ship as its own small part.
4. Fix the flags.gif and favicon 404s in the same part — already scoped, trivial.
5. Then look at the backlog. Group calls (3+) is the most interesting item there
   and the most dangerous — it touches nearly everything. Do not start it
   without confirming scope with the owner first, per rule 6.

Good luck. Don't skip the harness.
