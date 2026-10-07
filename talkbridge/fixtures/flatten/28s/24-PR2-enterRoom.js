  /* entrance */
  if (typeof enterRoom === 'function') {
    var _enter = enterRoom;
    enterRoom = function () { var r = _enter.apply(this, arguments); declare('enter_room'); return r; };
  }
