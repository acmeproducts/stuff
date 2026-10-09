TURN/STAGE LEDGER
| Turn | Date       | Status | Notes                                 |
|------|------------|--------|---------------------------------------|
| 1    | 2026‑10‑09 | ✅      | Created initial master plan (this file) |
| 2    | 2026‑10‑09 | ✅      | Added dashboard requirements and next‑step note |

RELEASES
1. **Release 1** – Basic mobile‑first HTML app skeleton with navigation and placeholder content.
2. **Release 2** – Repo dashboard core UI (left rail, right‑side tabs) and in‑app diagnostics.

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
**In‑Scope**
- Left‑rail list of repositories (repo name, last accessed timestamp, GitHub Pages status)
- Right‑side tabbed interface that customizes per‑repo:
  - **Overview** tab: summary, status badges, launch link
  - **Apps** tab: list of apps in the repo, grouped by version under collapsible chevrons, each with launch button
  - **Code** tab: links to source files / GitHub view
  - **Readme/Install** tab: rendered README or install instructions
- “Analyze” button for repos without a GitHub Pages site that triggers a placeholder assessment flow
- In‑app diagnostics panel showing “Dashboard Ready” and any error messages

**Out‑Scope**
- Real API integration with GitHub (use static placeholder data for now)
- Automatic generation of GitHub Pages config (just UI placeholder)

**Build Gates**
- Test on real devices that left rail scrolls and right tabs switch correctly
- Verify each repo entry shows last‑access timestamp and Pages status
- Confirm chevron groups expand/collapse and launch links are clickable
- Diagnostics panel must display “Dashboard Ready” after UI loads

**Backlog (Deferred)**
- Automated GitHub API calls to fetch real repo data
- Persistent storage of analysis results
- Theme switcher for dashboard
- Service worker for offline dashboard use

### Release 3 – Scope
*In‑Scope* – TBD  
*Out‑Scope* – TBD  
*Build Gates* – TBD  
*Backlog* – TBD  

FUTURE IDEAS
- Multi‑page routing with hash‑based navigation
- Localization support
- Accessibility enhancements (ARIA, focus management)
- Integration with external APIs (GitHub, CI/CD)
- Progressive Web App features
- Exportable reports (CSV, PDF)

IMMUTABLE WORKING RULES
- **Mobile‑first**: design for small screens first, then scale up.
- **Diagnostics in‑app**: all health/info displayed inside the UI; never rely on DevTools console.
- **Update‑plan‑before‑code**: the plan must be edited and saved before any code change.
- **Read‑back verification**: after each push, manually review the app on a device to confirm behavior.
- **No stubs/fake data**: use real static content; avoid placeholder APIs.

DECISION LOG
- 2026‑10‑09: Owner requested creation of master plan following house‑planning‑doc standard.
- 2026‑10‑09: Added dashboard feature set and split work into Release 2.

APPENDIX
- **Authority Order**: This plan (`projects/repo.md`) is the sole authority for the project. All chat history is subordinate to the plan. Any future changes must be recorded here before code modifications.
