from pathlib import Path

PATH = Path('session-manager-v3.html')
text = PATH.read_text(encoding='utf-8')

if "const BUILD_VERSION='2.9.17';" not in text:
    raise SystemExit('expected v2.9.17 source')


def function_bounds(src, signature):
    start = src.find(signature)
    if start < 0:
        raise SystemExit(f'missing function: {signature}')
    brace = src.find('{', start)
    if brace < 0:
        raise SystemExit(f'missing opening brace: {signature}')
    depth = 0
    quote = None
    escape = False
    i = brace
    while i < len(src):
        ch = src[i]
        if quote:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == quote:
                quote = None
        else:
            if ch in ('\"', "'", '`'):
                quote = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return start, i + 1
        i += 1
    raise SystemExit(f'unbalanced function: {signature}')


new_export = r'''function projectHistoryMeta(r){let out={};for(let[k,v]of Object.entries(r&&typeof r==='object'?r:{}))if(k!=='messages')out[k]=v;return out}
async function fetchProjectSessionExport(k,index,total){let row=state.sessions.find(s=>s.key===k)||null,known=state.projectState?.known?.[k]||null,missing=state.projectState?.missing?.[k]||null,recovered=state.projectState?.recovered?.[k]||null,label=row?name(row):(known?.label||missing?.label||recovered?.label||k),base={key:k,label,disposition:disposition(k),session:row?JSON.parse(JSON.stringify(row)):null,known:known?JSON.parse(JSON.stringify(known)):null,missing:missing?JSON.parse(JSON.stringify(missing)):null,recovered:recovered?JSON.parse(JSON.stringify(recovered)):null,messages:[],historyMeta:{},messageCount:0,possiblyTruncated:false,error:null};if(!row){base.error='Session is not present in the current Gateway session list';return base}toast('Preparing project download',`${index+1}/${total} · ${label}`);let r=null,lastErr=null;for(let attempt=0;attempt<2&&!r;attempt++){try{r=await rpc('chat.history',{sessionKey:k,limit:1000},60000)}catch(e){lastErr=e;if(attempt===0)await new Promise(res=>setTimeout(res,250))}}if(!r){base.error=String(lastErr?.message||'Unable to fetch session history');return base}base.messages=Array.isArray(r.messages)?r.messages:[];base.historyMeta=projectHistoryMeta(r);base.messageCount=base.messages.length;base.possiblyTruncated=base.messageCount>=1000||Boolean(r.truncated||r.hasMore||r.contentTruncated||r.droppedMessages);return base}
async function buildProjectFullExport(id){let p=projects().find(x=>x.id===id);if(!p)throw Error('Project not found');let manifest=projectManifest(id),keys=[...p.sessions],sessions=[];for(let i=0;i<keys.length;i++)sessions.push(await fetchProjectSessionExport(keys[i],i,keys.length));let failures=sessions.filter(s=>s.error).length,truncated=sessions.filter(s=>s.possiblyTruncated).length;return{schema:'session-manager-project-export',version:2,exportedAt:new Date().toISOString(),buildVersion:BUILD_VERSION,gateway:{url:state.settings.gatewayUrl,protocol:state.hello?.protocol||PV},project:JSON.parse(JSON.stringify(p)),manifest,historyRequest:{method:'chat.history',limit:1000},summary:{sessionCount:keys.length,historyFetched:keys.length-failures,failures,possiblyTruncated:truncated},sessions}}
async function downloadProjectManifest(id){let p=projects().find(x=>x.id===id);if(!p)return;if(!state.connected){toast('Project download requires a Gateway connection','err');return}try{let obj=await buildProjectFullExport(id),blob=new Blob([JSON.stringify(obj,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=safeFileName(p.name)+'.project-full.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);let f=obj.summary.failures,t=obj.summary.possiblyTruncated;if(f)toast('Project downloaded',`${obj.summary.historyFetched}/${obj.summary.sessionCount} histories fetched · ${f} failed`,'err');else if(t)toast('Project downloaded',`${obj.summary.sessionCount} sessions · ${t} reached Gateway history bounds`,'ok');else toast('Project downloaded',`${obj.summary.sessionCount} sessions with transcript content`,'ok')}catch(e){toast('Project download failed',String(e?.message||e),'err')}}'''

s, e = function_bounds(text, 'function downloadProjectManifest(id)')
text = text[:s] + new_export + text[e:]
text = text.replace("if(a==='download')downloadProjectManifest(id);else await shareProjectManifest(id)", "if(a==='download')await downloadProjectManifest(id);else await shareProjectManifest(id)")

text = text.replace("// v2.9.17 — reliable native project-card dragover/drop across browsers.\n", "// v2.9.17 — reliable native project-card dragover/drop across browsers.\n// v2.9.18 — project download includes transcript content from every project session.\n")
text = text.replace("const BUILD_VERSION='2.9.17';", "const BUILD_VERSION='2.9.18';")
text = text.replace('v2.9.17</span>', 'v2.9.18</span>')
text = text.replace("document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.17');", "document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.18');")

checks = [
    "const BUILD_VERSION='2.9.18';",
    "function buildProjectFullExport(id)",
    "limit:1000",
    ".project-full.json",
    "await downloadProjectManifest(id)",
]
for needle in checks:
    if needle not in text:
        raise SystemExit(f'validation missing: {needle}')

PATH.write_text(text, encoding='utf-8')
print('patched session-manager-v3.html to v2.9.18')
