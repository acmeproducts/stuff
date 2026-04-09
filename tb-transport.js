// tb-transport.js
// Owns WebSocket relay and WebRTC peer connection.
// CONTRACT:
//   - TBTransport.init(room, stream) — starts relay + WebRTC
//   - TBTransport.send(msg) — sends relay message
//   - TBTransport.hangup() — sends hangup, tears down cleanly
//   - Callbacks registered before init(): onRemoteStream, onConnected,
//     onDisconnected, onRelayMessage
//   - setupPC() is called INSIDE ws.onopen — guarantees relay is ready
//     before any offer is emitted. (Bug proven by log: wsReady:false)
//   - Uses perfect negotiation with rollback for glare handling.

var TBTransport = (function () {
  'use strict';

  var RELAY_WS = 'wss://talk-signal.myacctfortracking.workers.dev/signal';
  var RELAY_APP = 'talk-say-v1';
  var HEARTBEAT_MS = 25000;

  var _ws = null, _pc = null;
  var _room = null, _stream = null;
  var _remoteStream = null;
  var _seq = 0, _hbTimer = null, _reconnTimer = null;
  var _makingOffer = false, _ignoreOffer = false;

  var _deviceId = localStorage.getItem('tb_dev') || (function () {
    var id = crypto.randomUUID();
    localStorage.setItem('tb_dev', id);
    return id;
  })();

  // Callbacks — register before calling init()
  var _cbRemoteStream = null;
  var _cbConnected = null;
  var _cbDisconnected = null;
  var _cbRelayMessage = null;

  function onRemoteStream(fn) { _cbRemoteStream = fn; }
  function onConnected(fn) { _cbConnected = fn; }
  function onDisconnected(fn) { _cbDisconnected = fn; }
  function onRelayMessage(fn) { _cbRelayMessage = fn; }
  function deviceId() { return _deviceId; }

  function init(room, stream) {
    _room = room;
    _stream = stream;
    _connectWS();
  }

  function send(msg) {
    if (!_ws || _ws.readyState !== 1) return;
    msg.session = _room.id;
    msg.from = _deviceId;
    msg.ts = Date.now();
    msg.seq = ++_seq;
    try { _ws.send(JSON.stringify(msg)); } catch (_) {}
  }

  function _connectWS() {
    if (_ws) try { _ws.close(); } catch (_) {}
    var ws = new WebSocket(
      RELAY_WS + '?app=' + encodeURIComponent(RELAY_APP) +
      '&session=' + encodeURIComponent(_room.id) +
      '&client=' + encodeURIComponent(_deviceId)
    );
    _ws = ws;

    ws.onopen = function () {
      TBApp.log('transport_ws_open', { role: _room.role }, 'ok');
      send({ type: 'hello', lang: _room.myLang, targetLang: _room.theirLang, role: _room.role });
      _startHB();
      // setupPC INSIDE onopen — relay confirmed ready before offer fires
      if (!_pc) _setupPC();
    };

    ws.onmessage = function (e) {
      try { _onMsg(JSON.parse(e.data)); } catch (_) {}
    };

    ws.onclose = function (ev) {
      if (_ws !== ws) return;
      TBApp.log('transport_ws_close', { code: ev.code }, 'warn');
      _stopHB();
      clearTimeout(_reconnTimer);
      if (_room && _room.id) _reconnTimer = setTimeout(_connectWS, 2000);
    };

    ws.onerror = function () {
      TBApp.log('transport_ws_err', {}, 'error');
    };
  }

  function _startHB() {
    _stopHB();
    _hbTimer = setInterval(function () { send({ type: 'ping', transient: true }); }, HEARTBEAT_MS);
  }
  function _stopHB() {
    if (_hbTimer) { clearInterval(_hbTimer); _hbTimer = null; }
  }

  function _onMsg(d) {
    if (!d || d.from === _deviceId) return;
    if (d.type === 'ping') { send({ type: 'pong', transient: true }); return; }
    if (d.type === 'pong') return;
    if (d.type === 'webrtc-signal') { _handleSig(d); return; }
    if (d.type === 'hangup') {
      if (_cbDisconnected) _cbDisconnected('hangup');
      return;
    }
    if (_cbRelayMessage) _cbRelayMessage(d);
  }

  function _setupPC() {
    _pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add all tracks (audio + video) in one shot — single onnegotiationneeded
    if (_stream) {
      _stream.getTracks().forEach(function (t) { _pc.addTrack(t, _stream); });
    }

    _pc.onnegotiationneeded = async function () {
      try {
        _makingOffer = true;
        TBApp.log('transport_offer_start', { sig: _pc.signalingState });
        await _pc.setLocalDescription(await _pc.createOffer());
        send({ type: 'webrtc-signal', transient: true, signal: { description: _pc.localDescription } });
        TBApp.log('transport_offer_sent', {}, 'ok');
      } catch (e) {
        TBApp.log('transport_offer_err', { e: String(e) }, 'error');
      } finally {
        _makingOffer = false;
      }
    };

    _pc.onicecandidate = function (e) {
      if (e.candidate) {
        TBApp.log('transport_ice_cand', { type: e.candidate.type });
        send({ type: 'webrtc-signal', transient: true, signal: { candidate: e.candidate } });
      } else {
        TBApp.log('transport_ice_gather_done', {});
      }
    };

    _pc.oniceconnectionstatechange = function () {
      var s = _pc.iceConnectionState;
      TBApp.log('transport_ice_state', { state: s },
        s === 'connected' ? 'ok' : s === 'failed' ? 'error' : 'info');
    };

    _pc.onconnectionstatechange = function () {
      var s = _pc.connectionState;
      TBApp.log('transport_conn_state', { state: s },
        s === 'connected' ? 'ok' : s === 'failed' ? 'error' : 'info');
      if (s === 'connected' && _cbConnected) _cbConnected();
      if ((s === 'failed' || s === 'disconnected') && _cbDisconnected) _cbDisconnected(s);
    };

    _pc.ontrack = function (e) {
      TBApp.log('transport_track', { kind: e.track.kind, state: e.track.readyState }, 'ok');
      if (!_remoteStream) _remoteStream = new MediaStream();
      var tracks = (e.streams && e.streams[0]) ? e.streams[0].getTracks() : [e.track];
      tracks.forEach(function (t) {
        if (!_remoteStream.getTracks().some(function (x) { return x.id === t.id; })) {
          _remoteStream.addTrack(t);
        }
        t.onunmute = t.onmute = t.onended = function () {
          if (_cbRemoteStream) _cbRemoteStream(_remoteStream);
        };
      });
      if (_cbRemoteStream) _cbRemoteStream(_remoteStream);
    };
  }

  // Perfect negotiation — handles glare correctly on both sides
  async function _handleSig(d) {
    if (!d.signal) return;
    if (!_pc) _setupPC();

    TBApp.log('transport_sig_recv', {
      type: d.signal.description ? d.signal.description.type : 'candidate',
      sig: _pc.signalingState
    });

    try {
      if (d.signal.description) {
        var desc = d.signal.description;
        var polite = _deviceId > d.from;  // higher deviceId is polite peer
        var collision = desc.type === 'offer' && (_makingOffer || _pc.signalingState !== 'stable');
        _ignoreOffer = !polite && collision;

        if (_ignoreOffer) {
          TBApp.log('transport_glare_ignored', { polite: polite });
          return;
        }

        if (collision) {
          // Polite peer rolls back own offer, accepts incoming
          await Promise.all([
            _pc.setLocalDescription({ type: 'rollback' }),
            _pc.setRemoteDescription(desc)
          ]);
        } else {
          await _pc.setRemoteDescription(desc);
        }

        if (desc.type === 'offer') {
          await _pc.setLocalDescription(await _pc.createAnswer());
          send({ type: 'webrtc-signal', transient: true, signal: { description: _pc.localDescription } });
          TBApp.log('transport_answer_sent', {}, 'ok');
        }

      } else if (d.signal.candidate) {
        try { await _pc.addIceCandidate(d.signal.candidate); } catch (_) {}
      }
    } catch (e) {
      TBApp.log('transport_sig_err', { e: String(e) }, 'error');
    }
  }

  function hangup() {
    send({ type: 'hangup' });
    _teardown();
  }

  function _teardown() {
    _stopHB();
    clearTimeout(_reconnTimer);
    if (_pc) { _pc.close(); _pc = null; }
    if (_ws) { try { _ws.close(); } catch (_) {} _ws = null; }
    _remoteStream = null; _room = null; _stream = null;
    TBApp.log('transport_teardown', {});
  }

  function reset() { _teardown(); }

  return {
    init: init, send: send, hangup: hangup, reset: reset, deviceId: deviceId,
    onRemoteStream: onRemoteStream, onConnected: onConnected,
    onDisconnected: onDisconnected, onRelayMessage: onRelayMessage
  };
})();
