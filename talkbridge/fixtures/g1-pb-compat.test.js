
var _store={};
var localStorage={getItem:function(k){return k in _store?_store[k]:null;},setItem:function(k,v){_store[k]=String(v);},removeItem:function(k){delete _store[k];}};
var LOG={log:function(){}};
var PB_CARDS='pb_cards';
var PB_DATA;
PB_DATA = (function(){
  /* G1 (Phase Desk compat v1): categories are shared card data, not Bridge presentation
     state. Always an array of trimmed, lowercased, de-duplicated strings; never empty;
     'unassigned' is a sentinel that yields to any real category. */
  function normCats(value){
    var vals = Array.isArray(value) ? value : (typeof value === 'string' ? [value] : []);
    var seen = {}, out = [];
    vals.forEach(function(v){
      var s = String(v==null?'':v).trim().toLowerCase();
      if(!s || seen[s]) return;
      seen[s] = 1; out.push(s);
    });
    return out.length ? out : ['unassigned'];
  }
  function canonicalNorm(raw){
    raw=raw||{};
    var now=Date.now();
    var bt=raw.backtranslate||{};
    var pairSrc=raw.sourceLang, pairTgt=raw.targetLang;
    /* G1: start from a clone of the original so properties Bridge does not own
       (Phase Desk extensions, future fields) survive the round-trip untouched. */
    var out = {};
    Object.keys(raw).forEach(function(k){ out[k] = raw[k]; });
    return Object.assign(out, {
      id: raw.id || (Date.now().toString(36)+Math.random().toString(36).slice(2,6)),
      source: (raw.source||'').trim(),
      target: (raw.target||'').trim(),
      sourceLang: pairSrc || 'en',
      targetLang: pairTgt || 'en',
      categories: normCats(raw.categories),
      createdBy: raw.createdBy || raw.savedBy || '',
      updatedBy: raw.updatedBy || '',
      createdAt: raw.createdAt || now,
      updatedAt: raw.updatedAt || now,
      lastUsed: raw.lastUsed || null,
      usage: typeof raw.usage === 'number' ? raw.usage : 0,
      backtranslate: {
        sourceLang: bt.sourceLang || pairTgt || 'en',
        targetLang: bt.targetLang || pairSrc || 'en',
        inputText: bt.inputText || raw.target || '',
        resultText: bt.resultText || '',
        verdict: bt.verdict || 'pending', /* G1: empty/missing legacy verdicts normalize to pending */
        contentHash: bt.contentHash || '',
        updatedAt: bt.updatedAt || now
      },
      clarifyChain: Array.isArray(raw.clarifyChain) ? raw.clarifyChain : [],
      /* compat-retained (see module note above) — not part of §4M.12, not yet safe to drop */
      notes: (raw.notes||'').trim(),
      tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [],
      savedBy: raw.savedBy || raw.createdBy || '',
      deletedAt: raw.deletedAt || null,
      catalogIds: Array.isArray(raw.catalogIds) ? raw.catalogIds : [],
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0,
      intentId: raw.intentId || null,
      fingerprint: raw.fingerprint || null,
      primaryTag: raw.primaryTag || null,
      parentCategory: raw.parentCategory || null,
      relatedIntents: Array.isArray(raw.relatedIntents) ? raw.relatedIntents.slice(0,5) : [],
      semanticRelationships: raw.semanticRelationships || null
    });
  }
  function _readAll(){
    try{ return JSON.parse(localStorage.getItem(PB_CARDS)||'[]').map(canonicalNorm); }
    catch(_){ return []; }
  }
  return {
    normCats: function(v){ return normCats(v); },
    addCat: function(card,cat){
      var v=String(cat==null?'':cat).trim().toLowerCase();
      if(!v||v==='unassigned') return card;
      var next=normCats(card.categories).filter(function(x){return x!=='unassigned';});
      if(next.indexOf(v)<0) next.push(v);
      card.categories=normCats(next);
      return card;
    },
    removeCat: function(card,cat){
      var v=String(cat==null?'':cat).trim().toLowerCase();
      card.categories=normCats(normCats(card.categories).filter(function(x){return x!==v;}));
      return card;
    },
    norm: function(raw){
      LOG.log('PB-DATA.norm:in',{raw:raw});
      try{ var out=canonicalNorm(raw); LOG.log('PB-DATA.norm:out',{out:out}); return out; }
      catch(e){ LOG.log('PB-DATA.norm:err',{in:{raw:raw},e:String(e)},'warn'); return canonicalNorm({}); }
    },
    getCards: function(){
      LOG.log('PB-DATA.getCards:in',{});
      try{ var out=_readAll(); LOG.log('PB-DATA.getCards:out',{out:{count:out.length}}); return out; }
      catch(e){ LOG.log('PB-DATA.getCards:err',{in:{},e:String(e)},'warn'); return []; }
    },
    getLive: function(){
      LOG.log('PB-DATA.getLive:in',{});
      try{ var out=_readAll().filter(function(c){return !c.deletedAt;}); LOG.log('PB-DATA.getLive:out',{out:{count:out.length}}); return out; }
      catch(e){ LOG.log('PB-DATA.getLive:err',{in:{},e:String(e)},'warn'); return []; }
    },
    byId: function(id){
      LOG.log('PB-DATA.byId:in',{id:id});
      try{ var out=_readAll().find(function(c){return c.id===id;})||null; LOG.log('PB-DATA.byId:out',{out:out}); return out; }
      catch(e){ LOG.log('PB-DATA.byId:err',{in:{id:id},e:String(e)},'warn'); return null; }
    },
    save: function(cards){
      LOG.log('PB-DATA.save:in',{count:(cards||[]).length});
      try{
        var normed = (cards||[]).map(canonicalNorm); // REPLACES store — no merge
        localStorage.setItem(PB_CARDS, JSON.stringify(normed));
        var out={count:normed.length};
        LOG.log('PB-DATA.save:out',{out:out});
        return out;
      }catch(e){ LOG.log('PB-DATA.save:err',{in:{count:(cards||[]).length},e:String(e)},'warn'); return {count:0}; }
    }
  };
})();

