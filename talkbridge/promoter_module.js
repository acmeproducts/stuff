/* ===== #new module: TBPROMOTE (Package 1 — organ promotion at room entry only) ===== */
var TBPROMOTE=(function(){
  var promoted=false;
  var EXPOSE=[__EXPOSE__];
  function scopeCss(css){
    css=css.replace(/:root\b/g,'#tb-bridge-root');
    css=css.replace(/(^|\})\s*html\s*,\s*body\s*\{/g,'$1 #tb-bridge-root{');
    css=css.replace(/(^|\})\s*body\s*\{/g,'$1 #tb-bridge-root{');
    css=css.replace(/(^|\})\s*html\s*\{/g,'$1 #tb-bridge-root{');
    css=css.replace(/(^|\})([^@{}]+)\{/g,function(_,a,sel){
      if(/^\s*#tb-bridge-root/.test(sel))return a+sel+'{';
      var parts=sel.split(',').map(function(s){s=s.trim();return s?'#tb-bridge-root '+s:s;});
      return a+parts.join(',')+'{';
    });
    return css;
  }
  function TBLOGP(m){try{console.log('[TBPROMOTE]',m);}catch(e){}}
  function promote(){
    if(promoted)return true;
    try{
      var jsN=document.getElementById('tb-bridge-js');
      var cssN=document.getElementById('tb-bridge-css');
      var tpl=document.getElementById('tb-bridge-tpl');
      if(!jsN||!cssN||!tpl){TBLOGP('promote_missing_nodes');return false;}
      if(jsN.textContent.length!==window.__TB_DORMANT_JS_LEN||cssN.textContent.length!==window.__TB_DORMANT_CSS_LEN){TBLOGP('promote_checksum_mismatch');return false;}
      var root=document.createElement('div');root.id='tb-bridge-root';
      root.appendChild(tpl.content.cloneNode(true));
      document.body.appendChild(root);
      var st=document.createElement('style');st.id='tb-bridge-style';st.textContent=scopeCss(cssN.textContent);document.head.appendChild(st);
      /* Execution-order adaptation (documented): donor's engine modules are defined after its
         startup code in file order; on a fresh device startup would touch them before they exist.
         We run the byte-identical module blocks first, then the byte-identical remainder. */
      var src=jsN.textContent;
      var MODRE=/\/\* ===== #(?:new|existing) module: ([A-Z-]+[A-Za-z.]*)[^=]*===== \*\/[\s\S]*?\/\* ===== #end module: \1 ===== \*\//g;
      var mods=[],rest=src.replace(MODRE,function(m){mods.push(m);return '';});
      var joined=mods.join('\n')+'\n'+rest;
      if(mods.map(function(m){return m.length;}).reduce(function(a,b){return a+b;},0)+rest.length!==src.length){TBLOGP('promote_reorder_len_mismatch');return false;}
      /* Documented adaptations (plan: chat-first rooms, call optional). Exact-match; missing match aborts. */
      var PATCHES=[
        ["createRoom camera-optional",
         "try{videoStream=await navigator.mediaDevices.getUserMedia({video:true,audio:getMicConstraints()})}catch(_){toast('Camera needed');return}\n  var url=invUrl();",
         "try{videoStream=await navigator.mediaDevices.getUserMedia({video:true,audio:getMicConstraints()})}catch(_){videoStream=null}\n  var url=invUrl();"],
        ["enterCall camera-optional",
         "if(!videoStream){\n    try{videoStream=await navigator.mediaDevices.getUserMedia({video:true,audio:getMicConstraints()})}\n    catch(_){toast('Camera needed');return}\n  }",
         "if(!videoStream){\n    try{videoStream=await navigator.mediaDevices.getUserMedia({video:true,audio:getMicConstraints()})}\n    catch(_){videoStream=null}\n  }"],
        ["local video tolerates no media",
         "$('local-video').srcObject=videoStream;syncMic();syncCam();updateCallChip();",
         "if(videoStream)$('local-video').srcObject=videoStream;syncMic();syncCam();updateCallChip();"],
        ["joiner camera-optional",
         "navigator.mediaDevices.getUserMedia({video:true,audio:getMicConstraints()}).then(function(s){\n    if(captureEpoch!==sessionEpoch){log('joiner_stale_media',{captureEpoch:captureEpoch,current:sessionEpoch},'warn');s.getTracks().forEach(function(t){t.stop();});$('joining-screen').classList.remove('show');return;}\n    videoStream=s;",
         "navigator.mediaDevices.getUserMedia({video:true,audio:getMicConstraints()}).catch(function(){return null;}).then(function(s){\n    if(captureEpoch!==sessionEpoch){if(s)s.getTracks().forEach(function(t){t.stop();});$('joining-screen').classList.remove('show');return;}\n    videoStream=s;"],
        ["joiner media-denied toast removed",
         ".catch(function(){\n    $('joining-screen').classList.remove('show');$('joiner-landing').classList.add('show');\n    setCallPhase('prejoin','media_denied');\n    toast('Camera access required');\n  });",
         ".catch(function(){\n    $('joining-screen').classList.remove('show');$('joiner-landing').classList.add('show');\n    setCallPhase('prejoin','media_denied');\n  });"],
        ["STT only when mic exists",
         "connectRelay();\n  dgDesired=true;",
         "connectRelay();\n  dgDesired=!!videoStream;"]
      ];
      for(var pi=0;pi<PATCHES.length;pi++){
        var cnt=joined.split(PATCHES[pi][1]).length-1;
        if(cnt!==1){TBLOGP('patch_fail:'+PATCHES[pi][0]+':matches='+cnt);return false;}
        joined=joined.replace(PATCHES[pi][1],PATCHES[pi][2]);TBLOGP('patch_ok:'+PATCHES[pi][0]);
      }
      var code='(function(){\n'+joined+'\n;(function(){var E=['+EXPOSE.map(function(n){return '"'+n+'"';}).join(',')+'];for(var i=0;i<E.length;i++){try{if(typeof eval(E[i])==="function")window[E[i]]=eval(E[i]);}catch(e){}}})();\n})();';
      var s=document.createElement('script');s.id='tb-bridge-live';s.textContent=code;document.body.appendChild(s);
      /* single-owner: shell conversation organs off from this point (persisted) */
      var GK=['transcript','compose','pb','translate','langdetect','tts','relay','diag'];
      for(var gi=0;gi<GK.length;gi++){TBCONFIG.set('use.shell.'+GK[gi],false);TBCONFIG.set('use.bridge.'+GK[gi],true);}
      TBCONFIG.set('use.bridge.call',true);
      promoted=true;TBLOGP('promote_ok');return true;
    }catch(e){TBLOGP('promote_err:'+String(e).slice(0,120));return false;}
  }
  return {promote:promote,isPromoted:function(){return promoted;}};
})();
/* ===== #end module: TBPROMOTE ===== */
/* ===== #new module: TBROUTE (Package 1 — front door: shell -> bridge) ===== */
var TBROUTE=(function(){
  function setSel(el,v){ if(!el)return; var has=false,i; for(i=0;i<el.options.length;i++){ if(el.options[i].value===v){has=true;break;} } if(!has){ var o=document.createElement('option'); o.value=v; o.textContent=v; el.appendChild(o);} el.value=v; }
  function createRoom(myLang,theirLang){
    if(!TBPROMOTE.promote())return;
    var ml=(myLang&&myLang!=='auto')?myLang:'en';
    var tl=(theirLang&&theirLang!=='auto')?theirLang:'th';
    setSel(document.getElementById('my-lang'),ml); setSel(document.getElementById('their-lang'),tl);
    setSel(document.getElementById('modal-my-lang'),ml); setSel(document.getElementById('modal-their-lang'),tl);
    try{window.confirmCreateRoom();}catch(e){}
  }
  function bootJoinCheck(){
    try{ if((location.hash||'').indexOf('j=')>=0){ TBPROMOTE.promote(); } }catch(e){}
  }
  return {createRoom:createRoom,bootJoinCheck:bootJoinCheck};
})();
/* ===== #end module: TBROUTE ===== */
