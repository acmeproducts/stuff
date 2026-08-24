#!/usr/bin/env python3
import hashlib
import html
import json
import re
import time
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

SOURCE_CACHE = Path('worldpulse-source-cache.json')
NEWS_CACHE = Path('worldpulse-news-cache.json')
MAX_AGE_MS = 21 * 24 * 60 * 60 * 1000
MAX_SOURCE_STORIES = 600
MAX_OUTPUT_STORIES = 10000
TIMEOUT = 12
UA = 'WorldPulse/2.8 personal-news-reader (+https://acmeproducts.github.io/stuff/)'

FEEDS = [
    ('BBC World','https://feeds.bbci.co.uk/news/world/rss.xml'),
    ('BBC Business','https://feeds.bbci.co.uk/news/business/rss.xml'),
    ('BBC Technology','https://feeds.bbci.co.uk/news/technology/rss.xml'),
    ('BBC Science','https://feeds.bbci.co.uk/news/science_and_environment/rss.xml'),
    ('BBC Health','https://feeds.bbci.co.uk/news/health/rss.xml'),
    ('BBC Politics','https://feeds.bbci.co.uk/news/politics/rss.xml'),
    ('NPR World','https://feeds.npr.org/1004/rss.xml'),
    ('NPR News','https://feeds.npr.org/1001/rss.xml'),
    ('Guardian World','https://www.theguardian.com/world/rss'),
    ('Guardian Technology','https://www.theguardian.com/technology/rss'),
    ('Al Jazeera','https://www.aljazeera.com/xml/rss/all.xml'),
    ('DW','https://rss.dw.com/rdf/rss-en-all'),
    ('France 24','https://www.france24.com/en/rss'),
    ('CBC World','https://www.cbc.ca/cmlink/rss-world'),
    ('ABC Australia','https://www.abc.net.au/news/feed/51120/rss.xml'),
    ('Financial Times World','https://www.ft.com/world?format=rss'),
    ('Financial Times Markets','https://www.ft.com/markets?format=rss'),
    ('MarketWatch','https://feeds.marketwatch.com/marketwatch/topstories/'),
    ('Yahoo Finance','https://finance.yahoo.com/news/rssindex'),
    ('CNBC World','https://www.cnbc.com/id/100727362/device/rss/rss.html'),
    ('NYT World','https://rss.nytimes.com/services/xml/rss/nyt/World.xml'),
    ('NYT Technology','https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml'),
    ('TechCrunch','https://techcrunch.com/feed/'),
    ('The Verge','https://www.theverge.com/rss/index.xml'),
    ('NASA','https://www.nasa.gov/rss/dyn/breaking_news.rss'),
    ('Nature','https://www.nature.com/nature.rss'),
    ('Sky News','https://feeds.skynews.com/feeds/rss/world.xml'),
    ('Channel News Asia','https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml'),
]

POS = ['gain','rise','growth','deal','peace','recover','surge','improve','record','breakthrough','win','boost','agreement','success','strong','ceasefire']
NEG = ['war','attack','kill','death','crisis','fall','drop','loss','fear','threat','strike','sanction','conflict','recession','collapse','warning','disaster','dead']

TOPIC_TAGS = [
    ('ai', r'\bai\b|artificial intelligence|openai|anthropic|machine learning|large language model|llm'),
    ('apple', r'\bapple\b|iphone|ipad|macbook'),
    ('google', r'\bgoogle\b|alphabet|android|gemini'),
    ('microsoft', r'\bmicrosoft\b|windows|azure|copilot'),
    ('chips', r'semiconductor|\bchip\b|nvidia|amd|intel|tsmc'),
    ('crypto', r'bitcoin|ethereum|crypto|blockchain'),
    ('markets', r'stock|market|bond|yield|treasury|earnings|investor'),
    ('oil', r'\boil\b|opec|crude'),
    ('climate', r'climate|warming|carbon|emission|wildfire|hurricane'),
    ('space', r'nasa|space|moon|mars|rocket|satellite|astronom'),
    ('health', r'health|medicine|medical|hospital|vaccine|virus|drug'),
    ('ukraine', r'ukraine|kyiv|zelensky'),
    ('russia', r'russia|moscow|putin'),
    ('israel', r'israel|netanyahu'),
    ('gaza', r'gaza|hamas'),
    ('iran', r'iran|tehran'),
    ('china', r'china|beijing|xi jinping'),
    ('taiwan', r'taiwan|taipei'),
    ('india', r'india|modi|new delhi'),
    ('europe', r'european union|\beu\b|europe'),
    ('us-politics', r'white house|congress|senate|president|election|democrat|republican'),
    ('fifa', r'\bfifa\b|world cup'),
    ('football', r'football|soccer|premier league|champions league'),
]


def now_ms(): return int(time.time() * 1000)
def iso(ms=None):
    dt = datetime.fromtimestamp((ms or now_ms())/1000, tz=timezone.utc)
    return dt.isoformat().replace('+00:00','Z')

