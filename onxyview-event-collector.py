#!/usr/bin/env python3
import hashlib, json, math, re, time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

INPUT = Path('worldpulse-news-cache.json')
OUTPUT = Path('onxyview-event-cache.json')
MAX_EVENTS = 1200
WINDOW_MS = 96 * 60 * 60 * 1000
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
def tokens(text):
    words = re.findall(r"[a-z0-9][a-z0-9'-]+", (text or '').lower())
    return {w for w in words if len(w) > 2 and w not in STOP and not w.isdigit()}
def jaccard(a,b):
    if not a or not b: return 0.0
    return len(a & b)/len(a | b)
def event_tags(rows):
    c=Counter()
    for s in rows:
        for t in s.get('tags',[]) or []: c[t]+=1
    return [x for x,_ in c.most_common(14)]
def dominant(rows, field, default='Unknown'):
    vals=[s.get(field) or default for s in rows]
    return Counter(vals).most_common(1)[0][0] if vals else default
def source_packs_for(rows):
    src={s.get('source','') for s in rows}; out=[]
    for name,members in SOURCE_PACKS.items():
        if src.intersection(members): out.append(name)
    return out

def corroboration_points(n):
    if n >= 10: return 28.0
    if n >= 6: return 16.0 + (n-6)*3.0
    if n >= 4: return 9.0 + (n-4)*3.5
    if n == 3: return 5.0
    if n == 2: return 2.5
    return 1.0

def score_event(rows, first_seen, last_seen):
    now=now_ms(); fams={family(s.get('source','Unknown')) for s in rows}; srcs={s.get('source','Unknown') for s in rows}
    regions={s.get('region','Global') for s in rows}; span_h=max(.25,(last_seen-first_seen)/36e5); age_h=max(0,(now-last_seen)/36e5)
    corroboration=corroboration_points(len(fams))
    report_depth=min(10.0, 2.4*math.log2(1+len(rows)))
    diversity=min(10.0, 2.8*math.log2(1+len(srcs)))
    velocity=min(12.0, 4.0*len(rows)/max(1.0,math.sqrt(span_h)))
    persistence=min(8.0, 8.0*span_h/48.0)
    geo=min(7.0, 2.5*len(regions))
    freshness=15.0*math.exp(-age_h/30.0)
    # Single-source items deliberately have a low ceiling unless exceptionally fresh/deep.
    raw=corroboration+report_depth+diversity+velocity+persistence+geo+freshness
    if len(fams)==1: raw=min(raw,34.0)
    elif len(fams)==2: raw=max(raw,35.0)
    elif len(fams)>=4: raw=max(raw,55.0)
    return max(1,min(100,round(raw)))

def tier_for(importance, independent):
    if independent >= 6 or importance >= 75: return 'major'
    if independent >= 3 or importance >= 55: return 'significant'
    if independent >= 2 or importance >= 38: return 'developing'
    if importance >= 22: return 'reported'
    return 'background'

def canonical_headline(rows):
    fam_counts=Counter(family(s.get('source','Unknown')) for s in rows)
    return sorted(rows,key=lambda s:(fam_counts[family(s.get('source','Unknown'))],s.get('publishedAt',0)),reverse=True)[0].get('title','Untitled event')

def match_score(s, st, b):
    # Event identity is driven by shared entities/terms + tags + geography + temporal proximity.
    sim=jaccard(st,b['tokens'])
    tags=set(s.get('tags',[]) or []); tag_overlap=len(tags & b['tags'])
    sim += min(.22, tag_overlap*.045)
    if s.get('region') and s.get('region')==b['region']: sim += .055
    if s.get('subject') and s.get('subject')==b['subject']: sim += .035
    # Strong token intersection is more useful than raw Jaccard for differently worded headlines.
    common=len(st & b['tokens'])
    if common >= 5: sim += .15
    elif common >= 3: sim += .08
    elif common >= 2: sim += .035
    return sim

def build_events(stories):
    stories=sorted(stories,key=lambda s:s.get('publishedAt',0),reverse=True); buckets=[]
    for s in stories:
        st=tokens((s.get('title') or '')+' '+(s.get('description') or ''))
        best=None; best_score=0
        for b in buckets:
            if abs(int(s.get('publishedAt',0))-b['last']) > WINDOW_MS: continue
            score=match_score(s,st,b)
            if score>best_score: best,best_score=b,score
        threshold=.265 if len(st)>=8 else .315
        if best is not None and best_score>=threshold:
            best['rows'].append(s); best['tokens'] |= st; best['tags'] |= set(s.get('tags',[]) or []); best['first']=min(best['first'],s.get('publishedAt',0)); best['last']=max(best['last'],s.get('publishedAt',0))
        else:
            buckets.append({'rows':[s],'tokens':set(st),'tags':set(s.get('tags',[]) or []),'subject':s.get('subject','World'),'region':s.get('region','Global'),'first':s.get('publishedAt',0),'last':s.get('publishedAt',0)})
    out=[]
    for b in buckets:
        rows=sorted(b['rows'],key=lambda s:s.get('publishedAt',0),reverse=True); fams=sorted({family(s.get('source','Unknown')) for s in rows}); srcs=sorted({s.get('source','Unknown') for s in rows})
        eid=hashlib.sha1(('|'.join(sorted(s.get('id','') for s in rows)) or canonical_headline(rows)).encode()).hexdigest()[:20]
        importance=score_event(rows,b['first'],b['last']); sentiment_counts=Counter(s.get('sentiment','neutral') for s in rows)
        event={'eventId':eid,'headline':canonical_headline(rows),'importance':importance,'editorialTier':tier_for(importance,len(fams)),
          'firstSeen':b['first'],'lastSeen':b['last'],'subject':dominant(rows,'subject','World'),'region':dominant(rows,'region','Global'),
          'sentiment':dominant(rows,'sentiment','neutral'),'sentimentCounts':dict(sentiment_counts),'type':dominant(rows,'type','report'),
          'tags':event_tags(rows),'sourceCount':len(srcs),'independentSourceCount':len(fams),'articleCount':len(rows),'sources':srcs,'sourceFamilies':fams,
          'sourcePacks':source_packs_for(rows),'articles':rows}
        out.append(event)
    tier_rank={'major':5,'significant':4,'developing':3,'reported':2,'background':1}
    out.sort(key=lambda e:(tier_rank[e['editorialTier']],e['importance'],e['independentSourceCount'],e['lastSeen']),reverse=True)
    return out[:MAX_EVENTS]

def main():
    if not INPUT.exists(): raise SystemExit('worldpulse-news-cache.json not found')
    data=json.loads(INPUT.read_text()); stories=data.get('stories',[]); events=build_events(stories); generated=now_ms()
    tiers=Counter(e['editorialTier'] for e in events)
    output={'version':2,'generatedAt':iso(generated),'generatedAtMs':generated,'articleCount':len(stories),'eventCount':len(events),'sourcePacks':SOURCE_PACKS,'editorialTiers':['major','significant','developing','reported','background'],'tierCounts':dict(tiers),'events':events}
    OUTPUT.write_text(json.dumps(output,separators=(',',':'),ensure_ascii=False))
    multi=sum(1 for e in events if e['independentSourceCount']>=2)
    print(f'OnxyView v2 event intelligence: {len(events)} events from {len(stories)} articles · {multi} corroborated · tiers {dict(tiers)}')

if __name__=='__main__': main()
