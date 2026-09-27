# Earth — Single-file Babylon.js Earth explorer

## Goal
Build the full walkable, streamed 3D Earth described in the reference README as a single-file mobile-first HTML app (`projects/earth.html`). Babylon.js from runtime CDN; real geodata from public services; procedural generation as fallback everywhere. Full scope — no descoping. Milestones below are a build ORDER, not scope cuts: every feature ships.

## Status correction (2026-09-27)
- Owner directive: previous approach not working — back up, put a correct plan in place, full internet access available.
- Reality: outbound fetches from this build environment have failed repeatedly. Treat internet as guaranteed at APP RUNTIME (the user's browser), not at build time. Therefore: pin exact endpoints, give every external dependency a fallback chain, surface source status on the HUD, and never let one failed service block startup.
- Plan rewritten around verifiable milestones M1–M8 instead of a single big-bang file write.

## Decisions locked
- **Asset hosting:** Self-contained single HTML file; Babylon.js from CDN with dual-CDN loader (cdn.babylonjs.com → cdn.jsdelivr.net → unpkg). No build step, no local assets.
- **Start location:** San Francisco, CA, USA (37.7749°N, 122.4194°W).
- **Mobile controls:** Twin virtual sticks — left move/turn, right look — plus buttons for jump, fly toggle, settings. WASD + pointer-lock mouse on desktop.
- **Diagnostics:** On-screen HUD only, never console-only: FPS, lat/lon, altitude, mode (walk/fly), loaded tile count, per-service source status (CDN / elevation / OSM: OK or PROC-fallback).

## Architecture (pinned)
- **Coordinates:** Web Mercator tile math; base terrain at zoom 15 (~1.2 km tiles at equator); lat/lon ↔ tile/pixel conversions in-app.
- **Elevation:** Terrarium PNG tiles from the public elevation-tiles-prod S3 endpoint (`/terrarium/{z}/{x}/{y}.png`, CORS-enabled). Decode: `h = R*256 + G + B/256 − 32768` meters. Fallback: seeded fBm noise heightfield so terrain always renders (HUD flags SRC: PROC).
- **Land cover / biomes:** Per-vertex classification from latitude, elevation, moisture noise → ocean, beach, grass, forest, rock, snow, desert; drives vertex colors and vegetation scatter.
- **Water:** Sea-level (0 m) animated water plane per tile; lakes where elevation ≈ flat below threshold.
- **Roads & buildings:** Overpass API (overpass-api.de primary, kumi.systems mirror) bbox queries around player, debounced, cached; roads as terrain-conforming ribbons, building footprints extruded to boxes. Fallback + beyond range: procedural street grid and procedural enterable buildings along roads.
- **Streaming:** Ring of tiles centered on player (start 5×5, quality-scalable), LOD by distance (mesh subdivisions 96/48/24), skirt geometry to hide seams, tile cache + unload outside radius; architecture expandable toward the reference 33×33 grid.
- **Vegetation:** Instanced meshes (thin instances) for trees/grass scattered per biome, density scaled by quality preset.
- **Weather/time:** Cloud billboards, rain particle system, fog density control; time-of-day cycle drives sun/fog/light; season system shifts palette and vegetation colors.
- **Persistence:** localStorage save/load of position, time-of-day, season, quality settings.
- **Optional imagery overlay:** Toggleable OSM-standard-tile texture layer, OFF by default (tile-usage policy); never blocks terrain.

## Milestones (each independently verifiable)
- M1 Bootstrap: dual-CDN Babylon loader, sky/sun/fog, ground plane, walk+fly camera, HUD skeleton, on-screen error trap. Smoke test: scene loads, HUD shows FPS/mode.
- M2 Terrain core: Mercator math, one z15 tile mesh, Terrarium fetch+decode with fBm fallback, spawn in SF on real elevation. Smoke test: HUD shows SRC: TERR or PROC.
- M3 Streaming ring + LOD + tile unload/cache + skirts. Smoke test: walk across tile boundary, count changes, no seams/crashes.
- M4 Biomes + water + vegetation scatter. Smoke test: SF coastline shows ocean/beach/hills with trees on green biomes.
- M5 Overpass roads + buildings with procedural fallback; enterable buildings near roads. Smoke test: HUD shows SRC: OSM or PROC; buildings present either way.
- M6 Weather + time-of-day + seasons. Smoke test: cycle time, toggle rain, change season — lighting/palette respond.
- M7 Mobile twin sticks + touch buttons + settings panel (quality, draw distance, time speed) + save/load. Smoke test: reload restores state; sticks work on touch.
- M8 Perf/tuning pass: quality presets scale mesh res, ring radius, vegetation density; verify SF startup end-to-end; log results to ledger.

## Risk register
- CDN blocked → try 3 CDNs in order; if all fail, show on-screen fatal error (never silent).
- Terrarium 404/429/CORS → per-tile fBm fallback; HUD flags PROC; retry on tile re-entry.
- Overpass rate-limit → exponential backoff, in-memory cache, procedural grid fallback; HUD flags.
- Imagery CORS/usage policy → optional layer, off by default, failure never blocks terrain.
- Phone perf → quality presets (LOW/MED/HIGH) scale subdivisions, ring radius, vegetation density, particles.
- Build-env fetch failures → irrelevant at runtime; app validates services live in the browser and reports on HUD.

## Open work
- Next: write `projects/earth.html` covering M1+M2 (bootstrap + real-elevation terrain with fallback).
- Then proceed M3→M8 in order, one milestone step per turn, verifying each smoke test and logging to the ledger.
- Final: tune streaming radius/LOD for smooth performance, keeping architecture expandable toward the reference 33×33 grid.

## TURN/STAGE LEDGER
| Date | Stage | Notes |
|------|-------|-------|
| 2026-09-27 | Planning | Owner confirmed San Francisco spawn, full scope, mobile controls design. Blocked pending asset listing from `acmeproducts/earth`. |
| 2026-09-27 | Planning | Building self-contained single-file app via public APIs + procedural generation; GitHub repo assets not accessible. |
| 2026-09-27 | Build start | Owner directive: web access available, no descoping. Plan refreshed with full feature checklist. |
| 2026-09-27 | Plan reset | Owner: prior approach failing — back up, correct plan. Rewritten with pinned endpoints (Terrarium elevation, Overpass, dual-CDN Babylon), fallback chains for every service, milestone build order M1–M8 (sequencing only, no scope cut), risk register. Next: write earth.html covering M1+M2. |