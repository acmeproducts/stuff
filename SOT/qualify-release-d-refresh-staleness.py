#!/usr/bin/env python3
import importlib.util,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent

def load(path):
 sp=importlib.util.spec_from_file_location('refresh_stale_fixture',path);m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m);return m
class Store:
 def __init__(self):self.log_path=Path('/tmp/sot-refresh-stale.log');import threading;self.log_lock=threading.RLock()
 def rows(self,sql,args=()):
  if 'SELECT source_id,metadata_checked FROM sources WHERE enabled=1' in sql:return [{'source_id':'a','metadata_checked':0},{'source_id':'b','metadata_checked':0},{'source_id':'c','metadata_checked':__import__('time').time()-10},{'source_id':'d','metadata_checked':0}]
  if 'FROM job_sources js JOIN jobs j' in sql:return [{'source_id':'d'}]
  if "event_type='source_stale'" in sql:return [{'detail_json':'{"baseline":{"files":10,"bytes":100},"live":{"files":12,"bytes":150}}'}]
  if 'FROM sources s' in sql:return []
  if "state='INTERRUPTED'" in sql:return []
  return []
 def catalog_revision(self):return 1
class Mgr:
 def __init__(self):self.s=Store();self.enqueued=[];self.events=[]
 def enqueue_info(self,ids,title=None):self.enqueued.append(list(ids));return {'created':True,'job_id':'j1','queued_source_count':len(ids),'suppressed_source_count':0}
 def event(self,*a):self.events.append(a)
 def add_source(self,*a,**k):return 'x'
class H:
 path='/api/ssot/refresh-staleness'
 def sendj(self,payload,code=200):self.sent=(payload,code);return payload
 def do_GET(self):return {}
 def do_POST(self):return {}
class S:
 def __init__(self):self.M=Mgr();self.H=H;self.checked=[]
 def check_source_ids(self,ids,reason):self.checked.append((list(ids),reason));return {'checked':list(ids),'changed':['b'],'errors':[]}
s=S();m=load(HERE/'sot-turn02-release-d-autosync.py');m.install(s);h=s.H();z=h.do_POST();assert s.checked==[(['a','b'],'database_refresh')],s.checked;assert z['changed']==['b'];assert s.M.enqueued[-1]==['b'],s.M.enqueued
assert z['skipped_live']==['d'] and z['skipped_recent']==['c'],z
assert z['details']==[{'source_id':'b','baseline_files':10,'live_files':12,'baseline_bytes':100,'live_bytes':150}],z
s.checked.clear();h=s.H();h.path='/api/ssot/refresh-staleness?force=1';z=h.do_POST();assert s.checked==[(['a','b','c'],'database_refresh')],s.checked
print('PASS DB refresh checks every enabled source and stale source auto-queues through existing SSOT path')
print('PASS refresh skips sources with live sync work and sources checked in the last 5 minutes (unless forced) and reports what changed')
ui=(HERE/'sot-turn02-release-d-complete.html').read_text();assert "w.__ssotCheckSources();w.loadPlacements(true)" in ui and "w.__ssotBooting=false;w.loadPlacements(true)" in ui and "refresh-staleness?force=1" in ui and "await w.req('/api/ssot/refresh-staleness?force=1'" in ui and "let rows=[],after=0" in ui and "if(force)w.__ssotCheckSources()" not in ui;assert ui.count("/api/ssot/refresh-staleness")==1
print('PASS the staleness checkpoint runs only on manual refresh (the server already checks at its own startup), in the background, never blocking loading')
