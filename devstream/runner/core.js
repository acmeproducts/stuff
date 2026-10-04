/* DevStream runner core — the same run the page does (read plan+code, ask the AI, check, commit, reply),
   written so it can run in a Cloudflare Worker or in Node tests. All network goes through io.fetch. */
import * as acorn from 'acorn';

const te = new TextEncoder(), td = new TextDecoder();
export function b64enc(s) { const u = te.encode(s); let b = ''; for (let i = 0; i < u.length; i += 0x8000) b += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(b); }
export function b64dec(s) { const b = atob(String(s).replace(/\n/g, '')), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return td.decode(u); }
export const msgSig = m => (m.role || '') + '|' + (m.ts || '') + '|' + ((m.text || '').slice(0, 120));

export function friendlyError(m) {
  m = String(m || '');
  if (/spend limit|402|insufficient credit|out of credit/i.test(m)) return 'The AI account is out of credit or at its spending limit.';
  if (/timed out|timeout|time limit|stalled/i.test(m)) return 'The AI took too long and was stopped.';
  if (/Unexpected output path/i.test(m)) return 'The plan points at a file that is not this project\'s build file.';
  if (/^Not saved|would break|patch rejected|patch mode:|no usable file content|edit blocks need|SEARCH\/REPLACE/i.test(m)) return 'The AI\'s change would have broken your app, so I did not save it. Your app is unchanged.';
  if (/Plan checkpoint|Plan read-back/i.test(m)) return 'The plan update did not pass its safety check.';
  if (/Failed to fetch|network/i.test(m)) return 'I could not reach the AI service.';
  if (/401|authentication/i.test(m)) return 'The AI key was rejected.';
  return 'I couldn\'t finish that one. Your app is unchanged.';
}
export function stripPlanTags(b) { return String(b || '').replace(/^\s*<\/?plan>[ \t]*\n?/i, '').replace(/\n?[ \t]*<\/?plan>\s*$/i, '').trim() + '\n'; }

