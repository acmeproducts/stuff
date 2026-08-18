/* SOT 0.4.1 / 6.7.3 mount-safe retry */
const MOUNT_SAFE_BUILD='2026.08.18.6.7.3-wsl-mount-safe';

function mountSafeNow(){return new Date().toISOString();}
function mountSafeProbeRoot(p){
  try{
    const st=fs.statSync(p);
    if(!st.isDirectory())return {available:false,error:'not a directory'};
    const entries=fs.readdirSync(p,{withFileTypes:true});
    return {available:true,error:null,entry_count:entries.length};
  }catch(e){return {available:false,error:e.code||e.message,entry_count:null};}
}

// Only advertise roots that the production report-server process can actually read.
// Windows drive discovery may identify letters, but visibility is not equivalent to WSL readability.
roots=function(){
  const seen=new Set(),out=[];
  const add=(label,p)=>{
    const key=path.resolve(p);if(seen.has(key))return;seen.add(key);
    const probe=mountSafeProbeRoot(key);
    out.push({id:'wsl:'+key,name:label,label,path:key,kind:'storage',available:probe.available,error:probe.error,entry_count:probe.entry_count});
  };
  try{
    for(const n of fs.readdirSync('/mnt')){
      if(!/^[a-z]$/i.test(n))continue;
      add(n.toUpperCase()+':','/mnt/'+n.toLowerCase());
    }
  }catch(e){recoveryLog('warn','fs','mnt.enumeration.failed',{error:e.message});}
  add('WSL Home',HOME);
  return out;
};

// Restore the 6.6 Project Setup browse contract: actual child folders AND root files.
// Do not replace a read failure with an empty-success result.
recoveryBrowse=async function(p,force=false){
  if(!p||p==='/')return {path:'/',parent:'/',locations:roots(),folders:[],files:[],cached:false,status:'Ready'};
  const rp=safePath(p),probe=mountSafeProbeRoot(rp);
  if(!probe.available){
    recoveryLog('error','project-setup','volume.unreadable',{error:probe.error},null,null,rp);
    const e=new Error('Source volume is not readable by the report server: '+rp+' ('+probe.error+')');e.code=probe.error;throw e;
  }
  const sig=await shallowSignature(rp),key=crypto.createHash('sha256').update('mount-safe:'+rp).digest('hex');
  if(!force){
    const c=rows(`SELECT signature,payload,updated_at FROM fs_scope_cache WHERE cache_key=${esc(key)} LIMIT 1`)[0];
    if(c&&c.signature===sig){const payload=JSON.parse(c.payload);return {...payload,cached:true,status:'Ready · cached',cache_updated_at:c.updated_at};}
  }
  const ents=await fsp.readdir(rp,{withFileTypes:true}),folders=[],files=[];
  for(const e of ents){
    const full=path.join(rp,e.name);
    if(e.isDirectory()){
      let last=null;try{last=(await fsp.stat(full)).mtimeMs}catch{}
      folders.push({name:e.name,path:full,bytes:null,files:null,folders:1,last});
    }else if(e.isFile()){
      try{const st=await fsp.stat(full);files.push({name:e.name,path:full,bytes:st.size,last:st.mtimeMs});}
      catch(err){recoveryLog('warn','project-setup','root-file.stat.error',{error:err.message},null,null,full);}
    }
  }
  folders.sort((a,b)=>a.name.localeCompare(b.name));files.sort((a,b)=>a.name.localeCompare(b.name));
  const payload={path:rp,parent:path.dirname(rp),folders,files,root_selectable:true};
  try{sql(`INSERT OR REPLACE INTO fs_scope_cache(cache_key,path,signature,payload,updated_at) VALUES(${esc(key)},${esc(rp)},${esc(sig)},${esc(JSON.stringify(payload))},${esc(mountSafeNow())});`)}catch{}
  recoveryLog('info','project-setup','volume.read',{folders:folders.length,files:files.length,root_selectable:true},null,null,rp);
  return {...payload,cached:false,status:`Ready · ${folders.length} folders · ${files.length} root files`};
};

const mountSafeBaseHandle=handle;
handle=async function(req,res,url){
  const pn=url.pathname;
  try{
    if(pn==='/api/sot/health'&&req.method==='GET'){
      parallelEnsureSchema();json(res,200,{service:'sot',status:'ok',version:VERSION,build:MOUNT_SAFE_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','parallel-indexing','parallel-fingerprint','manifest','db-admin','diagnostic-log','mount-safe-browse']});return true;
    }
    if(pn==='/api/sot/db/info'&&req.method==='GET'){
      parallelEnsureSchema();const c=cfg(),st=fs.statSync(c.database_path),r=parseRows(sql('PRAGMA integrity_check;'));const value=r[0]?.integrity_check||Object.values(r[0]||{})[0]||'unknown';json(res,200,{database_path:c.database_path,database_backup_path:c.database_backup_path,size_bytes:st.size,modified_at:st.mtime.toISOString(),integrity:{ok:String(value).toLowerCase()==='ok',result:value,database_path:c.database_path},schema_version:'0.4.1',build:MOUNT_SAFE_BUILD});return true;
    }
    return mountSafeBaseHandle(req,res,url);
  }catch(e){try{recoveryLog('error','api','6.7.3.request.error',{method:req.method,path:pn,error:e.message})}catch{}json(res,500,{error:e.message,code:e.code||null});return true;}
};
