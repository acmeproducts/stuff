function linkDeviceUrl(room){
  var k=(localStorage.getItem('tb_dg_key')||'').trim();
  var tid=(localStorage.getItem('tb_cf_tid')||'').trim();
  var tok=(localStorage.getItem('tb_cf_tok')||'').trim();
  return location.href.split('?')[0].split('#')[0]+'#j='+encInv({r:room.id,ld:1,role:room.role,ml:room.myLang,tl:room.theirLang,myn:room.myName||S.user.name||'',pn:room.partnerName||'',t:room.title||'',th:room.theme||null,k:k,tid:tid,tok:tok});
}
