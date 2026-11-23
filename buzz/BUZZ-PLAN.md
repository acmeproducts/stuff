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

- After 1.1.0: "the lighthouse Beam is unnecessary . I don't really care for the drone attacks, I think the goal is to just get through the levels tasks and log the time and just keep learning to beat your time we will improve the goal setting and so forth as far as being able to fire weapons I can't think of it right now maybe it's at some separate mode where you actually tried to hit targets maybe it could be something cool like you hit the pillar of a pier that's marked with a red x and the pier collapses or a tree and it explodes because it. had hidden explosives"

- After 1.2.0: "add  the palm trees put some unmarked landing sites out on the water that accumulate points but there's no beam even though they are on the map so you can put them out for and make some of the landing pads a different color that allow you to get higher points they also indicate in a large radius around those specific landing pads and entry point to where you're playing now becomes a first person submersible and you can move around underneath the water and go through caves and other obstacles like arches and other items the idea is to actually accumulate points by finding certain articles I'll leave that to your imagination what that is it would be even cooler if you found the equivalent of like a treasure map that successfully would just unlock everything in the game"

- After 1.3.0 (2026-11-23): "I like all your assumptions I'd also like you to incorporate weapons in Target mode both in the air and under the water we've got ourselves a full-fledged game the only thing left on the backlog is to improve the graphics and to also allow some degree of customization that we can talk through in more detail maybe it's a gaussian splat of a photograph for example"

## 2. What the app is (1.4.0)

