# Master Plan: app-990o/test.html

## (0) TURN/STAGE LEDGER

| Date | Turn/Stage | Status | Notes |
|------|-----------|--------|-------|
| 2026-10-16 | INIT-0 | DONE | Master plan creation |
| 2026-10-16 | BUILD-1 | IN-PROGRESS | Sudoku MVP: 9x9 grid, validation, mobile-first |
| 2026-10-16 | BUILD-1-CODE | DOING | Writing test.html: Sudoku grid, validation, mobile-first, hardcoded puzzle |

## (1) RELEASES

1. **R1: Sudoku MVP** — Playable 9x9 grid with input and conflict highlighting
2. **R2: Enhanced UX** — Auto-generated puzzles, difficulty levels
3. **R3: Advanced Tools** — Pencil marks, solver hints, persist state

## (2) PER-RELEASE SECTIONS

### R1: Sudoku MVP

**Scope (In)**
- 9x9 responsive CSS Grid (mobile-first, no overflow on 375px screens)
- Tap cell to input digits 1-9 (no keyboard pop-up hell)
- Real-time conflict detection (row/col/box duplicates glow red)
- In-app status bar for diagnostics/errors (never console-only)
- One hardcoded puzzle to prove playability
- New Game / Clear cell controls

**Scope (Out)**
- Puzzle generator (hardcoded seed only)
- Timer/scoring
- Save/load persistence
- Pencil marks / candidates mode
- Undo/redo history

**Build Gates**
- Renders fully on iPhone SE (375px wide) without horizontal scroll
- Renders fully on Android Chrome (360px+) without breakage
- Touch targets ≥48px for digits
- Conflicts visible immediately via cell styling (no DevTools inspection)
- Status message area shows "Ready" / "Error" / "Win" states clearly

**Backlog**
- Puzzle generator algorithm
- Difficulty selector
- Dark mode toggle

### R2: Enhanced UX

**Scope (In)** — TBD
**Scope (Out)** — TBD
**Build Gates** — TBD
**Backlog** — TBD

## (3) FUTURE IDEAS

- Recursive backtracking puzzle generator
- Three difficulty presets (Easy: 36 givens, Medium: 28, Hard: 22)
- Timer with localStorage best times
- Dark mode CSS toggle
- Pencil marks (candidate mode)
- Hint system (highlight obvious single)

## (4) IMMUTABLE WORKING RULES

- Mobile-first always
- All diagnostics in-app; never DevTools-only
- Update plan before touching code
- Read-back verification after every push
- No stubs, no fake data, no pretend functionality
- This plan is sole authority; chat history may be partial

## (5) DECISION LOG

- **2026-10-16**: Plan created. Locked target to projects/app-990o/test.html unless owner overrides per-session.
- **2026-10-16**: Scope pivot to Sudoku game. R1 redefined as Sudoku MVP with hardcoded puzzle and conflict validation.

## (6) APPENDIX

**Authority Order**
1. This plan file (projects/app-990o/test.md)
2. Owner explicit instructions in current session
3. Code file contents (projects/app-990o/test.html)
4. Chat history (non-authoritative, partial)

**File Paths**
- Plan: `projects/app-990o/test.md`
- Code: `projects/app-990o/test.html` (locked unless specified)
