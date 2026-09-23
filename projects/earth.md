# EARTH — Master Plan

- Code: projects/earth.html — single-file, mobile-first HTML app
- Goal: HTML5 version of repo `Earth` (user: acmeproducts) — no build step, no React, no TypeScript; all assets acquired up front
- Feature scope: TBD (need repo file list/README from owner)
- This file: sole authority for plan, tasks, bugs

---

## 0. TURN/STAGE LEDGER

| Date | Turn | Did | Status |
|---|---|---|---|
| 2026-09-23 | T0 bootstrap | Created plan; seeded known facts; all else TBD | Done |
| 2026-09-23 | T1 asset strategy | Captured D1 asset-storage options + implications; decision pending | Open |

---

## 1. RELEASES

| # | Goal | Status |
|---|---|---|
| R1 | First working HTML5 version, no build step (scope TBD) | Open |

---

## 2. RELEASE R1 — name TBD

**Scope**
- In: plain HTML/CSS/JS in one file; assets stored up front (where = D1); feature set TBD
- Out: React, TypeScript, any build step

**Build gates** (verify on a real phone)
- Loads in a mobile browser with no errors
- All diagnostics visible in-app
- All assets load over the chosen host (D1) on phone Wi-Fi and mobile data
- More gates TBD once scope is set

**Backlog (deferred)**
- —

### Open decision D1 — where the assets live

| Option | Storage impact | Performance / phone impact |
|---|---|---|
| A. GitHub repo (plain) | Files <50MB each (100MB hard block); repo happiest <1GB | Serves via GitHub Pages or jsDelivr = CDN-fast on phones; phone test = open a link; versioned + backed up |
| B. Git LFS | For 50MB+ files; free tier ~1GB storage + 1GB/mo bandwidth, then paid | Same delivery as A, but free bandwidth is easy to burn through |
| C. WSL disk | Local disk only; vhdx grows and never shrinks on its own | Fastest possible on your PC, but the phone needs a local server + LAN IP to see it; no backup; can't publish |
| D. Public CDN at runtime | ~Zero storage anywhere | Depends on someone else's uptime + CORS; breaks "assets up front" for core files; acceptable for libraries only |

**D1 notes**
- Typical Earth/globe assets (day map, night lights, clouds/specular textures + one 3D library) ≈ 5–30MB total at 2K–4K → fits Option A comfortably.
- Keep textures ≤4096px — many phone GPUs choke above that, regardless of where files are stored.
- Don't base64 big assets into the single HTML (+33% size); keep them as separate referenced files.
- raw.githubusercontent is rate-limited — fine for dev, not for serving the app to phones.
- Current lean: Option A for everything; revisit only if a single file tops ~25–50MB.
- To finalize D1 + R1 scope: owner to paste the repo's file list or README so we know real asset sizes.

---

## 3. FUTURE IDEAS

- — (parking lot, unscheduled)

---

## 4. IMMUTABLE WORKING RULES

1. Mobile-first: design and test for phones first.
2. All diagnostics in-app — never DevTools/console-only.
3. Update this plan before touching code.
4. Read-back verification after every push.
5. No stubs, no fake data — it works or it isn't shown.

---

## 5. DECISION LOG

| Date | Decision |
|---|---|
| 2026-09-23 | Project bootstrapped: code = projects/earth.html (single-file mobile-first HTML app); this plan is sole authority. |
| 2026-09-23 | Stack fixed by owner: HTML5 port of acmeproducts/Earth; no build step, no React, no TypeScript; assets acquired up front. Asset storage location = D1, pending. |

---

## 6. APPENDIX — Authority order

1. This plan (projects/earth.md) is the sole authority.
2. Chat history loses to the plan — always.
3. Every build session: read this plan first; append a ledger row before touching code.