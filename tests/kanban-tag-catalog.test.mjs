import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../kanban.html", import.meta.url), "utf8");
const index = JSON.parse(fs.readFileSync(new URL("../kanban-boards.json", import.meta.url), "utf8"));

// Static regression coverage is intentional: kanban.html is a dependency-free,
// single-file browser app. These checks keep its persistence and UI paths wired
// together without introducing a second implementation of catalog behavior.
assert.match(html, /tags:normalizeTagCatalog\(\[\.\.\.\(left\.tags\|\|\[\]\), \.\.\.\(right\.tags\|\|\[\]\)\]\)/,
  "old indexes (missing tags) and cached/remote catalogs must merge safely");
assert.match(html, /\.\.\.\(Array\.isArray\(board\?\.cards\)\?board\.cards:\[\]\), \.\.\.\(Array\.isArray\(board\?\.archive\)\?board\.archive:\[\]\)/,
  "catalog discovery must inspect active and archived cards");
assert.match(html, /mergeGlobalTags\(discoveredTags\)/,
  "loading board A or B must merge its tags into the shared suggestion source");
assert.match(html, /mergeGlobalTags\(repoBoardsIndex\.tags\)/,
  "a synchronized repository catalog must be restored in another browser profile");
assert.match(html, /for\(let attempt=0; attempt<2; attempt\+\+\)/);
assert.match(html, /attempt===0 && \/\\\(409\\\)\|conflict\/i/,
  "a concurrent SHA conflict must refetch, union, and retry once");
assert.match(html, /Suggestion retained locally; retry repository sync\./,
  "failed persistence must retain local suggestions and surface a warning");
assert.match(html, /dismissTagSuggestion\(t\)/,
  "suggestion controls must only create a browser-local dismissal");

const normalized = [...new Set(index.tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b));
assert.deepEqual(index.tags, normalized, "backfilled repository tags must be normalized and deterministic");

const referencedTags = [];
for (const record of index.boards) {
  const slug = String(record.name).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const url = new URL(`../${slug}.json`, import.meta.url);
  if (!fs.existsSync(url)) continue; // archived records may intentionally have no retained payload
  const board = JSON.parse(fs.readFileSync(url, "utf8"));
  for (const card of [...(board.cards || []), ...(board.archive || [])]) {
    const tags = Array.isArray(card.tags) ? card.tags : typeof card.tags === "string" ? card.tags.split(",") : [];
    referencedTags.push(...tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean));
  }
}
for (const tag of new Set(referencedTags)) assert(index.tags.includes(tag), `missing backfilled tag: ${tag}`);

console.log("kanban tag catalog static checks passed");
