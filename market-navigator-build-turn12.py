from pathlib import Path
import re

SRC=Path('market-navigator-turn10-pre-ship.html')
DST=Path('market-navigator-turn12-pre-ship.html')
s=SRC.read_text()
s=s.replace('<title>Market Navigator · Turn 10</title>','<title>Market Navigator · Turn 12</title>')
s=s.replace('TURN 10 PRE-SHIP','TURN 12 PRE-SHIP')

# Full-width Analysis chart; remove obsolete right evidence panel.
old='.analysisBody{min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:8px;padding:8px}'
new='.analysisBody{min-height:0;display:grid;grid-template-columns:minmax(0,1fr);gap:0;padding:0}.analysisPlot{width:100%;height:100%}'
if old not in s: raise SystemExit('analysis body CSS anchor missing')
s=s.replace(old,new)
s=s.replace('.analysisBody{grid-template-columns:1fr;padding:5px}', '.analysisBody{grid-template-columns:1fr;padding:0}')
old='<div class="card evidence" id="analysisEvidence"></div>'
new='<div id="analysisEvidence" class="hidden"></div>'
if old not in s: raise SystemExit('analysis evidence panel anchor missing')
s=s.replace(old,new)

# Attachment picker accepts images and spreadsheets. XLSX is loaded lazily only when needed.
old='title="Attach image" aria-label="Attach image">📎</button><input id="attachInput" type="file" accept="image/*" multiple'
new='title="Attach image or spreadsheet" aria-label="Attach image or spreadsheet">📎</button><input id="attachInput" type="file" accept="image/*,.csv,.tsv,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple'
if old not in s: raise SystemExit('attachment input anchor missing')
s=s.replace(old,new)
old="$('attachInput').onchange=async e=>{for(let f of [...e.target.files]){if(!String(f.type).startsWith('image/'))continue;S.pendingAttachments.push(await saveAttachment(f))}e.target.value='';renderAttachPreview()}"
new="$('attachInput').onchange=async e=>{for(let f of [...e.target.files]){let n=String(f.name||'').toLowerCase(),t=String(f.type||'');if(!(t.startsWith('image/')||/\\.(csv|tsv|xlsx|xls)$/.test(n)||/csv|tab-separated|spreadsheet|excel/.test(t)))continue;S.pendingAttachments.push(await saveAttachment(f))}e.target.value='';renderAttachPreview()}"
if old not in s: raise SystemExit('attachment onchange anchor missing')
s=s.replace(old,new)

# Replace ONLY attachmentPayload. Preserve the complete AI registry/config block that follows it.
start=s.index('async function attachmentPayload(meta)')
end=s.index('const AIK=',start)
new_attachment=r'''let XLSX_LOAD=null;async function loadXLSX(){if(window.XLSX)return window.XLSX;if(XLSX_LOAD)return XLSX_LOAD;XLSX_LOAD=new Promise((resolve,reject)=>{let q=document.createElement('script');q.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';q.async=true;q.onload=()=>resolve(window.XLSX);q.onerror=()=>reject(new Error('Spreadsheet parser could not load'));document.head.appendChild(q)});return XLSX_LOAD}async function attachmentPayload(meta){let r=await dbGet('attachments',meta.id);if(!r)return null;let type=String(r.type||meta.type||''),name=String(r.name||meta.name||''),low=name.toLowerCase();if(type.startsWith('image/'))return{...meta,dataUrl:await blobDataURL(r.blob)};if(/\.(csv|tsv)$/.test(low)||/csv|tab-separated/.test(type)){let text=await r.blob.text();return{...meta,text:text.slice(0,60000)}}if(/\.(xlsx|xls)$/.test(low)||/spreadsheet|excel/.test(type)){let X;try{X=await loadXLSX()}catch(e){return{...meta,text:`Spreadsheet attached: ${name}. Parser unavailable in this session.`}}let buf=await r.blob.arrayBuffer(),wb=X.read(buf,{type:'array'}),parts=[];for(let sn of wb.SheetNames.slice(0,4)){let csv=X.utils.sheet_to_csv(wb.Sheets[sn]);parts.push(`### Sheet: ${sn}\n${csv.slice(0,18000)}`)}return{...meta,text:parts.join('\n\n').slice(0,60000)}}return{...meta,text:`Attached file: ${name}`}}'''
s=s[:start]+new_attachment+s[end:]

