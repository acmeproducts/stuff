'use strict';
// Reproducible source/data-boundary proof. This does not exercise browser behavior,
// certify current data, or grant owner acceptance. No product file is written.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {babel}=require('./market-navigator-rebuild-runtime.cjs');
const ROOT=path.resolve(process.env.MN_CHART_ONLY_ROOT||path.join(__dirname,'market-navigator-chart-only-review'));
const OUT=path.join(__dirname,'market-navigator-chart-only-evidence','source-boundary-audit.json');
const ACCEPTED=Object.freeze({
 commit:'996e9a71b72db5bfbea3ba77750077daaa2fb7ab',
 rootTree:'cfda3a457dd48a7ea4d402974e8a7eb531398db3',
 htmlBlob:'9ce7f67451f9e1b7804927ce5c56adb667614724',
 evidenceTree:'9241ed7bc906ed88202b3384ae509312ed16edaa',
 dataTree:'df13fb36cabe24feb24c72bf00c20af294e2831b',
 backendTree:'55b16db2eb8d1e17d34734f10743997f20615646'
});
const DEPENDENCIES=Object.freeze({
 'market-navigator-chart-only-extract.cjs':'acc9bd25ca75a0b0bd096d5a34ff72231333e98d8ff0d919fd33fc214dd9717d',
 'market-navigator-chart-only-analyze.cjs':'bbd113e2627d2dce72575ca376f8a135c85df38165f38d7c14e6e161cbfa00d6',
 'market-navigator-rebuild-runtime.cjs':'163004f9bb10cc3a6cfc993058e7a23d06cf26bb2edf7265b87f7292239486a7'
});
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitHash=(kind,b)=>crypto.createHash('sha1').update(Buffer.from(kind+' '+b.length+'\0')).update(b).digest('hex');
const gitBlob=b=>gitHash('blob',b);
const read=relative=>fs.readFileSync(path.join(ROOT,relative));
const report={schema:'market-navigator-chart-only-source-boundary-audit-v1',status:'RUNNING',checkedAt:new Date().toISOString(),
 scope:'Source inspection and exact frozen-file identity only. Browser behavior, source freshness, live repair, physical devices, and owner acceptance are not certified by this audit.',
 accepted:ACCEPTED,checks:[],failures:[],dependencies:[],comparisons:[]};
