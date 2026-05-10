import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const MODEL_PATH = 'bridge-lineage-timeline-model.json';
const START_COMMIT = 'ec23f33';
const PT_FORMATTER = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short' });
const BRIDGE_PATHSPEC = [':(glob)bridge*.html'];

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 256 }).trimEnd();
const hashText = (text) => createHash('sha256').update(text).digest('hex');
const formatPacific = (iso) => PT_FORMATTER.format(new Date(iso));

function normalizePatch(text) {
  return text.replace(/\r\n/g, '\n').split('\n').filter((line) => !line.startsWith('index ')).map((line) => line.replace(/[ \t]+$/g, '')).join('\n').trim();
}

function extractPatchSignals(patch) {
  const files = []; const added = []; const removed = []; const hunks = [];
  let file = null; let hunk = null;
  for (const raw of patch.split('\n')) {
    if (raw.startsWith('diff --git ')) { const m = raw.match(/ b\/(.+)$/); file = m ? m[1] : null; if (file) files.push(file); continue; }
    if (raw.startsWith('@@')) { hunk = { file, header: raw, added: [], removed: [] }; hunks.push(hunk); continue; }
    if (raw.startsWith('+++ ') || raw.startsWith('--- ')) continue;
    if (raw.startsWith('+')) { const line = raw.slice(1); added.push(line); if (hunk) hunk.added.push(line); continue; }
    if (raw.startsWith('-')) { const line = raw.slice(1); removed.push(line); if (hunk) hunk.removed.push(line); }
  }
  return { files, added, removed, hunks };
}

function classifyFromEvidence(signals) {
  const text = `${signals.added.join('\n')}\n${signals.removed.join('\n')}`;
  const impacts = [];
  if (/function\s+|=>|class\s+/i.test(text)) impacts.push('logic-flow changes');
  if (/<(button|input|select|iframe|section|main|aside)\b/i.test(text)) impacts.push('ui/ux flow changes');
  if (/(addEventListener|onclick|onchange|oninput|fetch\()/i.test(text)) impacts.push('interaction behavior');
  if (/(America\/Los_Angeles|timestamp|DateTimeFormat|timeZone)/i.test(text)) impacts.push('time display/search behavior');
  return impacts;
}

const commitLines = git(['log', '--reverse', '--date=iso-strict', '--pretty=format:%H%x09%h%x09%cI%x09%an%x09%s', `${START_COMMIT}^..HEAD`, '--', ...BRIDGE_PATHSPEC]).split('\n').filter(Boolean);

const commits = commitLines.map((line, i) => {
  const [full, short, timestamp, author, ...subjectParts] = line.split('\t');
  return { seq: i + 1, full, short, timestamp, author, message: subjectParts.join('\t').trim() };
});

const rows = commits.map((commit, idx) => {
  const previous = commits[idx - 1]?.full ?? null;
  const patch = previous ? git(['diff', `${previous}..${commit.full}`, '--patch', '--', ...BRIDGE_PATHSPEC]) : git(['show', commit.full, '--patch', '--pretty=format:', '--', ...BRIDGE_PATHSPEC]);
  const nameStatusRaw = previous ? git(['diff', '--name-status', `${previous}..${commit.full}`, '--', ...BRIDGE_PATHSPEC]) : git(['show', '--name-status', '--pretty=format:', commit.full, '--', ...BRIDGE_PATHSPEC]);
  const changed_paths = nameStatusRaw.split('\n').filter(Boolean).map((line) => { const p = line.split('\t'); return p[0].startsWith('R') ? { status: p[0], from: p[1], to: p[2], rename: true } : { status: p[0], path: p[1] }; });
  const signals = extractPatchSignals(patch);
  const patchNormalized = normalizePatch(patch);
  const functional_impacts = classifyFromEvidence(signals);
  const primary_filename = changed_paths[0]?.to || changed_paths[0]?.path || 'bridge.html';
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
    description_delta_from_previous: signals.added.length || signals.removed.length ? `Changed ${[...new Set(signals.files)].join(', ')} (+${signals.added.length}/-${signals.removed.length}).` : 'No bridge* diff from previous timeline entry.',
    functional_impacts,
    diff_evidence: { files_changed: [...new Set(signals.files)], added_lines: signals.added.length, removed_lines: signals.removed.length, tagged_hunks: signals.hunks.filter((h) => h.added.length || h.removed.length).map((h) => ({ file: h.file, hunk: h.header, added_preview: h.added.slice(0, 2), removed_preview: h.removed.slice(0, 2) })) },
    patch_hash: hashText(patchNormalized),
    blob_refs: changed_paths.map((entry) => `${commit.full}:${entry.to || entry.path || 'bridge.html'}`),
    launch_ref: primary_filename,
    note: `Author ${commit.author}. Diff-evidence only summary generated from bridge* lineage chain rooted at ${START_COMMIT}.`,
    previous_commit_hash: previous,
  };
});

writeFileSync(MODEL_PATH, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} entries to ${MODEL_PATH}`);
