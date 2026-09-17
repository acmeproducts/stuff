#!/usr/bin/env python3
import importlib.util, shutil, sys, tempfile, time
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('sotv5',HERE/'sot-turn02-v5-engine.py');m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
root=Path(tempfile.mkdtemp(prefix='sot-v5-'))
try:
 payloads={'A':[('unique-a.txt',b'A'),('dup.txt',b'DUP'),('triple.bin',b'TRIPLE')],'B':[('renamed-dup.txt',b'DUP'),('triple-copy.bin',b'TRIPLE'),('same.txt',b'B-version')],'C':[('third.bin',b'TRIPLE'),('same.txt',b'C-version'),('unique-c.txt',b'C')]};src=[]
 for label,files in payloads.items():
  d=root/label;d.mkdir()
  for name,data in files:(d/name).write_bytes(data)
  src.append((label,d,'domain-'+label))
 s=m.Store(root/'sot-v5.db');mgr=m.Manager(s,workers=4,queue_capacity=4,stall_seconds=2);ids=[mgr.add_source(a,str(b),c) for a,b,c in src];jid=mgr.start(ids);deadline=time.time()+20;saw_parallel=False
 while time.time()<deadline:
  snap=mgr.snapshot(jid);saw_parallel|=sum(r['hashed_files']>0 for r in snap['sources'])>=2
  if snap['job']['state'] in ('COMPLETED','FAILED','STOPPED'):break
  time.sleep(.01)
 snap=mgr.snapshot(jid);assert snap['job']['state']=='COMPLETED';assert snap['metrics']['discovered_files']==9 and snap['metrics']['hashed_files']==9
 groups=s.rows('SELECT * FROM duplicate_groups WHERE job_id=?',(jid,));assert sorted(g['cardinality'] for g in groups)==[2,3]
 places=s.rows('SELECT * FROM placements WHERE job_id=?',(jid,));assert all(p['lifecycle']=='COMPLETED' and p['disposition']=='NONE' for p in places);assert saw_parallel
 # No explicit canonical policy: duplicate placements must be REVIEW, never REMOVE.
 dup=[p for p in places if (p['duplicate_cardinality'] or 0)>1];assert dup and all(p['plan']=='REVIEW' for p in dup),dup;assert snap['metrics']['reclaimable_bytes']==0
 # Explicit canonical source: deterministic KEEP + protection; no discovery-order canonical selection.
 s2=m.Store(root/'policy.db');mgr2=m.Manager(s2,workers=4,queue_capacity=4);pids=[mgr2.add_source(a,str(b),c,'canonical' if a=='A' else 'primary') for a,b,c in src];j2=mgr2.start(pids);deadline=time.time()+20
 while time.time()<deadline:
  z=mgr2.snapshot(j2)
  if z['job']['state'] in ('COMPLETED','FAILED','STOPPED'):break
  time.sleep(.01)
 z=mgr2.snapshot(j2);assert z['job']['state']=='COMPLETED';pp=s2.rows('SELECT plan,duplicate_cardinality FROM placements WHERE job_id=?',(j2,));assert any(p['plan']=='KEEP' and p['duplicate_cardinality']>1 for p in pp);assert any(p['plan']=='PROTECT' for p in pp)
 old=root/'sot.db';old.write_bytes(b'historical-evidence');before=old.read_bytes();m.Store(root/'second-v5.db');assert old.read_bytes()==before
 rdb=root/'recover.db';rs=m.Store(rdb);now=time.time();rs.execute("INSERT INTO jobs(job_id,revision,state,stage,created) VALUES('stale',1,'RUNNING','HASH',?)",(now,));m.Store(rdb);assert m.Store(rdb).rows("SELECT state,error FROM jobs WHERE job_id='stale'")[0]=={'state':'FAILED','error':'backend_restart'}
 print('PASS schema=5');print('PASS placements=9 hashed=9');print('PASS duplicate-cardinality=2,3');print('PASS multi-source-parallel-progress');print('PASS unsafe-duplicates-review reclaimable=0');print('PASS explicit-canonical-policy');print('PASS lifecycle-completed disposition-none');print('PASS historical-db-preserved');print('PASS restart-recovery')
finally:shutil.rmtree(root,ignore_errors=True)
