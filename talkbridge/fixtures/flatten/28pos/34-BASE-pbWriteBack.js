function pbWriteBack(){
  var pk=PB.pk;if(!pk)return Promise.resolve({status:'no-pair'});
  if(!PB.isDirty()){return Promise.resolve({status:'skipped'})}
  var pat=(localStorage.getItem('tb_gh_pat')||'').trim();
  if(!pat)return Promise.resolve({status:'no-pat'});
  var dirp=pk.split('-'),src=dirp[0],tgt=dirp[1];
  // VERSION-MANAGEMENT RULING (2026-07-30): bridge never invents a new, higher version number.
  // It overwrites whichever version it already has loaded (PB.version), or creates 1000 if this
  // pair has never had a file. A new version only ever comes from a separate, external release process.
  var ver=PB.version||1000;
  var v=String(ver);while(v.length<4)v='0'+v;
  var fname='phrasebook-'+src+'-'+tgt+'-'+v+'.json';
  var getUrl='https://api.github.com/repos/'+PB_REPO.owner+'/'+PB_REPO.name+'/contents/'+PB_REPO.dir+'/'+fname+'?ref=main';
  return fetch(getUrl,{headers:ghHeaders()}).then(function(r){
    if(r.status===404)return null; // first-ever save for this pair — no existing file/sha yet
    if(!r.ok)throw new Error('get '+r.status);
    return r.json();
  }).then(function(existing){
    var envelope={type:'phrasebook',pair:pk,version:ver,updatedAt:new Date().toISOString(),updatedBy:S.user.name||'me',cards:PB.cards};
    var content=btoa(unescape(encodeURIComponent(JSON.stringify(envelope,null,2))));
    var putUrl='https://api.github.com/repos/'+PB_REPO.owner+'/'+PB_REPO.name+'/contents/'+PB_REPO.dir+'/'+fname;
    var body={message:'PB update '+pk+' v'+ver,content:content,branch:'main'};
    if(existing&&existing.sha)body.sha=existing.sha;
    return fetch(putUrl,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},ghHeaders()),body:JSON.stringify(body)}).then(function(r2){
      if(!r2.ok)throw new Error('put '+r2.status);return r2.json();
    });
  }).then(function(){
    PB.version=ver;PB.meta={bumpedAt:new Date().toISOString(),updatedBy:S.user.name||'me'};PB.save();PB.clearDirty();pbSyncDot('idle');PB.lastPull={status:'ok',file:fname,n:PB.cards.length,at:Date.now()};renderPbStatus();
    log('pb_writeback',{pair:pk,version:ver},'ok');
    return{status:'ok',version:ver};
  }).catch(function(e){
    log('pb_writeback_err',{e:String(e)},'warn');pbSyncDot('error');
    if(!_pbRetryArmed){_pbRetryArmed=true;window.addEventListener('online',function _r(){window.removeEventListener('online',_r);_pbRetryArmed=false;if(PB.isDirty())pbWriteBack()})}
    return{status:'pending'};
  });
}
