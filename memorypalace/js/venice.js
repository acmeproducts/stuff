/* Memory Palace · the AI host: Venice.ai first, then OpenRouter, then Anthropic (the same order of fallback DevStream uses).
   The world never waits for a key. It opens at once; keys live in the config drawer (palace.js) and stay in this browser only.
   Registers window.SW_HOST (see host.js) and window.MP (config shared with palace.js). Must load before host.js. */
(function () {
  'use strict';
  const CK = 'mp.cfg.v1';
  const PROV = {
    venice: { name: 'Venice', url: 'https://api.venice.ai/api/v1/chat/completions', models: 'https://api.venice.ai/api/v1/models', model: 'openai-gpt-oss-120b' },
    openrouter: { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', models: 'https://openrouter.ai/api/v1/models', model: 'anthropic/claude-sonnet-4.5' },
    anthropic: { name: 'Claude', url: 'https://api.anthropic.com/v1/messages', models: 'https://api.anthropic.com/v1/models', model: 'claude-sonnet-4-5' },
  };
  const DEFAULT = { world: '', order: ['venice', 'openrouter', 'anthropic'], providers: { venice: { key: '', model: PROV.venice.model }, openrouter: { key: '', model: PROV.openrouter.model }, anthropic: { key: '', model: PROV.anthropic.model } }, gh: { owner: '', repo: '', branch: 'main', token: '' } };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function load() {
    let c = {}; try { c = JSON.parse(localStorage.getItem(CK) || '{}'); } catch (e) {}
    const d = clone(DEFAULT);
    d.world = String(c.world || ''); if (Array.isArray(c.order)) d.order = c.order.filter((p) => PROV[p]).concat(Object.keys(PROV).filter((p) => !(c.order || []).includes(p)));
    for (const p in PROV) Object.assign(d.providers[p], (c.providers || {})[p] || {});
    Object.assign(d.gh, c.gh || {});
    return d;
  }
  const cfg = load();
  const listeners = [];
  const MP = (window.MP = { cfg, PROV, usage: [], onChange: (f) => listeners.push(f),
    save() { try { localStorage.setItem(CK, JSON.stringify(cfg)); } catch (e) {} for (const f of listeners) try { f(); } catch (e) { console.warn(e); } },
    chain() { return cfg.order.filter((p) => cfg.providers[p].key && cfg.providers[p].model); },
    hasAI() { return MP.chain().length > 0; } });

  /* ---------- one call to one provider, streamed ---------- */
  const strip = (t) => t.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').replace(/^\s+/, '');
  async function errOf(p, r) {
    let j = null; try { j = await r.json(); } catch (e) {}
    const m = (j && ((j.error && (j.error.message || j.error)) || j.message)) || ('HTTP ' + r.status);
    return { code: r.status === 429 ? 'rate_limited' : 'model_error', status: r.status, message: PROV[p].name + ' ' + r.status + ': ' + (typeof m === 'string' ? m : JSON.stringify(m)) };
  }
  async function readSSE(r, onData) {
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { value, done } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n'); let i;
      while ((i = buf.indexOf('\n\n')) >= 0) { const ev = buf.slice(0, i); buf = buf.slice(i + 2); for (const line of ev.split('\n')) if (line.startsWith('data:')) { const s = line.slice(5).trim(); if (s && s !== '[DONE]') { let j; try { j = JSON.parse(s); } catch (e) { continue; } onData(j); } } }
    }
  }
  async function callOne(p, msgs, opts) {
    const c = cfg.providers[p]; let text = '', truncated = false;
    const emit = (delta) => { text += delta; if (opts.onText) try { opts.onText({ text: strip(text), delta }); } catch (e) { console.warn(e); } };
    if (p === 'anthropic') {
      const sys = msgs.filter((m) => m.role === 'system').map((m) => m.content).join('\n'), rest = msgs.filter((m) => m.role !== 'system');
      const r = await fetch(PROV.anthropic.url, { method: 'POST', signal: opts.signal, headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: c.model, max_tokens: 16000, stream: true, ...(sys ? { system: sys } : {}), messages: rest }) });
      if (!r.ok) throw await errOf(p, r);
      await readSSE(r, (j) => { if (j.type === 'content_block_delta' && j.delta && j.delta.text) emit(j.delta.text); if (j.type === 'message_delta' && j.delta && j.delta.stop_reason === 'max_tokens') truncated = true; });
    } else {
      const body = { model: c.model, stream: true, max_tokens: 16000, messages: msgs };
      if (p === 'venice') body.venice_parameters = { include_venice_system_prompt: false };
      let r = await fetch(PROV[p].url, { method: 'POST', signal: opts.signal, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.key }, body: JSON.stringify(body) });
      if (!r.ok && r.status === 400) { const e = await errOf(p, r), cap = /maximum allowed is (\d+)/.exec(e.message); if (!cap) throw e; body.max_tokens = +cap[1]; r = await fetch(PROV[p].url, { method: 'POST', signal: opts.signal, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.key }, body: JSON.stringify(body) }); }
      if (!r.ok) throw await errOf(p, r);
      await readSSE(r, (j) => { const ch = j.choices && j.choices[0]; if (!ch) return; const d = ch.delta && ch.delta.content; if (d) emit(d); if (ch.finish_reason === 'length') truncated = true; });
    }
    return { text: strip(text), truncated };
  }
  async function sample(input, opts) {
    opts = opts || {}; const t0 = performance.now();
    const msgs = typeof input === 'string' ? [{ role: 'user', content: input }] : (input || []).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user', content: String(m.content) }));
    const chain = MP.chain(); if (!chain.length) throw { code: 'unavailable', message: 'No AI key yet. Open the config drawer.' };
    let last = null;
    for (const p of chain) {
      try {
        const out = await callOne(p, msgs, opts); if (!out.text.trim()) throw { code: 'model_error', message: PROV[p].name + ' returned nothing' };
        MP.usage.push({ provider: p, model: cfg.providers[p].model, ms: Math.round(performance.now() - t0), chars: out.text.length });
        return { text: out.text, truncated: out.truncated, modelTierApplied: PROV[p].name + ' · ' + cfg.providers[p].model };
      } catch (e) {
        if (e && (e.name === 'AbortError' || (opts.signal && opts.signal.aborted))) throw e;
        last = e && e.code ? e : { code: 'model_error', message: PROV[p].name + ': ' + ((e && e.message) || e) };
        MP.usage.push({ provider: p, error: last.message, ms: Math.round(performance.now() - t0) });
        if (MP.onFail) try { MP.onFail(p, last); } catch (x) {}
      }
    }
    throw last;
  }
  MP.sample = sample;
  MP.listModels = async function (p) { // fills the model list in the drawer
    const c = cfg.providers[p]; if (!c.key) throw new Error('Enter the ' + PROV[p].name + ' key first');
    const h = p === 'anthropic' ? { 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } : { authorization: 'Bearer ' + c.key };
    const r = await fetch(PROV[p].models + (p === 'venice' ? '?type=text' : ''), { headers: h }); if (!r.ok) throw new Error((await errOf(p, r)).message);
    const j = await r.json(); return (j.data || []).map((m) => m.id).filter(Boolean).sort();
  };

  /* ---------- voice: the browser's own speech recognition (no key, no cost) ---------- */
  function makeDict() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return null;
    const L = { p: [], f: [], s: [] }, emit = (k, e) => { for (const fn of L[k]) try { fn(e); } catch (x) { console.warn(x); } };
    let rec = null, stopping = false, finals = 0;
    const cjk = (s) => /^[⺀-鿿가-힯　-〿＀-￯]/.test(s);
    async function start(opt) {
      if (rec) await stop(); stopping = false; finals = 0;
      const r = (rec = new SR()); r.continuous = true; r.interimResults = true; r.lang = (opt && opt.language) || navigator.language || 'en-US';
      r.onresult = (ev) => {
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i], t = res[0].transcript.trim(); if (!t) continue; const sp = finals && !cjk(t) ? ' ' : '';
          if (res.isFinal) { emit('f', { text: sp + t }); finals++; } else emit('p', { text: sp + t });
        }
      };
      r.onerror = (ev) => { if (rec === r && !stopping) { rec = null; emit('s', { state: 'idle', reason: 'error' }); } };
      r.onend = () => { if (rec === r) { rec = null; emit('s', { state: 'idle', reason: stopping ? 'stopped' : 'error' }); } };
      emit('s', { state: 'starting' });
      try { r.start(); } catch (e) { rec = null; emit('s', { state: 'idle', reason: 'error' }); throw { code: 'unavailable', message: String(e) }; }
      r.onstart = () => emit('s', { state: 'listening' });
    }
    async function stop() { const r = rec; if (!r) return; stopping = true; emit('s', { state: 'finishing' }); try { r.stop(); } catch (e) {} await new Promise((res) => setTimeout(res, 700)); if (rec === r) { rec = null; emit('s', { state: 'idle', reason: 'stopped' }); } }
    return { start, stop, onPartial: (f) => L.p.push(f), onFinal: (f) => L.f.push(f), onState: (f) => L.s.push(f) };
  }

  /* ---------- saving files: an ordinary download ---------- */
  const downloads = { save: ({ filename, data }) => { const b = data instanceof Blob ? data : new Blob([data == null ? '' : data], { type: 'text/plain;charset=utf-8' }); const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = filename || 'download'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60e3); return Promise.resolve({ ok: true }); } };

  /* ---------- the host ---------- */
  let resolveAI; const aiP = new Promise((r) => { resolveAI = r; });
  if (MP.hasAI()) resolveAI(sample);
  let pending = '';
  MP.keysChanged = function () { // called by the drawer after keys are saved
    if (!MP.hasAI()) return;
    resolveAI(sample);
    try { if (window.YX && YX.mind && !YX.mind.sample) YX.mind.setSample(sample); } catch (e) {}
    if (pending) { const run = pending; pending = ''; setTimeout(() => { try { YX.mind.commit(run); } catch (e) {} }, 400); }
  };
  window.SW_HOST = {
    name: 'venice',
    ai: aiP,
    voice: makeDict(),
    save: downloads,
    video: null,
    gate: null,
    access: { open: (q) => { q = q || {}; if (q.text && q.what !== 'talk' && q.what !== 'voice') pending = String(q.text).slice(0, 300); if (MP.openDrawer) MP.openDrawer('ai', q.text); } },
    strings: {
      aiReady: ['AI 可用（Venice）', 'AI available (Venice first)'],
      aiLater: ['还没有 AI key：点右上角“设置”抽屉，只有当场生效的指令能用', 'No AI key yet: add one in the config drawer. Instant commands work meanwhile'],
      needTag: ['需要 key', 'needs key'],
    },
    usage: MP.usage,
    secret: true, // this page holds API keys: code written by the model runs in a worker with no network (ops.js)
  };
  // the world opens without a key: tell the page it is looking around, quietly
  const later = () => { if (MP.hasAI()) return; const tryIt = (n) => { if (window.YX && YX.hooks && YX.hooks.aiLater && YX.mind) { try { YX.hooks.aiLater(); } catch (e) {} } else if (n < 40) setTimeout(() => tryIt(n + 1), 250); }; tryIt(0); };
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();
