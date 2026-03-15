(() => {
  const originalTitle = document.title;
  const originalFaviconHref = createBaseFavicon('');
  let unreadCount = 0;
  let titleFlashTimer = null;
  let titleFlashTicks = 0;
  let hiddenSince = document.hidden ? Date.now() : null;
  let hiddenDurationTimer = null;
  let bannerTimer = null;

  const els = {
    banner: document.getElementById('inPageBanner'),
    log: document.getElementById('eventLog'),
    statusVisibility: document.getElementById('statusVisibility'),
    statusFocus: document.getElementById('statusFocus'),
    statusPermission: document.getElementById('statusPermission'),
    statusHiddenDuration: document.getElementById('statusHiddenDuration'),
    statusUnread: document.getElementById('statusUnread'),
    statusWorker: document.getElementById('statusWorker'),
    statusBadge: document.getElementById('statusBadge'),
    statusVibration: document.getElementById('statusVibration'),
    btnRequestPermission: document.getElementById('btnRequestPermission'),
    btnSimulateMessage: document.getElementById('btnSimulateMessage'),
    btnClearUnread: document.getElementById('btnClearUnread'),
    btnResetDemo: document.getElementById('btnResetDemo'),
    btnBanner: document.getElementById('btnBanner'),
    btnTitleFlash: document.getElementById('btnTitleFlash'),
    btnFavicon: document.getElementById('btnFavicon'),
    btnAudio: document.getElementById('btnAudio'),
    btnVibrate: document.getElementById('btnVibrate'),
    btnNotify: document.getElementById('btnNotify'),
    btnBadge: document.getElementById('btnBadge'),
    btnWorkerPing: document.getElementById('btnWorkerPing'),
    btnDelayed5: document.getElementById('btnDelayed5'),
    btnDelayed15: document.getElementById('btnDelayed15')
  };

  function log(message) {
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${message}`;
    els.log.textContent = `${line}\n${els.log.textContent}`.trim();
  }

  function setStatus(el, value, tone) {
    el.textContent = value;
    el.className = `value ${tone || ''}`.trim();
  }

  function updateVisibilityStatus() {
    const visibility = document.hidden ? 'Hidden' : 'Visible';
    const focus = document.hasFocus() ? 'Focused' : 'Not focused';
    setStatus(els.statusVisibility, visibility, document.hidden ? 'warn' : 'good');
    setStatus(els.statusFocus, focus, document.hasFocus() ? 'good' : 'warn');
    if (document.hidden) {
      if (!hiddenSince) hiddenSince = Date.now();
    } else {
      hiddenSince = null;
      setStatus(els.statusHiddenDuration, '0s');
      stopTitleFlash();
      clearUnreadIndicatorsOnReturn();
    }
  }

  function updateHiddenDuration() {
    if (!hiddenSince) {
      setStatus(els.statusHiddenDuration, '0s');
      return;
    }
    const secs = Math.max(0, Math.floor((Date.now() - hiddenSince) / 1000));
    setStatus(els.statusHiddenDuration, `${secs}s`, secs >= 60 ? 'warn' : '');
  }

  function updatePermissionStatus() {
    if (!('Notification' in window)) {
      setStatus(els.statusPermission, 'Unsupported', 'bad');
      return;
    }
    const permission = Notification.permission;
    let tone = '';
    if (permission === 'granted') tone = 'good';
    if (permission === 'denied') tone = 'bad';
    if (permission === 'default') tone = 'warn';
    setStatus(els.statusPermission, permission, tone);
  }

  function updateCapabilityStatuses() {
    setStatus(els.statusBadge, ('setAppBadge' in navigator || 'clearAppBadge' in navigator) ? 'Supported/partial' : 'Not available', ('setAppBadge' in navigator || 'clearAppBadge' in navigator) ? 'good' : 'warn');
    setStatus(els.statusVibration, 'vibrate' in navigator ? 'Supported/partial' : 'Not available', 'vibrate' in navigator ? 'good' : 'warn');
  }

  function updateUnreadStatus() {
    setStatus(els.statusUnread, String(unreadCount), unreadCount > 0 ? 'warn' : 'good');
  }

  function createBaseFavicon(text) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="14" fill="#17304f"/>
        <text x="32" y="39" font-size="${text ? '30' : '18'}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-weight="700">${text ? escapeXml(text) : 'N'}</text>
      </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function escapeXml(str) {
    return String(str).replace(/[<>&'\"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));
  }

  function setFaviconBadge(count) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = count > 0 ? createBaseFavicon(String(Math.min(count, 99))) : originalFaviconHref;
    log(count > 0 ? `Favicon badge set to ${count}` : 'Favicon badge cleared');
  }

  function showBanner(text) {
    els.banner.textContent = text;
    els.banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      els.banner.classList.remove('show');
    }, 4000);
    log(`Banner shown: ${text}`);
  }

  function flashTitle(message = 'New activity') {
    stopTitleFlash();
    const altTitle = `(${unreadCount || 1}) ${message}`;
    titleFlashTicks = 0;
    titleFlashTimer = setInterval(() => {
      document.title = document.title === originalTitle ? altTitle : originalTitle;
      titleFlashTicks += 1;
      if (titleFlashTicks >= 12 && !document.hidden) {
        stopTitleFlash();
      }
    }, 900);
    log(`Title flash started: ${altTitle}`);
  }

  function stopTitleFlash() {
    if (titleFlashTimer) {
      clearInterval(titleFlashTimer);
      titleFlashTimer = null;
    }
    document.title = unreadCount > 0 && document.hidden ? `(${unreadCount}) ${originalTitle}` : originalTitle;
  }

  function clearUnreadIndicatorsOnReturn() {
    if (document.hidden) return;
    document.title = originalTitle;
  }

  async function requestPermission() {
    if (!('Notification' in window)) {
      log('Notifications API unsupported in this browser.');
      updatePermissionStatus();
      return;
    }
    try {
      const result = await Notification.requestPermission();
      log(`Notification permission result: ${result}`);
    } catch (err) {
      log(`Notification permission request failed: ${err.message}`);
    }
    updatePermissionStatus();
  }

  function sendSystemNotification(title = 'Demo notification', body = 'A simulated message arrived.') {
    if (!('Notification' in window)) {
      log('System notification skipped: Notifications API unsupported.');
      return;
    }
    if (Notification.permission !== 'granted') {
      log(`System notification skipped: permission is ${Notification.permission}.`);
      return;
    }
    try {
      const note = new Notification(title, {
        body,
        tag: 'html5-notification-demo',
        renotify: true,
        requireInteraction: false
      });
      note.onclick = () => window.focus();
      log(`System notification dispatched: ${title}`);
    } catch (err) {
      log(`System notification failed: ${err.message}`);
    }
  }

  async function attemptAppBadge() {
    if (!('setAppBadge' in navigator)) {
      log('App badge unsupported or unavailable in this runtime.');
      return;
    }
    try {
      await navigator.setAppBadge(unreadCount || 1);
      log(`App badge attempted with count ${unreadCount || 1}.`);
    } catch (err) {
      log(`App badge attempt failed: ${err.message}`);
    }
  }

  async function clearAppBadge() {
    if (!('clearAppBadge' in navigator)) return;
    try {
      await navigator.clearAppBadge();
      log('App badge clear attempted.');
    } catch (err) {
      log(`App badge clear failed: ${err.message}`);
    }
  }

  function vibrateNow() {
    if (!('vibrate' in navigator)) {
      log('Vibration API unavailable.');
      return;
    }
    const ok = navigator.vibrate([180, 80, 180]);
    log(`Vibration ${ok ? 'triggered' : 'request rejected by browser/runtime'}.`);
  }

  function playTone() {
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        log('AudioContext unavailable.');
        return;
      }
      const ctx = new AudioContextCtor();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
      oscillator.start(now);
      oscillator.stop(now + 0.32);
      oscillator.onended = () => {
        ctx.close().catch(() => {});
      };
      log('Audio tone played.');
    } catch (err) {
      log(`Audio playback failed: ${err.message}`);
    }
  }

  function markUnread() {
    unreadCount += 1;
    updateUnreadStatus();
    setFaviconBadge(unreadCount);
    document.title = `(${unreadCount}) ${originalTitle}`;
  }

  function clearUnread() {
    unreadCount = 0;
    updateUnreadStatus();
    setFaviconBadge(0);
    stopTitleFlash();
    clearAppBadge();
    log('Unread state cleared.');
  }

  function simulateIncomingMessage(source = 'manual') {
    markUnread();
    const text = `Simulated incoming message from ${source}.`;
    showBanner(text);
    flashTitle('New message');
    sendSystemNotification('Incoming message', text);
    attemptAppBadge();
    if (document.hasFocus()) {
      playTone();
    }
    if (document.hidden) {
      log('Page was hidden when simulated message arrived.');
    } else {
      log('Page was visible when simulated message arrived.');
    }
  }

  function resetDemo() {
    clearUnread();
    els.banner.classList.remove('show');
    els.log.textContent = '';
    document.title = originalTitle;
    setFaviconBadge(0);
    log('Demo reset complete.');
  }

  function setupTabs() {
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.toggle('active', b === btn));
        tabPanels.forEach(panel => panel.classList.toggle('active', panel.id === `tab-${target}`));
        log(`Switched to ${target} tab.`);
      });
    });
  }

  function setupBlobWorker() {
    if (!('Worker' in window)) {
      setStatus(els.statusWorker, 'Unsupported', 'bad');
      log('Blob worker unavailable: Worker API unsupported.');
      return null;
    }

    const workerSource = `
      let seq = 0;
      const timers = new Map();
      function send(type, payload = {}) {
        postMessage({ type, payload, seq: ++seq, at: Date.now() });
      }
      onmessage = (event) => {
        const data = event.data || {};
        if (data.type === 'ping') {
          send('pong', { note: 'Worker alive' });
        }
        if (data.type === 'schedule') {
          const id = 't_' + Math.random().toString(36).slice(2);
          const delay = Number(data.delay || 0);
          const label = String(data.label || 'scheduled');
          const handle = setTimeout(() => {
            timers.delete(id);
            send('scheduled-fire', { id, label, delay });
          }, delay);
          timers.set(id, handle);
          send('scheduled-set', { id, label, delay });
        }
      };
      send('ready', { note: 'Blob worker booted' });
    `;

    const blob = new Blob([workerSource], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    worker.addEventListener('message', event => {
      const { type, payload } = event.data || {};
      if (type === 'ready') {
        setStatus(els.statusWorker, 'Active', 'good');
        log('Blob worker ready.');
      }
      if (type === 'pong') {
        log(`Worker replied: ${payload.note}`);
      }
      if (type === 'scheduled-set') {
        log(`Worker scheduled event '${payload.label}' in ${Math.round(payload.delay / 1000)}s.`);
      }
      if (type === 'scheduled-fire') {
        log(`Worker fired delayed event '${payload.label}'.`);
        simulateIncomingMessage(`worker:${payload.label}`);
      }
    });
    worker.addEventListener('error', err => {
      setStatus(els.statusWorker, 'Error', 'bad');
      log(`Blob worker error: ${err.message}`);
    });
    return worker;
  }

  function bindUi(worker) {
    els.btnRequestPermission.addEventListener('click', requestPermission);
    els.btnSimulateMessage.addEventListener('click', () => simulateIncomingMessage('manual-button'));
    els.btnClearUnread.addEventListener('click', clearUnread);
    els.btnResetDemo.addEventListener('click', resetDemo);
    els.btnBanner.addEventListener('click', () => showBanner('Manual in-page banner test.'));
    els.btnTitleFlash.addEventListener('click', () => flashTitle('Manual title test'));
    els.btnFavicon.addEventListener('click', () => {
      unreadCount = Math.max(unreadCount, 1);
      updateUnreadStatus();
      setFaviconBadge(unreadCount);
    });
    els.btnAudio.addEventListener('click', playTone);
    els.btnVibrate.addEventListener('click', vibrateNow);
    els.btnNotify.addEventListener('click', () => sendSystemNotification('Manual system notification', 'Triggered by the test panel.'));
    els.btnBadge.addEventListener('click', attemptAppBadge);
    els.btnWorkerPing.addEventListener('click', () => {
      if (!worker) {
        log('Worker ping skipped: no worker instance.');
        return;
      }
      worker.postMessage({ type: 'ping' });
    });
    els.btnDelayed5.addEventListener('click', () => {
      if (!worker) {
        log('Delayed worker event skipped: no worker instance.');
        return;
      }
      worker.postMessage({ type: 'schedule', delay: 5000, label: '5-second-test' });
    });
    els.btnDelayed15.addEventListener('click', () => {
      if (!worker) {
        log('Delayed worker event skipped: no worker instance.');
        return;
      }
      worker.postMessage({ type: 'schedule', delay: 15000, label: '15-second-test' });
    });
  }

  function boot() {
    setupTabs();
    updateVisibilityStatus();
    updatePermissionStatus();
    updateCapabilityStatuses();
    updateUnreadStatus();
    setFaviconBadge(0);

    const worker = setupBlobWorker();
    bindUi(worker);

    document.addEventListener('visibilitychange', () => {
      updateVisibilityStatus();
      log(`Visibility changed: ${document.hidden ? 'hidden' : 'visible'}.`);
    });
    window.addEventListener('focus', () => {
      updateVisibilityStatus();
      log('Window focused.');
    });
    window.addEventListener('blur', () => {
      updateVisibilityStatus();
      log('Window blurred.');
    });

    hiddenDurationTimer = setInterval(updateHiddenDuration, 1000);

    log('Enhanced demo boot complete.');
    log('Root-level hosting expectation: html file + enhanced.js side by side.');
  }

  boot();
})();
