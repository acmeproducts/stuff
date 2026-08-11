#!/usr/bin/env node
'use strict';
const fs=require('fs');
const p=process.argv[2]||'session-server.js';
let s=fs.readFileSync(p,'utf8');
if(s.includes("require('./sot-api')")){console.log('SOT integration already present');process.exit(0);}
const anchor="const path = require('path');";
if(!s.includes(anchor))throw new Error('Expected supplied session-server.js baseline not found');
s=s.replace(anchor,anchor+"\nconst sotApi = require('./sot-api');");
const route="  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }";
if(!s.includes(route))throw new Error('Expected request-router anchor not found');
s=s.replace(route,route+"\n  if (pathname.startsWith('/api/sot/')) { sotApi.handle(req, res, url); return; }");
fs.writeFileSync(p,s);
console.log('Integrated /api/sot/* into existing session-server.js without changing existing routes.');
