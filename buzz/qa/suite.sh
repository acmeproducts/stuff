#!/bin/bash
# Buzz gate: run before every push. Prints one PASS/FAIL line per check and exits non-zero on any FAIL.
# Lab only: software rendering in headless Chrome. It proves logic and layout, not frame rate or feel on a phone.
cd "$(dirname "$0")"
fail=0
check() { if [ "$2" = "ok" ]; then echo "PASS  $1"; else echo "FAIL  $1  ($3)"; fail=1; fi; }
has() { echo "$out" | grep -qF -- "$1"; }

out=$(timeout 150 node t_boot.mjs 2>&1)
has '"state":"menu"' && ! has pageerror && r=ok || r=no
check "boots to the menu with no page errors" $r "$(echo "$out" | tail -2 | tr '\n' ' ')"

out=$(timeout 280 node t_logic.mjs 2>&1)
bad=$(echo "$out" | grep -c '"bad": [1-9]\|"nan": [1-9]')
[ "$bad" = "0" ] && has 'errors: none' && r=ok || r=no
check "random flight for 2.5 min in each building never ends inside a wall" $r "$bad bad runs"
none=$(echo "$out" | grep -c '"dist": null')
[ "$none" = "0" ] && r=ok || r=no
check "every hotel escape start has a route to the outside (flood fill, 18 hotels)" $r "$none without a route"

out=$(timeout 290 node t_bot.mjs 2>&1)
okc=$(echo "$out" | grep -o '[0-9]*s/[0-9]*hit' | wc -l); failc=$(echo "$out" | grep -o 'FAIL\|NOPATH' | wc -l)
[ "$okc" -ge 21 ] && r=ok || r=no
check "autopilot flies out of the hotel with the real flight model ($okc of $((okc + failc)))" $r "needs 21 of 24"
echo "$out" | grep 'bad starts' | grep -qv ':[1-9]' && r=ok || r=no
check "no mission starts with a collision in the first second" $r "$(echo "$out" | grep 'bad starts')"

out=$(timeout 290 node t_ui.mjs 2>&1)
r=ok; miss=""
for w in 'menu missions: opened=true xTopRight=true closed=true' 'menu hangar: opened=true xTopRight=true closed=true' 'menu spots: opened=true xTopRight=true closed=true' 'menu envm: opened=true xTopRight=true closed=true' 'menu quick: opened=true xTopRight=true closed=true' \
  'quick envm: opened=true xTopRight=true back=quick' 'quick hangar: opened=true xTopRight=true back=quick' 'quick spots: opened=true xTopRight=true back=quick' 'quick missions: opened=true xTopRight=true back=quick' \
  'brief X back to missions' 'quick X -> play' 'result X -> menu' 'brief X -> menu'; do has "$w" || { r=no; miss="$w"; }; done
check "every modal opens, has its X in the top right, and closes with it (13 cases)" $r "missing: $miss"
has 'single tap -> play' && has 'double tap -> quick ; switches untouched=true' && has 'pause button -> quick' && r=ok || r=no
check "double tap opens the quick menu without pressing a switch under the finger; single tap does nothing" $r "$(echo "$out" | grep 'tap ->' | tr '\n' ' ')"
has 'lever while steering thr=0.8' && has 'lever bottom glide=true saved=0' && has 'after all up x=0' && has 'glide switch thr=0' && has 'glide off thr=0.50' && r=ok || r=no
check "speed lever works while steering (two thumbs); bottom of the lever and the Glide switch both cut the engine" $r "$(echo "$out" | grep 'lever\|glide' | tr '\n' ' ')"
has 'start -> play' && has 'map big true' && has 'locked plane not taken: plane 1' && has 'result -> result timed true' && has 'after reload runs 2 menu 1 / 12 done' && has 'errors: none' && r=ok || r=no
check "levels start, map enlarges, locked plane cannot be picked, times survive a reload, no page errors (sound start included)" $r ""