- **City block.** Procedural, new every run: a 6-level parking structure, a 9-floor office tower with an atrium, a 7-floor hotel with open stair shafts. Skyline continues to the east.
- **Nature (fixed, the same every run).** Mountains to the north (highest peak about 250 m), a park and lake to the west, a beach, surf and open sea to the south with a pier and a lighthouse island. Terrain is one height grid used for both drawing and collision; sea and lake are a wave shader (swell in the vertices, ripples, sun glint, surf bands and a lapping swash line at the beach; swell and surf grow with wind). The world is about 1.5 km across.
- **The Wake.** Flying close to things sets them off; each adds Havoc; quick successions multiply it. Havoc counts only after two seconds outside, or on landing. Nothing chases the plane.
- **Levels.** Twelve tasks (26 car alarms, 22 desks, light 4 floors, a chain of 16, bank 900, three hotel escapes, and so on). The clock starts with the run and stops when the task is done. There is no time limit and no star rating. Each level keeps its best time, a run count and its last eight times; the result screen says how far the run was from the best. Finishing levels unlocks planes (1, 2, 3, 4, 6, 8, 10, 12 levels).
- **Zen.** A switch on the menu and in the quick menu. 60% speed, no Havoc, no damage, no car alarms or paper; only quiet reactions (trees, pigeons, fountain, chimes, lights, elevator doors). The HUD drops the score and Pulse. Levels ignore Zen.
- **Stick direction.** Stick up dives by default (as the owner asked). Switch "Stick up dives" in the quick menu flips it.
- **Speed.** A lever on the right: 35% to 160% of the plane's cruise. Bottom of the lever = engine off.
- **Glide.** Engine off (lever bottom, or the Glide switch). The plane sinks about 0.75 m/s (13:1 in the lab), speed follows the nose angle. Silent: nothing reacts as the plane passes, in the air or parked.
- **Palms.** 22 along the back of the beach and 7 on the lighthouse island: curved trunks in segments, 14 drooping fronds each with a folded, serrated blade.
- **Unmarked sea floats.** Six timber floats 200 to 500 m offshore. No H, no light, no column; shown on the map in cyan (and on the map rim when you are over the sea). +200 on every landing.
- **Dive platforms.** Three violet platforms with a violet column: +1000 the first landing, then +400. Each sits in a 42 m ring of violet buoys; inside the ring a glowing disc on the water is the way down. Touch the water inside the disc, or land on the platform and tap DIVE.
- **Submersible.** First person. The stick steers, the lever is forward speed and its bottom is a dead stop; it neither sinks nor floats, has no air limit and takes no damage. It cannot break the surface, leave deep water or pass through rock. SURFACE returns to the plane, which lifts straight off the water. The map becomes a sonar: walls at your depth, and gold dots for anything still to find.
- **Under water.** The sea floor now drops to 40 m. The Arches (about 18 m): a run of rock arches over kelp, with a small grotto. The Wreck (about 25 m): a holed hull with a cabin, two holds, a deck hatch and a fallen mast. The Deep Caves (40 m): a rock massif with a tunnel network and a hole in its roof. Fish schools, kelp, coral, drifting specks, blue-green haze that darkens with depth, a headlight.
- **Finds.** 18 things, six per site (amphora, anchor, diver's helmet, message in a bottle, stone idol, giant pearl; ship's bell, sextant, lantern, chest of coins, cannon, figurehead; crown, crystal skull, trident, goblet, telescope, black pearl): +300 each. Three treasure-map pieces, one per site: +1000 each, and the third unlocks every plane. Found things are saved and do not come back.
- **Points.** A lifetime total is kept and shown on the menu: banked Havoc, landing bonuses and finds.
- **Target mode.** A red TARGET button on the menu (and "Target mode" in the quick menu) opens a list: Free fire and six ranges. Weapons exist only here; every other mode builds the world without targets, exactly as before.
  - **Weapons.** FIRE sits where PULSE was. One shot per tap; it keeps firing while held. In the air it launches rockets from alternate wings (3 a second, about 90 m/s, 2.5 s of flight). In the submersible it launches torpedoes (16 m/s, 4.5 s). No ammunition count, no damage to yourself.
  - **The sight.** The nearest standing target within about 20° of the nose (28° under water) gets a red square; the shot leans toward it. A small white ring shows where the nose points. Rockets cannot reach sea targets and torpedoes cannot reach air ones.
  - **Targets.** Each carries a red X that always faces you and grows with distance so it can be seen from far off. They are on the map as red X marks, and on its rim when off the map. 40 in all:
    - *Pier Pressure* (air, 7): the pier pillar marked with a red X — hit it and the pier falls section by section, its lamps and landing spot with it; three rigged palms; two stacks of fuel drums on the boardwalk; a fuel barge offshore.
    - *Timber* (air, 7): five park trees with a charge at the foot; fuel drums on the lake dock; a fuel raft on the lake.
    - *Sky High* (air, 8): tethered balloons — three above the roofs, four over the streets, one 72 m above the plaza.
    - *Arch Enemy* (sea, 6): five mines, and the keystone of the great arch, which falls.
    - *Wreck Breaker* (sea, 6): four mines, powder kegs on the stern deck and in the hold under the hatch.
    - *Cave Buster* (sea, 6): three mines outside the Deep Caves, two inside, and a marked rock wall that opens a short cut once hit.
  - **Ranges** are timed like levels: the clock starts with the run, stops when the last target is down, and each range keeps its best time, run count and last eight times. Sea ranges start in the submersible at the site. **Free fire** has every target live and no clock; dive through a disc to hunt under water.
  - **Points.** +250 to +350 for ordinary targets, +500 barge and raft, +600 kegs, +1000 pier, keystone and wall. They go to the lifetime total.
  - A rocket blast also sets off whatever is close by (cars, desks, trees), the way Pulse does. Touching a mine with the sub sets it off. Targets stand again on every new run; nothing destroyed is saved.
- **Landing spots.** Ten fixed spots, each a lit H with a column of light: Plaza, Garage roof deck, Office roof, Hotel roof, Park bandstand, Lake dock, Pier, Lighthouse island, Ridge camp, Summit. Come in under 38 km/h within 2.2 m of the pad to land. First landing +500, later +150; landing banks carried Havoc and restores health. Spots found are saved and listed. With the engine off the plane can also roll to a stop on any ground.
- **Take-off.** Vertical and immediate with every plane: TAKE OFF button, pushing the lever up, or a firm push on the stick.
- **Quick menu.** Double tap the screen (or the pause button). Switches: Zen, Glide, Stick up dives, Sound, Frame counter. Buttons open further modals: Season/time/weather, Planes, Landing spots, Levels; plus Restart and Main menu. Every modal closes with the X in its top right and returns to where it was opened.
- **Saved in local storage** (`buzz.v1`): level times, finds, map pieces, the unlock, lifetime points, landing spots (all three kinds), best bank, plane, stick direction, Zen, lever position, sound, frame counter, season, time, weather.
- 10 planes, hotel escapes by map, season/time/weather, Pulse (a shockwave that sets off everything within 6 m), on-screen frame counter and `?debug=1`.

## 3. Acceptance checks

