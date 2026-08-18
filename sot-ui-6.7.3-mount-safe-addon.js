/* SOT 0.4.1 / 6.7.3 mount-safe UI */
if(typeof WSL!=='undefined' && WSL){
  const MOUNT_SAFE_UI_BUILD='2026.08.18.6.7.3-wsl-mount-safe';
  const b=document.querySelector('.build');if(b)b.textContent='UI v0.4.1 · '+MOUNT_SAFE_UI_BUILD;

  const priorScanScope=scanScope;
  scanScope=async function(root,path,force=false){
    try{
      const r=await priorScanScope(root,path,force);
      const rootFiles=Array.isArray(r.files)?r.files:[];
      if(rootFiles.length){
        r.status=(r.status||'Ready')+` · ${rootFiles.length} root file${rootFiles.length===1?'':'s'}`;
      }
      return r;
    }catch(e){
      const label=root?.label||root?.path||'source';
      throw new Error(label+' is listed but is not readable by the production report server. '+e.message);
    }
  };

  const priorRenderSetup=renderSetup;
  renderSetup=function(statusText){
    priorRenderSetup(statusText);
    const el=document.querySelector('.build');if(el)el.textContent='UI v0.4.1 · '+MOUNT_SAFE_UI_BUILD;
  };
}
