from pathlib import Path

runtime=Path('SOT/sot-turn02-release-d-autosync.py')
ui=Path('SOT/sot-turn02-release-d-complete.html')
plan=Path('SOT/SOT-TURN02-RELEASE-D-AUTOSYNC-PLAN.md')
grave=Path('SOT/SOT-TURN02-RELEASE-D-AUTOSYNC-GRAVEYARD.md')

s=runtime.read_text()
needle='''    def clear_log(handler):\n        path=srv.M.s.log_path\n'''
assert needle in s
insert='''    def refresh_staleness(handler):\n        rows=srv.M.s.rows("SELECT source_id FROM sources WHERE enabled=1 ORDER BY source_id")\n        ids=[r["source_id"] for r in rows]\n        result=srv.check_source_ids(ids,"database_refresh") if ids else {"checked":[],"changed":[],"errors":[]}\n        return handler.sendj({"ok":True,"checked":result.get("checked",ids),"changed":result.get("changed",[]),"errors":result.get("errors",[]),"auto_sync":result.get("auto_sync")})\n\n'''
s=s.replace(needle,insert+needle,1)
needle='''        if path=="/api/diagnostics/log/clear":\n            try:return clear_log(handler)\n            except Exception as e:return handler.sendj({"ok":False,"error":str(e)},500)\n'''
assert needle in s
replacement='''        if path=="/api/ssot/refresh-staleness":\n            try:return refresh_staleness(handler)\n            except Exception as e:return handler.sendj({"ok":False,"error":str(e)},500)\n'''+needle
s=s.replace(needle,replacement,1)
runtime.write_text(s)

s=ui.read_text()
needle="w.loadPlacements=async function(force=false){if(w.__ssotPlacementBusy){if(force)w.__ssotPlacementPending=true;return}let current=Number(w.eval('placements.length'))||0;if(!force&&current)return;w.__ssotPlacementBusy=true;w.__ssotSetRefreshBlocker(true);try{"
assert s.count(needle)==1
replacement=needle+"if(force){let freshness=await w.req('/api/ssot/refresh-staleness',{method:'POST',body:'{}'},120000);if(freshness.errors?.length)w.toast('Freshness check completed with '+freshness.errors.length+' source error(s)',3500);}"
s=s.replace(needle,replacement,1)
ui.write_text(s)

section='''\n\n## 2026-10-01 — Database Refresh is a staleness checkpoint\n\n**Owner decision:** Database Refresh must check registered sources for staleness rather than merely reload SQLite rows.\n\n### Definition of working\n1. A forced Database Refresh checks every enabled registered source using the existing governed source-freshness mechanism.\n2. Any changed/stale source is automatically sent through the existing deduplicated SSOT synchronization path; registration remains the standing permission and no Restart/approval is introduced.\n3. The placement/database refresh then loads the complete authoritative estate snapshot using the existing immutable paging path.\n4. Current sources remain Current; stale sources transition through Syncing; genuine failures remain Problem.\n5. Normal background placement refreshes do not perform an extra owner-requested staleness scan; the explicit/forced DB refresh is the checkpoint.\n6. No rehash policy, classification rules, schema, report mathematics, source identity, AI behavior, or owner navigation changes.\n\n### Release gates\n- POST `/api/ssot/refresh-staleness` checks all enabled source IDs.\n- Changed IDs invoke existing `check_source_ids` → `queue_sync` behavior and therefore existing live-work dedupe.\n- Forced `loadPlacements(true)` calls the staleness endpoint before paging placements.\n- Non-forced placement loading does not call the endpoint.\n- Existing Continuous SSOT qualification remains PASS.\n- JavaScript parses under Node 22 and Python compiles.\n'''
if '## 2026-10-01 — Database Refresh is a staleness checkpoint' not in plan.read_text():plan.write_text(plan.read_text()+section)

g='''\n\n## 2026-10-01 — Blind Database Refresh — REJECTED\nRejected behavior: treating Database Refresh as only a browser/SQLite placement reload. A user-requested DB refresh must first check enabled registered sources for filesystem staleness and automatically reconcile changed sources through the governed deduplicated SSOT path. Do not reintroduce a refresh control that can report a fresh database view without performing that source-freshness checkpoint.\n'''
if '## 2026-10-01 — Blind Database Refresh — REJECTED' not in grave.read_text():grave.write_text(grave.read_text()+g)
print('PASS applied DB-refresh staleness checkpoint')
