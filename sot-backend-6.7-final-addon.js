/* 6.7 final backend corrections */
const parallelFinalBaseHandle=handle;
handle=async function(req,res,url){
 const pn=url.pathname;
 try{
  if(pn==='/api/sot/db/info'&&req.method==='GET'){
   parallelEnsureSchema();const c=cfg(),st=fs.statSync(c.database_path);
   json(res,200,{database_path:c.database_path,database_backup_path:c.database_backup_path,size_bytes:st.size,modified_at:st.mtime.toISOString(),integrity:integrity(),schema_version:'0.4.1',build:PARALLEL_BUILD});return true;
  }
  return parallelFinalBaseHandle(req,res,url);
 }catch(e){recoveryLog('error','api','parallel.final.error',{method:req.method,path:pn,error:e.message});json(res,500,{error:e.message});return true}
};