function eq(a,b){return JSON.stringify(a)===JSON.stringify(b);}
var pass=0,fail=0;
function t(name,cond,extra){ if(cond){pass++;console.log('PASS  '+name);} else {fail++;console.log('FAIL  '+name+(extra?'  '+JSON.stringify(extra):''));} }

// T1 multi-category card survives a verdict edit + round trip
var c1={id:'a1',source:'Hello',target:'สวัสดี',sourceLang:'en',targetLang:'th',categories:['travel','lodging'],backtranslate:{verdict:'pending'}};
var n1=PB_DATA.norm(c1);
n1.backtranslate.verdict='good';
var r1=PB_DATA.norm(n1);
t('T1 multi-category preserved through edit', eq(r1.categories,['travel','lodging']), r1.categories);

// T2 bridge-created card is unassigned
var n2=PB_DATA.norm({source:'x',target:'y',sourceLang:'en',targetLang:'th',categories:['unassigned']});
t('T2 new card lands in unassigned', eq(n2.categories,['unassigned']), n2.categories);

// T3 assigned category survives usage bump, unassigned does not return
var n3=PB_DATA.norm({id:'a3',source:'s',target:'t',sourceLang:'en',targetLang:'th',categories:['dining']});
PB_DATA.addCat(n3,'dining');
n3.usage=(n3.usage||0)+1;
var r3=PB_DATA.norm(n3);
t('T3 assigned category kept, no unassigned', eq(r3.categories,['dining']), r3.categories);
var n3b=PB_DATA.norm({id:'a3b',source:'s',target:'t',categories:['unassigned']});
PB_DATA.addCat(n3b,'Dining');
t('T3b adding real category evicts sentinel', eq(PB_DATA.norm(n3b).categories,['dining']), n3b.categories);

// T4 removing final category restores sentinel
var n4=PB_DATA.norm({id:'a4',source:'s',target:'t',categories:['dining']});
PB_DATA.removeCat(n4,'dining');
t('T4 last category removed -> unassigned', eq(PB_DATA.norm(n4).categories,['unassigned']), n4.categories);

// T5 unknown property round-trips unchanged
var c5={id:'a5',source:'s',target:'t',categories:['x'],phaseDeskScore:0.87,reviewer:{name:'PD',batch:12}};
var r5=PB_DATA.norm(PB_DATA.norm(c5));
t('T5 unknown scalar preserved', r5.phaseDeskScore===0.87, r5.phaseDeskScore);
t('T5 unknown object preserved', eq(r5.reviewer,{name:'PD',batch:12}), r5.reviewer);

// normalization rules
var n6=PB_DATA.norm({categories:'  Travel  '});
t('legacy string category -> array', eq(n6.categories,['travel']), n6.categories);
var n7=PB_DATA.norm({categories:['Travel','travel','', '  ', 'Lodging']});
t('trim/lowercase/dedupe/blank-strip', eq(n7.categories,['travel','lodging']), n7.categories);
var n8=PB_DATA.norm({categories:[]});
t('empty array -> unassigned', eq(n8.categories,['unassigned']), n8.categories);

// verdict normalization
var n9=PB_DATA.norm({backtranslate:{verdict:''}});
t('empty verdict -> pending', n9.backtranslate.verdict==='pending', n9.backtranslate.verdict);

// soft-delete preserved in getCards, hidden from getLive
PB_DATA.save([{id:'d1',source:'a',target:'b'},{id:'d2',source:'c',target:'d',deletedAt:12345}]);
t('soft-deleted preserved in store', PB_DATA.getCards().length===2, PB_DATA.getCards().length);
t('soft-deleted hidden from live views', PB_DATA.getLive().length===1, PB_DATA.getLive().length);

// id stability
var idA=PB_DATA.norm({id:'stable-id',source:'a'}).id;
t('id stable across norms', idA==='stable-id', idA);

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
