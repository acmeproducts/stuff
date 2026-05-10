import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const MODEL_PATH = 'bridge-lineage-timeline-model.json';
const SCOPE_PATH = '.';
const PT_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZoneName: 'short',
});

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 256 }).trimEnd();
}

function hashText(text) {
  return createHash('sha256').update(text).digest('hex');
}

function normalizePatch(text) {
  return text.replace(/\r\n/g, '\n').split('\n').filter((line) => !line.startsWith('index ')).map((line) => line.replace(/[ \t]+$/g, '')).join('\n').trim();
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
  const hunks = [];
  let currentFile = null;
  let currentHunk = null;
  for (const raw of patch.split('\n')) {
    if (raw.startsWith('diff --git ')) {
      const m = raw.match(/ b\/(.+)$/);
      currentFile = m ? m[1] : null;
      if (currentFile) changedFiles.push(currentFile);
      continue;
    }
    if (raw.startsWith('@@')) {
      currentHunk = { file: currentFile, header: raw, added: [], removed: [] };
      hunks.push(currentHunk);
      continue;
    }
    if (raw.startsWith('+++ ') || raw.startsWith('--- ')) continue;
    if (raw.startsWith('+')) {
      const line = raw.slice(1);
      addedLines.push(line);
      if (currentHunk) currentHunk.added.push(line);
      continue;
    }
    if (raw.startsWith('-')) {
      const line = raw.slice(1);
      removedLines.push(line);
      if (currentHunk) currentHunk.removed.push(line);
    }
  }
  return { changedFiles, addedLines, removedLines, hunks };
}

function classifyImpacts(patchSignals) {
  const corpus = `${patchSignals.addedLines.join('\n')}\n${patchSignals.removedLines.join('\n')}`;
  return impactMatchers.filter(([, re]) => re.test(corpus)).map(([name]) => name);
}

function summarizePatch(signals) {
  if (!signals.addedLines.length && !signals.removedLines.length) return 'No code diff from previous timeline entry.';
  const files = [...new Set(signals.changedFiles)];
  return `Patch touched ${files.length} file(s) (+${signals.addedLines.length}/-${signals.removedLines.length}); key paths: ${files.slice(0, 3).join(', ')}.`;
}

function formatPacific(iso) {
  return PT_FORMATTER.format(new Date(iso));
}

const commitLines = git(['log', '--reverse', '--date=iso-strict', '--pretty=format:%H%x09%h%x09%cI%x09%s', '--', SCOPE_PATH]).split('\n').filter(Boolean);
const commits = commitLines.map((line, idx) => {
  const [full, short, timestamp, ...subjectParts] = line.split('\t');
  return { seq: idx + 1, full, short, timestamp, message: subjectParts.join('\t').trim() };
});

const rows = commits.map((commit, idx) => {
  const previous = commits[idx - 1]?.full ?? null;
  const patch = previous
    ? git(['diff', `${previous}..${commit.full}`, '--patch', '--', SCOPE_PATH])
    : git(['show', commit.full, '--patch', '--pretty=format:', '--', SCOPE_PATH]);
  const nameStatusRaw = previous
    ? git(['diff', '--name-status', `${previous}..${commit.full}`, '--', SCOPE_PATH])
    : git(['show', '--name-status', '--pretty=format:', commit.full, '--', SCOPE_PATH]);

  const changed_paths = nameStatusRaw.split('\n').filter(Boolean).map((line) => {
    const parts = line.split('\t');
    const status = parts[0];
    if (status.startsWith('R')) return { status, from: parts[1], to: parts[2], rename: true };
    return { status, path: parts[1] };
  });

  const signals = extractPatchSignals(patch);
  const patchNormalized = normalizePatch(patch);
  const functional_impacts = classifyImpacts(signals);
  const evidenceHits = signals.hunks.flatMap((h) => {
    const corpus = `${h.added.join('\n')}\n${h.removed.join('\n')}`;
    const tags = impactMatchers.filter(([, re]) => re.test(corpus)).map(([name]) => name);
    return tags.length ? [{ file: h.file, hunk: h.header, tags, added_preview: h.added.slice(0, 2), removed_preview: h.removed.slice(0, 2) }] : [];
  });

  const primary_filename = changed_paths[0]?.to || changed_paths[0]?.path || 'N/A';
  const blob_refs = changed_paths.map((entry) => `${commit.full}:${entry.to || entry.path || 'N/A'}`);

  return {
    seq: commit.seq,
    timestamp: commit.timestamp,
    timestamp_pt: formatPacific(commit.timestamp),
    commit_hash: commit.full,
    commit_short: commit.short,
    commit_message: commit.message,
    code_fingerprint: hashText(patchNormalized),
    primary_filename,
    changed_paths,
    description_delta_from_previous: summarizePatch(signals),
    functional_impacts,
    diff_evidence: {
      files_changed: [...new Set(signals.changedFiles)],
      added_lines: signals.addedLines.length,
      removed_lines: signals.removedLines.length,
      tagged_hunks: evidenceHits,
    },
    patch_hash: hashText(patchNormalized),
    blob_refs,
    launch_ref: primary_filename,
    note: functional_impacts.length ? `Diff-evidenced impacts: ${functional_impacts.join(', ')}.` : 'No prioritized behavior category detected from patch evidence.',
    previous_commit_hash: previous,
  };
});

writeFileSync(MODEL_PATH, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} entries to ${MODEL_PATH}`);
