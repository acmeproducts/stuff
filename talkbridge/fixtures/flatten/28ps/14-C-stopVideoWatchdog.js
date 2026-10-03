CALL.stopVideoWatchdog = function () {
  clearInterval(this.videoWatchTimer); this.videoWatchTimer = null;
};
