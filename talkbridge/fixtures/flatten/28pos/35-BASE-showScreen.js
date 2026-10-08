function showScreen(v){
  S.view=v;
  ['s0','s1','room','s10'].forEach(function(k){$('scr-'+k).classList.toggle('active',k===v)});
}
