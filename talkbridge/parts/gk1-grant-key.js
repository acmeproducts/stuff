/* ═══════════ 30·ship PART · GK-1 grant-key.js — THE CREATOR-RIGHTS INDICATOR (§7.25 item 7, B-12) ═══════════ */
/* @contract
   replaces: (none)   wraps: roomCardHtmlCore (outermost — after MC-1), wireRoomCards (each original kept and called)
   adds: GKEY, gkLog, GK_CSS, GK_KEY, GK_L10N, gkGranted, gkDays, gkText, _gkCard, _gkWire, gkInit
   markers (gkLog's own prefix 'gk_'): shown, failed

   THE OWNER (2026-11-16, level 1 only — "I don't want to add more complexity"): a room that has handed on creator rights
   (initiator status) shows an indicator; a tap on it shows the end date and the days remaining. Revoke = delete the room (it
   already sends the revoke, kept in the room's history for a phone that was offline); reinstate = restore it (the ORIGINAL end
   date — a room restored after that date reinstates nothing).
   THE CHANGE: a room this phone created with the grant (room.grant and room.grantExpires — local 23:59:59 of the end day) gets
   a small key at the START of its card's name line (before MC-1's bell), with a padded tap area. A tap on the key shows a toast
   in the app language — "Initiator status · until {date} · {n} days left" (singular for 1), or after the date "Initiator status ·
   ended {date}"; the date in l10nLocale() (Thai shows the Buddhist year); {n} = whole days left, rounded up. The tap stops at
   the key (the card does not open). Three strings, all 21 languages, added to L10N (the app's own table). */
