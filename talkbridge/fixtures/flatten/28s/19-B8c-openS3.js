  if (typeof openS3 === 'function') {
    var _open = openS3;
    openS3 = function () { var r = _open.apply(this, arguments); try { ensureField(); } catch (_) {} return r; };
  }
