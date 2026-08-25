#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'sot-turn01-r2-wizard.html'), 'utf8');
const dbAdminHtml = fs.readFileSync(path.join(__dirname, 'sot-dbadmin.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);

assert.equal(scripts.length, 1, 'project UI must have exactly one executable inline script');
assert.equal((scripts[0].match(/const API=/g) || []).length, 1, 'API constant must be declared exactly once');
assert.match(html, /SOT <small id="build">/);
assert.match(html, /id="liveHeartbeat"[^>]*>Connecting/);
assert.match(html, /id="projectSearch"[^>]+placeholder="Omnisearch projects/);
assert.match(html, /id="adminButton"[^>]+aria-label="Administration"/);
assert.match(html, /id="newProject"[^>]+aria-label="Add project"/);
assert.match(html, /id="deleteProject"[^>]+aria-label="Delete selected project"/);
assert.match(html, /id="activityButton"[^>]+aria-label="SOT activity log"/);
assert.match(html, /<th>Name and live activity<\/th><th>Size<\/th><th>Folder Count<\/th><th>Top Level Item Count<\/th><th>Last Updated<\/th><th>Index<\/th>/);
assert.match(html, /data-run-control="toggle"/);
assert.match(html, /data-run-control="stop"/);
assert.match(html, /aria-label="Stop indexing"/);
assert.match(html, /data-project-activity=/);
assert.match(html, /aria-label="Project activity log"/);
assert.match(html, /projectRunReadout/);
assert.match(html, /projectPercent/);
assert.match(html, /workerReadout/);
assert.match(html, /row-progress/);
assert.match(html, /Live update #/);
assert.match(html, /function updateHeartbeat/);
assert.match(html, /state\.heartbeatTimer=setInterval\(updateHeartbeat,250\)/);
assert.match(html, /active_workers/);
assert.match(html, /hashes_computed/);
assert.match(html, /\['Volumes','Source\(s\)','Project'\]|<div class="picker-head">Volumes<\/div>[\s\S]+<div class="picker-head">Source\(s\)<\/div>[\s\S]+<div class="picker-head">Project<\/div>/);
assert.match(html, /Add entire volume/);
assert.match(html, /includes every descendant recursively/);
assert.match(html, /fingerprint\/folders/);
assert.match(html, /api\('\/rollup'\)/);
assert.match(html, /duplicate copies/);
assert.match(html, /async function openActivity/);
assert.match(html, /Durable worker, phase, progress, control, completion, and error history/);
assert.match(html, /Recent project activity/);
assert.match(html, /Recent SOT activity/);
assert.match(html, /bytes_hashed/);
assert.match(html, /Bytes actively hashing/);
assert.match(html, /bytes_visible/);
assert.match(html, /id="destinationActivity"/);
assert.match(html, /Background indexing remains independent/);
assert.match(html, /back\.textContent='← Projects'/);
assert.match(html, /\.inline-name/);
assert.match(html, /html,body\{height:100%;min-height:0\}/);
assert.match(html, /body\{[^}]*display:flex[^}]*overflow:hidden/);
assert.match(html, /\.content\{[^}]*min-height:0[^}]*flex:1[^}]*overflow:auto/);
assert.match(html, /\.footer-actions\{flex:0 0 auto/);
assert.match(html, /<div class="picker-head">Volumes<\/div>[\s\S]+<div class="picker-head">Folders<\/div>[\s\S]+<div class="picker-head">Destinations<\/div>/);
assert.match(html, /id="createDestinationFolder"[^>]*>Create folder/);
assert.match(html, /id="useAsTarget"[^>]*>Use current as Target/);
assert.match(html, /id="useAsBackup"[^>]*>Use current as Backup/);
assert.match(html, /api\('\/fs\/folders'/);
assert.match(html, /openDestinationSettings\(\{resumePlan:true\}\)/);
assert.doesNotMatch(html, /id="(?:targetRoot|backupRoot)"/);
assert.doesNotMatch(dbAdminHtml, /id="(?:targetRoot|backupRoot)"/);
assert.match(html, /projectTableScrollLeft/);
assert.match(html, /oldTable\.scrollLeft/);
assert.match(html, /table\.scrollLeft=state\.projectTableScrollLeft/);
assert.match(html, /\.project-table th:nth-last-child\(2\),\.project-table td:nth-last-child\(2\)\{position:sticky/);
assert.match(html, /\.project-table th:last-child,\.project-table td:last-child\{position:sticky/);

console.log(JSON.stringify({
  ribbons: 'PASS',
  project_columns: 'PASS',
  project_row_play_pause_stop: 'PASS',
  project_row_realtime_readout: 'PASS',
  explicit_refresh_heartbeat: 'PASS',
  live_in_file_byte_progress: 'PASS',
  worker_paths_and_progress: 'PASS',
  sot_and_project_activity_logs: 'PASS',
  three_column_recursive_picker: 'PASS',
  realtime_folder_project_sot_progress: 'PASS',
  background_navigation: 'PASS',
  inline_rename: 'PASS',
  viewport_contained_actions: 'PASS',
  three_panel_destination_picker: 'PASS',
  safe_destination_folder_creation: 'PASS',
  project_table_scroll_position: 'PASS',
  pinned_status_and_controls: 'PASS',
  result: 'PASS'
}, null, 2));
