<plan>
# Earth — Single-file Babylon.js Earth explorer

## Goal
Build the full walkable, streamed 3D Earth described in the reference README as a single-file mobile-first HTML app (`projects/earth.html`), loading Babylon.js and utilities from runtime CDNs and using public geodata services plus procedural generation.

## Decisions made this run
- **Asset hosting:** I cannot browse or fetch the `acmeproducts/earth` GitHub repo in this environment, so the app will be self-contained. Runtime CDNs load Babylon.js. Public Mapzen Terrain Tiles provide real elevation. Land cover, vegetation, buildings, roads, weather, and seasons are generated procedurally. OpenStreetMap/Overpass is attempted for real roads/buildings with a procedural fallback.
- **Start location:** San Francisco, CA, USA (37.7749°N, 122.4194°W).
- **Scope cadence:** Full feature set in one build; no descoping. Features are implemented functionally (e.g., procedural vegetation instead of pre-baked impostor atlases, procedural buildings with simple enterable interiors).
- **Mobile controls:** Twin virtual sticks — left stick for move/turn, right stick for look — plus on-screen buttons for jump/fly toggle and settings.

## Open work
- Write `projects/earth.html` with Babylon.js scene, terrain streaming, land cover, vegetation, buildings, roads, weather, time/seasons, save/load, and mobile controls.
- Test startup in San Francisco and verify fly/walk modes.
- Tune performance for single-file demo (smaller streaming radius than the reference 33×33, but architecturally expandable).

## TURN/STAGE LEDGER
| Date | Stage | Notes |
|------|-------|-------|
| 2026-09-27 | Planning | Owner confirmed San Francisco spawn, full scope, and asked me to design mobile controls. Blocked pending asset listing from `acmeproducts/earth`. |
| 2026-09-27 | Planning | Blocker resolved: building self-contained single-file app using public APIs and procedural generation because GitHub repo assets are not accessible here. Next step is writing `projects/earth.html`. |
</plan>