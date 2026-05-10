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
  return text.replace(/\r\n/g, '\n').split('\n').filter((line) => !line.startsWith('index ')).join('\n').trim();
}

function parsePatchEvidence(patch) {
  const files = [];
  const hunks = [];
  let currentFile = null;
  let currentHunk = null;

  for (const line of patch.split('\n')) {
    if (line.startsWith('diff --git ')) {
      const m = line.match(/ a\/(.+) b\/(.+)$/);
      currentFile = m ? m[2] : null;
      if (currentFile) files.push(currentFile);
      currentHunk = null;
      continue;
    }
    if (line.startsWith('@@')) {
      currentHunk = { file: currentFile || 'unknown', header: line, adds: [], removes: [] };
      hunks.push(currentHunk);
      continue;
    }
    if (!currentHunk) continue;
    if (line.startsWith('+') && !line.startsWith('+++')) currentHunk.adds.push(line.slice(1).trim());
    if (line.startsWith('-') && !line.startsWith('---')) currentHunk.removes.push(line.slice(1).trim());
  }

  return { files, hunks };
}

function classifyImpacts(patch) {
  const t = patch.toLowerCase();
  const categories = [
    ['normalization', /(normalize|normalization|canonical|sanitize|trim\(|\bslug\b)/],
    ['transcription', /(transcrib|speech|stt|utterance|transcript)/],
    ['translation', /(translate|translation|language|locale|thai|english|xlate)/],
    ['joining/rejoining flow', /(join\b|rejoin|reconnect|participant|session|room|peer)/],
    ['call termination behavior', /(hangup|terminate|end call|disconnect|teardown|call end)/],
    ['compose strip focus behavior', /(compose|focus|caret|cursor|textarea|input\.focus|selectionstart)/],
    ['ui/ux flow changes', /(button|tab|panel|modal|layout|screen|render|click|toggle|navbar)/],
    ['remediation/repair/fix behavior', /(fix|bug|repair|rollback|recover|fallback|guard|hotfix|patch)/],
  ];
  return categories.filter(([, re]) => re.test(t)).map(([name]) => name);
}

function summarizeDelta(evidence) {
  if (evidence.hunks.length === 0) return 'No code diff from previous commit.';
  const addCount = evidence.hunks.reduce((n, h) => n + h.adds.length, 0);
  const delCount = evidence.hunks.reduce((n, h) => n + h.removes.length, 0);
  const hunks = evidence.hunks.slice(0, 3).map((h) => {
    const add = h.adds.find(Boolean) || 'no added line sample';
    const del = h.removes.find(Boolean) || 'no removed line sample';
    return `${h.file} ${h.header} | + ${add} | - ${del}`;
  });
  return `Changed ${new Set(evidence.files).size} file(s), ${evidence.hunks.length} hunk(s), +${addCount}/-${delCount}. ${hunks.join(' || ')}`;
}

const commits = git(['log', '--date=iso-strict', '--pretty=format:%H%x09%h%x09%cI'])
  .split('\n')
  .filter(Boolean)
  .map((line, idx) => {
    const [full, short, timestamp] = line.split('\t');
    return { seq: idx + 1, full, short, timestamp };
  });

const rows = commits.map((commit, idx) => {
  const previous = commits[idx + 1]?.full ?? null;
  const patch = previous ? git(['diff', `${previous}..${commit.full}`, '--', '.']) : git(['show', commit.full, '--pretty=format:', '--', '.']);
  const evidence = parsePatchEvidence(patch);
  const nameStatusRaw = previous ? git(['diff', '--name-status', `${previous}..${commit.full}`, '--', '.']) : git(['show', '--name-status', '--pretty=format:', commit.full, '--', '.']);

  const changed_paths = nameStatusRaw.split('\n').filter(Boolean).map((line) => {
    const parts = line.split('\t');
    const status = parts[0];
    if (status.startsWith('R')) return { status, from: parts[1], to: parts[2] };
    return { status, path: parts[1] };
  });

  const primary_filename = changed_paths[0]?.to || changed_paths[0]?.path || 'N/A';
  const impacts = classifyImpacts(patch);
  const patchNormalized = normalizePatch(patch);

  return {
    seq: commit.seq,
    timestamp: commit.timestamp,
    commit_hash: commit.full,
    commit_short: commit.short,
    code_fingerprint: hashText(patchNormalized),
    primary_filename,
    changed_paths,
    description_delta_from_previous: summarizeDelta(evidence),
    functional_impacts: impacts,
    blob_refs: changed_paths.slice(0, 16).map((entry) => (entry.to ? `${commit.full}:${entry.to}` : `${commit.full}:${entry.path}`)),
    launch_ref: primary_filename,
    note: impacts.length ? `Diff-evidenced impacts: ${impacts.join(', ')}.` : 'No prioritized behavior category detected from diff hunks.',
    previous_commit_hash: previous,
    diff_evidence: evidence.hunks.slice(0, 12).map((h) => ({ file: h.file, hunk: h.header, add: h.adds[0] || '', remove: h.removes[0] || '' })),
    patch_hash: hashText(patchNormalized),
  };
});

writeFileSync(MODEL_PATH, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} entries to ${MODEL_PATH}`);
