# Loki Master Plan

## (0) TURN/STAGE LEDGER

| Date | Turn | Stage | Note |
|------|------|-------|------|
| 2026-10-16 | 1 | INIT | Plan created; baseline TBD |

## (1) RELEASES

1. **v0.1.0** — Mobile scaffold with in-app diagnostics (baseline)
2. **v0.2.0** — TBD
3. **v0.3.0** — TBD

## (2) PER-RELEASE SECTIONS

### Release v0.1.0 — Mobile Scaffold

**Scope IN**
- Single-file HTML5 at `projects/watch-mccz/loki.html`
- Mobile-first responsive CSS (breakpoints ascend only)
- In-app diagnostics panel (logs, errors, state visible in UI)
- Touch-optimized controls

**Scope OUT**
- Backend/API integration
- Data persistence (localStorage, IndexedDB)
- Desktop-specific optimizations
- Authentication

**Build Gates** (Verify on real devices before next release)
- [ ] Renders correctly on iPhone SE (375×667) Safari
- [ ] Renders correctly on Android Chrome (360×640+)
- [ ] Diagnostic panel captures console logs without DevTools
- [ ] No console errors on load
- [ ] Lighthouse mobile performance > 90

**Backlog** (Deferred to v0.2.0+)
- Service Worker offline capability
- PWA manifest and icons
- Install prompt handling

## (3) FUTURE IDEAS

- Geolocation integration
- Camera/file picker access
- Export/import functionality
- Theming (dark/light mode)

## (4) IMMUTABLE WORKING RULES

1. **Mobile-first**: CSS min-width breakpoints only; never desktop-down
2. **In-app diagnostics**: All errors, logs, and debug state must surface in the UI; never require DevTools
3. **Update-plan-before-code**: Modify this document before modifying loki.html
4. **Read-back verification**: Test on real device or accurate simulator after every code push
5. **No stubs/fake data**: No mock APIs, placeholder responses, or synthetic data in production paths
6. **Single-file**: loki.html remains self-contained unless owner explicitly changes TARGET path

## (5) DECISION LOG

- **2026-10-16**: Project initialized. Target locked to `projects/watch-mccz/loki.html`. Plan authority established over chat history.
- **2026-10-16**: Mobile-first + in-app diagnostics mandated as core constraints.

## (6) APPENDIX: AUTHORITY ORDER

1. This plan file (`projects/watch-mccz/loki.md`) — sole persistent authority
2. Owner explicit instructions in current request
3. REFERENCED FILE blocks provided in context (GitHub, etc.)
4. Chat history — may be partial or missing; not authoritative

---

*Plan v0.1 | Last updated: 2026-10-16*
