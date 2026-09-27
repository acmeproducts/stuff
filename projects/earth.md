# Earth — Single-file Babylon.js Earth explorer

## Goal
Build the full walkable, streamed 3D Earth described in the reference README as a single-file mobile-first HTML app (`projects/earth.html`), loading Babylon.js and utilities from runtime CDNs and using public geodata services plus procedural generation. Full scope — no descoping.

## Decisions made this run
- **Owner directive (2026-09-27):** Web access is available; implement the complete feature set in one build, no negotiating scope down.
- **Asset hosting:** Self-contained single HTML file. Babylon.js loads from a runtime CDN (unpkg/jsdelivr). No build step, no local assets.
- **Elevation:** Mapzen/Terrain-RGB style public elevation tiles (Terrarium PNG at the elevation-tiles-prod endpoint), decoded in-app, with procedural heightfield fallback if tiles fail.
- **Land cover:** Procedural biome classification from latitude, elevation, and moisture noise (ocean, beach, grass, forest, rock, snow, desert).
- **Roads & buildings:** OpenStreetMap/Overpass queried at runtime for real road lines and building footprints near the player; procedural city grid + procedural enterable buildings as fallback and beyond Overpass range.
- **Start location:** San Francisco, CA, USA (37.7749°N, 122.4194°W).
- **Mobile controls:** Twin virtual sticks — left stick move/turn, right stick look — plus on-screen buttons for jump, fly toggle, and settings.
- **Diagnostics:** All diagnostics rendered on-screen inside the app (FPS, coordinates, altitude, mode, loaded tile count, data-source status) — never console-only.

## Feature checklist (full scope)
- [ ] Babylon.js scene: sky, sun, fog, dynamic lighting
- [ ] Streamed terrain tiles around player with real elevation + LOD by distance
- [ ] Land cover / biome coloring on terrain
- [ ] Water rendering for oceans and lakes
- [ ] Vegetation: procedural trees and grass scattered by biome
- [ ] Buildings: procedural, enterable, placed along roads; Overpass footprints when available
- [ ] Roads: Overpass ways when available, procedural grid otherwise
- [ ] Weather system: clouds, rain, fog density changes
- [ ] Time-of-day cycle and season system affecting light, colors, vegetation
- [ ] Walk mode with ground collision + fly mode toggle
- [ ] Save/load of position, time, settings to localStorage
- [ ] Mobile twin-stick controls + touch buttons; mouse/keyboard on desktop
- [ ] On-screen diagnostics HUD
- [ ] Settings panel (quality, draw distance, time speed)

## Open work
- Write `projects/earth.html` implementing the entire checklist in one file.
- Test startup in San Francisco; verify walk/fly, tile streaming, Overpass fallback, and mobile controls.
- Tune streaming radius/LOD for smooth performance while keeping the architecture expandable toward the reference 33×33 grid.

## TURN/STAGE LEDGER
| Date | Stage | Notes |
|------|-------|-------|
| 2026-09-27 | Planning | Owner confirmed San Francisco spawn, full scope, mobile controls design. Blocked pending asset listing from `acmeproducts/earth`. |
| 2026-09-27 | Planning | Building self-contained single-file app via public APIs + procedural generation; GitHub repo assets not accessible. |
| 2026-09-27 | Build start | Owner directive: web access available, no descoping. Plan refreshed with full feature checklist (terrain, biomes, vegetation, buildings, roads, weather, seasons, save/load, mobile controls, HUD). Next step: write complete `projects/earth.html`. |