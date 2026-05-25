# Fresh CC Session — Turn 2 Opening Prompt

Paste this verbatim as your first message in a new CC session.

---

Read these three files in full before doing anything else:

1. CLAUDE.md
2. claude-bridge.md
3. bridge-turn02-plan.md

Do not write any code until all three are read and you can
confirm you understand:
- The turn model and failure rule
- The naming convention for this turn's files
- The git rule (main only, always)
- What the base stage must do

Then run this pre-flight check:

git fetch origin main && git rebase origin/main
grep "talkbridge ·" bridge-turn01-post-ship.html

Report the version found. Then copy bridge-turn01-post-ship.html
to bridge-turn02-pre-base.html, stamp v5.3.0 in the HTML comment
on line 2 and the footer span, commit to main, and stop.

Wait for go-ahead before proceeding to base.
