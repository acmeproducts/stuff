function invUrl(room){
  var k=(localStorage.getItem('tb_dg_key')||'').trim();
  var tid=(localStorage.getItem('tb_cf_tid')||'').trim();
  var tok=(localStorage.getItem('tb_cf_tok')||'').trim();
  return location.href.split('?')[0].split('#')[0]+'#j='+encInv({r:room.id,ml:room.myLang,tl:room.theirLang,n:S.user.name||'',k:k,tid:tid,tok:tok});
}
