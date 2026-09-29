#!/usr/bin/env python3
import importlib.util,os,sys,threading
from http.server import ThreadingHTTPServer
from pathlib import Path

def install(srv):
    original_check=srv.check_source_ids
    original_add=srv.M.add_source

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

    def check_source_ids(source_ids,reason):
        result=original_check(source_ids,reason)
        changed=result.get("changed") or []
        if changed:result["auto_sync"]=queue_sync(changed,reason)
        return result

    def add_source(label,root,failure_domain,role="primary",estate=None):
        sid=original_add(label,root,failure_domain,role,estate)
        queue_sync([sid],"registration")
        return sid

    srv.check_source_ids=check_source_ids
    srv.M.add_source=add_source
    srv.queue_ssot_sync=queue_sync
    return srv

def load_runtime():
    here=Path(__file__).resolve().parent
    sp=importlib.util.spec_from_file_location("sotreleased_runtime",here/"sot-turn02-release-d-server.py")
    srv=importlib.util.module_from_spec(sp);sys.modules[sp.name]=srv;sp.loader.exec_module(srv)
    return install(srv)

def main():
    srv=load_runtime()
    threading.Thread(target=srv.startup_source_check,daemon=True,name="source-freshness-startup").start()
    ThreadingHTTPServer(("0.0.0.0",int(os.environ.get("SOT_PORT","8765"))),srv.H).serve_forever()

if __name__=="__main__":main()