# Replace ONLY providerMessages. Preserve provider registry, model loading and validation functions.
start=s.index('async function providerMessages(msgs,p)')
end=s.index('function responseText',start)
new_messages=r'''async function providerMessages(msgs,p){let out=[];for(let m of msgs){let at=m.attachments||[],content=m.content||'';if(!at.length){out.push({role:m.role,content});continue}let imgs=[],docs=[];for(let a of at){let q=await attachmentPayload(a);if(!q)continue;if(q.dataUrl&&String(q.type).startsWith('image/'))imgs.push(q);else if(q.text)docs.push(q)}if(docs.length)content+='\n\n'+docs.map(q=>`Attached spreadsheet/file: ${q.name}\n\n${q.text}`).join('\n\n');if(p==='anthropic'){let parts=[{type:'text',text:content}];for(let q of imgs){let [head,data]=q.dataUrl.split(',');parts.push({type:'image',source:{type:'base64',media_type:q.type,data}})}out.push({role:m.role,content:parts})}else{let parts=[{type:'text',text:content}];for(let q of imgs)parts.push({type:'image_url',image_url:{url:q.dataUrl}});out.push({role:m.role,content:parts})}}return out}'''
s=s[:start]+new_messages+s[end:]

# Do not create empty failed Analysis records when provider is unregistered.
old="async function startAI(){let now=new Date().toISOString(),reg=aiRegistry(),p=reg.defaultProvider||'venice',c=(reg.providers||{})[p]||{},a={"
new="async function startAI(){let now=new Date().toISOString(),reg=aiRegistry(),p=reg.defaultProvider||'venice',c=(reg.providers||{})[p]||{};if(!c.verified||!c.key||!c.model){nav('config');setPStatus(p,'Register this provider before starting an Analysis',false);return}let a={"
if old not in s: raise SystemExit('startAI preflight anchor missing')
s=s.replace(old,new)

needle="function analysisMarkdown(a){let out=`# ${a.title}\\n\\n`;for(let t of (a.turns||[])){if(t.processing)continue;out+=`## ${t.role==='assistant'?'Analysis':'User'}\\n\\n${t.content||''}\\n\\n`}return out}"
if needle not in s: raise SystemExit('analysisMarkdown anchor missing')
replacement="function analysisMarkdown(a){let out=`# ${a.title}\\n\\n`;if(a.status==='failed')out+=`> Initial research did not complete. The evidence state is retained; configure a provider and continue the same Analysis below.\\n\\n`;for(let t of (a.turns||[])){if(t.processing)continue;out+=`## ${t.role==='assistant'?'Analysis':'User'}\\n\\n${t.content||''}\\n\\n`}return out}"
s=s.replace(needle,replacement)
s=s.replace("<div class=\"rowMeta\">📎 ${esc(x.name)}</div>", "<div class=\"rowMeta\">📎 ${esc(x.name)}${/\\.(csv|tsv|xlsx|xls)$/i.test(x.name||'')?' · spreadsheet':''}</div>")

must=[
'TURN 12 PRE-SHIP','Attach image or spreadsheet',
'analysisBody{min-height:0;display:grid;grid-template-columns:minmax(0,1fr);gap:0;padding:0',
'id="analysisEvidence" class="hidden"','Register this provider before starting an Analysis',
'Attached spreadsheet/file','indexedDB.open','plugins=[{id:\'web\'','loadXLSX()',
'function renderAIConfig()','function providerEndpoints(p)','function validateProvider(p)',
"$('veniceLoad').onclick","$('openrouterLoad').onclick","$('anthropicValidate').onclick"
]
for x in must:
    if x not in s: raise SystemExit('missing Turn12 requirement: '+x)
for bad in ['grid-template-columns:minmax(0,1fr) 280px','<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>','title="Attach image" aria-label="Attach image"']:
    if bad in s: raise SystemExit('Turn12 forbidden residue: '+bad)
DST.write_text(s)
print(DST)
