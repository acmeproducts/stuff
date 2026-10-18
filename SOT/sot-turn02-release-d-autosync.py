#!/usr/bin/env python3
import collections,hashlib,importlib.util,json,os,shutil,subprocess,sys,threading,time
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs,urlparse

LIVE_STATES=("QUEUED","RUNNING","PAUSED","STOPPING")
PLACEMENT_PAGE_SIZE=5000
PLACEMENT_PAGE_MAX=10000
PLACEMENT_SNAPSHOT_TTL=120
PLACEMENT_HISTORY_MAX=4
REFRESH_COOLDOWN=300
PLACEMENT_DELTA_FULL_RATIO=0.5

def placement_digest(row):
    return hashlib.blake2b(json.dumps(row,sort_keys=True,default=str,separators=(',',':')).encode(),digest_size=8).hexdigest()
LOG_PUBLISH_INTERVAL=max(60,int(os.environ.get("SOT_LOG_PUBLISH_INTERVAL","300")))

STATE_DIR=Path.home()/".sot-turn02"
STARTUP_TRACE=STATE_DIR/"startup-trace.log"
STARTUP_MARK=STATE_DIR/"startup.inprogress"
STABLE_AFTER=180
SAFE_START=False  # decided by main() for the real service only; tests and imports never touch the mark

def trace(msg):
    # written straight to disk so the last step survives a crash of the whole machine
    try:
        STATE_DIR.mkdir(parents=True,exist_ok=True)
        with open(STARTUP_TRACE,"a") as f:
            f.write(time.strftime("%Y-%m-%d %H:%M:%S ")+str(msg)+"\n");f.flush();os.fsync(f.fileno())
    except Exception:pass

def mark_startup():
    try:
        STATE_DIR.mkdir(parents=True,exist_ok=True)
        with open(STARTUP_MARK,"w") as f:f.write(str(time.time()));f.flush();os.fsync(f.fileno())
    except Exception:pass

