import { plainPath, inGuestArea, guestRequest, guestGhRule, makeSlug, enginesOf } from '../guest.js';
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 200)); } };
const S = 'sam-ab12';
const vault = { owner: 'acmeproducts', repo: 'stuff', branch: 'main', pat: 'ghp_owner', vkey: 'vk', vmodel: 'm1', orkey: '', ormodel: '', akey: '' };

/* paths */
ok('own code folder allowed', inGuestArea(S, 'projects/sam-ab12/game.html'));
ok('own state folder allowed', inGuestArea(S, 'devstream/guests/sam-ab12/threads/x.json'));
for (const bad of ['projects/sam-ab12/../other/x.html', 'projects/sam-ab12/..', 'projects/sam-ab123/x.html', 'projects/sam-ab1/x.html', 'projects/other/x.html', 'devstream/devstream-status.json', 'devstream/threads/x.json', '/projects/sam-ab12/x', 'projects//sam-ab12/x', 'projects/sam-ab12/a%2e%2e/x', 'projects\\sam-ab12\\x', 'earth.html', '.github/workflows/x.yml', 'projects/sam-ab12/', '']) ok('refused: ' + JSON.stringify(bad), !inGuestArea(S, bad), bad);
ok('slug is plain', /^[a-z0-9]+(-[a-z0-9]+)*$/.test(makeSlug('Sam O\'Neil!!', 'x9k2')) && makeSlug('Sam O\'Neil!!', 'x9k2') === 'samoneil-x9k2');

/* GitHub rules */
const R = (m, rest, q = '') => guestGhRule(S, vault, m, rest, new URLSearchParams(q));
ok('contents in own folder', R('GET', 'repos/acmeproducts/stuff/contents/projects/sam-ab12/a.html').kind === 'contents');
ok('contents with a space', R('PUT', 'repos/acmeproducts/stuff/contents/projects/sam-ab12/my%20game.html').path === 'projects/sam-ab12/my game.html');
ok('encoded dots refused', !!R('GET', 'repos/acmeproducts/stuff/contents/projects/sam-ab12/%2e%2e/%2e%2e/earth.html').error);
ok('double-encoded refused', !!R('GET', 'repos/acmeproducts/stuff/contents/projects/sam-ab12/%252e%252e/x').error);
ok("owner's file refused", !!R('GET', 'repos/acmeproducts/stuff/contents/earth.html').error);
ok("owner's status refused", !!R('GET', 'repos/acmeproducts/stuff/contents/devstream/devstream-status.json').error);
ok('other repo refused', !!R('GET', 'repos/acmeproducts/perf/contents/projects/sam-ab12/a.html').error);
ok('other owner refused', !!R('GET', 'repos/evil/stuff/contents/projects/sam-ab12/a.html').error);
ok('PATCH refused', !!R('PATCH', 'repos/acmeproducts/stuff/contents/projects/sam-ab12/a.html').error);
ok('tree allowed (filtered later)', R('GET', 'repos/acmeproducts/stuff/git/trees/main').kind === 'tree');
ok('tree cannot be written', !!R('POST', 'repos/acmeproducts/stuff/git/trees/main').error);
ok('commit list only for own paths', R('GET', 'repos/acmeproducts/stuff/commits', 'path=projects/sam-ab12/a.html').kind === 'commits-list' && !!R('GET', 'repos/acmeproducts/stuff/commits', 'path=earth.html').error && !!R('GET', 'repos/acmeproducts/stuff/commits', '').error);
ok('commit lookup reduced to parents', R('GET', 'repos/acmeproducts/stuff/commits/abcdef1234').kind === 'commit-parents');
ok('other API areas refused', ['repos/acmeproducts/stuff/actions/secrets', 'repos/acmeproducts/stuff/pulls', 'repos/acmeproducts/stuff/git/refs', 'user', 'repos/acmeproducts/stuff/collaborators', 'repos/acmeproducts/stuff/commits/main'].every(p => !!R('GET', p).error));

/* job requests */
const good = () => ({ key: 'P/a', job: { codeFile: 'projects/sam-ab12/a.html', planFile: 'projects/sam-ab12/a-plan.md', inputFile: null, images: [{ b64: 'x', name: 'i', type: 'image/png' }, { path: 'earth.html', name: 'steal' }], ghRefs: [{ owner: 'acmeproducts', repo: 'stuff', path: 'earth.html', url: 'u' }, { owner: 'acmeproducts', repo: 'stuff', path: 'projects/sam-ab12/b.html', url: 'v' }], chain: ['venice', 'openrouter'], threadModel: 'expensive-model', threadEngine: 'openrouter', budgetMs: 9e9, instr: 'x' }, post: { threadPath: 'devstream/guests/sam-ab12/threads/P__a.json', sotPath: 'devstream/guests/sam-ab12/devstream-status.json', project: 'P', tab: 'a', pendSigs: ['s'], pendTexts: ['write to earth.html'] } });
let r = guestRequest(S, vault, good());
ok('good job accepted', r.ok, r);
ok('owner keys used, not from the page', r.req.cfg.vkey === 'vk' && r.req.cfg.pat === 'ghp_owner');
ok('model cannot be chosen', r.req.job.threadModel === null);
ok('engine limited to what the owner shared', JSON.stringify(r.req.job.chain) === '["venice"]' && r.req.job.threadEngine === 'venice');
ok('free-form target paths disabled', r.req.post.pendTexts.length === 0);
ok('images outside the folder dropped', r.req.job.images.length === 1 && r.req.job.images[0].b64 === 'x');
ok('referenced files outside the folder dropped', r.req.job.ghRefs.length === 1 && r.req.job.ghRefs[0].path === 'projects/sam-ab12/b.html');
ok('budget clamped', r.req.job.budgetMs <= 360000);
for (const [label, mut] of [['code file elsewhere', b => { b.job.codeFile = 'earth.html'; }], ['plan file traversal', b => { b.job.planFile = 'projects/sam-ab12/../x.md'; }], ['other guest', b => { b.job.codeFile = 'projects/zed-9999/a.html'; }], ['state path elsewhere', b => { b.post.sotPath = 'devstream/devstream-status.json'; }], ['thread path elsewhere', b => { b.post.threadPath = 'devstream/threads/P__a.json'; }], ['input file elsewhere', b => { b.job.inputFile = 'earth.html'; }], ['no key', b => { delete b.key; }]]) {
  const b = good(); mut(b); ok('refused: ' + label, !guestRequest(S, vault, b).ok);
}
ok('no AI key shared -> clear message', /not saved any AI key/.test(guestRequest(S, { ...vault, vkey: '' }, good()).error));
ok('engines list', JSON.stringify(Object.keys(enginesOf({ ...vault, orkey: 'k', ormodel: 'm' }))) === '["venice","openrouter"]');
console.log(pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
