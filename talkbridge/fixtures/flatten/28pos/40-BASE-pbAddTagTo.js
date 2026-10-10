function pbAddTagTo(id,raw){
  var c=pbCardById(id);if(!c)return;
  var t=(raw||'').toLowerCase().trim().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'').slice(0,24);
  if(!t)return;
  c.tags=c.tags||[];
  if(c.tags.indexOf(t)>=0)return;
  c.tags.push(t);
  pbLogChain(c,'Tag added: #'+t);
  pbTouch(c);
  _pbCS(id).tagsOpen=true;
  pbRerenderCard(id);
  var inp=document.querySelector('[data-taginp][data-cid="'+id+'"]');
  if(inp)inp.focus(); // G9: handler ends with focus
}
