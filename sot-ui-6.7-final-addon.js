'use strict';
if(typeof WSL!=='undefined' && WSL){
 const createProject67Base=createProject;
 createProject=async function(){
  const before=JSON.stringify(state.draft);
  await createProject67Base();
  if(state.draft && !state.draft.name && !state.draft.note && Array.isArray(state.draft.sources) && state.draft.sources.length===0){
   api('/setup/draft',{method:'POST',body:JSON.stringify({name:'',note:'',sources:[]})}).catch(()=>{});
  }else if(JSON.stringify(state.draft)!==before){
   api('/setup/draft',{method:'POST',body:JSON.stringify(state.draft)}).catch(()=>{});
  }
 };
}
