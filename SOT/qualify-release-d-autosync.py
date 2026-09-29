#!/usr/bin/env python3
import importlib.util,sys
from pathlib import Path

HERE=Path(__file__).resolve().parent

def load(path):
    sp=importlib.util.spec_from_file_location('autosync_fixture',path)
    m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m);return m

class FakeStore:
    def __init__(self):self.interrupted=['fresh-job'];self.queries=[]
    def rows(self,sql,args=()):
        self.queries.append((sql,args))
        if "state='INTERRUPTED'" in sql:
            assert "ended>=?" in sql,sql
            assert len(args)==1,args
            return [{'job_id':x} for x in self.interrupted]
        if "FROM sources s" in sql:
            return [{'source_id':'sid-pending'}]
        return []

class FakeManager:
    def __init__(self):
        self.added=[];self.enqueued=[];self.events=[];self.restarted=[];self.s=FakeStore()
    def add_source(self,label,root,failure_domain,role='primary',estate=None):
        self.added.append(root);return 'sid-'+str(len(self.added))
    def enqueue_info(self,ids,title=None):
        self.enqueued.append((list(ids),title))
        return {'created':True,'job_id':'job-'+str(len(self.enqueued)),
                'queued_source_count':len(ids),'suppressed_source_count':0,
                'covering_job_ids':[]}
    def restart_info(self,jid):
        self.restarted.append(jid)
        return {'created':True,'job_id':'recovery-1','queued_source_count':3,
                'suppressed_source_count':0,'covering_job_ids':[]}
    def event(self,*args):self.events.append(args)

class FakeServer:
    def __init__(self):self.M=FakeManager();self.changed=[]
    def check_source_ids(self,ids,reason):
        return {'checked':list(ids),'changed':list(self.changed),'errors':[],'reason':reason}

m=load(HERE/'sot-turn02-release-d-autosync.py')
s=FakeServer();m.install(s)
assert s.M.restarted==['fresh-job'],s.M.restarted
assert any(x and x[0]=='job_auto_recovery' for x in s.M.events),s.M.events
print('PASS only work interrupted by the current runtime startup auto-recovers')
assert s.M.enqueued[0]==(['sid-pending'],'Automatic SSOT sync'),s.M.enqueued
print('PASS stale/pending registered sources recover automatically on startup')

sid=s.M.add_source('A','/tmp/a','/tmp/a')
assert sid=='sid-1' and s.M.enqueued[-1]==(['sid-1'],'Automatic SSOT sync'),s.M.enqueued
s.changed=['sid-1'];z=s.check_source_ids(['sid-1'],'startup')
assert z['auto_sync']['created'] and s.M.enqueued[-1]==(['sid-1'],'Automatic SSOT sync'),z
print('PASS registration is standing permission for automatic SSOT synchronization')
print('PASS stale detection automatically queues synchronization')

ui=(HERE/'sot-turn02-release-d-source-actions.html').read_text()
for required in ['SSOT','Current','Syncing','Problem','liveSourceProgress',
                 'SOT keeps registered sources current automatically']:
    assert required in ui,required
for forbidden in ['Source action needed','Kick off only uncovered sources','Analyze again',
                  "subnav(['Queue','Sources']",'System history','systemHistoryHtml','system-history']:
    assert forbidden not in ui,forbidden
assert "if(live)return 'Syncing'" in ui
print('PASS Analyze is one SSOT surface: Current / Syncing / Problem with internal history absent from the owner UI')
