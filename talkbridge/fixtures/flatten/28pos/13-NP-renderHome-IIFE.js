/* Re-applied whenever the home screen redraws, since that is the common path
   back from any dialog that may have created new inputs. */
(function () {
  var _npRenderHome = renderHome;
  renderHome = function () {
    var r = _npRenderHome.apply(this, arguments);
    try { suppressPasswordUI(); } catch (_) {}
    return r;
  };
})();