out=$(timeout 290 node t_new.mjs 2>&1)
has 'fresh defaults: upDives=true' && has 'dives by default (pitch -1.' && has 'climbs when switched (pitch 1.' && r=ok || r=no
check "stick up dives by default and the switch flips it" $r "$(echo "$out" | grep 'stick up')"
sp=$(echo "$out" | grep 'lever 15' | grep -o '[0-9]* / [0-9]* / [0-9]*'); a=$(echo $sp | cut -d/ -f1); b=$(echo $sp | cut -d/ -f2); c=$(echo $sp | cut -d/ -f3)
[ -n "$a" ] && [ $a -lt $b ] && [ $b -lt $c ] && r=ok || r=no
check "speed lever: 15 / 50 / 100 % -> $sp km/h" $r ""
has 'zen: G.zen=true' && has 'car alarms 0, tree rustled true, havoc 0, health 100, hudZen true' && r=ok || r=no
check "Zen: slower, nothing scores, no alarms, no damage; quiet things still react" $r "$(echo "$out" | grep '^zen')"
has 'G.glide=true' && has 'sets it off: false' && has 'rolled to a stop on the floor: true' && has 'engine on reacts: true' && r=ok || r=no
check "glide: sinks slowly ($(echo "$out" | grep -o 'ratio [0-9.]*:1')), sets nothing off; the same car reacts with the engine on" $r "$(echo "$out" | grep '^glide')"
has 'First time on the board' && has 'NEW BEST TIME | 3.0 s | 2.0 s faster than your old best of 5.0 s.' && has '1.0 s off your best of 3.0 s.' && has 'time log: best 3 runs 3 log 4,3,5' && r=ok || r=no
check "levels are timed: first run sets the time, a faster run becomes the best, a slower one is logged against it, newest first" $r "$(echo "$out" | grep '^time')"
has 'planes locked 8 -> 7' && has 'old star counts as done: 2' && has 'no time limit: after 3 s without doing the task ui=play' && r=ok || r=no
check "finishing a level unlocks a plane; a star from the first release still counts; there is no time limit" $r "$(echo "$out" | grep 'planes locked\|old star\|no time')"
n=$(echo "$out" | grep '^pads ' | grep -o ':L+' | wc -l); bad=$(echo "$out" | grep '^pads ' | grep -c 'fast\|stuck')
[ "$n" = "10" ] && [ "$bad" = "0" ] && has 'land spots saved 10 of 10; menu shows 10 / 40' && has 'repeat landing bonus 150' && r=ok || r=no
check "all 10 lit landing spots: low and slow lands (+500 first, +150 after), fast does not, take-off lifts clear" $r "$(echo "$out" | grep '^pads')"
n=$(echo "$out" | grep 'engine-off touchdown' | grep -o ':down' | wc -l); bad=$(echo "$out" | grep 'engine-off touchdown' | grep -c 'NOLAND\|stuck')
[ "$n" = "10" ] && [ "$bad" = "0" ] && r=ok || r=no
check "engine-off touchdown on open ground, then vertical take-off, with each of the 10 planes" $r ""
has 'terrain fuzz 7.5 min: under ground 0, NaN 0' && r=ok || r=no
check "7.5 min of random flight over mountains, park and sea never goes under the ground or water" $r "$(echo "$out" | grep 'terrain')"
has 'after reload: upDives=false zen=true sound=false fps=false env=winter/dusk/snow plane=0 throttle=0.31 lever=0.31 pads=10 times={"best":3,"runs":3,"log":[4,3,5]} menuLevels=1 / 12 done menuZen=true menuPads=10 / 40' && has 'errors: none' && r=ok || r=no
check "every setting and all progress survive a reload (stick, Zen, sound, counter, season/time/weather, plane, lever, spots, level times)" $r "$(echo "$out" | grep 'after reload')"