def install(srv):
    original_check=srv.check_source_ids
    original_add=srv.M.add_source
    original_get=srv.H.do_GET
    original_post=getattr(srv.H,"do_POST",None)
    srv._log_publish_status={"configured":False,"last_publish":None,"last_error":None,"published":False}
    srv._placement_snapshot_lock=threading.RLock()
    srv._placement_cursor_snapshots={}
    srv._placement_history=collections.OrderedDict()

    def remember_placements(rev,rows):
        srv._placement_history[rev]={r['placement_id']:placement_digest(r) for r in rows}
        srv._placement_history.move_to_end(rev)
        while len(srv._placement_history)>PLACEMENT_HISTORY_MAX:srv._placement_history.popitem(last=False)

    def placement_page(handler):
        u=urlparse(handler.path);q=parse_qs(u.query)
        try:after=max(0,int(q.get("after",["0"])[0] or 0))
        except Exception:after=0
        try:limit=max(1,min(PLACEMENT_PAGE_MAX,int(q.get("limit",[str(PLACEMENT_PAGE_SIZE)])[0] or PLACEMENT_PAGE_SIZE)))
        except Exception:limit=PLACEMENT_PAGE_SIZE
        now=time.time()
        with srv._placement_snapshot_lock:
            for cursor,snap in list(srv._placement_cursor_snapshots.items()):
                if now-float(snap["created"])>PLACEMENT_SNAPSHOT_TTL:
                    srv._placement_cursor_snapshots.pop(cursor,None)
            snap=srv._placement_cursor_snapshots.get(after) if after else None
            if snap is None:
                rows=srv.M.s.rows("SELECT * FROM placements WHERE placement_state='ACTIVE' ORDER BY placement_no")
                snap={"created":now,"catalog_revision":srv.M.s.catalog_revision(),"placements":rows}
                remember_placements(snap["catalog_revision"],rows)
            rows=snap["placements"]
            start=0
            if after:
                while start<len(rows) and int(rows[start]["placement_no"])<=after:start+=1
            page=rows[start:start+limit]
            has_more=start+len(page)<len(rows)
            next_after=int(page[-1]["placement_no"]) if page else after
            if has_more and page:
                srv._placement_cursor_snapshots[next_after]=snap
        return handler.sendj({"ok":True,"catalog_revision":snap["catalog_revision"],"total":len(rows),"page_size":len(page),"has_more":has_more,"next_after":next_after,"placements":page})

    def placement_delta(handler):
        q=parse_qs(urlparse(handler.path).query)
        try:since=int(q.get("since",[""])[0])
        except Exception:return handler.sendj({"ok":True,"full":True,"reason":"since required"})
        with srv._placement_snapshot_lock:
            rev=srv.M.s.catalog_revision()
            if rev==since:return handler.sendj({"ok":True,"full":False,"unchanged":True,"catalog_revision":rev,"upserts":[],"removed":[]})
            old=srv._placement_history.get(since)
            rows=srv.M.s.rows("SELECT * FROM placements WHERE placement_state='ACTIVE' ORDER BY placement_no")
            cur={r["placement_id"]:placement_digest(r) for r in rows}
            srv._placement_history[rev]=cur;srv._placement_history.move_to_end(rev)
            while len(srv._placement_history)>PLACEMENT_HISTORY_MAX:srv._placement_history.popitem(last=False)
            if old is None:return handler.sendj({"ok":True,"full":True,"reason":"revision not retained","catalog_revision":rev,"total":len(rows)})
            upserts=[r for r in rows if old.get(r["placement_id"])!=cur[r["placement_id"]]]
            removed=[i for i in old if i not in cur]
            if len(upserts)+len(removed)>max(1,len(rows))*PLACEMENT_DELTA_FULL_RATIO:return handler.sendj({"ok":True,"full":True,"reason":"large change","catalog_revision":rev,"total":len(rows)})
        return handler.sendj({"ok":True,"full":False,"unchanged":False,"catalog_revision":rev,"total":len(rows),"upserts":upserts,"removed":removed})

    def log_tail(handler):
        u=urlparse(handler.path);q=parse_qs(u.query)
        try:limit=max(1,min(10000,int(q.get("limit",["3000"])[0] or 3000)))
        except Exception:limit=3000
        path=srv.M.s.log_path
        with srv.M.s.log_lock:lines=path.read_text(errors="replace").splitlines()[-limit:] if path.exists() else []
        return handler.sendj({"ok":True,"lines":lines,"count":len(lines),"publish":dict(srv._log_publish_status)})

    def refresh_staleness(handler):
        force=parse_qs(urlparse(handler.path).query).get("force",["0"])[0]=="1"
        now=time.time()
        rows=srv.M.s.rows("SELECT source_id,metadata_checked FROM sources WHERE enabled=1 ORDER BY source_id")
        live=set(r["source_id"] for r in srv.M.s.rows("""SELECT DISTINCT js.source_id FROM job_sources js JOIN jobs j ON j.job_id=js.job_id
                                                         WHERE COALESCE(j.deleted,0)=0 AND j.state IN ('QUEUED','RUNNING','PAUSED','STOPPING')"""))
        ids=[];skipped_live=[];skipped_recent=[]
        for r in rows:
            sid=r["source_id"]
            if sid in live:skipped_live.append(sid)
            elif not force and now-float(r.get("metadata_checked") or 0)<REFRESH_COOLDOWN:skipped_recent.append(sid)
            else:ids.append(sid)
        result=srv.check_source_ids(ids,"database_refresh") if ids else {"checked":[],"changed":[],"errors":[]}
        details=[]
        for sid in result.get("changed",[]):
            ev=srv.M.s.rows("SELECT detail_json FROM events WHERE source_id=? AND event_type='source_stale' ORDER BY ts DESC LIMIT 1",(sid,))
            try:d=json.loads(ev[0]["detail_json"]) if ev else {}
            except Exception:d={}
            b=d.get("baseline") or {};l=d.get("live") or {}
            details.append({"source_id":sid,"baseline_files":b.get("files"),"live_files":l.get("files"),"baseline_bytes":b.get("bytes"),"live_bytes":l.get("bytes")})
        return handler.sendj({"ok":True,"checked":result.get("checked",ids),"changed":result.get("changed",[]),"errors":result.get("errors",[]),"auto_sync":result.get("auto_sync"),"skipped_live":skipped_live,"skipped_recent":skipped_recent,"details":details})

    def clear_log(handler):
        path=srv.M.s.log_path
        with srv.M.s.log_lock:
            path.parent.mkdir(parents=True,exist_ok=True);path.write_text("")
        srv.M.event("diagnostic_log_cleared","Structured runtime log cleared by owner",None,None,"INFO",{})
        return handler.sendj({"ok":True})

    def do_GET(handler):
        path=urlparse(handler.path).path
        if path=="/api/placements/page":
            try:return placement_page(handler)
            except Exception as e:return handler.sendj({"ok":False,"error":str(e)},500)
        if path=="/api/placements/delta":
            try:return placement_delta(handler)
            except Exception as e:return handler.sendj({"ok":False,"error":str(e)},500)
        if path=="/api/diagnostics/log":
            try:return log_tail(handler)
            except Exception as e:return handler.sendj({"ok":False,"error":str(e)},500)
        return original_get(handler)

    def do_POST(handler):
        path=urlparse(handler.path).path
        if path=="/api/ssot/refresh-staleness":
            try:return refresh_staleness(handler)
            except BrokenPipeError:
                print("Client disconnected before staleness data could be returned.")
                return None
            except Exception as e:return handler.sendj({"ok":False,"error":str(e)},500)
        if path=="/api/diagnostics/log/clear":
            try:return clear_log(handler)
            except Exception as e:return handler.sendj({"ok":False,"error":str(e)},500)
        if original_post:return original_post(handler)
        return handler.sendj({"ok":False,"error":"Not found"},404)

    def publish_live_log():
        repo=getattr(srv,"DIAG_REPO_DIR",Path.home()/".sot-turn02"/"diagnostics-repo");status=srv._log_publish_status
        status["configured"]=(repo/".git").exists()
        if not status["configured"]:
            status["published"]=False;status["last_error"]=None;return dict(status)
        src=srv.M.s.log_path
        if not src.exists():return dict(status)
        target=repo/"live"/"sot-release-d-events.jsonl";target.parent.mkdir(parents=True,exist_ok=True);tmp=target.with_suffix(target.suffix+".tmp")
        with srv.M.s.log_lock:shutil.copy2(src,tmp)
        os.replace(tmp,target)
        lock=repo/".git"/"index.lock"
        # a git run killed mid-way (e.g. by a shutdown) leaves this behind and blocks every later publish
        try:
            if lock.exists() and time.time()-lock.stat().st_mtime>600:lock.unlink();trace("removed stale diagnostics git lock")
        except OSError:pass
        subprocess.run(["git","-C",str(repo),"add","live/sot-release-d-events.jsonl"],check=True,timeout=30)
        staged=subprocess.run(["git","-C",str(repo),"diff","--cached","--quiet"],timeout=30).returncode!=0
        if staged:
            stamp=time.strftime("%Y-%m-%d %H:%M:%S UTC",time.gmtime())
            subprocess.run(["git","-C",str(repo),"commit","-m","SOT live diagnostic log "+stamp],check=True,timeout=60)
            subprocess.run(["git","-C",str(repo),"push","origin","HEAD"],check=True,timeout=120)
        status.update({"configured":True,"published":bool(staged),"last_publish":time.time(),"last_error":None});return dict(status)

    def log_publisher_loop():
        time.sleep(20)
        while True:
            try:publish_live_log()
            except Exception as e:srv._log_publish_status.update({"last_publish":time.time(),"last_error":str(e),"published":False})
            time.sleep(LOG_PUBLISH_INTERVAL)

    def queue_sync(source_ids,reason):
        ids=list(dict.fromkeys(source_ids or []))
        if not ids:return {"created":False,"queued_source_count":0,"suppressed_source_count":0}
        trace("queue scan ("+str(reason)+"): "+",".join(ids))
        info=srv.M.enqueue_info(ids,title="Automatic SSOT sync")
        srv.M.event("source_auto_sync","SSOT synchronization queued automatically",info.get("job_id"),None,"INFO",{"reason":reason,"source_ids":ids,"queued_source_count":info.get("queued_source_count",0),"suppressed_source_count":info.get("suppressed_source_count",0)})
        return info

    def recover_interrupted():
        cutoff=float(getattr(srv,"_autosync_runtime_loaded_at",time.time()))-1.0
        rows=srv.M.s.rows("""SELECT job_id FROM jobs
                            WHERE deleted=0 AND job_type='analysis' AND state='INTERRUPTED'
                              AND ended>=?
                            ORDER BY created,job_id""",(cutoff,))
        recovered=[]
        for row in rows:
            jid=row["job_id"]
            try:
                info=srv.M.restart_info(jid)
                srv.M.event("job_auto_recovery","Interrupted SSOT work recovered automatically",info.get("job_id") or jid,None,"INFO",{"interrupted_job_id":jid,"recovery_job_id":info.get("job_id"),"created":bool(info.get("created")),"queued_source_count":info.get("queued_source_count",0),"suppressed_source_count":info.get("suppressed_source_count",0),"covering_job_ids":info.get("covering_job_ids",[])})
                recovered.append({"interrupted_job_id":jid,**info})
            except Exception as e:srv.M.event("job_auto_recovery_failed",str(e),jid,None,"ERROR",{"interrupted_job_id":jid})
        return recovered

    def recover_pending_sources():
        rows=srv.M.s.rows("""SELECT DISTINCT s.source_id
                            FROM sources s
                            LEFT JOIN placements p
                              ON p.source_id=s.source_id AND p.placement_state='ACTIVE'
                            WHERE s.enabled=1
                              AND (s.stale=1
                                   OR (p.lifecycle IN ('NONE','IN_PROCESS') AND COALESCE(p.availability,'')!='ERROR')
                                   OR p.availability='PENDING'
                                   OR NOT EXISTS (SELECT 1 FROM job_sources js JOIN jobs j ON j.job_id=js.job_id
                                                  WHERE js.source_id=s.source_id AND js.state='COMPLETED' AND j.state='COMPLETED'))
                            ORDER BY s.source_id""")
        ids=[r["source_id"] for r in rows]
        return queue_sync(ids,"startup_pending_recovery") if ids else {"created":False,"queued_source_count":0,"suppressed_source_count":0}

    def check_source_ids(source_ids,reason):
        result=original_check(source_ids,reason);changed=result.get("changed") or []
        if changed and not getattr(srv,"SAFE_MODE",False):result["auto_sync"]=queue_sync(changed,reason)
        return result

    def add_source(label,root,failure_domain,role="primary",estate=None):
        sid=original_add(label,root,failure_domain,role,estate);queue_sync([sid],"registration");return sid

    srv.H.do_GET=do_GET;srv.H.do_POST=do_POST;srv.check_source_ids=check_source_ids;srv.M.add_source=add_source
    srv.queue_ssot_sync=queue_sync;srv.recover_interrupted_ssot=recover_interrupted;srv.recover_pending_ssot=recover_pending_sources
    srv.publish_live_diagnostic_log=publish_live_log;srv.log_publisher_loop=log_publisher_loop
    srv.trace=trace
    if SAFE_START:
        # the previous start never settled: stay up, do no automatic work, leave everything for the owner to start
        srv.SAFE_MODE=True;trace("SAFE MODE: previous start did not finish; automatic startup work skipped")
        try:srv.M.event("startup_safe_mode","Safe mode: the previous start did not finish, so no automatic scans were started",None,None,"WARNING",{})
        except Exception:pass
        return srv
    srv.SAFE_MODE=False;trace("start: recovering interrupted work")
    srv.recover_interrupted_ssot();trace("start: queuing pending sources")
    srv.recover_pending_ssot();trace("start: recovery queued");return srv

