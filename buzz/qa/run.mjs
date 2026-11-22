// Headless harness for buzz/index.html.
// Serves the repository root, maps the three.js CDN URL to a local copy, and opens the page in Chrome.
// Needs: playwright (PLAYWRIGHT_DIR, default /opt/npm-tools/node_modules/), Chrome (CHROME, default /usr/bin/google-chrome),
// and three@0.163.0 installed next to this file (`npm i three@0.163.0 --prefix buzz/qa`, not committed).
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(process.env.PLAYWRIGHT_DIR || '/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');

const ROOT = path.resolve(HERE, '../..');
const THREE_PATH = process.env.THREE_MODULE || path.join(HERE, 'node_modules/three/build/three.module.js');
const THREE_SRC = fs.readFileSync(THREE_PATH);
fs.mkdirSync(path.join(HERE, 'shots'), { recursive: true });
process.chdir(HERE);
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(0);
const port = server.address().port;

export async function open(opts = {}) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 915, height: 412 }, deviceScaleFactor: opts.dpr || 1, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message + '\n' + (e.stack || '')));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js', (r) => r.fulfill({ body: THREE_SRC, contentType: 'application/javascript' }));
  await page.goto(`http://localhost:${port}/buzz/${opts.query || ''}`);
  await page.waitForFunction(() => window.__buzz && window.__buzz.G.state === 'menu', null, { timeout: 60000 }).catch(() => { });
  return { browser, page, errors, close: async () => { await browser.close(); server.close(); } };
}
