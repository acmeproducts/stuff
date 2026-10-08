/* ═══════════ GAP PART · T4-speech-log.js ═══════════ */
/* @contract
   replaces: speakTextCore, speakText
   wraps: (none)
   adds: (none) · markers tts_speak, tts_no_voice
*/
/* ─────────────────────────────────────────────────────────────────────────────
   T-4 · SPEECH IS ON THE RECORD (from D-17, 2026-10-08)

   The tablet's Target speaker was silent while Source played; the cause was a
   missing voice pack for the target language, found by the owner in Android's
   settings because the app had nothing to say about it. Now every tap logs
   tts_speak {lang, chars, voices, match} — how many voices the device reports
   and how many fit the language — and when the device reports voices but none
   for this language it logs tts_no_voice and shows "No voice installed for
   <language>". The line is still handed to the speech engine as before. FL-5's
   speakText, verbatim, plus the record.
   ───────────────────────────────────────────────────────────────────────────── */
function speakTextCore(text,lang){
  text=norm(text);if(!text||!window.speechSynthesis)return;
  /* T-4: say which voice will speak, and say so when the device has none for this language (D-17) */
  var want = gL(lang).tts, voices = [];
  try { voices = window.speechSynthesis.getVoices() || []; } catch (_) {}
  var head = String(want || '').toLowerCase().slice(0, 2);
  var match = 0; for (var i = 0; i < voices.length; i++) { if (voices[i] && voices[i].lang && String(voices[i].lang).toLowerCase().slice(0, 2) === head) match++; }
  if (voices.length && !match) { log('tts_no_voice', { lang: want, voices: voices.length }, 'warn'); toast('No voice installed for ' + (gL(lang).name || lang)); }
  else log('tts_speak', { lang: want, chars: text.length, voices: voices.length, match: match }, 'ok');
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);u.lang=want;window.speechSynthesis.speak(u);
}
function speakText(text, lang) { return speakTextCore.call(this, tbmdSpeechStrip(text), lang); }