def load_runtime():
    here=Path(__file__).resolve().parent
    sp=importlib.util.spec_from_file_location("sotreleased_runtime",here/"sot-turn02-release-d-server.py")
    loaded_at=time.time();srv=importlib.util.module_from_spec(sp);sys.modules[sp.name]=srv;sp.loader.exec_module(srv);srv._autosync_runtime_loaded_at=loaded_at
    return install(srv)

def settle_watch(srv,started):
    # the start counts as settled once it has run a while and no work is live; only then is the safe-mode mark cleared
    while True:
        time.sleep(10)
        try:
            live=srv.M.s.rows("SELECT COUNT(*) n FROM jobs WHERE state IN ('QUEUED','RUNNING','PAUSED','STOPPING')")[0]["n"]
            if time.time()-started>=STABLE_AFTER and not live:
                STARTUP_MARK.unlink(missing_ok=True);trace("start settled");return
        except Exception as e:trace("settle check error: "+str(e))

def traced_startup(srv):
    trace("start: source freshness check")
    try:srv.startup_source_check()
    except Exception as e:trace("start: source freshness check failed: "+str(e));raise
    trace("start: source freshness check done")

def main():
    trace("service starting pid "+str(os.getpid()))
    import signal
    def clean_stop(*_):
        # an orderly stop is not a failed start; only a crash leaves the safe-mode mark behind
        if not getattr(sys.modules.get("sotreleased_runtime"),"SAFE_MODE",True):STARTUP_MARK.unlink(missing_ok=True)
        trace("service stopped cleanly");os._exit(0)
    signal.signal(signal.SIGTERM,clean_stop)
    global SAFE_START
    SAFE_START=STARTUP_MARK.exists()
    if not SAFE_START:mark_startup()
    srv=load_runtime();started=time.time()
    if not srv.SAFE_MODE:
        threading.Thread(target=traced_startup,args=(srv,),daemon=True,name="source-freshness-startup").start()
        threading.Thread(target=settle_watch,args=(srv,started),daemon=True,name="startup-settle").start()
    threading.Thread(target=srv.log_publisher_loop,daemon=True,name="diagnostic-log-publisher").start()
    ThreadingHTTPServer(("0.0.0.0",int(os.environ.get("SOT_PORT","8765"))),srv.H).serve_forever()

if __name__=="__main__":main()
