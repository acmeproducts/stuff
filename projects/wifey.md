| Date | Turn | Stage | Status | Note |
|------|------|-------|--------|------|
| 2026-10-16 | 1 | PLAN SEED | DONE | Initial master plan seeded from concept; R1 scoped; no code yet |
| 2026-10-16 | 2 | R1 BUILD | IN-PROGRESS | Writing projects/wifey.html — omnisearch, cards, persistence, diagnostics |

(1) RELEASES
1. **R1: Core Cards** — Omnisearch-driven creation with tags, calendar, URLs, image attachments, local persistence.
2. **R2: TBD** — (Future release placeholder)

(2) R1 SCOPE & GATES
**Scope (In)**
- Single-file HTML app at `projects/wifey.html`
- Omnisearch bar at top (searches existing; creates new if not found)
- Tap-to-open card detail view
- Tags: add/remove/edit per card
- Calendar picker for due dates
- URL attachments (multiple)
- Image attachments (camera/file picker)
- LocalStorage persistence
- Mobile-first responsive UI

**Scope (Out)**
- Backend/server/sync
- Multi-user/collaboration
- Recurring tasks
- Push notifications
- Import/export

**Build Gates** (verify on real devices before marking done)
- [ ] iOS Safari: omnisearch creates card, detail view opens, all fields save
- [ ] Android Chrome: image attach opens camera/file picker and renders thumbnail
- [ ] Offline: data survives browser close/reopen; no data loss on refresh

**Backlog (Deferred)**
- Search filters (tag/date)
- Card reordering/pinning
- Bulk edit/delete
- Dark mode toggle

(3) FUTURE IDEAS
- Voice entry via omnisearch
- Location-based reminders
- Share cards via generated URL
- Subtasks/checklists within cards
- Priority scoring/sorting

(4) IMMUTABLE WORKING RULES
1. **Mobile-first**: Design for phone portrait first, scale up to desktop.
2. **In-app diagnostics**: All debug UI, logs, and test controls live inside the app; never require DevTools console.
3. **Plan-first**: Update `wifey.md` before modifying `wifey.html`.
4. **Read-back**: After every code change, verify on a real device and update ledger status.
5. **No stubs**: No fake data, placeholder logic, or "coming soon" UI; every shipped feature must be functional.

(5) DECISION LOG
- **2026-10-16**: Concept — Card-based task manager; omnisearch doubles as creation entry point.
- **2026-10-16**: Stack — Single-file HTML, vanilla ES6+, no frameworks; LocalStorage for persistence.

(6) APPENDIX
**Authority Order**
1. `projects/wifey.md` (this file) is the sole authority.
2. Chat history may be incomplete; this file supersedes any conflicting conversation memory.
3. Code target is strictly `projects/wifey.html`; if this plan names another file, use TARGET: projects/wifey.html and record the correction here.
