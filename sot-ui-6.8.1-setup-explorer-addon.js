'use strict';
if(typeof WSL!=='undefined'&&WSL){
 const SETUP_EXPLORER_BUILD='2026.08.19.6.8.1-wsl-setup-explorer';
 const setupBuildEl=document.querySelector('.build');if(setupBuildEl)setupBuildEl.textContent='UI v0.4.1 · '+SETUP_EXPLORER_BUILD;

 function setupExplorerRows(){
  const rows=visibleRows();
  if(!rows.length)return '<div class="setupEmpty"><strong>No matching folders</strong><span>Change the search or choose another location.</span></div>';
  return rows.map(r=>{
   const selected=state.selected.has(r.path);
   return `<div class="explorerRow ${selected?'selected':''}" data-folder-row="${esc(r.path)}">
    <div class="explorerCheck"><input class="sourceCheck" type="checkbox" data-check-path="${esc(r.path)}" ${selected?'checked':''} aria-label="Select ${esc(r.name)}"></div>
    <button class="explorerName" data-drill="${esc(r.path)}" title="Open ${esc(r.path)}"><span class="folderGlyph">▰</span><span>${esc(r.name)}</span></button>
    <div class="explorerModified">${r.last?new Date(r.last).toLocaleString():'—'}</div>
    <div class="explorerType">Folder</div>
    <div class="explorerSize">${r.bytes==null?'—':fmtBytes(Number(r.bytes||0))}</div>
   </div>`;
  }).join('');
 }

 function setupExplorerHeader(){
  const arrow=k=>state.sort.key===k?(state.sort.dir===1?' ↑':' ↓'):'';
  return `<div class="explorerHead">
   <span></span>
   <button class="explorerSort" data-sort="name">Name${arrow('name')}</button>
   <button class="explorerSort" data-sort="last">Date modified${arrow('last')}</button>
   <span>Type</span>
   <button class="explorerSort explorerRight" data-sort="bytes">Size${arrow('bytes')}</button>
  </div>`;
 }

 renderSetup=function(statusText){
  const pname=state.draft.name||'Project',count=state.selected.size,total=state.scope.length,all=total>0&&count===total;
  const rootLabel=state.activeRoot?state.activeRoot.label:'No drive';
  const pathLabel=state.activeRoot?(state.activePath||state.activeRoot.path||rootLabel):'Select a source drive';
  page('Project Setup','Define the project and select sources.',`<style>
   .setupCard{padding:14px}.setupFields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px}
   .setupExplorer{height:var(--sourceHeight,620px);min-height:500px;max-height:82vh;resize:vertical;overflow:hidden;border:1px solid var(--line);border-radius:9px;background:#fff}
   .setupExplorer .sourceGrid{height:100%;display:grid;grid-template-columns:190px 5px minmax(440px,1fr) 5px minmax(260px,31%)}
   .drivePane,.explorerPane,.projectPane{min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}
   .explorerPane{background:#fff}.projectPane{background:#fbfcfd}
   .explorerRibbon{flex:0 0 auto;border-bottom:1px solid var(--line);background:#fff;padding:8px;display:grid;gap:7px}
   .explorerRibbonTop{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:7px;align-items:center}
   .explorerRibbonBottom{display:grid;grid-template-columns:auto minmax(140px,1fr) auto auto;gap:7px;align-items:center}
   .explorerPath{min-width:0;height:36px;display:flex;align-items:center;border:1px solid var(--line);border-radius:7px;background:#fafbfc;padding:0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
   .explorerPath strong{margin-right:7px}.explorerSearch{height:36px}.explorerSelected{font-size:11px;color:var(--muted);white-space:nowrap}
   .explorerStatus{flex:0 0 auto;padding:6px 9px;border-bottom:1px solid var(--line);font-size:10px;color:var(--muted);background:#fbfcfd}
   .explorerTable{min-height:0;flex:1;overflow:auto;background:#fff}
   .explorerHead,.explorerRow{display:grid;grid-template-columns:36px minmax(190px,1fr) 150px 78px 90px;align-items:center;min-width:600px}
   .explorerHead{position:sticky;top:0;z-index:6;min-height:34px;background:#f4f6f8;border-bottom:1px solid var(--line);color:#5e6875;font-size:10px;font-weight:800;text-transform:uppercase}
   .explorerHead>*{padding:0 9px;text-align:left}.explorerSort{height:34px;border:0;background:transparent;color:inherit;font:inherit;text-transform:inherit;text-align:left;padding:0 9px}.explorerRight{text-align:right}
   .explorerRow{min-height:44px;border-bottom:1px solid #edf0f2;font-size:12px}.explorerRow:hover{background:#f7f9fb}.explorerRow.selected{background:#f0f4f7}
   .explorerRow>*{min-width:0;padding:7px 9px}.explorerCheck{display:grid;place-items:center}.explorerCheck input{width:17px;height:17px}
   .explorerName{height:100%;display:flex;align-items:center;gap:8px;border:0;background:transparent;text-align:left;color:var(--ink);font-weight:700;white-space:nowrap;overflow:hidden}.explorerName span:last-child{overflow:hidden;text-overflow:ellipsis}.folderGlyph{color:#6b7785;flex:0 0 auto}
   .explorerModified,.explorerType,.explorerSize{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#475467}.explorerSize{text-align:right}
   .setupEmpty{padding:34px 16px;color:var(--muted);display:grid;gap:4px}.setupEmpty strong{color:var(--ink)}
   .projectPane .paneBody{min-height:0;overflow:auto}.projectPane .stageWrap{padding:7px}
   .projectPaneSummary{padding:7px;border-bottom:1px solid var(--line);font-size:11px;color:var(--muted);background:#fff}
   .setupCreateBar{display:flex;justify-content:flex-end;margin-top:10px}
   @media(max-width:900px){.setupExplorer .sourceGrid{grid-template-columns:150px 4px minmax(420px,1fr) 4px 250px}}
   @media(max-width:720px){
    .setupCard{padding:10px}.setupFields{grid-template-columns:1fr;gap:8px}
    .setupExplorer{height:max(var(--sourceHeightMobile,680px),680px)!important;min-height:680px;max-height:none;resize:none;overflow:hidden}
    .setupExplorer .sourceGrid{min-width:0!important;display:grid;grid-template-columns:86px minmax(0,1fr);grid-template-rows:minmax(470px,1fr) 170px;grid-template-areas:'drive explorer' 'project project';height:100%;overflow:hidden}
    .drivePane{grid-area:drive;border-right:1px solid var(--line)}.explorerPane{grid-area:explorer}.projectPane{grid-area:project;border-top:1px solid var(--line)}
    .setupExplorer .gutter{display:none}
    .drivePane .paneHeader{padding:0 5px}.drivePane .paneHeader .grow{font-size:9px}.drivePane .paneMenu{display:none}
    .drivePane .locationRow{padding:9px 5px;font-size:11px;text-align:center}.drivePane .locationRow small{font-size:8px}.drivePane .locationRow#rootRow small{display:none}
    .explorerRibbon{padding:6px;gap:6px}.explorerRibbonTop{grid-template-columns:auto minmax(0,1fr) auto}.explorerRibbonBottom{grid-template-columns:auto minmax(0,1fr) auto}
    .explorerRibbonBottom .explorerSelected{display:none}.explorerRibbonBottom #addSelected{grid-column:3}
    .explorerPath{height:34px;padding:0 7px;font-size:10px}.explorerSearch{height:34px;padding:7px 8px;font-size:12px}
    .explorerHead,.explorerRow{grid-template-columns:34px minmax(170px,1fr) 128px 64px 70px;min-width:500px}
    .explorerTable{overflow:auto}.explorerModified{font-size:10px}.explorerType,.explorerSize{font-size:10px}
    .projectPane .paneHeader{height:32px;flex-basis:32px}.projectPaneSummary{padding:5px 7px}.stageCard{padding:6px;margin-bottom:4px}
    .setupCreateBar{position:sticky;bottom:0;background:var(--bg);padding-top:8px}
   }
  </style>
  <div class="card setupCard">
   <div class="setupFields"><div class="field"><label class="label">Project name</label><input class="input" id="projectName" value="${esc(state.draft.name)}" placeholder="Project name"></div><div class="field"><label class="label">Project note / description</label><input class="input" id="projectNote" value="${esc(state.draft.note)}" placeholder="Optional context"></div></div>
   <div class="setupExplorer sourceBuilder" id="sourceBuilder"><div class="sourceGrid">
    <section class="drivePane"><div class="paneHeader"><button class="paneMenu" id="collapseDrives" title="Collapse Source Drives">☰</button><span class="grow">Drives</span></div><div class="paneBody driveBody">${rootsHtml()}</div></section>
    <div class="gutter" id="g1"></div>
    <section class="explorerPane">
     <div class="paneHeader"><span class="grow">Folders — ${esc(rootLabel)}</span></div>
     <div class="explorerRibbon">
      <div class="explorerRibbonTop"><button class="btn" id="up" ${!state.activeRoot||!state.activePath?'disabled':''}>↑ Up</button><div class="explorerPath mono" title="${esc(pathLabel)}"><strong>${esc(rootLabel)}</strong>${esc(pathLabel)}</div><button class="btn" id="refreshScope" ${!state.activeRoot?'disabled':''} title="Refresh">↻</button></div>
      <div class="explorerRibbonBottom"><label class="actions" style="gap:4px;white-space:nowrap"><input type="checkbox" id="selectAll" ${all?'checked':''} ${!total?'disabled':''}> All</label><input class="input explorerSearch search" id="search" value="${esc(state.search)}" placeholder="Search folders"><span class="explorerSelected selCount">${count} of ${total} selected</span><button class="btn primary" id="addSelected" ${!count?'disabled':''}>＋ Add ${count||''}</button></div>
     </div>
     <div class="explorerStatus rootStatus" id="rootStatus">${esc(statusText||(!state.activeRoot?'Select a source drive':state.scope.length?`Ready · ${state.scope.length} folders`:'Reading folders…'))}</div>
     <div class="explorerTable">${setupExplorerHeader()}${setupExplorerRows()}</div>
    </section>
    <div class="gutter" id="g2"></div>
    <section class="projectPane"><div class="paneHeader"><span class="grow">Project — ${esc(pname)}</span></div><div class="projectPaneSummary">${state.draft.sources.length.toLocaleString()} source folder${state.draft.sources.length===1?'':'s'} staged</div><div class="paneBody stageWrap">${stagedHtml()}</div></section>
   </div></div>
   <div class="setupCreateBar"><button class="btn primary" id="createProject" ${!state.draft.name.trim()||!state.draft.sources.length?'disabled':''}>Create Project</button></div>
  </div>`);
  wireSetup();
  if(innerWidth<=720){const b=$('#sourceBuilder');if(b&&b.getBoundingClientRect().height<680)b.style.height='680px'}
 };

 document.querySelector('.build').textContent='UI v0.4.1 · '+SETUP_EXPLORER_BUILD;
 if(state.route==='setup')renderSetup();
}
