'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{execFile}=require('node:child_process');
const workspace=process.cwd(),store=path.resolve('market-navigator-rebuild-generations'),python=process.env.MN_PYTHON||'python3',port=Number(process.env.MN_PORT||8786);
let pending=null,checked=0,retried=Date.now(),lastFailure=null;
function current(){const pointer=JSON.parse(fs.readFileSync(path.join(store,'current.json')));if(!/^generation-[a-f0-9]{20}$/.test(pointer.generation))throw Error('Invalid generation');return{...pointer,root:path.join(store,pointer.generation)}}
function command(args){return new Promise((resolve,reject)=>execFile(python,[path.join(workspace,'market-navigator-rebuild-worker.py'),...args],{cwd:workspace,timeout:240000,maxBuffer:4*1024*1024},(error,stdout)=>{try{const result=JSON.parse(stdout);if(error)return reject(Error(result.error||'Recovery failed'));resolve(result)}catch{return reject(Error('Recovery returned no qualified result'))}}))}
async function qualify(){
 if(pending)return pending;if(Date.now()-checked<60000)return;
 pending=(async()=>{checked=Date.now();let active;try{active=current()}catch{await command([]);active=current()}
 let audit;try{audit=await command(['--audit','--root',active.root])}catch(error){audit={summary:{ready:false},error:error.message}}
 if(!audit.summary.ready||Date.now()-retried>3600000){retried=Date.now();try{await command(['--root',active.root,'--collect']);lastFailure=null;console.log('Qualified recovery published:',current().revision)}catch(error){lastFailure=error.message;console.error('Recovery retained prior generation:',error.message);if(!audit.summary.ready)throw error}}
 })().finally(()=>{pending=null});return pending;
}
http.createServer(async(req,res)=>{
 try{
 let name=decodeURIComponent(req.url.split('?')[0]).slice(1);if(name.startsWith('market-navigator-rebuild-data/'))name=name.slice('market-navigator-rebuild-data/'.length);if(name==='favicon.ico')return res.writeHead(204).end();
 const html=['market-navigator-rebuild-baseline.html','market-navigator-turn28-post-ship.html','market-navigator-rebuild-candidate.html'].includes(name),json=/^(market-evidence|data\/market-backend)\/[\w./-]+\.json$/.test(name);
 if(!(html||json))return res.writeHead(403).end();
 await qualify();const requested=new URL(req.url,'http://localhost').searchParams.get('generation');
 let data=current();if(requested){if(!/^generation-[a-f0-9]{20}$/.test(requested))return res.writeHead(400).end();data={root:path.join(store,requested),generation:requested}}
 const root=html?workspace:data.root,file=path.resolve(root,name);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',html?'text/html; charset=utf-8':'application/json');
 let payload=fs.readFileSync(file);
 if(html){
 // Pin all application data fetches to the same immutable qualified generation.
 const pin=`<script>(()=>{const original=window.fetch;const generation=${JSON.stringify(data.generation)};window.fetch=function(input,init){if(typeof input==='string'&&/^(?:market-navigator-rebuild-data\\/)?(?:market-evidence|data\\/market-backend)\\//.test(input)){let url=new URL(input,location.href);url.searchParams.set('generation',generation);return original.call(this,url.href,init)}return original.call(this,input,init)}})()</script>`;
 payload=Buffer.from(payload.toString().replace('<head>','<head>'+pin));
 }
 res.end(payload);
 }catch(error){res.writeHead(error.code==='ENOENT'?404:503,{'Content-Type':'text/plain'}).end(error.message)}
}).listen(port,'127.0.0.1',()=>console.log('Baseline data qualification: http://127.0.0.1:'+port+'/market-navigator-rebuild-baseline.html'));
setInterval(()=>qualify().catch(error=>console.error('Recovery:',error.message)),60000).unref();
