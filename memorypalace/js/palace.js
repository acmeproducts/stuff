/* Memory Palace · config drawer, GitHub sync (last update wins, last three versions kept per area) and cards pinned in the world.
   Loads after the page. Nothing here blocks the world: it opens first, this is all in drawers. */
(function () {
  'use strict';
  const YX = window.YX, MP = window.MP; if (!YX || !MP) return;
  const W = YX.world, cfg = MP.cfg, PROV = MP.PROV;
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, attrs, ...kids) => { const e = document.createElement(tag); for (const k in attrs || {}) { if (k === 'class') e.className = attrs[k]; else if (k.startsWith('on')) e[k] = attrs[k]; else if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); return e; };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const slug = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const device = (() => { try { let d = localStorage.getItem('mp.device'); if (!d) { d = 'dev-' + uid(); localStorage.setItem('mp.device', d); } return d; } catch (e) { return 'dev-' + uid(); } })();
  const AREAS = ['world', 'cards'];

  /* ================= styles and icons ================= */
  document.head.append(el('style', { text: `
#mpIcons{position:fixed;left:12px;top:78px;z-index:30;display:flex;flex-direction:column;gap:8px}
#mpIcons button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(14,16,22,.62);color:#f4efe6;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:0}
#mpIcons button:hover{background:rgba(14,16,22,.85)}#mpIcons svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
#mpIcons .dot{position:absolute;margin:-26px 0 0 28px;width:10px;height:10px;border-radius:50%;background:#9ca3af;border:1px solid #111}
#mpIcons .dot.ok{background:#22c55e}#mpIcons .dot.busy{background:#eab308}#mpIcons .dot.bad{background:#ef4444}
.mpd{position:fixed;top:0;bottom:0;right:0;width:min(440px,100vw);z-index:60;background:#f6f7f9;color:#0a0d12;font:400 14px/1.45 system-ui,sans-serif;box-shadow:-10px 0 40px rgba(0,0,0,.35);transform:translateX(105%);transition:transform .22s;display:flex;flex-direction:column;color-scheme:light}
.mpd.open{transform:none}.mpd header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #dfe2e7;position:static;background:none;pointer-events:auto}
.mpd h2{margin:0;font:600 17px/1.2 system-ui}.mpd .body{overflow:auto;padding:12px 16px 40px;flex:1}
.mpd h3{margin:18px 0 6px;font:600 12px/1 system-ui;letter-spacing:.08em;text-transform:uppercase;color:#4a505a}
.mpd label{display:block;font-size:12px;color:#5b6270;margin:8px 0 3px}.mpd input,.mpd select,.mpd textarea{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #cfd3d9;border-radius:8px;background:#fff;color:#0a0d12;font:inherit}
.mpd button{font:inherit;padding:7px 12px;border-radius:8px;border:1px solid #0a0d12;background:#fff;color:#0a0d12;cursor:pointer}.mpd button.pri{background:#ffd84a}.mpd button.x{border:0;background:none;font-size:22px;line-height:1;padding:2px 8px}
.mpd .row{display:flex;gap:8px;align-items:center}.mpd .row>*{min-width:0}.mpd .muted{color:#5b6270;font-size:12.5px}.mpd .prov{border:1px solid #dfe2e7;border-radius:10px;padding:8px 10px 10px;margin:8px 0;background:#fff}
.mpd .prov b{font-size:13px}.mpd .st{font-size:12.5px;margin:6px 0;padding:6px 8px;border-radius:8px;background:#eceef1}.mpd .st.bad{background:#fde7e5;color:#8a1c14}.mpd .st.ok{background:#e3f5e8;color:#14532d}
.mpd .ver{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #eceef1;font-size:12.5px}
.mpb{display:flex;gap:10px;overflow:auto;align-items:flex-start;padding:10px 12px 40px}.mpcol{flex:0 0 250px;background:#eceef1;border-radius:10px;padding:8px;min-height:80px}.mpcol.over{outline:2px solid #3b82f6}.mpcol h4{margin:0 0 6px;font:600 13px/1 system-ui;display:flex;justify-content:space-between}
.mpcard{background:#fff;border:1px solid #dfe2e7;border-radius:9px;padding:8px 9px;margin-bottom:7px;cursor:grab}.mpcard.dragging{opacity:.4}.mpcard .line{display:flex;align-items:center;gap:7px}.mpcard .ttl{flex:1;font-weight:700;color:#1f6feb;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:none;border:0;padding:0;text-align:left}
.mpcard .sd{width:12px;height:12px;border-radius:50%;border:1px solid #6b7280;cursor:pointer;flex:none;padding:0}.mpcard .chip{font-size:11.5px;color:#5b6270;border:1px solid #dfe2e7;border-radius:999px;padding:1px 7px}
.mpcard .det{margin-top:8px;display:none}.mpcard.open .det{display:block}.mpcard .md{padding:7px 9px;background:#f8fafc;border:1px solid #dfe2e7;border-radius:8px;min-height:44px;white-space:pre-wrap;word-break:break-word;cursor:text}.mpcard .md a{color:#1d4ed8}
#mpNear{position:fixed;left:50%;bottom:calc(var(--bar-h,150px) + 16px);transform:translateX(-50%);z-index:29;display:none;padding:9px 16px;border-radius:999px;border:1px solid rgba(255,216,74,.7);background:rgba(20,18,12,.9);color:#f4efe6;font:600 13px/1 system-ui;cursor:pointer;max-width:80vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:640px){#mpIcons{top:auto;bottom:calc(var(--bar-h,150px) + 70px)}}
` }));
  const ic = (d) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.innerHTML = d; return s; };
  const ICO = {
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    cards: '<rect x="3" y="4" width="6" height="16" rx="1.5"/><rect x="11" y="4" width="6" height="10" rx="1.5"/><path d="M19.5 6.5v6"/>',
  };
  const icons = el('div', { id: 'mpIcons' });
  const bCards = el('button', { type: 'button', title: 'Cards', 'aria-label': 'Cards' }, ic(ICO.cards)), bCfg = el('button', { type: 'button', title: 'Config', 'aria-label': 'Config' }, ic(ICO.gear)), syncDot = el('i', { class: 'dot' });
  icons.append(bCards, bCfg, syncDot); document.body.append(icons);
  function exitLock() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {} }
  // while a drawer is open, nothing behind it takes keys
  const inDrawer = (e) => e.target && e.target.closest && e.target.closest('.mpd');
  for (const t of ['keydown', 'keyup', 'keypress']) window.addEventListener(t, (e) => { if (document.querySelector('.mpd.open') && inDrawer(e)) e.stopImmediatePropagation(); }, true);

  /* ================= base64 / GitHub contents ================= */
  const enc = (s) => { const u = new TextEncoder().encode(s); let b = ''; for (let i = 0; i < u.length; i += 0x8000) b += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(b); };
  const dec = (b) => { const bin = atob(String(b).replace(/\n/g, '')), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); };
  const ghOK = () => cfg.gh.owner && cfg.gh.repo && slug(cfg.world);
  const ghURL = (path) => 'https://api.github.com/repos/' + encodeURIComponent(cfg.gh.owner) + '/' + encodeURIComponent(cfg.gh.repo) + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
  const ghHdr = (accept) => Object.assign({ Accept: accept || 'application/vnd.github+json' }, cfg.gh.token ? { Authorization: 'Bearer ' + cfg.gh.token } : {});
  const pathOf = (area) => 'palace/' + slug(cfg.world) + '/' + area + '.json';
  const etags = {};
  async function ghGet(area, fresh) { // -> { sha, doc } | null (no file) | 'same' (not changed)
    const p = pathOf(area), h = ghHdr(); if (etags[p] && !fresh) h['If-None-Match'] = etags[p].tag;
    const r = await fetch(ghURL(p) + '?ref=' + encodeURIComponent(cfg.gh.branch || 'main') + '&_=' + (etags[p] && !fresh ? '' : Date.now()), { headers: h, cache: 'no-store' });
    if (r.status === 304) return 'same'; if (r.status === 404) { delete etags[p]; return null; }
    if (!r.ok) throw new Error('GitHub ' + r.status + ': ' + ((await r.json().catch(() => ({}))).message || ''));
    const j = await r.json(); let txt;
    if (j.content) txt = dec(j.content); else { const rr = await fetch(ghURL(p) + '?ref=' + encodeURIComponent(cfg.gh.branch || 'main'), { headers: ghHdr('application/vnd.github.raw+json'), cache: 'no-store' }); if (!rr.ok) throw new Error('GitHub ' + rr.status); txt = await rr.text(); }
    const t = r.headers.get('ETag'); if (t) etags[p] = { tag: t };
    return { sha: j.sha, doc: JSON.parse(txt) };
  }
  async function ghPut(area, doc, sha, msg) {
    const body = { message: msg, content: enc(JSON.stringify(doc)), branch: cfg.gh.branch || 'main' }; if (sha) body.sha = sha;
    const r = await fetch(ghURL(pathOf(area)), { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, ghHdr()), body: JSON.stringify(body) });
    if (r.status === 409 || r.status === 422) return 'conflict';
    if (!r.ok) throw new Error('GitHub ' + r.status + ': ' + ((await r.json().catch(() => ({}))).message || ''));
    delete etags[pathOf(area)]; return 'ok';
  }

  /* ================= areas: where each kind of data lives locally and how it is applied ================= */
  const CK = (a) => 'mp.local.' + (slug(cfg.world) || '_') + '.' + a;
  function cardsDefault() { return { stages: ['Learn', 'Reviewing', 'Known'], cards: [], archive: [] }; }
  let cards = (() => { try { const c = JSON.parse(localStorage.getItem(CK('cards')) || 'null'); if (c && Array.isArray(c.cards)) return c; } catch (e) {} return cardsDefault(); })();
  let applying = false;
  const A = {
    world: { get: () => { const d = YX.serialize(); delete d.player; return d; }, set: (d) => { applying = true; try { YX.restore(d, { instant: true, player: false }); try { localStorage.setItem('yanchu.world.v1', JSON.stringify(YX.serialize())); } catch (e) {} } finally { applying = false; } } },
    cards: { get: () => cards, set: (d) => { cards = normCards(d); localStorage.setItem(CK('cards'), JSON.stringify(cards)); renderCards(); syncMarkers(); } },
  };
  function normCards(d) { d = d && Array.isArray(d.cards) ? d : cardsDefault(); d.stages = Array.isArray(d.stages) && d.stages.length ? d.stages : cardsDefault().stages; d.archive = Array.isArray(d.archive) ? d.archive : []; return d; }

  /* ================= sync: last update wins; the file keeps the last three earlier versions ================= */
  const SK = () => 'mp.sync.' + slug(cfg.world);
  let ss = {}; const loadSS = () => { try { ss = JSON.parse(localStorage.getItem(SK()) || '{}'); } catch (e) { ss = {}; } for (const a of AREAS) ss[a] = ss[a] || { seen: 0, localAt: 0, hash: '' }; };
  const saveSS = () => { try { localStorage.setItem(SK(), JSON.stringify(ss)); } catch (e) {} };
  let status = { kind: '', text: '' };
  const setStatus = (kind, text) => { status = { kind, text }; syncDot.className = 'dot ' + (kind || ''); syncDot.title = text; const s = $('#mpSync'); if (s) { s.className = 'st ' + kind; s.textContent = text; } };
  const hashOf = (o) => { const s = JSON.stringify(o); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };
  function touch(area) { // a local change
    if (applying || !ghOK()) return; if (area === 'world') { const i = document.getElementById('intro'); if (i && !i.classList.contains('off')) return; } // the title card borrows the sky: that is not an edit
    const d = A[area].get(), h = hashOf(d); if (h === ss[area].hash) return;
    ss[area].hash = h; ss[area].localAt = Date.now(); saveSS(); schedule();
  }
  let pushT = 0, busy = false;
  const schedule = () => { clearTimeout(pushT); pushT = setTimeout(() => sync(), 8000); };
  async function sync() {
    if (!ghOK()) { setStatus('', 'Saved on this device only. Add a world name and a GitHub repo in Config to share it.'); return; }
    if (busy) { schedule(); return; } busy = true; loadSSIfNeeded();
    try {
      setStatus('busy', 'Syncing…'); let wrote = 0, took = 0;
      for (const area of AREAS) {
        const st = ss[area], remote = await ghGet(area);
        if (remote === 'same') { if (st.localAt > st.seen && cfg.gh.token) wrote += (await push(area, undefined)) ? 1 : 0; continue; }
        const ru = remote && remote.doc ? remote.doc.updatedAt || 0 : 0;
        if (remote && ru > st.seen && ru >= st.localAt) { A[area].set(remote.doc.data); st.seen = st.localAt = ru; st.hash = hashOf(A[area].get()); took++; }
        else if (st.localAt > (remote ? ru : 0) || (!remote && A[area].get && hasContent(area))) { if (cfg.gh.token) wrote += (await push(area, remote)) ? 1 : 0; else { setStatus('bad', 'Read-only: add a GitHub token to save changes to the repo.'); busy = false; return; } }
        else st.seen = ru;
      }
      saveSS(); const t = new Date().toLocaleTimeString(); setStatus('ok', 'Synced ' + t + (took ? ' · pulled ' + took : '') + (wrote ? ' · saved ' + wrote : ''));
      if ($('#mpVers')) paintVersions();
    } catch (e) { setStatus('bad', 'Sync failed: ' + (e.message || e)); }
    busy = false;
  }
  const hasContent = (area) => area === 'world' ? W.objs && W.objs.size > 0 : cards.cards.length > 0 || cards.archive.length > 0;
  function loadSSIfNeeded() { if (!ss._w || ss._w !== slug(cfg.world)) { loadSS(); ss._w = slug(cfg.world); } }
  async function push(area, remote, forceData) {
    for (let tries = 0; tries < 4; tries++) {
      if (tries > 0 || remote === undefined || remote === 'same') remote = await ghGet(area, true);
      const prev = remote && remote.doc, now = Math.max(Date.now(), (prev && prev.updatedAt || 0) + 1);
      const hist = prev ? [{ rev: prev.rev || 0, updatedAt: prev.updatedAt || 0, by: prev.by || '', data: prev.data }].concat(prev.history || []).slice(0, 3) : [];
      const doc = { area, world: cfg.world, rev: (prev && prev.rev || 0) + 1, updatedAt: now, by: device, data: forceData || A[area].get(), history: hist };
      const r = await ghPut(area, doc, remote && remote.sha, 'palace ' + slug(cfg.world) + '/' + area + ' r' + doc.rev + ' by ' + device);
      if (r === 'ok') { ss[area].seen = ss[area].localAt = now; ss[area].hash = hashOf(A[area].get()); return true; }
      remote = undefined;
    }
    throw new Error('the file kept changing under us, try again');
  }
  setInterval(() => { if (!document.hidden && ghOK() && !document.querySelector('.mpd.open input:focus,.mpd.open textarea:focus')) sync(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  const o0 = YX.onChange; YX.onChange = function () { const r = o0 && o0.apply(this, arguments); touch('world'); return r; };

  /* ================= config drawer ================= */
  function drawer(id, title) { const d = el('aside', { class: 'mpd', id, role: 'dialog', 'aria-label': title }); d.append(el('header', {}, el('h2', { text: title }), el('button', { class: 'x', type: 'button', 'aria-label': 'Close', onclick: () => closeAll(), text: '×' })), el('div', { class: 'body' })); d.addEventListener('click', (e) => e.stopPropagation()); d.addEventListener('pointerdown', (e) => e.stopPropagation()); document.body.append(d); return d; }
  const dCfg = drawer('mpCfg', 'Config'), dCards = drawer('mpCards', 'Cards');
  function closeAll() { dCfg.classList.remove('open'); dCards.classList.remove('open'); }
  function openCfg(focus, said) { closeAll(); exitLock(); paintCfg(said); dCfg.classList.add('open'); if (focus === 'ai') setTimeout(() => { const i = $('#mpk-' + (MP.chain()[0] || cfg.order[0]), dCfg); if (i) i.focus(); }, 250); }
  MP.openDrawer = (what, said) => openCfg(what, said);
  bCfg.onclick = (e) => { e.stopPropagation(); dCfg.classList.contains('open') ? closeAll() : openCfg(); };
  bCards.onclick = (e) => { e.stopPropagation(); if (dCards.classList.contains('open')) return closeAll(); closeAll(); exitLock(); renderCards(); dCards.classList.add('open'); };
  icons.addEventListener('pointerdown', (e) => e.stopPropagation()); icons.addEventListener('click', (e) => e.stopPropagation());

  function paintCfg(said) {
    const b = $('.body', dCfg); b.textContent = '';
    if (said) b.append(el('div', { class: 'st', text: 'Needs an AI key: “' + said + '”. Add one below and it runs right away.' }));
    b.append(el('h3', { text: 'World' }), el('label', { text: 'World name (same name on any device = same world)' }), el('input', { id: 'mpWorld', value: cfg.world, placeholder: 'e.g. my-house', autocomplete: 'off' }),
      el('div', { class: 'st', id: 'mpSync', text: status.text || 'Saved on this device only.' }), el('div', { class: 'row' }, el('button', { class: 'pri', type: 'button', text: 'Save & sync now', onclick: saveCfg }), el('button', { type: 'button', text: 'Test GitHub', onclick: testGH })));
    b.append(el('h3', { text: 'GitHub storage' }), el('div', { class: 'muted', text: 'Where the world and cards are kept: palace/<world>/world.json and cards.json. Each file keeps the three versions before the current one. Last update wins.' }),
      el('div', { class: 'row' }, el('div', {}, el('label', { text: 'Owner' }), el('input', { id: 'mpOwner', value: cfg.gh.owner, placeholder: 'acmeproducts' })), el('div', {}, el('label', { text: 'Repo' }), el('input', { id: 'mpRepo', value: cfg.gh.repo, placeholder: 'stuff' })), el('div', {}, el('label', { text: 'Branch' }), el('input', { id: 'mpBranch', value: cfg.gh.branch || 'main' }))),
      el('label', { text: 'Token (fine-grained, Contents: read & write on that repo)' }), el('input', { id: 'mpTok', type: 'password', value: cfg.gh.token, autocomplete: 'off', placeholder: 'github_pat_…' }));
    b.append(el('h3', { text: 'AI (first one with a key is tried first)' }));
    cfg.order.forEach((p, i) => {
      const dl = el('datalist', { id: 'mpm-' + p });
      b.append(el('div', { class: 'prov' }, el('div', { class: 'row' }, el('b', { text: PROV[p].name + (i === 0 ? ' · primary' : '') }), el('span', { style: 'flex:1' }), el('button', { type: 'button', text: '↑', title: 'Move up', onclick: () => { readCfg(); if (i > 0) { [cfg.order[i - 1], cfg.order[i]] = [cfg.order[i], cfg.order[i - 1]]; } MP.save(); paintCfg(said); } }), el('button', { type: 'button', text: '↓', title: 'Move down', onclick: () => { readCfg(); if (i < cfg.order.length - 1) { [cfg.order[i + 1], cfg.order[i]] = [cfg.order[i], cfg.order[i + 1]]; } MP.save(); paintCfg(said); } })),
        el('label', { text: 'API key' }), el('input', { id: 'mpk-' + p, type: 'password', value: cfg.providers[p].key, autocomplete: 'off', spellcheck: 'false' }),
        el('label', { text: 'Model' }), el('div', { class: 'row' }, el('input', { id: 'mpmo-' + p, value: cfg.providers[p].model, list: 'mpm-' + p }), el('button', { type: 'button', text: 'Load', onclick: async (ev) => { readCfg(); ev.target.disabled = true; try { const ms = await MP.listModels(p); dl.textContent = ''; ms.forEach((m) => dl.append(el('option', { value: m }))); ev.target.textContent = ms.length + ' ✓'; } catch (e) { ev.target.textContent = 'Load'; alert(e.message || e); } ev.target.disabled = false; } })), dl));
    });
    b.append(el('div', { class: 'muted', text: 'Keys and the token stay in this browser. They are never written to the repo.' }));
    b.append(el('h3', { text: 'Restore' }), el('div', { id: 'mpVers' })); paintVersions();
  }
  function readCfg() {
    const v = (id) => { const e = $('#' + id, dCfg); return e ? e.value.trim() : null; };
    if (v('mpWorld') !== null) cfg.world = v('mpWorld'); if (v('mpOwner') !== null) { cfg.gh.owner = v('mpOwner'); cfg.gh.repo = v('mpRepo'); cfg.gh.branch = v('mpBranch') || 'main'; cfg.gh.token = v('mpTok'); }
    for (const p of cfg.order) { const k = v('mpk-' + p); if (k !== null) { cfg.providers[p].key = k; cfg.providers[p].model = v('mpmo-' + p) || PROV[p].model; } }
  }
  async function saveCfg() {
    const was = slug(cfg.world); readCfg(); MP.save(); MP.keysChanged();
    if (slug(cfg.world) !== was) { loadSS(); ss._w = slug(cfg.world); try { const c = JSON.parse(localStorage.getItem(CK('cards')) || 'null'); cards = c && Array.isArray(c.cards) ? normCards(c) : cardsDefault(); } catch (e) { cards = cardsDefault(); } }
    primeSS(); saveSS(); await sync(); renderCards(); syncMarkers();
  }
  function primeSS() { for (const a of AREAS) if (!ss[a].hash) ss[a].hash = hashOf(A[a].get()); } // first time on this device for this world: nothing counts as a local change yet, so the repo's copy wins
  async function testGH() { readCfg(); if (!ghOK()) return setStatus('bad', 'Enter a world name, owner and repo first.'); try { const r = await fetch('https://api.github.com/repos/' + cfg.gh.owner + '/' + cfg.gh.repo, { headers: ghHdr() }); if (!r.ok) throw new Error(r.status + ' ' + ((await r.json().catch(() => ({}))).message || '')); const j = await r.json(); setStatus('ok', 'Repo found' + (j.permissions && j.permissions.push ? ', you can write.' : cfg.gh.token ? ', but this token cannot write.' : '. Add a token to write.')); } catch (e) { setStatus('bad', 'GitHub: ' + (e.message || e)); } }
  async function paintVersions() {
    const box = $('#mpVers'); if (!box) return; box.textContent = ''; if (!ghOK()) { box.append(el('div', { class: 'muted', text: 'Set a world name and repo to keep earlier versions.' })); return; }
    for (const area of AREAS) {
      let r; try { r = await ghGet(area, true); } catch (e) { box.append(el('div', { class: 'muted', text: area + ': ' + e.message })); continue; }
      const sec = el('div', {}, el('b', { text: area === 'world' ? 'World' : 'Cards' })); box.append(sec);
      const list = r && r.doc ? [{ cur: true, rev: r.doc.rev, updatedAt: r.doc.updatedAt, by: r.doc.by, data: r.doc.data }].concat(r.doc.history || []) : [];
      if (!list.length) sec.append(el('div', { class: 'muted', text: 'Nothing saved yet.' }));
      list.forEach((v) => sec.append(el('div', { class: 'ver' }, el('span', { text: (v.cur ? 'current · ' : '') + new Date(v.updatedAt).toLocaleString() + ' · ' + (v.by === device ? 'this device' : v.by || '?') }), v.cur ? null : el('button', { type: 'button', text: 'Restore', onclick: async () => { if (!confirm('Restore the ' + area + ' from ' + new Date(v.updatedAt).toLocaleString() + '? It becomes the newest version for every device.')) return; try { A[area].set(JSON.parse(JSON.stringify(v.data))); ss[area].hash = ''; ss[area].localAt = Date.now(); saveSS(); await push(area, undefined); saveSS(); setStatus('ok', 'Restored ' + area + '.'); paintVersions(); } catch (e) { setStatus('bad', 'Restore failed: ' + (e.message || e)); } } }))));
    }
  }

  /* ================= cards (the kanban card, in the palace) ================= */
  const COLORS = { gray: '#9ca3af', red: '#ef4444', yellow: '#eab308', green: '#22c55e', blue: '#3b82f6', orange: '#f97316', white: '#ffffff', black: '#111827' }, CN = Object.keys(COLORS);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : '');
  function md(s) { // small and safe: **bold**, `code`, "text--url" links, bare links, - lists, line breaks
    let h = esc(s || '');
    h = h.replace(/([^\s][^\n]*?)--(https?:\/\/[^\s<]+)/g, (m, t, u) => '<a href="' + safeUrl(u) + '" target="_blank" rel="noopener">' + t.trim() + '</a>').replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g, (m, a, u) => (m.includes('href=') ? m : a + '<a href="' + safeUrl(u) + '" target="_blank" rel="noopener">' + u + '</a>'));
    h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/^- (.*)$/gm, '• $1');
    return h;
  }
  const save = () => { try { localStorage.setItem(CK('cards'), JSON.stringify(cards)); } catch (e) {} touch('cards'); };
  const posOf = (stage) => { const l = cards.cards.filter((c) => c.stage === stage); return l.length ? Math.max(...l.map((c) => c.pos || 0)) + 1 : 0; };
  function newCard(stage) { const now = Date.now(), c = { id: uid(), title: '', stage: stage || cards.stages[0], room: '', statusColor: 'gray', tags: [], notes: '', pin: null, pos: posOf(stage || cards.stages[0]), createdAt: now, updatedAt: now }; cards.cards.push(c); open.add(c.id); save(); renderCards(); syncMarkers(); setTimeout(() => { const t = $('[data-f="title"]', dCards); if (t) t.focus(); }, 60); }
  function upd(c, patch, rerender) { Object.assign(c, patch, { updatedAt: Date.now() }); save(); if (rerender) renderCards(); syncMarkers(); }
  const open = new Set();
  function here() { const P = W.player, f = { x: -Math.sin(P.yaw), z: -Math.cos(P.yaw) }; return { x: +(P.x + f.x * 3).toFixed(2), y: +Math.max(1.2, P.y).toFixed(2), z: +(P.z + f.z * 3).toFixed(2) }; }
  function go(c) { if (!c.pin) return; const p = c.pin, P = W.player, dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz) || 1, tx = p.x - dx / d * 3, tz = p.z - dz / d * 3; YX.setPose({ x: tx, y: Math.max(P.y, 1.6), z: tz, yaw: Math.atan2(-(p.x - tx), -(p.z - tz)), pitch: 0 }); closeAll(); }
  function cardEl(c) {
    const e = el('div', { class: 'mpcard' + (open.has(c.id) ? ' open' : ''), draggable: 'true' });
    e.addEventListener('dragstart', (ev) => { e.classList.add('dragging'); ev.dataTransfer.setData('text/plain', c.id); }); e.addEventListener('dragend', () => e.classList.remove('dragging'));
    const dot = el('button', { class: 'sd', type: 'button', title: 'Status colour', style: 'background:' + COLORS[c.statusColor], onclick: () => upd(c, { statusColor: CN[(CN.indexOf(c.statusColor) + 1) % CN.length] }, true) });
    e.append(el('div', { class: 'line' }, dot, el('button', { class: 'ttl', type: 'button', text: c.title || '(untitled)', onclick: () => { open.has(c.id) ? open.delete(c.id) : open.add(c.id); renderCards(); } }), c.room ? el('span', { class: 'chip', text: c.room }) : null, el('button', { type: 'button', class: 'chip', title: c.pin ? 'Go to where this card is pinned' : 'Not pinned in the world', text: c.pin ? '📍' : '·', onclick: () => go(c) })));
    const det = el('div', { class: 'det' });
    const f = (label, node) => el('div', {}, el('label', { text: label }), node);
    const title = el('input', { 'data-f': 'title', value: c.title, onchange: (ev) => upd(c, { title: ev.target.value.trim() }, true) });
    const stage = el('select', { onchange: (ev) => upd(c, { stage: ev.target.value, pos: posOf(ev.target.value) }, true) }, cards.stages.map((s) => el('option', { value: s, text: s, ...(s === c.stage ? { selected: '' } : {}) })));
    const room = el('input', { value: c.room, placeholder: 'e.g. kitchen, fountain', onchange: (ev) => upd(c, { room: ev.target.value.trim() }, true) });
    const tags = el('input', { value: (c.tags || []).join(', '), placeholder: 'comma, separated', onchange: (ev) => upd(c, { tags: ev.target.value.split(',').map((t) => t.trim()).filter(Boolean) }, true) });
    const view = el('div', { class: 'md', 'data-placeholder': 'Notes or linktext--url' }); view.innerHTML = md(c.notes) || '<span style="color:#94a3b8">Notes or linktext--url</span>';
    const ta = el('textarea', { rows: '5', style: 'display:none', placeholder: 'Notes or linktext--url' }); ta.value = c.notes;
    view.onclick = (ev) => { if (ev.target.closest('a')) return; view.style.display = 'none'; ta.style.display = ''; ta.focus(); }; ta.onblur = () => { upd(c, { notes: ta.value }); view.innerHTML = md(c.notes) || '<span style="color:#94a3b8">Notes or linktext--url</span>'; ta.style.display = 'none'; view.style.display = ''; };
    det.append(f('Title', title), el('div', { class: 'row' }, f('Column', stage), f('Room', room)), f('Tags', tags), f('Notes', el('div', {}, view, ta)),
      el('div', { class: 'row', style: 'margin-top:8px;flex-wrap:wrap' }, el('button', { type: 'button', text: c.pin ? '📍 Re-pin here' : '📍 Pin here', onclick: () => upd(c, { pin: here() }, true) }), c.pin ? el('button', { type: 'button', text: 'Go there', onclick: () => go(c) }) : null, c.pin ? el('button', { type: 'button', text: 'Unpin', onclick: () => upd(c, { pin: null }, true) }) : null, el('span', { style: 'flex:1' }), el('button', { type: 'button', text: 'Archive', onclick: () => { cards.cards = cards.cards.filter((x) => x !== c); cards.archive.unshift(c); save(); renderCards(); syncMarkers(); } })),
      el('div', { class: 'muted', text: 'Updated ' + new Date(c.updatedAt).toLocaleString() }));
    e.append(det); return e;
  }
  function renderCards() {
    const b = $('.body', dCards); if (!b) return; b.style.padding = '0'; b.textContent = '';
    b.append(el('div', { class: 'row', style: 'padding:10px 12px 0' }, el('button', { class: 'pri', type: 'button', text: '+ New card', onclick: () => newCard() }), el('button', { type: 'button', text: '+ Column', onclick: () => { const n = (prompt('Column name') || '').trim(); if (n && !cards.stages.includes(n)) { cards.stages.push(n); save(); renderCards(); } } }), el('span', { class: 'muted', text: cards.cards.length + ' cards' })));
    const board = el('div', { class: 'mpb' });
    for (const s of cards.stages) {
      const col = el('div', { class: 'mpcol' }, el('h4', {}, el('span', { text: s }), el('button', { type: 'button', text: '+', style: 'padding:0 8px', onclick: () => newCard(s) })));
      col.addEventListener('dragover', (ev) => { ev.preventDefault(); col.classList.add('over'); }); col.addEventListener('dragleave', () => col.classList.remove('over'));
      col.addEventListener('drop', (ev) => { ev.preventDefault(); col.classList.remove('over'); const c = cards.cards.find((x) => x.id === ev.dataTransfer.getData('text/plain')); if (c) upd(c, { stage: s, pos: posOf(s) }, true); });
      cards.cards.filter((c) => c.stage === s).sort((a, b) => (a.pos || 0) - (b.pos || 0) || a.createdAt - b.createdAt).forEach((c) => col.append(cardEl(c)));
      board.append(col);
    }
    // cards whose column was removed elsewhere still show
    const orphan = cards.cards.filter((c) => !cards.stages.includes(c.stage)); if (orphan.length) { const col = el('div', { class: 'mpcol' }, el('h4', { text: 'Other' })); orphan.forEach((c) => col.append(cardEl(c))); board.append(col); }
    b.append(board);
    if (cards.archive.length) { const d = el('details', { style: 'padding:0 12px 30px' }, el('summary', { text: 'Archived (' + cards.archive.length + ')' })); cards.archive.forEach((c) => d.append(el('div', { class: 'ver' }, el('span', { text: c.title || '(untitled)' }), el('span', { class: 'row' }, el('button', { type: 'button', text: 'Restore', onclick: () => { cards.archive = cards.archive.filter((x) => x !== c); c.stage = cards.stages.includes(c.stage) ? c.stage : cards.stages[0]; cards.cards.push(c); upd(c, {}, true); } }), el('button', { type: 'button', text: 'Delete', onclick: () => { if (confirm('Delete for good?')) { cards.archive = cards.archive.filter((x) => x !== c); save(); renderCards(); } } }))))); b.append(d); }
  }
  dCards.style.width = 'min(840px,100vw)';

  /* ================= pinned cards standing in the world ================= */
  const markers = new Map(); let near = null;
  const chip = el('div', { id: 'mpNear', role: 'button' }); document.body.append(chip);
  chip.addEventListener('pointerdown', (e) => e.stopPropagation()); chip.onclick = (e) => { e.stopPropagation(); if (!near) return; exitLock(); open.clear(); open.add(near.id); renderCards(); closeAll(); dCards.classList.add('open'); };
  function label(text, color) { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.fillStyle = 'rgba(16,14,10,.82)'; g.fillRect(0, 0, 512, 128); g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(3, 3, 506, 122); g.fillStyle = '#f4efe6'; g.font = '600 44px system-ui,sans-serif'; g.textBaseline = 'middle'; let t = text || '(untitled)'; while (g.measureText(t).width > 470 && t.length > 4) t = t.slice(0, -2); if (t !== (text || '(untitled)')) t += '…'; g.fillText(t, 20, 66); const tex = new THREE.CanvasTexture(c); return tex; }
  function syncMarkers() {
    const sc = YX.three && YX.three.scene; if (!sc) return; const want = new Map(cards.cards.filter((c) => c.pin).map((c) => [c.id, c]));
    for (const [id, m] of markers) if (!want.has(id)) { sc.remove(m.g); markers.delete(id); }
    for (const [id, c] of want) {
      const sig = c.title + '|' + c.statusColor; let m = markers.get(id);
      if (m && m.sig !== sig) { sc.remove(m.g); markers.delete(id); m = null; }
      if (!m) { const g = new THREE.Group(), col = COLORS[c.statusColor === 'white' ? 'yellow' : c.statusColor]; const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color: col })); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: label(c.title, col), transparent: true, depthWrite: false })); sp.scale.set(2.4, 0.6, 1); sp.position.y = 0.7; g.add(gem, sp); sc.add(g); m = { g, gem, sig }; markers.set(id, m); }
      m.g.position.set(c.pin.x, c.pin.y, c.pin.z); m.c = c;
    }
  }
  const f0 = YX.onFrame;
  YX.onFrame = function (dt) {
    if (f0) f0.apply(this, arguments);
    if (!markers.size) { if (near) { near = null; chip.style.display = 'none'; } return; }
    const t = performance.now() / 1000, P = W.player; let best = null, bd = 6;
    for (const m of markers.values()) { m.gem.rotation.y = t * 1.2; m.g.children[1].position.y = 0.7 + Math.sin(t * 1.6) * 0.06; const d = Math.hypot(m.c.pin.x - P.x, m.c.pin.z - P.z); if (d < bd) { bd = d; best = m.c; } }
    if (best !== near) { near = best; chip.style.display = near ? 'block' : 'none'; if (near) chip.textContent = '📍 ' + (near.title || '(untitled)') + ' · tap to open'; }
  };

  /* ================= start ================= */
  loadSS(); ss._w = slug(cfg.world);
  setStatus('', ghOK() ? 'Waiting to sync…' : 'Saved on this device only. Open Config to name this world and connect GitHub.');
  const boot = () => { if (!(W.objs && W.objs.size)) return setTimeout(boot, 400); if (ghOK()) { primeSS(); saveSS(); sync(); } syncMarkers(); };
  if (document.readyState === 'complete') setTimeout(boot, 600); else window.addEventListener('load', () => setTimeout(boot, 600));
  MP.onChange(() => { syncMarkers(); });
  YX.palace = { sync, cards: () => cards, save };
})();
