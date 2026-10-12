#!/usr/bin/env node
/* L10N SCAN — every string literal in a page's JavaScript (a tokenizer, not a grep: spaced forms, ternaries, concatenations and
   confirm() all surface) and every text node / text attribute in its HTML shell. Used by the inventory (what must be keyed) and by
   M2 (what must not be left in English). Exports: jsStrings(js) → [{line, value, raw, before, after}], htmlTexts(html) → [{line, value, attr?, tag, id}].
   The regex-literal heuristic: a '/' that follows a value-ending token is division, otherwise it starts a regex. */
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const VALUE_END = /[\w$\]\)]$/;   /* identifier, number, ']' or ')' before the '/' → division */
const KEYWORD_BEFORE_REGEX = /(?:^|[^\w$])(?:return|typeof|case|in|of|new|delete|void|throw|instanceof)$/;
export function jsStrings(js) {
  const out = []; let i = 0, line = 1; const n = js.length;
  const lineOf = () => line;
  let lastSig = '';   /* the last significant (non-space, non-comment) text, for the regex decision */
  const push = (startLine, raw, value) => { const b = js.slice(Math.max(0, outStart - 90), outStart).split('\n').pop(); out.push({ line: startLine, raw, value, before: b, after: js.slice(i, i + 40).split('\n')[0] }); };
  let outStart = 0;
  while (i < n) {
    const c = js[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '/' && js[i + 1] === '/') { while (i < n && js[i] !== '\n') i++; continue; }
    if (c === '/' && js[i + 1] === '*') { const e = js.indexOf('*/', i + 2); const seg = js.slice(i, e === -1 ? n : e + 2); line += (seg.match(/\n/g) || []).length; i = e === -1 ? n : e + 2; continue; }
    if (c === "'" || c === '"') {
      outStart = i; const q = c; const startLine = line; let j = i + 1, v = '';
      while (j < n && js[j] !== q) { if (js[j] === '\\') { const e = js[j + 1]; v += e === 'n' ? '\n' : e === 't' ? '\t' : e === 'u' ? String.fromCharCode(parseInt(js.slice(j + 2, j + 6), 16)) : e; j += e === 'u' ? 6 : 2; continue; } if (js[j] === '\n') line++; v += js[j]; j++; }
      i = j + 1; push(startLine, js.slice(outStart, i), v); lastSig = q; continue;
    }
    if (c === '`') {
      outStart = i; const startLine = line; let j = i + 1, depth = 0;
      while (j < n) { if (depth === 0 && js[j] === '`') break; if (js[j] === '\\') { j += 2; continue; } if (js[j] === '\n') line++; if (depth === 0 && js[j] === '$' && js[j + 1] === '{') { depth = 1; j += 2; continue; } if (depth > 0) { if (js[j] === '{') depth++; else if (js[j] === '}') depth--; } j++; }
      i = j + 1; const raw = js.slice(outStart, i); push(startLine, raw, raw.slice(1, -1)); lastSig = '`'; continue;
    }
    if (c === '/') {
      const isDiv = VALUE_END.test(lastSig) && !KEYWORD_BEFORE_REGEX.test(lastSig);
      if (!isDiv) { let j = i + 1, inClass = false; while (j < n) { if (js[j] === '\\') { j += 2; continue; } if (js[j] === '[') inClass = true; else if (js[j] === ']') inClass = false; else if (js[j] === '/' && !inClass) break; else if (js[j] === '\n') break; j++; } j++; while (j < n && /[a-z]/.test(js[j])) j++; i = j; lastSig = ')'; continue; }
      i++; lastSig = '/'; continue;
    }
    /* a run of identifier/number characters or a single punctuation char */
    const m = /^[\w$]+/.exec(js.slice(i, i + 64)); if (m) { lastSig = m[0]; i += m[0].length; continue; }
    lastSig = c; i++;
  }
  return out;
}
const TEXT_ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'content'];
export function htmlTexts(html) {
  const dom = new JSDOM(html, { runScripts: 'outside-only' }); const d = dom.window.document; const out = [];
  const lines = html.split('\n'); const lineOf = (needle, from) => { for (let k = from || 0; k < lines.length; k++) if (lines[k].indexOf(needle) !== -1) return k + 1; return 0; };
  const walk = (el) => { for (const ch of el.childNodes) { if (ch.nodeType === 3) { const v = ch.textContent.replace(/\s+/g, ' ').trim(); if (v && /[A-Za-z]/.test(v)) out.push({ value: v, tag: el.tagName.toLowerCase(), id: el.id || '', cls: el.className || '' }); } else if (ch.nodeType === 1 && !/^(script|style|svg)$/i.test(ch.tagName)) { for (const a of TEXT_ATTRS) if (ch.hasAttribute(a) && /[A-Za-z]/.test(ch.getAttribute(a)) && !(a === 'content')) out.push({ value: ch.getAttribute(a), attr: a, tag: ch.tagName.toLowerCase(), id: ch.id || '', cls: ch.className || '' }); walk(ch); } } };
  walk(d.body);
  let cursor = 0; for (const o of out) { const needle = o.attr ? o.attr + '="' + o.value.replace(/&/g, '&amp;') : o.value.split(' ')[0]; let l = lineOf(o.attr ? needle : o.value.replace(/&/g, '&amp;').replace(/'/g, "'"), cursor); if (!l) l = lineOf(needle, cursor); o.line = l; if (l) cursor = l - 1; }
  return out;
}
export function appScript(html) { return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => ({ js: m[1], offset: html.slice(0, m.index).split('\n').length - 1 })).sort((a, b) => b.js.length - a.js.length)[0]; }

if (process.argv[1] && process.argv[1].endsWith('l10n-scan.mjs')) {
  const f = process.argv[2]; const html = fs.readFileSync(f, 'utf8'); const isHtml = /<html/i.test(html);
  if (isHtml) { const s = appScript(html); for (const o of jsStrings(s.js)) console.log('JS ' + (o.line + s.offset) + '\t' + JSON.stringify(o.value) + '\t<<' + o.before.slice(-60) + '>> ' + o.after.slice(0, 30)); for (const o of htmlTexts(html)) console.log('HTML ' + o.line + '\t' + (o.attr ? o.attr + '=' : '') + JSON.stringify(o.value) + '\t' + o.tag + (o.id ? '#' + o.id : '') + (o.cls ? '.' + String(o.cls).split(' ')[0] : '')); }
  else for (const o of jsStrings(html)) console.log('JS ' + o.line + '\t' + JSON.stringify(o.value) + '\t<<' + o.before.slice(-60) + '>> ' + o.after.slice(0, 30));
}