var GKEY = { fails: 0 };
function gkLog(what, d, lvl) { try { log('gk_' + what, d || {}, lvl || 'info'); } catch (_) {} }
var GK_CSS = '.rc2-key{display:inline-block;vertical-align:-3px;margin-inline-end:4px;padding:6px 4px;margin-block:-6px;margin-inline-start:-4px;color:var(--teal);line-height:0;cursor:pointer;background:none;border:none}';
var GK_KEY = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 21 2"/><path d="m16 7 3 3"/><path d="m19 4 2 2"/></svg>';
var GK_L10N = {
  en: { gk_until: 'Initiator status · until {date} · {n} days left', gk_until_1: 'Initiator status · until {date} · 1 day left', gk_ended: 'Initiator status · ended {date}' },
  th: { gk_until: 'สถานะผู้ริเริ่ม · ถึง {date} · เหลือ {n} วัน', gk_until_1: 'สถานะผู้ริเริ่ม · ถึง {date} · เหลือ 1 วัน', gk_ended: 'สถานะผู้ริเริ่ม · สิ้นสุดเมื่อ {date}' },
  es: { gk_until: 'Estado de iniciador · hasta el {date} · quedan {n} días', gk_until_1: 'Estado de iniciador · hasta el {date} · queda 1 día', gk_ended: 'Estado de iniciador · terminó el {date}' },
  ja: { gk_until: '開始者の権限 · {date}まで · 残り{n}日', gk_until_1: '開始者の権限 · {date}まで · 残り1日', gk_ended: '開始者の権限 · {date}に終了' },
  ko: { gk_until: '개설자 권한 · {date}까지 · {n}일 남음', gk_until_1: '개설자 권한 · {date}까지 · 1일 남음', gk_ended: '개설자 권한 · {date}에 종료됨' },
  zh: { gk_until: '发起人权限 · 至{date} · 剩余{n}天', gk_until_1: '发起人权限 · 至{date} · 剩余1天', gk_ended: '发起人权限 · 已于{date}结束' },
  ar: { gk_until: 'صلاحية المُنشئ · حتى {date} · متبقٍ {n} يوم', gk_until_1: 'صلاحية المُنشئ · حتى {date} · متبقٍ يوم واحد', gk_ended: 'صلاحية المُنشئ · انتهت في {date}' },
  hi: { gk_until: 'आरंभकर्ता अधिकार · {date} तक · {n} दिन शेष', gk_until_1: 'आरंभकर्ता अधिकार · {date} तक · 1 दिन शेष', gk_ended: 'आरंभकर्ता अधिकार · {date} को समाप्त' },
  ru: { gk_until: 'Права инициатора · до {date} · осталось дней: {n}', gk_until_1: 'Права инициатора · до {date} · остался 1 день', gk_ended: 'Права инициатора · истекли {date}' },
  fr: { gk_until: 'Statut d’initiateur · jusqu’au {date} · {n} jours restants', gk_until_1: 'Statut d’initiateur · jusqu’au {date} · 1 jour restant', gk_ended: 'Statut d’initiateur · terminé le {date}' },
  de: { gk_until: 'Initiator-Status · bis {date} · noch {n} Tage', gk_until_1: 'Initiator-Status · bis {date} · noch 1 Tag', gk_ended: 'Initiator-Status · beendet am {date}' },
  it: { gk_until: 'Stato di iniziatore · fino al {date} · {n} giorni rimasti', gk_until_1: 'Stato di iniziatore · fino al {date} · 1 giorno rimasto', gk_ended: 'Stato di iniziatore · terminato il {date}' },
  pt: { gk_until: 'Status de iniciador · até {date} · faltam {n} dias', gk_until_1: 'Status de iniciador · até {date} · falta 1 dia', gk_ended: 'Status de iniciador · terminou em {date}' },
  vi: { gk_until: 'Quyền người khởi tạo · đến {date} · còn {n} ngày', gk_until_1: 'Quyền người khởi tạo · đến {date} · còn 1 ngày', gk_ended: 'Quyền người khởi tạo · đã kết thúc {date}' },
  id: { gk_until: 'Status pemrakarsa · hingga {date} · sisa {n} hari', gk_until_1: 'Status pemrakarsa · hingga {date} · sisa 1 hari', gk_ended: 'Status pemrakarsa · berakhir {date}' },
  ms: { gk_until: 'Status pemula · hingga {date} · baki {n} hari', gk_until_1: 'Status pemula · hingga {date} · baki 1 hari', gk_ended: 'Status pemula · tamat {date}' },
  fil: { gk_until: 'Initiator status · hanggang {date} · {n} araw na lang', gk_until_1: 'Initiator status · hanggang {date} · 1 araw na lang', gk_ended: 'Initiator status · natapos noong {date}' },
  nl: { gk_until: 'Initiatiefnemersstatus · tot {date} · nog {n} dagen', gk_until_1: 'Initiatiefnemersstatus · tot {date} · nog 1 dag', gk_ended: 'Initiatiefnemersstatus · verlopen op {date}' },
  sv: { gk_until: 'Initiativtagarstatus · till {date} · {n} dagar kvar', gk_until_1: 'Initiativtagarstatus · till {date} · 1 dag kvar', gk_ended: 'Initiativtagarstatus · upphörde {date}' },
  pl: { gk_until: 'Status inicjatora · do {date} · pozostało dni: {n}', gk_until_1: 'Status inicjatora · do {date} · pozostał 1 dzień', gk_ended: 'Status inicjatora · wygasł {date}' },
  tr: { gk_until: 'Başlatıcı statüsü · {date} tarihine kadar · {n} gün kaldı', gk_until_1: 'Başlatıcı statüsü · {date} tarihine kadar · 1 gün kaldı', gk_ended: 'Başlatıcı statüsü · {date} tarihinde sona erdi' }
};
(function () { try { for (var lang in GK_L10N) { if (!GK_L10N.hasOwnProperty(lang) || !L10N[lang]) continue; for (var k in GK_L10N[lang]) if (GK_L10N[lang].hasOwnProperty(k)) L10N[lang][k] = GK_L10N[lang][k]; } } catch (e) { gkLog('failed', { e: String(e && e.message || e) }, 'error'); } })();
function gkGranted(r) { return !!(r && r.grant && typeof r.grantExpires === 'number' && r.grantExpires > 0); }
function gkDays(exp, now) { return Math.ceil((exp - now) / 86400000); }
function gkText(r, now) {
  now = now || Date.now();
  var date = new Date(r.grantExpires).toLocaleDateString(l10nLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
  if (r.grantExpires <= now) return l10n('gk_ended', { date: date });
  var n = gkDays(r.grantExpires, now);
  return n === 1 ? l10n('gk_until_1', { date: date }) : l10n('gk_until', { date: date, n: n });
}
var _gkCard = roomCardHtmlCore;
roomCardHtmlCore = function (r, where) {
  var h = _gkCard.apply(this, arguments);
  if (!gkGranted(r) || !h) return h;
  try { h = h.replace('<div class="rc2-name">', '<div class="rc2-name"><button class="rc2-key" data-grant="' + esc(r.id) + '" aria-label="' + esc(l10n('grant_initiator')) + '">' + GK_KEY + '</button>'); }
  catch (e) { if (!GKEY.fails++) gkLog('failed', { e: String(e && e.message || e) }, 'error'); }
  return h;
};
var _gkWire = wireRoomCards;
wireRoomCards = function (host) {
  var r = _gkWire.apply(this, arguments);
  try {
    if (host) Array.prototype.forEach.call(host.querySelectorAll('[data-grant]'), function (el) {
      el.addEventListener('click', function (ev) {
        ev.stopPropagation(); ev.preventDefault();
        var room = roomById(el.dataset.grant); if (!gkGranted(room)) return;
        var t = gkText(room); toast(t, 4000);
        gkLog('shown', { room: String(room.id).slice(-6), days: gkDays(room.grantExpires, Date.now()) }, 'ok');
      });
    });
  } catch (e) { gkLog('failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
};
function gkInit() {
  try { if (document.getElementById('gk-css')) return; var st = document.createElement('style'); st.id = 'gk-css'; st.textContent = GK_CSS; document.head.appendChild(st); }
  catch (e) { gkLog('failed', { e: String(e && e.message || e) }, 'error'); }
}
if (typeof document !== 'undefined') gkInit();
