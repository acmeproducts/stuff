function applyBubbleTheme(){
  var s=$('bubble-theme-tag');if(!s){s=document.createElement('style');s.id='bubble-theme-tag';document.head.appendChild(s)}
  var r=activeRoom();if(!r){s.textContent='';return}
  var preset=themeVal(r,'preset','medium');
  var meBg=themeVal(r,'meBg',themePaletteColor(preset,'pacific-blue'));
  var pnBg=themeVal(r,'pnBg',themePaletteColor(preset,'almond-cream'));
  var meFont=themeVal(r,'meFont','')||(hexLum(meBg)>0.45?'#1A1714':'#ffffff');
  var pnFont=themeVal(r,'pnFont','')||(hexLum(pnBg)>0.45?'#1A1714':'#ffffff');
  var meSize=themeVal(r,'meSize',15),pnSize=themeVal(r,'pnSize',15);
  var meWidth=themeVal(r,'meWidth',75),pnWidth=themeVal(r,'pnWidth',75);
  var hdrColor=themeVal(r,'hdrColor','#5A5552'),hdrSize=themeVal(r,'hdrSize',11);
  s.textContent=
    '.tr-body{grid-template-columns:'+meWidth+'fr 1px '+pnWidth+'fr}'
    +'.tr-col[data-side="left"]{background:'+meBg+'}'
    +'.tr-col[data-side="left"] .tr-text{color:'+meFont+';font-size:'+meSize+'px}'
    +'.tr-col[data-side="left"] .tr-tts{color:'+meFont+';font-size:'+meSize+'px}'
    +'.tr-col[data-side="right"]{background:'+pnBg+'}'
    +'.tr-col[data-side="right"] .tr-text{color:'+pnFont+';font-size:'+pnSize+'px}'
    +'.tr-col[data-side="right"] .tr-tts{color:'+pnFont+';font-size:'+pnSize+'px}'
    +'.tr-head{font-size:'+hdrSize+'px}'
    +'.tr-head .tr-who{color:'+hdrColor+'}'
    +'.tr-head .tr-who.mine{color:'+hdrColor+'}'
    +'.tr-head .tr-time{color:'+hdrColor+';font-size:'+Math.max(8,hdrSize-1)+'px}';
}
