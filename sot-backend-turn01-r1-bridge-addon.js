/* TURN01 R1 recovery bridge — reconstruct from verified 6.9.1 plumbing, expose existing evidence */
const TURN01_R1_BUILD='2026.08.22.turn01-r1-recovery';

function t1r1BackfillExistingEvidence(limit=20000){
  t1EnsureSchema();
  const existing=Number(rows('SELECT COUNT(*) n FROM file_observations')[0]?.n||0);
  const manifests=rows(`SELECT m.project_token,m.source_id,m.relative_path,m.size,m.modified_at,m.sha256,m.inventory_at,
    s.normalized_path_or_locator AS source_root
    FROM manifests m JOIN sources s ON s.source_id=m.source_id
    WHERE m.sha256 IS NOT NULL AND m.sha256<>''
    ORDER BY m.inventory_at DESC LIMIT ${Math.max(1,Math.min(200000,Number(limit||20000)))}`);
  let inserted=0,history=0,skipped=0;
  for(const m of manifests){
    try{
      if(!m.source_root){skipped++;continue}
      const i=pcIdentity(m.source_root);
      const rel=String(m.relative_path||'');
      const full=path.join(m.source_root,rel);
      const fn=path.basename(rel||full);
      const normalized=t1NormPath(full);
      const ph=t1Hash(normalized),oh=t1ObsHash(normalized,m.sha256,m.modified_at,m.size),at=String(m.inventory_at||t1Now());
      sql(`INSERT INTO file_observations(path_id,relative_path,filename,full_path,size,modified_at,sha256,status,observed_at,path_hash,observation_hash)
        VALUES(${esc(i.path_id)},${esc(rel)},${esc(fn)},${esc(full)},${Number(m.size||0)},${Number(m.modified_at||0)},${esc(m.sha256)},'done',${esc(at)},${esc(ph)},${esc(oh)})
        ON CONFLICT(path_id,relative_path) DO UPDATE SET filename=excluded.filename,full_path=excluded.full_path,size=excluded.size,modified_at=excluded.modified_at,sha256=excluded.sha256,status='done',observed_at=excluded.observed_at,path_hash=excluded.path_hash,observation_hash=excluded.observation_hash;
        INSERT OR IGNORE INTO turn01_observation_history(path_id,relative_path,normalized_path,filename,size,modified_at,file_fingerprint,path_hash,observation_hash,status,observed_at)
        VALUES(${esc(i.path_id)},${esc(rel)},${esc(normalized)},${esc(fn)},${Number(m.size||0)},${Number(m.modified_at||0)},${esc(m.sha256)},${esc(ph)},${esc(oh)},'done',${esc(at)});`);
      inserted++;
      history++;
    }catch(e){skipped++;try{recoveryLog('warn','turn01-r1','manifest.bridge.failed',{error:e.message,source_id:m.source_id,relative_path:m.relative_path},m.project_token,null,m.source_root)}catch{}}
  }
  const touched=rows(`SELECT DISTINCT path_id FROM file_observations WHERE sha256 IS NOT NULL`);
  for(const x of touched){try{pcRefreshPathSummary(x.path_id)}catch{}}
  return {existing_before:existing,manifest_rows:manifests.length,bridged:inserted,history,skipped,observations_after:Number(rows('SELECT COUNT(*) n FROM file_observations')[0]?.n||0)};
}

// R1 evidence source: current file_observations, with deterministic fallback to legacy manifests.
const t1r1PriorObservations=t1Observations;
t1Observations=function(projectToken){
  t1EnsureSchema();
  let obs=t1r1PriorObservations(projectToken);
  if(obs.length)return obs;
  const wh=projectToken?` WHERE m.project_token=${esc(projectToken)}`:'';
  const legacy=rows(`SELECT m.project_token,m.source_id,m.relative_path,m.size,m.modified_at,m.sha256,m.inventory_at,
    s.normalized_path_or_locator AS source_root
    FROM manifests m JOIN sources s ON s.source_id=m.source_id${wh}
    ORDER BY m.inventory_at DESC`);
  return legacy.map(m=>{
    const full=path.join(m.source_root||'',m.relative_path||'');
    const norm=t1NormPath(full);
    return {path_id:null,relative_path:m.relative_path,filename:path.basename(m.relative_path||full),full_path:full,size:Number(m.size||0),modified_at:Number(m.modified_at||0),file_fingerprint:m.sha256||null,status:m.sha256?'done':'pending',observed_at:m.inventory_at||null,path_hash:t1Hash(norm),observation_hash:t1ObsHash(norm,m.sha256,m.modified_at,m.size),source_root:m.source_root||''};
  });
};

function t1r1EvidenceStatus(){
  t1EnsureSchema();
  const counts=rows(`SELECT
    (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL) projects,
    (SELECT COUNT(*) FROM sources) sources,
    (SELECT COUNT(*) FROM manifests) manifests,
    (SELECT COUNT(*) FROM fingerprint_inventory) inventory,
    (SELECT COUNT(*) FROM file_observations) observations,
    (SELECT COUNT(DISTINCT sha256) FROM file_observations WHERE sha256 IS NOT NULL) unique_observation_hashes`)[0]||{};
  return {build:TURN01_R1_BUILD,...Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,Number(v||0)])),intelligence:t1Intelligence(null)};
}

const t1r1PriorHandle=handle;
handle=async function(req,res,url){
  const pn=url.pathname;
  try{
    if(pn==='/api/sot/health'&&req.method==='GET'){
      json(res,200,{service:'sot',status:'ok',version:VERSION,build:TURN01_R1_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','global-multi-project-scheduler','durable-file-inventory','global-hash-reuse','path-centric-projects','turn01-minimum-evidence','turn01-existing-evidence-bridge','turn01-realtime-intelligence','turn01-ad-hoc-query','turn01-dynamic-plan','turn01-target-backup-disposition','db-admin','diagnostic-log']});return true;
    }
    if(pn==='/api/sot/turn01/r1/evidence-status'&&req.method==='GET'){json(res,200,t1r1EvidenceStatus());return true}
    if(pn==='/api/sot/turn01/r1/bridge'&&req.method==='POST'){const b=await body(req);json(res,200,t1r1BackfillExistingEvidence(b.limit||20000));return true}
    return t1r1PriorHandle(req,res,url);
  }catch(e){json(res,400,{error:e.message});return true}
};
