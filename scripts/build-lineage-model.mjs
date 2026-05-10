import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const MODEL_PATH = 'bridge-lineage-timeline-model.json';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 256 }).trimEnd();
}

function hashText(text) {
  return createHash('sha256').update(text).digest('hex');
}

function normalizePatch(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !line.startsWith('index '))
    .join('\n')
    .trim();
}

function classifyImpacts(diffText) {
  const t = diffText.toLowerCase();
  const hits = [];
  const categories = [
    ['normalization', /(normalize|normalization|canonical|trim\(|lowercase|uppercase|sanitize)/],
    ['transcription', /(transcrib|speech|stt|recognition|utterance|transcript)/],
    ['translation', /(translat|locale|language|i18n|thai|english|xlate)/],
    ['joining/rejoining flow', /(rejoin|join\b|reconnect|session|handshake|room|participant)/],
    ['call termination behavior', /(hangup|terminate|end call|disconnect|teardown|close\()/],
    ['compose strip focus behavior', /(compose|focus|cursor|caret|textarea|input field)/],
    ['ui/ux flow changes', /(button|modal|panel|tab|layout|render|view|screen|ux|ui)/],
    ['remediation/repair/fix behavior', /(fix|bug|repair|rollback|guard|fallback|recover|hotfix|patch)/],
  ];
  for (const [name, re] of categories) {
    if (re.test(t)) hits.push(name);
  }
  return hits;
}

function summarizePatch(patch) {
  if (!patch.trim()) return 'No code diff from previous timeline entry.';
  const fileSet = new Set();
  let added = 0;
  let removed = 0;
  for (const line of patch.split('\n')) {
    if (line.startsWith('diff --git ')) {
      const m = line.match(/ b\/(.+)$/);
      if (m) fileSet.add(m[1]);
      continue;
    }
    if (line.startsWith('+++ ') || line.startsWith('--- ') || line.startsWith('@@')) continue;
    if (line.startsWith('+')) added += 1;
    if (line.startsWith('-')) removed += 1;
  }
  const files = [...fileSet].slice(0, 3).join(', ');
  return `Patch touched ${fileSet.size} file(s) (+${added}/-${removed})${files ? `; key paths: ${files}` : ''}.`;
}

const commitLines = git(['log', '--date=iso-strict', '--pretty=format:%H%x09%h%x09%cI']).split('\n').filter(Boolean);
const commits = commitLines.map((line, idx) => {
  const [full, short, timestamp] = line.split('\t');
  return { seq: idx + 1, full, short, timestamp };
});

const rows = commits.map((commit, idx) => {
  const previous = commits[idx + 1]?.full ?? null;
  const patch = previous ? git(['diff', `${previous}..${commit.full}`, '--', '.']) : git(['show', commit.full, '--pretty=format:', '--', '.']);
  const nameStatusRaw = previous ? git(['diff', '--name-status', `${previous}..${commit.full}`, '--', '.']) : git(['show', '--name-status', '--pretty=format:', commit.full, '--', '.']);
  const changed_paths = nameStatusRaw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('\t');
      const status = parts[0];
      if (status.startsWith('R')) {
        return { status, from: parts[1], to: parts[2] };
      }
      return { status, path: parts[1] };
    });
  const code_fingerprint = hashText(normalizePatch(patch));
  const blob_refs = changed_paths.slice(0, 8).map((entry) => (entry.to ? `${commit.full}:${entry.to}` : `${commit.full}:${entry.path}`));
  const primary_filename = changed_paths[0]?.to || changed_paths[0]?.path || 'N/A';
  const impacts = classifyImpacts(patch);

  return {
    seq: commit.seq,
    timestamp: commit.timestamp,
    commit_hash: commit.full,
    commit_short: commit.short,
    code_fingerprint,
    primary_filename,
    changed_paths,
    description_delta_from_previous: summarizePatch(patch),
    functional_impacts: impacts,
    blob_refs,
    launch_ref: primary_filename,
    note: impacts.length ? `Inferred impacts: ${impacts.join(', ')}.` : 'No prioritized behavior category detected from diff hunks.',
    previous_commit_hash: previous,
  };
});

writeFileSync(MODEL_PATH, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} entries to ${MODEL_PATH}`);
