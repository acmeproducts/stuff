  this.accepted = true;
  log('call_builder', { builds: this.builds(), role: room.role }, 'ok');          /* D-18: the caller builds, whatever the room says its role is */
  if (this.builds()) this.setupPC();
