# Buzz — plan, acceptance, record, graveyard

Live: https://acmeproducts.github.io/stuff/buzz/
Diagnostics on screen: https://acmeproducts.github.io/stuff/buzz/?debug=1
Deliverable: `buzz/index.html` (single file; three.js 0.163.0 from jsDelivr, the same build `fly.html` uses).
Paths owned by this project: `buzz/` only.

## 1. What the owner asked for (owner's words)

- 2026-11-21: "Create 3js app in my repo https://tiny-squadron.onrender.com/" — the link is another builder's toy-plane game, shared as the reference, with a screen recording.
- "I want to discuss before by your plan propose scope but not limited for reducing effort if there are changes it is to replace with less friction and more engagement"
- "I want to fly through multi story structures including parking structures office building hotels and the hotel is to use the map to get outside, the environment is procedural and can be tailored to Season, tod, weather. No rings that's lame and usual we need something more novel"
- "Cool let's Rock this if we need to add back single-room scene, guns, dogfights and the appliance boss or equivalent later we can" — approval of the scope proposed in chat (the Wake mechanic, three buildings, name "Buzz", `acmeproducts/stuff`).
- After playing 1.0.0 on the phone: "initially very cool..I need a Zen mode that is flying at a slower speed and there's no game play . down should go up and up should go down this needs to be configurable also how to control speed? there needs to be some nature scenes like mountains parks ocean waves and beaches there also needs to be bonus for landing at predetermined spots, take off can still be vtol and immediate no matter which plane. also need a glider mode that is not detecrable as a way to make it across large stretches....I think double tap could open a quick modal that includes switches and opens additional modals as needed. all modals close with x in top right. all settings and progress persist in local storage"

## 2. What the app is (1.1.0)

- **City block.** Procedural, new every run: a 6-level parking structure, a 9-floor office tower with an atrium, a 7-floor hotel with open stair shafts. Skyline continues to the east.
- **Nature (fixed, the same every run).** Mountains to the north (highest peak about 250 m), a park and lake to the west, a beach, surf and open sea to the south with a pier and a lighthouse island. Terrain is one height grid used for both drawing and collision; sea and lake are a wave shader (swell in the vertices, ripples, sun glint, surf bands and a lapping swash line at the beach; swell and surf grow with wind). The world is about 1.5 km across.
- **The Wake.** Flying close to things sets them off; each adds Havoc; quick successions multiply it. Heat brings drones that follow the trail you flew. Havoc counts only after two seconds outside, or on landing.
- **Zen.** A switch on the menu and in the quick menu. 60% speed, no Havoc, no heat, no drones, no damage, no car alarms or paper; only quiet reactions (trees, pigeons, fountain, chimes, lights, elevator doors). The HUD drops the score, heat and Pulse. Missions ignore Zen.
- **Stick direction.** Stick up dives by default (as the owner asked). Switch "Stick up dives" in the quick menu flips it.
- **Speed.** A lever on the right: 35% to 160% of the plane's cruise. Bottom of the lever = engine off.
- **Glide.** Engine off (lever bottom, or the Glide switch). The plane sinks about 0.75 m/s (13:1 in the lab), speed follows the nose angle. Silent: no trail is recorded, nothing reacts, drones hold where they are and give up after 7 s. Also silent when parked with the engine off.
- **Landing spots.** Ten fixed spots, each a lit H with a column of light: Plaza, Garage roof deck, Office roof, Hotel roof, Park bandstand, Lake dock, Pier, Lighthouse island, Ridge camp, Summit. Come in under 38 km/h within 2.2 m of the pad to land. First landing +500, later +150; landing banks carried Havoc and restores health. Spots found are saved and listed. With the engine off the plane can also roll to a stop on any ground.
- **Take-off.** Vertical and immediate with every plane: TAKE OFF button, pushing the lever up, or a firm push on the stick.
- **Quick menu.** Double tap the screen (or the pause button). Switches: Zen, Glide, Stick up dives, Sound, Frame counter. Buttons open further modals: Season/time/weather, Planes, Landing spots, Missions; plus Restart and Main menu. Every modal closes with the X in its top right and returns to where it was opened.
- **Saved in local storage** (`buzz.v1`): stars, landing spots, best bank, plane, stick direction, Zen, lever position, sound, frame counter, season, time, weather.
- 12 missions, 36 stars, 10 planes, hotel escapes by map, season/time/weather, on-screen frame counter and `?debug=1` as in 1.0.0.

## 3. Acceptance checks

`buzz/qa/suite.sh` — run before every push. Lab only (headless Chrome, software rendering).

