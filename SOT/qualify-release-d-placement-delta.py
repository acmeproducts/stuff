#!/usr/bin/env python3
"""Backend contract: /api/placements/delta returns only changed rows against a retained catalog revision."""
import importlib.util,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
def load(path):
    sp=importlib.util.spec_from_file_location('delta_fixture',path);m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m);return m
class FakeStore:
    def __init__(self):
        self.revision=10;self.placements=[{'placement_no':n,'placement_id':'p%d'%n,'placement_state':'ACTIVE','size':n,'tags':'[]'} for n in range(1,201)]
    def rows(self,sql,args=()):
        if "FROM placements" in sql:return [dict(x) for x in self.placements]
        return []
    def catalog_revision(self):return self.revision
class FakeManager:
    def __init__(self):self.s=FakeStore()
    def add_source(self,*a,**k):return 'sid'
    def enqueue_info(self,*a,**k):return {}
    def restart_info(self,*a,**k):return {}
    def event(self,*a):pass
class FakeHandler:
    path='/'
    def sendj(self,payload,code=200):return payload
    def do_GET(self):return {'legacy':True}
class FakeServer:
    def __init__(self):self.M=FakeManager();self.H=FakeHandler
    def check_source_ids(self,ids,reason):return {'checked':list(ids),'changed':[],'errors':[]}
m=load(HERE/'sot-turn02-release-d-autosync.py');s=FakeServer();m.install(s)
def get(path):
    h=s.H();h.path=path;return h.do_GET()
# retained revision: the full paging snapshot records the catalog the client received
full=get('/api/placements/page?after=0&limit=5000');assert full['catalog_revision']==10 and full['total']==200
z=get('/api/placements/delta?since=10');assert z['unchanged'] and not z['full'] and z['upserts']==[] and z['removed']==[],z
print('PASS delta: unchanged catalog revision returns no rows')
s.M.s.revision=11;s.M.s.placements[4]['tags']='["x"]';s.M.s.placements.append({'placement_no':201,'placement_id':'p201','placement_state':'ACTIVE','size':201,'tags':'[]'});del s.M.s.placements[9]
z=get('/api/placements/delta?since=10');assert not z['full'] and z['catalog_revision']==11 and z['total']==200,z
assert sorted(r['placement_id'] for r in z['upserts'])==['p201','p5'] and z['removed']==['p10'],z
print('PASS delta: only edited/new rows are upserted and vanished rows are removed (1 edit + 1 add + 1 remove of 200)')
s.M.s.revision=12;z=get('/api/placements/delta?since=11');assert not z['full'] and z['upserts']==[] and z['removed']==[],z
print('PASS delta: chained revisions stay incremental')
z=get('/api/placements/delta?since=3');assert z['full'] and z['catalog_revision']==12,z
z=get('/api/placements/delta');assert z['full'],z
print('PASS delta: unknown/expired or missing revision tells the client to do a full paged load')
s.M.s.revision=13;s.M.s.placements=[dict(x,size=x['size']+1) for x in s.M.s.placements]
z=get('/api/placements/delta?since=12');assert z['full'] and z['reason']=='large change',z
print('PASS delta: a mostly-changed catalog falls back to full paging instead of a huge delta')
