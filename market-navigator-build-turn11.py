from pathlib import Path
import re

SRC=Path('market-navigator-turn10-pre-ship.html')
DST=Path('market-navigator-turn11-pre-ship.html')
s=SRC.read_text()
s=s.replace('<title>Market Navigator · Turn 10</title>','<title>Market Navigator · Turn 11</title>')
s=s.replace('TURN 10 PRE-SHIP','TURN 11 PRE-SHIP')

# V3/Analysis: chart owns the full body width; evidence remains programmatically available but has no visible right panel.
old='.analysisBody{min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:8px;padding:8px}'
new='.analysisBody{min-height:0;display:grid;grid-template-columns:minmax(0,1fr);gap:0;padding:8px}.analysisPlot{width:100%}'
if old not in s: raise SystemExit('analysis body CSS anchor missing')
s=s.replace(old,new)
old='<div class="card evidence" id="analysisEvidence"></div>'
new='<div id="analysisEvidence" class="hidden"></div>'
if old not in s: raise SystemExit('analysis evidence panel anchor missing')
s=s.replace(old,new)

# Spreadsheet parsing support for persisted research attachments.
if 'xlsx.full.min.js' not in s:
    s=s.replace('<script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script>', '<script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script><script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>')

old='title="Attach image" aria-label="Attach image">📎</button><input id="attachInput" type="file" accept="image/*" multiple'
new='title="Attach image or spreadsheet" aria-label="Attach image or spreadsheet">📎</button><input id="attachInput" type="file" accept="image/*,.csv,.tsv,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple'
if old not in s: raise SystemExit('attachment input anchor missing')
s=s.replace(old,new)

old="$('attachInput').onchange=async e=>{for(let f of [...e.target.files]){if(!String(f.type).startsWith('image/'))continue;S.pendingAttachments.push(await saveAttachment(f))}e.target.value='';renderAttachPreview()}"
new="$('attachInput').onchange=async e=>{for(let f of [...e.target.files]){let n=String(f.name||'').toLowerCase(),t=String(f.type||'');if(!(t.startsWith('image/')||/\\.(csv|tsv|xlsx|xls)$/.test(n)||/csv|tab-separated|spreadsheet|excel/.test(t)))continue;S.pendingAttachments.push(await saveAttachment(f))}e.target.value='';renderAttachPreview()}"
if old not in s: raise SystemExit('attachment onchange anchor missing')
s=s.replace(old,new)

# Persisted attachment payloads: images stay visual; spreadsheets are extracted to bounded text for AI continuation.
pat=r"async function attachmentPayload\(meta\)\{.*?\}async function providerMessages\(msgs,p\)\{.*?\}(?=function responseText)"
m=re.search(pat,s,re.S)
if not m: raise SystemExit('attachment/providerMessages block missing')
rep=r'''async function attachmentPayload(meta){let r=await dbGet('attachments',meta.id);if(!r)return null;let type=String(r.type||meta.type||''),name=String(r.name||meta.name||''),low=name.toLowerCase();if(type.startsWith('image/'))return{...meta,dataUrl:await blobDataURL(r.blob)};if(/\.(csv|tsv)$/.test(low)||/csv|tab-separated/.test(type)){let text=await r.blob.text();return{...meta,text:text.slice(0,60000)}}if(/\.(xlsx|xls)$/.test(low)||/spreadsheet|excel/.test(type)){if(!window.XLSX)return{...meta,text:`Spreadsheet attached: ${name} (parser unavailable)`};let buf=await r.blob.arrayBuffer(),wb=XLSX.read(buf,{type:'array'}),parts=[];for(let sn of wb.SheetNames.slice(0,4)){let csv=XLSX.utils.sheet_to_csv(wb.Sheets[sn]);parts.push(`### Sheet: ${sn}\n${csv.slice(0,18000)}`)}return{...meta,text:parts.join('\n\n').slice(0,60000)}}return{...meta,text:`Attached file: ${name}`}}async function providerMessages(msgs,p){let out=[];for(let m of msgs){let at=m.attachments||[],content=m.content||'';if(!at.length){out.push({role:m.role,content});continue}let imgs=[],docs=[];for(let a of at){let q=await attachmentPayload(a);if(!q)continue;if(q.dataUrl&&String(q.type).startsWith('image/'))imgs.push(q);else if(q.text)docs.push(q)}if(docs.length)content+='\n\n'+docs.map(q=>`Attached spreadsheet/file: ${q.name}\n\n${q.text}`).join('\n\n');if(p==='anthropic'){let parts=[{type:'text',text:content}];for(let q of imgs){let [head,data]=q.dataUrl.split(',');parts.push({type:'image',source:{type:'base64',media_type:q.type,data}})}out.push({role:m.role,content:parts})}else{let parts=[{type:'text',text:content}];for(let q of imgs)parts.push({type:'image_url',image_url:{url:q.dataUrl}});out.push({role:m.role,content:parts})}}return out}'''
s=s[:m.start()]+rep+s[m.end():]

# Never create an empty/failed Library record merely because the configured provider is not registered.
old="async function startAI(){let now=new Date().toISOString(),reg=aiRegistry(),p=reg.defaultProvider||'venice',c=(reg.providers||{})[p]||{},a={"
new="async function startAI(){let now=new Date().toISOString(),reg=aiRegistry(),p=reg.defaultProvider||'venice',c=(reg.providers||{})[p]||{};if(!c.verified||!c.key||!c.model){nav('config');setPStatus(p,'Register this provider before starting an Analysis',false);return}let a={"
if old not in s: raise SystemExit('startAI preflight anchor missing')
s=s.replace(old,new)

# Library is a durable Markdown research transcript. Existing failed records stay resumable and explain why the initial run has no research body.
needle="function analysisMarkdown(a){let out=`# ${a.title}\\n\\n`;for(let t of (a.turns||[])){if(t.processing)continue;out+=`## ${t.role==='assistant'?'Analysis':'User'}\\n\\n${t.content||''}\\n\\n`}return out}"
if needle not in s: raise SystemExit('analysisMarkdown anchor missing')
replacement="function analysisMarkdown(a){let out=`# ${a.title}\\n\\n`;if(a.status==='failed')out+=`> Initial research did not complete. The evidence state is retained; configure a provider and continue the same Analysis below.\\n\\n`;for(let t of (a.turns||[])){if(t.processing)continue;out+=`## ${t.role==='assistant'?'Analysis':'User'}\\n\\n${t.content||''}\\n\\n`}return out}"
s=s.replace(needle,replacement)

# Transcript attachment labels distinguish spreadsheets while preserving image thumbnails.
s=s.replace("<div class=\"rowMeta\">📎 ${esc(x.name)}</div>", "<div class=\"rowMeta\">📎 ${esc(x.name)}${/\\.(csv|tsv|xlsx|xls)$/i.test(x.name||'')?' · spreadsheet':''}</div>")

# Acceptance guards.
for must in ['TURN 11 PRE-SHIP','xlsx.full.min.js','Attach image or spreadsheet','analysisBody{min-height:0;display:grid;grid-template-columns:minmax(0,1fr);gap:0','id="analysisEvidence" class="hidden"','Register this provider before starting an Analysis','Attached spreadsheet/file','indexedDB.open','plugins=[{id:\'web\'']:
    if must not in s: raise SystemExit('missing Turn11 requirement: '+must)
for bad in ['grid-template-columns:minmax(0,1fr) 280px','title="Attach image" aria-label="Attach image"']:
    if bad in s: raise SystemExit('Turn11 forbidden residue: '+bad)
DST.write_text(s)
print(DST)
