(function () {
  if (typeof uid !== 'function' || typeof deviceId !== 'string' || !deviceId) return;
  var prefix = String(deviceId).replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toLowerCase();
  if (!prefix) return;
  var _uid = uid;
  uid = function () { return prefix + '-' + _uid.apply(this, arguments); };
  try { log('k1_ids', { prefix: prefix }, 'ok'); } catch (_) {}
})();
