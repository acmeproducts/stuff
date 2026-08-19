'use strict';
if(typeof WSL!=='undefined'&&WSL){
 const BUILD_682='2026.08.19.6.8.2-wsl-mobile-explorer';
 const style=document.createElement('style');
 style.textContent=`
/* 6.8.2: Pane 2 is the primary mobile explorer. Do not inherit the old 980px horizontal desktop canvas. */
@media(max-width:720px){
  .content{padding:10px 8px 16px!important}
  .sourceBuilder{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;resize:none!important}
  .sourceGrid{min-width:0!important;width:100%!important;height:auto!important;display:grid!important;grid-template-columns:74px minmax(0,1fr)!important;grid-template-areas:'drives source' 'stage stage'!important;gap:0!important}
  .sourceGrid>.pane:nth-of-type(1){grid-area:drives;min-height:520px;border-right:1px solid var(--line)!important}
  .sourceGrid>.pane:nth-of-type(2){grid-area:source;min-width:0!important;min-height:520px!important;overflow:hidden!important}
  .sourceGrid>.pane:nth-of-type(3){grid-area:stage;min-height:110px!important;max-height:210px!important;border-top:1px solid var(--line)!important}
  .sourceGrid>.gutter{display:none!important}
  .sourceBuilder.drives-collapsed .sourceGrid{grid-template-columns:42px minmax(0,1fr)!important}
  .driveText{display:none!important}
  .driveBody .locationRow{padding:10px 4px!important;text-align:center!important;font-size:11px!important;overflow:hidden!important}
  .driveBody .locationRow small{display:none!important}
  .paneHeader{height:36px!important;flex:0 0 36px!important;padding:0 6px!important}
  .sourceTools{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;grid-template-areas:'up path refresh' 'select search add' 'count count count'!important;gap:6px!important;padding:7px!important;align-items:center!important}
  .sourceTools #up{grid-area:up!important}
  .sourceTools .sourcePath{grid-area:path!important;min-width:0!important;grid-column:auto!important;margin:0!important}
  .sourceTools #refreshScope{grid-area:refresh!important}
  .sourceTools label.actions{grid-area:select!important;white-space:nowrap!important}
  .sourceTools .search{grid-area:search!important;grid-column:auto!important;min-width:0!important;width:100%!important}
  .sourceTools .selCount{grid-area:count!important;grid-column:auto!important}
  .sourceTools #addSelected{grid-area:add!important}
  .rootStatus{padding:5px 8px!important;min-height:25px!important}
  .pane:nth-of-type(2) .paneBody{height:360px!important;min-height:360px!important;max-height:52vh!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important}
  .sourceHead,.sourceRow,.explorerHead,.explorerRow{min-width:560px!important}
  .pane:nth-of-type(2) .paneBody{overflow:auto!important}
  .addBar{display:none!important}
  .stageWrap{max-height:160px!important;overflow:auto!important}
  .createBar{position:sticky!important;bottom:0!important;background:var(--bg)!important;padding-top:8px!important;z-index:8!important}
}
`;
 document.head.appendChild(style);
 function relabel682(){const b=document.querySelector('.build');if(b)b.textContent='UI v0.4.1 · '+BUILD_682;const tools=document.querySelector('.sourceTools');if(tools&&!tools.querySelector('#addSelected')){const add=document.querySelector('.addBar #addSelected');if(add){tools.appendChild(add)}}}
 const oldRender682=renderSetup;
 renderSetup=function(statusText){oldRender682(statusText);relabel682()};
 relabel682();
}