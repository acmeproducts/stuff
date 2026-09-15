#!/usr/bin/env node
'use strict';
// SOT Turn 02 pre-base inference engine v1
// Clean lineage: synthetic fixture only; never mutates source data.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function sha256(s) { return crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex'); }

const fixture = [
 ['A','/primary/docs/tax.txt','tax-2025\n','canonical',true],
 ['B','/backup/docs/tax.txt','tax-2025\n','backup',true],
 ['C','/sync/tax-copy.txt','tax-2025\n','source',true],
 ['A','/primary/photos/a.jpg','photo-a\n','canonical',true],
 ['C','/phone/DCIM/a-renamed.jpg','photo-a\n','source',true],
 ['A','/primary/notes/same.txt','version-one\n','canonical',true],
 ['B','/backup/notes/same.txt','version-two\n','backup',true],
 ['A','/primary/music/song.flac','song\n','canonical',true],
 ['B','/backup/music/song.flac','song\n','backup',true],
 ['A','/primary/archive/manual.pdf','manual\n','canonical',true],
 ['B','/backup/archive/manual.pdf','manual\n','backup',true],
 ['C','/cloud/manual-copy.pdf','manual\n','source',true],
 ['A','/primary/work/report.docx','report\n','canonical',true],
 ['B','/backup/work/report.docx','report\n','backup',true],
 ['C','/cloud/report.docx','report\n','source',false],
 ['A','/primary/unique/a.bin','unique-a\n','canonical',true],
 ['B','/backup/unique/b.bin','unique-b\n','backup',true],
 ['C','/phone/unique/c.bin','unique-c\n','source',true],
 ['A','/primary/video/v.mp4','video\n','canonical',true],
 ['B','/backup/video/v.mp4','video\n','backup',true],
 ['C','/cloud/video/v.mp4','video\n','source',true],
 ['C','/phone/video/v2.mp4','video\n','source',true],
 ['A','/primary/ambiguous/x.dat','ambiguous\n','source',true],
 ['C','/cloud/ambiguous/x-copy.dat','ambiguous\n','source',true]
].map(([authority,p,content,role,available]) => ({authority,path:p,content,role,available,size:Buffer.byteLength(content),fingerprint:sha256(content)}));

function infer(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.fingerprint)) groups.set(item.fingerprint, []);
    groups.get(item.fingerprint).push(item);
  }
  const decisions = [];
  for (const [fingerprint, placements] of [...groups.entries()].sort(([a],[b]) => a.localeCompare(b))) {
    const available = placements.filter(p => p.available);
    const canon = available.filter(p => p.role === 'canonical');
    const assigned = new Map();
    if (placements.length === 1) {
      assigned.set(placements[0].path, 'KEEP');
    } else if (canon.length !== 1) {
      for (const p of placements) assigned.set(p.path, 'REVIEW');
    } else {
      assigned.set(canon[0].path, 'KEEP');
      const backups = available.filter(p => p.role === 'backup').sort((a,b) => a.path.localeCompare(b.path));
      if (backups.length) assigned.set(backups[0].path, 'PROTECT');
      for (const p of backups.slice(1)) assigned.set(p.path, 'REMOVE');
      for (const p of placements) if (!assigned.has(p.path)) assigned.set(p.path, p.available ? 'REMOVE' : 'REVIEW');
    }
    for (const p of placements.sort((a,b) => a.path.localeCompare(b.path))) {
      const decision = assigned.get(p.path);
      const reason = decision === 'KEEP' ? (placements.length === 1 ? 'unique content retained' : 'explicit canonical placement')
        : decision === 'PROTECT' ? 'required independent backup placement'
        : decision === 'REMOVE' ? 'exact-content placement redundant after canonical/protection requirements'
        : (!p.available ? 'placement evidence unavailable/stale; unsafe to decide' : 'no unique canonical placement established');
      decisions.push({fingerprint,authority:p.authority,path:p.path,size:p.size,available:p.available,role:p.role,decision,reason});
    }
  }
  decisions.sort((a,b) => a.fingerprint.localeCompare(b.fingerprint) || a.path.localeCompare(b.path));
  const counts = Object.fromEntries(['KEEP','PROTECT','REMOVE','REVIEW'].map(k => [k, decisions.filter(d => d.decision === k).length]));
  return {
    schema:'sot.consolidation-plan.v1',
    fixture:'turn02-known-truth-v1',
    summary:{placements:items.length,contentObjects:groups.size,observedBytes:items.reduce((n,x)=>n+x.size,0),uniqueContentBytes:[...groups.values()].reduce((n,g)=>n+g[0].size,0),duplicateGroups:[...groups.values()].filter(g=>g.length>1).length,reclaimableBytes:decisions.filter(d=>d.decision==='REMOVE').reduce((n,d)=>n+d.size,0),counts},
    decisions
  };
}

const plan = infer(fixture);
const canonical = JSON.stringify(plan, null, 2) + '\n';
const expectedPath = path.join(__dirname, 'SOT-TURN02-EXPECTED.json');
const outputPath = path.join(__dirname, 'SOT-TURN02-PLAN.json');
if (fs.existsSync(expectedPath)) {
  const expected = fs.readFileSync(expectedPath, 'utf8');
  if (expected !== canonical) {
    console.error('FAIL: inferred consolidation plan does not match predetermined truth');
    process.exit(1);
  }
}
if (process.argv.includes('--write')) fs.writeFileSync(outputPath, canonical);
console.log(`PASS placements=${plan.summary.placements} content=${plan.summary.contentObjects} duplicateGroups=${plan.summary.duplicateGroups} KEEP=${plan.summary.counts.KEEP} PROTECT=${plan.summary.counts.PROTECT} REMOVE=${plan.summary.counts.REMOVE} REVIEW=${plan.summary.counts.REVIEW} reclaimableBytes=${plan.summary.reclaimableBytes}`);
if (process.argv.includes('--json')) process.stdout.write(canonical);
