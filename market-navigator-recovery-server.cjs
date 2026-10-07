// Local candidate host with an actual, bounded recovery worker. Public Pages
// uses the governed GitHub evidence workflow; no credentials reach the browser.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{execFile}=require('node:child_process');
const workspace=process.cwd(),data=path.resolve(process.env.MN_CORPUS_DATA_ROOT||workspace),python=process.env.MN_PYTHON||'python3',port=Number(process.env.MN_PORT||8785);
let pending=null,lastCheck=0,lastRetry=0;
function command(args){return new Promise((resolve,reject)=>execFile(python,[path.join(workspace,'market-navigator-corpus.py'),'--root',data,...args],{cwd:workspace,timeout:180000,maxBuffer:2*1024*1024},(error,stdout)=>{if(error&&!stdout)return reject(error);try{resolve(JSON.parse(stdout))}catch{return reject(new Error('Recovery produced no valid audit'))}}))}
function qualify(force=false){
 if(pending)return pending;if(!force&&Date.now()-lastCheck<60000)return Promise.resolve();
 pending=(async()=>{lastCheck=Date.now();const audit=await command([]),s=audit.summary;
  if(force||!s.ready||((s.statuses.stale||s.statuses.failed||s.statuses.missing)&&Date.now()-lastRetry>=3600000)){
   if(!force&&Date.now()-lastRetry<60000)return;
   lastRetry=Date.now();const healed=await command(['--repair','--collect','--strict']);console.log('Corpus recovery:',JSON.stringify(healed.summary));
  }
 })().catch(error=>{console.error('Corpus worker:',error.message)}).finally(()=>{pending=null});return pending;
}
http.createServer(async(req,res)=>{
 let name;try{name=decodeURIComponent(req.url.split('?')[0]).slice(1)}catch{return res.writeHead(400).end()}
 if(name==='favicon.ico')return res.writeHead(204).end();
 const html=['market-navigator-recovery-candidate.html','market-navigator-turn28-post-ship.html'].includes(name),json=/^(market-evidence|data\/market-backend)\/[\w./-]+\.json$/.test(name),root=html?workspace:data,file=path.resolve(root,name);
 if(!(html||json)||!file.startsWith(root+path.sep))return res.writeHead(403).end();
 await qualify();
 try{res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',html?'text/html; charset=utf-8':'application/json');res.end(fs.readFileSync(file))}catch{return res.writeHead(404).end()}
}).listen(port,'127.0.0.1',()=>{console.log('Recovering candidate host: http://127.0.0.1:'+port+'/market-navigator-recovery-candidate.html');qualify(true)});
setInterval(()=>qualify(),60000).unref();
