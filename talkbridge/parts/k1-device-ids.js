/* ═══════════ GAP PART · K1-device-ids.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: uid
   adds: (none)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   K-1 · IDS ARE NAMESPACED BY DEVICE (§7.9 K1)

   `uid()` is a millisecond timestamp plus six random base-36 characters. Two
   devices minting a message in the same millisecond collide with probability
   about one in two billion — small, not impossible, and the transcript dedupes
   by id, so a collision silently drops a message. Multi-user (turn 28) raises
   the odds with every extra device.

   THE CHANGE: every id `uid()` returns is prefixed with the first eight
   characters of this device's own id (a random UUID, fixed at install) and a
   dash. Prefixes `cm-` / `ci-` / `sp-` are added by the callers OUTSIDE uid(),
   so every existing prefix check still holds; ids are 9 characters longer.
   Room ids grow too — they ride in invite links and nothing parses them.
   Existing ids on disk are untouched. `k1_ids {prefix}` is logged once.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof uid !== 'function' || typeof deviceId !== 'string' || !deviceId) return;
  var prefix = String(deviceId).replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toLowerCase();
  if (!prefix) return;
  var _uid = uid;
  uid = function () { return prefix + '-' + _uid.apply(this, arguments); };
  try { log('k1_ids', { prefix: prefix }, 'ok'); } catch (_) {}
})();
