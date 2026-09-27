<plan>
# Earth — Single-file Babylon.js Earth explorer

## Goal
Build the full walkable, streamed 3D Earth described in the reference README as a single-file mobile-first HTML app (`projects/earth.html`), loading assets at runtime from the `acmeproducts/earth` GitHub repo and public geodata services.

## Decisions made this run
- **Asset hosting:** Load directly from `https://raw.githubusercontent.com/acmeproducts/earth/main/assets/...` at runtime; do not mirror locally.
- **Start location:** San Francisco, CA, USA (~37.7749°N, 122.4194°W). Recognizable coast, hills, and urban features.
- **Scope cadence:** Full build in one go as requested; no descoping without explicit owner approval.
- **Mobile controls:** I will design and implement the best simple mobile control scheme (twin virtual sticks: left for move/turn, right for look; plus jump/fly/door buttons) and refine based on testing.

## Blocker
I cannot browse GitHub or fetch URLs in this environment. The `acmeproducts/earth` assets are not in front of me. To proceed I need one of:
1. Paste the `assets/` directory listing (file names and relative paths), or
2. Paste the key asset files you want used (small ones) and list the larger ones, or
3. Confirm you want me to ignore that repo and build a self-contained prototype using only public APIs (Mapzen terrain, Terrascope LCM-10, OSM Overpass) — this would be a different asset strategy.

## Open work
- Obtain asset listing / files from `acmeproducts/earth`
- Set up single-file Babylon.js app shell with mobile controls
- Implement terrain streaming, land cover, vegetation, buildings, weather, time/seasons, save/load
- California default spawn and saved position

## TURN/STAGE LEDGER
| Date | Stage | Notes |
|------|-------|-------|
| 2026-09-27 | Planning | Owner confirmed runtime CDN loading, San Francisco spawn, full scope, and asked me to design mobile controls. Blocked pending asset listing/files from `acmeproducts/earth`. |
</plan>