def clean(value=''):
    value = html.unescape(value or '')
    value = re.sub(r'<[^>]+>', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()

def local_name(tag): return tag.rsplit('}',1)[-1].lower()

def child_text(node, names):
    names = set(names)
    for child in list(node):
        if local_name(child.tag) in names:
            if child.text and child.text.strip(): return child.text.strip()
            if 'href' in child.attrib: return child.attrib['href'].strip()
    return ''

def parse_date(value):
    if not value: return now_ms()
    try:
        dt = parsedate_to_datetime(value)
        if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
        return int(dt.timestamp()*1000)
    except Exception:
        try:
            return int(datetime.fromisoformat(value.replace('Z','+00:00')).timestamp()*1000)
        except Exception:
            return now_ms()

def subject(text):
    t=text.lower()
    if re.search(r'war|missile|strike|ukrain|iran|israel|gaza|sanction|nato|taiwan|russia|military|conflict|election|diplom',t): return 'Geopolitics'
    if re.search(r'technology|\bai\b|artificial intelligence|chip|software|cyber|robot|apple|google|microsoft|semiconductor',t): return 'Technology'
    if re.search(r'stock|market|bond|yield|treasury|fed|oil|gold|earnings|invest|crypto|bitcoin',t): return 'Finance'
    if re.search(r'science|space|research|planet|nasa|physics|biology|astronom',t): return 'Science'
    if re.search(r'health|disease|hospital|medicine|virus|vaccine|drug|medical',t): return 'Health'
    if re.search(r'climate|weather|emission|warming|carbon|wildfire|hurricane',t): return 'Climate'
    if re.search(r'business|company|economy|trade|tariff|bank|merger|retail',t): return 'Business'
    return 'World'

def region(text):
    t=text.lower()
    rules=[
      ('North America',r'united states|\bu\.s\.|america|canada|mexico|washington|california|texas|new york'),
      ('Europe',r'europe|ukraine|russia|britain|\buk\b|france|germany|italy|spain|poland|nato|european union'),
      ('Middle East',r'middle east|israel|gaza|iran|iraq|syria|lebanon|saudi|yemen|qatar|hormuz'),
      ('Asia',r'china|japan|korea|india|pakistan|taiwan|asia|philippines|indonesia|malaysia|singapore'),
      ('Africa',r'africa|sudan|ethiopia|kenya|nigeria|congo|somalia|egypt|libya'),
      ('Latin America',r'brazil|argentina|chile|colombia|venezuela|peru|latin america'),
      ('Oceania',r'australia|new zealand|pacific')]
    for name,pattern in rules:
        if re.search(pattern,t): return name
    return 'Global'

def sentiment(text):
    t=text.lower(); score=sum(1 for w in POS if w in t)-sum(1 for w in NEG if w in t)
    return 'positive' if score>0 else 'negative' if score<0 else 'neutral'

def story_type(title,desc):
    t=(title+' '+desc).lower()
    if re.search(r'live|breaking|just in|developing',t): return 'breaking'
    if re.search(r'analysis|explainer|what to know|why |how ',t): return 'analysis'
    if re.search(r'opinion|comment|editorial',t): return 'opinion'
    return 'report'

def tagify(value):
    value = re.sub(r'[^a-z0-9]+','-',str(value).lower()).strip('-')
    return value[:48]

def story_tags(title, desc, source, subj, reg, typ, sent):
    text=(title+' '+desc).lower()
    tags=[]
    def add(v):
        v=tagify(v)
        if v and v not in tags: tags.append(v)
    add(subj); add(reg); add(typ); add(sent); add(source)
    for name,pattern in TOPIC_TAGS:
        if re.search(pattern,text): add(name)
    return tags[:12]

def fetch(url, etag=None, modified=None):
    headers={'User-Agent':UA,'Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'}
    if etag: headers['If-None-Match']=etag
    if modified: headers['If-Modified-Since']=modified
    req=urllib.request.Request(url,headers=headers)
    try:
        with urllib.request.urlopen(req,timeout=TIMEOUT) as r:
            return r.status, r.read(), r.headers.get('ETag'), r.headers.get('Last-Modified')
    except urllib.error.HTTPError as e:
        if e.code==304: return 304,b'',etag,modified
        raise

def parse_feed(raw, source):
    root=ET.fromstring(raw)
    items=[]
    for node in root.iter():
        if local_name(node.tag) not in ('item','entry'): continue
        title=clean(child_text(node,['title']))
        link=child_text(node,['link'])
        if not link:
            for ch in list(node):
                if local_name(ch.tag)=='link' and ch.attrib.get('href'):
                    link=ch.attrib['href']; break
        desc=clean(child_text(node,['description','summary','content','encoded']))
        published=parse_date(child_text(node,['pubdate','published','updated','date']))
        guid=child_text(node,['guid','id']) or link or (source+'|'+title)
        if not title or not link: continue
        text=title+' '+desc
        subj=subject(text); reg=region(text); sent=sentiment(text); typ=story_type(title,desc)
        sid=hashlib.sha1(guid.encode('utf-8','ignore')).hexdigest()
        items.append({'id':sid,'title':title,'link':link,'description':desc,'source':source,'publishedAt':published,'subject':subj,'region':reg,'sentiment':sent,'type':typ,'tags':story_tags(title,desc,source,subj,reg,typ,sent)})
        if len(items)>=100: break
    return items

def load_source_cache():
    if not SOURCE_CACHE.exists(): return {'version':2,'sources':{}}
    try: return json.loads(SOURCE_CACHE.read_text())
    except Exception: return {'version':2,'sources':{}}

def ensure_tags(story):
    if story.get('tags'): return story
    text=(story.get('title','')+' '+story.get('description',''))
    subj=story.get('subject') or subject(text)
    reg=story.get('region') or region(text)
    sent=story.get('sentiment') or sentiment(text)
    typ=story.get('type') or story_type(story.get('title',''),story.get('description',''))
    story['subject']=subj; story['region']=reg; story['sentiment']=sent; story['type']=typ
    story['tags']=story_tags(story.get('title',''),story.get('description',''),story.get('source','Unknown'),subj,reg,typ,sent)
    return story

def merge_source_stories(previous, incoming):
    cutoff=now_ms()-MAX_AGE_MS
    merged={}
    for s in list(previous or [])+list(incoming or []):
        if int(s.get('publishedAt',0)) < cutoff: continue
        ensure_tags(s)
        k=re.sub(r'[?#].*$','',s.get('link') or s.get('id') or s.get('title',''))
        if k not in merged or int(s.get('publishedAt',0))>int(merged[k].get('publishedAt',0)):
            merged[k]=s
    return sorted(merged.values(),key=lambda x:int(x.get('publishedAt',0)),reverse=True)[:MAX_SOURCE_STORIES]

def main():
    cache=load_source_cache(); sources=cache.setdefault('sources',{}); started=now_ms()
    for name,url in FEEDS:
        prev=sources.get(name,{})
        prev_stories=merge_source_stories(prev.get('stories',[]),[])
        rec={'url':url,'lastAttempt':iso(),'lastAttemptMs':now_ms(),'lastSuccess':prev.get('lastSuccess'),'lastSuccessMs':prev.get('lastSuccessMs'),'etag':prev.get('etag'),'lastModified':prev.get('lastModified'),'stories':prev_stories,'status':'stale','error':None,'failureCount':prev.get('failureCount',0)}
        try:
            status,raw,etag,modified=fetch(url,prev.get('etag'),prev.get('lastModified'))
            if status==304:
                rec.update(status='not-modified',error=None,failureCount=0,etag=etag,lastModified=modified,lastSuccess=prev.get('lastSuccess') or iso(),lastSuccessMs=prev.get('lastSuccessMs') or now_ms())
            else:
                fresh=parse_feed(raw,name)
                if not fresh: raise RuntimeError('feed parsed with 0 usable stories')
                accumulated=merge_source_stories(prev_stories,fresh)
                rec.update(status='healthy',error=None,failureCount=0,etag=etag,lastModified=modified,lastSuccess=iso(),lastSuccessMs=now_ms(),stories=accumulated)
            print(f'{name}: {rec["status"]} · {len(rec["stories"])} retained stories')
        except Exception as e:
            rec['status']='stale' if rec['stories'] else 'failed'
            rec['failureCount']=int(prev.get('failureCount',0))+1
            rec['error']=f'{type(e).__name__}: {e}'[:300]
            print(f'{name}: {rec["status"]} · keeping {len(rec["stories"])} cached · {rec["error"]}')
        sources[name]=rec

    cutoff=now_ms()-MAX_AGE_MS; merged={}; statuses=[]
    for name,_ in FEEDS:
        rec=sources.get(name,{})
        rows=merge_source_stories(rec.get('stories',[]),[])
        rec['stories']=rows
        statuses.append({'source':name,'status':rec.get('status','unknown'),'stories':len(rows),'lastSuccess':rec.get('lastSuccess'),'lastAttempt':rec.get('lastAttempt'),'failureCount':rec.get('failureCount',0),'error':rec.get('error')})
        for s in rows:
            if int(s.get('publishedAt',0))<cutoff: continue
            ensure_tags(s)
            k=re.sub(r'[?#].*$','',s.get('link') or s.get('title',''))
            if k not in merged or int(s.get('publishedAt',0))>int(merged[k].get('publishedAt',0)): merged[k]=s
    stories=sorted(merged.values(),key=lambda x:int(x.get('publishedAt',0)),reverse=True)[:MAX_OUTPUT_STORIES]
    generated=now_ms()
    cache.update({'version':2,'generatedAt':iso(generated),'generatedAtMs':generated,'durationMs':generated-started,'retentionDays':21,'sources':sources})
    SOURCE_CACHE.write_text(json.dumps(cache,separators=(',',':'),ensure_ascii=False))
    out={'version':2,'generatedAt':iso(generated),'generatedAtMs':generated,'retentionDays':21,'storyCount':len(stories),'sourceCount':len(FEEDS),'sources':statuses,'stories':stories}
    NEWS_CACHE.write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False))
    print(f'Published {len(stories)} stories retained up to 21 days from {len(FEEDS)} configured sources')

if __name__=='__main__': main()
