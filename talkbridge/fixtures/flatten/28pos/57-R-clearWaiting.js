function clearWaiting(r) {
  if (!r) return;
  var before = waitingTotal(r);
  r.waiting = { chat: 0, voice: 0, video: 0 };
  r.unread = 0;
  if (before) rcLog('waiting_cleared', { room: r.id, was: before }, 'ok');
}
