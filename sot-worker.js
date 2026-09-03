#!/usr/bin/env node
'use strict';

process.env.SOT_WORKER_PROCESS = '1';

async function main() {
  const [kind, id, projectToken] = process.argv.slice(2);
  if (!kind || !id || !projectToken) throw new Error('Usage: node sot-worker.js <index|execute> <job-id> <project-token>');
  if (kind !== 'index' && kind !== 'execute') throw new Error(`unknown worker kind: ${kind}`);
  process.env.SOT_WORKER_KIND = kind;

  const { withProjectLease } = require('./sot-coordinator.js');
  await withProjectLease(projectToken, { kind, operationId: id }, async owner => {
    process.env.SOT_COORDINATION_OPERATION_ID = owner.operation_id;
    const api = require('./sot-api.js');
    if (kind === 'index') await api._worker.processRun(id, projectToken);
    else await api._worker.executePlan(id);
  });
}

main().catch(error => {
  console.error(`SOT worker failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
