# duck-graveyard.md

Defects that were **fixed, reopened, or shipped wrong**, with the root cause and
the structural change that makes each one unable to recur. A fix with no
structural guard goes back on this list eventually — that is the pattern this
file exists to break.

Status key: **BURIED** = structural guard in place · **OPEN** = fixed but only by
correcting code, no guard yet.

---

## G1 · Two complete engines in one file (v1, fatal)

**Symptom:** normalization behaved inconsistently; fixes "didn't take"; the same
issues reopened across many turns.

**Root cause:** `duck.html` v1 accumulated **2× `detectLangAsync`, 2× `loadFastText`,
2× `detectByScript`, 3× `ftAllowed`, 13 duplicate declarations total.** JavaScript
resolves duplicate `function` declarations last-wins. We were reading and editing
one copy while a *different* copy executed. The file's behaviour was determined by
declaration order, not by the code under inspection.

**Why it happened:** every subsystem was imported by pasting into an existing file
rather than replacing a named module. Nothing ever checked for collisions.

**Structural guard:** GATE 1 — build fails if
`grep -o "function NAME(" | sort | uniq -d` is non-empty. v2 ships with 0.

**Status: BURIED**

---

## G2 · Conditional teardown → stuck ring, silent steal, zombie mic

**Symptom (reopened 4×):** blue ownership ring stuck on; mic kept recording after
release; the other side could take input with no request; tapping compose after a
voice message gave no keyboard.

**Root cause:** teardown was **conditional** — it consulted remembered state
(`owner`, `recOn`, `.on`) to decide what to stop. That state lied. Auto-release on
pause deliberately set `owner=null` while leaving the pipeline running, so
`owner===null` did **not** mean "nothing is live". Any path that trusted it left a
pipeline alive or a visual unpainted.

**Structural guard:** `teardown()` is **unconditional and idempotent** — always
hard-stops *both* sides and repaints *both*, never consults state. `acquire()` calls
it first, always. GATE 3 proves only `teardown`/`acquire` write `INPUT`; GATE 3b
proves `teardown()` is the first statement in `acquire()`. Stuck ring is now
unreachable: no code path clears ownership without repainting both sides.

**Status: BURIED**

---

## G3 · Virtual keys stealing caret focus ("abc" → "cba")

**Root cause:** buttons receive `mousedown` before `click`; focus moved to the
button, so `selectionStart` reset to 0 and every character inserted at position 0.

**Structural guard:** every key and candidate binds
`pointerdown → preventDefault()`, so focus never leaves the input. Carried into v2
at build time rather than patched in.

**Status: BURIED**

---

## G4 · 32px keys

**Root cause:** treated as a style value, not an ergonomic constraint. 32px is below
every published minimum (Apple HIG 44pt / Material 48dp).

**Structural guard:** GATE 5 fails the build below 44px.

**Status: BURIED**

---

## G5 · `norm is not defined`

**Root cause:** a partial engine extraction — `normalizeOutgoing` was copied but the
`norm()` it calls lived 3,000 lines earlier in bridge and was left behind. Parse
checks pass because the reference is only resolved at call time.

**Structural guard:** GATE 2 byte-compares every engine block against bridge, and
the headless harness *executes* `normalizeOutgoing`, so an unresolved reference
fails the build rather than the phone. (This same harness caught a missing
`EXTRA_LAYOUTS` during the v2 build — before delivery.)

**Status: BURIED**

---

## G6 · Chrome password manager hijacking the compose input

**Root cause:** Chrome infers login context from *nearby* password fields; the
Deepgram key input on the same page was enough. `autocomplete="off"` is ignored by
Chrome for this heuristic.

**Structural guard:** compose inputs ship with
`autocomplete="new-password" role="presentation"` — the only override Chrome honours.

**Status: BURIED**

---

## G7 · Normalization not at parity with bridge (v2 baseline)

**Symptom:** typed code-switches not rewritten; quality below the donor.

**Root cause — a divergence I introduced in the plan, not a coding slip.** Plan §3
said "duck virtual keyboard → pass that layout's language as `knownLang`". Bridge
does **not** do this. Bridge's typed path calls `normalizeOutgoing(room, text)` with
**two arguments** — `knownLang` undefined — so `knownLang || await detectLangAsync(text)`
always runs detection. duck2 passed `langOf(side)` for keyboard input, which
**short-circuits detection entirely**, so a code-switch typed on the keyboard could
never be detected. Same class of bug as an earlier v1 defect; reintroduced because
the plan codified my assumption instead of bridge's actual contract.

**Fix:** typed path passes no `knownLang`, matching bridge exactly. STT keeps the
socket language, also matching bridge (`onDGFinal(..., room.myLang)`).

**Structural guard:** GATE 7 — the typed call site must match
`normalizeOutgoing(<room>, <text>)` with no third argument. Plan §3 corrected so the
divergence cannot be re-derived from the plan.

**Status: BURIED**

---

## G8 · `➤` leaving text in the compose strip

**Symptom:** tapping ➤ on a bubble sent the message *and* left the phrase sitting in
the compose strip afterwards.

**Root cause:** two separate paths wrote the strip and neither cleared it.
`sendFrom(side, textOverride)` skips its clear branch when `textOverride` is
supplied (`if(inp && textOverride==null)`), so anything already in the strip
survived the send. The STT callback made it worse by writing the transcript into
the strip *before* calling `sendFrom`, so voice messages always left their text
behind.

**Fix:** `sendFrom` clears the strip on **every** path. The STT callback no longer
writes to the strip at all — it sends directly. Tapping bubble *text* remains the
only action that populates the strip.

**Structural guard:** GATE 8 — harness asserts the strip is empty after ➤ and after
an STT send, and non-empty only after a text tap.

**Status: BURIED**
