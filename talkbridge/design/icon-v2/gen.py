import os,sys,json
D=os.path.dirname(os.path.abspath(__file__)); NAVY='#0B1F3A'
G=json.load(open(sys.argv[1]))
def svg(glyph,size,bg=True,safe=1.0,rounded=True):
    r=22 if rounded else 0
    inner=f'<g transform="translate(50 50) scale({safe}) translate(-50 -50)">{glyph}</g>'
    bgel=f'<rect width="100" height="100" rx="{r}" fill="{NAVY}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 100 100">{bgel}{inner}</svg>'
pages=[]
for name,gg in G.items():
    g=gg['icon'] if isinstance(gg,dict) else gg; gb=gg['badge'] if isinstance(gg,dict) else gg
    os.makedirs(f'{D}/{name}',exist_ok=True)
    for fn,size,bg,safe,rounded in [('icon-512',512,True,.86,True),('icon-192',192,True,.86,True),('icon-180',180,True,.86,False),('icon-maskable-512',512,True,.66,False),('badge-96',96,False,1.0,False)]:
        open(f'{D}/{name}/{fn}.html','w').write(f'<html><body style="margin:0;background:transparent">{svg(gb if not bg else g,size,bg,safe,rounded)}</body></html>')
        pages.append((f'{D}/{name}/{fn}.html',f'{D}/{name}/{fn}.png',size))
    open(f'{D}/{name}/icon.svg','w').write(svg(g,512,True,.86,True)); open(f'{D}/{name}/badge.svg','w').write(svg(gb,96,False,1.0,False))
open(f'{D}/pages.txt','w').write('\n'.join(f'{h}\t{p}\t{s}' for h,p,s in pages))
cells=''
for name,gg in G.items():
    g=gg['icon'] if isinstance(gg,dict) else gg; gb=gg['badge'] if isinstance(gg,dict) else gg
    cells+=f'''<div class="col"><h2>{name}</h2>
<div class="row">{svg(g,168,True,.86,True)}<div class="stack">{svg(g,72,True,.86,True)}{svg(g,48,True,.86,True)}{svg(g,32,True,.86,True)}</div></div>
<div class="cap">home screen · notification icon · list · tiny</div>
<div class="mask"><div class="circle">{svg(g,120,True,.66,False)}</div><div class="cap">Android maskable (circle crop)</div></div>
<div class="bar"><span class="t">00:36 Wed, Sep 30</span>{svg(gb,22,False,1.0,False)}<span class="dot">•</span><span class="right">▲ ▮▮▮ 78</span></div>
<div class="cap">status bar badge (white on transparent)</div>
<div class="notif"><div class="ic">{svg(g,44,True,.86,True)}</div><div><b>Bo · TalkBridge</b><br><span>🇺🇸→🇹🇭 Bangkok trip · Incoming video call</span></div></div>
<div class="cap">notification card (Android)</div></div>'''
open(f'{D}/sheet.html','w').write(f'''<html><head><style>
body{{margin:0;background:#f2f2f4;font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#222}}.wrap{{display:flex;gap:28px;padding:24px}}.col{{width:420px}}h2{{font-size:18px;margin:0 0 10px}}
.row{{display:flex;gap:16px;align-items:flex-end}}.stack{{display:flex;gap:12px;align-items:flex-end}}.cap{{font-size:12px;color:#666;margin:6px 0 14px}}
.mask .circle{{width:120px;height:120px;border-radius:50%;overflow:hidden;display:inline-block;background:{NAVY}}}
.bar{{background:#000;color:#fff;border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:10px;font-size:15px}}.bar .right{{margin-left:auto;font-size:13px}}.bar .dot{{opacity:.7}}
.notif{{background:#fff;border-radius:14px;padding:12px;display:flex;gap:12px;align-items:center;box-shadow:0 1px 4px rgba(0,0,0,.15);font-size:14px}}.notif span{{color:#555}}
</style></head><body><div class="wrap">{cells}</div></body></html>''')
