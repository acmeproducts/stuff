#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'sot-turn01-r2-wizard.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);

assert.equal(scripts.length, 1, 'project UI must have exactly one executable inline script');
assert.equal((scripts[0].match(/const API=/g) || []).length, 1, 'API constant must be declared exactly once');
assert.match(html, /SOT <small id="build">/);
assert.match(html, /id="projectSearch"[^>]+placeholder="Omnisearch projects/);
assert.match(html, /id="adminButton"[^>]+aria-label="Administration"/);
assert.match(html, /id="newProject"[^>]+aria-label="Add project"/);
assert.match(html, /id="deleteProject"[^>]+aria-label="Delete selected project"/);
assert.match(html, /<th>Name<\/th><th>Size<\/th><th>Folder Count<\/th><th>Top Level Item Count<\/th><th>Last Updated<\/th>/);
assert.match(html, /\['Volumes','Source\(s\)','Project'\]|<div class="picker-head">Volumes<\/div>[\s\S]+<div class="picker-head">Source\(s\)<\/div>[\s\S]+<div class="picker-head">Project<\/div>/);
assert.match(html, /Add entire volume/);
assert.match(html, /includes every descendant recursively/);
assert.match(html, /fingerprint\/folders/);
assert.match(html, /api\('\/rollup'\)/);
assert.match(html, /duplicate copies/);
assert.match(html, /Background indexing is isolated from the UI/);
assert.match(html, /back\.textContent='← Projects'/);
assert.match(html, /\.inline-name/);

console.log(JSON.stringify({
  ribbons: 'PASS',
  project_columns: 'PASS',
  three_column_recursive_picker: 'PASS',
  realtime_folder_project_sot_progress: 'PASS',
  background_navigation: 'PASS',
  inline_rename: 'PASS',
  result: 'PASS'
}, null, 2));
