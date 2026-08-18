/* SOT 0.4.1 / 6.7.4 real-mount correction */
const REAL_MOUNT_BUILD='2026.08.18.6.7.4-wsl-real-mount';

function realMountNow(){return new Date().toISOString();}
function realMountTable(){
  const out=new Map();
  try{
    const txt=fs.readFileSync('/proc/self/mountinfo','utf8');
    for(const line of txt.split('\n')){
      if(!line)continue;
      const parts=line.split(' '),dash=parts.indexOf('-');
      if(dash<0||parts.length<dash+3)continue;
      const mountPoint=parts[4].replace(/\\040/g,' '),fsType=parts[dash+1],source=parts[dash+2];
      out.set(path.resolve(mountPoint),{mount_point:path.resolve(mountPoint),fs_type:fsType,source});
    }
  }catch(e){recoveryLog('error','fs','mountinfo.read.failed',{error:e.message});}
  return out;
}
function realMountProbe(p){
  const rp=path.resolve(p),mt=realMountTable().get(rp)||null;
  if(!mt)return {mounted:false,available:false,error:'not-mounted',entry_count:null,mount:null};
  try{
    const entries=fs.readdirSync(rp,{withFileTypes:true});
    return {mounted:true,available:true,error:null,entry_count:entries.length,mount:mt};
  }catch(e){return {mounted:true,available:false,error:e.code||e.message,entry_count:null,mount:mt};}
}

roots=function(){
  const out=[],seen=new Set(),mounts=realMountTable();
  for(const [mp,mt] of mounts){
    const m=mp.match(/^\/mnt\/([a-z])$/i);if(!m)continue;
    const letter=m[1].toUpperCase();if(seen.has(mp))continue;seen.add(mp);
    const probe=realMountProbe(mp);
    out.push({id:'wsl:'+mp,name:letter+':',label:letter+':',path:mp,kind:'storage',available:probe.available,mounted:true,error:probe.error,entry_count:probe.entry_count,fs_type:mt.fs_type,source:mt.source});
  }
  const hp=realMountProbe(HOME);
  out.push({id:'wsl:'+HOME,name:'WSL Home',label:'WSL Home',path:HOME,kind:'storage',available:true,mounted:true,error:null,entry_count:hp.entry_count});
  out.sort((a,b)=>a.label.localeCompare(b.label));
  return out;
};

recoveryBrowse=async function(p,force=false){
  if(!p||p==='/')return {path:'/',parent:'/',locations:roots(),folders:[],files:[],cached:false,status:'Ready'};
  const rp=safePath(p);
  if(/^\/mnt\/[a-z]$/i.test(rp)){
    const probe=realMountProbe(rp);
    if(!probe.mounted){
      recoveryLog('error','project-setup','volume.not-mounted',{path:rp},null,null,rp);
      const e=new Error('Source volume is not mounted in WSL: '+rp);e.code='NOT_MOUNTED';throw e;
    }
    if(!probe.available){
      recoveryLog('error','project-setup','volume.unreadable',{error:probe.error},null,null,rp);
      const e=new Error('Source volume is mounted but unreadable: '+rp+' ('+probe.error+')');e.code=probe.error;throw e;
    }
  }
  const sig=await shallowSignature(rp),key=crypto.createHash('sha256').update('real-mount:'+rp).digest('hex');
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
  try{sql(`INSERT OR REPLACE INTO fs_scope_cache(cache_key,path,signature,payload,updated_at) VALUES(${esc(key)},${esc(rp)},${esc(sig)},${esc(JSON.stringify(payload))},${esc(realMountNow())});`)}catch{}
  recoveryLog('info','project-setup','volume.read',{folders:folders.length,files:files.length,root_selectable:true,mounted:true},null,null,rp);
  return {...payload,cached:false,status:`Ready · ${folders.length} folders · ${files.length} root files`};
};

const realMountBaseHandle=handle;
handle=async function(req,res,url){
  try{
    if(url.pathname==='/api/sot/health'&&req.method==='GET'){
      parallelEnsureSchema();json(res,200,{service:'sot',status:'ok',version:VERSION,build:REAL_MOUNT_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','parallel-indexing','parallel-fingerprint','manifest','db-admin','diagnostic-log','real-mount-detection']});return true;
    }
    return realMountBaseHandle(req,res,url);
  }catch(e){try{recoveryLog('error','api','6.7.4.request.error',{method:req.method,path:url.pathname,error:e.message})}catch{}json(res,500,{error:e.message,code:e.code||null});return true;}
};