| Check | 1.1.0 |
|---|---|
| Boots to the menu with no page errors | PASS |
| Random flight, 2.5 min in each building, never ends inside a wall | PASS |
| Every hotel escape start has a route outside (18 hotels) | PASS |
| Autopilot flies out of the hotel with the real flight model | PASS (24 of 24 on the release run; 22–24 across runs) |
| No mission starts with a collision in the first second | PASS |
| Every modal opens, has its X in the top right, and closes with it (13 cases) | PASS |
| Double tap opens the quick menu without pressing a switch under the finger; single tap does nothing | PASS |
| Speed lever works while steering (two thumbs); lever bottom and Glide switch cut the engine | PASS |
| Missions start, map enlarges, locked plane cannot be picked, stars survive a reload | PASS |
| Stick up dives by default and the switch flips it | PASS |
| Speed lever 15 / 50 / 100% gives rising speed | PASS (25 / 50 / 86 km/h) |
| Zen: slower, nothing scores, no alarms, no drones, no damage; quiet things still react | PASS (30 km/h cruise) |
| Glide: sinks slowly, leaves no trail, sets nothing off, drones hold then give up | PASS (13.2:1; 1.9 km from 250 m) |
| All 10 landing spots: low and slow lands (+500, then +150), fast does not, take-off lifts clear | PASS |
| Engine-off touchdown on open ground, then vertical take-off, with each of the 10 planes | PASS |
| 7.5 min of random flight over mountains, park and sea never goes under ground or water | PASS |
| Every setting and all progress survive a reload | PASS |
| All reactions fire; 200 season/time/weather combinations apply; all 12 missions finish | PASS |
| Drones appear with heat; banking outside works | PASS |
| GPU objects do not grow across 7 rebuilt blocks; knock-down recovers | PASS |

1.0.0 passed its 9 checks (see ledger).

## 4. Not verified (say so, do not assume)

- **1.1.0 has not run on a real phone.** The owner played 1.0.0 on a phone and called it "initially very cool"; no frame-rate figure came back. 1.1.0 draws about twice the triangles (334k against 174k in the menu view, 190 draw calls: terrain, water, pines). Frame rate on the S23 Ultra, the water shader on a mobile GPU, touch feel of the lever, double-tap timing, sound, haptics, fullscreen and iPhone Safari are unverified. The lab renders in software at 3–12 fps and says nothing about speed.
- **Tuning is a first guess**, not play-tested: landing speed and height window, glide sink rate, Zen speed, lever range, bonuses, star thresholds, heat, drone speed.
- Looks were judged from lab screenshots only.
- No log channel exists from the phone back to the repo for this project. The frame counter and `?debug=1` are on screen only.

## 5. Open assumptions (owner can override)

- Zen keeps quiet reactions (leaves, pigeons, chimes, lights) and drops loud ones; landing spots still count in Zen, without points.
- Glide is the bottom of the speed lever rather than a separate mode; "not detectable" means drones cannot track and nothing reacts.
- The speed lever replaces the Turbo button (top of the lever is the old Turbo speed).
- Landing banks carried Havoc.
- Nature is fixed rather than procedural so landing spots stay in the same places; the city block is still new each run.
- No palm trees or boats on the beach.
- Hotel "stairs" are open shafts; escape missions seal the upper floors; multiplayer later; clean low-poly look.

## 6. Graveyard

Cut with the owner's approval on 2026-11-21 ("if we need to add back … later we can"). Do not bring back without the owner asking.

- G1 Single-room scanned-office scene (the reference game's setting). Replaced by the procedural block.
- G2 Guns, rockets and plane-versus-plane dogfights. Replaced by the Wake, heat and drones.
- G3 Appliance boss (the reference's 3D printer).
- G4 Rings to fly through. Rejected by the owner: "lame and usual".
- G5 Brake and Look buttons, and "hold Turbo to take off".
- G6 Hotel stairwells with a half-landing per floor and 1.2 m doors. The autopilot got stuck; replaced by open shafts with four 2.2 m doorways per floor.

Replaced in 1.1.0 by what the owner asked for:

- G7 Stick up = climb as the default. Owner: "down should go up and up should go down". Now the default is stick up = dive; still switchable.
- G8 Turbo hold-button. Replaced by the speed lever ("how to control speed?").
- G9 Pause screen with a Resume button, and Back buttons on every screen. Replaced by the quick menu and X-closing modals ("all modals close with x in top right").
- G10 Season/time/weather chips directly on the menu. Moved into their own modal.
- G11 Skyline on all four sides of the block and the 150 m world edge. Replaced by mountains, park and sea; skyline kept to the east.
- G12 Flat green ground plane. Replaced by the terrain grid.

Found and fixed while building 1.1.0 (kept here so they are not reintroduced):

- G13 Opening the quick menu on the second tap let the browser's follow-up click press whatever switch appeared under the finger (Sound turned off in the lab screenshot). The click after a double tap is now swallowed; the suite checks it.
- G14 Double-tap timing measured when the handler ran. A slow frame stretched it past the limit. It now uses the event's own time.
- G15 Parked with the engine off counted as detectable. Engine off is now silent in the air and on the ground.

## 7. Release ledger

- 1.1.0 — 2026-11-21 — Zen, stick-up-dives default, speed lever, glide, ten landing spots with vertical take-off, mountains/park/lake/beach/sea, quick menu and X-closing modals, everything saved. Suite 20/20 PASS in the lab. Page 193 KB. Phone unverified.
- 1.0.0 — 2026-11-21 — first release. Suite 9/9 PASS in the lab. Owner on phone: "initially very cool".
