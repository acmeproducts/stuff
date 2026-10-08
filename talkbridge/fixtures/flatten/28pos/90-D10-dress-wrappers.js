  function dress(root) {
    var inputs = (root || document).querySelectorAll('[data-taginp]');
    for (var i = 0; i < inputs.length; i++) {
      var ti = inputs[i];
      ti.setAttribute('enterkeyhint', 'enter');
      ti.setAttribute('autocomplete', 'off');
      var p = ti.parentNode;
      if (!(p && p.tagName === 'FORM' && p.hasAttribute('data-tagform'))) {
        var f = document.createElement('form');
        f.setAttribute('data-tagform', ti.getAttribute('data-cid') || '');
        f.setAttribute('action', '#');
        p.insertBefore(f, ti); f.appendChild(ti);
      }
    }
  }

  var _renderPbList = renderPbList;
  renderPbList = function () { var r = _renderPbList.apply(this, arguments); try { dress(); } catch (_) {} return r; };
  var _pbRerenderCard = pbRerenderCard;
  pbRerenderCard = function (id) { var r = _pbRerenderCard.apply(this, arguments); try { dress(document.getElementById('pbb-' + id)); } catch (_) {} return r; };

  function refocus(id, at) {
    var inp = document.querySelector('[data-taginp][data-cid="' + id + '"]');
    if (inp && document.activeElement !== inp) { inp.focus(); try { log('d10_refocus', { id: id, at: at }, 'info'); } catch (_) {} }
  }
  var _pbAddTagTo = pbAddTagTo;
  pbAddTagTo = function (id) {
    var r = _pbAddTagTo.apply(this, arguments);
    setTimeout(function () { refocus(id, 0); }, 0);
    setTimeout(function () { refocus(id, 60); }, 60);
    return r;
  };
