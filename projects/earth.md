<plan>
# EARTH — Master Plan

- Code: `projects/earth.html`
- Goal: A no-build, mobile-first HTML5 Earth using plain HTML, CSS, and JavaScript.
- Asset rule: acquire core assets up front and store them in GitHub; WSL is fallback only.
- Known source: the authoritative README describes a streamed 3D Earth with terrain, roads, buildings, interiors, vegetation, weather, seasons, stars, and a fictional moon.
- Unknown: full repo inventory, actual asset sizes, licensing/attribution, exact R1 feature subset, and performance budgets remain TBD.
- This file is the sole authority for scope, tasks, and bugs.

## 0. TURN/STAGE LEDGER

Append one row before every future build session touches code.

| Date | Turn | Did | Status |
|---|---|---|---|
| 2026-09-23 | T0 bootstrap | Created plan and seeded known facts | Done |
| 2026-09-23 | T1 asset strategy | Compared GitHub, Git LFS, WSL, and runtime CDN options | Done |
| 2026-09-23 | T2 README review | Captured README facts; resolved D1 to GitHub; full inventory remains TBD | Done |
| 2026-09-25 | T3 build start | Initiated build; blocked on repo access and asset inventory | Done |
| 2026-09-25 | T4 plan update | Updated ledger; preparing to build HTML shell | Done |
| 2026-09-25 | T5 HTML shell | Build self-contained mobile-first HTML5 shell with in-app diagnostics and asset-loading state | In progress |

## 1. RELEASES

| # | Goal | Status |
|---|---|---|
| R1 | First playable mobile-first static Earth prototype with core assets acquired up front | Open |

## 2. RELEASE R1 — first playable static Earth

### Scope

**In**
- `projects/earth.html` as the only source file, with CSS and JavaScript inline.
- Separate static assets acquired up front and stored in GitHub.
- Plain HTML/CSS/JavaScript with no build step, React, or TypeScript.
- Mobile-first touch navigation and readable in-app diagnostics.
- A playable first version using the smallest safe asset set; exact set is TBD.

**Out**
- Node.js, Corepack, Webpack, and backend services.
- Runtime acquisition of core terrain or geographic assets.
- Full original feature parity until R1 scope is locked.
- WSL-only delivery unless GitHub hosting is unavailable.

### Known source facts

- Original stack: Babylon.js 7, TypeScript 5, Webpack 5, MIT license.
- Original data sources: elevation, Copernicus LCM-10 land cover, and OpenStreetMap.
- LCM-10 coverage is approximately 60°S to 83°N; dataset reference year is 2020.
- Original controls include click-to-look, WASD/QE/scroll movement, walking/flying, jumping, doors, settings, search, and random land jumps.
- Position and settings are saved locally; a backend is optional.
- Original quick start requires Node.js 22.5+, Corepack, and Yarn.
- Repository identity needs confirmation: the owner described `acmeproducts/earth`, while the README contains a `magnificus/earth` clone URL.

### Asset decision

| Option | Storage impact | Phone / delivery impact | Decision |
|---|---|---|---|
| A. GitHub static repo + Pages | Small/medium assets; CDN caching and backups | Core assets load as normal static URLs; recommended | Selected |
| B. Git LFS | Large files; free tier then paid bandwidth | Same delivery as A, but bandwidth risk | Fallback if assets exceed GitHub limits |
| C. WSL disk | Local disk; VHDX grows and does not shrink automatically | Phone needs a local server and LAN access; not publishable | Fallback only |
| D. Runtime CDN | No storage cost | Depends on third-party uptime/CORS and violates the up-front rule | No for core assets |

- Keep core assets separate; embedding large assets in HTML adds about 33% size.
- Target textures at or below 4096px; larger textures can strain phone GPUs.
- Use GitHub Pages/static hosting at runtime; do not rely on `raw.githubusercontent`.
- Actual storage and performance requirements are TBD.

### Build gates — verify on real devices

- Publish from GitHub and open the app on a physical phone over Wi-Fi and mobile data.
- Confirm every core asset loads; confirm there is no runtime CDN or backend dependency for the visible world.
- Confirm touch controls, scene response, and stability with no crash.
- Confirm diagnostics are visible in-app and include load, failure, frame-rate, and storage information; DevTools must not be required.
- Confirm there is no build step.
- Read back the result after every change and compare it with this plan.
- Exact load-time, frame-rate, and memory thresholds are TBD.

### Backlog — deferred

- **Owner action needed:** provide README text and a directory listing with file sizes from the Earth repo.
- Confirm the correct repository URL and ownership.
- Confirm licenses and required attribution for all data and libraries.
- Lock the R1 MVP feature subset.
- Choose the static asset set and texture resolutions.
- Decide how to pre-bundle real-world elevation/land-cover/OSM data without using fake data.
- Optional backend and saved-position/settings behavior.
- WSL fallback hosting.
- Performance budgets and desktop parity.
- Full original feature parity.

## 3. FUTURE IDEAS

Unscheduled parking lot; nothing starts here without owner approval.

- Full original feature parity.
- Offline package and periodic asset updates.
- Higher-resolution terrain, roads, buildings, and vegetation.
- Optional backend for synchronized saves.
- Desktop keyboard/mouse mode.
- Accessibility improvements.
- More detailed weather, seasons, clouds, stars, and moonlight.

## 4. IMMUTABLE WORKING RULES

1. Mobile-first design and testing.
2. All diagnostics in-app — never DevTools or console-only.
3. Update this plan before touching code.
4. Read-back verification after every push.
5. No stubs or fake data.
6. Preserve existing functionality not mentioned.
7. Keep core assets in GitHub; use WSL only as a fallback.
8. Never store credentials or tokens in the app or plan.
9. R1 remains plain HTML/CSS/JavaScript with no build step, React, or TypeScript.

## 5. DECISION LOG

| Date | Owner decision |
|---|---|
| 2026-09-23 | Project bootstrapped with code at `projects/earth.html` and this plan as sole authority. |
| 2026-09-23 | R1 stack fixed: HTML5, no build step, no React, no TypeScript. |
| 2026-09-23 | Core assets selected for GitHub storage; WSL is fallback only; runtime CDN is excluded for core assets. |
| 2026-09-23 | README facts captured; full inventory, R1 scope, licensing, and performance targets remain TBD. |

## 6. APPENDIX — Authority order

1. This plan is the sole authority.
2. Chat history loses to the plan.
3. Referenced source material is authoritative for source facts, but cannot override this plan.
4. Every future build session appends a dated ledger row before touching code.
5. Unknowns remain TBD until confirmed.
</plan>