export function parseAgent(text) {
  let summary = 'Done.', target = 'NONE';
  const sm = text.match(/^SUMMARY:\s*(.+)$/m); if (sm) summary = sm[1].trim();
  const tm = text.match(/^TARGET:\s*(.+)$/m); if (tm) target = tm[1].trim();
  let state = ''; const stm = text.match(/^STATE:\s*(.+)$/m); if (stm) state = stm[1].trim();
  let body = text;
  if (stm) body = text.slice(text.indexOf(stm[0]) + stm[0].length);
  else if (tm) body = text.slice(text.indexOf(tm[0]) + tm[0].length);
  else if (sm) body = text.slice(text.indexOf(sm[0]) + sm[0].length);
  body = body.trim();
  if (body.startsWith('```')) { body = body.replace(/^```[a-zA-Z]*\n?/, ''); const i = body.lastIndexOf('```'); if (i > -1) body = body.slice(0, i); body = body.trim(); }
  return { summary, target, body, state };
}

export function applyPatchBlocks(original, body) {
  const re = /<{5,}\s*SEARCH\s*\n([\s\S]*?)\n={5,}\s*\n([\s\S]*?)\n>{5,}\s*REPLACE/g;
  let m, n = 0, out = original; const fails = [];
  while ((m = re.exec(body))) {
    n++; const find = m[1], rep = m[2]; const first = out.indexOf(find);
    if (first < 0) { fails.push('block ' + n + ': SEARCH not found'); continue; }
    if (out.indexOf(find, first + 1) >= 0) { fails.push('block ' + n + ': SEARCH not unique'); continue; }
    out = out.slice(0, first) + rep + out.slice(first + find.length);
  }
  return { text: out, applied: n - fails.length, total: n, fails };
}

/* same checks as the page's checkBuild; Workers forbid new Function, so scripts are parsed with acorn */
export function checkBuild(prevText, newText) {
  const scripts = []; newText.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (m, attrs, code) => {
    const ty = (/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs) || [])[1] || '';
    if (!/\bsrc\s*=/i.test(attrs) && (!ty || /^(text|application)\/(javascript|ecmascript)$/i.test(ty))) scripts.push(code); return m;
  });
  for (let i = 0; i < scripts.length; i++) {
    try { acorn.parse(scripts[i], { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true }); }
    catch (e) { return 'a script in it has a syntax error (' + String(e.message).replace(/\s*\(\d+:\d+\)\s*$/, '').slice(0, 60) + ')'; }
  }
  if (prevText) {
    const defs = t => { const s = new Set(); t.replace(/(?:^|[\s;{}])(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g, (m, n) => { s.add(n); return m; }); return s; };
    const before = defs(prevText), after = defs(newText), lost = [];
    before.forEach(n => { if (after.has(n)) return; if (new RegExp('(^|[^\\w$.])' + n.replace(/\$/g, '\\$') + '\\s*\\(').test(newText)) lost.push(n); });
    if (lost.length) return 'it is missing ' + (lost.length > 1 ? 'functions' : 'the function') + ' still being used: ' + lost.slice(0, 5).join(', ');
  }
  return '';
}

/* ---- GitHub ---- */
function gh(io, cfg) {
  const base = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/';
  const hdr = accept => ({ Authorization: 'Bearer ' + cfg.pat, Accept: accept || 'application/vnd.github+json', 'User-Agent': 'devstream-runner' });
  const get = async (path, repoBase) => {
    const url = (repoBase || base) + 'contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(cfg.branch) + '&_ds=' + Date.now();
    const r = await io.fetch(url, { headers: hdr() });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('GitHub ' + r.status + ' reading ' + path);
    const j = await r.json();
    let content = j.content ? b64dec(j.content) : '';
    if (!content && j.size > 0) {
      const r2 = await io.fetch(url, { headers: hdr('application/vnd.github.raw+json') });
      if (!r2.ok) throw new Error('raw fallback ' + r2.status + ' on ' + path);
      content = await r2.text();
    }
    return { content, sha: j.sha };
  };
  const put = async (path, content, message, sha) => {
    const body = { message, content: b64enc(content), branch: cfg.branch }; if (sha) body.sha = sha;
    const r = await io.fetch(base + 'contents/' + path.split('/').map(encodeURIComponent).join('/'), { method: 'PUT', headers: { ...hdr(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { let msg = ''; try { msg = (await r.json()).message; } catch (e) { } throw new Error('GitHub ' + r.status + (msg ? ': ' + msg : '') + ' (' + path + ')'); }
    const j = await r.json();
    return { sha: j.content.sha, commit: j.commit && j.commit.sha };
  };
  return { get, put, hdr };
}

/* read-modify-write with retry; mutate must be idempotent (it is re-applied to the freshest copy on a collision) */
async function rmw(io, g, path, message, mutate, { json = true, create = null } = {}) {
  let last;
  for (let attempt = 1; attempt <= 12; attempt++) {
    const f = await g.get(path);
    let cur = f ? f.content : create;
    if (cur === null || cur === undefined) throw new Error('missing ' + path);
    let next;
    if (json) { const o = JSON.parse(cur || '{}'); const r = mutate(o); if (r === false) return null; next = JSON.stringify(o, null, 1); }
    else { next = mutate(cur); if (next === false || next === null) return null; }
    try { return await g.put(path, next, message, f ? f.sha : null); }
    catch (e) { last = e; if (!/\b409\b|\b422\b/.test(String(e.message))) throw e; await io.sleep(Math.min(150 * attempt, 1200)); }
  }
  throw last;
}

/* ---- AI calls (same behaviour as the page's worker) ---- */
async function readSSE(resp, idleMs, ac, onText) {
  const reader = resp.body.getReader(), dec = new TextDecoder(); let buf = '', text = '', rlen = 0;
  const next = () => new Promise((res, rej) => { const t = setTimeout(() => { try { ac.abort(); } catch (e) { } rej(new Error('stalled: no output for ' + Math.round(idleMs / 1000) + 's')); }, idleMs); reader.read().then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); }); });
  for (; ;) {
    const r = await next();
    if (r.done) break;
    buf += dec.decode(r.value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (line.indexOf('data:') !== 0) continue;
      const d = line.slice(5).trim();
      if (d === '[DONE]') return text;
      let j; try { j = JSON.parse(d); } catch (e) { continue; }
      if (j.error) throw new Error('stream error: ' + String(j.error.message || j.error).slice(0, 200));
      const dl = j.choices && j.choices[0] && j.choices[0].delta;
      if (dl && typeof dl.content === 'string') text += dl.content;
      if (dl && typeof dl.reasoning_content === 'string') rlen += dl.reasoning_content.length;
      if (onText && dl) onText(text.length, rlen);
    }
  }
  return text;
}
async function streamChat(io, ctl, url, key, payload, idleMs, budgetMs, onText) {
  const ac = new AbortController(), tot = setTimeout(() => ac.abort(), budgetMs);
  ctl.aborts.add(ac);
  try {
    if (ctl.stopped) throw new Error('Interrupted by user');
    const r = await io.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(Object.assign({}, payload, { stream: true })), signal: ac.signal });
    if (!r.ok) { let j = {}; try { j = await r.json(); } catch (e) { } return { ok: false, status: r.status, j }; }
    if (!/event-stream/.test(r.headers.get('content-type') || '')) { const j = await r.json(); return { ok: true, text: j.choices[0].message.content }; }
    const text = await readSSE(r, idleMs, ac, onText);
    if (!text) throw new Error('empty response from model');
    return { ok: true, text };
  } catch (e) {
    if (ctl.stopped) throw new Error('Interrupted by user');
    if (ac.signal.aborted && !/stalled/.test(String(e.message))) throw new Error('exceeded ' + Math.round(budgetMs / 1000) + 's time limit for this call');
    throw e;
  } finally { clearTimeout(tot); ctl.aborts.delete(ac); }
}
async function tfetch(io, ctl, url, opts, ms) {
  const ac = new AbortController(); const to = setTimeout(() => ac.abort(), ms || 25000); ctl.aborts.add(ac);
  try { return await io.fetch(url, { ...opts, signal: ac.signal }); }
  catch (e) { if (ctl.stopped) throw new Error('Interrupted by user'); throw new Error((e.name === 'AbortError' ? 'timeout ' + Math.round((ms || 25000) / 1000) + 's' : e.message) + ' on ' + url.split('/')[2]); }
  finally { clearTimeout(to); ctl.aborts.delete(ac); }
}
async function callEngine(io, ctl, cfg, eng, model, system, history, user, images, webSearch, maxTok, budgetMs, onText) {
  images = images || [];
  if (eng === 'anthropic-direct') {
    const parts = [...images.map(im => ({ type: 'image', source: { type: 'base64', media_type: im.type, data: im.b64 } })), { type: 'text', text: user }];
    const r = await tfetch(io, ctl, 'https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.akey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: model || 'claude-sonnet-4-6', max_tokens: 64000, system, messages: [...history, { role: 'user', content: parts }], ...(webSearch ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }] } : {}) })
    }, Math.min(budgetMs || 300000, 300000));
    const j = await r.json();
    if (!r.ok) throw new Error('anthropic ' + r.status + ': ' + ((j.error && j.error.message) || 'unknown'));
    return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  }
  const M = { venice: { url: 'https://api.venice.ai/api/v1/chat/completions', key: cfg.vkey, model: model || cfg.vmodel }, openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', key: cfg.orkey, model: model || cfg.ormodel } }[eng];
  if (!M) throw new Error('unknown engine ' + eng);
  if (!M.key) throw new Error(eng + ' key not configured');
  if (!M.model) throw new Error(eng + ' model not selected');
  const userContent = (images.length && eng === 'openrouter') ? [{ type: 'text', text: user }, ...images.map(im => ({ type: 'image_url', image_url: { url: 'data:' + im.type + ';base64,' + im.b64 } }))]
    : (images.length ? user + '\n\n(Note: ' + images.length + ' image attachment(s) provided but this engine is text-only here: ' + images.map(i => i.name).join(', ') + ')' : user);
  const payload = { model: (eng === 'openrouter' && webSearch && !/:online$/.test(M.model)) ? M.model + ':online' : M.model, max_tokens: maxTok || 64000, messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: userContent }] };
  if (eng === 'venice' && webSearch) payload.venice_parameters = { enable_web_search: 'auto', include_search_results_in_stream: false };
  const budget = Math.max(15000, Math.min(budgetMs || 240000, 240000));
  let res = await streamChat(io, ctl, M.url, M.key, payload, 90000, budget, onText);
  if (!res.ok) {
    const j = res.j || {}, msg = String((j.error && (j.error.message || j.error)) || '');
    const cap = msg.match(/maximum allowed is (\d+)/);
    if (cap) {
      payload.max_tokens = parseInt(cap[1], 10);
      res = await streamChat(io, ctl, M.url, M.key, payload, 90000, budget, onText);
      if (!res.ok) { const j2 = res.j || {}; throw new Error(eng + ' ' + res.status + ': ' + ((j2.error && (j2.error.message || j2.error)) || 'unknown')); }
      return res.text;
    }
    throw new Error(eng + ' ' + res.status + ': ' + msg);
  }
  return res.text;
}

