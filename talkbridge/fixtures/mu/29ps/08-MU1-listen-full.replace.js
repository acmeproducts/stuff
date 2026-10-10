LISTEN.handle = function (roomId, d) {
  if (d && d.type === 'full') { mu1OnFull(d, roomId); return; }     /* MU-1 · the relay refused this lane */
