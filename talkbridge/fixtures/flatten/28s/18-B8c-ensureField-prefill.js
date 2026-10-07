  function ensureField() {
    var m = document.getElementById('m-s3'); if (!m) return;
    if (document.getElementById('s3-myname')) { prefill(); return; }
    var ok = document.getElementById('s3-ok'); if (!ok) return;
    var lab = document.createElement('label');
    lab.className = 'field-label'; lab.textContent = 'Your name in this chat';
    var inp = document.createElement('input');
    inp.id = 's3-myname'; inp.type = 'text'; inp.autocomplete = 'off';
    inp.className = 'field-select';
    var anchor = m.querySelector('.toggle-row') || ok.parentElement;
    anchor.parentElement.insertBefore(lab, anchor);
    anchor.parentElement.insertBefore(inp, anchor);
    prefill();
  }
  function prefill() {
    var inp = document.getElementById('s3-myname'); if (!inp) return;
    try { if (!inp.value) inp.value = (S.user && S.user.name) || ''; } catch (_) {}
  }
