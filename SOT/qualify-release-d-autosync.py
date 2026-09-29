#!/usr/bin/env python3
import importlib.util,sys
from pathlib import Path

HERE=Path(__file__).resolve().parent

def load(path):
    sp=importlib.util.spec_from_file_location('autosync_fixture',path)
    m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m);return m

class FakeManager:
    def __init__(self):self.added=[];self.enqueued=[];self.events=[]
    def add_source(self,label,root,failure_domain,role='primary',estate=None):self.added.append(root);return 'sid-'+str(len(self.added))
    def enqueue_info(self,ids,title=None):self.enqueued.append((list(ids),title));return {'created':True,'job_id':'job-'+str(len(self.enqueued)),'queued_source_count':len(ids),'suppressed_source_count':0}
    def event(self,*args):self.events.append(args)
class FakeServer:
    def __init__(self):self.M=FakeManager();self.changed=[]
    def check_source_ids(self,ids,reason):return {'checked':list(ids),'changed':list(self.changed),'errors':[],'reason':reason}

m=load(HERE/'sot-turn02-release-d-autosync.py')
s=FakeServer();m.install(s)
sid=s.M.add_source('A','/tmp/a','/tmp/a')
assert sid=='sid-1' and s.M.enqueued[-1]==(['sid-1'],'Automatic SSOT sync'),s.M.enqueued
s.changed=['sid-1'];z=s.check_source_ids(['sid-1'],'startup')
assert z['auto_sync']['created'] and s.M.enqueued[-1]==(['sid-1'],'Automatic SSOT sync'),z
print('PASS registration is standing permission for automatic SSOT synchronization')
print('PASS stale detection automatically queues synchronization')

ui=(HERE/'sot-turn02-release-d-source-actions.html').read_text()
for required in ['Current','Updating','Problem','Registered','synchronize automatically','renderSourceStatusGroups']:
    assert required in ui,required
for forbidden in ['Analyze N','Analyze again','Need analysis</span>']:
    assert forbidden not in ui,forbidden
print('PASS source UI is Current / Updating / Problem with no manual re-analysis control')
