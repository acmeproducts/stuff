function translateWithRetry(text,from,to,retries){
  if(!text||!from||!to||from===to)return Promise.resolve({text:text,ok:true});
  var k=from+'|'+to+'|'+text;
  if(trCache.has(k)){var v=trCache.get(k);trCache.delete(k);trCache.set(k,v);return Promise.resolve({text:v,ok:true})}
  var attempt=function(n){
    return fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+from+'|'+to)
      .then(function(r){return r.json()})
      .then(function(d){
        if(d&&d.responseStatus===200&&d.responseData){
          var t=d.responseData.translatedText;
          if(t&&t.indexOf('MYMEMORY')<0){
            t=cleanTr(t);
            if(trCache.size>=TR_CACHE_MAX){var first=trCache.keys().next().value;trCache.delete(first)}
            trCache.set(k,t);return{text:t,ok:true};
          }
        }
        throw new Error('bad response');
      })
      .catch(function(e){
        if(n>0){log('trans_retry',{left:n},'warn');return new Promise(function(res){setTimeout(res,300+((retries-n)*250))}).then(function(){return attempt(n-1)})}
        log('trans_fail',{from:from,to:to,e:String(e)},'error');
        return{text:text,ok:false};
      });
  };
  return attempt(retries||0);
}
