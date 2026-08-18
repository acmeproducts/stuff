/* SOT 0.4.1 / 6.7.1 UI hotfix */
if(typeof WSL!=='undefined' && WSL){
  const PARALLEL_UI_HOTFIX_BUILD='2026.08.18.6.7.1-wsl-parallel';
  const el=document.querySelector('.build');
  if(el)el.textContent='UI v0.4.1 · '+PARALLEL_UI_HOTFIX_BUILD;
}
