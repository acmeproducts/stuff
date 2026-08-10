# The Method

A build process for a single-file app maintained across many sessions with an AI
builder and one human gatekeeper. Extracted from TalkBridge after fifty releases
at roughly a 10% hit rate, then six consecutive releases that largely landed.

The change was not competence. It was that nothing used to catch a bad release
before it became the foundation of the next one.

---

## 1 · The four rules that carry most of the weight

**Prove the cause before designing the fix.** A root cause is a printout, not a
hypothesis. Every cause declared from reasoning alone in the last session was
wrong; every cause taken from a log or a harness was right. When a cause is
unknown, instrument the whole path and read it.

**Roll back, never patch forward.** A failed gate returns to its own input and
rebuilds to the same filename. Patching a failure is how one defect becomes a
lineage nobody can reason about.

**Hook, never replace.** Wrap a function and call through. Downstream effects
then survive by construction rather than by memory. Replacing a function other
behaviour depends on is the single most expensive mistake available.

**Mutation-test every gate.** Reintroduce the defect and confirm the tests fail.
Repeatedly a first-draft test passed while the thing it tested did nothing. Each
would have shipped a false pass.

---

**5. ONE OBJECTION, THEN RESEARCH.** When the owner proposes something and the
builder disagrees, the builder gets exactly one objection. If the owner holds
their position, the builder must go and research the competing idea before
arguing a second time — and must report what was actually found, including when
it contradicts the builder.

This rule exists because of a specific, expensive failure. The builder asserted
that Cache Storage is shared between a Safari tab and an installed iOS web app,
built an entire state-transfer mechanism on it, shipped it, watched it fail on
the owner's device — and *still* did not search. Three rebuilds and three
rollbacks later, one search settled it in a single query: Apple gives an
installed Home Screen web app its own storage, deliberately. The same pattern
repeated with the manifest and `start_url`.

The cost was not the wrong theory. Wrong theories are cheap. The cost was
defending it across four exchanges while the owner's test device kept receiving
builds premised on something false, and the owner's testing time was spent
disproving what a search would have answered for free.

The asymmetry is the whole point: a search costs seconds, and being wrong in
public costs the owner hours and their users a broken product. Assertion is not
research. "I already have a theory" is the moment to search, not the reason to
skip it.

**6. NO PUSH UNTIL EVERY TEST PASSES. NO EXCEPTIONS.** Not "the failure is
unrelated". Not "that one is already on the backlog". Not "the deployed build
is fine anyway". A red suite means nothing ships, full stop.

This exists because the builder pushed while a test was failing, having decided
the failure was cosmetic — and it was, that time. The point is that the
judgement should never have been made. The moment "which failures matter" is a
question the builder answers, the gate has stopped being a gate and become an
opinion. A suite that is allowed to be red is a suite nobody reads.

The known-failing backlogged test is not an exception to this rule; it is a
standing violation of it, and the correct fix is to resolve or formally quarantine
it, not to step over it on every deploy.

## 2 · Process

### Per release
1. Read the plan and the graveyard.
2. Agree the scope with the owner **before building**. Write it into the plan.
3. Declare each part's contract: what it replaces, wraps, adds.
4. Build. Assemble from parts — never edit the deployed artifact.
5. Contract gate → unit tests → structural checks → mutation tests.
6. Deploy, byte-verify, hand to the owner.
7. Owner gates on real hardware. That is the only gate that counts.
8. Pass → new baseline. Fail → rollback, graveyard entry, plan bump, rebuild.

### Naming
Outputs cycle through fixed stage names within a numbered family. Every name is
a real, running, gated build — never a phase or a placeholder. The names carry no
meaning beyond order; they exist so the chain reads in sequence and any build is
reachable by editing a URL.

### Documents, in the repo, versioned
- **Plan** — releases as input→output, one concern each, scope agreed in advance.
- **Graveyard** — every failed approach, why, and the replacement. Scanned before
  every build. *Check the date and lineage of an entry before applying it: an
  entry written after an amputation does not veto the pre-amputation original.*
- **Method** — this document.

---

## 3 · Tools

**Assembly build.** The deployed artifact is one file, assembled from separate
source parts. Nothing is ever edited in place, so a broken part is deleted and
rebuilt rather than patched. This makes forward-patching mechanically impossible
rather than merely discouraged.

**Contract gate.** Each part declares its surface. The build extracts what it
actually did and fails on any difference, and on any call a replaced function no
longer makes — naming the callee when it has become unreachable anywhere. The
surface accumulates across parts, so a later part cannot silently take over an
earlier one's function.

**Sandbox harness.** The whole app runs headless against a DOM stub. Two
instances can be booted and wired together to reproduce a two-device
interaction. This is where causes get proven and where being wrong is free.

**Structural checks before push.** Syntax, markup balance, wiring (every
referenced element and handler resolves), and a full runtime execution. Each
verified to catch its own failure by deliberate breakage.

**Byte-verified deploy.** Push, then read the artifact back at the exact commit
and compare hashes.

**Permanent runtime assertions.** Where a defect was silent, leave a log line
that states the property afterwards — not a debug flag, a permanent one. A
silent failure that once cost a week should never be silent again.

---

## 4 · Working with the owner

- **Their history beats the builder's inference.** "This worked fifty attempts
  ago" is unavailable to the builder and is often the highest-value fact in the
  session. It reframes the question from *what is missing* to *what changed*.
- **Scope stays the size of the defect.** Two problems sharing a symptom are
  still two problems. Merging them makes both intractable.
- **A mechanism with no way to invoke it passes every test and does nothing.**
  At least one test must exercise the feature through the control a person uses.
- **Report results, not process.** No narration of steps, no self-congratulation.
- **The owner is usually reasoning about the product; the builder is usually
  reasoning about the code.** When they conflict, the product view is more often
  the correct frame. The builder's job is then to find the mechanism that serves
  it, not to explain why it cannot be done.
- **Prefer what already exists.** Several rounds were spent designing a pairing
  code and a provisioning record when the invite link — already generated,
  already shared, already carrying exactly what was needed — was sitting there.
  Ask what the system already produces before inventing a new artefact.

---

## 5 · Pressing the hit rate higher

Ranked by expected return:

1. **Two-instance harness by default** for anything that crosses a wire. Three of
   the six failures were transport-related and all were provable headlessly.
2. **A reachability check** — every new behaviour must be traceable to a control.
   The rename shipped with no way to invoke it.
3. **Transport allowlist as a first-class fact.** New message types silently did
   not cross. Record which carriers are proven and refuse new ones without
   evidence.
4. **Scope confirmation as a gate**, not a courtesy. The one release built from
   rulings without a confirmed scope drifted.
5. **Verify claims about the current build before writing them into a plan.** A
   feature was scheduled that already existed, on the strength of a failed
   keyword search reported as a finding.
