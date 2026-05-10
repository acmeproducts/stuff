import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const MODEL_PATH = 'bridge-lineage-timeline-model.json';
const SCOPE_PATH = '.';

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
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
}

const impactMatchers = [
  ['normalization', /(normalize|normalization|canonical|trim\(|sanitize|dedupe|clean)/i],
  ['transcription', /(transcrib|speech|stt|recognition|utterance|transcript)/i],
  ['translation', /(translat|locale|language|i18n|thai|english|xlate)/i],
  ['joining/rejoining flow', /(rejoin|join\b|reconnect|session|handshake|room|participant)/i],
  ['call termination behavior', /(hangup|terminate|end call|disconnect|teardown|close\(|leave call)/i],
  ['compose strip focus behavior', /(compose|focus|cursor|caret|textarea|input field|contenteditable)/i],
  ['ui/ux flow changes', /(button|modal|panel|tab|layout|render|view|screen|ux|ui|timeline|explorer)/i],
  ['remediation/repair/fix behavior', /(fix|bug|repair|rollback|guard|fallback|recover|hotfix|patch)/i],
];

function extractPatchSignals(patch) {
  const changedFiles = [];
  const addedLines = [];
  const removedLines = [];
  for (const raw of patch.split('\n')) {
    if (raw.startsWith('diff --git ')) {
      const m = raw.match(/ b\/(.+)$/);
      if (m) changedFiles.push(m[1]);
      continue;
    }
    if (raw.startsWith('+++ ') || raw.startsWith('--- ') || raw.startsWith('@@')) continue;
    if (raw.startsWith('+')) addedLines.push(raw.slice(1));
    if (raw.startsWith('-')) removedLines.push(raw.slice(1));
  }
  return { changedFiles, addedLines, removedLines };
}

function classifyImpacts(patch) {
  const { addedLines, removedLines } = extractPatchSignals(patch);
  const corpus = `${addedLines.join('\n')}\n${removedLines.join('\n')}`;
  const hits = [];
  for (const [name, re] of impactMatchers) {
    if (re.test(corpus)) hits.push(name);
  }
  return hits;
}

function summarizePatch(patch) {
  if (!patch.trim()) return 'No code diff from previous timeline entry.';
  const { changedFiles, addedLines, removedLines } = extractPatchSignals(patch);
  const files = [...new Set(changedFiles)];
  const actionHints = [];
  if (/(normalize|sanitize|canonical|trim\()/i.test(addedLines.join('\n'))) actionHints.push('adds normalization logic');
  if (/(transcrib|transcript|speech|recognition)/i.test(addedLines.join('\n'))) actionHints.push('adjusts transcription handling');
  if (/(translat|locale|language|i18n)/i.test(addedLines.join('\n'))) actionHints.push('updates translation/language flow');
  if (/(rejoin|reconnect|join\b|session|participant)/i.test(addedLines.join('\n'))) actionHints.push('changes joining/rejoining behavior');
  if (/(hangup|terminate|disconnect|end call|teardown)/i.test(`${addedLines.join('\n')}\n${removedLines.join('\n')}`)) actionHints.push('modifies call termination behavior');
  if (/(compose|focus|cursor|caret|textarea|contenteditable)/i.test(`${addedLines.join('\n')}\n${removedLines.join('\n')}`)) actionHints.push('modifies compose focus behavior');
  if (/(button|panel|layout|render|timeline|explorer|tab)/i.test(`${addedLines.join('\n')}\n${removedLines.join('\n')}`)) actionHints.push('updates UI/UX flow');
  if (/(fix|guard|fallback|recover|rollback|patch)/i.test(addedLines.join('\n'))) actionHints.push('applies remediation/fix logic');

  const changedSummary = `Patch touched ${files.length} file(s) (+${addedLines.length}/-${removedLines.length})`;
  const keyPaths = files.slice(0, 3).join(', ');
  const behavior = actionHints.length ? ` Behavior: ${actionHints.slice(0, 3).join('; ')}.` : '';
  return `${changedSummary}${keyPaths ? `; key paths: ${keyPaths}.` : '.'}${behavior}`;
}

const commitLines = git(['log', '--date=iso-strict', '--pretty=format:%H%x09%h%x09%cI', '--', SCOPE_PATH]).split('\n').filter(Boolean);

const commits = commitLines.map((line, idx) => {
  const [full, short, timestamp] = line.split('\t');
  return { seq: idx + 1, full, short, timestamp };
});

const rows = commits.map((commit, idx) => {
  const previous = commits[idx + 1]?.full ?? null;
  const patch = previous
    ? git(['diff', `${previous}..${commit.full}`, '--patch', '--', SCOPE_PATH])
    : git(['show', commit.full, '--patch', '--pretty=format:', '--', SCOPE_PATH]);
  const nameStatusRaw = previous
    ? git(['diff', '--name-status', `${previous}..${commit.full}`, '--', SCOPE_PATH])
    : git(['show', '--name-status', '--pretty=format:', commit.full, '--', SCOPE_PATH]);

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
  const primary_filename = changed_paths[0]?.to || changed_paths[0]?.path || 'N/A';
  const functional_impacts = classifyImpacts(patch);
  const blob_refs = changed_paths.map((entry) => {
    const path = entry.to || entry.path;
    return path ? `${commit.full}:${path}` : `${commit.full}:N/A`;
  });

  return {
    seq: commit.seq,
    timestamp: commit.timestamp,
    commit_hash: commit.full,
    commit_short: commit.short,
    code_fingerprint,
    primary_filename,
    changed_paths,
    description_delta_from_previous: summarizePatch(patch),
    functional_impacts,
    blob_refs,
    launch_ref: primary_filename,
    note: functional_impacts.length
      ? `Inferred impacts from patch hunks: ${functional_impacts.join(', ')}.`
      : 'No prioritized behavior category detected from patch hunks.',
    previous_commit_hash: previous,
  };
});

writeFileSync(MODEL_PATH, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} entries to ${MODEL_PATH}`);
