#!/usr/bin/env node
import { readFileSync } from 'fs';
const workflow = readFileSync(process.argv[2] || new URL('../../.github/workflows/deploy-relay.yml', import.meta.url), 'utf8');
const wrangler = readFileSync(process.argv[3] || new URL('../wrangler.jsonc', import.meta.url), 'utf8');
let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + e.message); } }
function assert(v, m) { if (!v) throw new Error(m); }
test('D1 deploys the governed relay entrypoint and existing Durable Object class', () => {
  const cfg = JSON.parse(wrangler); assert(cfg.main === 'worker-talk.js', 'wrong entrypoint'); assert(cfg.durable_objects.bindings.some(b => b.name === 'TALK_SESSION' && b.class_name === 'TalkSession'), 'binding missing');
});
test('D2 live manifest is fail-closed on exact R10.6', () => assert(workflow.includes("d.v!=='R10.6'") && !workflow.includes("d.v!=='4.2'"), 'manifest gate stale'));
for (const line of ['foreground-grant=ok', 'push-post=ok status-', 'bare-hangup-missed=ok', 'retry-dedupe=ok', 'invite-once=ok', 'device-scope=ok', 'deepgram-token=ok', 'turn-credentials=ok']) {
  test('D live probe requires ' + line, () => assert(workflow.includes("grep -q") && workflow.includes(line), line + ' not required'));
}
test('D10 probe never prints opaque authorization, provider token, or TURN password', () => {
  assert(!/console\.log\([^\n]*(\.auth\b|\.access_token\b|\.iceServers\b|\.credential\b)/.test(workflow), 'secret-shaped probe output');
});
test('D11 status publication runs even on failure and retains exact probe evidence', () => {
  assert(workflow.includes('if: always()') && workflow.includes('/tmp/ws-check.txt') && workflow.includes('talkbridge/DEPLOY-STATUS.txt'), 'status evidence missing');
});
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
