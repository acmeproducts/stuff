#!/usr/bin/env python3
import hashlib, json, math, re, time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

INPUT = Path('worldpulse-news-cache.json')
OUTPUT = Path('onxyview-event-cache.json')
MAX_EVENTS = 1200
WINDOW_MS = 72 * 60 * 60 * 1000
STOP = set('a an and are as at be been being by for from has have how in into is it its of on or that the their this to was were what when where which who why will with after amid over under new says say said'.split())
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
    return [x for x,_ in c.most_common(12)]
def dominant(rows, field, default='Unknown'):
    vals=[s.get(field) or default for s in rows]
    return Counter(vals).most_common(1)[0][0] if vals else default
def source_packs_for(rows):
    src={s.get('source','') for s in rows}
    out=[]
    for name,members in SOURCE_PACKS.items():
        if src.intersection(members): out.append(name)
    return out

def score_event(rows, first_seen, last_seen):
    now=now_ms(); families={family(s.get('source','Unknown')) for s in rows}; sources={s.get('source','Unknown') for s in rows}
    regions={s.get('region','Global') for s in rows}; span_h=max(0.25,(last_seen-first_seen)/36e5); age_h=max(0,(now-last_seen)/36e5)
    breadth=min(1, math.log2(1+len(families))/4)
    source_div=min(1, math.log2(1+len(sources))/4)
    velocity=min(1, len(rows)/max(1,span_h)/4)
    persistence=min(1, span_h/36)
    geo=min(1, len(regions)/3)
    freshness=math.exp(-age_h/36)
    raw=.30*breadth+.18*source_div+.20*velocity+.12*persistence+.08*geo+.12*freshness
    return max(1,min(100,round(raw*100)))

def canonical_headline(rows):
    # Prefer the headline from the newest story among the most widely represented source families.
    fam_counts=Counter(family(s.get('source','Unknown')) for s in rows)
    return sorted(rows, key=lambda s:(fam_counts[family(s.get('source','Unknown'))], s.get('publishedAt',0)), reverse=True)[0].get('title','Untitled event')

def build_events(stories):
    stories=sorted(stories,key=lambda s:s.get('publishedAt',0),reverse=True)
    buckets=[]
    for s in stories:
        t=tokens((s.get('title') or '')+' '+(s.get('description') or ''))
        best=None; best_score=0
        for b in buckets:
            if abs(int(s.get('publishedAt',0))-b['last']) > WINDOW_MS: continue
            if s.get('subject') != b['subject'] and s.get('region') != b['region']: continue
            sim=jaccard(t,b['tokens'])
            tag_overlap=len(set(s.get('tags',[]) or []) & b['tags'])
            sim += min(.18, tag_overlap*.035)
            if sim>best_score: best,best_score=b,sim
        threshold=.31 if len(t)>=6 else .38
        if best is not None and best_score>=threshold:
            best['rows'].append(s); best['tokens'] |= t; best['tags'] |= set(s.get('tags',[]) or []); best['first']=min(best['first'],s.get('publishedAt',0)); best['last']=max(best['last'],s.get('publishedAt',0))
        else:
            buckets.append({'rows':[s],'tokens':set(t),'tags':set(s.get('tags',[]) or []),'subject':s.get('subject','World'),'region':s.get('region','Global'),'first':s.get('publishedAt',0),'last':s.get('publishedAt',0)})
    out=[]
    for b in buckets:
        rows=sorted(b['rows'],key=lambda s:s.get('publishedAt',0),reverse=True)
        fams=sorted({family(s.get('source','Unknown')) for s in rows})
        srcs=sorted({s.get('source','Unknown') for s in rows})
        eid=hashlib.sha1(('|'.join(sorted(s.get('id','') for s in rows)) or canonical_headline(rows)).encode()).hexdigest()[:20]
        sentiment_counts=Counter(s.get('sentiment','neutral') for s in rows)
        event={
          'eventId':eid,'headline':canonical_headline(rows),'importance':score_event(rows,b['first'],b['last']),
          'firstSeen':b['first'],'lastSeen':b['last'],'subject':dominant(rows,'subject','World'),'region':dominant(rows,'region','Global'),
          'sentiment':dominant(rows,'sentiment','neutral'),'sentimentCounts':dict(sentiment_counts),'type':dominant(rows,'type','report'),
          'tags':event_tags(rows),'sourceCount':len(srcs),'independentSourceCount':len(fams),'sources':srcs,'sourceFamilies':fams,
          'sourcePacks':source_packs_for(rows),'articles':rows
        }
        out.append(event)
    out.sort(key=lambda e:(e['importance'],e['lastSeen']), reverse=True)
    return out[:MAX_EVENTS]

def main():
    if not INPUT.exists(): raise SystemExit('worldpulse-news-cache.json not found')
    data=json.loads(INPUT.read_text())
    stories=data.get('stories',[])
    events=build_events(stories)
    generated=now_ms()
    output={'version':1,'generatedAt':iso(generated),'generatedAtMs':generated,'articleCount':len(stories),'eventCount':len(events),'sourcePacks':SOURCE_PACKS,'events':events}
    OUTPUT.write_text(json.dumps(output,separators=(',',':'),ensure_ascii=False))
    multi=sum(1 for e in events if e['independentSourceCount']>=2)
    print(f'OnxyView: {len(events)} events from {len(stories)} articles · {multi} corroborated by 2+ source families')

if __name__=='__main__': main()