out=$(timeout 295 node t_sub.mjs 2>&1)
has 'pads 19 (land 10, sea 6, dive 3), portals 3, finds 21' && [ "$(echo "$out" | grep -o 'palms [0-9]*' | head -1 | cut -d' ' -f2)" -ge 20 ] && r=ok || r=no
check "the sea has $(echo "$out" | grep -o 'palms [0-9]*' | head -1) on shore, 6 unmarked floats, 3 violet dive platforms, 3 dive entries, 21 things to find" $r "$(echo "$out" | grep '^world')"
has 'sea floats: beams 0, lit marks 0' && has 'dive platforms with a beam 3' && [ "$(echo "$out" | grep -o 'sea:L+200+200' | wc -l)" = "6" ] && [ "$(echo "$out" | grep -o 'dive:L+1000+400' | wc -l)" = "3" ] && r=ok || r=no
check "unmarked floats have no light and pay +200 on every landing; dive platforms pay +1000 then +400" $r "$(echo "$out" | grep '^sea')"
has 'reachable from the dive entry: 21 of 21' && r=ok || r=no
check "every one of the 21 finds can be reached by the sub from its dive entry (flood fill at the sub's size)" $r "$(echo "$out" | grep '^reachable')"
has 'touching water outside the disc dives: false; flying into the disc dives: true' && has 'under=true, plane hidden=true' && has 'DIVE button on a violet platform shown true; pressing it dives true' && r=ok || r=no
check "only the glowing disc takes the plane under; the DIVE button on a violet platform also works" $r "$(echo "$out" | grep 'disc\|DIVE')"
has 'stopped drift 0.00 m' && has 'reaches y -1.75 (surface -1)' && has 'sits 0.55 m above the floor' && has 'in rock or out of the water 0, NaN 0' && r=ok || r=no
check "sub: lever bottom is a dead stop, it cannot break the surface or the floor, 6 min of random driving never enters rock" $r "$(echo "$out" | grep 'stopped\|random sub')"
has 'SURFACE: back in the plane true, airborne true, plane shown true, haze back to true, did not fall straight back in true' && has 'sky back after leaving for the menu: under=false sub=false' && r=ok || r=no
check "SURFACE returns to the plane and the sky; leaving for the menu from under water also restores it" $r "$(echo "$out" | grep 'SURFACE\|sky back')"
has 'collected by the plane from above: false; collected by the sub 21 of 21; saved 21; points gained 8400' && r=ok || r=no
check "finds: only the sub collects them; +300 each, +1000 per map piece, all saved" $r "$(echo "$out" | grep '^collected')"
has 'treasure map: unlockAll true' && has 'TREASURE MAP COMPLETE' && has 'hangar after the treasure map: locked planes 0' && has 'new run after finding everything: finds left in the water 0' && r=ok || r=no
check "three map pieces complete the treasure map and unlock every plane; found things do not come back" $r "$(echo "$out" | grep 'treasure\|hangar\|new run')"
has 'after reload: finds=21 unlockAll=true points=true seaPads=6 divePads=3' && has 'spots and finds list rows 40, done 30, menu count 30 / 40' && has 'errors: none' && r=ok || r=no
check "finds, the treasure map, points and sea landings survive a reload; the list shows them" $r "$(echo "$out" | grep 'after reload\|list rows')"