/* one engine attempt: gather context, call the chain, parse (mirrors the page's job worker) */
async function runEngine(io, ctl, g, req, instr) {
  const { cfg, job } = req, log = io.log;
  const { codeFile, planFile, inputFile, system, history, chain, threadModel, threadEngine } = job;
  const t0 = Date.now(), budget = job.budgetMs || 360000; let lastP = 0;
  const onText = (n, r) => { const t = Date.now(); if (t - lastP > 700) { lastP = t; log(null, false, n, r); } };
  const images = [];
  for (const im of (job.images || [])) {
    if (im.b64) { images.push({ name: im.name, type: im.type, b64: im.b64 }); continue; }
    log('loading image ' + im.name);
    const r = await tfetch(io, ctl, 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + im.path + '?ref=' + cfg.branch, { headers: g.hdr() }, 25000);
    if (r.ok) { const j = await r.json(); images.push({ name: im.name, type: im.type, b64: (j.content || '').replace(/\n/g, '') }); }
  }
  let ctx = ''; const ingested = [];
  for (const ref of (job.ghRefs || [])) {
    log('fetching ' + ref.owner + '/' + ref.repo + '/' + ref.path);
    try {
      const r = await tfetch(io, ctl, 'https://api.github.com/repos/' + ref.owner + '/' + ref.repo + '/contents/' + ref.path + '?ref=' + ref.branch, { headers: g.hdr('application/vnd.github.raw+json') }, 25000);
      if (r.ok) { const txt = await r.text(); ctx += 'REFERENCED FILE ' + ref.url + ':\n<ref>\n' + txt.slice(0, 400000) + '\n</ref>\n\n'; ingested.push({ path: ref.path, k: Math.round(txt.length / 1000) }); log('fetched ' + ref.path + ' (' + Math.round(txt.length / 1000) + 'k)'); }
      else log('could not fetch ' + ref.path + ' (' + r.status + ')', true);
    } catch (e) { if (ctl.stopped) throw e; log('fetch failed ' + ref.path + ': ' + e.message, true); }
  }
  log('reading plan ' + planFile);
  const pc = await g.get(planFile);
  if ((!pc || !pc.content) && !job.allowPlanCreate) throw new Error('Master plan ' + planFile + ' is missing or empty. Restore it before running this thread.');
  if (pc && pc.content) ctx += 'PLAN file ' + planFile + ':\n<plan>\n' + pc.content + '\n</plan>\n\n';
  if (job.projectContext) ctx += 'OTHER TABS IN THIS PROJECT (frozen, for context only):\n<tabs>\n' + job.projectContext + '\n</tabs>\n\n';
  log('reading code ' + codeFile);
  const cc = await g.get(codeFile);
  if (cc && cc.content) ctx += 'CODE file ' + codeFile + ':\n<code>\n' + cc.content + '\n</code>\n\n';
  else if (inputFile) { const ic = await g.get(inputFile); if (ic && ic.content) ctx += 'INPUT codebase ' + inputFile + ':\n<code>\n' + ic.content + '\n</code>\n\n'; }
  let text = null, usedEng = null, usedModel = null; const fails = [];
  const dflt = e => e === 'venice' ? cfg.vmodel : e === 'openrouter' ? cfg.ormodel : 'claude-sonnet-4-6';
  for (const eng of chain) {
    if (ctl.stopped) throw new Error('Interrupted by user');
    const remaining = budget - (Date.now() - t0);
    if (fails.length && remaining < 45000) { fails.push(eng + ': skipped, run time budget spent'); log('run time budget spent — not trying ' + eng, true); break; }
    log('engine ' + eng + ' · ' + (eng === threadEngine && threadModel ? threadModel : dflt(eng)) + ' call (' + Math.round((ctx.length + instr.length) / 1000) + 'k chars in)' + (job.webSearch ? ' +web search' : '') + '…');
    try {
      const selected = eng === threadEngine ? threadModel : null;
      text = await callEngine(io, ctl, cfg, eng, selected, system, history, ctx + 'Instructions:\n' + instr, images, job.webSearch, undefined, remaining, onText);
      usedEng = eng; usedModel = selected || dflt(eng);
      if (eng === 'openrouter' && job.webSearch && !/:online$/.test(usedModel)) usedModel += ':online';
      break;
    } catch (err) { if (ctl.stopped) throw err; fails.push(eng + ': ' + err.message); log('engine ' + eng + ' failed: ' + err.message, true); }
  }
  if (text === null) throw new Error('all engines failed: ' + fails.join(' | '));
  log('engine done (' + Math.round(text.length / 1000) + 'k chars out), parsing');
  const p = parseAgent(text);
  return { ...p, usedEng, usedModel, raw: text.slice(0, 400), ingested };
}

