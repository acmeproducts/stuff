  if (d && d.type === 'full') { mu1OnFull(d, S.roomId); return; }  /* MU-1 · the relay refused this lane */
  if (d && d.type === 'peer') {
    var present = !!(d.others > 0);