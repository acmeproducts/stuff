from pathlib import Path

src_path=Path('.github/scripts/session-manager-v2913.py')
src=src_path.read_text(encoding='utf-8')
start=src.index('def bounds(text,name):')
end=src.index('\n\ndef replace_fn', start)
fixed=r'''def bounds(text,name):
    m=re.search(rf'(?:(?:async\s+)?function\s+{re.escape(name)}\s*\()',text)
    if not m: raise SystemExit('function missing: '+name)
    i=m.start(); j=m.end(); par=1; quote=None; esc=False
    while j<len(text) and par:
        c=text[j]
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
        else:
            if c in "'\"`": quote=c
            elif c=='(': par+=1
            elif c==')': par-=1
        j+=1
    if par: raise SystemExit('unbalanced signature '+name)
    while j<len(text) and text[j].isspace(): j+=1
    if j>=len(text) or text[j]!='{': raise SystemExit('body missing: '+name)
    j+=1; depth=1; quote=None; esc=False
    while j<len(text) and depth:
        c=text[j]
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
        else:
            if c in "'\"`": quote=c
            elif c=='{': depth+=1
            elif c=='}': depth-=1
        j+=1
    if depth: raise SystemExit('unbalanced '+name)
    return i,j
'''
patched=src[:start]+fixed+src[end:]
ns={'__name__':'__main__','__file__':str(src_path)}
exec(compile(patched,str(src_path),'exec'),ns,ns)
