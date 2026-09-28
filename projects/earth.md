# Earth — Single-file Babylon.js Earth explorer

## Goal
Build the full walkable, streamed 3D Earth described in the reference README as a single-file mobile-first HTML app (`projects/earth.html`). Babylon.js from runtime CDN; real geodata from public services; procedural generation as fallback everywhere. Full scope — no descoping. Milestones below are a build ORDER, not scope cuts: every feature ships.

## Status correction (2026-09-27)
- Owner directive: previous approach not working — back up, put a correct plan in place, full internet access available.
- Reality: outbound fetches from this build environment have failed repeatedly. Treat internet as guaranteed at APP RUNTIME (the user's browser), not at build time. Therefore: pin exact endpoints, give every external dependency a fallback chain, surface source status on the HUD, and never let one failed service block startup.
- Plan rewritten around verifiable milestones M1–M8 instead of a single big-bang file write.
- 2026-09-28: Owner re-confirmed full scope in scope, web access working.

## SECURITY INCIDENT (2026-09-28) — secret in thread state
- Symptom: writes to `devstream/threads/earth__dev.json` failed twice with GitHub 409 "Secret detected in content", preceded by a 409 write conflict.
- Root cause: the thread-state JSON persists conversation history, and the GitHub personal access token the owner pasted into chat earlier is embedded in that history. The agent never wrote the token into the plan or code artifacts; it entered the thread file via automatic chat-history persistence.
- GitHub push protection / secret scanning is working as intended and is blocking the push. Do NOT bypass it.
- Corrective action (in order):
  1. Scrub the token from `devstream/threads/earth__dev.json` — remove every occurrence of the PAT string, including URL-encoded or escaped copies inside embedded history, then retry the thread write.
  2. Owner: revoke the exposed token on GitHub immediately (it has been transmitted multiple times and must be considered compromised). Generate a fresh one only if ever needed elsewhere — this project needs no GitHub auth (reference repo is public).
  3. Rule going forward: never paste credentials into chat; never write any token/secret into the plan, the code, or any persisted state file. If a secret ever appears in chat again, treat it as compromised and exclude it from all persisted content.

## Reference repo confirmed (2026-09-27, via web search)
- The reference project is public on GitHub as `magnificus/earth` — "A walkable, streamed 3D Earth built with Babylon.js and real-world geographic data." Features match our scope: terrain streaming, roads, buildings, water, vegetation, weather, seasons, stars, a fictional moon, settings, and saves.
- Key data-source detail extracted from its docs: **land cover** comes from **Copernicus LCFM LCM-10 V1 (reference year 2020)**, streamed as native-resolution classification windows from **Terrascope's public TiTiler service** with nearest-neighbour sampling and class-code translation. Sole source, **no API key required**. Adopted as our M4 biome source (see Architecture).
- **2026-09-28 web-search confirmations:**
  - Terrascope STAC catalog endpoint: `https://stac.terrascope.be/collections/lcfm-lcm-10` (developer discovery path for the collection; TiTiler tile-URL template still to be confirmed via search at M4 start, before coding land cover).
  - LCM-10 coverage bounds: **60 S to 83 N** — outside this band, use procedural classification fallback and HUD flag.
  - Reference rendering behavior on missing classification: bare-ground fallback; other service errors remain visible (mirror this: never blank terrain, always show source status).
  - LCM-10 base year is 2020; annual 2021–2025 products (+ LCCM-10 change maps) expected later in 2026 — no action needed, note for future.

## Decisions locked
- **Asset hosting:** Self-contained single HTML file; Babylon.js from CDN with dual-CDN loader (cdn.babylonjs.com → cdn.jsdelivr.net → unpkg). No build step, no local assets.
- **Start location:** San Francisco, CA, USA (37.7749°N, 122.4194°W).
- **Mobile controls:** Twin virtual sticks — left move/turn, right look — plus buttons for jump, fly toggle, settings. WASD + pointer-lock mouse on desktop.
- **Diagnostics:** On-screen HUD only, never console-only: FPS, lat/lon, altitude, mode (walk/fly), loaded tile count, per-service source status (CDN / elevation / land cover / OSM: OK or PROC-fallback).
- **Secrets hygiene:** No tokens or credentials in plan, code, or persisted thread state — ever. Reference repo is public; runtime data services need no keys.

## Architecture (pinned)
- **Coordinates:** Web Mercator tile math; base terrain at zoom 15 (~1.2 km tiles at equator); lat/lon ↔ tile/pixel conversions in-app.
- **Elevation:** Terrarium PNG tiles from the public elevation-tiles-prod S3 endpoint (`/terrarium/{z}/{x}/{y}.png`, CORS-enabled). Decode: `h = R*256 + G + B/256 − 32768` meters. Fallback: seeded fBm noise heightfield so terrain always renders (HUD flags SRC: PROC).
- **Land cover / biomes:** PRIMARY — Copernicus LCFM LCM-10 V1 classification windows via Terrascope public TiTiler (nearest-neighbour, class codes → ocean/beach/grass/forest/rock/snow/desert/cropland/urban), driving vertex colors and vegetation scatter. STAC collection: `https://stac.terrascope.be/collections/lcfm-lcm-10`; coverage 60 S–83 N (outside → fallback). FALLBACK — per-vertex procedural classification from latitude, elevation, moisture noise; bare-ground color when class unknown. HUD flags which source is live.
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
- M4 Biomes + water + vegetation scatter: Terrascope TiTiler land-cover windows (confirm URL template via search first) with procedural classification fallback. Smoke test: SF coastline shows ocean/beach/hills with trees on green biomes; HUD shows land-cover SRC.
- M5 Overpass roads + buildings with procedural fallback; enterable buildings near roads. Smoke test: HUD shows SRC: OSM or PROC; buildings present either way.
- M6 Weather + time-of-day + seasons. Smoke test: cycle time, toggle rain, change season — lighting/palette respond.
- M7 Mobile twin sticks + touch buttons + settings panel (quality, draw distance, time speed) + save/load. Smoke test: reload restores state; sticks work on touch.
- M8 Perf/tuning pass: quality presets scale mesh res, ring radius, vegetation density; verify SF startup end-to-end; log results to ledger.

## Risk register
- CDN blocked → try 3 CDNs in order; if all fail, show on-screen fatal error (never silent).
- Terrarium 404/429/CORS → per-tile fBm fallback; HUD flags PROC; retry on tile re-entry.
- TiTiler unavailable/slow/out-of-coverage (60 S–83 N) → per-tile procedural biome classification; HUD flags PROC; land cover never blocks terrain render.
- Overpass rate-limit → exponential backoff, in-memory cache, procedural grid fallback; HUD flags.
- Imagery CORS/usage policy → optional layer, off by default, failure never blocks terrain.
- Phone perf → quality presets (LOW/MED/HIGH) scale subdivisions, ring radius, vegetation density, particles.
- Build-env fetch failures → irrelevant at runtime; app validates services live in the browser and reports on HUD.
- Credentials in chat → never persist tokens in plan, code, or thread state; scrub any that leak into persisted history before pushing (see SECURITY INCIDENT); treat exposed tokens as compromised.
- Thread-write conflicts (409) → refresh thread state, re-apply, retry once; never force-push over another writer blindly.

## Open work
- Immediate: scrub the PAT from `devstream/threads/earth__dev.json` and retry the blocked thread write; owner revokes the exposed token.
- Next build step: write `projects/earth.html` covering M1+M2 (bootstrap + real-elevation terrain with fallback).
- Then proceed M3→M8 in order, one milestone step per turn, verifying each smoke test and logging to the ledger.
- At M4 start: web-search the exact Terrascope TiTiler tile-URL template for the LCFM LCM-10 V1 collection before coding land cover.
- Final: tune streaming radius/LOD for smooth performance, keeping architecture expandable toward the reference 33×33 grid.

## TURN/STAGE LEDGER
| Date | Stage | Notes |
|------|-------|-------|
| 2026-09-27 | Planning | Owner confirmed San Francisco spawn, full scope, mobile controls design. Blocked pending asset listing from `acmeproducts/earth`. |
| 2026-09-27 | Planning | Building self-contained single-file app via public APIs + procedural generation; GitHub repo assets not accessible. |
| 2026-09-27 | Build start | Owner directive: web access available, no descoping. Plan refreshed with full feature checklist. |
| 2026-09-27 | Plan reset | Owner: prior approach failing — back up, correct plan. Rewritten with pinned endpoints (Terrarium elevation, Overpass, dual-CDN Babylon), fallback chains for every service, milestone build order M1–M8 (sequencing only, no scope cut), risk register. Next: write earth.html covering M1+M2. |
| 2026-09-27 | Plan update | Web search confirmed reference repo as public `magnificus/earth`; pinned its land-cover pipeline (Copernicus LCFM LCM-10 V1 via Terrascope public TiTiler, no key) as M4 primary source with procedural fallback; TiTiler URL template to be searched at M4. Owner-posted GitHub PAT NOT stored — revocation advised; repo is public, app needs no GitHub auth. Next: write earth.html M1+M2. |
| 2026-09-28 | Plan checkpoint | Web search confirmed Terrascope STAC collection `https://stac.terrascope.be/collections/lcfm-lcm-10`, LCM-10 coverage 60 S–83 N, bare-ground fallback behavior, base year 2020 (annual products coming later in 2026). Owner re-confirmed full scope. Plan validated build-ready. Next: write `projects/earth.html` covering M1+M2. |
| 2026-09-28 | Security incident | Thread writes to `devstream/threads/earth__dev.json` blocked twice by GitHub push protection: "Secret detected in content". Root cause: owner-posted GitHub PAT embedded in persisted chat history inside the thread JSON — not written by the agent into plan/code. Directives: scrub all token occurrences from the thread JSON and retry; owner revokes the exposed token; secrets never persisted anywhere going forward. Ledger updated; build remains blocked on the scrub, then proceed to earth.html M1+M2. |