'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const source=fs.readFileSync('market-navigator-turn28-post-ship.html');
const blob=crypto.createHash('sha1').update(Buffer.from('blob '+source.length+'\0')).update(source).digest('hex');
assert.equal(blob,'9ce7f67451f9e1b7804927ce5c56adb667614724','Immutable Turn 28 construction source');
let html=source.toString('utf8');
const replacements=[
 ["fetch(p,{cache:'no-store'})","fetch('market-navigator-rebuild-data/'+p,{cache:'no-store'})"],
 ["function full(t){return new Date(t).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}","function full(t){return new Date(t).toLocaleDateString(undefined,{timeZone:'UTC',year:'numeric',month:'short',day:'numeric'})}"],
 ["return d.toLocaleDateString(undefined,o)}function obsRange", "return d.toLocaleDateString(undefined,{...o,timeZone:'UTC'})}function obsRange"]
];
for(const [before,after] of replacements){assert.equal(html.split(before).length,2,'Unique calendar formatter seam');html=html.replace(before,after)}
fs.writeFileSync('market-navigator-rebuild-baseline.html',html);
console.log(JSON.stringify({baselineBlob:blob,output:'market-navigator-rebuild-baseline.html',changes:'Isolated qualified data path and two UTC calendar-date formatters; original DOM, drawing mathematics, controls and application retained.'}));
