# Buzz — plan, acceptance, record, graveyard

Live: https://acmeproducts.github.io/stuff/buzz/
Diagnostics on screen: https://acmeproducts.github.io/stuff/buzz/?debug=1
Deliverable: `buzz/index.html` (single file; three.js 0.163.0 from jsDelivr, the same build `fly.html` uses).
Paths owned by this project: `buzz/` only.

## 1. What the owner asked for (owner's words)

- 2026-11-21: "Create 3js app in my repo https://tiny-squadron.onrender.com/" — the link is another builder's toy-plane game, shared as the reference, with a screen recording.
- "I want to discuss before by your plan propose scope but not limited for reducing effort if there are changes it is to replace with less friction and more engagement"
- "I want to fly through multi story structures including parking structures office building hotels and the hotel is to use the map to get outside, the environment is procedural and can be tailored to Season, tod, weather. No rings that's lame and usual we need something more novel"
- "Cool let's Rock this if we need to add back single-room scene, guns, dogfights and the appliance boss or equivalent later we can" — approval of the scope proposed in chat (the Wake mechanic, three buildings, stick + Turbo + Pulse, name "Buzz", `acmeproducts/stuff`).

## 2. What 1.0.0 is

- **Block.** One procedural city block, new every run: a 6-level parking structure (stacked ramps, open sides, moving cars, barriers), a 9-floor office tower (atrium open to the sky, two elevator shafts, glass facade with open bays), a 7-floor hotel (two corridors, rooms, two open stair shafts, double-height lobby, restaurant), plaza, ring road, skyline.
- **The Wake (replaces rings).** Flying close to things sets them off: car alarms that chain along a row, paper off desks, screens, vending machines, server racks, towel carts, trays, bells, elevator doors that open, atrium chimes, chandelier, barriers, cones, fountain, pigeons, trees. Each adds Havoc; quick successions multiply it.
- **Heat and banking.** Unbanked Havoc raises heat; heat brings security drones that follow the trail you flew. Havoc only counts after about two seconds back outside. A drone zap takes 10% of unbanked Havoc. Getting knocked down loses all of it.
- **Lit floors.** A floor lights once enough of it has been buzzed, and stays lit; visible from outside at night.
- **Hotel escape.** Three missions start deep inside a hotel whose upper floors are sealed. The map (a slice of the building at the plane's height, heading-up; tap to enlarge, time slows to 30%) shows walls, closed doors in orange, shafts in blue, exits in green.
- **Season, time of day, weather.** Auto from the phone's date and clock, or set by hand: 4 seasons, dawn/day/dusk/night, clear/cloudy/rain/storm/fog/snow/windy. Auto weather is a seeded pick per season, not a forecast. Changes apply without rebuilding the block.
- **Controls.** Drag anywhere to steer (stick appears under the thumb), hold Turbo, tap Pulse (knocks out drones within 11 m and sets off everything within 6 m). Indoors the plane slows and turns tighter in a hard turn. Hitting a wall slides the plane along it; only hard hits cost health.
- **12 missions, 36 stars, 10 planes** unlocked by stars (2 free). Progress is saved in the browser.
- **On-screen diagnostics.** Frame counter (fps, worst frame, render scale) on by default; `?debug=1` adds draw calls, triangles, counts and position. Errors are shown on screen. Resolution scale adapts between 0.8x and 2x to hold frame rate.

## 3. Acceptance checks

`buzz/qa/suite.sh` — run before every push. Lab only (headless Chrome, software rendering).

| Check | 1.0.0 result |
|---|---|
| Boots to the menu with no page errors | PASS |
| Random flight, 2.5 simulated minutes in each building, never ends inside a wall | PASS (0 of 36,000 frames) |
| Every hotel escape start has a route outside (flood fill, 18 generated hotels) | PASS |
| Autopilot flies out of the hotel using the real flight model | PASS (23 of 24; 5–17 s; 0 damaging hits) |
| No mission starts with a collision in the first second (12 missions × 6) | PASS |
| Touch UI: menu, missions, stick and Turbo held together, map, pause, hangar, result, stars saved across reload | PASS |
| All 20 reaction types fire; 200 season/time/weather combinations apply; all 12 missions reach a result | PASS |
| Drones appear with heat; banking outside works; knock-down recovers | PASS |
| GPU objects do not grow across 7 rebuilt blocks | PASS (37 geometries / 5 textures / 16 programs, flat) |

Measured in the lab: game logic 0.03 ms per frame; about 12,500 instanced boxes, 6,400 colliders, 1,100 reactive objects; 140–250 draw calls; 174k triangles; block generation 13–33 ms; page 155 KB (48 KB gzipped).

## 4. Not verified (say so, do not assume)

- **Nothing has run on a real phone yet.** Frame rate on the S23 Ultra, touch feel, sound, haptics, fullscreen and iPhone Safari are all unverified. The lab renders in software at 3–12 fps, so it says nothing about speed.
- **Tuning is a first guess**, not play-tested by a person: star thresholds, escape times (the autopilot needs 5–17 s; a person reading the map will need more), heat thresholds, drone speed, turn rates, Havoc values.
- No log channel exists from the phone back to the repo for this project. The frame counter and `?debug=1` are on screen only.

## 5. Open assumptions (owner can override)

- Name "Buzz", folder `buzz/` in `acmeproducts/stuff`.
- Stick up = climb by default (the reference game defaults to stick up = dive). Switch in Pause.
- The hotel's "stairs" are open shafts with no steps or landings, so a plane can fly them.
- Escape missions seal the upper floors (no open balconies, end windows or roof), so the way out is always at ground level. Free roam keeps those open.
- Multiplayer is a later release (phone to phone by room code).
- Look: clean low-poly architectural model, not photoreal.

## 6. Graveyard

Cut with the owner's approval on 2026-11-21 ("if we need to add back … later we can"). Do not bring back without the owner asking.

- G1 Single-room scanned-office scene (the reference game's setting). Replaced by the procedural block.
- G2 Guns, rockets and plane-versus-plane dogfights. Replaced by the Wake, heat and drones.
- G3 Appliance boss (the reference's 3D printer). No boss in 1.0.0.
- G4 Rings to fly through. Rejected by the owner: "lame and usual".
- G5 Brake and Look buttons, and "hold Turbo to take off". Removed to cut friction; indoor auto-slowing in turns stands in for Brake.
- G6 Hotel stairwells with a half-landing per floor and 1.2 m doors (first build, same day). The autopilot got stuck at the shaft bottom; replaced by open 8 × 3.7 m shafts with four 2.2 m doorways per floor.

## 7. Release ledger

- 1.0.0 — 2026-11-21 — first release. Suite 9/9 PASS in the lab; device unverified.
