function replaceSenderTrack(sender, track) {
  try {
    if (sender && sender.replaceTrack) { sender.replaceTrack(track); return true; }
  } catch (e) { netLog('replace_track_failed', { e: String(e && e.message || e) }, 'error'); }
  return false;
}
