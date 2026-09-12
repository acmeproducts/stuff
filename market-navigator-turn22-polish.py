from pathlib import Path
p=Path('market-navigator-turn22-pre-ship.html')
s=p.read_text()
def cut(a,b,label):
    global s
    i=s.find(a); j=s.find(b,i+1)
    if i<0 or j<0: raise SystemExit(f'{label} markers missing')
    s=s[:i]+s[j:]
# Retire the separate COMPONENT surface and state machine.
i=s.find('<div class="modal hidden" id="analysisModal">'); j=s.find('</main>',i)
if i<0 or j<0: raise SystemExit('analysis modal markers missing')
s=s[:i]+s[j:]
s=s.replace('#analysisModal{display:none!important}','')
for x in ['analysisActive:null,','analysisRoot:null,','analysisSeries:[],','lineage:null,','priorV2:null,','analysisRenderSeq:0,','analysisRepresentation:null,','analysisFocus:null,','analysisChartState:null,']:
    s=s.replace(x,'')
cut('function renderAnalysisCrumb(){','function footerOptions','crumb')
cut('function setAnalysisFooter(w,mode,families,derivedOnly=false){','function renderCrumb','footer')
cut('function captureAnalysisState17(','async function dataSeries17','snapshot')
cut('async function analysisState(){','function aiEvidenceState','analysis state')
cut('async function openAnalysis(ids,lineage,root){',"$('dataClose').onclick=",'component engine')
s=s.replace("async function downloadAnalysisState(kind='json'){let state=await analysisState();downloadState(state,'market-navigator-analysis',kind)}",'')
s=s.replace("let state=stateOverride||await analysisState(),rootLabel=displayLabel(state.root||state.series?.[0]||'Analysis')","let state=stateOverride;if(!state)throw Error('Visible NOW chart state is required');let rootLabel=displayLabel(state.root||state.series?.[0]||'Analysis')")
s=s.replace("S.activeAnalysis=analysisId;$('analysisModal').classList.add('hidden');$('libraryWorkspace').classList.add('detailOpen');","S.activeAnalysis=analysisId;$('libraryWorkspace').classList.add('detailOpen');")
s=s.replace("if(!$('analysisModal').classList.contains('hidden'))renderAnalysis();",'')
s=s.replace("if(which==='now'&&S.level!==1){if(S.priorV2)S.priorV2.component=sel.id===S.index?null:sel.id;$('info').classList.add('hidden')}if(which==='analysis')$('seriesAbout').classList.add('hidden')","if(which==='now'&&S.level!==1){$('info').classList.add('hidden')}")
for bad in ['id="analysisModal"','function renderAnalysis(','function openAnalysis(']:
    if bad in s: raise SystemExit('retired engine residue: '+bad)
p.write_text(s)
print('TURN22 COMPONENT ENGINE REMOVED',len(s))
