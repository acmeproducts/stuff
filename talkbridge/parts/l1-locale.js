/* ═══════════ 29·post-ship PART · L1 locale.js — EVERY WORD THE APP SAYS, IN THE PHONE'S LANGUAGE (candidate 1, plan v21.95.0 §7.17) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — the module reads the language, words keys, walks data-l10n* and re-renders through the accepted renderers; it reassigns no function
   adds: l10nLog, l10nFromNavigator, l10nUserLang, l10nLang, l10nAdopt, l10nIn, l10n, l10nPill, l10nLocale, l10nDir, l10nLandingLang, l10nCap, l10nApplyCaps, l10nApplyDom, l10nRerender, l10nFillLangSelect, l10nPostLang, l10nApply, l10nStyle, l10nTick, l10nInit
   markers (l10nLog's own prefix 'l10n_'): user_lang_set, user_lang_adopted, user_lang_changed, missing, applied, rerender_failed, init_failed

   THE TABLE (`L10N`, bound by the generated banked edit on the LANG_ORDER line, early in the script) holds every chrome string by language code then key; English is complete
   and every other language is machine-translated at build time and marked so (`L10N_MT`). `l10n(key, vars)` is the only way a
   chrome string reaches the screen; a missing key falls back to English and is logged once (`l10n_missing {lang,key}`).
   THE PHONE'S LANGUAGE is ONE setting, `S.user.lang`, everywhere (owner ruling 2026-10-12: a room's language never overrides it).
   On first run it is taken from `navigator.language` (mapped into LANGS, else English); the FIRST ROOM then sets it — a joiner takes
   the language the inviter chose for them (adopted at the landing), a creator the "Your language" of their first room — and after
   that only the clock's App language setting (the S13 modal) changes it. Nothing in the relay
   decides a phone's language. SYSTEM PILLS carry `{key, vars}` only (owner ruling 2026-10-11: no backwards compatibility);
   every reader words the key in its own language, so a language change re-words history.
   A SWITCH AT RUNTIME re-words the shell (data-l10n*), the live captions a l10nCap() site remembered, and re-runs the accepted
   renderers (home, panel, room head, transcript, partner state, the reach row, the menu labels). Residue, stated: a toast already
   on screen, a status pop, a typing caption with a 3 s life.
   RIGHT-TO-LEFT: the shell takes dir="rtl" for Arabic (the only RTL code in LANGS), the drawer and the FAB mirror by a rule this
   module adds, each transcript column carries the direction of its own language (the banked edit on the renderer). Dates follow
   the phone's language (fmtTime/fmtDate take l10nLocale()); Arabic is forced to the Gregorian calendar and Western digits. */
/* L10N, L10N_MT, L10N_RTL and l10nState are bound by the early banked edit on the LANG_ORDER line: the base words some HTML at script time, before this part runs */
function l10nLog(what, d, lvl) { try { log('l10n_' + what, d || {}, lvl || 'info'); } catch (_) {} }
/* navigator.language → a LANGS code: exact, then the primary subtag; 'tl' is Filipino's old tag; nothing matching → English */
function l10nFromNavigator() {
  var list = []; try { list = (navigator.languages && navigator.languages.length) ? navigator.languages.slice(0, 3) : [navigator.language || '']; } catch (_) { list = ['']; }
  for (var i = 0; i < list.length; i++) {
    var raw = String(list[i] || '').toLowerCase(); if (!raw) continue;
    var prim = raw.split('-')[0]; if (prim === 'tl') prim = 'fil';
    if (LANGS[raw]) return raw; if (LANGS[prim]) return prim;
  }
  return 'en';
}
function l10nUserLang() {
  if (!S.user.lang || !LANGS[S.user.lang]) {
    S.user.lang = l10nFromNavigator(); try { saveUser(); } catch (_) {}
    l10nLog('user_lang_set', { lang: S.user.lang, nav: String(navigator.language || '') }, 'ok');
  }
  return S.user.lang;
}
/* ONE language everywhere (owner ruling 2026-10-12, candidate 2): the app language, never a room's */
function l10nLang() { return l10nUserLang(); }
/* The first room sets the app language: a joiner takes the language the inviter chose for them (at the landing, before the room exists),
   a creator takes the "Your language" of their first room. Later rooms change nothing; only the clock's App language setting does. */
