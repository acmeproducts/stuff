  /* 2 · A room created moments ago adopts the field's value. */
  if (typeof enterRoom === 'function') {
    var _enter = enterRoom;
    enterRoom = function (id) {
      try {
        var inp = document.getElementById('s3-myname');
        var v = inp && inp.value && inp.value.trim();
        var r = (S.rooms || []).filter(function (x) { return x.id === id; })[0];
        if (v && r && r.role === 'creator' && Date.now() - (r.createdAt || 0) < 5000 && r.myName !== v) {
          r.myName = v; saveRooms(); L('b8c_room_name_set', { n: v.slice(0, 12) });
        }
        if (inp) inp.value = '';
      } catch (_) {}
      return _enter.apply(this, arguments);
    };
  }
