var _lcInvUrl = invUrl;
invUrl = function (room) {
  if (room && room.grant && room.grantExpires) {
    var url = buildGrantLink(room, room.grantExpires);
    lcLog('invite_built', { room: String(room.id).slice(-6), grant: true, expires: room.grantExpires }, 'ok');
    return url;
  }
  lcLog('invite_built', { room: room && String(room.id).slice(-6), grant: false }, 'ok');
  return _lcInvUrl(room);
};