function l10nAdopt(lang, why) {
  l10nUserLang();
  if (!lang || !LANGS[lang] || S.user.langFrom === 'room' || S.user.langFrom === 'setting') return S.user.lang;
  var was = S.user.lang; S.user.lang = lang; S.user.langFrom = 'room'; try { saveUser(); } catch (_) {}
  l10nLog('user_lang_adopted', { lang: lang, was: was, why: why || 'room' }, 'ok');
  try { l10nApply('adopt'); } catch (_) {}
  return lang;
}
function l10nIn(lang, key, vars) {
  if (!key) return '';
  var t = (L10N[lang] && L10N[lang][key]);
  if (t == null && lang !== 'en') { if (!l10nState.missing[lang + '/' + key]) { l10nState.missing[lang + '/' + key] = 1; l10nLog('missing', { lang: lang, key: key }, 'warn'); } t = L10N.en[key]; }
  if (t == null) { if (!l10nState.missing['en/' + key]) { l10nState.missing['en/' + key] = 1; l10nLog('missing', { lang: 'en', key: key }, 'error'); } return String(key); }
  return vars ? t.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] == null ? '' : String(vars[k]); }) : t;
}
function l10n(key, vars) { return l10nIn(l10nLang(), key, vars); }
function l10nPill(e) { return (e && e.key) ? l10n(e.key, e.vars) : ((e && e.text) || ''); }
function l10nLocale() { var lang = l10nLang(); var tts = (LANGS[lang] && LANGS[lang].tts) || 'en-US'; return lang === 'ar' ? tts + '-u-ca-gregory-nu-latn' : tts; }
function l10nDir(lang) { return L10N_RTL[lang] ? 'rtl' : 'ltr'; }
/* the joiner landing adopts the invite's language for this phone (the inviter chose it for this person); a phone that already chose keeps its choice */
function l10nLandingLang(p) { return l10nAdopt(p && p.tl, 'invite'); }
/* a live caption remembers its key, so a switch re-words it while it is still the text on screen */
function l10nCap(id, key, vars) { var s = l10n(key, vars); l10nState.caps[id] = { key: key, vars: vars || null, str: s }; return s; }
function l10nApplyCaps() {
  for (var id in l10nState.caps) { if (!l10nState.caps.hasOwnProperty(id)) continue; var c = l10nState.caps[id], el = document.getElementById(id); if (!el) continue; if (el.textContent === c.str) { c.str = l10n(c.key, c.vars); el.textContent = c.str; } }
}
function l10nApplyDom(rootEl) {
  var list = (rootEl || document).querySelectorAll('[data-l10n],[data-l10n-html],[data-l10n-ph],[data-l10n-title],[data-l10n-aria]');
  for (var i = 0; i < list.length; i++) {
    var el = list[i], k;
    if ((k = el.getAttribute('data-l10n'))) {
      var s = l10n(k);
      if (el.children.length) { var kids = el.childNodes, done = false; for (var j = 0; j < kids.length; j++) { if (kids[j].nodeType === 3 && kids[j].nodeValue.replace(/\s+/g, '')) { kids[j].nodeValue = s; done = true; break; } } if (!done) el.insertBefore(document.createTextNode(s), el.firstChild); }
      else el.textContent = s;
    }
    if ((k = el.getAttribute('data-l10n-html'))) el.innerHTML = l10n(k);
    if ((k = el.getAttribute('data-l10n-ph'))) el.setAttribute('placeholder', l10n(k));
    if ((k = el.getAttribute('data-l10n-title'))) el.setAttribute('title', l10n(k));
    if ((k = el.getAttribute('data-l10n-aria'))) el.setAttribute('aria-label', l10n(k));
  }
}
function l10nRerender() {
  var fns = ['applyMenuLabels', 'renderHome', 'renderPanel', 'renderRoomHead', 'renderTranscript', 'renderPartnerState', 'rhRender'];
  for (var i = 0; i < fns.length; i++) { try { if (typeof window[fns[i]] === 'function') window[fns[i]](); } catch (e) { l10nLog('rerender_failed', { fn: fns[i], e: String(e && e.message || e) }, 'warn'); } }
}
function l10nFillLangSelect() {
  var sel = document.getElementById('s13-lang'); if (!sel) return;
  if (!sel.options.length) {
    for (var i = 0; i < LANG_ORDER.length; i++) { var c = LANG_ORDER[i], o = document.createElement('option'); o.value = c; o.textContent = gL(c).flag + ' ' + gL(c).name; sel.appendChild(o); }
    sel.addEventListener('change', function () { var v = sel.value; if (!LANGS[v] || v === S.user.lang) return; S.user.lang = v; S.user.langFrom = 'setting'; try { saveUser(); } catch (_) {} l10nLog('user_lang_changed', { lang: v }, 'ok'); l10nApply('setting'); });
  }
  sel.value = l10nUserLang();
}
/* the worker words its notifications in the phone's app language; it is told on every change (and asked nothing of the relay) */
function l10nPostLang() {
  var lang = l10nUserLang(); if (lang === l10nState.posted) return;
  try { if (!('serviceWorker' in navigator)) return; navigator.serviceWorker.getRegistration().then(function (reg) { if (reg && reg.active) { reg.active.postMessage({ t: 'tb-l10n', lang: lang }); l10nState.posted = lang; } }).catch(function () {}); } catch (_) {}
}
function l10nStyle() {
  if (document.getElementById('l10n-style')) return;
  var st = document.createElement('style'); st.id = 'l10n-style';
  st.textContent = '[dir=rtl] .left-panel{left:auto;right:0;border-right:none;border-left:1px solid var(--border);transform:translateX(105%)}[dir=rtl] .left-panel.open{transform:translateX(0)}[dir=rtl] .fab{right:auto;left:14px}';
  (document.head || document.documentElement).appendChild(st);
}
function l10nApply(why) {
  var lang = l10nLang(), changed = lang !== l10nState.lang; l10nState.lang = lang;
  try { document.documentElement.lang = lang; document.documentElement.dir = l10nDir(lang); } catch (_) {}
  l10nStyle(); l10nApplyDom(); l10nApplyCaps(); l10nFillLangSelect(); l10nPostLang();
  if (changed && why !== 'boot') l10nRerender();
  l10nLog('applied', { lang: lang, why: why, changed: changed }, 'ok');
}
function l10nTick() { try { if (l10nLang() !== l10nState.lang) l10nApply('switch'); } catch (e) { l10nLog('init_failed', { where: 'tick', e: String(e && e.message || e) }, 'warn'); } }
function l10nInit() {
  try {
    l10nApply('boot');
    var scr = document.getElementById('scr-room');
    if (scr && typeof MutationObserver === 'function') new MutationObserver(l10nTick).observe(scr, { attributes: true, attributeFilter: ['class'] });
    l10nState.tick = setInterval(l10nTick, 1000);
    document.addEventListener('DOMContentLoaded', function () { l10nApply('ready'); });
  } catch (e) { l10nLog('init_failed', { where: 'init', e: String(e && e.message || e) }, 'error'); }
}
l10nInit();
