'use strict';
if(typeof WSL!=='undefined'&&WSL){
 const renderSetup681=renderSetup;
 renderSetup=function(statusText){
  if(statusText)statusText=String(statusText).replace(/\s*·\s*root files ignored/ig,'').replace(/root-level files are intentionally ignored\.?/ig,'');
  return renderSetup681(statusText);
 };
 if(state.route==='setup')renderSetup();
}
