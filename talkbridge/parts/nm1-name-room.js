/* ═══════════ 30·base PART · NM-1 name-room.js — THE ROOM'S NAME GETS THE ROOM UP TO THE MICROPHONE (§7.22, candidate 3) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — one style sheet, after the ribbon's own; it reassigns no function
   adds: NM_CSS, nmInit
   markers: nm_init_failed

   THE OWNER (2026-10-23): "the part of the screen where the name is supposed to display … seems to prematurely cut off and
   truncate. It could be a little bit more forgiving on the iPhone 13."
   THE CAUSE (measured in Chromium at 390 px): the name's side was capped at 50vw − 79px = 116 px, derived for a CENTRED cluster
   ("half the widest cluster (57)"). The cluster is not centred — the microphone's slot is (translateX −17px) — so the cluster
   starts at the centre − 17 px and 50 px before it were unused; in a call the timer ("Speaking…" ≈ 75 px) shares the 116.
   THE CHANGE: the name's side ends 8 px before the microphone's slot: calc(50% − 25px) of the ribbon's content box (holds for
   any equal side padding, the safe areas included; in the 480 px app column on a wide screen 50vw overran the column).
   It is also exactly the share the ribbon's flex gives the name's side (two flex:1 sides around the … button: (content − 34 − 2×8) / 2),
   so the name now gets what the layout always had for it; the cap states it so no later rule can let it run into the microphone.
   Right-to-left (Arabic; review 2026-10-23): the cluster's first child — the microphone — is its RIGHT end there, so the cluster
   is anchored by its right edge and shifted the other way; the microphone stays on the centre line and the name stops short. */
var NM_CSS =
  '#room-ribbon .rz-left{max-width:calc(50% - 25px)}' +
  '[dir=rtl] #room-ribbon .rz-center{left:auto;right:50%;transform:translateX(17px)}';
function nmInit() {
  try {
    if (document.getElementById('nm-css')) return;
    var st = document.createElement('style'); st.id = 'nm-css'; st.textContent = NM_CSS; document.head.appendChild(st);
  } catch (e) { try { log('nm_init_failed', { e: String(e && e.message || e) }, 'error'); } catch (_) {} }
}
nmInit();
