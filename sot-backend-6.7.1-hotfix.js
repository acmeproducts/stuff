/* SOT 0.4.1 / 6.7.1 SQLite gate hotfix */
const PARALLEL_HOTFIX_BUILD='2026.08.18.6.7.1-wsl-parallel';

// 6.7 prepended PRAGMA busy_timeout to every query. With sqlite3 -json that emits
// an extra JSON result before SELECT/PRAGMA output and breaks parseRows(). Apply
// timeout as a CLI command instead so query output remains exactly one JSON value.
sql=function(q,db=cfg().database_path){
  fs.mkdirSync(path.dirname(db),{recursive:true});
  return execFileSync('sqlite3',['-cmd','.timeout 5000','-json',db,q],{
    encoding:'utf8',
    maxBuffer:64*1024*1024,
    timeout:120000
  }).trim();
};

const parallelHotfixBaseHandle=handle;
handle=async function(req,res,url){
  const pn=url.pathname;
  try{
    if(pn==='/api/sot/health'&&req.method==='GET'){
      parallelEnsureSchema();
      json(res,200,{service:'sot',status:'ok',version:VERSION,build:PARALLEL_HOTFIX_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','parallel-indexing','parallel-fingerprint','manifest','db-admin','diagnostic-log']});
      return true;
    }
    if(pn==='/api/sot/db/info'&&req.method==='GET'){
      parallelEnsureSchema();
      const c=cfg(),st=fs.statSync(c.database_path),r=parseRows(sql('PRAGMA integrity_check;'));
      const value=r[0]?.integrity_check||Object.values(r[0]||{})[0]||'unknown';
      json(res,200,{database_path:c.database_path,database_backup_path:c.database_backup_path,size_bytes:st.size,modified_at:st.mtime.toISOString(),integrity:{ok:String(value).toLowerCase()==='ok',result:value,database_path:c.database_path},schema_version:'0.4.1',build:PARALLEL_HOTFIX_BUILD});
      return true;
    }
    return parallelHotfixBaseHandle(req,res,url);
  }catch(e){
    try{recoveryLog('error','api','6.7.1.request.error',{method:req.method,path:pn,error:e.message})}catch{}
    json(res,500,{error:e.message});
    return true;
  }
};
