#!/usr/bin/env python3
import importlib.util,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent

def load(path):
 sp=importlib.util.spec_from_file_location('refresh_stale_fixture',path);m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m);return m
class Store:
 def __init__(self):self.log_path=Path('/tmp/sot-refresh-stale.log');import threading;self.log_lock=threading.RLock()
 def rows(self,sql,args=()):
  if 'SELECT source_id FROM sources WHERE enabled=1' in sql:return [{'source_id':'a'},{'source_id':'b'}]
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
print('PASS DB refresh checks every enabled source and stale source auto-queues through existing SSOT path')
ui=(HERE/'sot-turn02-release-d-complete.html').read_text();assert "if(force){let freshness=await w.req('/api/ssot/refresh-staleness'" in ui;assert ui.count("/api/ssot/refresh-staleness")==1
print('PASS only forced DB placement refresh invokes explicit staleness checkpoint')