`buzz/qa/suite.sh` — run before every push. Lab only (headless Chrome, software rendering).

| Check | 1.4.0 |
|---|---|
| Boots to the menu with no page errors | PASS |
| Random flight, 2.5 min in each building, never ends inside a wall | PASS |
| Every hotel escape start has a route outside (18 hotels) | PASS |
| Autopilot flies out of the hotel with the real flight model | PASS (23 of 24 on the release run; 22–24 across runs) |
| No level starts with a collision in the first second | PASS |
| Every modal opens, has its X in the top right, and closes with it (13 cases) | PASS |
| Double tap opens the quick menu without pressing a switch under the finger; single tap does nothing | PASS |
| Speed lever works while steering (two thumbs); lever bottom and Glide switch cut the engine | PASS |
| Levels start, map enlarges, locked plane cannot be picked, times survive a reload, no page errors (sound start included) | PASS |
| Stick up dives by default and the switch flips it | PASS |
| Speed lever 15 / 50 / 100% gives rising speed | PASS (25 / 50 / 86 km/h) |
| Zen: slower, nothing scores, no alarms, no damage; quiet things still react | PASS |
| Glide: sinks slowly, sets nothing off; the same car reacts with the engine on | PASS (13.2:1) |
| Levels are timed: first run sets the time, a faster run becomes the best, a slower one is logged against it, newest first | PASS |
| Finishing a level unlocks a plane; a star from the first release still counts; there is no time limit | PASS |
| All 10 lit landing spots: low and slow lands (+500, then +150), fast does not, take-off lifts clear | PASS |
| Engine-off touchdown on open ground, then vertical take-off, with each of the 10 planes | PASS |
| 7.5 min of random flight over mountains, park and sea never goes under ground or water | PASS |
| Every setting and all progress survive a reload, level times included | PASS |
| All reactions fire; 200 season/time/weather combinations apply | PASS |
| Each of the 12 levels stays open one short of its task and finishes, with a time logged, when the task is met | PASS |
| No drones and no heat exist any more; banking outside works | PASS |
| 29 palms, 6 unmarked floats, 3 violet dive platforms, 3 dive entries, 21 things to find exist | PASS |
| Unmarked floats have no light and pay +200 on every landing; dive platforms pay +1000 then +400 | PASS |
| Every one of the 21 finds can be reached by the sub from its dive entry (flood fill at the sub's size) | PASS |
| Only the glowing disc takes the plane under; the DIVE button on a violet platform also works | PASS |
| Sub: lever bottom is a dead stop; it cannot break the surface or the floor; 6 min of random driving never enters rock | PASS |
| SURFACE returns to the plane and the sky; leaving for the menu from under water also restores it | PASS |
| Finds: only the sub collects them; +300 each, +1000 per map piece, all saved | PASS |
| Three map pieces complete the treasure map and unlock every plane; found things do not come back | PASS |
| Finds, the treasure map, points and sea landings survive a reload; the list shows them | PASS |
| Target mode: the menu button lists free fire and 6 ranges, the modal closes with its X, a range starts with FIRE in place of PULSE, holding FIRE keeps firing | PASS |
| An ordinary run has no targets and no weapons | PASS |
| All 40 targets stand in the open: balloons and mines clear of anything solid, trees on dry land, sea targets under water | PASS |
| Air ranges: each of the 22 targets is destroyed by one rocket from a clear line; each of the 3 ranges ends with a time only when its last target is down | PASS (22 of 22) |
| Hitting the pillar marked with a red X brings the whole pier down, and its landing spot with it | PASS |
| Sea ranges start in the submersible; each of the 18 targets is destroyed by one torpedo from a spot the sub can swim to; each of the 3 ranges ends with a time | PASS (18 of 18) |
| The marked cave wall is rock until it is hit and open water after; touching a mine with the sub sets it off | PASS |
| Free fire has all 40 targets and no clock; the sight picks the target ahead; a retry stands every target up again | PASS |
| 3 min of random flying and shooting, in the air and in the sub: no bad positions, never more than 8 shots alive | PASS |
| Range times are saved apart from the levels, survive a reload and show in the list; no page errors | PASS |
| GPU objects do not grow across 7 rebuilt blocks; knock-down recovers | PASS |

The ten Target-mode checks were written first and failed on 1.3.0 (no TARGET button; the test could not start). Also measured by hand in the lab, not in the suite: the same Target run rebuilt six times holds GPU objects level (47/6/21, 36/6/22, 43/6/25 for a sea range, an air range and free fire); with the sight on a target, shots hit from 15 m to 170 m with the nose up to 18° off.

1.3.0 passed its 32 checks, 1.2.0 passed its 23 checks, 1.1.0 its 20 and 1.0.0 passed its 9 checks (see ledger).

## 4. Not verified (say so, do not assume)

- **1.4.0 has not run on a real phone.** Target mode is new and untested by hand: whether the sight is too forgiving or not forgiving enough, whether FIRE sits well under the right thumb next to the speed lever, how the explosions and the pier collapse look and sound, haptics, and frame rate while shooting are all unknown. In the lab Target mode adds 2 draw calls and at most 8 shots, 110 falling pieces and 6 flashes.
- **1.3.0 never ran on a real phone either, as far as I know.** The owner approved its assumptions ("I like all your assumptions") but reported nothing about how it ran.
- Earlier note, still true: The owner played 1.0.0 ("initially very cool") and gave feedback on 1.1.0 that implies it ran, but no frame-rate figure has come back. Since 1.1.0 the app draws about twice the triangles (334k against 174k in the menu view, 190 draw calls: terrain, water, pines). Frame rate on the S23 Ultra, the water shader on a mobile GPU, touch feel of the lever, double-tap timing, sound, haptics, fullscreen and iPhone Safari are unverified. The lab renders in software at 3–12 fps and says nothing about speed.
- **Under water is judged from lab screenshots only.** How readable the caves are on a phone screen, how the sub feels to steer, and whether the finds are too easy or too hard to spot are unknown.
- **Tuning is a first guess**, not play-tested: point values, sub speed and turn rate, level task sizes, landing speed and height window, glide sink rate, Zen speed, lever range, bonuses. The owner has said goal setting will be improved later.
- Looks were judged from lab screenshots only.
- No log channel exists from the phone back to the repo for this project. The frame counter and `?debug=1` are on screen only.

## 5. Open assumptions (owner can override)

Approved by the owner on 2026-11-23 ("I like all your assumptions"): the 1.3.0 list below, down to "The sea floats are on the map but nameless".

New in 1.4.0, mine to be overridden:

- Target mode is a separate mode with its own button. Weapons do not exist in free roam, levels or Zen.
- Six ranges plus free fire; what the targets are beyond the owner's two examples (pier pillar, rigged tree) is my choice: palms, fuel drums, a barge, a raft, balloons, mines, a keystone, powder kegs, a cave wall.
- Shots lean toward the target in the sight. Unlimited shots, no reload beyond the firing rate, no damage to the plane or sub from your own blasts or from mines.
- Nothing shoots back. No dogfights (G2 stays buried for those).
- Destroyed things are not saved: every run starts with everything standing, the pier included. Range times and points are saved.
- Ranges do not count toward the 12 levels and unlock nothing. All ranges are open from the start.
- Point values are first guesses.
- Zen is ignored in Target mode, as it is in levels.

- The dive entry is a glowing disc on the water inside a ring of buoys around each violet platform. The sub has no air limit and takes no damage.
- What there is to find, and that the treasure map is three pieces (one per site), are my choices; the owner left them open.
- "Unlock everything" means every plane, the only locked things in the game.
- Finds stay found for good; there is no reset.
- The sea floats are on the map but nameless in the list until landed on.
- Zen keeps quiet reactions (leaves, pigeons, chimes, lights) and drops loud ones; landing spots still count in Zen, without points.
- Glide is the bottom of the speed lever rather than a separate mode. With drones gone, "not detectable" now only means nothing reacts as the plane passes.
- Each level's task is the old two-star target. Wall hits, health and knock-downs stay. Pulse stays as a shockwave.
- Havoc score and banking stay in free roam and in the three bank levels.
- The speed lever replaces the Turbo button (top of the lever is the old Turbo speed).
- Landing banks carried Havoc.
- Nature is fixed rather than procedural so landing spots stay in the same places; the city block is still new each run.
- No boats.
- Hotel "stairs" are open shafts; escape missions seal the upper floors; multiplayer later; clean low-poly look.

## 6. Graveyard

Cut with the owner's approval on 2026-11-21 ("if we need to add back … later we can"). Do not bring back without the owner asking.

- G1 Single-room scanned-office scene (the reference game's setting). Replaced by the procedural block.
- G2 Guns, rockets and plane-versus-plane dogfights. Replaced by the Wake, heat and drones. **Partly lifted 2026-11-23 at the owner's request** ("incorporate weapons in Target mode both in the air and under the water"): rockets and torpedoes are back, in Target mode only, against fixed targets. Dogfights and anything that shoots back stay buried.
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

Removed in 1.2.0 at the owner's request:

- G16 Security drones, heat, zaps and the drone hum. Owner: "I don't really care for the drone attacks". Nothing chases the plane now. Do not bring back a pursuer without the owner asking.
- G17 The lighthouse's rotating beam. Owner: "the lighthouse Beam is unnecessary". The lighthouse and its lamp stay.
- G18 Star ratings, per-level countdowns and "out of time". Owner: "get through the levels tasks and log the time and just keep learning to beat your time". Replaced by one task per level, a count-up clock and a time log. Planes unlock by levels finished, not stars.

Replaced in 1.3.0 at the owner's request:

- G19 "No palm trees on the beach" (my 1.1.0 choice). Owner: "add the palm trees".
- G20 The 14 m sea floor. Now drops to 40 m so there is room to dive.

Built in 1.4.0 (was parked as P1 until the owner picked it up on 2026-11-23):

- P1 A separate target mode with weapons. The owner's examples: hit a pier pillar marked with a red X and the pier collapses; a tree that explodes because it had hidden explosives. Both are in the first two ranges.

Backlog, named by the owner on 2026-11-23 as "the only thing left". **To be talked through first; do not build until the owner has discussed it.**

- B1 Improve the graphics.
- B2 "Some degree of customization that we can talk through in more detail maybe it's a gaussian splat of a photograph for example."

Found and fixed while building 1.4.0 (kept here so they are not reintroduced):

- G21 The afterburner line had been swallowed by a comment since 1.2.0: at the top of the speed lever there was no engine glow, no wingtip trails, no change in engine note and no 15% wider turn. Restored to what 1.1.0 did. Nobody had reported it.
- G22 Particles under water were pinned to a height just above sea level, so the sub's bubbles and the sparkle of a find were drawn above the surface where the sub cannot see them. Particles now rest on the real ground or sea floor, and bubbles stop at the surface. This also means leaves and sparks settle on hillsides instead of sinking into them.
- G23 Blocked mine: one Cave Buster mine was first placed inside a rock column. The placement check in the suite caught it; it was moved.

Found and fixed while building 1.1.0 (kept here so they are not reintroduced):

- G13 Opening the quick menu on the second tap let the browser's follow-up click press whatever switch appeared under the finger (Sound turned off in the lab screenshot). The click after a double tap is now swallowed; the suite checks it.
- G14 Double-tap timing measured when the handler ran. A slow frame stretched it past the limit. It now uses the event's own time.
- G15 Parked with the engine off counted as detectable. Engine off is now silent in the air and on the ground.

## 7. Release ledger

- 1.4.0 — 2026-11-23 — Target mode: rockets in the air and torpedoes under water, a sight that picks the target ahead, 40 red-X targets in six timed ranges plus free fire, the pier that collapses, rigged trees and palms, balloons, mines, a keystone, powder kegs and a breakable cave wall. Afterburner restored; under-water particles fixed. Suite 42/42 PASS in the lab. Page 255 KB. Phone unverified.
- 1.3.0 — 2026-11-23 — palms; six unmarked sea floats; three violet dive platforms with dive entries; first-person submersible; arches, wreck and caves under water; 18 finds and a three-piece treasure map that unlocks every plane; lifetime points. Suite 32/32 PASS in the lab. Page 220 KB. Phone unverified.
- 1.2.0 — 2026-11-22 — drones, heat and the lighthouse beam removed; levels are timed tasks with a best time and a log; planes unlock by levels finished. Suite 23/23 PASS in the lab. Page 186 KB. Phone unverified.
- 1.1.0 — 2026-11-21 — Zen, stick-up-dives default, speed lever, glide, ten landing spots with vertical take-off, mountains/park/lake/beach/sea, quick menu and X-closing modals, everything saved. Suite 20/20 PASS in the lab. Page 193 KB. Phone unverified.
- 1.0.0 — 2026-11-21 — first release. Suite 9/9 PASS in the lab. Owner on phone: "initially very cool".