function check(name,fn){try{const detail=fn();report.checks.push({name,status:'PASS',...(detail||{})});return detail}catch(e){const detail={name,status:'FAIL',message:String(e.message||e)};report.checks.push(detail);report.failures.push(detail);return null}}
function checkedPath(relative){const resolved=path.resolve(ROOT,relative),rel=path.relative(ROOT,resolved);assert(rel&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel),'Fixture path remains inside review root');return resolved}
// Independently reconstruct real Git tree objects from directory contents. The
// expected IDs are original Git API identities, not hashes supplied by manifest.
function directoryGitTree(directory){
 const entries=fs.readdirSync(directory,{withFileTypes:true}).map(entry=>{
  assert(entry.isFile()||entry.isDirectory(),'No symbolic/nonregular fixture entry '+entry.name);
  const child=path.join(directory,entry.name),result=entry.isDirectory()?directoryGitTree(child):null;
  return{name:entry.name,sortKey:entry.name+(entry.isDirectory()?'/':''),mode:entry.isDirectory()?'40000':'100644',sha:result?result.sha:gitBlob(fs.readFileSync(child)),files:result?result.files:1};
 }).sort((a,b)=>Buffer.compare(Buffer.from(a.sortKey),Buffer.from(b.sortKey)));
 const bytes=Buffer.concat(entries.map(entry=>Buffer.concat([Buffer.from(entry.mode+' '+entry.name+'\0'),Buffer.from(entry.sha,'hex')])));
 return{sha:gitHash('tree',bytes),files:entries.reduce((n,e)=>n+e.files,0)};
}
function scriptFrom(html){const match=/<script>([\s\S]*?)<\/script>/.exec(html);assert(match,'Standalone product script exists');return{code:match[1],lineOffset:html.slice(0,match.index+8).split('\n').length-1}}
function functionsFrom(source){const ast=babel.babelParse(source.code,'source-boundary-audit',false),functions=new Map();babel.traverse(ast,{FunctionDeclaration(p){if(!p.node.id)return;const key=p.node.id.name,items=functions.get(key)||[];items.push({node:p.node,text:source.code.slice(p.node.start,p.node.end),line:p.node.loc.start.line+source.lineOffset});functions.set(key,items)}});return{ast,functions}}
function one(items,label){assert.equal(items?.length,1,'Unique '+label);return items[0]}
function comparison(name,oldItems,newItems,category){const old=one(oldItems,'accepted '+name),found=(newItems||[]).find(item=>item.text===old.text);assert(found,'Accepted function changed or disappeared: '+name);report.comparisons.push({name,category,status:'PASS',sourceSHA256:sha256(old.text),baselineLine:old.line,candidateLine:found.line});return found}
let acceptedBytes,candidateBytes,oldSource,newSource,oldIndex,newIndex,mount,sharedFunctions;
check('accepted HTML and candidate identity',()=>{
 acceptedBytes=read('market-navigator-turn28-post-ship.html');candidateBytes=read('market-navigator-chart-only-candidate.html');
 assert.equal(gitBlob(acceptedBytes),ACCEPTED.htmlBlob,'Immutable accepted HTML blob');
 report.candidate={path:'market-navigator-chart-only-review/market-navigator-chart-only-candidate.html',bytes:candidateBytes.length,sha256:sha256(candidateBytes)};
 report.baseline={bytes:acceptedBytes.length,gitBlob:gitBlob(acceptedBytes),sha256:sha256(acceptedBytes)};
 oldSource=scriptFrom(acceptedBytes.toString('utf8'));newSource=scriptFrom(candidateBytes.toString('utf8'));oldIndex=functionsFrom(oldSource);newIndex=functionsFrom(newSource);
 return{baselineBlob:ACCEPTED.htmlBlob,candidateSHA256:report.candidate.sha256};
});
check('136 frozen fixture files',()=>{
 const manifest=JSON.parse(read('frozen-fixture-manifest.json'));
 assert.equal(manifest.commit,ACCEPTED.commit);assert.equal(manifest.htmlBlob,ACCEPTED.htmlBlob);assert.equal(manifest.entries.length,136);
 const unique=new Set();for(const entry of manifest.entries){assert(!unique.has(entry.path),'Unique fixture path');unique.add(entry.path);assert.equal(entry.path,entry.source,'Fixture retains accepted relative path');assert.equal(gitBlob(fs.readFileSync(checkedPath(entry.path))),entry.sha,'Frozen blob '+entry.path)}
 return{verifiedFiles:manifest.entries.length,manifestSHA256:sha256(read('frozen-fixture-manifest.json'))};
});
check('independent original data Git trees',()=>{
 const trees=[['market-evidence',ACCEPTED.evidenceTree],['data/market-backend',ACCEPTED.backendTree]].map(([relative,expected])=>{
  const actual=directoryGitTree(path.join(ROOT,relative));assert.equal(actual.sha,expected,'Original tree '+relative);return{path:relative,expected,actual:actual.sha,files:actual.files,originalGitResource:'https://api.github.com/repos/acmeproducts/stuff/git/trees/'+expected};
 });
 assert.equal(trees.reduce((n,t)=>n+t.files,0),135,'Complete original data corpus, including all catalog/registry/evidence blobs');
 report.originalTreeEvidence={method:'Git object reconstruction from actual directory entries, independent of the fixture manifest.',originalRootResource:'https://api.github.com/repos/acmeproducts/stuff/git/trees/'+ACCEPTED.rootTree,originalDataResource:'https://api.github.com/repos/acmeproducts/stuff/git/trees/'+ACCEPTED.dataTree,identityVerification:'The root/evidence/data/backend links were independently read from the original immutable Git API trees during boundary review. Reruns independently reconstruct each protected subtree.',trees};
 return{verifiedDataFiles:135,trees};
});
check('pinned pure extraction dependencies',()=>{
 for(const [file,expected] of Object.entries(DEPENDENCIES)){const actual=sha256(fs.readFileSync(path.join(__dirname,file)));assert.equal(actual,expected,'Pinned dependency '+file);report.dependencies.push({file,expected,actual})}
 for(const file of ['market-navigator-chart-only-extract.cjs','market-navigator-chart-only-analyze.cjs']){
  const source=fs.readFileSync(path.join(__dirname,file),'utf8');assert(!/readFile|writeFile|fetch\s*\(|rebuild-baseline\.cjs|rebuild-integrity|recovery-worker/.test(source),'Pure extraction dependency '+file);
 }
 const builder=fs.readFileSync(path.join(__dirname,'market-navigator-chart-only-build.cjs'),'utf8');
 assert(!/require\(['"]\.\/market-navigator-rebuild-(?:baseline|chart|analyze|integrity)[^'"]*['"]\)/.test(builder),'No old data/calendar/review builder is executed');
 return{dependencies:report.dependencies.length,builderSHA256:sha256(builder)};
});
const CATEGORIES={
 canonicalData:['j','getSeries','cat','health','hrec','horizonWindow','windowFor','obsRange','baseline','indexed','nativeIndexed','seriesAvailability','seriesAvailable','unitKind','unit','measurementFamily','axisPlan','freshnessNote','latestLabel','boot'],
 mathAndDensity:['scale','setCanvas','renderDensity18','bucketKey18','representative18','displayPoints18','indexDisplayCurve28','full','tick','chartSnapshotFromSets','evidenceFor'],
 health:['renderHealth','sourceLifecycle25','sourceHealth25','sourceDetail25','openHealthHash26','mnxRecord','mnxRecordFingerprint','mnxExplain','mnxModelHealth','mnxAttributionCoverage','mnxModelHealthSnapshot','mnxLoadSensitivityEvidence','mnxRenderHealth'],
 aiAndLibrary:['startAI','callAI','callAIContext26','contextSourceBundle26','contextSystem26','aiEvidenceState','interpretationInstruction27','persistAnalysis','renderLibrary','renderLibraryChart','ensureLibraryChart','liveIntent26','queryContract26','governedLiveQuery26','chartSnapshotFrom','mnxShipState']
};
for(const [category,names] of Object.entries(CATEGORIES))check('unchanged '+category,()=>{assert(oldIndex&&newIndex,'Parsed source is available');for(const name of names)comparison(name,oldIndex.functions.get(name),newIndex.functions.get(name),category);return{functions:names.length}});
check('one shared NOW/Analyze implementation',()=>{
 assert(newIndex,'Candidate source is available');const bindings=[];babel.traverse(newIndex.ast,{VariableDeclarator(p){if(p.node.id?.name==='MNChart')bindings.push(p.node)}});
 const binding=one(bindings,'MNChart binding');assert.equal(binding.init?.callee?.object?.name,'Object');assert.equal(binding.init?.callee?.property?.name,'freeze');
 mount=one(binding.init.arguments[0].properties.filter(p=>p.key?.name==='mount'),'MNChart.mount');
 sharedFunctions=new Map([...newIndex.functions].map(([name,items])=>[name,items.filter(item=>item.node.start>mount.start&&item.node.end<mount.end)]).filter(([,items])=>items.length));
 const calls=[];babel.traverse(newIndex.ast,{CallExpression(p){if(p.node.callee?.object?.name==='MNChart'&&p.node.callee?.property?.name==='mount')calls.push(p.getFunctionParent()?.node.id?.name)}});
 assert.deepEqual(calls.slice().sort(),['ensureRebuildNow','openStandaloneAnalysis26'].sort(),'NOW and Analyze both mount this module; Library retains accepted renderer');
 const draw=one(sharedFunctions.get('draw'),'shared draw');assert(!/\bwhich\b|S\.view|view-analyze|view-now|standalone|library/i.test(draw.text),'Shared painter has no consumer identity branch');
 assert(!newIndex.functions.has('renderStandaloneAnalysis26'),'Old separate Analyze painter retired');
 comparison('paint',oldIndex.functions.get('paint'),sharedFunctions.get('paint'),'shared renderer equations');
 for(const name of ['sourceSet25','visibleIds25','componentIds25','indexDisplayCurve28','setNowFooter','makeHz','wireNowHz'])comparison(name,oldIndex.functions.get(name),sharedFunctions.get(name),'shared accepted chart functions');
 return{mounts:calls,sharedDrawLine:draw.line,paintExact:true};
});
check('accepted Library painter and compact crosshair',()=>{
 const original=one(oldIndex?.functions.get('draw'),'accepted draw'),shared=one(sharedFunctions?.get('draw'),'shared draw');
 const library=newIndex.functions.get('draw').find(item=>item.text===original.text);assert(library,'Library keeps exact original draw body');
 const tooltip=text=>{const start=text.indexOf('let iv='),end=text.indexOf('c.onpointermove=',start);assert(start>=0&&end>start,'Accepted compact tooltip seams');return text.slice(start,end)};
 assert.equal(tooltip(shared.text),tooltip(original.text),'Exact original tooltip content and positioning');
 report.compactCrosshair={sourceSHA256:sha256(tooltip(shared.text)),sharedDrawLine:shared.line,originalLibraryDrawLine:library.line,claim:'Content and positioning source are byte-identical. Actual pixel size/occlusion requires browser qualification.'};
 return{tooltipBlockExact:true,libraryDrawExact:true};
});
check('instance-local state and immutable data service source',()=>{
 const source=newSource.code.slice(mount.start,mount.end),services=one(newIndex.functions.get('rebuildServices'),'chart services').text;
 assert(source.includes('...structuredClone(initialState)'),'Initial state is cloned');
 assert(/Object\.defineProperty\(S,key,\{get:\(\)=>services\.metadata\[key\]\}\)/.test(source),'Data metadata access is through service getters');
 assert(one(sharedFunctions.get('getState'),'snapshot getter').text.includes('return structuredClone('),'State snapshots are copies');
 assert(services.includes('metadata:readOnly(structuredClone({derived:S.derived,def:S.def,health:S.health,catalog:S.catalog,sourceRegistry:S.sourceRegistry}))'),'Service metadata contains only cloned canonical metadata');
 assert(services.includes('getSeries:async id=>readOnly(structuredClone(await getSeries(id)))'),'Series returned to a chart are cloned and frozen');
 const freezer=one(newIndex.functions.get('readOnly'),'deep freezer').text;assert(freezer.includes('for(const child of Object.values(value))readOnly(child)')&&freezer.includes('Object.freeze(value)'),'Freezer recursively freezes children');
 assert(source.includes("services.window(h,IDX.includes(k)?k:(S.clockIndex||'risk'))")&&source.includes("services.available(id,h,IDX.includes(k)?k:(S.clockIndex||'risk'))"),'Window and availability adapt raw anchor to same original governed clock');
 return{initialStateCloned:true,stateSnapshotCloned:true,metadataDeepFrozen:true,seriesDeepFrozen:true,claim:'Static service ownership proof; bidirectional runtime isolation is a browser test.'};
});
check('chart-to-existing-consumer compatibility source',()=>{
 const capture=one(sharedFunctions.get('captureNowState'),'shared capture').text;
 assert(capture.includes("index:IDX.includes(S.index)?S.index:(S.level===1?'risk':null)"),'Raw Analyze export preserves accepted null governed-index field');
 const print=one(newIndex.functions.get('mnxPrintNow'),'print action').text,build=one(newIndex.functions.get('mnxBuildNowPrintReport'),'print report').text,services=one(newIndex.functions.get('rebuildServices'),'services').text;
 assert(services.includes('return mnxPrintNow(state,canvas)')&&print.includes('mnxBuildNowPrintReport(stateOverride,canvasOverride)')&&build.includes("let canvas=canvasOverride||$('nowChart')"),'Analyze print uses its passed canvas; NOW retains accepted default');
 assert(!newSource.code.includes('data-about-now'),'Picker has Add/remove controls without About');
 return{rawAnchorExportIndex:'null',instancePrintCanvas:true,pickerAboutRemoved:true};
});
check('exact bounded application adapters',()=>{
 const adaptations=[
  ['mnxBuildNowPrintReport',text=>text.replace('function mnxBuildNowPrintReport(stateOverride)','function mnxBuildNowPrintReport(stateOverride,canvasOverride)').replace("let canvas=$('nowChart')","let canvas=canvasOverride||$('nowChart')")],
  ['mnxPrintNow',text=>text.replace('function mnxPrintNow(stateOverride)','function mnxPrintNow(stateOverride,canvasOverride)').replace('mnxBuildNowPrintReport(stateOverride)','mnxBuildNowPrintReport(stateOverride,canvasOverride)')],
  ['mnxOpenExplanation',text=>text.replace('function mnxOpenExplanation(){','function mnxOpenExplanation(stateOverride=null){').replace('let state=S.nowChartState?nowAnalysisState():null','let state=stateOverride||(S.nowChartState?nowAnalysisState():null)')],
  ['repaintCharts',text=>text.replace('function repaintCharts(){',"function repaintCharts(){if(S.view==='analyze'&&rebuildAnalyze){rebuildAnalyze.update({});return}")]
 ];
 for(const [name,adapt] of adaptations){const accepted=one(oldIndex.functions.get(name),'accepted '+name),candidate=one(newIndex.functions.get(name),'candidate '+name);assert.equal(candidate.text,adapt(accepted.text),'Only reviewed chart-consumer adapter '+name);report.comparisons.push({name,category:'exact bounded adapter',status:'PASS',baselineLine:accepted.line,candidateLine:candidate.line,acceptedSHA256:sha256(accepted.text),adaptedSHA256:sha256(candidate.text)})}
 return{adapters:adaptations.map(([name])=>name),claim:'Existing function bodies differ only by the specified chart-instance argument or Analyze repaint branch.'};
});
check('all other accepted function bodies are retained',()=>{
 // This bounded allowlist covers only moved chart/lifecycle functions and the
 // additive adapters described above. A newly changed data/AI/helper body fails.
 const permitted=new Set(['nowBreadcrumbText','renderNowCrumb','nav','captureAnalysisState17','captureNowState','renderV1','wireLongPress25','standaloneAnalysisState26','openStandaloneAnalysis26','closeStandaloneAnalysis26','analysisWindow26','renderAnalysisHz26','renderStandaloneAnalysis26','openAnalysisPicker26','renderAnalysisPicker26','analysisMarkdown26','analysisCsv26','analysisPrintStandalone26','showNowSeriesInfo25','renderV2','openNowPicker25','renderNowPicker25','downloadAnalysisState','geometryRepaint25','setupGeometry25','mnxOpenExplanation','mnxBuildNowPrintReport','mnxPrintNow','repaintCharts']);
 const unexpected=[],checked=[];for(const [name,items] of oldIndex.functions){if(permitted.has(name))continue;const candidates=newIndex.functions.get(name)||[];if(!items.every(old=>candidates.some(item=>item.text===old.text)))unexpected.push(name);else checked.push(name)}
 assert.deepEqual(unexpected,[],'No unreviewed changes outside explicit chart/lifecycle adapters');
 return{exactAcceptedFunctions:checked.length,permittedChartAdapterNames:[...permitted],unexpected};
});
report.status=report.failures.length?'FAIL':'PASS';report.auditScriptSHA256=sha256(fs.readFileSync(__filename));
fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,output:OUT,candidateSHA256:report.candidate?.sha256,checks:report.checks.length,comparisons:report.comparisons.length,failures:report.failures}));
if(report.failures.length)process.exitCode=1;