out=$(timeout 295 node t_tgt.mjs 2>&1)
has 'ranges modal: opened=true rows=7 xTopRight=true closed=menu' && has 'range brief: ui=brief kind="TARGET RANGE · AIR"' && has 'range start: ui=play target=true FIRE shown=true PULSE shown=false' && has 'FIRE button held 0.7 s: shots fired yes' && has 'quick -> ranges: opened=true back=quick' && r=ok || r=no
check "Target mode: the menu button lists free fire and 6 ranges, the modal closes with its X, a range starts with FIRE in place of PULSE, holding FIRE keeps firing" $r "$(echo "$out" | grep '^range\|^ranges modal\|^FIRE\|^quick' | tr '\n' ' ')"
has 'free roam: targets 0, weapons false, fire() false, FIRE hidden true, pier pad true' && r=ok || r=no
check "an ordinary run has no targets and no weapons" $r "$(echo "$out" | grep '^free roam')"
has 'placement: 40 targets, inside something solid 0 ,' && has 'trees in water 0, sea targets too shallow 0; counts match the list true' && r=ok || r=no
check "all 40 targets stand in the open: balloons and mines clear of anything solid, trees on dry land, sea targets under water" $r "$(echo "$out" | grep '^placement')"
hits=$(echo "$out" | grep '^air range' | grep -o ':hit' | wc -l); bad=$(echo "$out" | grep '^air range' | grep -c 'MISS\|NOLINE'); done3=$(echo "$out" | grep '^air range' | grep -c 'before the last hit ui=play | after ui=result "RANGE CLEARED" time saved true')
[ "$hits" = "22" ] && [ "$bad" = "0" ] && [ "$done3" = "3" ] && r=ok || r=no
check "air ranges: each of the 22 targets is destroyed by one rocket from a clear line ($hits of 22); each of the 3 ranges ends with a time only when its last target is down" $r "$(echo "$out" | grep '^air range' | grep -o '[a-z0-9.]*:MISS\|[a-z0-9.]*:NOLINE' | tr '\n' ' ')"
has 'pier before: deck solid true, pier pad true, marked pillar target true' && has 'pier after the marked pillar is hit: deck solid false, head solid false, pier pad false' && r=ok || r=no
check "hitting the pillar marked with a red X brings the whole pier down, and its landing spot with it" $r "$(echo "$out" | grep '^pier')"
hits=$(echo "$out" | grep '^sea range' | grep -o ':hit' | wc -l); bad=$(echo "$out" | grep '^sea range' | grep -c 'MISS\|NOLINE'); done3=$(echo "$out" | grep '^sea range' | grep -c 'started under water true.*after ui=result "RANGE CLEARED" time saved true')
[ "$hits" = "18" ] && [ "$bad" = "0" ] && [ "$done3" = "3" ] && r=ok || r=no
check "sea ranges start in the submersible; each of the 18 targets is destroyed by one torpedo from a spot the sub can swim to ($hits of 18); each of the 3 ranges ends with a time" $r "$(echo "$out" | grep '^sea range' | grep -o '[a-z0-9.]*:MISS\|[a-z0-9.]*:NOLINE' | tr '\n' ' ')"
has 'cave wall: solid before true, solid after false' && has 'ramming a mine sets it off: true' && r=ok || r=no
check "the marked cave wall is rock until it is hit and open water after; touching a mine with the sub sets it off" $r "$(echo "$out" | grep '^cave\|^ramming')"
has 'free fire: 40 targets (22 air, 18 sea), goal "Targets 0 / 40", lock-on picks the target ahead true, all destroyed -> ui=play' && has 'retry: ui=play range t3 targets standing 8 of 8' && r=ok || r=no
check "free fire has all 40 targets and no clock; the sight picks the target ahead; a retry stands every target up again" $r "$(echo "$out" | grep '^free fire\|^retry')"
has 'shooting fuzz 3 min: NaN 0, sub in rock 0, most shots alive at once within 8, fired true' && r=ok || r=no
check "3 min of random flying and shooting, in the air and in the sub: no bad positions, never more than 8 shots alive" $r "$(echo "$out" | grep '^shooting')"
has 'levels done still 0 of 12; range times 6' && has 'after reload: range times kept 6; list shows a best time on 6 rows' && has 'errors: none' && r=ok || r=no
check "range times are saved apart from the levels, survive a reload and show in the list; no page errors" $r "$(echo "$out" | grep '^levels done\|^after reload\|^errors' | tr '\n' ' ')"

