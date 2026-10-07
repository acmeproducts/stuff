(function () {
  var _lcOpenS3 = openS3;
  openS3 = function () {
    var r = _lcOpenS3.apply(this, arguments);
    try {
      installCreateFields();
      if ($('s3-name')) $('s3-name').value = '';
      if ($('s3-grant')) $('s3-grant').classList.remove('on');
      if ($('s3-exp-wrap')) $('s3-exp-wrap').style.display = 'none';
      if ($('s3-autoread')) $('s3-autoread').classList.remove('on');
      if ($('s3-exp')) $('s3-exp').value = new Date(Date.now() + GRANT_DEFAULT_DAYS * 86400000).toISOString().slice(0, 10);
    } catch (e) { lcLog('create_open_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
