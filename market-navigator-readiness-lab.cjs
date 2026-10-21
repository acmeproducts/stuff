'use strict';
// Deliberately isolated UI test transport. Never imported by application code.
const assert=require('assert/strict'),http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
assert.equal(process.env.MN_ACCEPTANCE_SCOPE,'retained-data-lab','Lab instrumentation requires an explicit non-release scope');
const original=http.ServerResponse.prototype.end;let transformed=0;
http.ServerResponse.prototype.end=function(chunk,...args){
 if(Buffer.isBuffer(chunk)||typeof chunk==='string'){
  const html=chunk.toString(),seam='await etlRequireComplete(p);';
  if(html.includes('<html')&&html.includes(seam)){
   assert.equal(html.split(seam).length,2,'Unexpected completeness gate seam');
   chunk=Buffer.from(html.replace(seam,'/* ISOLATED IMPLEMENTATION TEST ONLY: retained data is NOT source qualified */'));transformed++;
  }
 }
 return original.call(this,chunk,...args);
};
process.on('exit',()=>{fs.mkdirSync('.evidence',{recursive:true});const suite=path.basename(process.argv[1]||'unknown');fs.writeFileSync('.evidence/readiness-lab-'+suite+'.json',JSON.stringify({scope:'retained-data-lab',publishingAllowed:false,suite,transformed_http_pages:transformed,hook_sha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),instrumentation:'Exactly one completeness call omitted only from local HTTP responses. Candidate file and package bytes untouched. No receipt or source data fabricated.'},null,2));});
