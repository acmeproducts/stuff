#!/usr/bin/env python3
import hashlib, json, math, re, time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

INPUT = Path('worldpulse-news-cache.json')
OUTPUT = Path('onxyview-event-cache.json')
INDEX_OUTPUT = Path('onxyview-event-index.json')
MAX_EVENTS = 1200
WINDOW_MS = 72 * 60 * 60 * 1000
MAX_INDEX_REPORTS = 8
STOP = set('a an and are as at be been being by for from has have how in into is it its of on or that the their this to was were what when where which who why will with after amid over under new says say said report reports update live latest'.split())
SOURCE_PACKS = {
  'Core Global': ['Reuters','AP','BBC World','BBC Business','BBC Technology','BBC Science','BBC Health','BBC Politics','DW','France 24','Channel News Asia','ABC Australia','CBC World','Al Jazeera'],
  'Markets': ['Reuters','Financial Times World','Financial Times Markets','CNBC World','MarketWatch','Yahoo Finance','WSJ'],
  'Technology': ['Reuters','BBC Technology','NYT Technology','TechCrunch','The Verge'],
  'US Spectrum': ['AP','Reuters','NYT World','NYT Technology','CNBC World','NPR News','NPR World','WSJ','CNN','Fox News','Washington Post']
}
SOURCE_FAMILY = {
  'BBC World':'BBC','BBC Business':'BBC','BBC Technology':'BBC','BBC Science':'BBC','BBC Health':'BBC','BBC Politics':'BBC',
  'Financial Times World':'Financial Times','Financial Times Markets':'Financial Times','NYT World':'New York Times','NYT Technology':'New York Times'
}

def now_ms(): return int(time.time()*1000)
def iso(ms=None): return datetime.fromtimestamp((ms or now_ms())/1000, tz=timezone.utc).isoformat().replace('+00:00','Z')
def family(src): return SOURCE_FAMILY.get(src, src)
def clean_text(text):
    text=re.sub(r'<[^>]+>',' ',text or '')
    return re.sub(r'\s+',' ',text).strip()
def tokens(text):
    words=re.findall(r"[a-z0-9][a-z0-9'-]+",(text or '').lower())
    return {w for w in words if len(w)>2 and w not in STOP and not w.isdigit()}
def jaccard(a,b):
    return len(a & b)/len(a | b) if a and b else 0.0
def event_tags(rows):
    c=Counter()
    for s in rows:
        for t in s.get('tags',[]) or []: c[t]+=1
    return [x for x,_ in c.most_common(14)]
def dominant(rows,field,default='Unknown'):
    vals=[s.get(field) or default for s in rows]
    return Counter(vals).most_common(1)[0][0] if vals else default
def source_packs_for(rows):
    src={s.get('source','') for s in rows}; out=[]
    for name,members in SOURCE_PACKS.items():
        if src.intersection(members): out.append(name)
    return out

def event_summary(rows,headline):
    candidates=[]; seen=set(); ht=tokens(headline)
    for s in rows:
        desc=clean_text(s.get('description') or s.get('summary') or '')
        if len(desc)<45: continue
        key=desc.lower()[:180]
        if key in seen: continue
        seen.add(key)
        candidates.append((len(tokens(desc)&ht),s.get('publishedAt',0),desc))
    candidates.sort(reverse=True)
    chosen=[]
    for _,_,desc in candidates:
        first=re.split(r'(?<=[.!?])\s+',desc)[0].strip()
        if len(first)<35: first=desc
        first=first[:340].rstrip()
        if first and all(first.lower()[:100]!=x.lower()[:100] for x in chosen): chosen.append(first)
        if len(chosen)>=2: break
    return ' '.join(chosen)[:620].rstrip()

def corroboration_points(n):
    if n>=10:return 28.0
    if n>=6:return 16.0+(n-6)*3.0
    if n>=4:return 9.0+(n-4)*3.5
    if n==3:return 5.0
    if n==2:return 2.5
    return 1.0

def score_event(rows,first_seen,last_seen):
    now=now_ms(); fams={family(s.get('source','Unknown')) for s in rows}; srcs={s.get('source','Unknown') for s in rows}
    regions={s.get('region','Global') for s in rows}; span_h=max(.25,(last_seen-first_seen)/36e5); age_h=max(0,(now-last_seen)/36e5)
    raw=(corroboration_points(len(fams)) + min(10,2.4*math.log2(1+len(rows))) + min(10,2.8*math.log2(1+len(srcs))) +
         min(12,4.0*len(rows)/max(1,math.sqrt(span_h))) + min(8,8*span_h/48) + min(7,2.5*len(regions)) + 15*math.exp(-age_h/30))
    if len(fams)==1: raw=min(raw,34)
    elif len(fams)==2: raw=max(raw,35)
    elif len(fams)>=4: raw=max(raw,55)
    return max(1,min(100,round(raw)))
def tier_for(importance,independent):
    if independent>=6 or importance>=75:return 'major'
    if independent>=3 or importance>=55:return 'significant'
    if independent>=2 or importance>=38:return 'developing'
    if importance>=22:return 'reported'
    return 'background'
def canonical_headline(rows):
    fam_counts=Counter(family(s.get('source','Unknown')) for s in rows)
    return sorted(rows,key=lambda s:(fam_counts[family(s.get('source','Unknown'))],s.get('publishedAt',0)),reverse=True)[0].get('title','Untitled event')

def story_signature(s):
    title=tokens(s.get('title') or '')
    desc=tokens(s.get('description') or '')
    return title, title | set(list(desc)[:18])

