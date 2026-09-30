#!/usr/bin/env python3
import importlib.util,os,sys,threading,time
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs,urlparse

LIVE_STATES=("QUEUED","RUNNING","PAUSED","STOPPING")
PLACEMENT_PAGE_SIZE=5000
PLACEMENT_PAGE_MAX=10000

def install(srv):
    original_check=srv.check_source_ids
    original_add=srv.M.add_source
    original_get=srv.H.do_GET

    def placement_page(handler):
        u=urlparse(handler.path);q=parse_qs(u.query)
        try:after=max(0,int(q.get("after",["0"])[0] or 0))
        except Exception:after=0
        try:limit=max(1,min(PLACEMENT_PAGE_MAX,int(q.get("limit",[str(PLACEMENT_PAGE_SIZE)])[0] or PLACEMENT_PAGE_SIZE)))
        except Exception:limit=PLACEMENT_PAGE_SIZE
        rows=srv.M.s.rows("SELECT * FROM placements WHERE placement_state='ACTIVE' AND placement_no>? ORDER BY placement_no LIMIT ?",(after,limit+1))
        has_more=len(rows)>limit
        page=rows[:limit]
        total=srv.M.s.rows("SELECT COUNT(*) n FROM placements WHERE placement_state='ACTIVE'")[0]["n"]
        next_after=int(page[-1]["placement_no"]) if page else after
        return handler.sendj({
            "ok":True,
            "catalog_revision":srv.M.s.catalog_revision(),
            "total":int(total or 0),
            "page_size":len(page),
            "has_more":has_more,
            "next_after":next_after,
            "placements":page,
        })

    def do_GET(handler):
        if urlparse(handler.path).path=="/api/placements/page":
            try:return placement_page(handler)
            except Exception as e:return handler.sendj({"ok":False,"error":str(e)},500)
        return original_get(handler)

    def queue_sync(source_ids,reason):
        ids=list(dict.fromkeys(source_ids or []))
        if not ids:return {"created":False,"queued_source_count":0,"suppressed_source_count":0}
        info=srv.M.enqueue_info(ids,title="Automatic SSOT sync")
        srv.M.event("source_auto_sync","SSOT synchronization queued automatically",info.get("job_id"),None,"INFO",{
            "reason":reason,
            "source_ids":ids,
            "queued_source_count":info.get("queued_source_count",0),
            "suppressed_source_count":info.get("suppressed_source_count",0),
        })
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
                srv.M.event("job_auto_recovery","Interrupted SSOT work recovered automatically",
                            info.get("job_id") or jid,None,"INFO",{
                                "interrupted_job_id":jid,
                                "recovery_job_id":info.get("job_id"),
                                "created":bool(info.get("created")),
                                "queued_source_count":info.get("queued_source_count",0),
                                "suppressed_source_count":info.get("suppressed_source_count",0),
                                "covering_job_ids":info.get("covering_job_ids",[]),
                            })
                recovered.append({"interrupted_job_id":jid,**info})
            except Exception as e:
                srv.M.event("job_auto_recovery_failed",str(e),jid,None,"ERROR",{
                    "interrupted_job_id":jid,
                })
        return recovered

    def recover_pending_sources():
        rows=srv.M.s.rows("""SELECT DISTINCT s.source_id
                            FROM sources s
                            LEFT JOIN placements p
                              ON p.source_id=s.source_id AND p.placement_state='ACTIVE'
                            WHERE s.enabled=1
                              AND (s.stale=1 OR p.lifecycle IN ('NONE','IN_PROCESS') OR p.availability='PENDING')
                            ORDER BY s.source_id""")
        ids=[r["source_id"] for r in rows]
        return queue_sync(ids,"startup_pending_recovery") if ids else {"created":False,"queued_source_count":0,"suppressed_source_count":0}

    def check_source_ids(source_ids,reason):
        result=original_check(source_ids,reason)
        changed=result.get("changed") or []
        if changed:result["auto_sync"]=queue_sync(changed,reason)
        return result

    def add_source(label,root,failure_domain,role="primary",estate=None):
        sid=original_add(label,root,failure_domain,role,estate)
        queue_sync([sid],"registration")
        return sid

    srv.H.do_GET=do_GET
    srv.check_source_ids=check_source_ids
    srv.M.add_source=add_source
    srv.queue_ssot_sync=queue_sync
    srv.recover_interrupted_ssot=recover_interrupted
    srv.recover_pending_ssot=recover_pending_sources
    srv.recover_interrupted_ssot()
    srv.recover_pending_ssot()
    return srv

def load_runtime():
    here=Path(__file__).resolve().parent
    sp=importlib.util.spec_from_file_location("sotreleased_runtime",here/"sot-turn02-release-d-server.py")
    loaded_at=time.time()
    srv=importlib.util.module_from_spec(sp);sys.modules[sp.name]=srv;sp.loader.exec_module(srv)
    srv._autosync_runtime_loaded_at=loaded_at
    return install(srv)

def main():
    srv=load_runtime()
    threading.Thread(target=srv.startup_source_check,daemon=True,name="source-freshness-startup").start()
    ThreadingHTTPServer(("0.0.0.0",int(os.environ.get("SOT_PORT","8765"))),srv.H).serve_forever()

if __name__=="__main__":main()
