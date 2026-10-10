function waitingOf(r) {
  if (!r) return { chat: 0, voice: 0, video: 0 };
  if (!r.waiting) {
    /* Migration: rooms carry a single legacy counter. Everything it counted was
       a message, so it becomes the chat count and is not thrown away. */
    r.waiting = { chat: r.unread || 0, voice: 0, video: 0 };
    if (r.unread) rcLog('waiting_migrated', { room: r.id, chat: r.unread }, 'ok');
  }
  return r.waiting;
}
