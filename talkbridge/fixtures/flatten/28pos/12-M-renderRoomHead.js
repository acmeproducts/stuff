/* The ribbon shows the person; tapping the name shows what the room is called. */
var _rmRenderHead = renderRoomHead;
renderRoomHead = function () {
  var r = _rmRenderHead.apply(this, arguments);
  try {
    var el = $('room-head-title');
    if (el && !el.dataset.rmWired) {
      el.dataset.rmWired = '1';
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (ev) { ev.stopPropagation(); showRoomNamePopup(); });
    }
  } catch (e) { rmLog('head_wire_failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
};
