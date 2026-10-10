TURN/STAGE LEDGER
| Turn | Date       | Status | Notes                                 |
|------|------------|--------|---------------------------------------|
| 1    | 2026-10-09 | ✅      | Created initial master plan (this file) |
| 2    | 2026-10-09 | ✅      | Added dashboard requirements and next‑step note |
| 3    | 2026-10-10 | ✅      | Added functional dashboard logic with static repo data, dynamic rendering, and a working “Analyze” flow |
| 4    | 2026-10-10 | ✅      | Updated plan to include API fetch implementation step |

RELEASES
1. **Release 1** – Basic mobile‑first HTML app skeleton with navigation and placeholder content.
2. **Release 2** – Repo dashboard core UI (left rail, right‑side tabs) and in‑app diagnostics.
3. **Release 3** – Live GitHub API integration for fetching real repository data.

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
  - Overview, Apps, Code, Readme/Install tabs
- “Analyze” button for repos without a GitHub Pages site (placeholder flow)
- In‑app diagnostics panel showing “Dashboard Ready”

**Out‑Scope**
- Real API integration with GitHub (use static placeholder data for now)

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
**In‑Scope**
- Fetch live repository list from GitHub organization **acmeproducts** using the public GitHub REST API.
- For each repository, retrieve:
  - Name
  - `pushed_at` (as last accessed)
  - Presence of a GitHub Pages site (`has_pages` flag)
  - Default branch README (rendered as HTML)
  - List of top‑level directories/files to infer possible apps (simple heuristic)
- Populate the dashboard UI with this live data, replacing the static `sampleRepos` array.
- Show real “Launch” links (point to the repository’s GitHub Pages URL if available).

**Out‑Scope**
- Deep analysis of app versions (requires custom repo conventions)
- Write‑back configuration changes to the repo (e.g., creating a Pages site)

**Build Gates**
- On a real device, the dashboard loads data from GitHub within 5 seconds.
- All repos display correct last‑push date and Pages status.
- “Launch” button opens the live GitHub Pages URL when `has_pages` is true; otherwise it is disabled.
- Diagnostics panel updates to “Dashboard Live” after successful fetch.

**Backlog (Deferred)**
- OAuth authentication for private repos
- Caching of API responses
- Advanced app version detection and grouping
- Exportable reports (CSV, PDF)

FUTURE IDEAS
- Multi‑page routing with hash‑based navigation
- Localization support
- Accessibility enhancements (ARIA, focus management)
- Integration with external CI/CD APIs
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
- 2026‑10‑10: Added functional dashboard logic with static repo data.
- 2026‑10‑10: Owner asked to implement API fetch for live repo data → added as Release 3 scope.

APPENDIX
- **Authority Order**: This plan (`projects/repo.md`) is the sole authority for the project. All chat history is subordinate to the plan. Any future changes must be recorded here before code modifications.

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-10-10 01:14 | Main | built projects/repo.html | Implemented live GitHub API fetching for repo data and updated the plan to record this step. | eb70202 |
