const path = require('node:path');
const {createRequire} = require('node:module');
let runtime;
try { runtime = createRequire(require.resolve('playwright/package.json')); }
catch { runtime = createRequire(path.join(process.env.MN_NODE_MODULES || 'C:/Users/Support/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', 'playwright/package.json')); }
module.exports = {runtime, ...runtime('./index.js'), babel: runtime('./lib/transform/babelBundle.js')};
