function renderPbList(){
  var host=$('pb-ov-cards');if(!host)return;
  var q=norm($('pb-search').value||'');
  var ts=function(x){var n=+x||(x?+new Date(x):0);return isNaN(n)?0:n};
  var live=PB.live().slice().sort(function(a,b){
    var ea=pbCardEmpty(a)?1:0,eb=pbCardEmpty(b)?1:0;
    if(ea!==eb)return eb-ea; // blank/new cards pinned to the top (S8)
    return ts(b.createdAt)-ts(a.createdAt);
  });
  var cnt=$('pb-count');
  var html='';
  if(!live.length&&!PB.trash().length){
    if(cnt)cnt.textContent='';
    $('pb-cat-chips').innerHTML='';
    html='<div style="padding:32px 16px;text-align:center;color:#9a9592;font-size:14px;line-height:1.6;">No phrasebook loaded.</div>';
  }else if(q){ // search mode: two-side rows (pre-base overlay search)
    var matched=searchFilter(live,q);
    var qLow=q.toLowerCase();
    matched.sort(function(a,b){return pbScore(b,qLow)-pbScore(a,qLow)});
    renderPbChips(matched); // live per-category match counts while typing
    var res=pbFilterByActiveCats(matched);
    var withinCatTotal=res.length;
    var capped=(S_pbActiveCats.length===1&&res.length>5);
    if(capped)res=res.slice(0,5);
    if(cnt)cnt.textContent=capped?(res.length+' of '+withinCatTotal+' phrases'):(res.length+' of '+live.length+' phrases');
    html=res.length?res.map(pbSearchRowHtml).join(''):'<div style="padding:24px;text-align:center;color:#9a9592;">No phrases found.</div>';
  }else{ // no search: full cards, chips show total counts (never a "match" count before typing)
    renderPbChips(live);
    var filtered=pbFilterByActiveCats(live);
    if(cnt)cnt.textContent=filtered.length+' phrases';
    html=filtered.map(pbBubbleHtml).join('');
  }
  host.innerHTML=html;
  $('pb-trash-host').innerHTML=pbTrashSectionHtml(PB.trash());
}
