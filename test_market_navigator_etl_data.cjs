const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const code=fs.readFileSync('market-navigator-etl-data.js','utf8');
function fixture(){
 const version='a'.repeat(64),resources={
  'market-evidence/derived-indices-persistent-v1.json':{revision:'old'},
  'data/market-backend/derived-index-definition-persistent-v1.json':{},
  'market-evidence/health-envelope.json':{},
  'data/market-backend/data-catalog.json':{series:[{id:'spy'}]},
  'data/market-backend/source-registry.json':{},
  'market-evidence/series/spy.json':{observations:[{t:1,v:2}]}
 };
 const bytes=x=>Buffer.from(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 const manifest={schema:'market-navigator-etl-package-v1',qualified:true,version,resources:Object.fromEntries(Object.entries(resources).map(([p,v])=>[p,hash(bytes(v))]))};
 const channel={schema:'market-navigator-etl-channel-v1',version,package:'versions/'+version+'/package.json',sha256:hash(bytes(manifest))};
 const files=new Map([['channel.json',bytes(channel)],[channel.package,bytes(manifest)],...Object.entries(resources).map(([p,v])=>['versions/'+version+'/'+p,bytes(v)])]);
 const context={window:{},crypto:crypto.webcrypto,TextDecoder,Uint8Array,URL,structuredClone,location:{href:'https://review.test/'},fetch:async url=>{const key=new URL(String(url),'https://review.test/').pathname.slice(1),body=files.get(key);return{ok:!!body,status:body?200:404,arrayBuffer:async()=>body.buffer.slice(body.byteOffset,body.byteOffset+body.byteLength)}}};
 vm.runInNewContext(code,context);return{service:context.window.MNEtlData,files};
}
test('package validates all chart resources and returns detached snapshots',async()=>{const {service}=fixture(),p=await service.open();const a=await p.read('market-evidence/series/spy.json');a.observations[0].v=99;assert.equal((await p.read('market-evidence/series/spy.json')).observations[0].v,2)});
test('corrupt update retains prior coherent package and parked consumer',async()=>{const {service,files}=fixture(),prior=await service.open();files.set('versions/'+'a'.repeat(64)+'/market-evidence/series/spy.json',Buffer.from('{}'));await assert.rejects(service.refresh(),/hash mismatch/);assert.equal(service.current,prior);assert.equal((await prior.read('market-evidence/series/spy.json')).observations[0].v,2)});
test('unqualified package cannot fall back to mutable root files',async()=>{const {service,files}=fixture();files.delete('channel.json');await assert.rejects(service.open(),/Qualified data unavailable/);assert.equal(service.current,null)});
