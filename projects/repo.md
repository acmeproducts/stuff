TURN/STAGE LEDGER
| Turn | Date       | Status | Notes                                 |
|------|------------|--------|---------------------------------------|
| 1    | 2026‑10‑09 | ✅      | Created initial master plan (this file) |

RELEASES
1. **Release 1** – Basic mobile‑first HTML app skeleton with navigation and placeholder content.

### Release 1 – Scope
**In‑Scope**
- Mobile‑first layout (responsive meta tag, viewport)
- Basic navigation bar
- Placeholder main content area
- In‑app diagnostics UI (debug panel)

**Out‑Scope**
- Dynamic data fetching
- Advanced animations
- Offline storage

**Build Gates**
- Verify layout on iOS Safari and Android Chrome (screen widths 320 px–768 px)
- Confirm diagnostics panel appears and reports “Ready” on real device
- No console‑only logs; all messages must be visible in‑app

**Backlog (Deferred)**
- Theme switcher
- Form handling
- Service worker for offline support

### Release 2 – Scope
*In‑Scope* – TBD  
*Out‑Scope* – TBD  
*Build Gates* – TBD  
*Backlog* – TBD  

### Release 3 – Scope
*In‑Scope* – TBD  
*Out‑Scope* – TBD  
*Build Gates* – TBD  
*Backlog* – TBD  

FUTURE IDEAS
- Multi‑page routing with hash‑based navigation
- Localization support
- Accessibility enhancements (ARIA, focus management)
- Integration with external APIs
- Progressive Web App features

IMMUTABLE WORKING RULES
- **Mobile‑first**: design for small screens first, then scale up.
- **Diagnostics in‑app**: all health/info displayed inside the UI; never rely on DevTools console.
- **Update‑plan‑before‑code**: the plan must be edited and saved before any code change.
- **Read‑back verification**: after each push, manually review the app on a device to confirm behavior.
- **No stubs/fake data**: use real static content; avoid placeholder APIs.

DECISION LOG
- 2026‑10‑09: Owner requested creation of master plan following house‑planning‑doc standard.

APPENDIX
- **Authority Order**: This plan (`projects/repo.md`) is the sole authority for the project. All chat history is subordinate to the plan. Any future changes must be recorded here before code modifications.
