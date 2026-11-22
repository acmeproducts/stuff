#!/bin/bash
# Buzz gate: run before every push. Prints one PASS/FAIL line per check and exits non-zero on any FAIL.
# Lab only: software rendering in headless Chrome. It proves logic and layout, not frame rate or feel on a phone.
cd "$(dirname "$0")"
fail=0
check() { if [ "$2" = "ok" ]; then echo "PASS  $1"; else echo "FAIL  $1  ($3)"; fail=1; fi; }

out=$(timeout 150 node t_boot.mjs 2>&1)
echo "$out" | grep -q '"state":"menu"' && echo "$out" | grep -q 'errors: none\|ReadPixels' && ! echo "$out" | grep -q pageerror && r=ok || r=no
check "boots to the menu with no page errors" $r "$(echo "$out" | tail -2 | tr '\n' ' ')"

out=$(timeout 280 node t_logic.mjs 2>&1)
bad=$(echo "$out" | grep -c '"bad": [1-9]\|"nan": [1-9]')
[ "$bad" = "0" ] && echo "$out" | grep -q 'errors: none' && r=ok || r=no
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

out=$(timeout 280 node t_ui.mjs 2>&1)
want='missions -> missions|brief -> brief|start -> play|turbo while steering true|after all up turbo=false x=0|map big true|pause -> pause|hangar -> hangar|pick locked -> hangar|hangar back -> pause|resume -> play|result -> result|after reload stars {"m1":2}|errors: none'
r=ok; IFS='|'; for w in $want; do echo "$out" | grep -qF "$w" || { r=no; miss="$w"; }; done; unset IFS
check "touch UI: menu, missions, stick plus turbo together, map, pause, hangar, result, saved stars" $r "missing: $miss"

out=$(timeout 280 node t_misc.mjs 2>&1)
echo "$out" | grep -q 'environment combinations applied: 200' && echo "$out" | grep -q 'timeout -> result' && [ "$(echo "$out" | grep -o '=result:3' | wc -l)" = "12" ] && echo "$out" | grep -q 'errors: none' && r=ok || r=no
check "all reactions fire, 200 season/time/weather combinations apply, all 12 missions finish" $r "$(echo "$out" | tail -3 | tr '\n' ' ')"
echo "$out" | grep -q 'drones active peak [1-9]' && echo "$out" | grep -q 'after 3 s outside: banked [1-9]' && r=ok || r=no
check "drones appear with heat; banking outside works" $r ""

out=$(timeout 200 node t_mem.mjs 2>&1)
first=$(echo "$out" | grep -o '[0-9]*/[0-9]*/[0-9]*' | head -1); last=$(echo "$out" | grep -o '[0-9]*/[0-9]*/[0-9]*' | tail -1)
g1=${first%%/*}; g2=${last%%/*}; [ $((g2 - g1)) -le 2 ] && [ $((g1 - g2)) -le 2 ] && echo "$out" | grep -q 'downs 1, health 60, unbanked 0' && r=ok || r=no
check "GPU objects do not grow across 7 rebuilt blocks ($first -> $last); knock-down recovers" $r ""

exit $fail
