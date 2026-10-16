# Master Plan: app-990o/test.html

## (0) TURN/STAGE LEDGER

| Date | Turn/Stage | Status | Notes |
|------|-----------|--------|-------|
| 2026-10-16 | INIT-0 | DONE | Master plan creation |

## (1) RELEASES

1. **R1: Bootstrap** — Scaffold mobile-first HTML shell
2. **R2: TBD** — TBD
3. **R3: TBD** — TBD

## (2) PER-RELEASE SECTIONS

### R1: Bootstrap

**Scope (In)**
- Valid HTML5 skeleton
- Viewport meta tag for mobile-first
- Inline CSS reset/base
- Basic structure (header/main/footer)
- First diagnostic div (visible status)

**Scope (Out)**
- External JS/CSS files
- Functionality beyond render test
- Console-only diagnostics

**Build Gates**
- Loads on iOS Safari without layout breakage
- Loads on Android Chrome without layout breakage
- In-app diagnostic displays "Ready"
- Verified on real devices, no DevTools required

**Backlog**
- TBD

### R2: TBD

**Scope (In)** — TBD
**Scope (Out)** — TBD
**Build Gates** — TBD
**Backlog** — TBD

## (3) FUTURE IDEAS

- TBD

## (4) IMMUTABLE WORKING RULES

- Mobile-first always
- All diagnostics in-app; never DevTools-only
- Update plan before touching code
- Read-back verification after every push
- No stubs, no fake data, no pretend functionality
- This plan is sole authority; chat history may be partial

## (5) DECISION LOG

- **2026-10-16**: Plan created. Locked target to projects/app-990o/test.html unless owner overrides per-session.

## (6) APPENDIX

**Authority Order**
1. This plan file (projects/app-990o/test.md)
2. Owner explicit instructions in current session
3. Code file contents (projects/app-990o/test.html)
4. Chat history (non-authoritative, partial)

**File Paths**
- Plan: `projects/app-990o/test.md`
- Code: `projects/app-990o/test.html` (locked unless specified)
