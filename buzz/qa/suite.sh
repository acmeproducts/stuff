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
has 'start -> play' && has 'map big true' && has 'locked plane not taken: plane 1' && has 'result -> result' && has 'after reload stars {"m1":2}' && has 'errors: none' && r=ok || r=no
check "missions start, map enlarges, locked plane cannot be picked, stars survive a reload" $r ""

out=$(timeout 290 node t_new.mjs 2>&1)
has 'fresh defaults: upDives=true' && has 'dives by default (pitch -1.' && has 'climbs when switched (pitch 1.' && r=ok || r=no
check "stick up dives by default and the switch flips it" $r "$(echo "$out" | grep 'stick up')"
sp=$(echo "$out" | grep 'lever 15' | grep -o '[0-9]* / [0-9]* / [0-9]*'); a=$(echo $sp | cut -d/ -f1); b=$(echo $sp | cut -d/ -f2); c=$(echo $sp | cut -d/ -f3)
[ -n "$a" ] && [ $a -lt $b ] && [ $b -lt $c ] && r=ok || r=no
check "speed lever: 15 / 50 / 100 % -> $sp km/h" $r ""
has 'zen: G.zen=true' && has 'car alarms 0, tree rustled true, havoc 0, drones 0, health 100, hudZen true' && r=ok || r=no
check "Zen: slower, nothing scores, no alarms, no drones, no damage; quiet things still react" $r "$(echo "$out" | grep '^zen')"
has 'trail points 0' && has 'sets it off: false' && has 'drones moved while engine off 0.00 m' && has 'still tracking after 9 s 0' && has 'engine on reacts: true' && r=ok || r=no
check "glide: sinks slowly ($(echo "$out" | grep -o 'ratio [0-9.]*:1')), leaves no trail, sets nothing off, drones hold then give up" $r "$(echo "$out" | grep '^glide')"
n=$(echo "$out" | grep '^pads ' | grep -o ':L+' | wc -l); bad=$(echo "$out" | grep '^pads ' | grep -c 'fast\|stuck')
[ "$n" = "10" ] && [ "$bad" = "0" ] && has 'pads saved 10 of 10; menu shows 10 / 10' && has 'repeat landing bonus 150' && r=ok || r=no
check "all 10 landing spots: low and slow lands (+500 first, +150 after), fast does not, take-off lifts clear" $r "$(echo "$out" | grep '^pads')"
n=$(echo "$out" | grep 'engine-off touchdown' | grep -o ':down' | wc -l); bad=$(echo "$out" | grep 'engine-off touchdown' | grep -c 'NOLAND\|stuck')
[ "$n" = "10" ] && [ "$bad" = "0" ] && r=ok || r=no
check "engine-off touchdown on open ground, then vertical take-off, with each of the 10 planes" $r ""
has 'terrain fuzz 7.5 min: under ground 0, NaN 0' && r=ok || r=no
check "7.5 min of random flight over mountains, park and sea never goes under the ground or water" $r "$(echo "$out" | grep 'terrain')"
has 'after reload: upDives=false zen=true sound=false fps=false env=winter/dusk/snow plane=0 throttle=0.31 lever=0.31 pads=10 menuZen=true menuPads=10 / 10' && has 'errors: none' && r=ok || r=no
check "every setting and all progress survive a reload (stick, Zen, sound, counter, season/time/weather, plane, lever, spots)" $r "$(echo "$out" | grep 'after reload')"

out=$(timeout 280 node t_misc.mjs 2>&1)
has 'environment combinations applied: 200' && has 'timeout -> result' && [ "$(echo "$out" | grep -o '=result:3' | wc -l)" = "12" ] && has 'errors: none' && r=ok || r=no
check "all reactions fire, 200 season/time/weather combinations apply, all 12 missions finish" $r "$(echo "$out" | tail -3 | tr '\n' ' ')"
echo "$out" | grep -q 'drones active peak [1-9]' && echo "$out" | grep -q 'after 3 s outside: banked [1-9]' && r=ok || r=no
check "drones appear with heat; banking outside works" $r ""

out=$(timeout 200 node t_mem.mjs 2>&1)
first=$(echo "$out" | grep -o '[0-9]*/[0-9]*/[0-9]*' | head -1); last=$(echo "$out" | grep -o '[0-9]*/[0-9]*/[0-9]*' | tail -1)
g1=${first%%/*}; g2=${last%%/*}; t1=$(echo $first | cut -d/ -f2); t2=$(echo $last | cut -d/ -f2); p1=${first##*/}; p2=${last##*/}
[ $((g2 - g1)) -le 4 ] && [ "$t1" = "$t2" ] && [ "$p1" = "$p2" ] && has 'downs 1, health 60, unbanked 0' && r=ok || r=no
check "GPU objects do not grow across 7 rebuilt blocks ($first -> $last); knock-down recovers" $r ""

exit $fail
