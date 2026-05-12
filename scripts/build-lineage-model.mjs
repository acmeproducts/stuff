import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const START_COMMIT = 'ec23f33';
const MODEL_PATH = 'bridge-lineage-timeline-model.json';
const FILE_GLOB = 'bridge*';

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
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 128 }).trimEnd();
}

function sha(text) {
  return createHash('sha256').update(text).digest('hex');
}

function normalizePatch(patch) {
  return patch
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !line.startsWith('index '))
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
}

function toPT(iso) {
  return PT_FORMATTER.format(new Date(iso));
}

function parseNameStatus(raw) {
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, p1, p2] = line.split('\t');
      if (status.startsWith('R')) {
        return { status, rename: true, from: p1, to: p2 };
      }
      return { status, path: p1 };
    });
}

function parsePatch(patch) {
  const files = [];
  const added = [];
  const removed = [];
  const hunks = [];
  let file = null;
  let hunk = null;

  for (const line of patch.split('\n')) {
    if (line.startsWith('diff --git ')) {
      const m = line.match(/ b\/(.+)$/);
      file = m ? m[1] : null;
      if (file) files.push(file);
      hunk = null;
      continue;
    }
    if (line.startsWith('@@')) {
      hunk = { file, header: line, added: [], removed: [] };
      hunks.push(hunk);
      continue;
    }
    if (line.startsWith('+++ ') || line.startsWith('--- ')) continue;
    if (line.startsWith('+')) {
      const value = line.slice(1);
      added.push(value);
      if (hunk) hunk.added.push(value);
      continue;
    }
    if (line.startsWith('-')) {
      const value = line.slice(1);
      removed.push(value);
      if (hunk) hunk.removed.push(value);
    }
  }

  return { files, added, removed, hunks };
}

function deriveDescription(currentSignals, previousSignals) {
  const currentFiles = [...new Set(currentSignals.files)].sort();
  const prevFiles = new Set(previousSignals ? previousSignals.files : []);
  const newFiles = currentFiles.filter((f) => !prevFiles.has(f));
  return `Touched ${currentFiles.length} file(s) (+${currentSignals.added.length}/-${currentSignals.removed.length})${newFiles.length ? `; new-vs-previous paths: ${newFiles.slice(0, 3).join(', ')}` : '; no new paths vs previous entry'}.`;
}

function deriveImpacts(signals) {
  const impacts = [];
  if (signals.added.length || signals.removed.length) impacts.push('code delta present');
  if (signals.hunks.some((h) => /function\s|=>|class\s|const\s|let\s|var\s/.test(`${h.added.join('\n')}\n${h.removed.join('\n')}`))) impacts.push('logic structure updated');
  if (signals.hunks.some((h) => /<[^>]+>|document\.|window\.|iframe|tab|search|timeline/i.test(`${h.added.join('\n')}\n${h.removed.join('\n')}`))) impacts.push('ui behavior adjusted');
  if (signals.hunks.some((h) => /fetch\(|JSON\.|timestamp|commit|diff|hash|lineage/i.test(`${h.added.join('\n')}\n${h.removed.join('\n')}`))) impacts.push('data/model flow changed');
  return [...new Set(impacts)];
}

const commitLines = git([
  'log',
  '--reverse',
  '--date=iso-strict',
  '--pretty=format:%H\t%h\t%cI\t%s',
  `${START_COMMIT}..HEAD`,
  '--',
  FILE_GLOB,
]).split('\n').filter(Boolean);

const startLine = git(['show', '-s', '--date=iso-strict', '--pretty=format:%H\t%h\t%cI\t%s', START_COMMIT]);
const allLines = [startLine, ...commitLines];

const commits = allLines.map((line, idx) => {
  const [full, short, timestamp, ...messageParts] = line.split('\t');
  return { seq: idx + 1, full, short, timestamp, message: messageParts.join('\t').trim() };
});

const rows = commits.map((commit, idx) => {
  const prev = idx > 0 ? commits[idx - 1].full : null;
  const patch = prev
    ? git(['diff', `${prev}..${commit.full}`, '--patch', '--', FILE_GLOB])
    : git(['show', commit.full, '--patch', '--pretty=format:', '--', FILE_GLOB]);

  const nameStatus = prev
    ? git(['diff', '--name-status', `${prev}..${commit.full}`, '--', FILE_GLOB])
    : git(['show', '--name-status', '--pretty=format:', commit.full, '--', FILE_GLOB]);

  const changed_paths = parseNameStatus(nameStatus);
  const primary_filename = changed_paths[0]?.to || changed_paths[0]?.path || FILE_GLOB;
  const patchNorm = normalizePatch(patch);
  const signals = parsePatch(patch);
  const prevSignals = idx > 0 ? parsePatch(git(['diff', `${commits[idx - 1].full}..${commits[idx].full}`, '--patch', '--', FILE_GLOB])) : null;
  const functional_impacts = deriveImpacts(signals);

  const diff_evidence = signals.hunks.slice(0, 8).map((h) => ({
    file: h.file,
    hunk: h.header,
    added_preview: h.added.slice(0, 2),
    removed_preview: h.removed.slice(0, 2),
  }));

  const blob_refs = changed_paths.map((entry) => {
    const path = entry.to || entry.path;
    return {
      path,
      blob: `${commit.full}:${path}`,
      status: entry.status,
      from: entry.from || null,
    };
  });

  return {
    seq: commit.seq,
    timestamp: commit.timestamp,
    timestamp_pt: toPT(commit.timestamp),
    commit_hash: commit.full,
    commit_short: commit.short,
    commit_message: commit.message,
    code_fingerprint: sha(patchNorm),
    primary_filename,
    changed_paths,
    description_delta_from_previous: deriveDescription(signals, prevSignals),
    functional_impacts,
    blob_refs,
    launch_ref: primary_filename,
    note: functional_impacts.length ? `Diff-derived impacts: ${functional_impacts.join(', ')}.` : 'No diff-derived impact tags.',
    previous_commit_hash: prev,
    diff_evidence,
    patch_hash: sha(patchNorm),
  };
});

writeFileSync(MODEL_PATH, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} entries to ${MODEL_PATH}`);
