/* Guest access: everything a guest may touch is decided here, in one place.
   A guest only ever reaches projects/<slug>/ and devstream/guests/<slug>/ in the owner's repo. */

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function makeSlug(name, rand) {
  const base = String(name || 'guest').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'guest';
  return base + '-' + rand;
}

/* a path is acceptable only if it is plain: no dots-dots, no encoded or doubled slashes, no backslashes */
export function plainPath(p) {
  p = String(p == null ? '' : p);
  if (!p || p.length > 300) return '';
  if (/[\\\0%]|(^|\/)\.\.?(\/|$)|\/\/|^\/|\/$/.test(p)) return '';
  if (/[\u0000-\u001f]/.test(p)) return '';
  return p;
}
export const codeDir = slug => 'projects/' + slug + '/';
export const stateDir = slug => 'devstream/guests/' + slug + '/';
export function inGuestArea(slug, p) {
  p = plainPath(p); if (!p) return false;
  return p.startsWith(codeDir(slug)) || p.startsWith(stateDir(slug));
}

export function enginesOf(vault) {
  const e = {};
  if (vault.vkey && vault.vmodel) e.venice = vault.vmodel;
  if (vault.orkey && vault.ormodel) e.openrouter = vault.ormodel;
  if (vault.akey) e['anthropic-direct'] = 'claude-sonnet-4-6';
  return e;
}

/* turn a guest's job request into a safe runner request using the owner's stored keys */
export function guestRequest(slug, vault, body) {
  const job = { ...(body && body.job || {}) }, post = { ...(body && body.post || {}) }, bad = [];
  if (!body || !body.key || typeof body.key !== 'string' || body.key.length > 200) return { ok: false, error: 'missing job details' };
  const under = (label, p, dir, required) => {
    if (p == null || p === '') { if (required) bad.push(label); return; }
    const c = plainPath(p); if (!c || !c.startsWith(dir)) bad.push(label);
  };
  under('code file', job.codeFile, codeDir(slug), true);
  under('plan file', job.planFile, codeDir(slug), true);
  under('input file', job.inputFile, codeDir(slug), false);
  under('thread file', post.threadPath, stateDir(slug) + 'threads/', true);
  if (post.sotPath !== stateDir(slug) + 'devstream-status.json') bad.push('status file');
  if (bad.length) return { ok: false, error: 'not allowed: ' + bad.join(', ') };
  job.images = (job.images || []).filter(im => im && (im.b64 || (im.path && inGuestArea(slug, im.path))));
  job.ghRefs = (job.ghRefs || []).filter(r => r && r.owner === vault.owner && r.repo === vault.repo && inGuestArea(slug, r.path));
  post.pendTexts = [];
  job.threadModel = null;
  const avail = enginesOf(vault), have = Object.keys(avail);
  let chain = (job.chain || []).filter(e => avail[e]); if (!chain.length) chain = have;
  if (!chain.length) return { ok: false, error: 'the owner has not saved any AI key to share yet' };
  job.chain = chain; job.threadEngine = chain.includes(job.threadEngine) ? job.threadEngine : chain[0];
  job.budgetMs = Math.min(+job.budgetMs || 360000, 360000);
  const cfg = { owner: vault.owner, repo: vault.repo, branch: vault.branch, pat: vault.pat, vkey: vault.vkey, vmodel: vault.vmodel, orkey: vault.orkey, ormodel: vault.ormodel, akey: vault.akey };
  return { ok: true, req: { key: body.key, cfg, job, post } };
}

/* decide whether a GitHub API call from a guest is allowed; returns {kind,...} or {error} */
export function guestGhRule(slug, vault, method, rest, search) {
  const m = /^repos\/([^/]+)\/([^/]+)\/(.+)$/.exec(rest);
  if (!m || m[1] !== vault.owner || m[2] !== vault.repo) return { error: 'wrong repository' };
  const tail = m[3];
  if (tail.startsWith('contents/')) {
    let path;
    try { path = tail.slice(9).split('/').map(decodeURIComponent).join('/'); } catch (e) { return { error: 'bad path' }; }
    if (!inGuestArea(slug, path)) return { error: 'outside your folder' };
    if (!['GET', 'PUT', 'DELETE'].includes(method)) return { error: 'not allowed' };
    return { kind: 'contents', path };
  }
  if (method === 'GET' && /^git\/trees\/[\w.\-\/]+$/.test(tail)) return { kind: 'tree' };
  if (method === 'GET' && tail === 'commits') {
    const p = (search.get('path') || '');
    if (!inGuestArea(slug, p)) return { error: 'outside your folder' };
    return { kind: 'commits-list' };
  }
  if (method === 'GET' && /^commits\/[0-9a-f]{7,40}$/.test(tail)) return { kind: 'commit-parents' };
  return { error: 'not allowed' };
}