/* the plan is a log the app writes: one table row per run */
async function appendPlanLog(io, g, planFile, tab, result, what, commit) {
  try {
    const c = s => String(s || '').replace(/[|\r\n]+/g, ' ').trim().slice(0, 140), head = '\n## RUN LOG (written by DevStream)\n| Date | Tab | Result | What | Commit |\n|---|---|---|---|---|\n';
    const f = await g.get(planFile); if (!f || !f.content.trim()) return;
    await rmw(io, g, planFile, 'devstream: run log ' + tab, cur => {
      let body = cur.replace(/\s+$/, '\n'); if (!/^## RUN LOG/m.test(body)) body += head;
      return body + '| ' + io.now().slice(0, 16).replace('T', ' ') + ' | ' + c(tab) + ' | ' + c(result) + ' | ' + c(what) + ' | ' + (commit ? String(commit).slice(0, 7) : '') + ' |\n';
    }, { json: false });
  } catch (e) { io.log('plan log append failed: ' + String(e.message || e).slice(0, 100), true); }
}

async function recordFailure(io, g, req, patchSot, msg) {
  const { key, job, post } = req;
  const emsg = { role: 'agent', text: 'Failed: ' + msg, coachText: friendlyError(msg) + ' Your request is saved — tap Run again.', ts: io.now() };
  try {
    await rmw(io, g, post.threadPath, 'devstream: agent error ' + key, d => {
      d.messages = d.messages || []; const last = d.messages[d.messages.length - 1];
      if (last && last.role === 'agent' && last.text === emsg.text) return false; d.messages.push(emsg);
    });
  } catch (e2) { }
  await appendPlanLog(io, g, job.planFile, post.tab, 'failed', friendlyError(msg));
  try { await patchSot('devstream: ' + key + ' -> error', o => { const t = o.threads[key]; if (!t) return false; Object.assign(t, { state: 'error', finishedAt: io.now(), error: msg }); delete t.remote; }); } catch (e2) { }
}
/* used when the runner itself was restarted mid-run: say so instead of re-running */
export async function failJob(req, io, msg) {
  io = { sleep: ms => new Promise(r => setTimeout(r, ms)), now: () => new Date().toISOString(), log: () => { }, ...io };
  const g = gh(io, req.cfg);
  await recordFailure(io, g, req, (m, fn) => rmw(io, g, req.post.sotPath, m, o => { o.threads = o.threads || {}; o.projects = o.projects || {}; return fn(o); }), msg);
}

/* run one job from start to finish. req = {key, cfg, job, post}; io = {fetch, now, sleep, log(line,err,chars,rchars)}; ctl = {stopped, aborts:Set} */
export async function runPipeline(req, io, ctl) {
  ctl = ctl || { stopped: false, aborts: new Set() };
  io = { sleep: ms => new Promise(r => setTimeout(r, ms)), now: () => new Date().toISOString(), log: () => { }, ...io };
  const { key, cfg, job, post } = req;
  const g = gh(io, cfg);
  const { codeFile, planFile } = job;
  const repoFull = cfg.owner + '/' + cfg.repo;
  const pendSigs = new Set(post.pendSigs || []);
  const patchSot = async (msg, fn) => rmw(io, g, post.sotPath, msg, o => { o.threads = o.threads || {}; o.projects = o.projects || {}; return fn(o); });
  let hb = null;
  const stopHb = () => { if (hb) { clearInterval(hb); hb = null; } };
  hb = setInterval(() => { patchSot('devstream: heartbeat', o => { const t = o.threads[key]; if (!t || t.state !== 'executing') return false; t.heartbeat = io.now(); }).catch(() => { }); }, io.heartbeatMs || 90000);
  const interruptedErr = e => !ctl.timedOut && (ctl.stopped || /Interrupted by user/.test(String(e && e.message)));
  try {
    let attemptNo = 0, feedback = '', result = null;
    for (; ;) {
      try {
        const instr = feedback ? job.instr + '\n\nYOUR PREVIOUS ATTEMPT WAS REJECTED BEFORE ANYTHING WAS SAVED. Reason: ' + feedback + '\nRedo the same work and avoid that problem. If you rewrite a whole file, keep every existing function that is still used. If you use edit blocks, copy the SEARCH text exactly from the current file.' : job.instr;
        let res = await runEngine(io, ctl, g, req, instr);
        if (ctl.stopped) throw new Error('Interrupted by user');
        if (res.target && res.target !== 'NONE' && res.target !== planFile && res.target !== codeFile && !(post.pendTexts || []).some(t => t.includes(res.target))) {
          io.log('model targeted ' + res.target + ' — re-asking once with the correct target ' + codeFile, true);
          res = await runEngine(io, ctl, g, req, instr + '\n\nCORRECTION: your previous reply used TARGET: ' + res.target + ', which is not allowed. The only files you may write are "' + codeFile + '" (code) and "' + planFile + '" (plan). Redo the same work with TARGET: ' + codeFile + '.');
          if (ctl.stopped) throw new Error('Interrupted by user');
        }
        let { summary, target, body, state, usedEng, usedModel } = res;
        let commit = null, testUrl = post.testUrl || '', reply = summary, moved = false;
        if (usedEng !== job.threadEngine) reply = '[fallback: ' + usedEng + ' · ' + usedModel + ' — ' + job.threadEngine + ' failed]\n' + reply;
        const followedContract = /^SUMMARY:/m.test(res.raw || '') || target !== 'NONE' || summary !== 'Done.';
        const ing = res.ingested || [];
        let planWritten = false;
        if (target !== 'NONE') {
          if (target !== planFile && target !== codeFile && !(post.pendTexts || []).some(t => t.includes(target))) throw new Error('Unexpected output path ' + target + '; no file was written.');
          if (target === planFile) body = stripPlanTags(body);
          const prev = await g.get(target);
          const prevLen = prev ? prev.content.length : 0;
          if ((job.patchMode && target === codeFile) || /^<{7} SEARCH$/m.test(body)) {
            if (!prev) throw new Error('edit blocks need the existing file ' + target);
            const pr = applyPatchBlocks(prev.content, body);
            if (!pr.total) throw new Error('patch mode: engine returned no SEARCH/REPLACE blocks');
            if (pr.fails.length) throw new Error('patch rejected — ' + pr.fails.join('; ') + ' — nothing written');
            body = pr.text;
            reply += '\n▸ Patch mode: ' + pr.applied + ' edit block(s) applied';
          } else if (body.length < 80) throw new Error('agent returned no usable file content for ' + target);
          if (target !== planFile && /\.html?$/i.test(target)) { const bad = checkBuild(prev ? prev.content : '', body); if (bad) throw new Error('Not saved — the new ' + target + ' would break: ' + bad + '. The working version was left as it was'); }
          if (ctl.stopped) throw new Error('Interrupted by user');
          io.log('committing ' + target + ' (' + Math.round(body.length / 1000) + 'k)');
          const saved = await g.put(target, body, 'devstream agent: ' + key + ' — ' + summary.slice(0, 60), prev ? prev.sha : null);
          commit = saved.commit;
          reply += '\n✓ Wrote ' + target + ' — ' + Math.round(body.length / 1000) + 'k chars' + (prevLen ? ' (was ' + Math.round(prevLen / 1000) + 'k)' : ' (new file)') + '\nDiff: https://github.com/' + repoFull + '/commit/' + commit;
          if (target === planFile) { planWritten = true; reply += '\nPlan: https://github.com/' + repoFull + '/blob/' + cfg.branch + '/' + planFile; }
          else {
            if (target !== codeFile) { moved = true; reply += '\n▸ Builds now land in ' + target + ' (plan stays ' + planFile + ')'; }
            testUrl = 'https://' + cfg.owner + '.github.io/' + cfg.repo + '/' + target + '?cb=' + Date.now(); reply += '\nTest: ' + testUrl;
            await appendPlanLog(io, g, planFile, post.tab, 'built ' + target, summary, commit);
          }
        } else {
          reply = (body || reply) + '\nℹ No file written — answer only.';
          if (!followedContract) reply += '\n! Engine ignored the build contract (no SUMMARY/TARGET markers) — consider a stronger model for this thread (tap the engine chip).';
        }
        if (ing.length) reply = '▸ Ingested from GitHub: ' + ing.map(i => i.path + ' (' + i.k + 'k)').join(', ') + '\n' + reply;
        if (ing.length && /can(?:no|')t\s+(?:access|retrieve|fetch|read|open)|unable to (?:access|retrieve|fetch|read)|don'?t have access/i.test(reply))
          reply += '\n! The engine claimed it cannot access GitHub, but ' + ing.length + ' file(s) WERE supplied in its context — that is a model failure, not a fetch failure. Switch this thread to a stronger model via the engine chip.';
        if (state) reply += '\n— ' + state;
        if (ctl.stopped) throw new Error('Interrupted by user');
        const nextStep = (state || '').match(/next:\s*([^|]+)/i)?.[1]?.trim();
        const coachText = target === planFile ? summary + '\nI’ve saved where we’re headed. What would you like to try first?'
          : target !== 'NONE' ? summary + '\nPlay it: ' + testUrl + (nextStep ? '\nYou could try ' + nextStep + '.' : '\nWhat would you like to change next?')
            : (body || summary);
        const amsg = { role: 'agent', text: reply, coachText, summary, ts: io.now(), engine: usedEng, model: usedModel };
        if (commit) amsg.commit = commit; if (target !== 'NONE') amsg.target = target; if (state) amsg.state = state;
        io.log('saving reply');
        await rmw(io, g, post.threadPath, 'devstream: agent reply ' + key, d => {
          d.messages = d.messages || [];
          d.messages.forEach(m => { if (m.role === 'user' && pendSigs.has(msgSig(m))) { m.status = 'done'; delete m.forcedTarget; } });
          if (!d.messages.some(m => m.role === 'agent' && m.ts === amsg.ts && m.text === amsg.text)) d.messages.push(amsg);
          d.lastState = state || d.lastState;
          if (moved) d.outputFile = target;
        });
        stopHb();
        await patchSot('devstream: ' + key + ' -> ok', o => {
          const t = o.threads[key]; if (!t) return false;
          Object.assign(t, { state: 'ok', finishedAt: io.now(), lastCommit: commit || t.lastCommit, testUrl, error: '' }); delete t.remote;
          if (moved) { t.file = target; if (o.projects[post.project]) o.projects[post.project].mainFile = target; }
          if (planWritten && o.projects[post.project]) o.projects[post.project].planExists = true;
        });
        result = { ok: true, summary, target, commit, testUrl, usedEng, usedModel };
        break;
      } catch (re) {
        const retryable = /patch rejected|patch mode:|no usable file content|would break|Unexpected output path|edit blocks need/i.test(String(re.message)) && !interruptedErr(re);
        if (!retryable || attemptNo >= 2) throw re;
        attemptNo++; feedback = String(re.message).replace(/\s+/g, ' ').slice(0, 300);
        io.log('checking the result and trying again');
      }
    }
    return result;
  } catch (e) {
    stopHb();
    if (interruptedErr(e)) {
      try { await patchSot('devstream: ' + key + ' -> idle', o => { const t = o.threads[key]; if (!t) return false; Object.assign(t, { state: 'idle', finishedAt: io.now(), error: '' }); delete t.remote; }); } catch (e2) { }
      return { ok: false, interrupted: true, error: 'Interrupted by user' };
    }
    const msg = ctl.timedOut ? 'timeout: the build took longer than the time limit and was stopped' : String(e && e.message || e);
    await recordFailure(io, g, req, patchSot, msg);
    return { ok: false, error: msg };
  } finally { stopHb(); }
}

/* a token is accepted only if it can push to the configured owner's repo */
export async function verifyAccess(fetchFn, cfg, allowedOwner) {
  if (!cfg || !cfg.pat || !cfg.owner || !cfg.repo) return 'missing GitHub settings';
  if (allowedOwner && cfg.owner.toLowerCase() !== String(allowedOwner).toLowerCase()) return 'this runner only serves ' + allowedOwner;
  const r = await fetchFn('https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo, { headers: { Authorization: 'Bearer ' + cfg.pat, Accept: 'application/vnd.github+json', 'User-Agent': 'devstream-runner' } });
  if (!r.ok) return 'GitHub rejected the token (' + r.status + ')';
  const j = await r.json();
  if (!(j.permissions && j.permissions.push)) return 'the token cannot push to ' + cfg.owner + '/' + cfg.repo;
  return '';
}
