(function () {
  var _onSignal = CALL.onSignal;
  CALL.onSignal = async function (d) {
    var room = activeRoom();
    if (d && d.signal && d.signal.description && d.signal.description.type === 'offer' &&
        room && room.role === 'creator' &&
        (this.makingOffer || (this.pc && this.pc.signalingState !== 'stable'))) {
      log('rtc_glare_ignored', {}, 'warn');
      return;
    }
    var r = await _onSignal.apply(this, arguments);
    if (d && d.signal && d.signal.description && d.signal.description.type === 'offer') this.armConnectTimeout();
    return r;
  };
})();
