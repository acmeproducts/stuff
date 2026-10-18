/* One verified immutable package per consumer; no root-data fallback. */
window.MNEtlData=(()=>{'use strict';let current=null,pending=null;
 const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 async function bytes(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Qualified data unavailable: '+r.status+' '+url);return r.arrayBuffer()}
 async function candidate(){
  const channel=JSON.parse(new TextDecoder().decode(await bytes('channel.json')));
  if(channel.schema!=='market-navigator-etl-channel-v1'||!/^[a-f0-9]{64}$/.test(channel.version)||channel.package!=='versions/'+channel.version+'/package.json')throw Error('Invalid review data channel');
  const body=await bytes(channel.package);if(await hash(body)!==channel.sha256)throw Error('Review package hash mismatch');
  const manifest=JSON.parse(new TextDecoder().decode(body));
  if(manifest.schema!=='market-navigator-etl-package-v1'||manifest.qualified!==true||manifest.version!==channel.version)throw Error('Review package has not qualified');
  const base=new URL('.',new URL(channel.package,location.href)),cache=new Map();
  async function read(path){
   if(!Object.hasOwn(manifest.resources,path)||!/^\w[\w./-]*\.json$/.test(path)||path.includes('..'))throw Error('Resource absent from qualified package: '+path);
   if(!cache.has(path))cache.set(path,(async()=>{const raw=await bytes(new URL(path,base));if(await hash(raw)!==manifest.resources[path])throw Error('Qualified resource hash mismatch: '+path);return JSON.parse(new TextDecoder().decode(raw))})());
   return structuredClone(await cache.get(path));
  }
  const paths=['market-evidence/derived-indices-persistent-v1.json','data/market-backend/derived-index-definition-persistent-v1.json','market-evidence/health-envelope.json','data/market-backend/data-catalog.json','data/market-backend/source-registry.json'];
  await Promise.all(paths.map(read));const catalog=await read(paths[3]);
  const sources=catalog.series.filter(s=>s.enabled!==false).map(s=>'market-evidence/series/'+s.id+'.json');
  let cursor=0;await Promise.all(Array.from({length:6},async()=>{while(cursor<sources.length)await read(sources[cursor++])}));
  return Object.freeze({version:manifest.version,read});
 }
 return Object.freeze({open(){if(current)return Promise.resolve(current);return pending||=(candidate().then(p=>current=p).finally(()=>pending=null))},
  async refresh(){const next=await candidate();current=next;return next},get current(){return current}});
})();
