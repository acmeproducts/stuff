function pbCommitEdit(id,field,value){
  var c=pbCardById(id);if(!c)return;
  var v=norm(value);
  var changed=(v!==norm(c[field]||''));
  c[field]=v;
  if(field==='source'){
    if(changed){
      var bt=c.backtranslate=c.backtranslate||{};
      if(bt.verdict){bt.verdict='';pbLogChain(c,'Verdict reset to pending (source changed)')} // G8: conditional reset only
      c.tags=(c.tags||[]).filter(function(t){return t!=='✓Verified'});
      pbTouch(c);
    }
    if(!v){pbRerenderCard(id);return}
    // owner ruling: Enter in source, changed or not, re-translates target and re-runs BT
    translateWithRetry(v,c.sourceLang,c.targetLang,1).then(function(r){
      if(r.ok&&norm(r.text)!==norm(c.target||'')){c.target=norm(r.text);pbTouch(c)}
      return pbRunBT(c);
    });
    pbRerenderCard(id);
    return;
  }
  // target edited by hand: keep it, re-run BT
  if(changed){pbTouch(c);if(v)pbRunBT(c)}
  pbRerenderCard(id);
}
