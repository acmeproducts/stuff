/* ═══════════ GAP PART · D10-tag-enter.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: renderPbList, pbRerenderCard, pbAddTagTo
   adds: (none)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   D-10 · ENTER IN THE TAG FIELD ADDS THE TAG AND STAYS PUT (owner, 2026-09-21)

   On the phone, Enter in a card's tag field moves focus to the next card's
   source field instead of adding the tag. The rig never shows it; the
   phone always does, and it is older than any build the owner could find.
   The frozen handler listens for one thing only: a keydown whose `key` is
   exactly 'Enter'. Phone keyboards do not promise that — the composing
   keyboard reports 'Unidentified'/229, or delivers Enter as the keyboard's
   own "next field" action, which the page never sees as a key at all.

   THE PATCH, belt and braces, all of it downstream of the frozen handler:
   1. Every tag input gets `enterkeyhint="enter"` (the keyboard shows Enter,
      not Next) and is wrapped in a one-field <form>, so whatever the
      keyboard calls the key, it arrives here as a `submit` — the one Enter
      signal every phone keyboard does send. The frozen keydown path still
      runs first and, when it does, its preventDefault stops the submit.
   2. Two more ears on the same host: a keydown whose keyCode is 13 but
      whose `key` is not 'Enter', and a keyup Enter — each adds the tag
      only if the field still holds text, so a tag already added on keydown
      is never added twice.
   3. After the tag is added, focus is checked again at 0 ms and 60 ms and
      put back in that card's tag field if the phone moved it.
   `d10_tag_enter {via}` says which ear heard it; `d10_refocus` says focus
   had to be put back. The frozen handler is untouched.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof pbAddTagTo !== 'function' || typeof pbRerenderCard !== 'function' || typeof renderPbList !== 'function') return;

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

  var host = $('pb-s7'); if (!host) return;
  function commit(ti, via, ev) {
    ev.preventDefault();
    try { log('d10_tag_enter', { via: via }, 'info'); } catch (_) {}
    pbAddTagTo(ti.getAttribute('data-cid'), ti.value);
  }
  host.addEventListener('submit', function (ev) {
    var f = ev.target;
    if (!(f && f.hasAttribute && f.hasAttribute('data-tagform'))) return;
    ev.preventDefault();
    var ti = f.querySelector('[data-taginp]');
    if (ti && ti.value && ti.value.trim()) commit(ti, 'submit', ev);
  });
  host.addEventListener('keydown', function (ev) {
    var ti = ev.target && ev.target.closest ? ev.target.closest('[data-taginp]') : null;
    if (!ti || ev.key === 'Enter') return;                   /* 'Enter' is the frozen handler's */
    if ((ev.keyCode === 13 || ev.which === 13) && ti.value && ti.value.trim()) commit(ti, 'keycode', ev);
  });
  host.addEventListener('keyup', function (ev) {
    var ti = ev.target && ev.target.closest ? ev.target.closest('[data-taginp]') : null;
    if (!ti) return;
    if ((ev.key === 'Enter' || ev.keyCode === 13 || ev.which === 13) && ti.value && ti.value.trim()) commit(ti, 'keyup', ev);
  });
})();
