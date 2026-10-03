  keys:function(){
    return{
      dg:((S.joinerKeys&&S.joinerKeys.k)||localStorage.getItem('tb_dg_key')||'').trim(),
      tid:((S.joinerKeys&&S.joinerKeys.tid)||localStorage.getItem('tb_cf_tid')||'').trim().replace(/[^\x20-\x7E]/g,''),
      tok:((S.joinerKeys&&S.joinerKeys.tok)||localStorage.getItem('tb_cf_tok')||'').trim().replace(/[^\x20-\x7E]/g,'')
    };
  },
