  log('call_builder', { builds: this.builds(), role: room.role }, 'ok');          /* D-18: only the caller builds; the answerer waits for the offer */
  if (this.builds()) this.setupPC();
  log('call_accept', {}, 'ok');
