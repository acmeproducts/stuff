      room && room.role === 'creator' &&
      (this.makingOffer || (this.pc && this.pc.signalingState !== 'stable'))) {
