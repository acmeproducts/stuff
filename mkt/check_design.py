"""Gate for the design imperative. Usage: python3 mkt/check_design.py <page.html> <store_dir>. Exit 1 on any failure."""
import sys,re,json,glob,os,datetime as dt
page,store=sys.argv[1],sys.argv[2]; bad=[]
src=open(page).read()
FORBID=[r'Date\.parse',r'new Date\(',r'Date\.UTC',r'getTime',r'setHours',r'observations',r'baseline',r'rebase',r'Math\.log',r'Math\.exp']
for pat in FORBID:
    for m in re.finditer(pat,src): bad.append(f'page has forbidden "{pat}" at char {m.start()}')
for u in re.findall(r"fetch\(([^)]*)\)",src):
    if 'store/' not in u and 'u,' not in u and u.strip()!='u': bad.append('fetch outside store/: '+u[:60])
man=json.load(open(os.path.join(store,'manifest.json'))); NOW=man['now']
for f in sorted(glob.glob(os.path.join(store,'series-*.json'))):
    p=json.load(open(f)); sl=p['slots']; n=len(sl); name=os.path.basename(f)
    if sl!=sorted(set(sl)): bad.append(name+': slots not strictly ascending')
    if sl[-1]!=NOW: bad.append(name+': last slot is not NOW')
    if any(dt.date.fromisoformat(s).weekday()>=5 for s in sl): bad.append(name+': weekend slot')
    for sid,s in p['series'].items():
        for mode in ('native','horizon','fixed'):
            v=s.get(mode)
            if s['available'] and v is None and mode!='fixed': bad.append(f'{name}:{sid}: available but {mode} missing')
            if v is not None and len(v)!=n: bad.append(f'{name}:{sid}:{mode} length {len(v)} != {n}')
        if s['available'] and s.get('native') and p['horizon']!='1D' and s['native'][-1] is None and sid in man['indices'] or (s['available'] and s.get('horizon') and s['horizon'][-1] is None and 'cadence' in s and 'daily' in s['cadence']): bad.append(f'{name}:{sid}: no value at NOW')
        if not s['available'] and (s.get('native') or s.get('horizon')): bad.append(f'{name}:{sid}: unavailable but carries values')
print('FAIL' if bad else 'PASS',len(bad),'problem(s)')
for b in bad[:30]: print(' -',b)
sys.exit(1 if bad else 0)
