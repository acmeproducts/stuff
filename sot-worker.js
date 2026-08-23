#!/usr/bin/env node
'use strict';

process.env.SOT_WORKER_PROCESS = '1';

async function main() {
  const [kind, id, projectToken] = process.argv.slice(2);
  if (!kind || !id || !projectToken) throw new Error('Usage: node sot-worker.js <index|execute> <job-id> <project-token>');
  process.env.SOT_WORKER_KIND = kind;
  const api = require('./sot-api.js');
  if (kind === 'index') await api._worker.processRun(id, projectToken);
  else if (kind === 'execute') await api._worker.executePlan(id);
  else throw new Error(`unknown worker kind: ${kind}`);
}

main().catch(error => {
  console.error(`SOT worker failed: ${error.message}`);
  process.exitCode = 1;
});
