TURN/STAGE LEDGER
| Turn | Date       | Status | Notes                                 |
|------|------------|--------|---------------------------------------|
| 1    | 2026-10-09 | ✅      | Created initial master plan (this file) |
| 2    | 2026-10-09 | ✅      | Added dashboard requirements and next‑step note |
| 3    | 2026-10-10 | ✅      | Added functional dashboard logic with static repo data, dynamic rendering, and a working “Analyze” flow |
| 4    | 2026-10-10 | ✅      | Updated plan to add API fetch implementation step |
| 5    | 2026-10-10 | ✅      | Added handling for missing org and UI for org input |
| 6    | 2026-10-10 | ✅      | Updated code to include org input and improved error messages |

RELEASES
1. **Release 1** – Basic mobile‑first HTML app skeleton with navigation and placeholder content.
2. **Release 2** – Repo dashboard core UI (left rail, right‑side tabs) and in‑app diagnostics.
3. **Release 3** – Live GitHub API integration for fetching real repository data.

### Release 3 – Scope (updated)
**In‑Scope**
- UI element to input a GitHub organization name.
- Retry button to re‑fetch repos after changing the org.
- Graceful error handling when the org does not exist (display friendly message in diagnostics panel).
- All previously defined live‑fetch features.

**Out‑Scope**
- OAuth for private repos.
- Deep version detection.

**Build Gates**
- On a real device, entering a valid org loads data within 5 seconds.
- Invalid org shows clear “Organization not found” message in diagnostics.
- All other Release 3 gates remain unchanged.

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
- 2026‑10‑10: Added handling for missing organization and UI for org input.

APPENDIX
- **Authority Order**: This plan (`projects/repo.md`) is the sole authority for the project. All chat history is subordinate to the plan. Any future changes must be recorded here before code modifications.