def match_score(s,title_tokens,text_tokens,b):
    # IMPORTANT: compare only against a fixed representative signature. Never union
    # every story's vocabulary into the bucket; that caused topic drift and giant events.
    title_common=len(title_tokens & b['title_tokens'])
    text_common=len(text_tokens & b['seed_tokens'])
    if title_common==0 and text_common<3: return -1
    score=0.58*jaccard(title_tokens,b['title_tokens']) + 0.32*jaccard(text_tokens,b['seed_tokens'])
    score += min(.16,title_common*.04) + min(.10,text_common*.015)
    tags=set(s.get('tags',[]) or [])
    meaningful_tags={t for t in tags & b['tags'] if t not in {'report','analysis','breaking','neutral','positive','negative','global','world'}}
    score += min(.10,len(meaningful_tags)*.025)
    if s.get('region') and s.get('region')==b['region'] and s.get('region')!='Global': score += .045
    if s.get('subject') and s.get('subject')==b['subject'] and s.get('subject')!='World': score += .025
    return score

def build_events(stories):
    stories=sorted(stories,key=lambda s:s.get('publishedAt',0),reverse=True); buckets=[]
    for s in stories:
        tt,st=story_signature(s); best=None; best_score=-1
        for b in buckets:
            if abs(int(s.get('publishedAt',0))-b['last'])>WINDOW_MS: continue
            score=match_score(s,tt,st,b)
            if score>best_score: best,best_score=b,score
        # Require genuine lexical identity. Short generic stories are deliberately harder to merge.
        threshold=.31 if len(tt)>=5 else .38
        if best is not None and best_score>=threshold:
            best['rows'].append(s); best['tags'].update(s.get('tags',[]) or []); best['first']=min(best['first'],s.get('publishedAt',0)); best['last']=max(best['last'],s.get('publishedAt',0))
        else:
            buckets.append({'rows':[s],'title_tokens':set(tt),'seed_tokens':set(st),'tags':set(s.get('tags',[]) or []),'subject':s.get('subject','World'),'region':s.get('region','Global'),'first':s.get('publishedAt',0),'last':s.get('publishedAt',0)})
    out=[]
    for b in buckets:
        rows=sorted(b['rows'],key=lambda s:s.get('publishedAt',0),reverse=True); fams=sorted({family(s.get('source','Unknown')) for s in rows}); srcs=sorted({s.get('source','Unknown') for s in rows})
        headline=canonical_headline(rows); eid=hashlib.sha1(('|'.join(sorted(s.get('id','') for s in rows)) or headline).encode()).hexdigest()[:20]
        importance=score_event(rows,b['first'],b['last']); sc=Counter(s.get('sentiment','neutral') for s in rows)
        out.append({'eventId':eid,'headline':headline,'summary':event_summary(rows,headline),'importance':importance,'editorialTier':tier_for(importance,len(fams)),
          'firstSeen':b['first'],'lastSeen':b['last'],'subject':dominant(rows,'subject','World'),'region':dominant(rows,'region','Global'),'sentiment':dominant(rows,'sentiment','neutral'),
          'sentimentCounts':dict(sc),'type':dominant(rows,'type','report'),'tags':event_tags(rows),'sourceCount':len(srcs),'independentSourceCount':len(fams),'articleCount':len(rows),
          'sources':srcs,'sourceFamilies':fams,'sourcePacks':source_packs_for(rows),'articles':rows})
    tr={'major':5,'significant':4,'developing':3,'reported':2,'background':1}
    out.sort(key=lambda e:(tr[e['editorialTier']],e['importance'],e['independentSourceCount'],e['lastSeen']),reverse=True)
    return out[:MAX_EVENTS]

def compact_event(e):
    reports=[]; seen_fam=set()
    # Prefer source diversity in the browser payload.
    for a in e.get('articles',[]):
        fam=family(a.get('source','Unknown'))
        if fam in seen_fam and len(reports)<4: continue
        seen_fam.add(fam)
        reports.append({'title':a.get('title',''),'link':a.get('link') or a.get('url',''),'description':clean_text(a.get('description') or '')[:420],
                        'source':a.get('source',''),'publishedAt':a.get('publishedAt',0)})
        if len(reports)>=MAX_INDEX_REPORTS: break
    return {k:e.get(k) for k in ('eventId','headline','summary','importance','editorialTier','firstSeen','lastSeen','subject','region','sentiment','sentimentCounts','type','tags','sourceCount','independentSourceCount','articleCount','sources','sourceFamilies','sourcePacks')} | {'articles':reports}

def main():
    if not INPUT.exists(): raise SystemExit('worldpulse-news-cache.json not found')
    raw=json.loads(INPUT.read_text()); stories=raw.get('stories',[]); events=build_events(stories); generated=now_ms(); tiers=Counter(e['editorialTier'] for e in events)
    common={'version':4,'generatedAt':iso(generated),'generatedAtMs':generated,'articleCount':len(stories),'eventCount':len(events),'sourcePacks':SOURCE_PACKS,
            'editorialTiers':['major','significant','developing','reported','background'],'tierCounts':dict(tiers)}
    OUTPUT.write_text(json.dumps(common|{'events':events},separators=(',',':'),ensure_ascii=False))
    INDEX_OUTPUT.write_text(json.dumps(common|{'events':[compact_event(e) for e in events]},separators=(',',':'),ensure_ascii=False))
    biggest=max((e['articleCount'] for e in events),default=0); multi=sum(1 for e in events if e['independentSourceCount']>=2)
    print(f'OnxyView v4: {len(events)} events / {len(stories)} articles · {multi} corroborated · largest cluster {biggest} · lightweight index written')
    if biggest>80: raise SystemExit(f'cluster safety gate failed: largest cluster has {biggest} articles')

if __name__=='__main__': main()