out=$(timeout 200 node t_pts.mjs 2>&1)
has 'counter at the start: "0" label "POINTS"' && has 'after a +500 landing: gain shown "+500", counter passed through several values and ended at 500, never above 500 true, never went down true' && r=ok || r=no
check "the points counter is on screen: it climbs to the new total instead of jumping, and the gain flashes beside it" $r "$(echo "$out" | grep '^counter\|^after a')"
has 'buy with 499 points 0; buy with 1700 points 1: level 1, wallet 1200, top 170%' && has 'step back refunds: 1, level 0, wallet 1700' && has 'buy all with 5200 points: bought 4 steps, level 4, wallet 200, top 200%' && r=ok || r=no
check "top speed: step 1 costs 500 and is refused with 499; a step back returns its points; buy-all takes as many steps as the points cover" $r "$(echo "$out" | grep '^buy\|^step back' | tr '\n' ' ')"
has 'lower part of the lever unchanged true; top faster by 6.' && r=ok || r=no
check "a bought step makes the top of the lever faster and leaves the lower part as it was ($(echo "$out" | grep -o 'lever 100% [0-9]* -> [0-9]* km/h'))" $r "$(echo "$out" | grep '^lever')"
has 'unlimited points: stops at level 20, one more 0, top 360%' && has 'inside something solid 0, NaN 0' && has 'sub flat out: 25 km/h at level 0, 33 km/h at level 5' && r=ok || r=no
check "top speed stops at step 20 ($(echo "$out" | grep -o '360% = [0-9]* km/h')); 90 s of random flight flat out at that speed never ends inside anything; the sub gets the same share" $r "$(echo "$out" | grep '^unlimited\|^sub flat')"
has 'top speed screen: opened=true xTopRight=true back=quick; start level 2 wallet 1500; plus -> 3/0; minus twice -> 1/2500; max -> 3/0; shows "190%"; lever label "190%"' && has 'after reload: level 3 wallet 0 top 190%' && has 'errors: none' && r=ok || r=no
check "the Top speed screen opens from the quick menu, closes with its X, its plus, minus and buy-all buttons work, and the step bought survives a reload" $r "$(echo "$out" | grep '^top speed\|^after reload\|^errors' | tr '\n' ' ')"

out=$(timeout 280 node t_misc.mjs 2>&1)
has 'environment combinations applied: 200' && has 'errors: none' && r=ok || r=no
check "all reactions fire, 200 season/time/weather combinations apply" $r "$(echo "$out" | tail -3 | tr '\n' ' ')"
[ "$(echo "$out" | grep '^levels:' | grep -o '=result:timed' | wc -l)" = "12" ] && ! echo "$out" | grep '^levels:' | grep -q 'early' && has 'levels done 12 of 12' && r=ok || r=no
check "each of the 12 levels stays open one short of its task and finishes, with a time logged, when the task is met" $r "$(echo "$out" | grep '^levels')"
has 'drone objects none, heat field none' && echo "$out" | grep -q 'after 3 s outside: banked [1-9]' && r=ok || r=no
check "no drones and no heat exist any more; banking outside works" $r "$(echo "$out" | grep 'inside\|outside')"

out=$(timeout 200 node t_mem.mjs 2>&1)
first=$(echo "$out" | grep -o '[0-9]*/[0-9]*/[0-9]*' | head -1); last=$(echo "$out" | grep -o '[0-9]*/[0-9]*/[0-9]*' | tail -1)
g1=${first%%/*}; g2=${last%%/*}; t1=$(echo $first | cut -d/ -f2); t2=$(echo $last | cut -d/ -f2); p1=${first##*/}; p2=${last##*/}
[ $((g2 - g1)) -le 4 ] && [ "$t1" = "$t2" ] && [ "$p1" = "$p2" ] && has 'downs 1, health 60, unbanked 0' && r=ok || r=no
check "GPU objects do not grow across 7 rebuilt blocks ($first -> $last); knock-down recovers" $r ""

exit $fail
