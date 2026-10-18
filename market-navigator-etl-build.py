"""Attach qualified-package loading and ETL operations to the existing MNChart app."""
from pathlib import Path
import re
import shutil

HERE=Path(__file__).resolve().parent


def main():
    source=(HERE/'market-navigator-chart-only-review/market-navigator-chart-only-candidate.html').read_text(encoding='utf-8')
    def replace(old,new):
        nonlocal source
        if source.count(old)!=1:raise ValueError('Expected one established application seam: '+old[:90])
        source=source.replace(old,new,1)
    availability=source[source.index('async function seriesAvailability('):source.index('async function seriesAvailable(')]
    replace('async function j(p){let r=await fetch(p,{cache:\'no-store\'});if(!r.ok)throw Error(`${p} HTTP ${r.status}`);return r.json()}',
            'async function j(p){return (await window.MNEtlData.open()).read(p)}')
    replace("function rebuildServices(){return{metadata:readOnly(structuredClone({derived:S.derived,def:S.def,health:S.health,catalog:S.catalog,sourceRegistry:S.sourceRegistry})),getSeries:async id=>readOnly(structuredClone(await getSeries(id))),window:horizonWindow,available:seriesAvailable,onAnalyze:openStandaloneAnalysis26,",
        """function rebuildServices(){
 const metadata=readOnly(structuredClone({derived:S.derived,def:S.def,health:S.health,catalog:S.catalog,sourceRegistry:S.sourceRegistry}));
 const packageData=window.MNEtlData.current;
 const S={...metadata,catMap:Object.fromEntries(metadata.catalog.series.map(m=>[m.id,m]))};
 const cat=id=>S.catMap[id]||{},health=id=>S.health.series[id]||{};
 const getSeries=async id=>readOnly(await packageData.read('market-evidence/series/'+id+'.json'));
 function horizonWindow(h,k='risk'){const x=S.derived.indices[k].horizons[h];return{horizon:h,start:Date.parse(x.commonT0+'T00:00:00Z'),end:Date.parse(S.derived.commonMarketAnchor+'T23:59:59Z'),startLabel:x.commonT0,endLabel:S.derived.commonMarketAnchor}}
 """+availability+"""
 return{metadata,getSeries,window:horizonWindow,available:async(id,h,k)=>(await seriesAvailability(id,h,k)).available,onAnalyze:openStandaloneAnalysis26,""")
    replace('let rebuildNow=null,rebuildLibrary=null,rebuildAnalyze=null;',
            "let rebuildNow=null,rebuildLibrary=null,rebuildAnalyze=null,rebuildRestoreSpec=null;const rebuildNowTemplate=$('view-now').innerHTML;")
    replace("rebuildNow=MNChart.mount($('view-now'),{},services)","rebuildNow=MNChart.mount($('view-now'),rebuildRestoreSpec||{},services);rebuildRestoreSpec=null")
    refresh="""
window.__mnRefreshData=async()=>{
 const previous=window.MNEtlData.current?.version,next=await window.MNEtlData.refresh();
 if(previous===next.version)return next.version;
 if(!rebuildNow){await boot();return next.version}
 const values=await Promise.all(['market-evidence/derived-indices-persistent-v1.json','data/market-backend/derived-index-definition-persistent-v1.json','market-evidence/health-envelope.json','data/market-backend/data-catalog.json','data/market-backend/source-registry.json'].map(p=>next.read(p)));
 const spec=rebuildNow.getState().spec;
 [S.derived,S.def,S.health,S.catalog,S.sourceRegistry]=values;S.catMap=Object.fromEntries(S.catalog.series.map(m=>[m.id,m]));S.series={};S.seriesPromises={};
 rebuildNow.destroy();$('view-now').innerHTML=rebuildNowTemplate;rebuildNow=null;rebuildRestoreSpec=spec;
 const instance=ensureRebuildNow();instance.setVisible(S.view==='now'&&!rebuildAnalyze);await instance.whenReady();mnxRenderHealth();
 return next.version;
};
"""
    replace("boot();window.addEventListener('resize',scheduleGeometry25);})();",refresh+"boot();window.addEventListener('resize',scheduleGeometry25);})();")
    replace('</head>','<script src="etl-data.js"></script></head>')
    replace('</body>','<script src="etl-view.js"></script></body>')
    destination=HERE/'market-navigator-etl-review';destination.mkdir(exist_ok=True)
    (destination/'index.html').write_text(source,encoding='utf-8')
    for component in ('data','view'):shutil.copyfile(HERE/('market-navigator-etl-'+component+'.js'),destination/('etl-'+component+'.js'))
    # This existing PR path is a source artifact, not another published review.
    (HERE/'market-navigator-etl-review.html').write_text(source,encoding='utf-8')
    print('Built one review app from existing MNChart; chart body and mathematics unchanged')


if __name__=='__main__':main()
